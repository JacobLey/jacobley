/**
 * With ESM it is possible to export both a default value and multiple named exports.
 * With CJS it is possible to "mock" ESM functionality with a `__esModule=true` flag
 * but still only export a single "default" export, or multiple named exports.
 *
 * This helper method detects when a library tries to do a "default" export with other named values
 * and returns the "intended" default value.
 *
 * It also handles CJS exports that export an entire object via `module.exports = {}` rather than export syntax,
 * as well as extracting the `default` (if exists) from a dynamic import.
 *
 * Note there is not "namedExport" equivalent because it is assumed module loaders successfully parse that
 * out for both CJS and ESM.
 *
 * @param {*} mod - "default" export that might be wrapped in another layer
 * @returns {*} unwrapped module
 */
export const defaultImport = <T>(
    mod: T |
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { __esModule?: boolean; default: T } |
        // Webpack provides a Module tag to match NodeJS' Module module
        { [Symbol.toStringTag]: 'Module'; default: T }
): T => {
    if (typeof mod !== 'object' || mod === null) {
        return mod;
    }

    const defaultVal = Symbol.toStringTag in mod &&
        (mod as { [Symbol.toStringTag]: string; default: T })[Symbol.toStringTag] === 'Module' ?
        (mod as { [Symbol.toStringTag]: 'Module'; default?: T }).default ?? mod :
        mod;

    if (
        '__esModule' in defaultVal &&
        defaultVal.__esModule &&
        defaultVal.default !== undefined
    ) {
        return defaultVal.default;
    }
    return defaultVal as T;
};
