/* 课程内容：模块与课时（知识体系参照《MATLAB程序设计基础与应用》） */
(function (global) {
  "use strict";
  const ML = global.ML || (global.ML = {});

  ML.course = {
    book: {
      title: "MATLAB程序设计基础与应用",
      authors: "刘帅奇、李会雅、赵杰 编著",
      publisher: "清华大学出版社",
      year: "2016年10月",
      isbn: "978-7-302-44918-8",
    },
    intro: [
      "这门课把 MATLAB 从零讲起，一共 7 个模块、32 节课。每一节都只有一个小目标，看完讲解就能在旁边直接敲代码，写错了系统会告诉你错在哪。",
      "平台的“运行”按钮背后是一个浏览器里的 MATLAB 常用子集：变量、矩阵、字符串、if/for/while/switch、函数、常用数学函数、绘图和数值计算都能跑。像 Simulink、符号工具箱、O 文件编译这类需要完整软件的功能，课程里会以“了解”的方式讲清楚考点，但不在网页里执行。",
      "建议顺序：模块 1 → 2 → 3 → 4 是必学的骨架，期末考试 80% 的分数在这里；模块 5、6 是常见大题；模块 7 用来考前突击。",
    ],
    modules: [
      {
        id: "m1",
        title: "模块 1 · 认识 MATLAB",
        desc: "先弄清楚 MATLAB 是什么、怎么和它对话，以及最基本的操作习惯。",
        lessons: [
          {
            id: "m1l1",
            title: "第 1 课　MATLAB 是什么，能做什么",
            goal: "用一句话说清 MATLAB 的特点，知道它在考试里主要考什么。",
            blocks: [
              { type: "text", text: "MATLAB 的名字来自 MATrix LABoratory（矩阵实验室）。它最本质的特点是：**一切数据都是矩阵**。哪怕你写 x = 5，MATLAB 内部也把它看成一个 1×1 的矩阵。" },
              { type: "text", text: "这解释了很多初学者觉得奇怪的现象：为什么乘号 * 是矩阵乘法、为什么删除元素要写成 A(i) = []、为什么 sum(A) 默认按列求和。理解了“一切皆矩阵”，后面的语法就顺理成章。" },
              { type: "list", title: "课程里 MATLAB 主要解决三类问题", items: [
                "数值计算：解方程、求特征值、求积分、数据拟合。",
                "数据处理：把一组实验数据算平均、找最大最小、排序、筛选。",
                "数据可视化：把结果画成曲线、柱状图、饼图，这是考试大题最常见的落脚点。",
              ] },
              { type: "code", caption: "试着运行第一段代码（点右侧“运行”）", code: "a = 3;\nb = 4;\nc = sqrt(a^2 + b^2)   % 勾股定理：3-4-5\ndisp('程序运行结束')" },
              { type: "note", text: "写了分号 ; 的语句不会在命令窗口显示结果，但变量已经算好了；不写分号就会把结果打印出来。这是 MATLAB 里最常用的小技巧。" },
            ],
            exercises: ["ex1_basic"],
          },
          {
            id: "m1l2",
            title: "第 2 课　变量、赋值与工作区",
            goal: "会定义变量、看懂 ans、会用 clc / clear / whos 管理内存。",
            blocks: [
              { type: "text", text: "赋值用等号 =，意思是“把右边的结果存到左边的名字里”。注意它和数学里的“相等”不是一回事：在 MATLAB 里 x = x + 1 是完全合法的，表示把 x 加 1 之后重新存回 x。" },
              { type: "list", title: "变量命名规则（考点）", items: [
                "必须以字母开头，后面可以跟字母、数字、下划线。",
                "区分大小写：A 和 a 是两个不同的变量。",
                "最长 63 个字符（了解即可）。",
                "不能用关键字做名字，例如 if、for、end、function。",
              ] },
              { type: "code", caption: "ans 与变量", code: "2 + 3        % 没有赋值，结果存到 ans\nans * 10     % ans 可以直接用\nx = 7;       % 有分号，不显示\ny = x * 2    % 显示 y = 14" },
              { type: "table", head: ["命令", "作用"], rows: [
                ["clc", "清空命令窗口（变量还在）"],
                ["clear", "清空所有变量"],
                ["clear x", "只删除变量 x"],
                ["who", "列出当前所有变量名"],
                ["whos", "列出变量名、大小、类型"],
              ] },
              { type: "warn", text: "常见错误：把 clear 当成“清屏”。清屏是 clc，clear 是把变量删掉；两个都用才干净。" },
            ],
            exercises: ["ex1_varname"],
          },
          {
            id: "m1l3",
            title: "第 3 课　帮助系统与看懂报错",
            goal: "会用 help 查函数，能读懂最常见的三种报错。",
            blocks: [
              { type: "text", text: "不确定一个函数怎么用的时候，在命令窗口输入 help 函数名，MATLAB 会给出说明。例如 help size、help max。" },
              { type: "list", title: "三种最常见的报错及含义", items: [
                "Undefined function or variable 'x'：变量 x 还没定义就被使用了，通常是拼写错误。",
                "Matrix dimensions must agree：两个矩阵大小不匹配，最常见的原因是该用 .* 的地方写成了 *。",
                "The expression to the left of the equals sign is not a valid target：赋值号左边写错了，例如把 5 = x 写反了。",
              ] },
              { type: "code", caption: "help 的用法", code: "help linspace\ndisp('---')\nhelp max" },
            ],
            exercises: ["ex1_help"],
          },
          {
            id: "m1l4",
            title: "第 4 课　脚本与程序的基本结构",
            goal: "理解 M 文件（脚本）的结构：注释、语句、分号、换行。",
            blocks: [
              { type: "text", text: "一段完整的 MATLAB 程序通常放在 .m 文件里，叫脚本（script）。脚本就是按顺序执行的一串语句，可以用 % 写注释，用 … 把一行拆成多行。" },
              { type: "code", caption: "带注释的脚本", code: "% 计算圆的面积和周长\nr = 2.5;              % 半径\nS = pi * r^2;         % 面积\nL = 2 * pi * r;       % 周长\nfprintf('半径 %.2f 的圆：面积 = %.3f，周长 = %.3f\\n', r, S, L)" },
              { type: "note", text: "读别人的程序时，先看注释和数据从哪来，再顺着变量往下追。考试大题也是这么给分的：步骤清楚比算得快更重要。" },
            ],
            exercises: ["ex1_circle"],
          },
        ],
      },
      {
        id: "m2",
        title: "模块 2 · 数组与矩阵（核心）",
        desc: "MATLAB 最核心的部分。期末考试绕不开矩阵的创建、取用和运算。",
        lessons: [
          {
            id: "m2l1",
            title: "第 5 课　创建向量与矩阵",
            goal: "熟练用 []、逗号空格、分号、冒号表达式、内置函数生成矩阵。",
            blocks: [
              { type: "text", text: "方括号用来构造矩阵。规律只有两条：**同一行元素之间用空格或逗号隔开，换行用分号**。" },
              { type: "code", caption: "四种最常见的创建方式", code: "row = [1 2 3 4]          % 行向量\ncol = [1; 2; 3]           % 列向量\nA = [1 2 3; 4 5 6]        % 2 行 3 列矩阵\nx = 1:5                   % 1 2 3 4 5\ny = 0:0.5:2               % 0 0.5 1 1.5 2\nz = linspace(0, 10, 5)    % 0 2.5 5 7.5 10" },
              { type: "table", head: ["写法", "含义", "例子"], rows: [
                ["a:b", "从 a 到 b，步长 1", "1:5 → 1 2 3 4 5"],
                ["a:s:b", "从 a 到 b，步长 s", "0:2:8 → 0 2 4 6 8"],
                ["linspace(a,b,n)", "把 [a,b] 等分成 n 个点", "linspace(0,1,3) → 0 0.5 1"],
                ["zeros(m,n)", "m×n 全 0 矩阵", "zeros(2,3)"],
                ["ones(m,n)", "m×n 全 1 矩阵", "ones(1,4)"],
                ["eye(n)", "n 阶单位矩阵", "eye(3)"],
                ["rand(m,n)", "m×n 随机数矩阵（0~1）", "rand(2,2)"],
              ] },
              { type: "warn", text: "考点提醒：冒号表达式的步长可以省略；如果 a > b 而步长为正，得到的是空矩阵（0 个元素），这在中英文试卷里都出现过。" },
            ],
            exercises: ["ex2_create", "ex2_range"],
          },
          {
            id: "m2l2",
            title: "第 6 课　下标、切片与 end",
            goal: "会用 A(i)、A(i,j)、A(:,j)、A(1:3) 取值，理解线性索引。",
            blocks: [
              { type: "text", text: "MATLAB 的下标从 **1** 开始，不是 0。取值格式是 A(行, 列)：给一个数就是线性下标（按列往下数），给两个数就是行列下标，冒号 : 表示“这一维全要”。" },
              { type: "code", caption: "取值的各种写法", code: "A = [1 2 3; 4 5 6; 7 8 9];\ndisp(A)              % 整个矩阵\ndisp(A(2,3))         % 第 2 行第 3 列 → 6\ndisp(A(:,2))         % 第 2 列全部 → 2 5 8\ndisp(A(2,:))         % 第 2 行全部 → 4 5 6\ndisp(A(1:2, 2:3))    % 左上 2×2 小块\ndisp(A(end))         % 最后一个元素 → 9\ndisp(A(end-1))       % 倒数第二个 → 8" },
              { type: "text", text: "线性下标很实用：A(3) 是第 3 个元素。因为 MATLAB 按**列**存储，3×3 矩阵里 A(3) 是第 3 行第 1 列，值是 7，而不是第 1 行第 3 列。" },
              { type: "code", caption: "线性索引与逻辑索引", code: "A = [1 2 3; 4 5 6; 7 8 9];\ndisp(A(3))            % 按列数第 3 个 → 7\ndisp(A(4))            % → 2\nv = [10 20 30 40];\ndisp(v(v > 15))       % 逻辑索引：取大于 15 的元素" },
              { type: "note", text: "逻辑索引 v(v > 15) 是考试热点：括号里是一个由 0 和 1 组成的判断结果，MATLAB 会把对应位置为 1 的元素挑出来。" },
            ],
            exercises: ["ex2_index", "ex2_logical"],
          },
          {
            id: "m2l3",
            title: "第 7 课　修改、拼接与删除元素",
            goal: "会给某个位置赋值、删除整行整列、把两个矩阵拼起来。",
            blocks: [
              { type: "code", caption: "修改与删除", code: "A = [1 2 3; 4 5 6];\nA(1,1) = 100;        % 改一个元素\nA(:,3) = [];          % 删除第 3 列\nA(2,:) = [0 0];       % 整行改写\ndisp(A)" },
              { type: "code", caption: "拼接：横向用空格/逗号，纵向用分号", code: "a = [1 2];\nb = [3 4];\nc = [a b]      % 横向拼成 1×4\nd = [a; b]     % 纵向拼成 2×2\ndisp(c); disp(d)" },
              { type: "warn", text: "删除元素有一个特殊写法 A(i) = []。空方括号 [] 表示空矩阵，MATLAB 把它解释为“把这个位置删掉”。删除之后矩阵会变短，原来的下标会改变，这是常见错误来源。" },
            ],
            exercises: ["ex2_modify"],
          },
          {
            id: "m2l4",
            title: "第 8 课　矩阵运算与数组运算（重点）",
            goal: "分清 * 与 .*、/ 与 ./、^ 与 .^ 的区别。这是考试最爱考的辨析点。",
            blocks: [
              { type: "text", text: "MATLAB 有两套运算：**矩阵运算**遵循线性代数规则，**数组运算**（带点的）是元素对元素逐个算。" },
              { type: "table", head: ["运算", "矩阵运算（不带点）", "数组运算（带点）"], rows: [
                ["乘法", "A*B 矩阵乘法，要求 A 的列数 = B 的行数", "A.*B 对应位置相乘，要求大小完全相同"],
                ["除法", "A/B 相当于 A*inv(B)", "A./B 对应位置相除"],
                ["乘方", "A^2 = A*A，A 必须是方阵", "A.^2 每个元素平方"],
              ] },
              { type: "code", caption: "一眼看出区别", code: "A = [1 2; 3 4];\ndisp(A * A)     % 矩阵乘法：7 10 / 15 22\ndisp(A .* A)    % 元素平方：1 4 / 9 16\ndisp(A .^ 2)    % 同上\ndisp(A .^ 0.5)  % 每个元素开平方" },
              { type: "warn", text: "最典型的错误：要给向量里每个数平方，写成 v^2 会报错（v 不是方阵）或算出完全错误的结果，正确写法是 v.^2。做题时先问自己一句：这一步是整体运算还是逐个元素运算？" },
            ],
            exercises: ["ex2_dot", "ex2_matrixmul"],
          },
          {
            id: "m2l5",
            title: "第 9 课　常用矩阵与统计函数",
            goal: "掌握 size/length/numel/sum/mean/max/min/sort/find 的用法。",
            blocks: [
              { type: "table", head: ["函数", "作用", "返回"], rows: [
                ["size(A)", "矩阵尺寸", "1×2 向量 [行数 列数]"],
                ["length(v)", "向量长度（矩阵取较长的维）", "一个数"],
                ["numel(A)", "元素总个数", "一个数"],
                ["sum(v)", "求和", "一个数"],
                ["sum(A)", "对矩阵每一列求和", "1×n 行向量"],
                ["sum(A,2)", "对矩阵每一行求和", "m×1 列向量"],
                ["mean(v)", "平均值", "一个数"],
                ["[m,i]=max(v)", "最大值和它的位置", "两个返回值"],
                ["sort(v)", "从小到大排序", "排序后的向量"],
                ["find(v)", "找出非零元素的位置", "下标向量"],
              ] },
              { type: "code", caption: "综合示例", code: "v = [6 2 9 4 2];\nfprintf('个数 %d，总和 %d，平均 %.2f\\n', numel(v), sum(v), mean(v));\n[mx, pos] = max(v);\nfprintf('最大值 %d 出现在第 %d 个位置\\n', mx, pos);\ndisp(sort(v))\ndisp(find(v > 4))" },
              { type: "note", text: "sum(A) 是按列求和，这一点和很多人的直觉相反，但它是矩阵“按列优先存储”的自然结果，务必记牢。" },
            ],
            exercises: ["ex2_stats", "ex2_sortfind"],
          },
        ],
      },
      {
        id: "m3",
        title: "模块 3 · 数据类型与字符串",
        desc: "数值、逻辑、字符三种基本类型，以及关系运算与逻辑运算。",
        lessons: [
          {
            id: "m3l1",
            title: "第 10 课　数值类型与显示格式",
            goal: "知道 double 是默认类型，会用 format 控制显示。",
            blocks: [
              { type: "text", text: "MATLAB 的数字默认是双精度浮点型（double）。不特别声明时，你写的每个数都是 double。" },
              { type: "list", title: "常用常量", items: [
                "pi → 圆周率",
                "Inf → 无穷大（例如 1/0）",
                "NaN → 非数（例如 0/0），表示“不是一个有效的数”",
                "eps → 浮点相对误差限（了解）",
              ] },
              { type: "code", caption: "常量与格式化输出", code: "disp(pi)\ndisp(Inf)\ndisp(NaN)\nx = 1/3;\nfprintf('默认：%f\\n', x)\nfprintf('两位小数：%.2f\\n', x)\nfprintf('科学计数：%e\\n', x)" },
            ],
            exercises: ["ex3_const"],
          },
          {
            id: "m3l2",
            title: "第 11 课　关系运算与逻辑运算",
            goal: "会写判断条件，会用 & | ~ 和 && || ，知道它们返回 0/1。",
            blocks: [
              { type: "text", text: "关系运算符包括 <、<=、>、>=、==（等于）、~=（不等于）。它们的结果是 1（真）或 0（假）。注意等于号是 ==，不是 =。" },
              { type: "table", head: ["运算符", "含义", "易错点"], rows: [
                ["==", "等于", "赋值是 =，判断相等是 =="],
                ["~=", "不等于", "不要写成 !="],
                ["& / |", "与 / 或（逐个元素）", "对矩阵运算时按元素逐个算"],
                ["&& / ||", "短路与 / 短路或", "只能用在标量判断上"],
                ["~", "取反", "~flag 表示“不是 flag”"],
              ] },
              { type: "code", caption: "条件判断示例", code: "x = 7;\ndisp(x > 5)              % 1\ndisp(x == 8)             % 0\ndisp(x > 0 && x < 10)    % 1\ndisp(~(x > 5))           % 0" },
              { type: "note", text: "考试里常见的写法：if x > 0 && x < 10 用短路与；而 v > 3 & v < 8 这种对向量逐个判断的要用 &。简单记：判断整个条件用 &&，处理一组数据用 &。" },
            ],
            exercises: ["ex3_logic"],
          },
          {
            id: "m3l3",
            title: "第 12 课　字符与字符串",
            goal: "会用单引号创建字符串，会拼接、比较、转换。",
            blocks: [
              { type: "text", text: "在 MATLAB 里字符串用**单引号**括起来：s = 'hello'。它本质上是一个字符数组，所以 s(1) 得到 'h'，s(1:3) 得到 'hel'。" },
              { type: "code", caption: "字符串的基本操作", code: "s = 'Matlab';\ndisp(s(1:3))                  % Mat\ndisp(length(s))               % 6\ndisp(upper(s))                % MATLAB\nt = ['Hello' ', ' 'world'];   % 拼接\ndisp(t)\ndisp(strcmp(s, 'Matlab'))     % 1\ndisp(strcmp(s, 'matlab'))     % 0（区分大小写）\ndisp(strcmpi(s, 'matlab'))    % 1（不区分大小写）" },
              { type: "table", head: ["函数", "作用"], rows: [
                ["num2str(x)", "把数字变成字符串（输出常用）"],
                ["str2num(s) / str2double(s)", "把字符串变成数字"],
                ["num2str 与 [] 拼接", "输出时把文字和数字连起来"],
                ["strrep(s,a,b)", "把 s 中所有的 a 替换成 b"],
                ["strfind(s,p)", "查找子串出现的位置"],
              ] },
              { type: "code", caption: "数字与字符串混合输出（考试高频）", code: "x = 5; y = 12.5;\ns = ['x = ' num2str(x) ', y = ' num2str(y)];\ndisp(s)\n% 也可以用 fprintf\nfprintf('x = %d, y = %.1f\\n', x, y)" },
              { type: "warn", text: "中英文混排时，中文在旧版 MATLAB 里占的字符宽度不同，用 num2str 拼接时容易对不齐。考试写 fprintf 更稳妥。" },
            ],
            exercises: ["ex3_string"],
          },
          {
            id: "m3l4",
            title: "第 13 课　元胞数组与结构体（了解）",
            goal: "知道它们是“能装不同类型数据”的容器，会最简单的读取。",
            blocks: [
              { type: "text", text: "普通矩阵只能装数字，而且要求形状规整。如果想把名字和分数放在一起，就要用元胞数组（cell）或结构体（struct）。" },
              { type: "list", title: "两种容器的区别", items: [
                "元胞数组：用 {} 创建和访问，每个格子可以放不同类型、不同大小的数据。",
                "结构体：用点号访问字段，像 s.name、s.score，适合表示“一条记录”。",
              ] },
              { type: "code", caption: "元胞数组", code: "c = {'张三', 95; '李四', 88};\ndisp(c{1,1})     % 取内容用 {} → 张三\ndisp(c{2,2})     % → 88" },
              { type: "code", caption: "结构体", code: "s.name = '张三';\ns.score = 95;\ndisp(s.name)\ndisp(s.score)" },
              { type: "note", text: "期末考试里元胞数组和结构体通常只考“取值/赋值”，把 {} 与 () 的区别记清楚就够了：() 取出来还是元胞，{} 取出来才是里面的内容。" },
            ],
            exercises: ["ex3_cell"],
          },
        ],
      },
    ],
  };
})(window);
