---
date: 2017-04-03 22:30:00 +0800
title: HTML 上事件句柄的作用域
layout: post
categories:
    - Tech
published: true
---

前段时间翻看  [HTML Reference](http://htmlreference.io/)，发现了没怎么见过的 [output 标签](http://htmlreference.io/element/output/)，其中给出的例子让我比较吃惊：

```html
<form oninput="sum.value = parseInt(a.value) + parseInt(b.value)">
  <input type="number" name="a" value="4">
  +
  <input type="number" name="b" value="7">
  =
  <output name="sum">11</output>
</form>
```

在 `oninput` 中怎么就能拿到 `sum`、`a`、`b` 这些变量呢？

<!-- more -->

在前辈们从小教育我们不要这么写的 `onclick="clickHandler();"` 写法中，`clickHandler` 是一个全局变量，我们理所当然地认为能调用到，没什么问题。那 `sum` 是不是全局变量呢？`window.sum === undefined`，并不是。如果是的话 HTML 也太危险了，随便一个 name 属性就影响到全局了。

总之先 `oninput="console.dir(sum);"` 看下，指向 output 这个元素，也对，改 `sum.value` 才能改变 output 中显示的值。再看下 this，发现指向 form，不意外。然后作为 form 的属性，看下 `form.oninput`，发现它是这个函数：

```js
function oninput(event) {
  console.dir(this);
}
```

也就是说，HTML 上 on 开头的属性，会使用如上的函数包裹一下设置到元素的 attribute 中。这个包裹是纯粹的字符串直接拼接，我们可以尝试一下 `oninput="console."` 这样语法错误的字符串，在控制台查看这个 `form.oninput` 时报了语法错误 `Uncaught SyntaxError: Unexpected token }`。另外，这个包裹的函数传入了参数 `event`，就是那个事件对象，在 HTML 中也能直接使用 `event` 这个变量。好了，我要是把 `sum` 改名为 `event` 会怎样？君孰与参数屌？ 发现 `event` 依然是事件对象，也就说明 `sum` 是在这个函数外的作用域上。

不知道哪个版本开始 DevTools 可以查看函数的 `[[Scopes]]` 了，运行如下代码后，可以观察到 `inner` 的 `[[Scopes]]` 有两个，分别是 `Closure (outer)` 和 `Global`，前者包含了常量 `a`，后者就是 `window`。

```js
function outer() {
  const a = 1;
  function inner() {
    return a;
  }
  console.dir(inner);
}
outer();
```

同理我们可以看到 `form.oninput` 有四个 `[[Scopes]]`，分别是 form 元素、空对象 `{}`、`document`、`window`。前三者叫做 `With Block`，是用 with 语句设置的；第二个是个空对象，不知道为什么，找了下[规范](https://html.spec.whatwg.org/multipage/webappapis.html#getting-the-current-value-of-the-event-handler)，第十条描述了它的 scope，也没提到。不过，这下 `sum` 的来源基本清楚了，空对象肯定没有，`document`、`window` 也没有，它是来自 form 元素。

可是，可是，`console.dir(form)` 查看时，并没有找到 sum 属性，只有 `form[2]` 表示这个 output 元素；然而直接输出 `form.sum` 时，是有值的。难道 sum 是在 form 构造函数 HTMLFormElement 的原型上面？`form.constructor.prototype.sum === undefined`，并没有；难道它是一个 HTMLCollection，像 `form.children` 那样，可以直接用名称取值？可是它不由 HTMLCollection 构造，而且 HTMLCollection 也是会显示对应名称的属性的。我用 `form.hasOwnProperty('sum')` 试了下，发现 `sum` 是 form 自身的属性，但怎么在控制台就不显示呢？于是我去翻看 [form 的规范](https://html.spec.whatwg.org/multipage/forms.html#the-form-element)，它的 [DOM 接口定义](https://html.spec.whatwg.org/multipage/forms.html#the-form-element:concept-element-dom)中有行 `getter (RadioNodeList or Element) (DOMString name);`，[后面](https://html.spec.whatwg.org/multipage/forms.html#dom-form-nameditem)也有描述其实现过程，原来 form 中有 name 属性的那些元素，是通过一个叫 [past names map](https://html.spec.whatwg.org/multipage/forms.html#past-names-map) 的东西维护的，它可以保证元素 name 改变了也能让 form 找到这个元素。

继续测试，把 `sum` 改名为 `oninput`，form 的 input 事件依然能够触发，然而输出 `form.oninput` 却是 output 元素。WTF？更进一步，设置 `form.oninput = null;` 之后，input 事件不再触发了，但它的值依然是 output 元素。我趴在地上想了想，应该是，通过 `oninput` 写的句柄，在初始化之后，类似与 `addEventListener`，注册到某个地方去维护了，事件触发时，并不是直接调用 `form.oninput` 本身；之后浏览器发现 output 元素也叫 oninput，通过 past names map 的方式，取其值时（用 getter）拦截掉了原来的句柄，返回了 map 中的值；再给它赋值时，past names map 并不让重新赋值（没有 setter），被句柄接到，从注册的地方删除，不在响应该事件。

至此，HTML 上事件句柄的作用域基本都清楚了，若有纰漏，还望指出。
