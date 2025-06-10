export const isObject = (item: unknown): item is object =>
    !isNil(item) && typeof item === 'object' && !Array.isArray(item)
  export const isNonEmptyObject = (item: unknown): item is object =>
    isObject(item) && Object.entries(item).some(Boolean)
  export const isNull = (value: unknown): value is null => value === null
  export const isUndefined = (value: unknown): value is undefined =>
    value === undefined
  export const isNil = (value: unknown): value is null | undefined =>
    isNull(value) || isUndefined(value)
  export const isString = (value: unknown): value is string =>
    typeof value === 'string'
  export const isEmptyString = (value: unknown): value is string =>
    isString(value) && value.trim().length === 0
  export const isNonEmptyString = (value: unknown): value is string =>
    isString(value) && value.trim().length > 0
  export const isNumber = (value: unknown): value is number =>
    typeof value === 'number'
  export const isBoolean = (value: unknown): value is boolean =>
    typeof value === 'boolean'
  export const isEmptyArray = (value: unknown): value is [] =>
    Array.isArray(value) && value.length === 0
  export const isNonEmptyArray = (value: unknown): value is unknown[] =>
    Array.isArray(value) && value.length > 0
  export const isArrayWithLessThanNValues =
    (n: number) =>
    (value: unknown): value is unknown[] =>
      Array.isArray(value) && value.length < n
  