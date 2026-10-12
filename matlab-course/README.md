# MATLAB 从零到期末

一个可以在浏览器里直接运行的 MATLAB 自学网站：**看讲解 → 敲代码 → 系统当场判分**。

知识体系参照《MATLAB程序设计基础与应用》（刘帅奇、李会雅、赵杰 编著，清华大学出版社，ISBN 978-7-302-44918-8），面向零基础、目标是通过期末考试的学生。

## 特点

- **不用装 MATLAB**。页面里内置了一个用 JavaScript 写的 MATLAB 常用子集解释器，打开网页就能写代码、看结果。
- **每节课都能动手**。讲解旁边的代码块点「运行」即出结果，绘图会直接画在页面上。
- **39 道自动判题练习**。自己敲代码，点「检查答案」；写错了会给出具体提示（例如「c 应该是 10，你算出来的是 5」），并附「看提示」「参考答案」。
- **期末模拟卷**。10 道选择题 + 5 道读程序写结果 + 5 道编程题，提交后自动评分并逐题给出解析。
- **语法速查表**。考前 10 分钟过一遍的 6 张表。
- **进度本地保存**。练习做对会打勾，关掉浏览器再打开还在。

## 使用方法

### 方式一：直接打开（最简单）

下载或克隆本项目，双击 `index.html` 即可。不需要安装任何东西，Edge / Chrome / Firefox 都可以。

### 方式二：在线访问

如果本仓库开启了 GitHub Pages，直接访问 `https://<用户名>.github.io/<仓库名>/` 即可。

### 方式三：本地起个服务（可选）

```bash
python -m http.server 8000
# 然后浏览器打开 http://localhost:8000/
```

## 课程结构

7 个模块，共 32 节课：

| 模块 | 内容 | 课时 |
| --- | --- | --- |
| 1 | 认识 MATLAB：界面、变量、帮助系统、脚本 | 4 |
| 2 | 数组与矩阵（核心）：创建、索引、修改、矩阵运算与点运算、统计函数 | 5 |
| 3 | 数据类型与字符串：数值类型、关系与逻辑运算、字符串、元胞与结构体 | 4 |
| 4 | 程序结构设计：if / switch / for / while / break / 函数 / 调试 | 7 |
| 5 | 数据可视化：plot、图形修饰、常用二维图形、子图 | 4 |
| 6 | 数值计算与应用：多项式、线性方程组、插值与拟合、数值微积分、符号计算（了解） | 5 |
| 7 | 期末冲刺：高频考点、易错点、考前速览 | 3 |

## 解释器支持的范围

**支持**：数值与矩阵、字符串、`if / elseif / else`、`switch / case / otherwise`、`for`、`while`、`break / continue`、函数定义与多返回值、逻辑索引、点运算，以及下列常用函数。

`size` `length` `numel` `ndims` `zeros` `ones` `eye` `rand` `randi` `randn` `linspace` `logspace` `magic`
`reshape` `repmat` `transpose` `cat` `diag` `tril` `triu` `flipud` `fliplr` `rot90` `circshift`
`sum` `prod` `cumsum` `cumprod` `mean` `median` `std` `var` `max` `min` `sort` `find` `any` `all` `isequal` `norm`
`det` `inv` `rank` `trace` `eig` `dot` `cross` `diff`
`polyval` `polyfit` `roots` `conv` `polyder` `interp1` `trapz`
`sin` `cos` `tan` `asin` `acos` `atan` `atan2` `exp` `log` `log2` `log10` `sqrt` `abs` `sign` `floor` `ceil` `fix` `round` `mod` `rem` `hypot` `power`
`disp` `fprintf` `sprintf` `num2str` `int2str` `mat2str` `str2num` `str2double` `strcat` `strcmp` `strcmpi` `strtrim` `upper` `lower` `strrep` `strfind` `blanks` `char` `double`
`plot` `plot3` `bar` `stem` `scatter` `pie` `hist` `subplot` `figure` `hold` `grid` `box` `axis` `xlim` `ylim` `title` `xlabel` `ylabel` `legend` `clf` `close` `colormap`
`help` `who` `whos` `clear` `clc` `format` `error` `warning` `tic` `toc` `eval`

**不支持**（课程中标注为「了解」，只讲考点和写法，不在网页里执行）：

- Simulink 仿真
- 符号数学工具箱：`syms`、`diff`（符号）、`int`、`solve`、`simplify`
- `input()` 键盘输入
- O 文件编译、与外部语言混合编程
- 高维数组（3 维及以上）

> 说明：本环境的目标是教学与练习，数值精度和边界行为不完全等同于 MathWorks MATLAB。写作业和考试请以真实 MATLAB 为准。

## 目录结构

```
matlab-course/
├── index.html              入口页面
├── assets/
│   ├── styles.css          样式
│   └── js/
│       ├── core.js         数值/矩阵/元胞/结构体与运算规则
│       ├── lexer.js        词法分析
│       ├── parser.js       语法分析（生成语法树）
│       ├── builtins.js     内置函数库
│       ├── interp.js       解释器（执行语法树、索引、赋值、绘图数据采集）
│       ├── plot.js         把绘图数据渲染成 SVG
│       ├── course.js       课程内容：模块 1~3
│       ├── course2.js      课程内容：模块 4~7
│       ├── exercises.js    练习题库：模块 1~3
│       ├── exercises2.js   练习题库：模块 4~7
│       ├── exam.js         期末模拟卷
│       └── app.js          页面交互与进度管理
└── README.md
```

## 自己加课和加题

课程内容都是普通 JavaScript 对象，不需要构建工具。

**加一节课**：在 `assets/js/course.js` 或 `course2.js` 里，往某个模块的 `lessons` 数组里加一项：

```js
{
  id: "m2l6",
  title: "第 10 课　xxx",
  goal: "一句话说明本课要会什么。",
  blocks: [
    { type: "text",  text: "支持 **加粗** 和 `行内代码`。" },
    { type: "code",  caption: "示例", code: "a = 1:5;\ndisp(a)" },   // 可运行
    { type: "note",  text: "小提示" },
    { type: "warn",  text: "易错点" },
  ],
  exercises: ["ex2_new"],   // 引用练习 id
}
```

**加一道练习**：在 `assets/js/exercises.js` 或 `exercises2.js` 里加一项，`verify` 会拿到运行结果，返回 `{ ok, msg }`：

```js
{
  id: "ex2_new",
  title: "题目名",
  prompt: "题干",
  starter: "起始代码",
  hints: ["提示一", "提示二"],
  solution: "参考答案",
  verify: function (res) {
    const e = ML.exHelp.failErr(res); if (e) return e;      // 代码报错
    if (res.locals.x !== 10) return { ok: false, msg: "x 应该是 10" };
    return { ok: true, msg: "正确！" };
  },
}
```

`res` 里有 `text`（控制台输出）、`locals`（变量表）、`figures`（图形数据）、`error`（错误信息）。

## 授权

MIT License，见 [LICENSE](LICENSE)。你可以自由用于学习、教学、二次修改和分发。

教材书名、作者、出版社、ISBN 仅用于说明知识体系来源，相关权利归原作者与出版社所有。本项目与出版社、作者及 MathWorks 无隶属关系，MATLAB 是 MathWorks 的注册商标。
