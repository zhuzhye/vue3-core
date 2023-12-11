import { isFunction } from "@vue/shared";
import { effect, track, trigger } from "./effect";
import { TrackOpTypes, TriggerOrTypes } from "./operators";
class ComputedRefImpl {
  public _dirty = true; //默认取值时不要用缓存
  public _value;
  public effect;
  constructor(getter, public setter) {
    //ts默认不会加载this上
    this.effect = effect(getter, {
      lazy: true,
      scheduler: () => {
        if (!this._dirty) {
          this._dirty = true;
          trigger(this, TriggerOrTypes.SET, "value");
        }
      },
    });
  }
  get value() {
    if (this._dirty) {
      this._value = this.effect();
    }
    track(this, TrackOpTypes.GET, "value");
    return this._value;
  }
  set value(newValue) {
    this.setter(newValue);
  }
}
// vue 2 和 vue 3 computed原理不一样
export function computed(getterOptions) {
  let getter;
  let setter;
  if (isFunction(getterOptions)) {
    getter = getterOptions;
    setter = () => {
      console.warn("computed value must be readonly");
    };
  } else {
    getter = getterOptions.get;
    setter = getterOptions.set;
  }
  return new ComputedRefImpl(getter, setter);
}
