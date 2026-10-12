/* 语法分析：记号 → 抽象语法树 */
(function (global) {
  "use strict";
  const ML = global.ML || (global.ML = {});

  const COMMANDS = {
    format: 1, hold: 1, grid: 1, clc: 1, clear: 1, close: 1, axis: 1, xlabel: 1,
    ylabel: 1, zlabel: 1, title: 1, legend: 1, figure: 1, subplot: 1, colormap: 1,
    help: 1, who: 1, whos: 1, warning: 1, echo: 1, shg: 1, box: 1, view: 1,
    text: 1, pause: 1, disp: 1, error: 1, save: 1, load: 1, doc: 1,
  };

  const REL = { "==": 1, "~=": 1, "<": 1, ">": 1, "<=": 1, ">=": 1 };
  const MUL = { "*": 1, "/": 1, "\\": 1, ".*": 1, "./": 1, ".\\": 1 };
  const ADD = { "+": 1, "-": 1 };
  const AND = { "&": 1, "&&": 1 };
  const OR = { "|": 1, "||": 1 };
  const POW = { "^": 1, ".^": 1 };

  function parse(src) {
    const tokens = ML.lex(src);
    let pos = 0;
    let matrixDepth = 0;

    const peek = (k) => tokens[Math.min(pos + (k || 0), tokens.length - 1)];
    const next = () => tokens[pos++];
    const at = (type, value) => {
      const t = peek();
      return t.type === type && (value === undefined || t.value === value);
    };
    const isKw = (name) => peek().type === "ident" && peek().value === name;
    const isSep = (t) => t.type === "newline" || (t.type === "op" && (t.value === ";" || t.value === ","));
    const expect = (type, value) => {
      if (!at(type, value)) {
        const t = peek();
        const shown = value !== undefined ? value : type;
        throw new ML.MLError("第 " + t.line + " 行：这里应该是 “" + shown + "”，实际是 “" + (t.value === null ? "文件结尾" : t.value) + "”");
      }
      return next();
    };

    function parseProgram() {
      const body = [];
      const funcs = [];
      while (peek().type !== "eof") {
        if (isSep(peek()) || peek().type === "newline") {
          next();
          continue;
        }
        const st = parseStatement();
        if (st.t === "function") funcs.push(st);
        else body.push(st);
      }
      return { t: "program", body: body, funcs: funcs };
    }

    function parseBlock(terminators) {
      const out = [];
      for (;;) {
        const t = peek();
        if (t.type === "eof") break;
        if (t.type === "ident" && terminators.indexOf(t.value) >= 0) break;
        if (isSep(t)) {
          next();
          continue;
        }
        out.push(parseStatement());
      }
      return out;
    }

    function parseStatement() {
      const t = peek();
      if (t.type === "ident") {
        switch (t.value) {
          case "if": return parseIf();
          case "for": return parseFor();
          case "while": return parseWhile();
          case "switch": return parseSwitch();
          case "function": return parseFunction();
          case "break": next(); return { t: "break" };
          case "continue": next(); return { t: "continue" };
          case "return": next(); return { t: "return" };
          case "global": {
            next();
            const names = [];
            while (peek().type === "ident") names.push(next().value);
            return { t: "global", names: names };
          }
        }
      }
      return parseSimple();
    }

    function parseSimple() {
      const t = peek();
      if (t.type === "ident" && COMMANDS[t.value]) {
        const n1 = peek(1);
        if (n1.type === "ident" || n1.type === "str" || n1.type === "num") {
          next();
          const args = [];
          while (peek().type === "ident" || peek().type === "str" || peek().type === "num") {
            const a = next();
            args.push(
              a.type === "str" ? { t: "str", value: a.value }
                : a.type === "num" ? { t: "num", value: a.value }
                  : { t: "var", name: a.value }
            );
            if (peek().type === "newline" || peek().type === "eof") break;
            if (peek().type === "op" && peek().value === ";") break;
          }
          return { t: "command", name: t.value, args: args };
        }
        if (isSep(n1) || n1.type === "eof") {
          next();
          return { t: "command", name: t.value, args: [] };
        }
      }

      const left = parseExpr();
      if (at("op", "=")) {
        next();
        const rhs = parseExpr();
        if (left.t === "matrix") {
          const flat = [];
          for (const row of left.rows) for (const el of row) flat.push(el);
          if (!flat.length || !flat.every(isLValue)) {
            throw new ML.MLError("第 " + left.line + " 行：赋值号左边不是合法的变量");
          }
          return { t: "multiassign", targets: flat, expr: rhs, suppressed: sepAhead() };
        }
        if (!isLValue(left)) {
          throw new ML.MLError("第 " + left.line + " 行：赋值号左边不是合法的变量");
        }
        return { t: "assign", target: left, expr: rhs, suppressed: sepAhead() };
      }
      return { t: "expr", expr: left, suppressed: sepAhead() };
    }

    function sepAhead() {
      const t = peek();
      return t.type === "op" && t.value === ";";
    }

    function isLValue(node) {
      return node && (node.t === "var" || node.t === "callIndex" || node.t === "field");
    }

    function parseIf() {
      next();
      const branches = [];
      branches.push({ cond: parseExpr(), body: parseBlock(["elseif", "else", "end"]) });
      while (isKw("elseif")) {
        next();
        branches.push({ cond: parseExpr(), body: parseBlock(["elseif", "else", "end"]) });
      }
      let elseBody = null;
      if (isKw("else")) {
        next();
        elseBody = parseBlock(["end"]);
      }
      expect("ident", "end");
      return { t: "if", branches: branches, elseBody: elseBody };
    }

    function parseFor() {
      next();
      const v = expect("ident");
      expect("op", "=");
      const iter = parseExpr();
      const body = parseBlock(["end"]);
      expect("ident", "end");
      return { t: "for", varName: v.value, iter: iter, body: body, line: v.line };
    }

    function parseWhile() {
      next();
      const cond = parseExpr();
      const body = parseBlock(["end"]);
      expect("ident", "end");
      return { t: "while", cond: cond, body: body };
    }

    function parseSwitch() {
      next();
      const subject = parseExpr();
      const cases = [];
      let otherwise = null;
      skipSeps();
      while (isKw("case")) {
        next();
        const values = [parseExpr()];
        skipSeps();
        while (at("op", "|")) {
          next();
          values.push(parseExpr());
          skipSeps();
        }
        cases.push({ values: values, body: parseBlock(["case", "otherwise", "end"]) });
        skipSeps();
      }
      if (isKw("otherwise")) {
        next();
        otherwise = parseBlock(["end"]);
      }
      expect("ident", "end");
      return { t: "switch", subject: subject, cases: cases, otherwise: otherwise };
    }

    function skipSeps() {
      while (peek().type === "newline" || at("op", ";") || at("op", ",")) next();
    }

    function parseFunction() {
      next();
      const outputs = [];
      if (at("lbracket")) {
        next();
        while (peek().type !== "rbracket") {
          if (at("op", ",")) { next(); continue; }
          const e = parseExpr();
          if (e.t !== "var") throw new ML.MLError("函数输出必须是变量名");
          outputs.push(e.name);
        }
        next();
        expect("op", "=");
      } else if (peek().type === "ident" && peek(1).type === "op" && peek(1).value === "=") {
        outputs.push(next().value);
        next();
      }
      const name = expect("ident").value;
      const params = [];
      if (at("lparen")) {
        next();
        while (peek().type !== "rparen") {
          if (at("op", ",")) { next(); continue; }
          params.push(expect("ident").value);
        }
        next();
      }
      const body = parseBlock(["end"]);
      expect("ident", "end");
      return { t: "function", name: name, outputs: outputs, params: params, body: body };
    }

    /* ---------------- 表达式 ---------------- */

    function parseExpr() {
      if (at("op", ":")) {
        next();
        return { t: "colon" };
      }
      return parseOr();
    }

    function parseArgs(kind) {
      // kind: 'paren' | 'brace'
      const closeType = kind === "paren" ? "rparen" : "rbrace";
      next();
      const args = [];
      while (peek().type !== closeType) {
        if (peek().type === "eof") throw new ML.MLError("括号没有闭合");
        if (at("op", ",") || peek().type === "newline") {
          next();
          if (args.length === 0) args.push({ t: "colon" });
          continue;
        }
        args.push(parseExpr());
      }
      next();
      if (!args.length) args.push({ t: "colon" });
      return args;
    }

    function parseOr() {
      let left = parseAnd();
      while (peek().type === "op" && OR[peek().value]) {
        const op = next().value;
        left = { t: "binary", op: op, left: left, right: parseAnd() };
      }
      return left;
    }
    function parseAnd() {
      let left = parseRel();
      while (peek().type === "op" && AND[peek().value]) {
        const op = next().value;
        left = { t: "binary", op: op, left: left, right: parseRel() };
      }
      return left;
    }
    function parseRel() {
      let left = parseColon();
      if (peek().type === "op" && REL[peek().value]) {
        const op = next().value;
        left = { t: "binary", op: op, left: left, right: parseColon() };
      }
      return left;
    }
    function parseColon() {
      let left = parseAdd();
      if (at("op", ":")) {
        next();
        const second = parseAdd();
        if (at("op", ":")) {
          next();
          const third = parseAdd();
          return { t: "range", start: left, step: second, end: third };
        }
        return { t: "range", start: left, step: null, end: second };
      }
      return left;
    }
    function parseAdd() {
      let left = parseMul();
      for (;;) {
        const t = peek();
        if (t.type === "op" && ADD[t.value]) {
          if (matrixDepth > 0 && t.spaceBefore && !peek(1).spaceBefore) break;
          next();
          left = { t: "binary", op: t.value, left: left, right: parseMul() };
          continue;
        }
        break;
      }
      return left;
    }
    function parseMul() {
      let left = parseUnary();
      while (peek().type === "op" && MUL[peek().value]) {
        const op = next().value;
        left = { t: "binary", op: op, left: left, right: parseUnary() };
      }
      return left;
    }
    function parseUnary() {
      const t = peek();
      if (t.type === "op" && (t.value === "-" || t.value === "+" || t.value === "~")) {
        next();
        return { t: "unary", op: t.value, operand: parseUnary() };
      }
      return parsePow();
    }
    function parsePow() {
      const base = parsePostfix();
      if (peek().type === "op" && POW[peek().value]) {
        const op = next().value;
        return { t: "binary", op: op, left: base, right: parseUnary() };
      }
      return base;
    }
    function parsePostfix() {
      let node = parsePrimary();
      for (;;) {
        const t = peek();
        if (t.type === "lparen") {
          node = { t: "callIndex", base: node, args: parseArgs("paren"), kind: "()", line: t.line };
          continue;
        }
        if (t.type === "lbrace") {
          node = { t: "callIndex", base: node, args: parseArgs("brace"), kind: "{}", line: t.line };
          continue;
        }
        if (t.type === "transpose") {
          next();
          node = { t: "transpose", operand: node, conj: true };
          continue;
        }
        if (t.type === "op" && t.value === ".'") {
          next();
          node = { t: "transpose", operand: node, conj: false };
          continue;
        }
        if (t.type === "op" && t.value === ".") {
          next();
          const f = expect("ident");
          node = { t: "field", base: node, name: f.value };
          continue;
        }
        break;
      }
      return node;
    }
    function parsePrimary() {
      const t = peek();
      if (t.type === "num") {
        next();
        return { t: "num", value: t.value, line: t.line };
      }
      if (t.type === "str") {
        next();
        return { t: "str", value: t.value, line: t.line };
      }
      if (t.type === "ident") {
        next();
        if (t.value === "end") return { t: "end", line: t.line };
        if (t.value === "true") return { t: "num", value: 1 };
        if (t.value === "false") return { t: "num", value: 0 };
        if (t.value === "pi") return { t: "num", value: Math.PI };
        if (t.value === "Inf" || t.value === "inf") return { t: "num", value: Infinity };
        if (t.value === "NaN" || t.value === "nan") return { t: "num", value: NaN };
        if (t.value === "eps") return { t: "num", value: Number.EPSILON };
        return { t: "var", name: t.value, line: t.line };
      }
      if (t.type === "lparen") {
        next();
        const e = parseExpr();
        expect("rparen");
        return e;
      }
      if (t.type === "lbracket") {
        matrixDepth++;
        next();
        const rows = [[]];
        for (;;) {
          const k = peek();
          if (k.type === "rbracket") { next(); break; }
          if (k.type === "eof") throw new ML.MLError("第 " + t.line + " 行：方括号 [ 没有闭合");
          if (k.type === "newline") { next(); if (rows[rows.length - 1].length) rows.push([]); continue; }
          if (k.type === "op" && k.value === ";") { next(); if (rows[rows.length - 1].length) rows.push([]); continue; }
          if (k.type === "op" && k.value === ",") { next(); continue; }
          rows[rows.length - 1].push(parseExpr());
        }
        matrixDepth--;
        const clean = rows.filter((r) => r.length);
        return { t: "matrix", rows: clean.length ? clean : [[]], line: t.line };
      }
      if (t.type === "lbrace") {
        matrixDepth++;
        next();
        const rows = [[]];
        for (;;) {
          const k = peek();
          if (k.type === "rbrace") { next(); break; }
          if (k.type === "eof") throw new ML.MLError("第 " + t.line + " 行：花括号 { 没有闭合");
          if (k.type === "newline") { next(); continue; }
          if (k.type === "op" && k.value === ";") { next(); if (rows[rows.length - 1].length) rows.push([]); continue; }
          if (k.type === "op" && k.value === ",") { next(); continue; }
          rows[rows.length - 1].push(parseExpr());
        }
        matrixDepth--;
        const clean = rows.filter((r) => r.length);
        return { t: "cell", rows: clean.length ? clean : [[]], line: t.line };
      }
      if (t.type === "op" && t.value === ":") {
        next();
        return { t: "colon" };
      }
      if (t.type === "op" && t.value === "@") {
        next();
        const name = expect("ident").value;
        return { t: "fhandle", name: name, line: t.line };
      }
      throw new ML.MLError("第 " + t.line + " 行：这里出现了无法理解的符号 “" + (t.value === null ? "文件结尾" : t.value) + "”");
    }

    return parseProgram();
  }

  ML.parse = parse;
})(window);
