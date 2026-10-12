/* MATLAB 子集解释器 —— 数值/矩阵表示与格式化 */
(function (global) {
  "use strict";

  const ML = global.ML || (global.ML = {});

  class MMatrix {
    constructor(data, rows, cols) {
      this.rows = rows;
      this.cols = cols;
      this.data = data; // number[rows][cols]
    }
    static scalar(v) {
      return new MMatrix([[v]], 1, 1);
    }
    static from(data) {
      const rows = data.length;
      const cols = rows ? data[0].length : 0;
      return new MMatrix(data.map((r) => r.slice()), rows, cols);
    }
    static zeros(rows, cols) {
      const d = [];
      for (let i = 0; i < rows; i++) d.push(new Array(cols).fill(0));
      return new MMatrix(d, rows, cols);
    }
    static ones(rows, cols) {
      const d = [];
      for (let i = 0; i < rows; i++) d.push(new Array(cols).fill(1));
      return new MMatrix(d, rows, cols);
    }
    static eye(n, m) {
      const cols = m === undefined ? n : m;
      const d = [];
      for (let i = 0; i < n; i++) {
        const row = new Array(cols).fill(0);
        if (i < cols) row[i] = 1;
        d.push(row);
      }
      return new MMatrix(d, n, cols);
    }
    get(i, j) {
      return this.data[i - 1][j - 1];
    }
    set(i, j, v) {
      this.data[i - 1][j - 1] = v;
    }
    copy() {
      return MMatrix.from(this.data);
    }
    isVector() {
      return this.rows === 1 || this.cols === 1;
    }
    isScalar() {
      return this.rows === 1 && this.cols === 1;
    }
    indexed(i, j) {
      return this.data[i - 1][j - 1];
    }
    toVector() {
      if (this.rows === 1) return this.data[0].slice();
      if (this.cols === 1) return this.data.map((r) => r[0]);
      throw new MLError("需要是向量");
    }
  }

  /* 单元格数组 */
  class MCell {
    constructor(cells, rows, cols) {
      this.cells = cells; // Value[]
      this.rows = rows;
      this.cols = cols;
    }
  }

  /* 结构体 */
  class MStruct {
    constructor(fields) {
      this.fields = fields || {}; // name -> Value
    }
  }

  class MLError extends Error {}

  /* 数值 → 显示字符串（接近 MATLAB 的简短格式） */
  function fmtNum(x) {
    if (typeof x !== "number") return String(x);
    if (Number.isInteger(x) && Math.abs(x) < 1e15) return String(x);
    if (!isFinite(x)) return x > 0 ? "Inf" : x < 0 ? "-Inf" : "NaN";
    if (x === 0) return "0";
    const ax = Math.abs(x);
    if (ax >= 1e5 || ax < 1e-4) {
      let s = x.toExponential(4);
      s = s.replace(/e([+-])(\d)$/, "e$10$2").replace(/(\.\d*?)0+e/, "$1e").replace(/\.e/, "e");
      return s;
    }
    let s = x.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
    return s;
  }

  function isNumeric(value) {
    return typeof value === "number" || value instanceof MMatrix || typeof value === "boolean";
  }

  function toMatrix(value, ctx) {
    if (value instanceof MMatrix) return value;
    if (typeof value === "number") return MMatrix.scalar(value);
    if (typeof value === "boolean") return MMatrix.scalar(value ? 1 : 0);
    throw new MLError("此处需要数值或矩阵：" + typeName(value));
  }

  function toScalar(value, ctx) {
    if (typeof value === "number") return value;
    if (typeof value === "boolean") return value ? 1 : 0;
    if (value instanceof MMatrix && value.isScalar()) return value.data[0][0];
    throw new MLError("此处需要标量，得到：" + typeName(value));
  }

  function toLogical(value) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (value instanceof MMatrix) {
      if (!value.isScalar()) throw new MLError("条件需要标量逻辑值，得到 " + value.rows + "×" + value.cols + " 矩阵");
      return value.data[0][0] !== 0;
    }
    throw new MLError("条件需要逻辑值");
  }

  /* 矩阵 → 逻辑矩阵（元素级） */
  function toLogicalMatrix(value) {
    const m = toMatrix(value);
    return MMatrix.from(m.data.map((r) => r.map((v) => (v !== 0 ? 1 : 0))));
  }

  function typeName(value) {
    if (value === null || value === undefined) return "未定义";
    if (typeof value === "number") return "double";
    if (typeof value === "boolean") return "logical";
    if (typeof value === "string") return "char";
    if (value instanceof MMatrix) return value.isScalar() ? "double" : "double 矩阵";
    if (value instanceof MCell) return "cell";
    if (value instanceof MStruct) return "struct";
    if (typeof value === "function") return "function";
    if (value && value.__func) return "function";
    return typeof value;
  }

  /* 渲染为多行文本（模拟命令行输出） */
  function formatValue(value, name) {
    const head = name ? name + " =\n" : "";
    if (typeof value === "number") return head + "  " + fmtNum(value) + "\n";
    if (typeof value === "boolean") return head + "  " + (value ? "1" : "0") + "\n  (logical)\n";
    if (typeof value === "string") return head + formatCharMatrix(value);
    if (value instanceof MMatrix) return head + formatMatrix(value);
    if (value instanceof MCell) {
      const lines = [];
      for (let i = 0; i < value.rows; i++) {
        const row = [];
        for (let j = 0; j < value.cols; j++) row.push(formatCell(value.cells[j * value.rows + i]));
        lines.push(row.join("  "));
      }
      return head + "    " + lines.join(";\n    ") + "\n";
    }
    if (value instanceof MStruct) {
      const keys = Object.keys(value.fields);
      const lines = keys.map((k) => "    " + k + ": " + briefValue(value.fields[k]));
      return head + (lines.length ? lines.join("\n") + "\n" : "    1×1 struct array with no fields.\n");
    }
    if (value && value.__func) return head + "    @" + value.name + "\n";
    return head + "  " + String(value) + "\n";
  }

  function briefValue(value) {
    if (typeof value === "number") return "[" + fmtNum(value) + "]";
    if (value instanceof MMatrix) return "[" + value.rows + "×" + value.cols + " double]";
    if (typeof value === "string") return "'" + value + "'";
    if (typeof value === "boolean") return "logical";
    return typeName(value);
  }

  function formatCell(value) {
    if (typeof value === "string") return "[" + "'" + value + "'" + "]";
    return "[" + briefValue(value) + "]";
  }

  function formatCharMatrix(s) {
    const rows = s.split("\n");
    if (rows.length === 1) return "    '" + s + "'\n";
    const width = Math.max(...rows.map((r) => r.length));
    const pad = "    ";
    const head = "'" + rows[0].padEnd(width) + "'\n";
    const middle = rows.slice(1, -1).map((r) => pad + "'" + r.padEnd(width) + "'").join("\n");
    const tail = "\n" + pad + "'" + rows[rows.length - 1].padEnd(width) + "'\n";
    return middle ? head + middle + tail : head + tail;
  }

  function formatMatrix(m) {
    const cells = m.data.map((row) => row.map((v) => fmtNum(v)));
    const widths = [];
    for (let j = 0; j < m.cols; j++) {
      let w = 0;
      for (let i = 0; i < m.rows; i++) w = Math.max(w, cells[i][j].length);
      widths.push(w);
    }
    let out = "";
    for (let i = 0; i < m.rows; i++) {
      let line = "  ";
      for (let j = 0; j < m.cols; j++) {
        const pad = j === m.cols - 1 ? "" : "  ";
        line += cells[i][j].padStart(widths[j] + 2) + pad;
      }
      out += line.replace(/\s+$/, "") + "\n";
    }
    return out;
  }

  function deepEqualValue(a, b) {
    if (typeof a === "number" && typeof b === "number") return Math.abs(a - b) < 1e-9;
    if (typeof a === "boolean" && typeof b === "boolean") return a === b;
    if (typeof a === "string" && typeof b === "string") return a === b;
    if (a instanceof MMatrix && b instanceof MMatrix) {
      if (a.rows !== b.rows || a.cols !== b.cols) return false;
      for (let i = 0; i < a.rows; i++)
        for (let j = 0; j < a.cols; j++)
          if (Math.abs(a.data[i][j] - b.data[i][j]) > 1e-9) return false;
      return true;
    }
    return false;
  }

  /* MATLAB 的变量是“值语义”：b = a 之后修改 b 不影响 a。
     所以赋值时把矩阵/元胞/结构体复制一份。 */
  function cloneValue(v) {
    if (v instanceof MMatrix) {
      const m = MMatrix.from(v.data);
      if (v.logical) m.logical = true;
      return m;
    }
    if (v instanceof MCell) {
      return new MCell(v.cells.map(cloneValue), v.rows, v.cols);
    }
    if (v instanceof MStruct) {
      const f = {};
      Object.keys(v.fields).forEach(function (k) { f[k] = cloneValue(v.fields[k]); });
      return new MStruct(f);
    }
    return v;
  }

  ML.MMatrix = MMatrix;
  ML.MCell = MCell;
  ML.MStruct = MStruct;
  ML.MLError = MLError;
  ML.fmtNum = fmtNum;
  ML.toMatrix = toMatrix;
  ML.toScalar = toScalar;
  ML.toLogical = toLogical;
  ML.toLogicalMatrix = toLogicalMatrix;
  ML.typeName = typeName;
  ML.formatValue = formatValue;
  ML.briefValue = briefValue;
  ML.deepEqualValue = deepEqualValue;
  ML.cloneValue = cloneValue;
  ML.isNumeric = isNumeric;
})(window);
