/* 练习题（1/2）：模块 1~3 */
(function (global) {
  "use strict";
  const ML = global.ML || (global.ML = {});

  function failErr(res) {
    return res.error ? { ok: false, msg: "代码没有运行成功：" + res.error } : null;
  }
  function numOf(res, name) {
    const v = res.locals[name];
    if (typeof v === "number") return v;
    if (typeof v === "boolean") return v ? 1 : 0;
    if (v && v.data && v.data.length && v.data[0].length) return v.data[0][0];
    return NaN;
  }
  function matOf(res, name) {
    const v = res.locals[name];
    return v && v.data ? v.data : null;
  }
  function near(a, b, tol) {
    return Math.abs(a - b) <= (tol === undefined ? 1e-6 : tol);
  }
  function needVar(res, name) {
    if (res.locals[name] === undefined) return { ok: false, msg: "没有找到变量 " + name + "，检查一下是不是忘记赋值了。" };
    return null;
  }
  function needOut(res, text) {
    if (res.text.replace(/\s+/g, "").indexOf(text.replace(/\s+/g, "")) < 0) {
      return { ok: false, msg: "输出里没有看到 “" + text + "”，检查是否用 disp 或 fprintf 输出了结果。" };
    }
    return null;
  }

  ML.exHelp = { failErr: failErr, numOf: numOf, matOf: matOf, near: near, needVar: needVar, needOut: needOut };

  ML.exercises = [
    {
      id: "ex1_basic",
      title: "用变量算一道题",
      prompt: "已知直角三角形两条直角边 a = 6、b = 8，先把两条边分别赋给变量 a 和 b，再把斜边长度算出来存到变量 c，并显示 c。",
      starter: "a = 6;\nb = 8;\nc = % 在这里写出计算斜边的表达式\n",
      hints: ["斜边 = 两条直角边平方和再开方，开方用 sqrt()。", "平方可以写成 a^2。"],
      solution: "a = 6;\nb = 8;\nc = sqrt(a^2 + b^2)\n",
      verify: function (res) {
        const e = failErr(res); if (e) return e;
        const n = needVar(res, "c"); if (n) return n;
        return near(numOf(res, "c"), 10) ? { ok: true, msg: "正确！斜边 c = 10。" } : { ok: false, msg: "c 应该是 10，你算出来的是 " + numOf(res, "c") + "。" };
      },
    },
    {
      id: "ex1_varname",
      title: "判断变量名是否合法",
      prompt: "下面三个名字 myVar、x2、_temp 都是合法的变量名，请把它们分别赋值为 1、2、3；再写一个 2x = 4，观察报错之后把它注释掉。最后让 count 等于 3。",
      starter: "myVar = 1;\nx2 = 2;\n_temp = 3;\n% 2x = 4;   % 这一行以数字开头，不合法\ncount = 0;   % 把合法变量的个数填进来\n",
      hints: ["变量名不能以数字开头，所以 2x 不合法。", "下划线开头在 MATLAB 里是允许的。"],
      solution: "myVar = 1;\nx2 = 2;\n_temp = 3;\n% 2x = 4;  % 非法：不能以数字开头\ncount = 3;\n",
      verify: function (res) {
        const e = failErr(res); if (e) return e;
        const n = needVar(res, "count"); if (n) return n;
        return numOf(res, "count") === 3 ? { ok: true, msg: "正确。记住：以数字开头的名字不合法。" } : { ok: false, msg: "count 应该是 3。" };
      },
    },
    {
      id: "ex1_help",
      title: "用 help 查函数",
      prompt: "用 help 查看 numel 的用法，然后用 numel 求出向量 v = [4 8 15 16 23 42] 的元素个数并存到变量 n。",
      starter: "v = [4 8 15 16 23 42];\nhelp numel\nn = \n",
      hints: ["numel(v) 返回 v 的元素个数。"],
      solution: "v = [4 8 15 16 23 42];\nn = numel(v)\n",
      verify: function (res) {
        const e = failErr(res); if (e) return e;
        const n = needVar(res, "n"); if (n) return n;
        return numOf(res, "n") === 6 ? { ok: true, msg: "正确，一共 6 个元素。" } : { ok: false, msg: "元素个数应该是 6。" };
      },
    },
    {
      id: "ex1_circle",
      title: "圆的面积与周长",
      prompt: "半径 r = 2.5，求圆的面积 S 和周长 L，并用 fprintf 输出“面积 = 19.635，周长 = 15.708”（保留三位小数）。",
      starter: "r = 2.5;\nS = \nL = \nfprintf('面积 = %.3f，周长 = %.3f\\n', S, L)\n",
      hints: ["面积 S = pi*r^2，周长 L = 2*pi*r。", "pi 是内置常量，直接写 pi 就可以。"],
      solution: "r = 2.5;\nS = pi * r^2;\nL = 2 * pi * r;\nfprintf('面积 = %.3f，周长 = %.3f\\n', S, L)\n",
      verify: function (res) {
        const e = failErr(res); if (e) return e;
        const s = needVar(res, "S"); if (s) return s;
        if (!near(numOf(res, "S"), 19.6349540849, 1e-3)) return { ok: false, msg: "面积应该约等于 19.635，你算的是 " + numOf(res, "S") + "。" };
        if (!near(numOf(res, "L"), 15.7079632679, 1e-3)) return { ok: false, msg: "周长应该约等于 15.708。" };
        return needOut(res, "19.635") || { ok: true, msg: "正确！fprintf 的格式符和变量顺序要对应。" };
      },
    },
    {
      id: "ex2_create",
      title: "创建三个矩阵",
      prompt: "1) 用冒号表达式创建 a = 2 4 6 8 10；2) 创建 2×3 矩阵 B = [1 2 3; 4 5 6]；3) 用 linspace 创建 c = 0 到 1 之间共 5 个数。",
      starter: "a = \nB = \nc = \n",
      hints: ["冒号表达式写法是 起点:步长:终点。", "linspace(0, 1, 5)"],
      solution: "a = 2:2:10;\nB = [1 2 3; 4 5 6];\nc = linspace(0, 1, 5);\n",
      verify: function (res) {
        const e = failErr(res); if (e) return e;
        const a = matOf(res, "a");
        if (!a || a[0].length !== 5 || !near(a[0][4], 10)) return { ok: false, msg: "a 应该是 5 个元素、最后一个是 10 的行向量。" };
        const B = matOf(res, "B");
        if (!B || B.length !== 2 || B[0].length !== 3 || B[1][2] !== 6) return { ok: false, msg: "B 应该是 2 行 3 列，右下角是 6。" };
        const c = matOf(res, "c");
        if (!c || c[0].length !== 5 || !near(c[0][4], 1)) return { ok: false, msg: "c 应该有 5 个元素，最后一个是 1。" };
        return { ok: true, msg: "三个矩阵都创建正确。" };
      },
    },
    {
      id: "ex2_range",
      title: "冒号表达式的细节",
      prompt: "创建 v = 从 10 递减到 0、步长为 -2 的向量；再写 w = 5:1，观察它是不是空向量。",
      starter: "v = \nw = 5:1\n",
      hints: ["步长为负时写成 起点:步长:终点。", "起点大于终点而步长为正时，结果是空向量。"],
      solution: "v = 10:-2:0;\nw = 5:1;\n",
      verify: function (res) {
        const e = failErr(res); if (e) return e;
        const v = matOf(res, "v");
        if (!v || v[0].length !== 6 || v[0][0] !== 10 || v[0][5] !== 0) return { ok: false, msg: "v 应该是 10 8 6 4 2 0，共 6 个元素。" };
        const w = matOf(res, "w");
        if (!w) return { ok: false, msg: "w 应该是一个空向量。" };
        return w[0].length === 0 ? { ok: true, msg: "正确！5:1 是空向量，这是常考的小陷阱。" } : { ok: false, msg: "5:1 的结果应该是空向量。" };
      },
    },
    {
      id: "ex2_index",
      title: "取值：行列下标与切片",
      prompt: "A = [1 2 3; 4 5 6; 7 8 9]。取出：第 2 行第 3 列存到 x1；第 2 列全部存到 x2；左上角 2×2 存到 x3；最后一个元素存到 x4。",
      starter: "A = [1 2 3; 4 5 6; 7 8 9];\nx1 = \nx2 = \nx3 = \nx4 = \n",
      hints: ["A(2,3)、A(:,2)、A(1:2,1:2)、A(end)"],
      solution: "A = [1 2 3; 4 5 6; 7 8 9];\nx1 = A(2,3);\nx2 = A(:,2);\nx3 = A(1:2,1:2);\nx4 = A(end);\n",
      verify: function (res) {
        const e = failErr(res); if (e) return e;
        if (numOf(res, "x1") !== 6) return { ok: false, msg: "x1 应该是 6。" };
        const x2 = matOf(res, "x2");
        if (!x2 || x2.length !== 3 || x2[0][0] !== 2 || x2[2][0] !== 8) return { ok: false, msg: "x2 应该是 2、5、8 组成的列向量。" };
        const x3 = matOf(res, "x3");
        if (!x3 || x3.length !== 2 || x3[1][1] !== 5) return { ok: false, msg: "x3 应该是 [1 2; 4 5]。" };
        if (numOf(res, "x4") !== 9) return { ok: false, msg: "x4 应该是 9。" };
        return { ok: true, msg: "四种取值方式都用对了。" };
      },
    },
    {
      id: "ex2_logical",
      title: "逻辑索引挑数据",
      prompt: "成绩向量 score = [58 72 65 90 45 83]，用逻辑索引把大于等于 60 的成绩挑出来存到 pass，保持原来的顺序。",
      starter: "score = [58 72 65 90 45 83];\npass = \n",
      hints: ["score >= 60 会得到一组 0 和 1。", "把它放进括号当索引：score(score >= 60)"],
      solution: "score = [58 72 65 90 45 83];\npass = score(score >= 60)\n",
      verify: function (res) {
        const e = failErr(res); if (e) return e;
        const p = matOf(res, "pass");
        if (!p) return { ok: false, msg: "pass 应该是一个向量。" };
        const vals = p[0];
        if (vals.length !== 4 || vals.join(",") !== "72,65,90,83") return { ok: false, msg: "结果应该是 72 65 90 83，你得到的是 " + vals.join(" ") + "。" };
        return { ok: true, msg: "正确！逻辑索引是最实用的筛选写法。" };
      },
    },
    {
      id: "ex2_modify",
      title: "修改与删除元素",
      prompt: "A = [1 2 3; 4 5 6; 7 8 9]。先把 A(1,1) 改成 0，再删除第 3 行，最后把第 2 列全改成 1，结果存回 A 并显示。",
      starter: "A = [1 2 3; 4 5 6; 7 8 9];\n% 在这里写三步操作\n",
      hints: ["删除整行：A(3,:) = []", "整列赋值：A(:,2) = 1"],
      solution: "A = [1 2 3; 4 5 6; 7 8 9];\nA(1,1) = 0;\nA(3,:) = [];\nA(:,2) = 1;\ndisp(A)\n",
      verify: function (res) {
        const e = failErr(res); if (e) return e;
        const A = matOf(res, "A");
        if (!A) return { ok: false, msg: "没有找到矩阵 A。" };
        if (A.length !== 2 || A[0].length !== 3) return { ok: false, msg: "删除一行后 A 应该是 2 行 3 列。" };
        if (A[0][0] !== 0) return { ok: false, msg: "A(1,1) 应该被改成 0。" };
        if (A[0][1] !== 1 || A[1][1] !== 1) return { ok: false, msg: "第 2 列应该全部变成 1。" };
        return { ok: true, msg: "改、删、赋值三步都对了。" };
      },
    },
    {
      id: "ex2_dot",
      title: "点运算：逐元素计算",
      prompt: "v = [1 2 3 4 5]。求每个元素的平方存到 sq，求每个元素的倒数存到 iv，再用点除求 sq./v 存到 ratio。",
      starter: "v = [1 2 3 4 5];\nsq = \niv = \nratio = \n",
      hints: ["元素级乘方用 .^，元素级除法用 ./"],
      solution: "v = [1 2 3 4 5];\nsq = v .^ 2;\niv = 1 ./ v;\nratio = sq ./ v;\n",
      verify: function (res) {
        const e = failErr(res); if (e) return e;
        const sq = matOf(res, "sq");
        if (!sq || sq[0].join(",") !== "1,4,9,16,25") return { ok: false, msg: "sq 应该是 1 4 9 16 25。" };
        const iv = matOf(res, "iv");
        if (!iv || !near(iv[0][1], 0.5)) return { ok: false, msg: "iv 应该是 1、0.5、0.333、0.25、0.2。" };
        const ra = matOf(res, "ratio");
        if (!ra || !near(ra[0][4], 5)) return { ok: false, msg: "ratio 应该等于 v 本身。" };
        return { ok: true, msg: "点运算掌握得很好。" };
      },
    },
    {
      id: "ex2_matrixmul",
      title: "矩阵乘法 vs 点乘",
      prompt: "A = [1 2; 3 4]。分别计算矩阵乘法 A*A 存到 M，元素级相乘 A.*A 存到 D。",
      starter: "A = [1 2; 3 4];\nM = \nD = \n",
      hints: ["M 的第 1 行第 1 列 = 1×1 + 2×3 = 7。"],
      solution: "A = [1 2; 3 4];\nM = A * A;\nD = A .* A;\n",
      verify: function (res) {
        const e = failErr(res); if (e) return e;
        const M = matOf(res, "M");
        const D = matOf(res, "D");
        if (!M || M[0][0] !== 7 || M[1][1] !== 22) return { ok: false, msg: "A*A 应该是 [7 10; 15 22]。" };
        if (!D || D[0][1] !== 4 || D[1][1] !== 16) return { ok: false, msg: "A.*A 应该是 [1 4; 9 16]。" };
        return { ok: true, msg: "区别抓得很准。" };
      },
    },
    {
      id: "ex2_stats",
      title: "基本统计量",
      prompt: "data = [12 7 15 9 20 13]。求元素个数 n、总和 s、平均值 m、最大值 mx 以及它所在的位置 pos（用两个返回值一次求出）。",
      starter: "data = [12 7 15 9 20 13];\nn = \ns = \nm = \nmx = \npos = \n",
      hints: ["[mx, pos] = max(data) 可以一次拿到最大值和位置。"],
      solution: "data = [12 7 15 9 20 13];\nn = numel(data);\ns = sum(data);\nm = mean(data);\n[mx, pos] = max(data);\n",
      verify: function (res) {
        const e = failErr(res); if (e) return e;
        if (numOf(res, "n") !== 6) return { ok: false, msg: "元素个数应该是 6。" };
        if (numOf(res, "s") !== 76) return { ok: false, msg: "总和应该是 76。" };
        if (!near(numOf(res, "m"), 12.6667, 1e-3)) return { ok: false, msg: "平均值约为 12.667。" };
        if (numOf(res, "mx") !== 20 || numOf(res, "pos") !== 5) return { ok: false, msg: "最大值是 20，位于第 5 个位置。" };
        return { ok: true, msg: "全部正确。" };
      },
    },
    {
      id: "ex2_sortfind",
      title: "排序与查找位置",
      prompt: "v = [5 3 9 1 7]。从小到大排序存到 sv；找出大于 4 的元素的位置存到 idx。",
      starter: "v = [5 3 9 1 7];\nsv = \nidx = \n",
      hints: ["sort(v) 返回排好序的向量。", "find(v > 4) 返回满足条件的位置。"],
      solution: "v = [5 3 9 1 7];\nsv = sort(v);\nidx = find(v > 4);\n",
      verify: function (res) {
        const e = failErr(res); if (e) return e;
        const sv = matOf(res, "sv");
        if (!sv || sv[0].join(",") !== "1,3,5,7,9") return { ok: false, msg: "排序结果应该是 1 3 5 7 9。" };
        const idx = matOf(res, "idx");
        if (!idx || idx[0].join(",") !== "1,3,5") return { ok: false, msg: "大于 4 的位置是第 1、3、5 个。" };
        return { ok: true, msg: "排序和查找都对。" };
      },
    },
    {
      id: "ex3_const",
      title: "格式化输出",
      prompt: "把 1/3 存到 x，然后用 fprintf 分别输出保留 4 位小数、保留 2 位小数、科学计数法（各占一行）。",
      starter: "x = 1/3;\nfprintf('%.4f\\n', x)\n% 再写两行\n",
      hints: ["%.2f 保留两位小数，%e 是科学计数法。"],
      solution: "x = 1/3;\nfprintf('%.4f\\n', x)\nfprintf('%.2f\\n', x)\nfprintf('%e\\n', x)\n",
      verify: function (res) {
        const e = failErr(res); if (e) return e;
        if (res.text.indexOf("0.3333") < 0) return { ok: false, msg: "输出里应该有 0.3333。" };
        if (res.text.indexOf("0.33") < 0) return { ok: false, msg: "输出里应该有 0.33。" };
        return !/e[-+]0?1/.test(res.text) ? { ok: false, msg: "第三行应该用 %e 输出科学计数法。" } : { ok: true, msg: "三种格式都正确。" };
      },
    },
    {
      id: "ex3_logic",
      title: "逻辑判断",
      prompt: "x = 25。判断：x 是否大于 10（r1）、x 是否在 20 到 30 之间（r2）、x 是否不等于 25（r3）。",
      starter: "x = 25;\nr1 = \nr2 = \nr3 = \n",
      hints: ["“在 20 到 30 之间”写成 x > 20 && x < 30。", "不等于用 ~="],
      solution: "x = 25;\nr1 = x > 10;\nr2 = x > 20 && x < 30;\nr3 = x ~= 25;\n",
      verify: function (res) {
        const e = failErr(res); if (e) return e;
        if (!numOf(res, "r1")) return { ok: false, msg: "r1 应该是 1。" };
        if (!numOf(res, "r2")) return { ok: false, msg: "r2 应该是 1。" };
        if (numOf(res, "r3") !== 0) return { ok: false, msg: "r3 应该是 0，因为 x 等于 25。" };
        return { ok: true, msg: "逻辑运算正确。" };
      },
    },
    {
      id: "ex3_string",
      title: "字符串拼接",
      prompt: "name = '张三'，score = 92.5。用 num2str 和方括号拼成“张三的成绩是 92.5 分”存到 s 并显示。",
      starter: "name = '张三';\nscore = 92.5;\ns = \ndisp(s)\n",
      hints: ["s = [name '的成绩是 ' num2str(score) ' 分']"],
      solution: "name = '张三';\nscore = 92.5;\ns = [name '的成绩是 ' num2str(score) ' 分'];\ndisp(s)\n",
      verify: function (res) {
        const e = failErr(res); if (e) return e;
        const s = res.locals.s;
        if (typeof s !== "string") return { ok: false, msg: "s 应该是一个字符串。" };
        if (s.indexOf("张三") < 0 || s.indexOf("92.5") < 0) return { ok: false, msg: "s 里应该同时出现姓名和分数，你的是：" + s };
        return { ok: true, msg: "字符串拼接成功。" };
      },
    },
    {
      id: "ex3_cell",
      title: "元胞数组取值",
      prompt: "c = {'张三', 95; '李四', 88}。把第一行第一列的名字取出来存到 n1，把第二行第二列的分数取出来存到 s2。",
      starter: "c = {'张三', 95; '李四', 88};\nn1 = \ns2 = \n",
      hints: ["取内容用花括号：c{1,1}", "圆括号 c(1,1) 取出来的还是元胞。"],
      solution: "c = {'张三', 95; '李四', 88};\nn1 = c{1,1};\ns2 = c{2,2};\n",
      verify: function (res) {
        const e = failErr(res); if (e) return e;
        if (res.locals.n1 !== "张三") return { ok: false, msg: "n1 应该是字符串 '张三'。" };
        if (numOf(res, "s2") !== 88) return { ok: false, msg: "s2 应该是 88。" };
        return { ok: true, msg: "记住：() 取元胞，{} 取内容。" };
      },
    },
  ];

  const map = {};
  ML.exercises.forEach(function (e) { map[e.id] = e; });
  ML.exerciseById = function (id) { return map[id]; };
})(window);
