/* 期末模拟卷 */
(function (global) {
  "use strict";
  const ML = global.ML || (global.ML = {});
  const H = ML.exHelp;

  ML.exam = {
    title: "MATLAB 期末模拟卷",
    note: "建议限时 60 分钟。选择题和填空题用来检查概念，编程题可以直接在下方运行和判分。",
    sections: [
      {
        name: "一、选择题（每题 4 分）",
        questions: [
          {
            type: "choice",
            q: "以下关于 MATLAB 矩阵下标的说法，正确的是：",
            options: ["下标从 0 开始", "下标从 1 开始", "下标可以是负数", "下标只能用整数常量"],
            answer: 1,
            explain: "MATLAB 的下标从 1 开始，这与 C、Python 等语言不同。",
          },
          {
            type: "choice",
            q: "要计算向量 v 中每个元素的平方，正确的写法是：",
            options: ["v^2", "v*v", "v.^2", "square(v)"],
            answer: 2,
            explain: "逐元素运算要用点运算 .^；v^2 在 v 不是方阵时会报错。",
          },
          {
            type: "choice",
            q: "A = [1 2 3; 4 5 6; 7 8 9]，A(4) 的值是：",
            options: ["4", "2", "5", "报错"],
            answer: 1,
            explain: "MATLAB 按列存储，线性索引 A(4) 表示第 1 列数到第 4 个，即第 1 行第 2 列，值为 2。",
          },
          {
            type: "choice",
            q: "表达式 5:1 的结果是：",
            options: ["1 2 3 4 5", "5 4 3 2 1", "空矩阵", "报错"],
            answer: 2,
            explain: "起点大于终点而默认步长为 1（正数），得到 0 个元素的空矩阵。",
          },
          {
            type: "choice",
            q: "判断两个变量是否相等，使用的运算符是：",
            options: ["=", "==", "~=", "==="],
            answer: 1,
            explain: "= 是赋值，== 才是判断相等。",
          },
          {
            type: "choice",
            q: "sum([1 2 3; 4 5 6]) 的结果是：",
            options: ["21", "[5 7 9]", "[6; 15]", "[6 15]"],
            answer: 1,
            explain: "sum 对矩阵按列求和，结果是行向量 [5 7 9]。",
          },
          {
            type: "choice",
            q: "要在同一张图上继续画第二条曲线而不覆盖第一条，应该使用：",
            options: ["clf", "close", "hold on", "subplot"],
            answer: 2,
            explain: "hold on 保留当前图形，后面的 plot 会叠加绘制。",
          },
          {
            type: "choice",
            q: "已知 A = [2 1; 1 -3]，A \\ B 的意义是：",
            options: ["元素级除法", "解线性方程组 A*X = B", "求 A 的逆", "求 A 的行列式"],
            answer: 1,
            explain: "左除 A\\B 等价于解方程 A*X = B，比 inv(A)*B 更稳定。",
          },
          {
            type: "choice",
            q: "下面哪个变量名是合法的？",
            options: ["2x", "x-2", "_abc", "function"],
            answer: 2,
            explain: "变量名必须以字母或下划线开头，不能包含减号，也不能用关键字。",
          },
          {
            type: "choice",
            q: "polyfit(x, y, 2) 中的 2 表示：",
            options: ["取前 2 个数据", "多项式次数为 2", "保留 2 位小数", "返回 2 个参数"],
            answer: 1,
            explain: "第三个参数是拟合多项式的次数，2 表示用二次多项式拟合。",
          },
        ],
      },
      {
        name: "二、读程序写结果（每题 4 分）",
        questions: [
          {
            type: "blank",
            q: "程序运行后 s 的值是：\ns = 0;\nfor i = 1:4\n    s = s + i*i;\nend",
            answers: ["30"],
            explain: "1+4+9+16 = 30。",
          },
          {
            type: "blank",
            q: "程序运行后 m 的值是：\nv = [3 9 1 7];\nm = v(1);\nfor x = v\n    if x > m\n        m = x;\n    end\nend",
            answers: ["9"],
            explain: "这是求最大值的循环写法，结果是 9。",
          },
          {
            type: "blank",
            q: "程序运行后 n 的值是：\nn = 1;\nwhile n < 20\n    n = n * 2;\nend",
            answers: ["32"],
            explain: "1→2→4→8→16→32，第一次不满足 n<20 时 n = 32。",
          },
          {
            type: "blank",
            q: "A = [1 2 3; 4 5 6]; 那么 size(A) 得到的是 ____（写成 “行数 列数” 的形式）。",
            answers: ["2 3", "2,3", "2x3", "2×3"],
            explain: "A 是 2 行 3 列。",
          },
          {
            type: "blank",
            q: "v = [10 20 30 40]; 那么 v(v > 15) 的结果是 ____（按顺序写出数值）。",
            answers: ["20 30 40", "20,30,40"],
            explain: "逻辑索引挑出大于 15 的元素：20、30、40。",
          },
        ],
      },
      {
        name: "三、编程题（每题 12 分）",
        questions: [
          {
            type: "code",
            q: "一个数组 data = [23 8 15 42 4 16 9]。要求：用循环求所有元素的和存到 total，并求元素的个数存到 cnt。",
            starter: "data = [23 8 15 42 4 16 9];\ntotal = 0;\nfor x = data\n    % 累加\nend\ncnt = \n",
            hints: ["循环体写 total = total + x;", "个数用 length(data) 或 numel(data)。"],
            solution: "data = [23 8 15 42 4 16 9];\ntotal = 0;\nfor x = data\n    total = total + x;\nend\ncnt = numel(data);\nfprintf('和 = %d，个数 = %d\\n', total, cnt)\n",
            verify: function (res) {
              const e = H.failErr(res); if (e) return e;
              if (H.numOf(res, "total") !== 117) return { ok: false, msg: "总和应该是 117，你得到 " + H.numOf(res, "total") + "。" };
              if (H.numOf(res, "cnt") !== 7) return { ok: false, msg: "元素个数应该是 7。" };
              return { ok: true, msg: "正确，满分。" };
            },
          },
          {
            type: "code",
            q: "写一个函数 myMax(v)，不调用 max，用循环求向量最大值并返回；再用 v = [6 2 9 4 9 1] 调用，结果存到 m。",
            starter: "function m = myMax(v)\n    % 用循环找最大值\nend\n\nv = [6 2 9 4 9 1];\nm = \n",
            hints: ["先把第一个元素赋给 m，再从第二个开始比较。", "调用：m = myMax(v);"],
            solution: "function m = myMax(v)\n    m = v(1);\n    for i = 2:length(v)\n        if v(i) > m\n            m = v(i);\n        end\n    end\nend\n\nv = [6 2 9 4 9 1];\nm = myMax(v);\ndisp(m)\n",
            verify: function (res) {
              const e = H.failErr(res); if (e) return e;
              return H.numOf(res, "m") === 9 ? { ok: true, msg: "函数正确，最大值是 9。" } : { ok: false, msg: "结果应该是 9，你得到 " + H.numOf(res, "m") + "。" };
            },
          },
          {
            type: "code",
            q: "成绩向量 score = [45 67 82 91 55 73 88]。要求：把不及格的成绩都替换成 60 存到 score2，并统计多少人原来不及格存到 fixNum。",
            starter: "score = [45 67 82 91 55 73 88];\nscore2 = \nfixNum = \n",
            hints: ["先复制：score2 = score;", "用逻辑索引修改：score2(score < 60) = 60", "人数：numel(score(score < 60))"],
            solution: "score = [45 67 82 91 55 73 88];\nscore2 = score;\nscore2(score < 60) = 60;\nfixNum = numel(score(score < 60));\ndisp(score2)\nfprintf('有 %d 人原来不及格\\n', fixNum)\n",
            verify: function (res) {
              const e = H.failErr(res); if (e) return e;
              const s2 = H.matOf(res, "score2");
              if (!s2 || s2[0].join(",") !== "60,67,82,91,60,73,88") return { ok: false, msg: "score2 应该是 60 67 82 91 60 73 88。" };
              if (H.numOf(res, "fixNum") !== 2) return { ok: false, msg: "原来不及格的有 2 人。" };
              return { ok: true, msg: "正确处理了逻辑索引赋值。" };
            },
          },
          {
            type: "code",
            q: "已知直线拟合数据 x = [1 2 3 4 5 6]，y = [1.1 2.0 2.9 4.2 5.1 5.9]。用 polyfit 做一次拟合得到 p，并计算拟合后 x = 3.5 处的值存到 y35。",
            starter: "x = [1 2 3 4 5 6];\ny = [1.1 2.0 2.9 4.2 5.1 5.9];\np = \ny35 = \n",
            hints: ["p = polyfit(x, y, 1);", "y35 = polyval(p, 3.5);"],
            solution: "x = [1 2 3 4 5 6];\ny = [1.1 2.0 2.9 4.2 5.1 5.9];\np = polyfit(x, y, 1);\ny35 = polyval(p, 3.5);\nfprintf('拟合系数：%.4f 和 %.4f\\ny(3.5) = %.4f\\n', p(1), p(2), y35)\n",
            verify: function (res) {
              const e = H.failErr(res); if (e) return e;
              const p = H.matOf(res, "p");
              if (!p || !H.near(p[0][0], 0.98, 0.06)) return { ok: false, msg: "斜率应该接近 0.98。" };
              if (!H.near(H.numOf(res, "y35"), 3.5, 0.15)) return { ok: false, msg: "y(3.5) 应该接近 3.5，你得到 " + H.numOf(res, "y35") + "。" };
              return { ok: true, msg: "拟合与求值都正确。" };
            },
          },
          {
            type: "code",
            q: "综合题：t = 0:0.5:4，y = 3*exp(-0.5*t).*sin(2*t)。画出 y 关于 t 的曲线（红色实线），加标题“衰减振荡”、x 轴标签“时间 t”、y 轴标签“幅值”，打开网格；再求 y 的最大值存到 peak。",
            starter: "t = 0:0.5:4;\ny = 3*exp(-0.5*t).*sin(2*t);\nplot(t, y, 'r-')\n% 加标注\npeak = \n",
            hints: ["title('衰减振荡')、xlabel('时间 t')、ylabel('幅值')、grid on", "peak = max(y);"],
            solution: "t = 0:0.5:4;\ny = 3*exp(-0.5*t).*sin(2*t);\nplot(t, y, 'r-')\ntitle('衰减振荡')\nxlabel('时间 t')\nylabel('幅值')\ngrid on\npeak = max(y);\nfprintf('峰值 = %.4f\\n', peak)\n",
            verify: function (res) {
              const e = H.failErr(res); if (e) return e;
              if (!res.figures.length) return { ok: false, msg: "没有检测到图形。" };
              const f = res.figures[0];
              if (f.title !== "衰减振荡") return { ok: false, msg: "标题应该是“衰减振荡”。" };
              if (!f.grid) return { ok: false, msg: "还没有打开网格。" };
              const y = H.matOf(res, "y");
              if (!y) return { ok: false, msg: "变量 y 没有找到，注意这里要用点乘 .* 计算。" };
              if (!H.near(H.numOf(res, "peak"), Math.max.apply(null, y[0]), 1e-9)) return { ok: false, msg: "peak 应该是 y 的最大值。" };
              return { ok: true, msg: "综合题完成得不错。" };
            },
          },
        ],
      },
    ],
  };
})(window);
