// 实现 new Proxy （target，handler）
// 是不是仅读的，仅读的属性set会报异常

import { extend, hasChanged, hasOwn, isArray, isIntergerKey, isObject } from "@vue/shared";
import { reactive, readonly } from "./reactive";
import { TrackOpTypes, TriggerOrTypes } from "./operators";
import { track, trigger } from "./effect";
const get = createGetter();
const set = createSetter();

const shallowGet = createGetter(false, true);
const shallowSet = createSetter(true);

const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);

export const mutableHandlers = {
  get,
  set,
};

export const shallowReactiveHandlers = {
  get: shallowGet,
  set: shallowSet,
};

let readonlyObj = {
  set: (target, key) => {
    console.warn(`set on key ${key} failed`);
  },
};

export const readonlyHandlers = extend(
  {
    get: readonlyGet,
  },
  readonlyObj
);

export const shallowReadonlyHandlers = extend(
  {
    get: shallowReadonlyGet,
  },
  readonlyObj
);

// 是不是仅读的 是不是仅读的属性 set 时会报异常
// 是不是深度的
// 拦截获取
function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
    // 后续Object上的方法 会被迁移到Reflect Reflect.getProptypeof
    // 以前target[key] =value 方式设置值可能失败，并不会报异常，也没有返回的标识
    // Reflect 方法具备返回值
    const res = Reflect.get(target, key, receiver);
    if (!isReadonly) {
      // 收集依赖，数据变化后更新对应的视图
      console.log("执行effect时会取值", "收集effect");
      console.log(key, "key");
      track(target, TrackOpTypes.GET, key);
    }
    if (shallow) {
      return res;
    }
    if (isObject(res)) {
      // vue2 是一上来就递归 vue3是当取值时会进行代理，vue3的代理模式是懒代理
      return isReadonly ? readonly(res) : reactive(res);
    }
    return res;
  };
}
function createSetter(shallow = false) {
  return function set(target, key, value, receiver) {
    const oldValue = target[key];
    let hadKey = isArray(target) && isIntergerKey(key) ? Number(key) < target.length : hasOwn(target, key);
    const result = Reflect.set(target, key, value, receiver);
    if (!hadKey) {
      trigger(target, TriggerOrTypes.ADD, key, value);
    } else if (hasChanged(oldValue, value)) {
      trigger(target, TriggerOrTypes.SET, key, value, oldValue);
    }
    // 区分新增和修改 vue2无法监控更改索引，无法监控数组的长度
    // 当数据更新是 通知对应的属性effect重新执行
  };
}
