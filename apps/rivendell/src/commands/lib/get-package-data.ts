export const getPackageData = <T extends Record<string, unknown>>(
    packageName: string,
    data: T
): T[string] => {

    const val = data[packageName];

    if (val) {
        return val as T[string];
    }

    throw new Error(`No package found: ${packageName}`);
};
