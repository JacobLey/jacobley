import { readFile } from 'node:fs/promises';
import Path from 'node:path';
import { calculateDependencyOrder, dependencyOrderByStage, type PackageDependency } from 'dependency-order';
import Yaml from 'yaml';

const rivendellRegExp = /\$\{\{\{\s*rivendell\.(?<command>\w+[^}]+)\s*\}\}\}/u;

const parseRivendellExpression = (
    text: string,
    kind: 'packages' | 'stage'
): {
    all: boolean;
    max: boolean;
    series: boolean;
    include: (dependency: PackageDependency) => boolean;
} | null => {

    const match = rivendellRegExp.exec(text);

    if (!match) {
        return null;
    }

    const command = match.groups!.command!.trim();

    const [keyword, filter] = command.split('?') as [string, string | undefined];

    const searchParams = new URLSearchParams(filter);
    const searchParamEntries = [...searchParams.entries()];
    const include: (
        dependency: PackageDependency
    ) => boolean = dependency => searchParamEntries.every(([key, val]) => {
        if (key === 'parallel') {
            return true;
        }
        if (key === 'private') {
            return (dependency.packageMeta.packageJson.private ?? false) === (val === 'true');
        }
        return false;
    });

    if (kind === 'stage') {
        if (['max-stage', 'stage'].includes(keyword)) {
            return {
                all: false,
                max: keyword.startsWith('max'),
                series: searchParams.get('parallel') !== 'true',
                include,
            };
        }
    } else if (['all-packages', 'stage-packages'].includes(keyword)) {
        return {
            all: keyword.startsWith('all'),
            max: false,
            series: true,
            include,
        };
    }
    return null;
};

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
    dependencies: PackageDependency[];
    root: string;
    stage: {
        stage: number;
        title: string;
    } | null;
}): void => {

    let needs = job.getIn(['needs'], true);
    const matchedTitle = stage && parseRivendellExpression(stage.title, 'stage');
    if (
        Yaml.isScalar<string>(needs) && (
            stage?.stage && matchedTitle?.series
        )
    ) {
        const seq = new Yaml.YAMLSeq();
        seq.add(needs);
        job.set('needs', seq);
        needs = seq;
    } else if (!needs && matchedTitle?.series) {
        needs = new Yaml.YAMLSeq();
        job.set('needs', needs);
    }

    if (Yaml.isSeq<Yaml.Scalar<string>>(needs)) {
        for (const need of needs.items) {
            const stageMatch = parseRivendellExpression(need.value, 'stage');
            if (stageMatch) {
                if (stageMatch.max) {
                    const filteredDependencies = calculateDependencyOrder(
                        dependencies.filter(dep => stageMatch.include(dep)).map(dep => dep.packageMeta)
                    );
                    const maxStage = Math.max(...filteredDependencies.map(dep => dep.stage));
                    if (!stageMatch.series) {
                        for (let i = 0; i < maxStage; ++i) {
                            needs.add(new Yaml.Scalar(
                                need.value.replace(
                                    rivendellRegExp,
                                    i.toString(10)
                                )
                            ));
                        }
                    }
                    need.value = need.value.replace(
                        rivendellRegExp,
                        maxStage.toString(10)
                    );
                } else {
                    need.value = need.value.replace(
                        rivendellRegExp,
                        stage!.stage.toString(10)
                    );
                }
            }
        }
        if (stage?.stage && matchedTitle?.series) {
            needs.add(new Yaml.Scalar(
                stage.title.replace(
                    rivendellRegExp,
                    (stage.stage - 1).toString(10)
                )
            ));
        }
    }

    const matrix = job.getIn(['strategy', 'matrix']);
    if (Yaml.isMap<Yaml.Scalar<string>>(matrix)) {

        for (const pair of matrix.items) {
            if (Yaml.isScalar<string>(pair.value)) {
                const matrixMatch = parseRivendellExpression(pair.value.value, 'packages');
                if (matrixMatch) {
                    const seq = new Yaml.YAMLSeq();
                    const filteredDependencies = dependencies.filter(dep => matrixMatch.include(dep));
                    if (matrixMatch.all) {
                        for (const dependency of filteredDependencies) {
                            seq.add(dependencyToMap(dependency, root));
                        }
                    } else {
                        for (const dependency of dependencyOrderByStage(filteredDependencies)[stage!.stage]!) {
                            seq.add(dependencyToMap(dependency, root));
                        }
                    }
                    pair.value = seq;
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
    dependencies: PackageDependency[];
    root: string;
}): void => {

    const stageSplit = parseRivendellExpression(key.value, 'stage');
    const isStageSplit = stageSplit !== null;

    const job = jobs.getIn([key.value], !isStageSplit) as Yaml.YAMLMap;

    if (isStageSplit) {
        jobs.delete(key.value);

        const filteredDependencies = dependencyOrderByStage(
            calculateDependencyOrder(
                dependencies.filter(dep => stageSplit.include(dep)).map(dep => dep.packageMeta)
            )
        );
        for (let stage = 0; stage < filteredDependencies.length; ++stage) {
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
                key.value.replace(rivendellRegExp, stage.toString(10)),
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

const processDocument = ({ document, ...params }: {
    dependencies: PackageDependency[];
    document: Yaml.Document.Parsed;
    kind: 'circleci' | 'github';
    root: string;
}): void => {

    const jobs = document.get('jobs', true) as Yaml.YAMLMap;

    for (const key of jobs.items.map(i => i.key)) {
        processJobTemplate({
            jobs,
            key: key as Yaml.Scalar<string>,
            ...params,
        });
    }
};

export const processFile = async ({ path, dependencies, kind, root }: {
    kind: 'circleci' | 'github';
    path: string;
    dependencies: PackageDependency[];
    root: string;
}): Promise<string> => {

    const rawYaml = await readFile(path, 'utf8');

    return Yaml.parseAllDocuments(rawYaml).map(document => {

        processDocument({
            document,
            kind,
            dependencies,
            root,
        });

        return document.toString({
            lineWidth: 0,
        }).replaceAll(/^\s+$/gmu, '');
    }).join('\n---\n');
};
