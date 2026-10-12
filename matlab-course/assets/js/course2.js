/* 课程内容（续）：模块 4 ~ 7 */
(function (global) {
  "use strict";
  const ML = global.ML || (global.ML = {});
  const extra = [
    {
      id: "m4",
      title: "模块 4 · 程序结构设计",
      desc: "顺序、选择、循环、函数——所有编程题的骨架，也是期末分值最高的部分。",
      lessons: [
        {
          id: "m4l1",
          title: "第 14 课　顺序结构与输入输出",
          goal: "会用 disp 和 fprintf 把结果按格式输出。",
          blocks: [
            { type: "text", text: "顺序结构就是从上到下一句句执行。把它写完整，等于拿到了基础分：输入数据 → 计算 → 输出结果。" },
            { type: "table", head: ["函数", "特点", "典型写法"], rows: [
              ["disp(x)", "简单显示，不能控制格式", "disp(S)"],
              ["fprintf(fmt, ...)", "按格式输出，能换行、能控制小数位", "fprintf('S=%.2f\\\\n', S)"],
              ["sprintf(fmt, ...)", "和 fprintf 相同，但结果存成字符串", "s = sprintf('%d', n)"],
            ] },
            { type: "code", caption: "输出格式对照", code: "r = 2; S = pi * r^2;\ndisp(S)\nfprintf('面积是 %.3f\\n', S)\nfprintf('%.0f 的平方是 %.0f\\n', 5, 25)" },
            { type: "list", title: "格式符号速记", items: [
              "%d 整数　%f 小数（默认 6 位）　%.2f 保留两位小数　%e 科学计数　%s 字符串　\\\\n 换行",
              "百分号后面的数和后面变量的个数要一一对应，多了少了都会输出乱码。",
            ] },
          ],
          exercises: ["ex4_output"],
        },
        {
          id: "m4l2",
          title: "第 15 课　if 选择结构",
          goal: "会写单分支、双分支、多分支 if，注意 end 不能漏。",
          blocks: [
            { type: "code", caption: "三种 if 写法", code: "x = 78;\nif x >= 60\n    disp('及格')\nend\n\nif x >= 90\n    disp('优秀')\nelseif x >= 80\n    disp('良好')\nelseif x >= 60\n    disp('及格')\nelse\n    disp('不及格')\nend" },
            { type: "list", title: "三个必须记住的细节", items: [
              "整个 if 结构最后一定有一个 end 配对。",
              "elseif 是一个词，不能写成 else if（那是嵌套的另一个 if）。",
              "判断相等用 ==，用 = 会报语法错误。",
            ] },
            { type: "warn", text: "多分支的执行顺序是从上往下，遇到第一个成立的条件就跳出去。所以条件要从严格到宽松排列，否则后面的分支永远执行不到。" },
          ],
          exercises: ["ex4_if"],
        },
        {
          id: "m4l3",
          title: "第 16 课　switch 多分支",
          goal: "会用 switch/case/otherwise 处理“等于某个值”的多分支。",
          blocks: [
            { type: "text", text: "当判断的是“等于几”而不是“大于小于”时，switch 比一堆 elseif 更清楚。" },
            { type: "code", caption: "switch 结构", code: "n = 3;\nswitch n\n    case 1\n        disp('星期一')\n    case 2\n        disp('星期二')\n    case 3\n        disp('星期三')\n    otherwise\n        disp('其它')\nend" },
            { type: "table", head: ["对比项", "if", "switch"], rows: [
              ["判断依据", "任意条件表达式", "与某个值相等"],
              ["分支数量", "适合 2~4 个分支", "适合多个并列取值"],
              ["结束标志", "end", "end"],
              ["default 分支", "else", "otherwise"],
            ] },
          ],
          exercises: ["ex4_switch"],
        },
        {
          id: "m4l4",
          title: "第 17 课　for 循环",
          goal: "会用 for i = 1:n 和 for k = 向量 两种写法。",
          blocks: [
            { type: "text", text: "for 适合“已知要重复多少次”的情况。基本形式是 for 变量 = 向量，里面每循环一次，变量就取向量里的下一个值。" },
            { type: "code", caption: "两个经典例子", code: "% 1 加到 100\ns = 0;\nfor i = 1:100\n    s = s + i;\nend\nfprintf('1+2+...+100 = %d\\n', s)\n\n% 遍历一个向量\nv = [3 7 2 9];\nmx = v(1);\nfor x = v\n    if x > mx\n        mx = x;\n    end\nend\nfprintf('最大值 = %d\\n', mx)" },
            { type: "code", caption: "循环里嵌套判断：求阶乘", code: "n = 5;\nf = 1;\nfor i = 1:n\n    f = f * i;\nend\nfprintf('%d! = %d\\n', n, f)" },
            { type: "warn", text: "初学时最容易忘记在循环体里更新累加变量，导致结果永远是初始值。写循环时按这个顺序检查：初始值 → 循环体 → 更新 → 结果。" },
          ],
          exercises: ["ex4_for", "ex4_nested"],
        },
        {
          id: "m4l5",
          title: "第 18 课　while 循环与 break / continue",
          goal: "会用 while 处理次数未知的循环，会用 break 提前跳出。",
          blocks: [
            { type: "text", text: "while 适合“不知道要循环多少次，只要条件成立就一直做”的场景。**循环体里一定要有让条件变化的语句**，否则就是死循环。" },
            { type: "code", caption: "while 求满足条件的最小 n", code: "% 求最小的 n，使 1+2+...+n > 50\nn = 0; s = 0;\nwhile s <= 50\n    n = n + 1;\n    s = s + n;\nend\nfprintf('最小的 n = %d，此时和为 %d\\n', n, s)" },
            { type: "table", head: ["语句", "作用"], rows: [
              ["break", "立刻结束整个循环，跳到循环后面的语句"],
              ["continue", "结束本次循环，直接进入下一次"],
              ["return", "结束当前函数的执行"],
            ] },
            { type: "code", caption: "break 与 continue", code: "for i = 1:10\n    if i == 4\n        continue     % 跳过 4\n    end\n    if i == 8\n        break        % 到 8 就停\n    end\n    fprintf('%d ', i)\nend\ndisp('结束')" },
          ],
          exercises: ["ex4_while"],
        },
        {
          id: "m4l6",
          title: "第 19 课　函数：定义、调用与多返回值",
          goal: "会写 function 文件，理解形参、实参和多个输出。",
          blocks: [
            { type: "text", text: "函数把一段代码打包起来反复使用。基本格式是 function [输出1, 输出2] = 函数名(输入1, 输入2)，最后也要有 end。" },
            { type: "code", caption: "一个输入一个输出", code: "function y = mySquare(x)\n    y = x^2;\nend\n\ndisp(mySquare(4))\ndisp(mySquare([1 2 3]))" },
            { type: "code", caption: "多个输出：同时返回面积和周长", code: "function [S, L] = circle(r)\n    S = pi * r^2;\n    L = 2 * pi * r;\nend\n\n[S, L] = circle(3);\nfprintf('面积 %.2f，周长 %.2f\\n', S, L)" },
            { type: "list", title: "函数要点", items: [
              "函数内部定义的变量只在函数内部有效，不会跑到工作区里。",
              "调用时用几个输出，就用几个变量去接：[a, b] = 函数名(...)。",
              "函数名和文件名要一致（真实 MATLAB 里的硬性要求）。",
              "没有输出参数的函数直接写 函数名(参数) 调用。",
            ] },
          ],
          exercises: ["ex4_func", "ex4_func2"],
        },
        {
          id: "m4l7",
          title: "第 20 课　常见错误与调试方法",
          goal: "掌握“分步排查”的方法，少丢冤枉分。",
          blocks: [
            { type: "list", title: "调试四步法", items: [
              "看报错的行号，先去那一行。",
              "把可疑的语句单独拎出来，去掉末尾分号看结果。",
              "在关键位置插入 disp(变量) 或 fprintf，检查中间值是否符合预期。",
              "检查维度：用 size() 确认每个矩阵到底几行几列。",
            ] },
            { type: "table", head: ["现象", "最可能的原因"], rows: [
              ["结果只有 1 个数字，本该是一组", "忘记用点运算，或把向量当标量算了"],
              ["Matrix dimensions must agree", "两个矩阵行列数不匹配"],
              ["下标超出范围", "下标从 0 开始写了，或用了删除元素前的旧下标"],
              ["程序一直不结束", "while 条件没有变化，死循环"],
              ["函数找不到", "函数名拼错，或函数没定义在文件里"],
            ] },
          ],
          exercises: ["ex4_debug"],
        },
      ],
    },
    {
      id: "m5",
      title: "模块 5 · 数据可视化",
      desc: "考试大题最常见的收尾要求：把结果画成图。",
      lessons: [
        {
          id: "m5l1",
          title: "第 21 课　plot 基本绘图",
          goal: "会用 plot(x,y) 画曲线，理解点对点连线。",
          blocks: [
            { type: "text", text: "plot 最基本的形式是 plot(x, y)，把 (x(i), y(i)) 这些点依次连起来。只给一组数据 plot(y) 时，横坐标自动取 1, 2, 3…" },
            { type: "code", caption: "画一条正弦曲线", code: "x = linspace(0, 2*pi, 100);\ny = sin(x);\nplot(x, y)" },
            { type: "code", caption: "一条命令画多条曲线", code: "x = linspace(0, 2*pi, 100);\nplot(x, sin(x), x, cos(x))" },
            { type: "table", head: ["线型", "标记", "颜色"], rows: [
              ["- 实线", "o 圆圈", "r 红"],
              ["-- 虚线", "* 星号", "b 蓝"],
              [": 点线", "+ 加号", "g 绿"],
              ["-. 点划线", "s 方块", "k 黑"],
            ] },
            { type: "code", caption: "指定线型和颜色", code: "x = 0:0.5:6;\nplot(x, x.^2, 'ro--')" },
          ],
          exercises: ["ex5_plot"],
        },
        {
          id: "m5l2",
          title: "第 22 课　图形的修饰",
          goal: "会给图形加标题、坐标轴说明、图例和网格。",
          blocks: [
            { type: "code", caption: "一套完整的绘图修饰", code: "x = linspace(0, 2*pi, 100);\nplot(x, sin(x), 'b-', x, cos(x), 'r--')\ntitle('正弦与余弦曲线')\nxlabel('x (弧度)')\nylabel('y')\nlegend('sin(x)', 'cos(x)')\ngrid on" },
            { type: "table", head: ["命令", "作用"], rows: [
              ["title('文字')", "图形标题"],
              ["xlabel / ylabel", "x、y 轴说明"],
              ["legend('a','b')", "图例，顺序和曲线顺序一致"],
              ["grid on / off", "显示或隐藏网格"],
              ["axis([x1 x2 y1 y2])", "手动指定坐标范围"],
              ["hold on", "在同一张图上继续画，不覆盖前面的"],
              ["subplot(m,n,p)", "把窗口分成 m×n 块，用第 p 块"],
            ] },
            { type: "note", text: "考试里画图题一般要求“画出曲线并标注标题和坐标轴”，把这些命令写全就能拿满分；legend 的字符串顺序一定要和 plot 里的曲线顺序对应。" },
          ],
          exercises: ["ex5_decorate"],
        },
        {
          id: "m5l3",
          title: "第 23 课　常用的其它二维图形",
          goal: "会用 bar、stem、scatter、pie、hist 画统计类图形。",
          blocks: [
            { type: "code", caption: "柱状图与火柴杆图", code: "x = 1:5;\ny = [12 25 18 30 22];\nbar(x, y)\ntitle('各月销量')" },
            { type: "code", caption: "散点图：观察两个变量的关系", code: "x = 1:10;\ny = [2 4 5 4 8 9 11 12 13 15];\nscatter(x, y)\nxlabel('广告投入')\nylabel('销售额')" },
            { type: "code", caption: "饼图与直方图", code: "subplot(1,2,1)\npie([30 20 50])\ntitle('占比')\nsubplot(1,2,2)\ndata = [1 2 2 3 3 3 4 4 5 5 5 5];\nhist(data, 5)\ntitle('分布')" },
            { type: "table", head: ["图形", "最适合表达"], rows: [
              ["plot", "连续变化的曲线，如温度随时间变化"],
              ["bar", "不同类别的数量对比"],
              ["stem", "离散序列，如数字信号"],
              ["scatter", "两组数据的相关关系"],
              ["pie", "各部分占总体的比例"],
              ["hist", "一组数据的分布情况"],
            ] },
          ],
          exercises: ["ex5_chart"],
        },
        {
          id: "m5l4",
          title: "第 24 课　子图与多图管理",
          goal: "会用 subplot 在一个窗口里排布多张图，会用 figure 新建窗口。",
          blocks: [
            { type: "code", caption: "2×2 的子图", code: "x = linspace(0, 2*pi, 60);\nsubplot(2,2,1); plot(x, sin(x)); title('sin')\nsubplot(2,2,2); plot(x, cos(x)); title('cos')\nsubplot(2,2,3); plot(x, x.^2);   title('x^2')\nsubplot(2,2,4); plot(x, exp(-x)); title('e^{-x}')" },
            { type: "note", text: "subplot(m,n,p) 里的 p 是**从左到右、从上到下**数的第几块。这个编号顺序是常考的细节。" },
          ],
          exercises: ["ex5_subplot"],
        },
      ],
    },
    {
      id: "m6",
      title: "模块 6 · 数值计算与应用",
      desc: "线性代数、多项式、插值拟合、数值积分——期末应用题的来源。",
      lessons: [
        {
          id: "m6l1",
          title: "第 25 课　多项式运算",
          goal: "会用系数向量表示多项式，会求值、求根、相乘。",
          blocks: [
            { type: "text", text: "MATLAB 用一个行向量表示多项式，按**降幂**排列系数。例如多项式 3x³ + 2x − 1 写成 p = [3 0 2 -1]，缺项必须补 0，这是最常见的失分点。" },
            { type: "code", caption: "求值与求根", code: "p = [1 0 -4];            % 表示 x^2 - 4\nx = [0 1 2 3];\ndisp(polyval(p, x))       % 代入求值\nr = roots(p);             % 求根\ndisp(r)                   % ±2\n\np2 = [1 -2];              % x - 2\nc = conv(p, p2);          % 多项式相乘\ndisp(c)" },
            { type: "table", head: ["函数", "作用"], rows: [
              ["polyval(p,x)", "把 x 代入多项式 p 求值"],
              ["roots(p)", "求多项式的根"],
              ["conv(a,b)", "多项式乘法（卷积）"],
              ["polyder(p)", "多项式求导"],
              ["polyfit(x,y,n)", "用 n 次多项式拟合数据，返回系数"],
            ] },
          ],
          exercises: ["ex6_poly"],
        },
        {
          id: "m6l2",
          title: "第 26 课　线性方程组与矩阵求逆",
          goal: "会用 \\ 解方程组，会算 det 和 inv。",
          blocks: [
            { type: "text", text: "解线性方程组 AX = B，MATLAB 里的写法是 X = A\\B。左除 \\ 是“解方程”，在数值上比先求逆再相乘更稳，考试里推荐直接用它。" },
            { type: "code", caption: "解方程组", code: "% 2x + y = 5\n% x - 3y = -1\nA = [2 1; 1 -3];\nB = [5; -1];\nX = A \\ B;\nfprintf('x = %.3f, y = %.3f\\n', X(1), X(2))" },
            { type: "code", caption: "行列式、逆矩阵", code: "A = [1 2; 3 4];\ndisp(det(A))      % -2\nB = inv(A);\ndisp(B)\ndisp(A * B)        % 单位矩阵" },
            { type: "warn", text: "det(A) 等于 0 时矩阵不可逆，inv 会报错或产生无穷大。做题时先算 det 判断一下，是很稳妥的检查习惯。" },
          ],
          exercises: ["ex6_solve", "ex6_inv"],
        },
        {
          id: "m6l3",
          title: "第 27 课　插值与数据拟合",
          goal: "会用 interp1 做插值、polyfit 做最小二乘拟合。",
          blocks: [
            { type: "text", text: "**插值**要求曲线穿过每一个已知点；**拟合**只要求整体趋势最接近。这是两个常被混淆的概念。" },
            { type: "code", caption: "一维插值", code: "x = [1 2 3 4 5];\ny = [2.1 4.0 6.2 7.9 10.1];\nxi = 2.5;\nyi = interp1(x, y, xi);\nfprintf('x = %.1f 处插值结果 %.3f\\n', xi, yi)" },
            { type: "code", caption: "最小二乘拟合（考试高频）", code: "x = [1 2 3 4 5];\ny = [2.1 4.0 6.2 7.9 10.1];\np = polyfit(x, y, 1);       % 一次多项式拟合\nfprintf('拟合直线：y = %.3f x + %.3f\\n', p(1), p(2))\nyf = polyval(p, x);\nplot(x, y, 'o', x, yf, '-')" },
            { type: "list", title: "怎么选", items: [
              "数据点少、要求精确穿过 → 插值 interp1。",
              "数据点多、有明显的实验误差 → 拟合 polyfit。",
              "polyfit 的第三个参数是多项式次数：1 是直线，2 是抛物线。",
            ] },
          ],
          exercises: ["ex6_fit"],
        },
        {
          id: "m6l4",
          title: "第 28 课　数值微积分",
          goal: "会用 diff 求差分/近似导数、用 trapz 求数值积分。",
          blocks: [
            { type: "code", caption: "差商近似导数", code: "x = 0:0.01:1;\ny = x.^2;\ndy = diff(y) ./ diff(x);     % 相邻两点的差商\nfprintf('在 x≈0.5 处导数 ≈ %.3f（理论值 1）\\n', dy(50))" },
            { type: "code", caption: "梯形法求定积分", code: "% 求 y = x^2 在 [0,1] 上的积分（理论值 1/3）\nx = linspace(0, 1, 1001);\ny = x.^2;\nI = trapz(x, y);\nfprintf('积分结果 ≈ %.5f\\n', I)" },
            { type: "warn", text: "diff 会让向量短一个元素，所以 diff(y)./diff(x) 得到的是相邻两点的差商，可以用它近似导数，但要记得长度变了。" },
          ],
          exercises: ["ex6_calc"],
        },
        {
          id: "m6l5",
          title: "第 29 课　符号计算与微分方程（了解）",
          goal: "知道这两块考什么，能在纸上写对命令。",
          blocks: [
            { type: "text", text: "下面这些需要 MATLAB 的符号数学工具箱或专门的求解器，网页里的练习环境跑不了，但概念和命令必须认识——期末常以简答题出现。" },
            { type: "table", head: ["内容", "主要命令", "说明"], rows: [
              ["定义符号变量", "syms x", "之后可以做符号运算"],
              ["符号求导", "diff(f, x)", "对 f 关于 x 求导"],
              ["符号积分", "int(f, x, a, b)", "求不定积分或定积分"],
              ["解方程", "solve(eq, x)", "求符号方程的根"],
              ["化简", "simplify(f) / expand(f)", "化简或展开表达式"],
              ["常微分方程", "[t,y] = ode45(@fun, [t0 tf], y0)", "数值求解一阶微分方程组"],
            ] },
            { type: "note", text: "ode45 的固定套路：先写一个函数描述 y' = f(t,y)，再用 ode45 调用它。记住这个结构，简答题就能写出来。" },
          ],
          exercises: ["ex6_read"],
        },
      ],
    },
    {
      id: "m7",
      title: "模块 7 · 期末冲刺",
      desc: "把高频考点、易错点和应试策略集中过一遍。",
      lessons: [
        {
          id: "m7l1",
          title: "第 30 课　高频考点清单",
          goal: "知道哪些内容一定会考，按优先级复习。",
          blocks: [
            { type: "list", title: "必考（几乎每次都有）", items: [
              "矩阵的创建、切片、逻辑索引：A(:,2)、A(1:3)、A(A>5)。",
              "点运算与矩阵运算的区别：.* ./ .^ 与 * / ^。",
              "for 循环写累加、累乘、找极值、统计个数。",
              "if/elseif/else 的多分支判断。",
              "函数文件的定义与调用，包括多返回值。",
              "plot 画图 + title/label/legend/grid 修饰。",
            ] },
            { type: "list", title: "高频（定期出现）", items: [
              "while 循环求解满足条件的最小规模。",
              "sum/mean/max/min/sort/find/size/length 的灵活使用。",
              "字符串拼接与 num2str、fprintf 格式化输出。",
              "线性方程组 A\\B、行列式 det、逆矩阵 inv。",
              "多项式 polyval/roots/polyfit 与数据拟合。",
              "数值积分 trapz、差分 diff。",
            ] },
            { type: "list", title: "了解即可（简答题）", items: [
              "元胞数组与结构体的区别、switch 与 if 的选择。",
              "符号计算 syms/diff/int/solve 的基本用法。",
              "ode45 求解微分方程的结构。",
            ] },
          ],
          exercises: ["ex7_summary"],
        },
        {
          id: "m7l2",
          title: "第 31 课　易错点与陷阱",
          goal: "避开最常见的失分点。",
          blocks: [
            { type: "table", head: ["陷阱", "正确做法"], rows: [
              ["下标从 0 开始写", "MATLAB 下标从 1 开始"],
              ["v^2 想给每个元素平方", "v.^2"],
              ["A*B 想对应位置相乘", "A.*B"],
              ["判断相等写成 =", "判断相等用 =="],
              ["下标存着旧值却删了元素", "删除后重新确认下标"],
              ["for 循环里忘了更新累加变量", "按“初值-循环体-更新”三步检查"],
              ["fprintf 格式符和变量个数不一致", "格式符个数 = 变量个数"],
              ["漏写 end", "if/for/while/switch/function 都要配对 end"],
            ] },
            { type: "note", text: "做编程题时，先在草稿纸上写出输入、处理、输出三行；再写代码。程序写完后用一组小数据手工验算，这是最有效的自检方法。" },
          ],
          exercises: ["ex7_trap"],
        },
        {
          id: "m7l3",
          title: "第 32 课　考前 30 分钟速览",
          goal: "用最短时间把语法骨架再过一遍。",
          blocks: [
            { type: "code", caption: "一张图记住所有骨架（可直接运行）", code: "% 1 变量与矩阵\nA = [1 2 3; 4 5 6];\nv = 1:0.5:3;\n\n% 2 取值\nfirst = A(1,1);\ncol2  = A(:,2);\nbig   = v(v > 2);\n\n% 3 运算\nsum_col = sum(A);\nsquare  = v .^ 2;\n\n% 4 选择与循环\ns = 0;\nfor i = 1:5\n    if mod(i,2) == 1\n        s = s + i;\n    end\nend\n\n% 5 输出\nfprintf('总和 %d，奇数位置平方和 %d\\n', sum(v), s)\n\n% 6 画图\nplot(v, v.^2, 'b-o')\ntitle('v 的平方')\nxlabel('v')\ngrid on" },
            { type: "note", text: "能闭着眼睛把上面这段默写出来，模块 1~4 就基本过关了。剩下的时间用来练模拟卷和错题。" },
          ],
          exercises: ["ex7_final"],
        },
      ],
    },
  ];

  ML.course.modules = ML.course.modules.concat(extra);
})(window);
