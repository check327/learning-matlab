/* 词法分析：把 MATLAB 代码切成记号 */
(function (global) {
  "use strict";
  const ML = global.ML || (global.ML = {});

  const MULTI = [".*", "./", ".\\", ".^", ".'", "==", "~=", "<=", ">=", "&&", "||"];
  const SINGLE = "+-*/\\^=<>~&|()[]{},;:'.@";

  function lex(src) {
    const tokens = [];
    let i = 0;
    let line = 1;
    const n = src.length;
    let prevSig = null;
    let pendingSpace = false;

    const endsOperand = () =>
      prevSig &&
      (prevSig.type === "num" ||
        prevSig.type === "ident" ||
        prevSig.type === "str" ||
        prevSig.type === "rparen" ||
        prevSig.type === "rbracket" ||
        prevSig.type === "rbrace" ||
        prevSig.type === "transpose");

    function push(type, value) {
      const t = { type: type, value: value, line: line, spaceBefore: pendingSpace };
      tokens.push(t);
      if (type !== "newline" && type !== "comment") prevSig = t;
      pendingSpace = false;
      return t;
    }

    while (i < n) {
      const c = src[i];

      if (c === "%") {
        while (i < n && src[i] !== "\n") i++;
        continue;
      }
      if (c === " " || c === "\t" || c === "\r") {
        pendingSpace = true;
        i++;
        continue;
      }
      if (c === "\n") {
        push("newline", "\n");
        prevSig = null;
        pendingSpace = false;
        line++;
        i++;
        continue;
      }
      if (c === "." && src.slice(i, i + 3) === "...") {
        i += 3;
        while (i < n && src[i] !== "\n") i++;
        pendingSpace = true;
        continue;
      }
      if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(src[i + 1] || ""))) {
        let j = i;
        while (j < n && /[0-9]/.test(src[j])) j++;
        if (src[j] === "." && /[0-9]/.test(src[j + 1] || "")) {
          j++;
          while (j < n && /[0-9]/.test(src[j])) j++;
        }
        if (src[j] === "e" || src[j] === "E") {
          let k = j + 1;
          if (src[k] === "+" || src[k] === "-") k++;
          if (/[0-9]/.test(src[k] || "")) {
            k++;
            while (k < n && /[0-9]/.test(src[k])) k++;
            j = k;
          }
        }
        push("num", parseFloat(src.slice(i, j)));
        i = j;
        continue;
      }
      if (/[A-Za-z_]/.test(c)) {
        let j = i;
        while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++;
        push("ident", src.slice(i, j));
        i = j;
        continue;
      }
      if (c === "'") {
        const gluesToPrev = endsOperand() && prevSig.type !== "str";
        // 与 MATLAB 一致：引号紧跟在操作数后面（中间没有空格）表示转置；
        // 中间有空格，则认为是字符串的开头，例如 [name '的成绩是 ' ...]。
        if (gluesToPrev && !pendingSpace) {
          push("transpose", "'");
          i++;
          continue;
        }
        let j = i + 1;
        let out = "";
        let closed = false;
        while (j < n) {
          if (src[j] === "'") {
            if (src[j + 1] === "'") {
              out += "'";
              j += 2;
              continue;
            }
            closed = true;
            j++;
            break;
          }
          out += src[j];
          if (src[j] === "\n") line++;
          j++;
        }
        if (!closed) throw new ML.MLError("第 " + line + " 行：字符串缺少右单引号 '");
        push("str", out);
        i = j;
        continue;
      }
      if (c === '"') {
        let j = i + 1;
        let out = "";
        while (j < n && src[j] !== '"') {
          out += src[j];
          j++;
        }
        push("str", out);
        i = j + 1;
        continue;
      }

      const two = src.slice(i, i + 2);
      if (MULTI.indexOf(two) >= 0) {
        push("op", two);
        i += 2;
        continue;
      }
      if (c === "." && /[A-Za-z]/.test(src[i + 1] || "")) {
        push("op", ".");
        i++;
        continue;
      }
      if (SINGLE.indexOf(c) >= 0) {
        const named = {
          "(": "lparen",
          ")": "rparen",
          "[": "lbracket",
          "]": "rbracket",
          "{": "lbrace",
          "}": "rbrace",
        };
        push(named[c] || "op", c);
        i++;
        continue;
      }
      throw new ML.MLError("第 " + line + " 行：无法识别的字符 “" + c + "”");
    }
    tokens.push({ type: "eof", value: null, line: line });
    return tokens;
  }

  ML.lex = lex;
})(window);
