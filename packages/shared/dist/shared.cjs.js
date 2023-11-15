'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

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

exports.extend = extend;
exports.hasChanged = hasChanged;
exports.hasOwn = hasOwn;
exports.isArray = isArray;
exports.isFunction = isFunction;
exports.isIntergerKey = isIntergerKey;
exports.isNumber = isNumber;
exports.isObject = isObject;
exports.isString = isString;
//# sourceMappingURL=shared.cjs.js.map
