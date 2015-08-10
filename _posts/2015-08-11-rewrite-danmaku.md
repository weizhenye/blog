---
date: 2015-08-11 02:00:00
title: 重写了弹幕引擎项目
layout: post
tags:
    - 
categories:
    - Idea
    - Tech
published: true
---
　　[Danmaku 项目](https://github.com/weizhenye/Danmaku)是两年前我刚学 JavaScript 时练手用的, 当时去看了 [CommentCoreLibrary](https://github.com/jabbany/CommentCoreLibrary)(CCL) 的源码才对如何写弹幕引擎有了大概的认识, 然后模仿着大概的结构自己实现了功能. 现在看来当时的代码实在是惨不忍睹, 而且 reflow 之类的概念都不知道, 效率也是惨不忍睹. 这两个星期陆陆续续完全重写了整个项目, 在这里做下记录.

<!-- more -->

　　首先是确定功能. 原先就只有绑定 HTML5 video, 现在想想 audio 和 video 基本一样的, 只要给个容器来显示弹幕就好了, audio 的支持不难. 实时模式也是一个比较常见的情景, 比较纠结的是实时模式是否应该有时间轴概念, 其播放暂停跳转应该是怎样的逻辑? 想了想一些具体的例子, [弹股](http://tangu.nextbang.com/)是无时间轴的, 只会显示实时的弹幕; [Missevan 站](http://www.missevan.cn/) Banner 处的弹幕是有时间轴的, 和 CCL 的 [demo 页面](http://jabbany.github.io/CommentCoreLibrary/demo/)一样, 是由开发者另外写个 setInterval 来控制当前的播放时间; [恋战不休](http://polka-dot.co/lzbx.php)的弹幕我猜测也是为每个场景单独写个 setInterval. CCL 内置的 start() 和 stop() 是控制已 push 到 runline 里的弹幕, 对于弹幕列表里等待显示的弹幕, 是交给开发者通过设置 time 来 push 到 runline 的. 而我这个绑定了 media 后直接同步 media 的时间轴, 不需要开发者自己再写一个时间轴, 但这样开发者就不能自己控制时间轴, 于是我这里的实时模式就是弹股那种无时间轴的形式了. 事实上我所纠结的本质应该也不是实时什么的, 而是对于有时间轴的弹幕文件, 在不绑定 media 的情况下该怎么去模拟出时间轴. 模拟出一套 media 的方法和属性并不难, 但我觉得单纯地去播放有时间轴的弹幕的需求实在是太蛋疼了, 我想不到除了视频音频外, 还有什么场景是需要让弹幕带上精确的时间的. 于是功能确定为绑定 media 和无时间轴的实时模式, 等以后真有那需求再去写个模拟的时间轴. 还有关于弹幕本身的模式, 从右到左滚动和顶部底部固定的肯定要有, 考虑到有些语言是从右到左写的, 那从左到右滚动也要有. 高级代码弹幕暂不考虑支持, AB 两站的历史包袱太重坑太大, 不太想去研究.

　　然后是具体实现, 效率是优先考虑的事项. 基于 DOM 的渲染, 最耗时间的就是 reflow, 其次是 repaint. 弹幕毕竟是动画效果, 两者都无法避免, 只能尽量降低. 弹幕的添加和删除, 以及计算其宽高都会造成 reflow, 宽高没办法, 必须计算一次, 添加的次数可以通过 DocumentFragment 将同一帧的弹幕一起添加来减少. 弹幕的滚动我一开始考虑用 CSS Animation 来做, 但是 CSS Animation 要求知道起始状态和结束状态, 而弹幕的结束位置为负的弹幕宽度, 每条弹幕的结束位置都不一样, 如果要实现传统的弹幕行为的话似乎没法用 CSS Animation 来做, 于是采用 JS 的 requestAnimationFrame. CSS 的 left 属性也会造成 reflow, 采用 transform 的 translate. 还有把弹幕绝对定位也能提高渲染性能. 之后是考虑优化 scripting, 主要就是通道分配算法. 原先的做法是要多少像素高度就多大的数组, 然后每个像素都记录属于哪个弹幕, 这样比如一条弹幕有 20px, 那数组中对应的范围就记录了 20 个该数组. 当年还在玩 ACM, 能采用这么烂的算法我也是比较厉害. 现在的算法是维护一个数组 a, 只记录某一弹幕占用范围的底部的值, 这样第 i 条弹幕的占用范围就是 a[i] - a[i - 1], 然后根据冲突条件来插入删除数组元素就好了. 其他优化就是些聊胜于无的二分查找位运算之类的. DOM 的效率肯定是比不上 Canvas 的, 这次新加了 Canvas 渲染. 给每条弹幕 create 一个 canvas, 画完后再通过 drawImage() 画到 stage 的 canvas 上. 结果用[这个](https://github.com/jabbany/CommentCoreLibrary/blob/master/test/av207527.xml)文件做极限测试时发现卡爆了, Chrome 一段时间后直接崩溃, 其他浏览器也是卡到没响应, 然后发现是内存飙升. 搜索后知道了是因为 canvas 耗内存. 我给每条弹幕都 create 了一个 canvas, canvas 的内存占用大概是和其面积成正比的, 多了就爆内存了. 于是改为等弹幕生存周期结束后手动将其 canvas 设置为 null, Chrome 总算是不崩溃了. 然而因为极限测试的文件实在是太极限了, 同一时间在 stage 上显示的弹幕太多, 内存占用还是挺高的, FireFox 和 Edge 依然会被卡到.

　　最后是制作 demo 页面. 实时模式一般都是要和服务端配合的, 因为挂在 GitHub Pages 上就直接给样例代码了. 播放本地视频加载 B 站弹幕是我原先的项目 [Gulu](http://gulu.aws.af.cm/), 这次也差不多重写了一遍. 绑定 audio 模式下感觉容器太空不太好看, 顺便加上了频谱显示.
