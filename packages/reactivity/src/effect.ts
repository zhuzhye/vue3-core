import { isArray, isNumber } from "@vue/shared";
import { TriggerOrTypes } from "./operators";
import { isIntergerKey } from "../../shared/src/index";

export function effect(fn, options: any = {}) {
  // 需要让effect变成响应的effect,可以做到数据变化重新执行
  const effect = createReactiveEffect(fn, options);
  if (!options.lazy) {
    //默认的effect会先执行
    effect(); //响应式的effect默认先执行一次
  }
  return effect;
}
let uid = 0;
let activeEffect; //存储当前的effect
const effectStack = [];
function createReactiveEffect(fn, options) {
  const effect = function reactiveEffect() {
    // 保证effect没有加入到effectStack中
    if (!effectStack.includes(effect)) {
      try {
        effectStack.push(effect);
        activeEffect = effect;
        return fn(); //函数执行会取值 会执行get方法
      } finally {
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1];
      }
    }
  };

  effect.id = uid++; //制作一个effect标识 用于区分effect
  effect._isEffect = true; //用于标识这个式响应式的effect
  effect.raw = fn; //保留effect对应的原函数
  effect.options = options; //在effect上保存用户的属性
  return effect;
}
// 让某个对象中的属性收集当前他对应的effect函数
const targetMap = new WeakMap();
export function track(target, type, key) {
  // activeEffect 可以拿到当前的effect
  console.log(target, type, key);
  if (activeEffect === undefined) {
    //此属性不用收集，因为没有effect使用
    return;
  }
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
  }
  console.log(targetMap);
}

export function trigger(target, type, key?, newValue?, oldValue?) {
  // 如果这个属性没有收集过effect 那就不需要做任何操作
  const depsMap = targetMap.get(target);
  if (!depsMap) return;

  const effects = new Set();
  const add = (effectToAdd) => {
    if (effectToAdd) {
      effectToAdd.forEach((effect) => {
        effects.add(effect);
      });
    }
  };
  // 将所有要执行的effect 全部存到一个新的集合中，最终一起执行
  // 1.看修改的是不是数组的长度，因为该长度影响比较大
  if (key === "length" && isArray(target)) {
    depsMap.forEach((dep, key) => {
      if (key === "length" || key > newValue) {
        // 如果更改的长度小于收集的索引，那么索引也要触发effect重新执行
        add(dep);
      }
    });
  } else {
    // 可能是对象
    if (key !== undefined) {
      add(depsMap.get(key));
    }
    // 如果数组中的某一个索引怎么办？
    switch (type) {
      case TriggerOrTypes.ADD:
        if (isArray(target) && isIntergerKey(key)) {
          add(depsMap.get("length"));
        }
    }
  }
  effects.forEach((effect: any) => {
    if (effect.options.scheduler) {
      effect.options.scheduler(effect);
    } else {
      effect();
    }
  });
}
// 函数调用是一个栈型结构
