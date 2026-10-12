/* 解释器：执行语法树 */
(function (global) {
  "use strict";
  const ML = global.ML || (global.ML = {});
  const MMatrix = ML.MMatrix;
  const MCell = ML.MCell;
  const MStruct = ML.MStruct;
  const MLError = ML.MLError;
  const MultiOut = ML.MultiOut;

  const isM = (v) => v instanceof MMatrix;

  class Signal {
    constructor(kind) { this.kind = kind; }
  }

  function makeRng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  class Ctx {
    constructor(opts) {
      opts = opts || {};
      this.globals = {};
      this.locals = null;
      this.globalNames = {};
      this.functions = {};
      this.out = [];
      this.figures = [];
      this.current = null;
      this.nargout = 1;
      this.statement = null;
      this.endValue = null;
      this.depth = 0;
      this.random = makeRng(opts.seed === undefined ? 20260101 : opts.seed);
      this.steps = 0;
      this.maxSteps = opts.maxSteps || 4000000;
    }
    write(s) { this.out.push(s); }
    clear() { this.out.length = 0; }
    clearAll() { this.globals = {}; }
    deleteVar(n) { delete this.globals[n]; }
    varNames() { return Object.keys(this.globals).sort(); }
    getVar(n) { return this.globals[n]; }
    tick() {
      if (++this.steps > this.maxSteps) throw new MLError("程序运行步数过多（可能是死循环），已自动停止。请检查 for / while 的循环条件。");
    }
    /* 图形 */
    newFigure() {
      this.current = {
        series: [], title: "", xlabel: "", ylabel: "", legend: null,
        grid: false, hold: false, box: false, axis: null, xlim: null, ylim: null,
        subplot: null, touched: false,
      };
      this.figures.push(this.current);
      return this.current;
    }
    currentFigure() {
      if (!this.current) {
        const wasEmpty = this.figures.length === 0;
        this.newFigure();
        if (wasEmpty) this.current.implicit = true;
      }
      return this.current;
    }
    closeFigures() { this.figures = []; this.current = null; }

    lookup(name) {
      if (this.globalNames[name]) return this.globals[name];
      if (this.locals && Object.prototype.hasOwnProperty.call(this.locals, name)) return this.locals[name];
      if (Object.prototype.hasOwnProperty.call(this.globals, name)) return this.globals[name];
      return undefined;
    }
    has(name) { return this.lookup(name) !== undefined; }
    assign(name, value) {
      const v = ML.cloneValue(value);
      if (this.globalNames[name]) { this.globals[name] = v; return; }
      if (this.locals) this.locals[name] = v;
      else this.globals[name] = v;
    }
  }

  /* ------------------- 索引 ------------------- */
  function colonList(n) {
    const out = [];
    for (let i = 1; i <= n; i++) out.push(i);
    return out;
  }

  function resolveIndex(ctx, node, endVal) {
    if (!node) return { kind: "colon" };
    if (node.t === "colon") return { kind: "colon" };
    const prevEnd = ctx.endValue;
    ctx.endValue = endVal;
    let value;
    try {
      value = evalExpr(ctx, node);
    } finally {
      ctx.endValue = prevEnd;
    }
    if (isM(value) && value.logical) {
      const idx = [];
      const cols = value.cols, rows = value.rows;
      if (rows === 1 || cols === 1) {
        const v = value.toVector();
        v.forEach((x, i) => { if (x !== 0) idx.push(i + 1); });
      } else {
        for (let j = 0; j < cols; j++) for (let i = 0; i < rows; i++) if (value.data[i][j] !== 0) idx.push(j * value.rows + i + 1);
      }
      return { kind: "list", idx: idx, shape: value.rows === 1 ? [1, value.cols] : (value.cols === 1 ? [value.rows, 1] : [value.rows, value.cols]), logical: true };
    }
    const m = ML.toMatrix(value);
    if (m.isScalar()) return { kind: "list", idx: [Math.round(m.data[0][0])], shape: [1, 1] };
    const v = m.toVector().map((x) => Math.round(x));
    return { kind: "list", idx: v, shape: [m.rows, m.cols] };
  }

  function linearGet(m, idx) {
    const total = m.rows * m.cols;
    const out = [];
    let bad = false;
    idx.forEach((k) => {
      if (k < 1 || k > total) { bad = true; out.push(0); }
      else {
        const j = Math.floor((k - 1) / m.rows);
        const i = (k - 1) % m.rows;
        out.push(m.data[i][j]);
      }
    });
    if (bad) throw new MLError("索引超出范围：矩阵只有 " + total + " 个元素");
    return out;
  }

  function shapeResult(values, shape) {
    if (shape[0] === 1 && shape[1] === 1) return values[0];
    if (shape[0] === 1 || shape[1] === 1) {
      return shape[0] === 1 ? MMatrix.from([values]) : MMatrix.from(values.map((v) => [v]));
    }
    const out = [];
    let k = 0;
    for (let i = 0; i < shape[0]; i++) {
      const row = [];
      for (let j = 0; j < shape[1]; j++) row.push(values[k++]);
      out.push(row);
    }
    return MMatrix.from(out);
  }

  function cellLinear(ctx, args, obj) {
    if (args.length === 1) {
      const r = resolveIndex(ctx, args[0], obj.cells.length);
      return r.kind === "colon" ? colonList(obj.cells.length) : r.idx;
    }
    const ri = resolveIndex(ctx, args[0], obj.rows);
    const ci = resolveIndex(ctx, args[1], obj.cols);
    const rs2 = ri.kind === "colon" ? colonList(obj.rows) : ri.idx;
    const cs2 = ci.kind === "colon" ? colonList(obj.cols) : ci.idx;
    const out = [];
    rs2.forEach((i) => cs2.forEach((j) => out.push((j - 1) * obj.rows + i)));
    return out;
  }

  function getIndex(ctx, obj, args, kind) {
    if (typeof obj === "string") {
      const lines = obj.split("\n");
      if (args.length === 1) {
        const flat = lines.join("");
        const r = resolveIndex(ctx, args[0], flat.length);
        const list = r.kind === "colon" ? colonList(flat.length) : r.idx;
        return list
          .map((k) => {
            if (k < 1 || k > flat.length) throw new MLError("字符串下标超出范围（长度为 " + flat.length + "）");
            return flat.charAt(k - 1);
          })
          .join("");
      }
      const width = Math.max.apply(null, lines.map((l) => l.length));
      const ri = resolveIndex(ctx, args[0], lines.length);
      const ci = resolveIndex(ctx, args[1], width);
      const rs2 = ri.kind === "colon" ? colonList(lines.length) : ri.idx;
      const cs2 = ci.kind === "colon" ? colonList(width) : ci.idx;
      return rs2
        .map((i) => cs2.map((j) => (lines[i - 1] || "").charAt(j - 1) || " ").join(""))
        .join("\n");
    }
    if (obj instanceof MCell) {
      const list = cellLinear(ctx, args, obj);
      const vals = list.map((k) => {
        if (k < 1 || k > obj.cells.length) throw new MLError("元胞数组下标超出范围（共 " + obj.cells.length + " 个元素）");
        return obj.cells[k - 1];
      });
      if (kind === "()") return new MCell(vals, 1, vals.length);
      return vals.length === 1 ? vals[0] : new MCell(vals, 1, vals.length);
    }
    if (obj instanceof MStruct) {
      throw new MLError("结构体请用点号访问字段，如 s.name");
    }
    const m = ML.toMatrix(obj);
    if (args.length === 1) {
      const r = resolveIndex(ctx, args[0], m.rows * m.cols);
      if (r.kind === "colon") {
        return shapeResult(linearGet(m, colonList(m.rows * m.cols)), [m.rows * m.cols, 1]);
      }
      const vals = linearGet(m, r.idx);
      if (r.logical) {
        if (vals.length === 1) return vals[0];
        if (m.cols === 1) return MMatrix.from(vals.map((v) => [v]));
        return MMatrix.from([vals]);
      }
      if (r.idx.length === 1) return vals[0];
      return shapeResult(vals, r.shape);
    }
    const ri = resolveIndex(ctx, args[0], m.rows);
    const ci = resolveIndex(ctx, args[1], m.cols);
    const rows = ri.kind === "colon" ? colonList(m.rows) : ri.idx;
    const cols = ci.kind === "colon" ? colonList(m.cols) : ci.idx;
    const out = [];
    rows.forEach((i) => {
      if (i < 1 || i > m.rows) throw new MLError("行下标超出范围：最多 " + m.rows + " 行");
      const row = [];
      cols.forEach((j) => {
        if (j < 1 || j > m.cols) throw new MLError("列下标超出范围：最多 " + m.cols + " 列");
        row.push(m.data[i - 1][j - 1]);
      });
      out.push(row);
    });
    if (out.length === 1 && out[0].length === 1) return out[0][0];
    return MMatrix.from(out);
  }

  function isEmptyMatrix(v) {
    return isM(v) && (v.rows === 0 || v.cols === 0);
  }

  function setIndex(ctx, obj, args, value) {
    if (obj instanceof MCell) {
      const list = cellLinear(ctx, args, obj);
      list.forEach((k) => {
        if (k < 1 || k > obj.cells.length) throw new MLError("元胞数组下标超出范围");
        obj.cells[k - 1] = value;
      });
      return obj;
    }
    if (!isM(obj)) throw new MLError("不能给这种类型按下标赋值");
    const m = obj;
    if (args.length === 1) {
      const r = resolveIndex(ctx, args[0], m.rows * m.cols);
      if (isEmptyMatrix(value)) {
        const list = r.kind === "colon" ? colonList(m.rows * m.cols) : r.idx;
        return deleteLinear(m, list);
      }
      const list = r.kind === "colon" ? colonList(m.rows * m.cols) : r.idx;
      if (r.kind === "colon") {
        const vals = matValues(value);
        if (vals.length === m.rows * m.cols) {
          let k = 0;
          for (let j = 0; j < m.cols; j++) for (let i = 0; i < m.rows; i++) m.data[i][j] = vals[k++];
          return m;
        }
        const flat = ML.toMatrix(value);
        if (flat.rows * flat.cols === 1) {
          for (let j = 0; j < m.cols; j++) for (let i = 0; i < m.rows; i++) m.data[i][j] = flat.data[0][0];
          return m;
        }
        throw new MLError("A(:) 赋值的元素个数不匹配");
      }
      const vals = matValues(value);
      if (vals.length === 1) {
        list.forEach((k) => {
          if (k < 1 || k > m.rows * m.cols) throw new MLError("索引超出范围");
          const j = Math.floor((k - 1) / m.rows);
          const i = (k - 1) % m.rows;
          m.data[i][j] = vals[0];
        });
        return m;
      }
      if (vals.length !== list.length) throw new MLError("右边有 " + vals.length + " 个元素，左边要放到 " + list.length + " 个位置，个数不一致");
      list.forEach((k, n) => {
        const j = Math.floor((k - 1) / m.rows);
        const i = (k - 1) % m.rows;
        m.data[i][j] = vals[n];
      });
      return m;
    }
    const ri = resolveIndex(ctx, args[0], m.rows);
    const ci = resolveIndex(ctx, args[1], m.cols);
    const rows = ri.kind === "colon" ? colonList(m.rows) : ri.idx;
    const cols = ci.kind === "colon" ? colonList(m.cols) : ci.idx;
    if (isEmptyMatrix(value)) {
      if (cols.length === m.cols && ci.kind === "colon" && rows.length === 1) return deleteRow(m, rows[0]);
      if (rows.length === m.rows && ri.kind === "colon" && cols.length === 1) return deleteCol(m, cols[0]);
      throw new MLError("本环境只支持删除整行 A(i,:) = [] 或整列 A(:,j) = []");
    }
    const vals = matValues(value);
    const count = rows.length * cols.length;
    if (cols.length === 1 && rows.length === 1) {
      m.data[rows[0] - 1][cols[0] - 1] = vals[0];
      return m;
    }
    if (vals.length === 1) {
      rows.forEach((i) => cols.forEach((j) => { m.data[i - 1][j - 1] = vals[0]; }));
      return m;
    }
    if (vals.length !== count) throw new MLError("赋值元素个数不匹配：右边 " + vals.length + " 个，左边 " + count + " 个");
    let k = 0;
    for (let a = 0; a < cols.length; a++) for (let b = 0; b < rows.length; b++) m.data[rows[b] - 1][cols[a] - 1] = vals[k++];
    return m;
  }

  function matValues(v) {
    if (typeof v === "number") return [v];
    if (typeof v === "boolean") return [v ? 1 : 0];
    const m = ML.toMatrix(v);
    const out = [];
    for (let j = 0; j < m.cols; j++) for (let i = 0; i < m.rows; i++) out.push(m.data[i][j]);
    return out;
  }

  function deleteLinear(m, list) {
    const total = m.rows * m.cols;
    const keep = [];
    const drop = {};
    list.forEach((k) => { drop[k] = true; });
    for (let k = 1; k <= total; k++) if (!drop[k]) keep.push(k);
    const m2 = linearGet(m, keep);
    return MMatrix.from([m2]);
  }
  function deleteRow(m, r) {
    const out = [];
    for (let i = 0; i < m.rows; i++) if (i !== r - 1) out.push(m.data[i].slice());
    return out.length ? MMatrix.from(out) : new MMatrix([], 0, 0);
  }
  function deleteCol(m, c) {
    const out = [];
    for (let i = 0; i < m.rows; i++) out.push(m.data[i].filter((_, j) => j !== c - 1));
    return out.length ? MMatrix.from(out) : new MMatrix([], 0, 0);
  }

  /* ------------------- 运算符 ------------------- */
  function evalBinary(ctx, node) {
    const op = node.op;
    if (op === "&&" || op === "||") {
      const l = ML.toLogical(evalExpr(ctx, node.left));
      if (op === "&&") return l ? ML.toLogical(evalExpr(ctx, node.right)) : false;
      return l ? true : ML.toLogical(evalExpr(ctx, node.right));
    }
    const a = evalExpr(ctx, node.left);
    const b = evalExpr(ctx, node.right);
    switch (op) {
      case "+": return arith(a, b, (x, y) => x + y);
      case "-": return arith(a, b, (x, y) => x - y);
      case "*": return matmulValue(a, b);
      case "/": return mrdivide(a, b);
      case "\\": return mldivide(a, b);
      case ".*": return arith(a, b, (x, y) => x * y);
      case "./": return arith(a, b, (x, y) => x / y);
      case ".\\": return arith(a, b, (x, y) => y / x);
      case "^": return mpow(a, b);
      case ".^": return arith(a, b, Math.pow);
      case "&": return logicOp(a, b, (x, y) => x && y);
      case "|": return logicOp(a, b, (x, y) => x || y);
      case "==": return compare(a, b, (x, y) => x === y);
      case "~=": return compare(a, b, (x, y) => x !== y);
      case "<": return compare(a, b, (x, y) => x < y);
      case ">": return compare(a, b, (x, y) => x > y);
      case "<=": return compare(a, b, (x, y) => x <= y);
      case ">=": return compare(a, b, (x, y) => x >= y);
    }
    throw new MLError("不支持的运算符 " + op);
  }

  function scalarify(v) {
    if (isM(v)) {
      if (v.isScalar()) return v.data[0][0];
      return null;
    }
    if (typeof v === "boolean") return v ? 1 : 0;
    return v;
  }

  function arith(a, b, f) {
    const sa = scalarify(a), sb = scalarify(b);
    if (typeof sa === "number" && typeof sb === "number") return f(sa, sb);
    const A = isM(a) ? a : MMatrix.scalar(sa);
    const B = isM(b) ? b : MMatrix.scalar(sb);
    if (A.rows === B.rows && A.cols === B.cols) return MMatrix.from(A.data.map((r, i) => r.map((v, j) => f(v, B.data[i][j]))));
    if (B.isScalar()) return MMatrix.from(A.data.map((r) => r.map((v) => f(v, B.data[0][0]))));
    if (A.isScalar()) return MMatrix.from(B.data.map((r) => r.map((v) => f(A.data[0][0], v))));
    throw new MLError("两个矩阵大小不一致，不能直接做加减/点运算（提示：用 .* 做元素级运算，或检查行列数）");
  }

  function matmulValue(a, b) {
    const sa = scalarify(a), sb = scalarify(b);
    if (typeof sa === "number" && typeof sb === "number") return sa * sb;
    if (typeof sa === "number") {
      const B = ML.toMatrix(b);
      return MMatrix.from(B.data.map((r) => r.map((v) => v * sa)));
    }
    if (typeof sb === "number") {
      const A = ML.toMatrix(a);
      return MMatrix.from(A.data.map((r) => r.map((v) => v * sb)));
    }
    const A = ML.toMatrix(a), B = ML.toMatrix(b);
    if (A.cols !== B.rows) {
      throw new MLError("矩阵乘法维度不匹配：左边 " + A.rows + "×" + A.cols + "，右边 " + B.rows + "×" + B.cols + "。元素级相乘请用 .*");
    }
    const out = [];
    for (let i = 0; i < A.rows; i++) {
      const row = [];
      for (let j = 0; j < B.cols; j++) {
        let s = 0;
        for (let k = 0; k < A.cols; k++) s += A.data[i][k] * B.data[k][j];
        row.push(s);
      }
      out.push(row);
    }
    return MMatrix.from(out);
  }

  function mpow(a, b) {
    const A = ML.toMatrix(a), B = ML.toMatrix(b);
    if (B.isScalar() && Number.isInteger(B.data[0][0]) && B.data[0][0] >= 0 && A.rows === A.cols && A.rows > 1) {
      let r = MMatrix.eye(A.rows);
      for (let i = 0; i < B.data[0][0]; i++) r = matmulValue(r, A);
      return r;
    }
    if (A.isScalar() && B.isScalar()) return Math.pow(A.data[0][0], B.data[0][0]);
    if (A.isScalar()) return MMatrix.from(B.data.map((r) => r.map((v) => Math.pow(A.data[0][0], v))));
    if (B.isScalar()) return MMatrix.from(A.data.map((r) => r.map((v) => Math.pow(v, B.data[0][0]))));
    throw new MLError("^ 的用法不正确：矩阵乘方要求 A 是方阵且指数是整数；元素级乘方请用 .^");
  }

  function mrdivide(a, b) {
    const sa = scalarify(a), sb = scalarify(b);
    if (typeof sb === "number") return arith(a, sb, (x, y) => x / y);
    // A / B = A * inv(B)
    const A = ML.toMatrix(a), B = ML.toMatrix(b);
    if (A.cols !== B.cols) throw new MLError("/ 要求两个矩阵的列数相同（A 的列数 = B 的列数）");
    return matmulValue(A, invSmall(B));
  }
  function mldivide(a, b) {
    const sa = scalarify(a), sb = scalarify(b);
    if (typeof sa === "number") return arith(b, sa, (x, y) => x / y);
    const A = ML.toMatrix(a), B = ML.toMatrix(b);
    if (A.rows !== A.cols) throw new MLError("\\ 目前只支持方阵（A 是方阵时 A\\b 相当于解方程 A*x = b）");
    if (A.rows !== B.rows) throw new MLError("\\ 要求 A 的行数等于 b 的行数");
    const cols = [];
    for (let j = 0; j < B.cols; j++) {
      const col = [];
      for (let i = 0; i < B.rows; i++) col.push(B.data[i][j]);
      cols.push(solveSmall(A, col));
    }
    const out = [];
    for (let i = 0; i < cols[0].length; i++) {
      const row = [];
      for (let j = 0; j < cols.length; j++) row.push(cols[j][i]);
      out.push(row);
    }
    return MMatrix.from(out);
  }
  function solveSmall(A, b) {
    const n = A.rows;
    const M = A.data.map((r) => r.slice());
    const x = b.slice();
    for (let k = 0; k < n; k++) {
      let p = k;
      for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
      if (Math.abs(M[p][k]) < 1e-12) throw new MLError("方程组无唯一解（系数矩阵奇异）");
      if (p !== k) { const t = M[p]; M[p] = M[k]; M[k] = t; const tb = x[p]; x[p] = x[k]; x[k] = tb; }
      for (let i = k + 1; i < n; i++) {
        const f = M[i][k] / M[k][k];
        for (let j = k; j < n; j++) M[i][j] -= f * M[k][j];
        x[i] -= f * x[k];
      }
    }
    const out = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      let s = x[i];
      for (let j = i + 1; j < n; j++) s -= M[i][j] * out[j];
      out[i] = s / M[i][i];
    }
    return out;
  }
  function invSmall(B) {
    const n = B.rows;
    if (n !== B.cols) throw new MLError("这里需要方阵");
    const cols = [];
    for (let j = 0; j < n; j++) {
      const e = new Array(n).fill(0);
      e[j] = 1;
      cols.push(solveSmall(B, e));
    }
    const out = [];
    for (let i = 0; i < n; i++) {
      const row = [];
      for (let j = 0; j < n; j++) row.push(cols[j][i]);
      out.push(row);
    }
    return MMatrix.from(out);
  }

  function logicOp(a, b, f) {
    const A = ML.toMatrix(a), B = ML.toMatrix(b);
    const r = arith(
      MMatrix.from(A.data.map((r2) => r2.map((v) => (v ? 1 : 0)))),
      MMatrix.from(B.data.map((r2) => r2.map((v) => (v ? 1 : 0)))),
      (x, y) => (f(!!x, !!y) ? 1 : 0)
    );
    if (isM(r)) { r.logical = true; return r; }
    const m = MMatrix.scalar(r);
    m.logical = true;
    return m;
  }

  function compare(a, b, f) {
    if (typeof a === "string" || typeof b === "string") {
      const r = f(String(a), String(b));
      const m = MMatrix.scalar(r ? 1 : 0);
      m.logical = true;
      return m;
    }
    const A = ML.toMatrix(a), B = ML.toMatrix(b);
    let out;
    if (A.rows === B.rows && A.cols === B.cols) out = arith(A, B, (x, y) => (f(x, y) ? 1 : 0));
    else if (B.isScalar()) out = arith(A, B, (x, y) => (f(x, y) ? 1 : 0));
    else if (A.isScalar()) out = arith(A, B, (x, y) => (f(x, y) ? 1 : 0));
    else throw new MLError("比较运算要求两个矩阵大小相同，或其中一个是标量");
    if (isM(out)) { out.logical = true; return out; }
    const m = MMatrix.scalar(out);
    m.logical = true;
    return m;
  }

  /* ------------------- 表达式求值 ------------------- */
  function evalExpr(ctx, node) {
    ctx.tick();
    switch (node.t) {
      case "num": return node.value;
      case "str": return node.value;
      case "end": {
        if (ctx.endValue === null) throw new MLError("end 只能用在括号下标里，例如 A(end)");
        return ctx.endValue;
      }
      case "colon": throw new MLError("冒号 : 只能用在矩阵下标里，例如 A(:,2) 或 A(1:3)");
      case "var": {
        const v = ctx.lookup(node.name);
        if (v === undefined) {
          if (ML.isBuiltinName(node.name)) return { __func: node.name, name: node.name };
          throw new MLError("第 " + node.line + " 行：变量或函数 “" + node.name + "” 还没有定义（检查拼写，或先给它赋值）");
        }
        return v;
      }
      case "matrix": return buildMatrix(ctx, node);
      case "cell": {
        const rows = node.rows.length;
        const cols = Math.max.apply(null, node.rows.map((r) => r.length));
        const flat = new Array(rows * cols);
        node.rows.forEach((row, i) => {
          row.forEach((el, j) => { flat[j * rows + i] = evalExpr(ctx, el); });
        });
        return new MCell(flat, rows, cols);
      }
      case "range": {
        const start = ML.toScalar(evalExpr(ctx, node.start));
        const end = ML.toScalar(evalExpr(ctx, node.end));
        const step = node.step ? ML.toScalar(evalExpr(ctx, node.step)) : 1;
        if (step === 0) throw new MLError("冒号表达式的步长不能为 0");
        const out = [];
        if (step > 0) for (let x = start; x <= end + 1e-12; x += step) out.push(round6(x));
        else for (let x = start; x >= end - 1e-12; x += step) out.push(round6(x));
        return MMatrix.from([out]);
      }
      case "binary": return evalBinary(ctx, node);
      case "unary": {
        const v = evalExpr(ctx, node.operand);
        if (node.op === "~") {
          const m = ML.toMatrix(v);
          const r = MMatrix.from(m.data.map((row) => row.map((x) => (x ? 0 : 1))));
          r.logical = true;
          return m.isScalar() ? r.data[0][0] : r;
        }
        if (typeof v === "number") return node.op === "-" ? -v : v;
        if (typeof v === "boolean") return v ? 1 : 0;
        const m = ML.toMatrix(v);
        return MMatrix.from(m.data.map((row) => row.map((x) => (node.op === "-" ? -x : x))));
      }
      case "transpose": {
        const v = evalExpr(ctx, node.operand);
        if (typeof v === "string") return transposeStr(v);
        const m = ML.toMatrix(v);
        let out = ML.transposeOf(m);
        if (node.conj) out = MMatrix.from(out.data.map((r) => r.map((x) => x)));
        return out;
      }
      case "field": {
        const base = evalExpr(ctx, node.base);
        if (!(base instanceof MStruct)) throw new MLError("只有结构体才能用点号访问字段，如 s.x");
        return base.fields[node.name];
      }
      case "fhandle": return { __func: node.name, name: node.name };
      case "callIndex": return evalCallIndex(ctx, node);
    }
    throw new MLError("无法计算的表达式类型 " + node.t);
  }

  function round6(x) { return Math.round(x * 1e6) / 1e6; }

  function transposeStr(s) {
    const rows = s.split("\n");
    const width = Math.max.apply(null, rows.map((r) => r.length));
    const out = [];
    for (let j = 0; j < width; j++) {
      let line = "";
      for (let i = 0; i < rows.length; i++) line += rows[i][j] === undefined ? " " : rows[i][j];
      out.push(line);
    }
    return out.join("\n");
  }

  function buildMatrix(ctx, node) {
    const rows = node.rows;
    const values = rows.map((row) => row.map((el) => evalExpr(ctx, el)));
    const flat = [];
    values.forEach((r) => r.forEach((v) => flat.push(v)));
    if (!flat.length) return new MMatrix([], 0, 0);
    if (flat.some((v) => typeof v === "string")) {
      return values
        .map((row) => row.map((v) => (typeof v === "string" ? v : String.fromCharCode(Math.round(ML.toScalar(v))))).join(""))
        .join("\n");
    }
    if (flat.some((v) => isM(v) && !v.isScalar())) {
      const blocks = values.map((row) => {
        const mats = row.map((v) => ML.toMatrix(v));
        const rowsCount = mats[0].rows;
        mats.forEach((m) => {
          if (m.rows !== rowsCount) throw new MLError("方括号拼接时，横向各部分的“行数”必须相同（检查是否漏写分号）");
        });
        const out = [];
        for (let i = 0; i < rowsCount; i++) {
          let line = [];
          mats.forEach((m) => { line = line.concat(m.data[i]); });
          out.push(line);
        }
        return out;
      });
      const all = [];
      blocks.forEach((b) => b.forEach((r) => all.push(r)));
      const width = all[0].length;
      all.forEach((r) => {
        if (r.length !== width) throw new MLError("方括号拼接时，纵向各部分的“列数”必须相同（检查分号两边的矩阵大小）");
      });
      return MMatrix.from(all);
    }
    const cells = values.map((row) => row.map((v) => ML.toScalar(v)));
    const cols = Math.max.apply(null, cells.map((r) => r.length));
    cells.forEach((r, i) => {
      if (r.length !== cols) throw new MLError("第 " + (i + 1) + " 行只有 " + r.length + " 个数，与其它行（" + cols + " 个）不相等。请检查是否漏了元素或写错了分号");
    });
    return MMatrix.from(cells);
  }

  function evalCallIndex(ctx, node) {
    if (node.base.t === "var") {
      const name = node.base.name;
      const existing = ctx.lookup(name);
      if (existing === undefined) {
        return callFunction(ctx, name, node.args, node.line);
      }
      if (existing && existing.__func) return callFunction(ctx, name, node.args, node.line);
      return getIndex(ctx, existing, node.args, node.kind);
    }
    const base = evalExpr(ctx, node.base);
    if (base && base.__func) return callFunction(ctx, base.name, node.args, node.line);
    return getIndex(ctx, base, node.args, node.kind);
  }

  function callFunction(ctx, name, argNodes, line) {
    const userFn = ctx.functions[name];
    const args = argNodes.map((a) => evalExpr(ctx, a));
    if (userFn) return callUserFunction(ctx, userFn, args);
    const fn = ML.builtins[name];
    if (!fn) throw new MLError("第 " + (line || 0) + " 行：没有名为 “" + name + "” 的函数（检查拼写；本练习环境只提供常用函数）");
    const result = fn(ctx, args, argNodes);
    return result === null ? null : result;
  }

  function callUserFunction(ctx, fn, args) {
    const savedLocals = ctx.locals;
    const savedGlobals = ctx.globalNames;
    ctx.locals = {};
    ctx.globalNames = {};
    fn.params.forEach((p, i) => { ctx.locals[p] = args[i] === undefined ? undefined : ML.cloneValue(args[i]); });
    if (fn.params.length && args.length !== fn.params.length) {
      throw new MLError("函数 " + fn.name + " 需要 " + fn.params.length + " 个输入参数，实际给了 " + args.length + " 个");
    }
    const savedNargout = ctx.nargout;
    if (fn.outputs.length) ctx.nargout = fn.outputs.length;
    try {
      execBlock(ctx, fn.body);
    } catch (e) {
      if (!(e instanceof Signal) || e.kind !== "return") throw e;
    } finally {
      ctx.nargout = savedNargout;
    }
    const outs = fn.outputs.map((o) => ctx.locals[o] === undefined ? 0 : ctx.locals[o]);
    ctx.locals = savedLocals;
    ctx.globalNames = savedGlobals;
    if (!outs.length) return null;
    if (outs.length === 1) return outs[0];
    return new MultiOut(outs);
  }

  /* ------------------- 语句执行 ------------------- */
  function execBlock(ctx, body) {
    for (const st of body) execStatement(ctx, st);
  }

  function execStatement(ctx, st) {
    ctx.tick();
    ctx.statement = st.t === "command" ? st : null;
    // 只有多重赋值语句才需要多个返回值，其它语句一律按一个返回值处理
    if (st.t !== "multiassign") ctx.nargout = 1;
    switch (st.t) {
      case "assign": {
        const value = evalExpr(ctx, st.expr);
        assignTarget(ctx, st.target, value);
        return;
      }
      case "multiassign": {
        const savedNargout = ctx.nargout;
        ctx.nargout = st.targets.length;
        let value;
        try {
          value = evalExpr(ctx, st.expr);
        } finally {
          ctx.nargout = savedNargout;
        }
        let list;
        if (value instanceof MultiOut) list = value.values;
        else if (isM(value) && value.rows === 1) list = value.data[0].slice();
        else if (isM(value) && value.cols === 1) list = value.data.map((r) => r[0]);
        else list = [value];
        st.targets.forEach((t, i) => assignTarget(ctx, t, list[i] === undefined ? 0 : list[i]));
        return;
      }
      case "expr": {
        const value = evalExpr(ctx, st.expr);
        if (value === null || value === undefined) return;
        if (!st.suppressed) {
          ctx.assign("ans", value);
          ctx.write(ML.formatValue(value, "ans"));
        }
        return;
      }
      case "if": {
        for (const br of st.branches) {
          if (ML.toLogical(evalExpr(ctx, br.cond))) {
            execBlock(ctx, br.body);
            return;
          }
        }
        if (st.elseBody) execBlock(ctx, st.elseBody);
        return;
      }
      case "for": {
        const iter = evalExpr(ctx, st.iter);
        const m = ML.toMatrix(iter);
        const columns = [];
        for (let j = 0; j < m.cols; j++) {
          const col = [];
          for (let i = 0; i < m.rows; i++) col.push(m.data[i][j]);
          columns.push(m.rows === 1 ? col[0] : MMatrix.from(col.map((v) => [v])));
        }
        for (const value of columns) {
          ctx.assign(st.varName, value);
          try {
            execBlock(ctx, st.body);
          } catch (e) {
            if (e instanceof Signal) {
              if (e.kind === "break") break;
              if (e.kind === "continue") continue;
              throw e;
            }
            throw e;
          }
        }
        return;
      }
      case "while": {
        for (;;) {
          ctx.tick();
          if (!ML.toLogical(evalExpr(ctx, st.cond))) break;
          try {
            execBlock(ctx, st.body);
          } catch (e) {
            if (e instanceof Signal) {
              if (e.kind === "break") break;
              if (e.kind === "continue") continue;
              throw e;
            }
            throw e;
          }
        }
        return;
      }
      case "switch": {
        const subject = evalExpr(ctx, st.subject);
        for (const c of st.cases) {
          for (const vNode of c.values) {
            const v = evalExpr(ctx, vNode);
            if (ML.deepEqualValue(subject, v) || String(subject) === String(v)) {
              execBlock(ctx, c.body);
              return;
            }
          }
        }
        if (st.otherwise) execBlock(ctx, st.otherwise);
        return;
      }
      case "break": throw new Signal("break");
      case "continue": throw new Signal("continue");
      case "return": throw new Signal("return");
      case "global":
        st.names.forEach((n) => { ctx.globalNames[n] = true; });
        return;
      case "function": return;
      case "command": {
        const name = st.name;
        if (name === "clear" || name === "help" || name === "doc") {
          const fn = ML.builtins[name];
          if (fn) fn(ctx, st.args.map(rawArgText), st.args);
          return;
        }
        const args = st.args.map((a) => {
          if (a.t === "var") {
            const v = ctx.lookup(a.name);
            return v === undefined ? a.name : v;
          }
          return evalExpr(ctx, a);
        });
        const fn = ML.builtins[name] || ctx.functions[name];
        if (!fn) throw new MLError("没有名为 “" + name + "” 的命令");
        if (typeof fn === "function" && !fn.body) {
          fn(ctx, args, st.args);
        } else {
          callUserFunction(ctx, fn, args);
        }
        return;
      }
    }
    throw new MLError("无法执行的语句 " + st.t);
  }

  function rawArgText(a) {
    if (a.t === "var") return a.name;
    if (a.t === "str") return a.value;
    return String(a.value);
  }

  function assignTarget(ctx, target, value) {
    if (target.t === "var") {
      ctx.assign(target.name, value === null ? 0 : value);
      return;
    }
    if (target.t === "index") {
      throw new MLError("内部错误：索引目标应为 callIndex");
    }
    if (target.t === "callIndex") {
      if (target.base.t !== "var") throw new MLError("只能给变量或它的元素赋值");
      const name = target.base.name;
      const current = ctx.lookup(name);
      if (current === undefined) throw new MLError("第 " + (target.line || 0) + " 行：变量 “" + name + "” 还没有定义，不能直接给它的元素赋值");
      if (target.kind === "{}") {
        if (!(current instanceof MCell)) throw new MLError("只有元胞数组才能用 {} 赋值");
        ctx.assign(name, setIndex(ctx, current, target.args, value));
        return;
      }
      const updated = setIndex(ctx, current, target.args, value);
      ctx.assign(name, updated);
      return;
    }
    if (target.t === "field") {
      let base;
      if (target.base.t === "var") {
        if (ctx.lookup(target.base.name) === undefined) ctx.assign(target.base.name, new MStruct({}));
        base = ctx.lookup(target.base.name);
      } else {
        base = evalExpr(ctx, target.base);
      }
      if (!(base instanceof MStruct)) throw new MLError("只有结构体才能用点号赋值，如 s.x = 1");
      base.fields[target.name] = value;
      if (target.base.t === "var") ctx.assign(target.base.name, base);
      return;
    }
    throw new MLError("赋值号左边不是合法的变量");
  }

  /* ------------------- 对外接口 ------------------- */
  function run(source, opts) {
    opts = opts || {};
    const ctx = new Ctx(opts);
    const result = { text: "", figures: [], workspace: [], error: null, errorLine: null };
    try {
      const ast = ML.parse(source);
      ast.funcs.forEach((f) => { ctx.functions[f.name] = f; });
      ctx.functions = ctx.functions;
      execBlock(ctx, ast.body);
    } catch (e) {
      result.error = e instanceof MLError ? e.message : (e && e.message) || String(e);
      if (e instanceof Signal) result.error = "break / continue / return 只能用在循环或函数里";
    }
    result.text = ctx.out.join("");
    result.figures = ctx.figures.filter((f) => f.series.length);
    result.workspace = Object.keys(ctx.globals)
      .filter((n) => n !== "ans")
      .sort()
      .map((n) => ({
        name: n,
        type: ML.typeName(ctx.globals[n]),
        size: isM(ctx.globals[n]) ? ctx.globals[n].rows + "×" + ctx.globals[n].cols : "1×1",
        brief: ML.briefValue(ctx.globals[n]),
        value: ctx.globals[n],
      }));
    result.locals = ctx.globals;
    return result;
  }

  const HELP = {
    size: "size(A) 返回矩阵的尺寸；[m,n] = size(A) 分别得到行数和列数",
    length: "length(A) 返回向量长度（矩阵取行数、列数中较大的那个）",
    numel: "numel(A) 返回元素总个数",
    zeros: "zeros(m,n) 生成 m×n 全 0 矩阵；zeros(n) 生成 n×n 方阵",
    ones: "ones(m,n) 生成 m×n 全 1 矩阵",
    eye: "eye(n) 生成 n×n 单位矩阵",
    linspace: "linspace(a,b,n) 在 a 到 b 之间等间隔取 n 个数",
    disp: "disp(x) 在命令窗口显示 x 的值",
    fprintf: "fprintf('格式', 变量) 按格式输出，例如 fprintf('x=%d\\n', x)",
    sprintf: "sprintf('格式', 变量) 把结果变成字符串",
    plot: "plot(x,y) 绘制二维曲线；plot(y) 以 1,2,3… 为横坐标",
    sum: "sum(v) 求和；sum(A) 对矩阵每一列求和；sum(A,2) 对每一行求和",
    mean: "mean(v) 求平均值",
    max: "max(v) 求最大值，[m,i] = max(v) 同时得到位置",
    min: "min(v) 求最小值",
    find: "find(v) 找出非零元素的下标（大于 0 的位置）",
    sort: "sort(v) 从小到大排序，[s,i] = sort(v) 同时得到原位置",
    inv: "inv(A) 求逆矩阵",
    det: "det(A) 求行列式",
    eig: "eig(A) 求特征值",
    polyfit: "polyfit(x,y,n) 用 n 次多项式拟合数据，返回系数（从高次到低次）",
    polyval: "polyval(p,x) 按多项式系数 p 计算 x 处的值",
    interp1: "interp1(x,y,xi) 在一维数据上插值",
    trapz: "trapz(x,y) 用梯形法求数值积分",
  };
  ML.helpText = function (name) {
    if (HELP[name]) return "  " + name + " —— " + HELP[name];
    if (ML.builtins[name]) return "  " + name + " 是本环境提供的内置函数。";
    return "  没有找到 “" + name + "” 的说明。";
  };

  ML.run = run;
  ML.Ctx = Ctx;
})(window);
