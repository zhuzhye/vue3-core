import { hasChanged, isArray, isObject } from "@vue/shared";
import { TrackOpTypes, TriggerOrTypes } from "./operators";
import { reactive } from "./reactive";
import { track, trigger } from "./effect";

export function ref(value) {
  // value是一个普通类型
  // 将普通类型变成一个对象
  // 可以是对象但是一般情况下是对象直接用reactive更合理
  return createRef(value);
}
// ref和reactive 的区别 reactive内部采用proxy ref内部使用的是defineProperty
export function shallowRef(value) {
  return createRef(value, true);
}

const convert = (val) => (isObject(val) ? reactive(val) : val);
// beta版本 之前的ref就是个对象,由于对象不方便扩展，改成了类
class RefImpl {
  public _value; //标识声明了一个_value属性 但是没有属性
  public _v_isRef = true; //产生的实例会添加 _v_isRef这个属性
  constructor(public rawValue, public shallow) {
    //参数中前面增加修饰符 标识此属性放到了实例上
    this._value = shallow ? rawValue : convert(rawValue); //如果是深度需要把里面的都变成响应式
  }
  get value() {
    // 代理 取值取value 会帮我们代理到 _value上
    track(this, TrackOpTypes.GET, "value");
    return this._value;
  }
  set value(newValue) {
    if (hasChanged(newValue, this.rawValue)) {
      // 判断老值和新值是否有变化
      this.rawValue = newValue; //新值作为老值
      this._value = this.shallow ? newValue : convert(newValue);

      trigger(this, TriggerOrTypes.SET, "value", newValue);
    }
  }
}
function createRef(rawValue, shallow = false) {
  return new RefImpl(rawValue, shallow);
}

class ObjectRefImpl {
  public _v_isRef = true; //产生的实例会添加 _v_isRef这个属性
  constructor(public target, public key) {}
  get value() {
    return this.target[this.key];
  }
  set value(newValue) {
    this.target[this.key] = newValue;
  }
}
// 将某一个key对应的值，转化为ref
export function toRef(target, key) {
  // 可以把一个对象的值转化城 ref类型
  return new ObjectRefImpl(target, key);
}

export function toRefs(object) {
  // object 可能传递的是一个数组 或者 对象
  const ret = isArray(object) ? new Array(object.length) : {};
  for (let key in object) {
    ret[key] = toRef(object, key);
  }
  return ret;
}
