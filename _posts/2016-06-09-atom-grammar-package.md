---
date: 2016-06-09 23:40:00 +0800
title: Atom 语法高亮插件编写指南
layout: post
tags:
    - Atom
    - grammar
    - 语法高亮
    - 插件
    - 教程
categories:
    - Tech
published: true
---
[Atom](https://atom.io/) 想必无需多作介绍了，是一款除了启动运行慢之外，其它部分都挺优秀的编辑器。由于我在写一个解析渲染 ASS 字幕的 JavaScript 库——[ASS.js](https://github.com/weizhenye/ASS)，经常要查看 `.ass` 文件。然而面对一大片白花花的代码很不舒服，Atom 上又没有现成的 ASS 语法高亮插件，于是决定自己写一个。

<!-- more -->

##### 目录结构

那么语法高亮插件该怎么写呢？[官方文档](http://flight-manual.atom.io/hacking-atom/sections/package-word-count/)有讲到如何创建一个普通的插件，而对于语法高亮插件，最快的熟悉方法是查看已有的插件，例如 Atom 官方维护的 [language-json](https://github.com/atom/language-json)。语法高亮插件一般有如下目录结构（其中 `ssa` 为语言名称）：

```
language-ssa
├── grammars
│   └── ssa.cson
├── spec
│   └── ssa-spec.coffee
├── LICENSE.md
├── README.md
└── package.json
```

由于 language-ass 名称已经被占用了，于是我取名为 language-ssa，ASS 字幕是由 SSA 字幕添加高级特性后发展来的，两者语法基本一致 。其中 `ssa.cson` 就是写语法正则的主文件，后缀 CSON 是个和 JSON 一样的数据交换语言，但它是 CoffeeScript 的子集，看下[该项目](https://github.com/bevry/cson)的 README 基本就会了；`ssa-spec.coffee` 是测试文件，虽然不是必须的，但靠谱的项目都应该有测试；`LICENSE.md` 和  `README.md` 在 Atom 的插件页面会有链接和展示；`package.json` 和普通的 Node.js 项目一样，它的 `engines` 字段多了指定 Atom 的版本，看下[样例](https://github.com/weizhenye/language-ssa/blob/master/package.json)就清楚了。

在本地开发测试时，直接把 language-ssa 文件夹放到 `~/.atom/packages/` 目录下并重载（<kbd>Ctrl+Alt+R</kbd>） Atom 后就会生效了。

##### 语法规则

Atom 语法文件的各个字段与 TextMate 编辑器的语法文件相同，TextMate 给出了较为详细的[文档](https://manual.macromates.com/en/language_grammars)，下面是补充介绍，可以对照着 [language-ssa](https://github.com/weizhenye/language-ssa/blob/master/grammars/ssa.cson) 的语法文件来阅读：

* `scopeName` 字段，它应当是每种语言语法的唯一名字，一般取名为 `source.ssa` 或 `text.ssa`，前一半一般是固定的，后一半是该语言的名称。而当该语言是另一个语言的扩展时，例如 markdown 是 HTML 的扩展，可以取名为 `text.html.markdown`，这样在当前 scope 的规则匹配完后，会匹配 `text.html` scope 的规则，相当于调用了 HTML 的语法规则。
* `name` 字段，在 Atom 右下角显示的语言名称。
* `fileTypes` 字段，是个数组，指定要生效于哪些后缀的文件。
* `firstLineMatch` 字段，是一条正则，如果该正则可以匹配某后缀不明的文件的第一行，那么就当作该语言来解析。
* `foldingStartMarker` 和 `foldingStopMarker` 字段，都是正则，匹配到的位置会有一个折叠标记，可以将代码块折叠。但是我在测试时发现 Atom 会自动根据缩进来产生折叠标记，这两个字段是如何影响的还不太清楚。
* `patterns` 字段，是一个数组，这里是写语法正则的地方，里面是若干个 pattern 对象，姑且称之为「规则」，其中可以包含以下字段：
  + `comment` 字段，注释，无实际效果，描述该「规则」。
  + `name` 字段，是由若干个 `.` 分隔的字符串，这些名称将作为被匹配部分的 class 名。假如其值为 `comment.line.character.semicolon.ssa`，被匹配到的文本是 `; 分号注释`，那么可以按下 <kbd>Ctrl+Alt+I</kbd> 打开 DevTools，查看到对应生成的 HTML 为 `<span class="comment line character semicolon ssa">; 分号注释</span>`。

    代码高亮的颜色效果是由 Theme 决定的，Theme 事实上就是根据这些 class 来添加颜色。后面会提到一些约定俗成的 class 名。
  + `match` 字段，是一条正则，被它匹配到的文本将被加上 `name` 字段的 class。它只能匹配单行文本，并且只匹配一次。
  + `captures` 字段，是一个对象，其 key 为一个数字，表示分配 `match` 字段中的捕获，如果为 `0` 则表示整体，这与 JS 中 String 的 match 方法表现一致；其 value 可以是一个 `name` 字段，直接为分配到的部分命名，也可以是一个 `patterns` 字段，然后对分配到的部分继续写「规则」。
  + `include` 字段，它的值有三种情况：
    1. 调用另一个语言，例如值为 `'text.html'` 时，表示在当前「规则」中应用 HTML 的语法。
    2. 调用该「规则」自身，值为 `'$self'`，可以递归地去匹配文本。
    3. 调用一个「仓库」，值为井号开头的 `'#repoName'`，后面会讲到在 `repository` 字段中可以为一个「规则」命名。
  + `begin` 和 `end` 字段，都是正则，匹配 `begin` 开始到 `end` 结束的一段文本，它可以匹配多行文本，并且不能和 `match` 字段一起使用。
  + `patterns` 字段，当有 `begin` 和 `end` 时可以嵌套 `patterns` 来匹配它们之间的文本。
  + `contentName` 字段，它和 `name` 字段类似，但是只给 `begin` 与 `end` 之间的文本加上 class。
  + `beginCaptures` 和 `endCaptures` 字段，与 `captures` 字段类似，分别是 `begin` 和 `end` 的捕获。

  这些「规则」**按顺序执行**下来，每条「规则」**每次只匹配一次**，一次循环后，回到第一条「规则」，选择当前行中**还未被匹配的文本**进行第二轮匹配，以此循环，直到全部都匹配完或者**超出循环次数**。Atom 中一个 patterns 默认的循环次数貌似是 99 次，超出后就不处理该匹配范围内的文本了。一般我们打开压缩过的 JS 文件时，滚动条拖到行尾发现是没有高亮的，就是这个原因。
* `repository` 字段，是一个对象，用来命名一些需要重复调用的「规则」，可以被 `include` 字段调用。

##### 正则用法

上面提到的语法正则与 JavaScript 中的 RegExp 对象用法基本一致，不过还是有一些差异的。~~就正则本身来说，ES5 和 ES6 还不支持 lookbehind，不能使用 `(?<=exp)` 和 `(?<!exp)`，语法正则也一样；~~但是语法正则都要写成字符串的形式，所以要对特殊符号进行转义，例如匹配一个数字，要写成 `\\d`。

**Update：在 Atom 中，正则解析使用的是 [oniguruma](https://github.com/atom/node-oniguruma) 引擎，并不是使用 JavaScript 的正则，oniguruma 是支持 lookbehind 的，完整的语法看[这份文档](https://github.com/kkos/oniguruma/blob/master/doc/RE)。**

而写成字符串后就无法像原生正则那样加修饰符了，在 TextMate 找到[正则的文档](https://manual.macromates.com/en/regular_expressions)，发现可以通过 `(?imx-imx)` 和 `(?imx-imx:subexp)` 的方式开启或关闭对应的修饰符。例如 `(?i)abc(?-i)def`，`(?i)` 表示它之后的匹配忽略大小写，`(?-i)` 表示取消忽略大小写，也就是该正则里 `abc` 可以大小写，`def` 必须小写。这种写法是对修饰符的后面起作用，还可以写成 `(?i:abc)def` 这样的形式，只对 `abc` 这个局部起作用。`(?m)` 表示支持匹配多行，虽然 TextMate 的文档是这么说，但是我测试发现在 Atom 中是无效的，对于单条正则来说是没办法匹配多行的，要想匹配多行只能使用 `begin` 和 `end` 的方式。`(?x)` 则可以忽略正则中的空白字符直接量（空格、Tab、换行），而有反斜杠转义的空白字符则不会被忽略，这样当正则过长时就可以换行书写了，也可以给正则的某一部分加上注释，详细的介绍可以看下[这篇文章](http://www.regular-expressions.info/freespacing.html)。如果有多个修饰符可以写到一起，例如 `(?ix)abc`。RegExp 对象中的 g 修饰符是不支持的，语法正则每次只匹配一次。

##### 命名约定

语法高亮主要是将代码解析为多个部分，然后给不同语义的部分加上不同的颜色。虽然各个部分可以随意命名生成 class，但是一个 Theme 不可能为每一个语言都专门写一套配色，所以会有一些约定俗成的名称，一般的 Theme 都会支持这些命名约定：

* `comment`：注释
  + `line`：单行注释
    - `double-slash`：`//` 注释
    - `double-dash`：`--` 注释
    - `number-sign`：`#` 注释
    - `percentage`：`%` 注释
    - `character`：其他类型的注释
  + `block`：块级注释
    - `documentation`：注释文档
* `constant`：各种形式的常量
  + `numeric`：数字常量，例如 `42`, `6.626e-34`, `0xFF`
  + `character`：字符常量，例如 `&lt;`
    - `escape`：转义字符常量，例如 `\n`
  + `language`：语言本身提供的特殊常量，例如 `true`, `false`, `null`
  + `other`：其他常量，例如 CSS 中的颜色
* `invalid`：无效的语法
  + `illegal`：非法的语法
  + `deprecated`：弃用的语法
* `keyword`：关键字
  + `control`：流程控制关键字，例如 `continue`, `while`, `return`
  + `operator`：操作符关键字，例如 `and`, `&&`
  + `other`：其他关键字
* `markup`：适用于标记语言，例如 HTML、markdown
  + `underline`：下划线
    - `link`：链接
  + `bold`：粗体
  + `heading`：章节的头部，可以在后面跟一个等级，例如 `<h2>...</h2>` 可以是 `markup.heading.2.html`
  + `italic`：斜体
  + `list`：列表
    - `numbered`：有序列表
    - `unnumbered`：无序列表
  + `quote`：引用
  + `raw`：原始文本，例如一段代码。
  + `other`：其他标记结构体
* `meta`：元通常用来标记文档中的较大的一部分。标记为元的部分一般是没有样式的，通常某一块文本如果语义或结构上是同一部分，就可以标记为元。例如声明函数的一行可以是 `meta.function`，然后它的子集是 `storage.type`, `entity.name.function`, `variable.parameter` 之类的。
* `punctuation`：标点，这个在 TextMate 文档中没有提到，但是实际中有使用。不过似乎并没有样式。
  + `definition`：定义符，例如 `:`
  + `separator`：分隔符，例如 `,`
  + `terminator`：结束符，例如 `;`
* `storage`：有关「存放」的东西
  + `type`：类型，例如 `class`, `function`, `int`, `var`
  + `modifier`：修饰符，例如 `static`, `final`, `abstract`
* `string`：字符串
  + `quoted`：有引号字符串
    - `single`：单引号字符串，例如 `'foo'`
    - `double`：双引号字符串，例如 `"foo"`
    - `triple`：三引号字符串，例如 `"""Python"""`
    - `other`：其他引号字符串，例如 `$'shell'`
  + `unquoted`：无引号字符串
  + `interpolated`：插值字符串，例如 `` `foo: ${foo}` ``
  + `regexp`：正则表达式
  + `other`：其他字符串
* `support`：由框架或库提供的东西
  + `function`：由框架或库提供的函数，例如 Objective-C 中的 `NSLog`
  + `class`：由框架或库提供的类
  + `type`：由框架或库提供的类型，可能只会在 C 派生的语言中用到，有 `typedef` 和 `struct` 的那些语言。大多数语言使用类而非类型。
  + `constant`：由框架或库提供的常量（魔术数字）
  + `variable`：由框架或库提供的变量，例如 AppKit 中的 `NSApp`
  + `other`：除了上面提到的
* `variable`：变量
  + `parameter`：参数
  + `language`：语言本身提供的变量，例如 `this`, `super`, `self`
  + `other`：其他变量

通常，命名时应以上述的约定开头，并且能满足子项的都应写上去；之后一般会根据当前的部分写一个自定义的名称，虽然可能对样式不起作用，但额外的信息可以将它标识为特定的语义；最后一般都是跟一个语言名称。例如 ASS 文件中区块头部 `[Script Info]`，其中的 `[` 可以命名为 `punctuation.definition.section.begin.ssa`，约定部分是 `punctuation.definition`，自定义部分是 `section.begin`，最后是语言名称。

##### 测试集成

Atom 插件是使用 [Jasmine](https://github.com/jasmine/jasmine) 测试框架的，对语法高亮插件的测试主要用到了 [Atom Grammar API](https://atom.io/docs/api/latest/Grammar)，Atom 官方维护的[语法高亮插件](https://github.com/atom?utf8=%E2%9C%93&query=language)都有写测试，具体写法可以参考。

Atom 插件的持续集成依然可以参考 Atom 官方项目，一般 `.travis.yml` 文件[长这样](https://github.com/atom/language-json/blob/master/.travis.yml)就行了，它会跑一遍 `spec` 目录下的测试，有配置 lint 的话就再跑一遍 lint。如果不用 Travis CI，可以根据[这个项目](https://github.com/atom/ci)部署其他服务。

##### 发布插件

发布插件时首先要检查名称是否可用，一般语法高亮插件都是命名为 `language-语言名` 的。然后需要一个公开的 Git 仓库来放置代码，一般都是开源在 GitHub 上，并在 `package.json` 中写明仓库地址。当第一次 push 到 Git 时，`package.json` 中的 `version` 一般是 `0.0.0`。然后登录 [https://atom.io/account](https://atom.io/account) 获得 API token，在终端输入 `apm login --token YOUR_TOKEN` 就可以准备发布了：

```bash
$ apm publish minor
Preparing and tagging a new version done
Pushing v0.1.0 tag done
Publishing language-ssa@v0.1.0 done
```

运行上述命令后，apm 会自动给 `version` 的次版本加一，然后生成一个 message 为 `Prepare 0.1.0 release` 的 commit，并加上一个 `v0.1.0` 的 Tag，一起 push 到 GitHub 上。之后就可以在 `https://atom.io/packages/language-语言名` 上看到已成功发布了。

##### 总结

本文大致介绍了 Atom 语法高亮插件的编写流程和方式，并根据我在开发中遇到的情况对 TextMate 的文档进行了补充。但本文应当作为参考，在上手开发之前还需多看看已有的项目，才能理解并解决问题。
