---
date: 2015-08-31 02:00:00 +0800
title: 不同平台下滚动条的问题
layout: post
tags:
    - CSS
    - 滚动条
categories:
    - Tech
published: true
---
这几天写 CSS 时遇到一个滚动条相关的问题. 假设有一块 1280px 宽的屏幕, 要显示一个 1280px 宽的 div, Chrome for Mobile 的话直接显示出来没问题, 只有在上下拖动时滚动条会显示出来并且是浮在页面上不占用宽度的; Chrome for PC 的话滚动条默认是占用 17px 宽的, 这就导致水平方向的滚动条也要显示了, 如果设为 `overflow-x: hidden;` 的话垂直的滚动条会遮挡住那个 div.

<!-- more -->

我的具体场景是要在 1280px 宽的屏幕上显示很多个 320px 宽的 div, 出现滚动条后 Mobile 下是我所希望的一行四个 div, 而 PC 下是一行三个. 这样给另一个要响应式的 div 写 media 规则似乎没法实现统一的效果. 在 PC 下似乎也没法把滚动条设置为浮在页面上而不占用宽度, 只好把效果统一为 1280px 宽的屏幕上一行三个 div 了.
