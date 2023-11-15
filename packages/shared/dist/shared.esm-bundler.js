const isObject = (value) => typeof value === "object" && value !== null;
const extend = Object.assign;
const isArray = Array.isArray;
const isFunction = (value) => typeof value === "function";
const isString = (value) => typeof value === "string";
const isNumber = (value) => typeof value === "number";
const isIntergerKey = (key) => parseInt(key) + "" === key;
let hasOwnpRroperty = Object.prototype.hasOwnProperty;
const hasOwn = (target, key) => hasOwnpRroperty.call(target, key);
const hasChanged = (oldValue, value) => oldValue !== value;

export { extend, hasChanged, hasOwn, isArray, isFunction, isIntergerKey, isNumber, isObject, isString };
//# sourceMappingURL=shared.esm-bundler.js.map
