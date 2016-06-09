---
date: 2016-01-17 01:37:00 +0800
title: ASS.js 模块化笔记
layout: post
tags:
    - ASS
    - 模块化
categories:
    - Tech
published: true
---
[ASS.js](https://github.com/weizhenye/ASS) 是我两年前开坑的项目，直到最近[整个项目代码](https://github.com/weizhenye/ASS/tree/6c78269103c42eb27907f7beb5f13b9eb03bfda8)都还是写在一个文件里的，我一个人开发维护没什么问题，但是别人如果要看源码的话可能会比较吃力（虽然没人来看）。而且我也在考虑加上一些测试，但因为整个文件对外只输出一个 `ASS` 变量，没法获取内部变量，不知道如何给一个 IIFE 做测试。于是我开始考虑把整个项目模块化以及添加构建过程。

<!-- more -->

##### 目标

ASS.js 作为一个前端库，对用户应当只提供一个 ass.js 文件，对外通过 [UMD](https://github.com/umdjs/umd) 模式只暴露一个 `ASS` 构造函数，然后用户 new 一个实例出来就可以调用 API 了。虽然是有一些全局的 CSS，但还是可以通过 JavaScript 去添加，避免用户再引入一个 ass.css 文件。在 ASS.js 中因为生成 CSS Animation 的效率问题，我有考虑使用 Worker 来提高性能，Chrome 和 Firefox 可以使用 `createObjectURL` 模拟文件链接，IE 要使用 Worker 就不得不另增一个 ass-worker.js 文件了。不过我之后是考虑使用 JavaScript 动画代替 CSS 动画，所以目前还是不用 Worker 了。

ASS.js 这样涉及到图形渲染的前端库似乎是比较难做测试的。我目前还完全没有写测试的经验，只是有个大概的概念。解析部分应该就是比较典型的单元测试，根据 ASS 规范给定输入能有期望的输出就行；渲染部分我就不知道该怎么测试了，是去模拟用户操作吗？是去判断生成的 DOM 的结构和属性吗？是渲染后截图与 xy-VSFilter 或 libass 的截图对比吗？因为 ASS 规范中奇葩的字号设定，ASS.js 中的字号只能去模拟 VSFilter，没法完全相同，这样截图就基本行不通了。初步的目标是把解析部分都写好测试，渲染部分暂时人工测试，等以后慢慢摸索最佳方案。

最终自动化构建的流程应该是，运行某条命令后，跑完测试，计算覆盖率，生成 ass.js 和 ass.min.js 文件。

##### 方案选择

测试框架准备用 [Mocha](https://github.com/mochajs/mocha)，除了之前大致看过它的用法，相比于 [Jasmine](https://github.com/jasmine/jasmine)，个人对 Mocha 单词本身更有好感，毕竟作为一个萌二，能从抹茶上感受到一些日系要素。什么？你说抹茶起源于中国？但抹茶现在兴盛于日本而且说不定这个词还是逆输入的。什么？你说 Mocha 的意思是摩卡，Matcha 才是抹茶？我……第一次知道 Mocha 不是抹茶我的内心是崩溃的，然后搜到一个[帖子](http://www.douban.com/group/topic/12455303/)，最早是叫「末茶」，传到日本后变成「<span lang="ja">抹茶</span>」，英文 Matcha 便是「<span lang="ja">まっちゃ</span>」的罗马音。不过不管是 Mocha 还是 Matcha，都可以 Gulp 掉。于是构建工具就决定用 [Gulp](https://github.com/gulpjs/gulp) 了。

相比于 AMD，我对 CommonJS 更加熟悉，最开始我是决定用 CommonJS。虽说 AMD 更适合浏览器环境，但 ASS.js 最终是打包成一个文件的，不管选哪个都只是内部代码的组织方式，与运行环境无关。而且测试框架选择了 Mocha，总得在 Node.js 下运行吧？CommonJS 应该会更方便。

关于打包器，有 [Browserify](https://github.com/substack/node-browserify) 和 [Webpack](https://github.com/webpack/webpack) 可以选择，但因为我都没有实际用过，也不知道哪个更合适。还有一个比较火的是 [Rollup](https://github.com/rollup/rollup)，只把模块中要用到的部分打包进来，最终的代码体积会相对比较小。但是 ASS.js 中不会引入第三方依赖，所有代码都是自己写的，必然都会用到，那么它文件体积的优势也不明显了吧。而且 Rollup 专注于 ES6 模块，似乎还不能直接打包 CommonJS 模块，需要另外插件支持。不过 Rollup 打包出来的代码会比较干净，Browserify 和 Webpack 都会在打包出来的文件中加一大坨辅助函数，尤其是 Webpack 的 CSS 加载插件，这[一大坨代码](https://webpack.github.io/docs/tutorials/getting-started/first-loader/bundle.js)只是为了设置 `body {background: yellow;}`，根本没法忍。那么要不要把 ASS.js 用 ES6 重写呢？目前如果代码要在浏览器运行，就不得不把 ES6 转成 ES5，我没有深入了解过 [Babel](https://github.com/babel/babel)，虽然知道顾虑是多余的，我还是不太放心转换出来的代码。

我也去参考了一些其他的前端项目，[jQuery](https://github.com/jquery/jquery) 是通过 AMD 方式模块化的；[three.js](https://github.com/mrdoob/three.js) 是直接把 `THREE` 对象作为全局变量，函数全写在对象里面，最后直接把文件们合在一起；[two.js](https://github.com/jonobr1/two.js) 把各个模块用匿名函数包一下只传了 `Two` 和几个依赖库的变量进去，最后也直接把文件合在一起了，事实上和 three.js 一样，也就是给 `Two` 添加方法和属性的方式；[D3.js](https://github.com/mbostock/d3) 是用作者自己写的 [smash](https://github.com/mbostock/smash) 打包，基本原理大概也就是根据 import 的内容直接合并文件吧，而且已经不再维护并建议使用 Rollup。

##### 实现

总之我开始尝试把 1300 行的单个文件拆分成多个 CommonJS 模块。然后就发现非常痛苦，代码的耦合性太高了，经常某个函数要用到一个内部的全局变量，或者 `this` 要绑定到 `ASS` 这个构造函数。已经拆不下去了，可能要重写不少代码。之前有看过函数式编程相关的文章，感觉完全做到是不太可能的，可以尽量往那边靠吧。于是我重新思考到底要不要用 CommonJS 模式？不用的话 Mocha 就没法直接 require 到，怎么测试？然后发现了 [rewire](https://github.com/jhnns/rewire) 可以获取模块的内部变量，这样测试就没问题了。

最终方案是一个文件一个函数，构建时直接合并到一起，最后外面包一个 UMD。这样生成的代码结构会和未拆分前的结构完全一致，有种莫名的安心感。本来我模块化主要就是为了可以添加测试，并不是为了模块化而模块化。原先全局的 CSS 我是直接写成一行作为字符串赋值给 JavaScript 变量然后添加的，现在有了构建过程可以独立写到一个文件，然后在构建时压缩一下替换 JavaScript 文件中的变量。当然对于每一个函数还是要继续改进，要尽可能地减少耦合，不然测试起来还是会很麻烦。

拆分的时候遇到了程序员最难的问题：命名。该怎么决定目录结构和文件名啊，于是又去看了下其他的项目。src 放源文件，tests 放测试文件，dist 放生成的目标文件，这些基本可以确定。src 里面该是怎样的结构？想了好久，感觉 ASS.js 可以分为解析和渲染两部分，便是 parser 和 renderer 两个目录，平级的放一个 index.js 入口文件。不过解析很容易确定，某个函数到底算不算渲染就比较纠结了。总之姑且是这么分了一下，等更加函数式之后再改吧。
