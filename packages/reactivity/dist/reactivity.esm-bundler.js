const isObject = (value) => typeof value === "object" && value !== null;
const extend = Object.assign;
const isArray = Array.isArray;
const isIntergerKey = (key) => parseInt(key) + "" === key;
let hasOwnpRroperty = Object.prototype.hasOwnProperty;
const hasOwn = (target, key) => hasOwnpRroperty.call(target, key);
const hasChanged = (oldValue, value) => oldValue !== value;

function effect(fn, options = {}) {
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
            }
            finally {
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
function track(target, type, key) {
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
function trigger(target, type, key, newValue, oldValue) {
    // 如果这个属性没有收集过effect 那就不需要做任何操作
    const depsMap = targetMap.get(target);
    if (!depsMap)
        return;
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
    }
    else {
        // 可能是对象
        if (key !== undefined) {
            add(depsMap.get(key));
        }
        // 如果数组中的某一个索引怎么办？
        switch (type) {
            case 0 /* TriggerOrTypes.ADD */:
                if (isArray(target) && isIntergerKey(key)) {
                    add(depsMap.get("length"));
                }
        }
    }
    effects.forEach((effect) => effect());
}
// 函数调用是一个栈型结构

// 实现 new Proxy （target，handler）
const get = createGetter();
const set = createSetter();
const shallowGet = createGetter(false, true);
const shallowSet = createSetter(true);
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
const mutableHandlers = {
    get,
    set,
};
const shallowReactiveHandlers = {
    get: shallowGet,
    set: shallowSet,
};
let readonlyObj = {
    set: (target, key) => {
        console.warn(`set on key ${key} failed`);
    },
};
const readonlyHandlers = extend({
    get: readonlyGet,
}, readonlyObj);
const shallowReadonlyHandlers = extend({
    get: shallowReadonlyGet,
}, readonlyObj);
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
            track(target, 0 /* TrackOpTypes.GET */, key);
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
        Reflect.set(target, key, value, receiver);
        if (!hadKey) {
            trigger(target, 0 /* TriggerOrTypes.ADD */, key, value);
        }
        else if (hasChanged(oldValue, value)) {
            trigger(target, 1 /* TriggerOrTypes.SET */, key, value);
        }
        // 区分新增和修改 vue2无法监控更改索引，无法监控数组的长度
        // 当数据更新是 通知对应的属性effect重新执行
    };
}

function reactive(target) {
    return createReactiveObject(target, false, mutableHandlers);
}
function shallowReactive(target) {
    return createReactiveObject(target, false, shallowReactiveHandlers);
}
function readonly(target) {
    return createReactiveObject(target, true, readonlyHandlers);
}
function shallowReadonly(target) {
    return createReactiveObject(target, true, shallowReadonlyHandlers);
}
// 是不是仅读，是不是深度，是不是柯里化 new Proxy () 最核心的需要拦截，数据的读取和数据的修改
const reactiveMap = new WeakMap(); //会自动垃圾回收，不会造成内存泄露，存储的key只能是对象
const readonlyMap = new WeakMap();
function createReactiveObject(target, isReadonly, baseHandlers) {
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

function ref(value) {
    // value是一个普通类型
    // 将普通类型变成一个对象
    // 可以是对象但是一般情况下是对象直接用reactive更合理
    return createRef(value);
}
// ref和reactive 的区别 reactive内部采用proxy ref内部使用的是defineProperty
function shallowRef(value) {
    return createRef(value, true);
}
const convert = (val) => (isObject(val) ? reactive(val) : val);
// beta版本 之前的ref就是个对象,由于对象不方便扩展，改成了类
class RefImpl {
    rawValue;
    shallow;
    _value; //标识声明了一个_value属性 但是没有属性
    _v_isRef = true; //产生的实例会添加 _v_isRef这个属性
    constructor(rawValue, shallow) {
        this.rawValue = rawValue;
        this.shallow = shallow;
        //参数中前面增加修饰符 标识此属性放到了实例上
        this._value = shallow ? rawValue : convert(rawValue); //如果是深度需要把里面的都变成响应式
    }
    get value() {
        // 代理 取值取value 会帮我们代理到 _value上
        track(this, 0 /* TrackOpTypes.GET */, "value");
        return this._value;
    }
    set value(newValue) {
        if (hasChanged(newValue, this.rawValue)) {
            // 判断老值和新值是否有变化
            this.rawValue = newValue; //新值作为老值
            this._value = this.shallow ? newValue : convert(newValue);
            trigger(this, 1 /* TriggerOrTypes.SET */, "value", newValue);
        }
    }
}
function createRef(rawValue, shallow = false) {
    return new RefImpl(rawValue, shallow);
}
class ObjectRefImpl {
    target;
    key;
    _v_isRef = true; //产生的实例会添加 _v_isRef这个属性
    constructor(target, key) {
        this.target = target;
        this.key = key;
    }
    get value() {
        return this.target[this.key];
    }
    set value(newValue) {
        this.target[this.key] = newValue;
    }
}
// 将某一个key对应的值，转化为ref
function toRef(target, key) {
    // 可以把一个对象的值转化城 ref类型
    return new ObjectRefImpl(target, key);
}
function toRefs(object) {
    // object 可能传递的是一个数组 或者 对象
    const ret = isArray(object) ? new Array(object.length) : {};
    for (let key in object) {
        ret[key] = toRef(object, key);
    }
    return ret;
}

export { effect, reactive, readonly, ref, shallowReactive, shallowReadonly, shallowRef, toRef, toRefs };
//# sourceMappingURL=reactivity.esm-bundler.js.map
