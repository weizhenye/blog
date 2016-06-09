---
date: 2015-06-10 20:00:00 +0800
title: 启用 Pjax 遇到的问题
layout: post
tags:
    - pjax
categories:
    - Tech
published: true
---
挺早就看到过 pjax 技术了, 现在也有越来越多的网站采用, 然而我一直没有实际用过. 这几天突然想到, pjax 本质上就是用 ajax 拿到数据并改变当前页面与目标页面不同的地方, 然后把 url 改成目标页面的就好了, 事实上并不一定要后端为 pjax 特别处理. 只不过一般的实现都是后端对 pjax 的请求只给需要变化的数据以节省流量. 于是决定拿我的 blog 练练手.

<!-- more -->

基本思路就是监听所有指向站内的链接, 然后 ajax 拿到目标页面的数据, 替换 title 以及 header 与 footer 之间的正文内容, 改一下 url, 最后处理一下前进后退按钮的逻辑. 在 GitHub 上有个[现成的项目](https://github.com/MoOx/pjax), 然而我是准备自己写练练手, 就不用那个了. 实际写起来非常的简单, 40 行就写完了. 只是对如何把文本解析为 DOM 树有些纠结, 肯定不能用正则去解析, 看了那个项目的源码才知道有 `document.implementation.createHTMLDocument()` 这个方法.

然后准备加上加载时的动画效果. 这个也有现成的项目 [pace](https://github.com/HubSpot/pace). 我不需要这么多功能, 写两行代码就够了. 本地测试时发现数据太小网速太快, 第一次触发 progress 事件就已经加载完了同时触发 loaded 事件导致没有动画效果, 限制网速后勉强能看到. 实际中并没有什么卵用.

Push 到 GitHub 后, 不管怎么限网速都没有动画效果, 然后发现 progress 事件里的 total 一直是 0. 搜了下发现原来 total 是直接取响应头里的 Content-Length 的值, 而 GitHub Pages 的响应头没有 Content-Length. 我的博客是直接 A 记录到 GitHub Pages 的服务器 192.30.252.153 的, 响应头没有 Content-Length, 其他某些页面是经过 Fastly 的 CDN 比如 103.245.222.133, 响应头是有 Content-Length 的, 应该是 Fastly 提供的. 于是给 GitHub 发邮件询问, 他让我 curl 结果发给他, 然后我意识到自己太轻率地就去询问别人了, 还没测试过不同浏览器不同网络环境之类的就给别人增添麻烦. curl 测试是有 Content-Length 的, 而浏览器下还是没有, 猜测是 GitHub 根据 User-Agent 或请求头里的其他数据返回不同的内容. 对比发现浏览器多了一句 [Transfer-Encoding: chunked](https://zh.wikipedia.org/wiki/%E5%88%86%E5%9D%97%E4%BC%A0%E8%BE%93%E7%BC%96%E7%A0%81). 之后看了[一](https://www.imququ.com/post/transfer-encoding-header-in-http.html)[些](https://stackoverflow.com/questions/2419281/content-length-header-versus-chunked-encoding)文章, 大概结论就是 Content-Length 与 Transfer-Encoding 互斥, 应当能提供 Content-Length 就提供. 过了一天我都弄懂了 GitHub 回复说是因为采用了 Transfer-Encoding: chunked, 然后我就建议 GitHub 采用 Content-Length, 目前还没回复.
