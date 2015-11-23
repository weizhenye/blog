---
date: 2015-11-18 21:30:00
title: 写 ASS.js 时遇到的 SVG 问题
layout: post
tags:
    - 
categories:
    - Tech
published: true
---
在 [ASS.js](https://github.com/weizhenye/ASS) 中，有些效果无法使用单纯的 HTML + CSS 来实现，得考虑使用 SVG 或 Canvas，而使用 Canvas 的话需要自己去实现各种效果，相比之下 SVG 就方便地多。我对 SVG 并不了解，只是看过几遍 [MDN](https://developer.mozilla.org/en-US/docs/Web/SVG) 的程度，在写的过程中遇到了不少问题，在此做个记录。

<!-- more -->

##### B 样条曲线

在 ASS 中可以在绘图模式中通过绘图指令来画出矢量图形，只要把这些指令转换成 &lt;path&gt; 中 d 属性的指令就可以了。但是其中有个 `s` 指令可以绘制「三次均匀 B 样条曲线」，SVG 中并没有对应的指令。我没学过计算机图形学之类的课程，搜了好久资料才大概了解 B 样条曲线可以通过多条贝塞尔曲线叠加得到，但由于没有直观的认识我还是不知道该怎么转换。之后偶然发现 [D3.js](https://github.com/mbostock/d3) 实现了 B 样条效果，于是找到它的[源代码](https://github.com/mbostock/d3/blob/master/src/svg/line.js)，根据我具体场景把它的方法移植过来了。

##### 缩放图形

在 ASS 中可以对字幕进行缩放，我是使用 CSS 的 transform 属性来实现的。但是对于 SVG，通过 CSS 直接放大的话会导致图形模糊，矢量图形就不再是矢量了。于是对图形做特殊处理，CSS 里放大倍数为 1，在 SVG 中给 &lt;path&gt; 外面包一个 &lt;g&gt;，然后给 &lt;g&gt; 设置 transform 属性。但由于 ASS 中图形的坐标和定位很鬼畜，到后面这种方式遇到的麻烦越来越多。然后我发现了 [viewBox](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/viewBox) 属性这个神器，原本的坐标不用变，只要算一下最小坐标值和图形宽高，再改变 &lt;svg&gt; 的宽高就好，依然是矢量图形，真是优雅。然后就感觉自己对 SVG 太不熟悉了，正常情况下遇到一个问题应该要能想到所有可能的方法，然后选择一个最优的，现在的我 SVG 的各个元素和属性是干嘛用的都不一定说的出来。

##### userSpaceOnUse 的 bug

ASS 中的 `\clip` 指令可以对字幕进行路径切割，而 IE 还不支持 CSS 的 clip-path。可能可行的方案是把所有文字也用 SVG 来渲染，直接在 SVG 中应用 clip-path。但是我对 SVG 还不熟悉，也不知道有多少坑，而且真要转换成全 SVG 的话工程量太大了。所以目前还是使用 CSS 的 clip-path 把能支持的给支持了。写完后发现 Chrome 和 Firefox 下表现不同，测试发现是两者对 userSpaceOnUse 的渲染不一致。然后[发推](https://twitter.com/weizhenye/status/662197864798380032)询问了 [upsuperx](https://twitter.com/upsuperx)，最终讨论结果应该是 Chrome 的问题。

在 clip-path 应用于 HTML 元素的情况下，clipPathUnits 的作用对象与定义 &lt;clipPath&gt; 的那个 &lt;svg&gt; 应该没有关系，不管哪个值都应该是 clip-path 所应用的那个元素。userSpaceOnUse 是以被应用元素本身为坐标系，元素本身的左上角就是 (0, 0)；objectBoundingBox 是以被应用元素以及其所有子元素为坐标系，比如某 &lt;div&gt; 有个 `position: absolute; top: -100px; left: -100px;` 的子元素，那么该 &lt;div&gt; 本身的左上角就是 (100, 100)，同时其坐标都是归一化的，范围在 0 和 1 之间。

于是只好把 userSpaceOnUse 改成 objectBoundingBox，再把坐标都归一化，同时给字幕元素加一个和舞台元素同样大小的子元素来修正其坐标。但之后还是遇到了问题：修正元素是针对字幕元素绝对定位使之恰好和舞台元素重叠的，在遇到有移动效果的字幕时修正元素就跟着跑了。思考了一下，应该反过来，把字幕元素作为修正元素的子元素，clip-path 也应用于修正元素，这样修正元素就能固定住，字幕元素也能随便跑了。然而现实并没有这么美好，因为我是使用 CSS Animation 中的  `transform: translate(x, y);` 来实现移动的，[测试](https://codepen.io/weizhenye/pen/Lpabqw)后发现 Chrome 是有 bug 的，用 translate 会导致子元素没有 clip-path 的效果，用 left 和 top 就可以。

##### 用 &lt;filter&gt; 实现边框、阴影和模糊效果

边框可以使用 &lt;feMorphology&gt; 来做，处理完后的图形是比原图形胖一点的实心图形，还需要用 &lt;feComposite&gt; 中的 `operator="out"` 把原图形从处理完的图形中减去，这样才能得到单纯的边框。在有模糊效果的情况下，边框是不会向内模糊的，也就是要先模糊边框再减去原图形。阴影则使用 &lt;feOffset&gt;，阴影的生成应当是基于边框的，因为边框也是有投影的。由于在 ASS 中当原图形是全透明但有不透明边框的情况下，其阴影就只是边框的投影，所以阴影要根据原图形的透明度分两种情况生成。对于边框与阴影的模糊效果，先模糊再叠加和先叠加再模糊两种方式得到的效果似乎是一样的，我是使用前者。

在应用 filter 属性时，由于 &lt;svg&gt; 上有 viewBox 属性，图形被缩放了，而 filter 直接在应用 &lt;svg&gt; 上，也被缩放了。一开始我是把 &lt;filter&gt; 中的值都除以相应的倍数，然后发现 Chrome 下无法渲染出小于 1  的边框，非常蛋疼。想了想只要先经过 viewBox 再应用 filter 就可以正常了，于是想到把 filter 应用到 &lt;svg&gt; 的父元素 &lt;span&gt; 上，但是 IE 又不支持在 HTML 元素上应用 filter。得把问题在 &lt;svg&gt; 中解决，于是去找可以使用 viewBox 的元素，发现了 &lt;symbol&gt;，把 filter 写 &lt;use&gt; 里终于可以优雅解决。最后又产生了新的问题：直接给 &lt;svg&gt; 使用原图形宽高的话，&lt;filter&gt; 的效果会被切割掉，导致显示不完整。解决方法是计算出上下左右边框、阴影和模糊的宽度，给 &lt;svg&gt; 另加一个 viewBox，这样这里的 viewBox 不会缩放图形，也能显示 &lt;filter&gt; 部分了。大致的代码流程在[这里](https://codepen.io/weizhenye/pen/XmypVp)有。
