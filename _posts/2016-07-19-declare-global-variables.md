---
date: 2016-07-19 01:00:00 +0800
title: 声明全局变量的区别
layout: post
tags:
    - 全局变量
    - 作用域
    - 变量声明
categories:
    - Tech
published: true
---
前几天看到一篇文章[《const 和 let 到底定义到哪儿去了？》](https://www.web-tinker.com/article/21348.html)，里面提到 <q>const 和 let 定义的全局变量不会被注册到 window 对象上，并且在 window 上定义一个不可写的属性会出现神奇的情况</q>。看完后我也是一脸懵逼，脑中自动浮现出了表情包「你们对 JavaScript 一无所知」。

<!-- more -->

于是我开始测试各种情况，试图解释这种情况，但是不管怎么假设，该文提到的第二个和第三个例子总是冲突的。最终只好去啃 ECMA-262 语言规范。找到了 [8.1.1.4 Global Environment Records](https://tc39.github.io/ecma262/#sec-global-environment-records) 这节，大概可以解释这一行为。首先 Record 是什么？根据 [6.2.1The List and Record Specification Types](https://tc39.github.io/ecma262/#sec-list-and-record-specification-type)，Record 类型是用来描述规范的算法中的数据聚合，感觉跟没解释一样，总之就是这么一个抽象的东西。然后是 [Environment Record](https://tc39.github.io/ecma262/#sec-environment-records)，从面向对象的层次结构来说，它可以看作是 Record 的一个抽象类，并包含三个子类：[declarative Environment Record](https://tc39.github.io/ecma262/#sec-declarative-environment-records)、[object Environment Record](https://tc39.github.io/ecma262/#sec-object-environment-records) 和 [global Environment Record](https://tc39.github.io/ecma262/#sec-global-environment-records)，其中 declarative Environment Record 又包含了 [function Environment Record](https://tc39.github.io/ecma262/#sec-function-environment-records) 和 [module Environment Record](https://tc39.github.io/ecma262/#sec-module-environment-records) 两个子类。

```
                                                    ┌ Function Environment Record
                   ┌ Declarative Environment Record ┤
                   │                                └ Module Environment Record
Environment Record ┼ Object Environment Record
                   │
                   └ Global Environment Record
```

Declarative Environment Record 绑定了有自己作用域的那些声明的标识符。Object Environment Record 则绑定了「绑定对象」的属性名直接对应的标识符。Global Environment Record 是 Script（相对于 Module）全局声明特有的，虽然和另两个并列，但事实上它是这两者的组合封装，它的 object Environment Record 部分除了包含内置全局变量的绑定，还会绑定全局代码中的 function 声明、generator 声明和 var 声明，即浏览器中这些声明会注册到 window 对象上，直接给全局对象 window 加属性当然也是会绑定的；它的 declarative Environment Record 部分则包含了 let、const、class、import 等声明的绑定，虽然它们在全局代码中声明确实是全局变量，但它是全局作用域中的变量，不会注册到 window 对象上。于是，当用 let 声明了一个变量 x 且设置了 window.x 后，直接获取 x 会优先获取当前作用域内的 x 的值，即 declarative Environment Record 中的 x，如果没找到才会再去获取 object Environment Record 中 window.x 的值。

不过等一下，function Environment Record 不是分类在 declarative Environment Record 之下的吗？怎么 function 声明又变成 object Environment Record 了？<span lang="ja">わかんないよ</span>，脑中全是[早见大法的哇嘎乃呦](http://www.bilibili.com/video/av1723330/)。讲道理按 ES6 规范，function 声明的行为应当与 let 一样，只在块级作用域有效，但 [附录 B.3.3](https://tc39.github.io/ecma262/#sec-block-level-function-declarations-web-legacy-compatibility-semantics) 提到，为了兼容旧代码，浏览器实现时可以有自己的行为方式，function 声明会和 var 声明一样，提升到全局作用域、函数作用域、块级作用域的头部。不是非常确定，我猜这个应该就是 function 声明属于 object Environment Record 的原因。

另外有一个 [realm](https://tc39.github.io/ecma262/#realm) 的概念，一个 realm 包含了一系列内部对象、全局环境、全局环境作用域中加载的所有代码、其他相关联的状态和资源。总之，一个 HTML 中多个 script 标签是属于同一个 realm 的，它们的 global Environment Record 是共享的。

好了，现在大概可以解释这些例子了。下面这个例子，可以理解，global Environment Record 在各个 script 标签中共享，window.b 获取到的是它的 object Environment Record 部分中的值，b 获取到的是它的 declarative Environment Record 部分中的值。

```html
<script>
var a = 1;
let b = 2;
const c = 3;
console.log([window.a, window.b, window.c]);
// [1, undefined, undefined]
</script>
<script>
console.log([window.a, window.b, window.c]);
// [1, undefined, undefined]
console.log([a, b, c]);
// [1, 2, 3]
</script>
```

插播下面两个例子，从中我们可以知道，var 除了会绑定 object Environment Record 把变量注册到 window 上，还同时会绑定 declarative Environment Record，规范中也确实有提到这一点。

> Each declarative Environment Record is associated with an ECMAScript program scope containing **variable**, constant, let, class, module, import, and/or function declarations.

所以直接给 window 加属性不会影响 let 声明。

```html
<script>
window.x = 1;
let x = 2;
// 不报错
</script>
```

而 var 声明之后 declarative Environment Record 就绑定这个值了，不能再用 let 声明了。

```html
<script>
var x = 1;
let x = 2;
// Uncaught SyntaxError: Identifier 'x' has already been declared
</script>
```

下面这个例子，假设 Chrome 的实现是对的，从结果我们可以推断，Object.defineProperty 在给 window 添加不可变属性时也绑定了 declarative Environment Record。

```html
<script>
Object.defineProperty(window, 'b', {});
Object.defineProperty(window, 'c', {});
</script>
<script>
let b = 2;
// Uncaught TypeError: Identifier 'b' has already been declared
</script>
<script>
const c = 3;
// Uncaught TypeError: Identifier 'c' has already been declared
</script>
```

而把它们放在同个 script 标签中时，如果要解释它的行为，大概就是暂时性死区了，在该区域中，有 let 的声明，变量在 declarative Environment Record 中预先占位了，导致在这之前的 Object.defineProperty 无法绑定 declarative Environment Record，只影响到了 object Environment Record 部分。

```html
<script>
Object.defineProperty(window, 'b', {});
Object.defineProperty(window, 'c', {});
let b = 2;
const c = 3;
console.log(window.b, window.c); // [undefined, undefined]
console.log(b, c); // [2, 3]
</script>
```

但是这么解释感觉很奇怪，Object.defineProperty 直接给 window 设置属性为什么会影响到 declarative Environment Record 呢？我大致看了下规范中对它的描述，似乎没提到相关内容。然后我又做了一个测试。

```html
<script>
Object.defineProperty(window, 'b', {
  configurable: true
});
Object.defineProperty(window, 'c', {
  configurable: true
});
</script>
<script>
let b = 2;
// 不报错
</script>
<script>
const c = 3;
// 不报错
</script>
```

在这个例子中，添加为可变属性就不会影响后面 let 声明了。试了下各个浏览器，Chrome 51 和 Firefox 47 表现一致，给 window 添加不可变属性时会影响到 declarative Environment Record；而 Edge 13 则不会影响。我没有看过 V8 源码，对上述行为我做出如下**猜测**：V8 在使用 Object.defineProperty 给对象添加不可变属性时，直接借用了 const 声明的过程，导致影响到了 declarative Environment Record，是一个 bug。

本人英语不佳，或有理解错误，或有表意不达，还望大家指正。到头来我给出的结论只是个猜测，不过既然浏览器的表现不一致，必然有一方有 bug。如果有人知道确切的原因，还请赐教。

<hr>

**Update**：[和 upsuper 讨论后](https://twitter.com/upsuper/status/792685071815761921 "大白兔大法好")，结论是 Chrome 和 Firefox 是正常的。
根据[规范](https://tc39.github.io/ecma262/2016/#sec-globaldeclarationinstantiation)，在全局环境中使用 let 和 const 声明变量时，会检查该变量名是否已经被 var、let 或 const 声明过了，如果已声明就报错；还会检查 window 中该变量名是否可写，如果该变量不为 undefined 且 configurable 为 false，那么 [HasRestrictedGlobalProperty](https://tc39.github.io/ecma262/2016/#sec-hasrestrictedglobalproperty) 最终会为 true，这样也会报错。
