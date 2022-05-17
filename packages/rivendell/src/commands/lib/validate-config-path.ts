export const validateConfigFile = (configFile: string | undefined): configFile is string => {
    if (configFile) {
        if (/\.(?:json|[cm]?js)$/u.test(configFile)) {
            return true;
        }
        throw new Error(`Unsupported file type: ${configFile}`);
    }
    return false;
};
