/* 页面逻辑与交互 */
(function (global) {
  "use strict";
  const ML = global.ML;
  const doc = global.document;

  const $ = (sel, root) => (root || doc).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || doc).querySelectorAll(sel));

  function el(tag, attrs, children) {
    const node = doc.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "class") node.className = attrs[k];
        else if (k === "text") node.textContent = attrs[k];
        else if (k === "html") node.innerHTML = attrs[k];
        else if (k.indexOf("on") === 0 && typeof attrs[k] === "function") node.addEventListener(k.slice(2), attrs[k]);
        else if (attrs[k] !== null && attrs[k] !== undefined) node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      node.appendChild(typeof c === "string" ? doc.createTextNode(c) : c);
    });
    return node;
  }

  /* ---------------- 进度 ---------------- */
  const KEY = "matlab-course-progress-v1";
  let progress = load();
  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "{}");
    } catch (e) {
      return {};
    }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(progress)); } catch (e) { /* 忽略 */ }
  }
  function markExercise(lessonId, exId, ok) {
    if (!ok) return;
    progress[lessonId] = progress[lessonId] || {};
    progress[lessonId][exId] = true;
    save();
    renderProgress();
    renderToc();
  }
  function isLessonDone(lesson) {
    const p = progress[lesson.id];
    if (!p) return false;
    return lesson.exercises.every(function (id) { return p[id]; });
  }
  function totalLessons() {
    let n = 0;
    ML.course.modules.forEach(function (m) { n += m.lessons.length; });
    return n;
  }
  function doneLessons() {
    let n = 0;
    ML.course.modules.forEach(function (m) {
      m.lessons.forEach(function (l) { if (isLessonDone(l)) n++; });
    });
    return n;
  }
  function renderProgress() {
    const total = totalLessons();
    const done = doneLessons();
    const pct = total ? Math.round((done / total) * 100) : 0;
    $("#progressText").textContent = done + " / " + total;
    $("#progressFill").style.width = pct + "%";
  }

  /* ---------------- 运行与输出 ---------------- */
  function execute(code) {
    return ML.run(code, { seed: 20260101 });
  }

  function outputNode(result) {
    const box = el("div", { class: "output" });
    if (result.error) {
      box.appendChild(el("div", { class: "err-line", text: "✗ " + result.error }));
    }
    if (result.text) {
      box.appendChild(el("pre", { class: "console", text: result.text.replace(/\s+$/, "") || "（没有文字输出）" }));
    }
    (result.figures || []).forEach(function (fig, i) {
      const card = el("div", { class: "figure" });
      card.innerHTML = ML.renderFigure(fig, 560, 360);
      card.appendChild(el("div", { class: "figure-cap", text: "图 " + (i + 1) + (fig.title ? "：" + fig.title : "") }));
      box.appendChild(card);
    });
    if (!result.error && !result.text && !(result.figures || []).length) {
      box.appendChild(el("div", { class: "hint-line", text: "程序运行结束，没有输出。末尾不加分号可以看到结果。" }));
    }
    return box;
  }

  function workspaceNode(result) {
    const list = result.workspace || [];
    if (!list.length) return el("div", { class: "ws-empty", text: "工作区为空" });
    const table = el("table", { class: "ws-table" });
    table.appendChild(el("thead", null, [el("tr", null, [el("th", { text: "变量" }), el("th", { text: "大小" }), el("th", { text: "值" })])]));
    const body = el("tbody");
    list.forEach(function (v) {
      body.appendChild(el("tr", null, [
        el("td", { class: "ws-name", text: v.name }),
        el("td", { class: "ws-size", text: v.size }),
        el("td", { class: "ws-val", text: v.type === "char" ? "'" + v.value + "'" : ML.briefValue(v.value) }),
      ]));
    });
    table.appendChild(body);
    return table;
  }

  /* ---------------- 编辑器 ---------------- */
  function makeEditor(value, rows) {
    const ta = el("textarea", { class: "editor", spellcheck: "false", rows: String(rows || 8) });
    ta.value = value;
    ta.addEventListener("keydown", function (e) {
      if (e.key === "Tab") {
        e.preventDefault();
        const s = ta.selectionStart, en = ta.selectionEnd;
        ta.value = ta.value.slice(0, s) + "    " + ta.value.slice(en);
        ta.selectionStart = ta.selectionEnd = s + 4;
      }
    });
    return ta;
  }

  /* ---------------- 讲义块 ---------------- */
  function renderBlocks(blocks) {
    const frag = doc.createDocumentFragment();
    blocks.forEach(function (b) {
      if (b.type === "text") {
        frag.appendChild(el("p", { class: "body-text", html: inlineCode(b.text) }));
      } else if (b.type === "list") {
        if (b.title) frag.appendChild(el("div", { class: "block-title", text: b.title }));
        const ul = el("ul", { class: "bullets" });
        b.items.forEach(function (it) { ul.appendChild(el("li", { html: inlineCode(it) })); });
        frag.appendChild(ul);
      } else if (b.type === "table") {
        const t = el("table", { class: "md-table" });
        t.appendChild(el("thead", null, [el("tr", null, b.head.map(function (hh) { return el("th", { html: inlineCode(hh) }); }))]));
        const tb = el("tbody");
        b.rows.forEach(function (r) {
          tb.appendChild(el("tr", null, r.map(function (c) { return el("td", { html: inlineCode(c) }); })));
        });
        t.appendChild(tb);
        frag.appendChild(t);
      } else if (b.type === "note") {
        frag.appendChild(el("div", { class: "callout note", html: "<b>小提示　</b>" + inlineCode(b.text) }));
      } else if (b.type === "warn") {
        frag.appendChild(el("div", { class: "callout warn", html: "<b>易错点　</b>" + inlineCode(b.text) }));
      } else if (b.type === "code") {
        frag.appendChild(codeBlock(b));
      }
    });
    return frag;
  }

  function inlineCode(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");
  }

  function codeBlock(b) {
    const wrap = el("div", { class: "code-card" });
    if (b.caption) wrap.appendChild(el("div", { class: "code-cap", text: b.caption }));
    const pre = el("pre", { class: "code" });
    pre.textContent = b.code;
    wrap.appendChild(pre);
    const bar = el("div", { class: "code-bar" });
    const out = el("div", { class: "code-out" });
    bar.appendChild(el("button", {
      class: "btn primary small",
      type: "button",
      text: "运行",
      onclick: function () {
        const r = execute(b.code);
        out.innerHTML = "";
        out.appendChild(outputNode(r));
      },
    }));
    bar.appendChild(el("button", {
      class: "btn ghost small",
      type: "button",
      text: "在练习台打开",
      onclick: function () { openLab(b.code); },
    }));
    wrap.appendChild(bar);
    wrap.appendChild(out);
    return wrap;
  }

  /* ---------------- 练习 ---------------- */
  function renderExercise(ex, lessonId) {
    const wrap = el("div", { class: "exercise" });
    wrap.appendChild(el("div", { class: "ex-head" }, [
      el("span", { class: "ex-tag", text: "动手练" }),
      el("span", { class: "ex-title", text: ex.title }),
    ]));
    wrap.appendChild(el("div", { class: "ex-prompt", html: inlineCode(ex.prompt).replace(/\n/g, "<br>") }));

    const editor = makeEditor(ex.starter, 7);
    wrap.appendChild(editor);

    const bar = el("div", { class: "ex-bar" });
    const fb = el("div", { class: "feedback" });
    const hintBox = el("div", { class: "hints hidden" });
    const solBox = el("div", { class: "solution hidden" });

    let hintIdx = 0;
    bar.appendChild(el("button", {
      class: "btn primary small", type: "button", text: "运行",
      onclick: function () {
        const r = execute(editor.value);
        fb.innerHTML = "";
        fb.className = "feedback";
        fb.appendChild(outputNode(r));
      },
    }));
    bar.appendChild(el("button", {
      class: "btn ok small", type: "button", text: "检查答案",
      onclick: function () {
        const r = execute(editor.value);
        fb.innerHTML = "";
        fb.className = "feedback";
        if (r.error) {
          fb.appendChild(el("div", { class: "fb bad", text: "还差一点：代码没有跑通。" + r.error }));
          fb.appendChild(outputNode(r));
          return;
        }
        let v;
        try {
          v = ex.verify(r);
        } catch (err) {
          v = { ok: false, msg: "判题时出错：" + err.message };
        }
        fb.appendChild(el("div", { class: v.ok ? "fb good" : "fb bad", text: (v.ok ? "✓ " : "✗ ") + v.msg }));
        fb.appendChild(outputNode(r));
        if (v.ok) {
          markExercise(lessonId, ex.id, true);
        }
      },
    }));
    bar.appendChild(el("button", {
      class: "btn ghost small", type: "button", text: "看提示",
      onclick: function () {
        if (hintIdx < ex.hints.length) {
          hintBox.classList.remove("hidden");
          hintBox.appendChild(el("div", { class: "hint-line", text: "提示 " + (hintIdx + 1) + "：" + ex.hints[hintIdx] }));
          hintIdx++;
        }
        if (hintIdx >= ex.hints.length) this.textContent = "提示已给完";
      },
    }));
    bar.appendChild(el("button", {
      class: "btn ghost small", type: "button", text: "参考答案",
      onclick: function () {
        if (solBox.classList.contains("hidden")) {
          solBox.classList.remove("hidden");
          const pre = el("pre", { class: "code" });
          pre.textContent = ex.solution;
          solBox.appendChild(el("div", { class: "hint-line", text: "先自己写一遍再看答案，效果更好。" }));
          solBox.appendChild(pre);
        } else {
          solBox.classList.add("hidden");
        }
      },
    }));
    wrap.appendChild(bar);
    wrap.appendChild(hintBox);
    wrap.appendChild(fb);
    wrap.appendChild(solBox);
    return wrap;
  }

  /* ---------------- 课程目录 ---------------- */
  let filterText = "";
  function renderToc() {
    const box = $("#toc");
    box.innerHTML = "";
    const kw = filterText.trim().toLowerCase();
    ML.course.modules.forEach(function (m) {
      const lessons = m.lessons.filter(function (l) {
        if (!kw) return true;
        return (l.title + " " + m.title).toLowerCase().indexOf(kw) >= 0;
      });
      if (!lessons.length) return;
      const group = el("div", { class: "toc-group" });
      group.appendChild(el("div", { class: "toc-module", text: m.title }));
      lessons.forEach(function (l) {
        const done = isLessonDone(l);
        const item = el("button", {
          class: "toc-item" + (done ? " done" : ""),
          type: "button",
          onclick: function () { showLesson(l.id); },
        });
        item.appendChild(el("span", { class: "toc-check", text: done ? "✓" : "○" }));
        item.appendChild(el("span", { class: "toc-text", text: l.title }));
        group.appendChild(item);
      });
      box.appendChild(group);
    });
    if (!box.children.length) box.appendChild(el("div", { class: "toc-empty", text: "没有找到匹配的课时" }));
  }

  function findLesson(id) {
    let found = null;
    ML.course.modules.forEach(function (m) {
      m.lessons.forEach(function (l) { if (l.id === id) found = { module: m, lesson: l }; });
    });
    return found;
  }
  function flatLessons() {
    const out = [];
    ML.course.modules.forEach(function (m) { m.lessons.forEach(function (l) { out.push({ module: m, lesson: l }); }); });
    return out;
  }

  /* ---------------- 视图切换 ---------------- */
  function setView(name) {
    ["home", "lesson", "lab", "exam", "sheet"].forEach(function (v) {
      $("#view-" + v).classList.toggle("is-hidden", v !== name);
    });
    $$(".nav-btn").forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-view") === name || (name === "lesson" && b.getAttribute("data-view") === "home"));
    });
    $("#main").scrollTop = 0;
    global.scrollTo(0, 0);
  }

  function showHome() {
    const v = $("#view-home");
    v.innerHTML = "";
    const head = el("div", { class: "page-head" });
    head.appendChild(el("h2", { text: "从零开始，一步步走到期末" }));
    head.appendChild(el("p", { class: "lede", text: "先看讲解，再自己敲一遍；写错了系统会指出来。每一课的练习都做对，这一课才算完成。" }));
    v.appendChild(head);

    const book = ML.course.book;
    v.appendChild(el("div", { class: "book-card" }, [
      el("div", { class: "book-label", text: "课程知识体系参照教材" }),
      el("div", { class: "book-title", text: "《" + book.title + "》" }),
      el("div", { class: "book-meta", text: book.authors + "　" + book.publisher + "　" + book.year + "　ISBN " + book.isbn }),
    ]));

    ML.course.intro.forEach(function (t) {
      v.appendChild(el("p", { class: "body-text", text: t }));
    });

    const grid = el("div", { class: "module-grid" });
    ML.course.modules.forEach(function (m) {
      const done = m.lessons.filter(isLessonDone).length;
      const card = el("button", { class: "module-card", type: "button", onclick: function () { showLesson(m.lessons[0].id); } });
      card.appendChild(el("div", { class: "mc-title", text: m.title }));
      card.appendChild(el("div", { class: "mc-desc", text: m.desc }));
      card.appendChild(el("div", { class: "mc-foot", text: m.lessons.length + " 节课　已完成 " + done }));
      grid.appendChild(card);
    });
    v.appendChild(grid);

    const quick = el("div", { class: "quick-row" });
    quick.appendChild(el("button", { class: "btn primary", type: "button", text: "进入练习台", onclick: function () { openLab(""); } }));
    quick.appendChild(el("button", { class: "btn", type: "button", text: "做期末模拟卷", onclick: function () { showExam(); } }));
    quick.appendChild(el("button", { class: "btn ghost", type: "button", text: "打开语法速查表", onclick: function () { showSheet(); } }));
    v.appendChild(quick);
    setView("home");
  }

  function showLesson(id) {
    const found = findLesson(id);
    if (!found) return;
    const lesson = found.lesson;
    const v = $("#view-lesson");
    v.innerHTML = "";

    v.appendChild(el("div", { class: "crumb", text: found.module.title }));
    v.appendChild(el("h2", { class: "lesson-title", text: lesson.title }));
    v.appendChild(el("div", { class: "goal" }, [el("b", { text: "本课目标　" }), doc.createTextNode(lesson.goal)]));
    v.appendChild(renderBlocks(lesson.blocks));

    v.appendChild(el("h3", { class: "section-h", text: "动手练一练" }));
    lesson.exercises.forEach(function (exId) {
      const ex = ML.exerciseById(exId);
      if (ex) v.appendChild(renderExercise(ex, lesson.id));
    });

    const all = flatLessons();
    const idx = all.findIndex(function (x) { return x.lesson.id === id; });
    const nav = el("div", { class: "lesson-nav" });
    if (idx > 0) {
      nav.appendChild(el("button", { class: "btn ghost", type: "button", text: "← " + all[idx - 1].lesson.title, onclick: function () { showLesson(all[idx - 1].lesson.id); } }));
    }
    if (idx < all.length - 1) {
      nav.appendChild(el("button", { class: "btn primary", type: "button", text: "下一课：" + all[idx + 1].lesson.title + " →", onclick: function () { showLesson(all[idx + 1].lesson.id); } }));
    }
    v.appendChild(nav);
    setView("lesson");
    renderToc();
  }

  /* ---------------- 练习台 ---------------- */
  const SAMPLES = [
    ["矩阵与统计", "A = [4 8 15 16 23 42];\nfprintf('元素个数 %d，总和 %d，平均 %.2f\\n', numel(A), sum(A), mean(A));\n[mx, pos] = max(A);\nfprintf('最大值 %d 在第 %d 个位置\\n', mx, pos);\ndisp(sort(A))"],
    ["循环与判断", "s = 0;\nfor i = 1:20\n    if mod(i, 2) == 0\n        s = s + i;\n    end\nend\nfprintf('1 到 20 中偶数之和 = %d\\n', s)"],
    ["绘图", "x = linspace(0, 2*pi, 200);\nplot(x, sin(x), 'b-', x, cos(x), 'r--')\ntitle('正弦与余弦')\nxlabel('x')\nlegend('sin(x)', 'cos(x)')\ngrid on"],
    ["解方程", "A = [3 -1 2; 1 2 -1; 2 -1 -1];\nB = [5; 3; 0];\nX = A \\ B;\nfprintf('x = %.2f, y = %.2f, z = %.2f\\n', X(1), X(2), X(3))"],
    ["函数定义", "function r = areaCircle(r0)\n    r = pi * r0^2;\nend\n\nfprintf('半径 3 的圆面积 = %.4f\\n', areaCircle(3))"],
  ];

  function openLab(code) {
    const v = $("#view-lab");
    if (v.dataset.built !== "1") buildLab(v);
    if (code) v.querySelector(".lab-editor").value = code;
    setView("lab");
  }

  function buildLab(v) {
    v.dataset.built = "1";
    v.innerHTML = "";
    v.appendChild(el("div", { class: "page-head" }, [
      el("h2", { text: "练习台" }),
      el("p", { class: "lede", text: "在这里自由写代码。左边写程序，点“运行”看结果；右边可以查看工作区里的变量。" }),
    ]));

    const wrap = el("div", { class: "lab" });
    const left = el("div", { class: "lab-left" });
    const right = el("div", { class: "lab-right" });

    const samples = el("div", { class: "sample-row" });
    samples.appendChild(el("span", { class: "sample-label", text: "示例：" }));
    SAMPLES.forEach(function (s) {
      samples.appendChild(el("button", { class: "chip", type: "button", text: s[0], onclick: function () { $(".lab-editor", left).value = s[1]; } }));
    });
    left.appendChild(samples);

    const ta = makeEditor(SAMPLES[0][1], 16);
    ta.className = "editor lab-editor";
    left.appendChild(ta);
    const bar = el("div", { class: "lab-bar" });
    const out = el("div", { class: "output-wrap" });
    bar.appendChild(el("button", {
      class: "btn primary", type: "button", text: "运行代码",
      onclick: function () {
        const r = execute(ta.value);
        out.innerHTML = "";
        out.appendChild(outputNode(r));
        $(".lab-ws", right).innerHTML = "";
        $(".lab-ws", right).appendChild(workspaceNode(r));
      },
    }));
    bar.appendChild(el("button", {
      class: "btn ghost", type: "button", text: "清空输出",
      onclick: function () { out.innerHTML = ""; },
    }));
    bar.appendChild(el("button", {
      class: "btn ghost", type: "button", text: "清空代码",
      onclick: function () { ta.value = ""; },
    }));
    left.appendChild(bar);
    left.appendChild(el("div", { class: "sub-h", text: "输出结果" }));
    left.appendChild(out);

    right.appendChild(el("div", { class: "sub-h", text: "工作区变量" }));
    const ws = el("div", { class: "lab-ws", text: "还没有运行代码" });
    right.appendChild(ws);

    const help = el("div", { class: "lab-help" });
    help.appendChild(el("div", { class: "sub-h", text: "这个环境支持什么" }));
    help.appendChild(el("ul", { class: "bullets" }, [
      el("li", { text: "变量、向量、矩阵，以及 .* ./ .^ 等点运算" }),
      el("li", { text: "if / elseif / else、switch / case、for、while、break / continue" }),
      el("li", { text: "函数定义与多返回值" }),
      el("li", { text: "常用函数：size、length、numel、sum、mean、max、min、sort、find、zeros、ones、linspace、det、inv、polyfit、polyval、interp1、trapz 等" }),
      el("li", { text: "绘图：plot、bar、stem、scatter、pie、hist、subplot、title、xlabel、legend、grid" }),
      el("li", { text: "暂不支持：Simulink、符号工具箱（syms/diff/int/solve）、input 键盘输入、O 文件编译" }),
    ]));
    right.appendChild(help);

    wrap.appendChild(left);
    wrap.appendChild(right);
    v.appendChild(wrap);
  }

  /* ---------------- 期末模拟 ---------------- */
  let examState = null;
  function showExam() {
    const v = $("#view-exam");
    v.innerHTML = "";
    const ex = ML.exam;
    v.appendChild(el("div", { class: "page-head" }, [
      el("h2", { text: ex.title }),
      el("p", { class: "lede", text: ex.note }),
    ]));

    if (!examState) examState = { answers: {}, code: {}, graded: false };

    ex.sections.forEach(function (sec, si) {
      v.appendChild(el("h3", { class: "section-h", text: sec.name }));
      sec.questions.forEach(function (q, qi) {
        const key = si + "-" + qi;
        const card = el("div", { class: "q-card" });
        card.appendChild(el("div", { class: "q-text", html: inlineCode(q.q).replace(/\n/g, "<br>") }));

        if (q.type === "choice") {
          const ul = el("div", { class: "options" });
          q.options.forEach(function (op, oi) {
            const id = "q" + key + "_" + oi;
            const lab = el("label", { class: "option", for: id });
            const input = el("input", { type: "radio", name: "q" + key, id: id, value: String(oi) });
            input.checked = examState.answers[key] === oi;
            input.addEventListener("change", function () { examState.answers[key] = oi; });
            lab.appendChild(input);
            lab.appendChild(el("span", { text: " " + "ABCD".charAt(oi) + ". " + op }));
            ul.appendChild(lab);
          });
          card.appendChild(ul);
        } else if (q.type === "blank") {
          const input = el("input", { class: "blank-input", type: "text", placeholder: "写出结果" });
          input.value = examState.answers[key] || "";
          input.addEventListener("input", function () { examState.answers[key] = input.value; });
          card.appendChild(input);
        } else {
          const ta = makeEditor(examState.code[key] || q.starter, 8);
          ta.addEventListener("input", function () { examState.code[key] = ta.value; });
          card.appendChild(ta);
          const bar = el("div", { class: "ex-bar" });
          const fb = el("div", { class: "feedback" });
          bar.appendChild(el("button", {
            class: "btn primary small", type: "button", text: "运行",
            onclick: function () {
              const r = execute(ta.value);
              fb.innerHTML = "";
              fb.appendChild(outputNode(r));
            },
          }));
          bar.appendChild(el("button", {
            class: "btn ok small", type: "button", text: "检查这一题",
            onclick: function () {
              const r = execute(ta.value);
              fb.innerHTML = "";
              if (r.error) {
                fb.appendChild(el("div", { class: "fb bad", text: "代码没有跑通：" + r.error }));
                fb.appendChild(outputNode(r));
                return;
              }
              let res;
              try { res = q.verify(r); } catch (err) { res = { ok: false, msg: err.message }; }
              fb.appendChild(el("div", { class: res.ok ? "fb good" : "fb bad", text: (res.ok ? "✓ " : "✗ ") + res.msg }));
              fb.appendChild(outputNode(r));
              examState.answers[key] = res.ok;
            },
          }));
          bar.appendChild(el("button", {
            class: "btn ghost small", type: "button", text: "看提示",
            onclick: function () { fb.appendChild(el("div", { class: "hint-line", text: "提示：" + q.hints.join("；") })); },
          }));
          card.appendChild(bar);
          card.appendChild(fb);
        }
        v.appendChild(card);
      });
    });

    const foot = el("div", { class: "exam-foot" });
    const score = el("div", { class: "score" });
    foot.appendChild(el("button", {
      class: "btn primary", type: "button", text: "提交并查看得分",
      onclick: function () { gradeExam(score); },
    }));
    foot.appendChild(el("button", {
      class: "btn ghost", type: "button", text: "重新开始",
      onclick: function () { examState = null; showExam(); },
    }));
    foot.appendChild(score);
    v.appendChild(foot);
    setView("exam");
  }

  function gradeExam(scoreBox) {
    const ex = ML.exam;
    let got = 0, total = 0, right = 0, count = 0;
    const detail = [];
    ex.sections.forEach(function (sec, si) {
      sec.questions.forEach(function (q, qi) {
        const key = si + "-" + qi;
        count++;
        if (q.type === "choice") {
          total += 4;
          const ok = examState.answers[key] === q.answer;
          if (ok) { got += 4; right++; }
          detail.push({ n: count, ok: ok, ans: "ABCD".charAt(q.answer), explain: q.explain });
        } else if (q.type === "blank") {
          total += 4;
          const v = String(examState.answers[key] || "").replace(/\s+/g, "").trim();
          const ok = q.answers.some(function (a) { return a.replace(/\s+/g, "") === v; });
          if (ok) { got += 4; right++; }
          detail.push({ n: count, ok: ok, ans: q.answers[0], explain: q.explain });
        } else {
          total += 12;
          let r;
          const code = examState.code[key] || q.starter;
          try {
            r = execute(code);
            const res = r.error ? { ok: false, msg: r.error } : q.verify(r);
            if (res.ok) { got += 12; right++; }
            detail.push({ n: count, ok: res.ok, ans: "见代码参考答案", explain: res.msg });
          } catch (err) {
            detail.push({ n: count, ok: false, ans: "-", explain: err.message });
          }
        }
      });
    });
    scoreBox.innerHTML = "";
    scoreBox.appendChild(el("div", { class: "score-main", text: "得分：" + got + " / " + total + "（" + right + " / " + count + " 题正确）" }));
    const list = el("ul", { class: "score-list" });
    detail.forEach(function (d) {
      list.appendChild(el("li", { class: d.ok ? "s-ok" : "s-bad", text: (d.ok ? "✓ " : "✗ ") + "第 " + d.n + " 题　正确答案：" + d.ans + "　" + d.explain }));
    });
    scoreBox.appendChild(list);
  }

  /* ---------------- 速查表 ---------------- */
  function showSheet() {
    const v = $("#view-sheet");
    v.innerHTML = "";
    v.appendChild(el("div", { class: "page-head" }, [
      el("h2", { text: "语法速查表" }),
      el("p", { class: "lede", text: "考前把这一页从头到尾看一遍，基本语法就不会卡壳。" }),
    ]));
    const groups = [
      ["矩阵创建", [
        ["[1 2 3]", "行向量"],
        ["[1; 2; 3]", "列向量"],
        ["[1 2; 3 4]", "2×2 矩阵"],
        ["a:s:b", "从 a 到 b，步长 s"],
        ["linspace(a,b,n)", "等分 n 个点"],
        ["zeros(m,n) / ones(m,n) / eye(n)", "全 0 / 全 1 / 单位矩阵"],
        ["rand(m,n)", "0~1 随机数"],
      ]],
      ["取值与修改", [
        ["A(i,j)", "第 i 行第 j 列"],
        ["A(:,j)", "第 j 列"],
        ["A(i,:)", "第 i 行"],
        ["A(1:3)", "线性索引前三个"],
        ["A(end)", "最后一个元素"],
        ["A(A>5)", "逻辑索引"],
        ["A(i) = []", "删除元素"],
        ["[a b] / [a; b]", "横向 / 纵向拼接"],
      ]],
      ["运算", [
        ["+ - * / ^", "矩阵运算"],
        [".* ./ .^", "元素级运算"],
        ["A \\ B", "解 A*X = B"],
        ["== ~= < > <= >=", "关系运算，返回 0/1"],
        ["& | ~", "逻辑运算"],
        ["&& ||", "短路逻辑（用于条件判断）"],
        ["'", "转置"],
      ]],
      ["常用函数", [
        ["size / length / numel", "尺寸 / 长度 / 元素个数"],
        ["sum / prod / mean / median", "和 / 积 / 平均 / 中位数"],
        ["max / min / sort", "最大 / 最小 / 排序"],
        ["find / any / all", "查找位置 / 任一 / 全部"],
        ["zeros ones eye reshape repmat", "矩阵生成"],
        ["det / inv / rank / trace / eig", "线性代数"],
        ["polyval / polyfit / roots / conv", "多项式"],
        ["interp1 / trapz / diff", "插值 / 积分 / 差分"],
        ["num2str / str2num / strcmp", "字符串转换与比较"],
        ["disp / fprintf / sprintf", "输出"],
      ]],
      ["程序结构", [
        ["if ... elseif ... else ... end", "选择"],
        ["switch ... case ... otherwise ... end", "多分支"],
        ["for i = 1:n ... end", "计数循环"],
        ["while cond ... end", "条件循环"],
        ["break / continue / return", "跳出 / 跳过 / 返回"],
        ["function [a,b] = f(x,y) ... end", "函数定义"],
      ]],
      ["绘图", [
        ["plot(x,y,'r--o')", "曲线 + 线型颜色标记"],
        ["bar / stem / scatter / pie / hist", "柱状 / 火柴杆 / 散点 / 饼图 / 直方图"],
        ["title / xlabel / ylabel", "标题与轴标签"],
        ["legend('a','b')", "图例"],
        ["grid on / hold on / axis([...])", "网格 / 保持 / 坐标范围"],
        ["subplot(m,n,p)", "子图"],
        ["figure / clf / close", "新窗口 / 清空 / 关闭"],
      ]],
    ];
    groups.forEach(function (g) {
      v.appendChild(el("h3", { class: "section-h", text: g[0] }));
      const t = el("table", { class: "md-table" });
      t.appendChild(el("thead", null, [el("tr", null, [el("th", { text: "写法" }), el("th", { text: "说明" })])]));
      const tb = el("tbody");
      g[1].forEach(function (r) {
        tb.appendChild(el("tr", null, [el("td", null, [el("code", { text: r[0] })]), el("td", { text: r[1] })]));
      });
      t.appendChild(tb);
      v.appendChild(t);
    });
    setView("sheet");
  }

  /* ---------------- 初始化 ---------------- */
  function init() {
    renderToc();
    renderProgress();
    showHome();
    $$(".nav-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        const v = b.getAttribute("data-view");
        if (v === "home") showHome();
        else if (v === "lab") openLab("");
        else if (v === "exam") showExam();
        else if (v === "sheet") showSheet();
      });
    });
    $("#searchBox").addEventListener("input", function (e) {
      filterText = e.target.value;
      renderToc();
    });
    $("#menuBtn").addEventListener("click", function () {
      $(".shell").classList.toggle("nav-open");
    });
    $("#resetProgress").addEventListener("click", function () {
      if (global.confirm("确定要清空所有学习进度吗？")) {
        progress = {};
        save();
        renderProgress();
        renderToc();
        showHome();
      }
    });
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", init);
  else init();
})(window);
