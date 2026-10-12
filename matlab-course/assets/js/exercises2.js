/* 练习题（2/2）：模块 4~7 */
(function (global) {
  "use strict";
  const ML = global.ML || (global.ML = {});
  const H = ML.exHelp;

  const LIST = [
    {
      id: "ex4_output",
      title: "fprintf 格式化输出",
      prompt: "单价 price = 12.5、数量 num = 4。计算总价 total，再用 fprintf 输出一行“总价 = 50.00 元”。",
      starter: "price = 12.5;\nnum = 4;\ntotal = \nfprintf('总价 = %.2f 元\\n', total)\n",
      hints: ["total = price * num。"],
      solution: "price = 12.5;\nnum = 4;\ntotal = price * num;\nfprintf('总价 = %.2f 元\\n', total)\n",
      verify: function (res) {
        const e = H.failErr(res); if (e) return e;
        if (!H.near(H.numOf(res, "total"), 50)) return { ok: false, msg: "total 应该是 50。" };
        if (res.text.indexOf("50.00") < 0) return { ok: false, msg: "输出里应该出现 50.00，别忘用 %.2f 控制小数位。" };
        return { ok: true, msg: "格式控制正确。" };
      },
    },
    {
      id: "ex4_if",
      title: "成绩等级判断",
      prompt: "score = 76。用 if/elseif/else 判断等级：90 以上“优秀”，80 以上“良好”，60 以上“及格”，否则“不及格”，结果存入 grade。",
      starter: "score = 76;\nif score >= 90\n    grade = '优秀';\n% 继续写 elseif ... end\nend\n",
      hints: ["条件要从高到低排：>=90、>=80、>=60、else。"],
      solution: "score = 76;\nif score >= 90\n    grade = '优秀';\nelseif score >= 80\n    grade = '良好';\nelseif score >= 60\n    grade = '及格';\nelse\n    grade = '不及格';\nend\ndisp(grade)\n",
      verify: function (res) {
        const e = H.failErr(res); if (e) return e;
        return res.locals.grade === "及格" ? { ok: true, msg: "分支顺序正确。" } : { ok: false, msg: "76 分应该是 '及格'，你得到 " + JSON.stringify(res.locals.grade) + "。" };
      },
    },
    {
      id: "ex4_switch",
      title: "用 switch 输出星期",
      prompt: "n = 5，用 switch 把对应的星期名存入 day（1→星期一 … 5→星期五，其它→“输入有误”）。",
      starter: "n = 5;\nswitch n\n    case 1\n        day = '星期一';\n% 继续写\nend\ndisp(day)\n",
      hints: ["每个 case 写一个取值。", "最后用 otherwise 兜底。"],
      solution: "n = 5;\nswitch n\n    case 1\n        day = '星期一';\n    case 2\n        day = '星期二';\n    case 3\n        day = '星期三';\n    case 4\n        day = '星期四';\n    case 5\n        day = '星期五';\n    otherwise\n        day = '输入有误';\nend\ndisp(day)\n",
      verify: function (res) {
        const e = H.failErr(res); if (e) return e;
        return res.locals.day === "星期五" ? { ok: true, msg: "switch 写对了。" } : { ok: false, msg: "n=5 应该得到 '星期五'，你得到 " + JSON.stringify(res.locals.day) + "。" };
      },
    },
    {
      id: "ex4_for",
      title: "for 循环求和与平均",
      prompt: "用 for 循环遍历 v = [88 92 79 95 61]，求总分 sum_v 和平均分 avg_v。",
      starter: "v = [88 92 79 95 61];\nsum_v = 0;\nfor x = v\n    % 累加\nend\navg_v = \n",
      hints: ["循环体里写 sum_v = sum_v + x;", "平均 = 总分 / length(v)"],
      solution: "v = [88 92 79 95 61];\nsum_v = 0;\nfor x = v\n    sum_v = sum_v + x;\nend\navg_v = sum_v / length(v);\nfprintf('总分 %d，平均 %.2f\\n', sum_v, avg_v)\n",
      verify: function (res) {
        const e = H.failErr(res); if (e) return e;
        if (H.numOf(res, "sum_v") !== 415) return { ok: false, msg: "总分应该是 415，你得到 " + H.numOf(res, "sum_v") + "。" };
        if (!H.near(H.numOf(res, "avg_v"), 83)) return { ok: false, msg: "平均分应该是 83。" };
        return { ok: true, msg: "循环累加写对了。" };
      },
    },
    {
      id: "ex4_nested",
      title: "循环嵌套",
      prompt: "用两层 for 循环输出 1×1 到 3×3 的乘法表，每一项用 fprintf('%d*%d=%-3d', i, j, i*j) 输出，每行结束换行。",
      starter: "for i = 1:3\n    for j = 1:3\n        % 输出 i*j\n    end\n    fprintf('\\n');\nend\n",
      hints: ["在注释位置写 fprintf('%d*%d=%-3d', i, j, i*j);"],
      solution: "for i = 1:3\n    for j = 1:3\n        fprintf('%d*%d=%-3d', i, j, i*j);\n    end\n    fprintf('\\n');\nend\n",
      verify: function (res) {
        const e = H.failErr(res); if (e) return e;
        const compact = res.text.replace(/\s+/g, "");
        if (compact.indexOf("3*3=9") < 0) return { ok: false, msg: "输出里应该出现 3*3=9，检查 fprintf 是否写在内层循环里。" };
        if (compact.indexOf("1*1=1") < 0) return { ok: false, msg: "输出里应该出现 1*1=1。" };
        return { ok: true, msg: "嵌套循环输出正确。" };
      },
    },
    {
      id: "ex4_while",
      title: "while 求满足条件的最小 n",
      prompt: "用 while 循环求最小的整数 n，使 1+2+…+n 大于 100，结果存到 n。",
      starter: "n = 0;\ns = 0;\nwhile s <= 100\n    % 更新 n 和 s\nend\nfprintf('n = %d\\n', n)\n",
      hints: ["循环体里先 n = n + 1; 再 s = s + n;"],
      solution: "n = 0;\ns = 0;\nwhile s <= 100\n    n = n + 1;\n    s = s + n;\nend\nfprintf('n = %d，此时和为 %d\\n', n, s)\n",
      verify: function (res) {
        const e = H.failErr(res); if (e) return e;
        return H.numOf(res, "n") === 14 ? { ok: true, msg: "正确：n = 14 时和为 105 > 100。" } : { ok: false, msg: "答案应该是 14，你得到 " + H.numOf(res, "n") + "。" };
      },
    },
    {
      id: "ex4_func",
      title: "写一个函数",
      prompt: "定义函数 myArea(w, h) 返回矩形面积，然后计算 myArea(3, 4.5) 存入变量 A。",
      starter: "function S = myArea(w, h)\n    % 函数体\nend\n\nA = \n",
      hints: ["函数体只有一句：S = w * h;", "调用写成 myArea(3, 4.5)。"],
      solution: "function S = myArea(w, h)\n    S = w * h;\nend\n\nA = myArea(3, 4.5);\n",
      verify: function (res) {
        const e = H.failErr(res); if (e) return e;
        return H.near(H.numOf(res, "A"), 13.5) ? { ok: true, msg: "函数定义和调用都正确。" } : { ok: false, msg: "A 应该是 13.5，你得到 " + H.numOf(res, "A") + "。" };
      },
    },
    {
      id: "ex4_func2",
      title: "多返回值函数",
      prompt: "定义函数 stat3(v) 同时返回最大值 mx、最小值 mn、平均值 av。用 v = [4 9 2 7] 调用并打印结果。",
      starter: "function [mx, mn, av] = stat3(v)\n    % 写三行\nend\n\nv = [4 9 2 7];\n[mx, mn, av] = \n",
      hints: ["mx = max(v); mn = min(v); av = mean(v);", "调用：[mx, mn, av] = stat3(v);"],
      solution: "function [mx, mn, av] = stat3(v)\n    mx = max(v);\n    mn = min(v);\n    av = mean(v);\nend\n\nv = [4 9 2 7];\n[mx, mn, av] = stat3(v);\nfprintf('max=%d min=%d avg=%.2f\\n', mx, mn, av)\n",
      verify: function (res) {
        const e = H.failErr(res); if (e) return e;
        if (H.numOf(res, "mx") !== 9 || H.numOf(res, "mn") !== 2) return { ok: false, msg: "最大值应为 9、最小值应为 2。" };
        if (!H.near(H.numOf(res, "av"), 5.5)) return { ok: false, msg: "平均值应为 5.5。" };
        return { ok: true, msg: "多返回值函数写对了。" };
      },
    },
    {
      id: "ex4_debug",
      title: "找错并改对",
      prompt: "下面代码想求 1 到 5 的平方和（结果是 55），但它有错，请改正。",
      starter: "ss = 1;\nfor i = 1:5\n    ss = ss + i^2;\nend\ndisp(ss)\n",
      hints: ["累加变量的初始值应该是 0。", "0+1+4+9+16+25 = 55。"],
      solution: "ss = 0;\nfor i = 1:5\n    ss = ss + i^2;\nend\ndisp(ss)\n",
      verify: function (res) {
        const e = H.failErr(res); if (e) return e;
        return H.numOf(res, "ss") === 55 ? { ok: true, msg: "改对了，平方和为 55。" } : { ok: false, msg: "ss 应该是 55，你得到 " + H.numOf(res, "ss") + "。检查累加变量的初始值。" };
      },
    },
    {
      id: "ex5_plot",
      title: "画一条曲线",
      prompt: "在 0 到 2π 之间取 100 个点，画出 y = sin(x)。",
      starter: "x = linspace(0, 2*pi, 100);\ny = \nplot(x, y)\n",
      hints: ["y = sin(x); 这里对向量整体求正弦，直接写 sin(x) 即可。"],
      solution: "x = linspace(0, 2*pi, 100);\ny = sin(x);\nplot(x, y)\n",
      verify: function (res) {
        const e = H.failErr(res); if (e) return e;
        const y = H.matOf(res, "y");
        if (!y || y[0].length !== 100) return { ok: false, msg: "y 应该有 100 个点。" };
        if (!res.figures.length) return { ok: false, msg: "没有检测到图形，检查是否调用了 plot。" };
        return { ok: true, msg: "曲线画出来了，看看图形区的效果。" };
      },
    },
    {
      id: "ex5_decorate",
      title: "给图形加标注",
      prompt: "画 y = x.^2（x 取 -3 到 3 共 50 个点），标题“抛物线”，x 轴标签“x”，y 轴标签“y”，并打开网格。",
      starter: "x = linspace(-3, 3, 50);\ny = x.^2;\nplot(x, y)\n% 加 title / xlabel / ylabel / grid\n",
      hints: ["title('抛物线')、xlabel('x')、ylabel('y')、grid on"],
      solution: "x = linspace(-3, 3, 50);\ny = x.^2;\nplot(x, y)\ntitle('抛物线')\nxlabel('x')\nylabel('y')\ngrid on\n",
      verify: function (res) {
        const e = H.failErr(res); if (e) return e;
        if (!res.figures.length) return { ok: false, msg: "没有检测到图形。" };
        const f = res.figures[0];
        if (f.title !== "抛物线") return { ok: false, msg: "标题应该是“抛物线”。" };
        if (!f.grid) return { ok: false, msg: "还没有打开网格，写 grid on。" };
        return { ok: true, msg: "标注齐全。" };
      },
    },
    {
      id: "ex5_chart",
      title: "选择合适的图形",
      prompt: "五个学生成绩 [75 88 92 60 81]，用柱状图表示，标题“成绩对比”，x 轴标签“学生编号”，y 轴标签“分数”。",
      starter: "score = [75 88 92 60 81];\n% 用 bar 画图并加标注\n",
      hints: ["bar(1:5, score) 或 bar(score)。"],
      solution: "score = [75 88 92 60 81];\nbar(1:5, score)\ntitle('成绩对比')\nxlabel('学生编号')\nylabel('分数')\n",
      verify: function (res) {
        const e = H.failErr(res); if (e) return e;
        if (!res.figures.length) return { ok: false, msg: "没有检测到图形，检查是否调用了 bar。" };
        const f = res.figures[0];
        if (!f.series.length || f.series[0].type !== "bar") return { ok: false, msg: "这道题要求用柱状图 bar。" };
        if (f.title !== "成绩对比") return { ok: false, msg: "标题应该是“成绩对比”。" };
        return { ok: true, msg: "图形类型和标注都对。" };
      },
    },
    {
      id: "ex5_subplot",
      title: "子图排布",
      prompt: "用 subplot 在 1×2 布局里，左边画 y = x，右边画 y = x.^3（x 取 -2 到 2 共 40 个点）。",
      starter: "x = linspace(-2, 2, 40);\nsubplot(1,2,1)\nplot(x, x)\nsubplot(1,2,2)\n% 画第二个图\n",
      hints: ["第二块里写 plot(x, x.^3)。"],
      solution: "x = linspace(-2, 2, 40);\nsubplot(1,2,1)\nplot(x, x)\ntitle('y = x')\nsubplot(1,2,2)\nplot(x, x.^3)\ntitle('y = x^3')\n",
      verify: function (res) {
        const e = H.failErr(res); if (e) return e;
        const f = res.figures[0];
        if (!f) return { ok: false, msg: "没有检测到图形。" };
        if (f.series.length < 2) return { ok: false, msg: "应该画出两条曲线，现在只检测到 " + f.series.length + " 条。" };
        return { ok: true, msg: "两个子图都画好了。" };
      },
    },
    {
      id: "ex6_poly",
      title: "多项式求值与求根",
      prompt: "多项式 p(x) = x³ − 6x² + 11x − 6。写出系数向量 p，求 x = 0、1、2、3 处的值存到 y，并求根存到 r。",
      starter: "p = \nx = [0 1 2 3];\ny = \nr = \n",
      hints: ["系数按降幂写：[1 -6 11 -6]。", "polyval(p, x) 求值，roots(p) 求根。"],
      solution: "p = [1 -6 11 -6];\nx = [0 1 2 3];\ny = polyval(p, x);\nr = roots(p);\ndisp(y)\ndisp(r)\n",
      verify: function (res) {
        const e = H.failErr(res); if (e) return e;
        const y = H.matOf(res, "y");
        if (!y || y[0][0] !== -6 || y[0][1] !== 0 || y[0][3] !== 0) return { ok: false, msg: "代入结果应该是 -6、0、0、0。" };
        const r = H.matOf(res, "r");
        if (!r || r.length !== 3) return { ok: false, msg: "三次多项式应该有 3 个根。" };
        return { ok: true, msg: "求值和求根都正确。" };
      },
    },
    {
      id: "ex6_solve",
      title: "解线性方程组",
      prompt: "解方程组 2x + y − z = 8；−3x − y + 2z = −11；−2x + y + 2z = −3。解存入 X，并取出 x、y、z 三个分量。",
      starter: "A = [2 1 -1; -3 -1 2; -2 1 2];\nB = [8; -11; -3];\nX = \nx = \ny = \nz = \n",
      hints: ["用左除：X = A \\ B", "X(1)、X(2)、X(3) 分别是 x、y、z。"],
      solution: "A = [2 1 -1; -3 -1 2; -2 1 2];\nB = [8; -11; -3];\nX = A \\ B;\nx = X(1);\ny = X(2);\nz = X(3);\nfprintf('x=%.2f y=%.2f z=%.2f\\n', x, y, z)\n",
      verify: function (res) {
        const e = H.failErr(res); if (e) return e;
        if (!H.near(H.numOf(res, "x"), 2, 1e-6) || !H.near(H.numOf(res, "y"), 3, 1e-6) || !H.near(H.numOf(res, "z"), -1, 1e-6)) {
          return { ok: false, msg: "解应该是 x=2, y=3, z=-1，你得到 x=" + H.numOf(res, "x") + ", y=" + H.numOf(res, "y") + ", z=" + H.numOf(res, "z") + "。" };
        }
        return { ok: true, msg: "方程组解对了。" };
      },
    },
    {
      id: "ex6_inv",
      title: "行列式与逆矩阵",
      prompt: "A = [4 3; 6 5]。求行列式存到 d，求逆矩阵存到 B，并验证 A*B 是单位矩阵存到 I。",
      starter: "A = [4 3; 6 5];\nd = \nB = \nI = \n",
      hints: ["det(A)、inv(A)、A*inv(A)。"],
      solution: "A = [4 3; 6 5];\nd = det(A);\nB = inv(A);\nI = A * B;\ndisp(d)\ndisp(B)\ndisp(I)\n",
      verify: function (res) {
        const e = H.failErr(res); if (e) return e;
        if (!H.near(H.numOf(res, "d"), 2)) return { ok: false, msg: "行列式应该等于 2。" };
        const I = H.matOf(res, "I");
        if (!I || !H.near(I[0][0], 1) || !H.near(I[0][1], 0) || !H.near(I[1][1], 1)) return { ok: false, msg: "A*inv(A) 应该是单位矩阵。" };
        return { ok: true, msg: "行列式和逆矩阵都正确。" };
      },
    },
    {
      id: "ex6_fit",
      title: "最小二乘拟合",
      prompt: "x = [1 2 3 4 5]，y = [2.2 3.9 6.1 7.8 10.2]。用一次多项式拟合得到系数 p，并打印拟合直线表达式。",
      starter: "x = [1 2 3 4 5];\ny = [2.2 3.9 6.1 7.8 10.2];\np = \nfprintf('y = %.4f x + %.4f\\n', p(1), p(2))\n",
      hints: ["polyfit(x, y, 1) 返回 [斜率 截距]。"],
      solution: "x = [1 2 3 4 5];\ny = [2.2 3.9 6.1 7.8 10.2];\np = polyfit(x, y, 1);\nfprintf('y = %.4f x + %.4f\\n', p(1), p(2))\n",
      verify: function (res) {
        const e = H.failErr(res); if (e) return e;
        const p = H.matOf(res, "p");
        if (!p || p[0].length !== 2) return { ok: false, msg: "p 应该有两个系数。" };
        if (!H.near(p[0][0], 2, 0.05)) return { ok: false, msg: "斜率应该接近 2，你得到 " + p[0][0] + "。" };
        return { ok: true, msg: "拟合完成，斜率约 2。" };
      },
    },
    {
      id: "ex6_calc",
      title: "数值积分",
      prompt: "用梯形法求 y = x² 在 [0, 3] 上的定积分（取 1001 个点）存到 I。理论值是 9。",
      starter: "x = linspace(0, 3, 1001);\ny = x.^2;\nI = \nfprintf('积分 ≈ %.5f\\n', I)\n",
      hints: ["trapz(x, y)。"],
      solution: "x = linspace(0, 3, 1001);\ny = x.^2;\nI = trapz(x, y);\nfprintf('积分 ≈ %.5f\\n', I)\n",
      verify: function (res) {
        const e = H.failErr(res); if (e) return e;
        return H.near(H.numOf(res, "I"), 9, 1e-3) ? { ok: true, msg: "积分结果约等于 9。" } : { ok: false, msg: "结果应该接近 9，你得到 " + H.numOf(res, "I") + "。" };
      },
    },
    {
      id: "ex6_read",
      title: "符号计算命令（阅读题）",
      prompt: "请在注释里写出下列操作对应的 MATLAB 命令：1) 定义符号变量 x；2) 对 x^2 求导；3) 求 x^2 在 [0,1] 上的积分；4) 解方程 x^2-4=0；5) 用 ode45 解微分方程。然后让 ok = 1。",
      starter: "% 1) syms x\n% 2) \n% 3) \n% 4) \n% 5) \nok = 0;\n",
      hints: ["求导 diff，积分 int，解方程 solve。", "ode45 的写法：[t,y] = ode45(@fun,[t0 tf],y0)"],
      solution: "% 1) syms x\n% 2) diff(x^2, x)\n% 3) int(x^2, x, 0, 1)\n% 4) solve(x^2 - 4 == 0, x)\n% 5) [t,y] = ode45(@fun, [0 10], y0)\nok = 1;\n",
      verify: function (res) {
        const e = H.failErr(res); if (e) return e;
        return H.numOf(res, "ok") === 1 ? { ok: true, msg: "记住这五个命令，简答题就能拿分。" } : { ok: false, msg: "把 ok 改成 1 表示你完成了这一题。" };
      },
    },
    {
      id: "ex7_summary",
      title: "综合：统计与筛选",
      prompt: "grades = [58 72 65 90 45 83 77 96 61 52]。求及格人数 passNum、最高分 mx、最低分 mn、平均分 avg、以及不及格成绩向量 fail。",
      starter: "grades = [58 72 65 90 45 83 77 96 61 52];\npassNum = \nmx = \nmn = \navg = \nfail = \n",
      hints: ["及格人数：numel(grades(grades >= 60))", "不及格成绩：grades(grades < 60)"],
      solution: "grades = [58 72 65 90 45 83 77 96 61 52];\npassNum = numel(grades(grades >= 60));\nmx = max(grades);\nmn = min(grades);\navg = mean(grades);\nfail = grades(grades < 60);\nfprintf('及格 %d 人，最高 %d，最低 %d，平均 %.2f\\n', passNum, mx, mn, avg)\ndisp(fail)\n",
      verify: function (res) {
        const e = H.failErr(res); if (e) return e;
        if (H.numOf(res, "passNum") !== 7) return { ok: false, msg: "及格人数应该是 7 人。" };
        if (H.numOf(res, "mx") !== 96 || H.numOf(res, "mn") !== 45) return { ok: false, msg: "最高分 96，最低分 45。" };
        if (!H.near(H.numOf(res, "avg"), 69.9)) return { ok: false, msg: "平均分应该是 69.9。" };
        const f = H.matOf(res, "fail");
        if (!f || f[0].join(",") !== "58,45,52") return { ok: false, msg: "不及格成绩应该是 58、45、52。" };
        return { ok: true, msg: "综合题完成，这就是考试最常见的题型。" };
      },
    },
    {
      id: "ex7_trap",
      title: "避开下标与点运算的陷阱",
      prompt: "下面代码想求 v = [1 2 3 4] 的元素平方和（结果 30），但它写错了，请改正。",
      starter: "v = [1 2 3 4];\ntotal = 0;\nfor i = 1:5\n    total = total + v(i)^2;\nend\ndisp(total)\n",
      hints: ["循环次数超过了向量长度，i = 5 时 v(5) 不存在。"],
      solution: "v = [1 2 3 4];\ntotal = 0;\nfor i = 1:4\n    total = total + v(i)^2;\nend\ndisp(total)\n",
      verify: function (res) {
        const e = H.failErr(res); if (e) return e;
        return H.numOf(res, "total") === 30 ? { ok: true, msg: "结果是 30，正确。注意循环次数不能超过向量长度。" } : { ok: false, msg: "结果应该是 30，你得到 " + H.numOf(res, "total") + "。" };
      },
    },
    {
      id: "ex7_final",
      title: "模拟大题：数据处理与绘图",
      prompt: "t = 0:5，v = [0 2 5 9 14 20]。1) 用 diff 求相邻两点的平均加速度存到 a；2) 求速度最大值 mx 和它出现的时刻 tt；3) 画出 v-t 曲线并加标题、坐标轴标签和网格。",
      starter: "t = 0:5;\nv = [0 2 5 9 14 20];\na = \n[mx, pos] = \ntt = \nplot(t, v, 'b-o')\n% 加标注\n",
      hints: ["a = diff(v) ./ diff(t)", "pos 是位置，对应时刻 tt = t(pos)"],
      solution: "t = 0:5;\nv = [0 2 5 9 14 20];\na = diff(v) ./ diff(t);\n[mx, pos] = max(v);\ntt = t(pos);\nfprintf('最大速度 %d m/s，出现在第 %d 秒\\n', mx, tt)\ndisp(a)\nplot(t, v, 'b-o')\ntitle('速度-时间曲线')\nxlabel('时间 t (s)')\nylabel('速度 v (m/s)')\ngrid on\n",
      verify: function (res) {
        const e = H.failErr(res); if (e) return e;
        const a = H.matOf(res, "a");
        if (!a || a[0].length !== 5) return { ok: false, msg: "a 应该有 5 个值。" };
        if (!H.near(a[0][0], 2) || !H.near(a[0][4], 6)) return { ok: false, msg: "平均加速度应该是 2 3 4 5 6。" };
        if (H.numOf(res, "mx") !== 20) return { ok: false, msg: "最大速度是 20。" };
        if (H.numOf(res, "tt") !== 5) return { ok: false, msg: "最大速度出现在第 5 秒。" };
        if (!res.figures.length) return { ok: false, msg: "还没有画出图形。" };
        if (!res.figures[0].grid || !res.figures[0].title) return { ok: false, msg: "图形还缺标题或网格。" };
        return { ok: true, msg: "完整的模拟大题，做得很标准。" };
      },
    },
  ];

  ML.exercises = ML.exercises.concat(LIST);
  const map = {};
  ML.exercises.forEach(function (e) { map[e.id] = e; });
  ML.exerciseById = function (id) { return map[id]; };
})(window);
