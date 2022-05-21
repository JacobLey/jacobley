/**
 * "Reasonable" shorthand for largest possible integer.
 *
 * Actual value = 1.7976931348623157e+308 but that is unnecessarily long serialization
 * for values that _shouldn't_ reasonably achieve that value (e.g. string length).
 */
export const maxInt = 1e308;
