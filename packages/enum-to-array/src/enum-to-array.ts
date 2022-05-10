type Values<T> = T[Extract<keyof T, string>];

type IfEmpty<Enum extends Record<string, unknown>, Else> = Record<never, string> extends Enum
    ? []
    : Else;

/**
 * List key-value pairs of enum, in order that they occur.
 *
 * @example
 * enum MyEnum {
 *    FOO = 'BAR',
 *    ABC = 123,
 * }
 * console.log(enumToArray(MyEnum));
 * // [{ key: 'FOO', value: 'BAR' }, { key: 'ABC', value: 123 }]
 *
 * @param {object} enumDict - enum variable
 * @returns {object[]} list of key+value
 */
export const enumToArray = <Enum extends Record<string, unknown>>(
    enumDict: Enum
): IfEmpty<
    Enum,
    Values<{
        [key in keyof Enum]: { key: key; value: Enum[key] };
    }>[]
> => {
    const knownValues: {
        value: unknown;
        key: string;
    }[] = [];

    for (const [key, value] of Object.entries(enumDict)) {
        if (typeof value === 'string') {
            if (value in enumDict) {
                if (typeof enumDict[value] === 'string') {
                    knownValues.push({ key, value });
                }
            } else {
                // Value never appears as a key, has to be a value
                knownValues.push({ key, value });
            }
        } else {
            // All non-strings must be values
            knownValues.push({ key, value });
        }
    }

    return knownValues as IfEmpty<
        Enum,
        Values<{
            [key in keyof Enum]: { key: key; value: Enum[key] };
        }>[]
    >;
};

/**
 * List only values of enum, in order that they are provided.
 * Light wrapper around `enumToArray`.
 *
 * Optionally return unique list of values by passing `{ unique: true }`
 * as second parameter.
 * Unique sets will be "in order" with exception of duplicate values are omitted.
 *
 * @example
 * enum MyEnum {
 *    FOO = 'BAR',
 *    ABC = 123,
 *    DUP = FOO,
 * }
 * console.log(enumToValues(MyEnum));
 * // ['BAR', 123, 'BAR']
 * console.log(enumToValues(MyEnum), { unique: true });
 * // ['BAR', 123]
 *
 * @param {object} enumDict - enum variable
 * @param {object} [options] - options
 * @param {boolean} [options.unique=false] - unique values
 * @returns {(string|number)[]} list of enum values
 */
export const enumToValues = <Enum extends Record<string, unknown>>(
    enumDict: Enum,
    {
        unique,
    }: {
        unique?: boolean;
    } = {}
): IfEmpty<Enum, Values<Enum>[]> => {
    const arr = enumToArray(enumDict).map(v => v.value);

    return (unique ? [...new Set(arr)] : arr) as IfEmpty<Enum, Values<Enum>[]>;
};

/**
 * List only keys of enum, in order that they are provided.
 * Light wrapper around `enumToArray`.
 *
 * @example
 * enum MyEnum {
 *    FOO = 'BAR',
 *    ABC = 123,
 * }
 * console.log(enumToKeys(MyEnum));
 * // ['FOO', 'ABC']
 *
 * @param {object} enumDict - enum variable
 * @returns {string[]} list of enum keys
 */
export const enumToKeys = <Enum extends Record<string, unknown>>(
    enumDict: Enum
): IfEmpty<Enum, (keyof Enum)[]> => enumToArray(enumDict).map(v => v.key) as IfEmpty<Enum, (keyof Enum)[]>;
