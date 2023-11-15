import { isObject } from "@vue/shared";
import { mutableHandlers, shallowReactiveHandlers, readonlyHandlers, shallowReadonlyHandlers } from "./baseHandlers";

export function reactive(target) {
  return createReactiveObject(target, false, mutableHandlers);
}

export function shallowReactive(target) {
  return createReactiveObject(target, false, shallowReactiveHandlers);
}

export function readonly(target) {
  return createReactiveObject(target, true, readonlyHandlers);
}

export function shallowReadonly(target) {
  return createReactiveObject(target, true, shallowReadonlyHandlers);
}

// 是不是仅读，是不是深度，是不是柯里化 new Proxy () 最核心的需要拦截，数据的读取和数据的修改
const reactiveMap = new WeakMap(); //会自动垃圾回收，不会造成内存泄露，存储的key只能是对象
const readonlyMap = new WeakMap();
export function createReactiveObject(target: any, isReadonly: boolean, baseHandlers: any) {
  // 如果目标不是对象 没法拦截了reactive 这个api只能拦截对象类型
  if (!isObject(target)) {
    return target;
  }
  // 如果某个对象已经代理过了 就不代理 可能一个对象 被代理是深度， 又仅读代理

  const proxyMap = isReadonly ? readonlyMap : reactiveMap;

  const exisitProxy = proxyMap.get(target);
  if (exisitProxy) {
    return exisitProxy;
  }

  const proxy = new Proxy(target, baseHandlers);

  proxyMap.set(target, proxy); //将要代理的对象和对应代理结果缓存起来
  return proxy;
}
