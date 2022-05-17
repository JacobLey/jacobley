import { readFile } from 'node:fs/promises';
import Path from 'node:path';
import type { PackageDependency } from 'dependency-order';
import Yaml from 'yaml';

const stageRegExp = /\$\{\{\{\s*rivendell\.(?<max>max-)?stage\s*\}\}\}/u;
const matrixRegExp = /\$\{\{\{\s*rivendell\.(?<kind>all|stage)-packages\s*\}\}\}/u;

const dependencyToMap = (
    dependency: PackageDependency,
    root: string
): Yaml.YAMLMap => {
    const map = new Yaml.YAMLMap();

    map.set('name', new Yaml.Scalar(dependency.packageName));
    map.set('safe-name', new Yaml.Scalar(encodeURIComponent(dependency.packageName)));
    map.set('path', new Yaml.Scalar(Path.relative(root, dependency.packageMeta.directory)));

    return map;
};

const processJob = ({
    job,
    dependencies,
    root,
    stage,
}: {
    job: Yaml.YAMLMap;
    dependencies: PackageDependency[][];
    root: string;
    stage: {
        stage: number;
        title: string;
    } | null;
}): void => {

    let needs = job.getIn(['needs'], true);
    if (
        Yaml.isScalar<string>(needs) && (
            stage?.stage || stageRegExp.test(needs.value)
        )
    ) {
        const seq = new Yaml.YAMLSeq();
        seq.add(needs);
        job.set('needs', seq);
        needs = seq;
    } else if (!needs && stage?.stage) {
        needs = new Yaml.YAMLSeq();
        job.set('needs', needs);
    }

    if (Yaml.isSeq<Yaml.Scalar<string>>(needs)) {
        for (const need of needs.items) {
            const stageMatch = stageRegExp.exec(need.value);
            if (stageMatch) {
                need.value = need.value.replace(
                    stageRegExp,
                    (stageMatch.groups!.max ? dependencies.length - 1 : stage!.stage).toString(10)
                );
            }
        }
        if (stage?.stage) {
            needs.add(new Yaml.Scalar(
                stage.title.replace(
                    stageRegExp,
                    (stage.stage - 1).toString(10)
                )
            ));
        }
    }

    const matrix = job.getIn(['strategy', 'matrix']);
    if (Yaml.isMap<Yaml.Scalar<string>>(matrix)) {

        for (const pair of matrix.items) {
            if (Yaml.isScalar<string>(pair.value)) {
                const matrixMatch = matrixRegExp.exec(pair.value.value);
                if (matrixMatch) {
                    if (matrixMatch.groups!.kind === 'all') {
                        const seq = new Yaml.YAMLSeq();
                        for (const dependency of dependencies.flat()) {
                            seq.add(dependencyToMap(dependency, root));
                        }
                        pair.value = seq;
                    } else {
                        const seq = new Yaml.YAMLSeq();
                        for (const dependency of dependencies[stage!.stage]!) {
                            seq.add(dependencyToMap(dependency, root));
                        }
                        pair.value = seq;
                    }
                }
            }
        }
    }
};

const processJobTemplate = ({
    jobs,
    key,
    dependencies,
    root,
}: {
    jobs: Yaml.YAMLMap;
    key: Yaml.Scalar<string>;
    dependencies: PackageDependency[][];
    root: string;
}): void => {

    const stageSplit = stageRegExp.exec(key.value);
    const isStageSplit = stageSplit !== null;

    const job = jobs.getIn([key.value], !isStageSplit) as Yaml.YAMLMap;

    if (isStageSplit) {
        jobs.delete(key.value);

        for (let stage = 0; stage < dependencies.length; ++stage) {
            const clone = job.clone() as Yaml.YAMLMap;
            processJob({
                job: clone,
                dependencies,
                root,
                stage: {
                    stage,
                    title: key.value,
                },
            });
            jobs.set(
                key.value.replace(stageSplit[0]!, stage.toString(10)),
                clone
            );
        }
    } else {
        processJob({
            job,
            dependencies,
            root,
            stage: null,
        });
    }
};

export const processFile = async ({ path, dependencies, root }: {
    path: string;
    dependencies: PackageDependency[][];
    root: string;
}): Promise<string> => {

    const rawYaml = await readFile(path, 'utf8');

    return Yaml.parseAllDocuments(rawYaml).map(document => {

        const jobs = document.get('jobs', true) as Yaml.YAMLMap;

        for (const key of jobs.items.map(i => i.key)) {
            processJobTemplate({
                jobs,
                key: key as Yaml.Scalar<string>,
                dependencies,
                root,
            });
        }

        return document.toString();
    }).join('\n---\n');
};
