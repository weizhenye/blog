---
date: 2012-09-01 20:18:00 +0800
title: Hello World
layout: post
tags:
    - 
categories:
    - Personal
    - Tech
published: true
---

###折腾了几天终于搭建好博客了, 其间遇到了各种各样莫名其妙的问题, 做个记录.

<!-- more -->

* 由于刚接触GitHub, 对操作一头雾水, 使劲找上传按钮...
* 在Ubuntu下操作, 由于不熟悉, 一个cd命令都要查了再用.
* 不知道各个命令的意义, 只是复制粘贴, 然后弹出各种错误, 于是把.git文件夹删了重新来...
* 成功上传了index.html很高兴, 然后CNAME就死活传不上了, 于是把REPO删了重新来...
* 域名绑定, 什么A记录CNAME记录都不知道, 维基百科后一次次尝试, 终于出现了"Test"字样, 内牛满面...
* 找到个[主题](http://whouz.com/)很喜欢, 是Python写的[博客系统](https://github.com/whtsky/catsup), 用传不上就删了重来的节奏终于上传成功了, 然后打开网址无限404, 突然发现它的index.html不在根目录下, GitHub大概无法自动识别, 然后我就弄不来了. 于是又删了, 老老实实用Jekyll([pala](https://github.com/pala/pala.github.com)的主题).
* 长时间使用Windows习惯了, 安装GitHub for Windows, 安装到.NET framework 4.0时莫名卡住, 重来. 安装好后登入不上, 以为是网络问题, 关防火墙挂代理都上不去. 结果发现密码只能输10位, 一种坑爹感油然而生, 用撇脚的英语发邮件给GitHub的帮助中心, 发完后我才发现用谷歌拼音的英文模式输入密码时会有莫名其妙的问题, 比如最多输10位, 输入"i"时会显示2个字符. 然后GitHub的Staff回复说他密码20多位没问题的, 我又用撇脚的英语道歉. 关了谷歌拼音终于登入了, 把代码clone下来用记事本编辑, 点publish后一直显示publishing,又以为是网络问题, 关防火墙挂代理又上不去. 又用撇脚的英语问GitHub的Staff, 他没回我. 期间删REPO重来什么的若干次. 最后只好再到Ubuntu用终端. 后来再开GitHub for Windows时, publish按钮变not sync了, 只成功同步了一次, 之后都是内存冲突什么的无法同步了.
* 打开网页显示的是源代码, 我想到Linux和Windows的回车是不一样的, 应该就是记事本的原因. 从[pala](https://github.com/pala/pala.github.com)那里的代码复制来在网页编辑后就能正常显示了, 但是我手贱基本每个文件都点开用记事本编辑过, 结果一个一个复制...
* 由于把posts里的文件都删了, 上传时posts这个文件夹就没传上去, 新建了post, 里面放了Hello World, 又传不上了, 差点又想删了重来, 最终把所有命令都认真看了一遍, 能够不删文件地上传了. 传了之后怎么还是没文章啊? 结果发现posts文件名漏了个s...我能上传文件了, 但是还不会改文件名删文件. 我终于能肯定我是一个小白了.
* 我竟然没用fork而是把文件下载编辑了再上传我真是服了我自己了...

###Hello World写了一篇流水帐, 给以后的自己看看, 万一就有成就感了呢...