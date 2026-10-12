/* 内置函数库（MATLAB 常用子集） */
(function (global) {
  "use strict";
  const ML = global.ML || (global.ML = {});
  const MMatrix = ML.MMatrix;
  const MCell = ML.MCell;
  const MStruct = ML.MStruct;
  const MLError = ML.MLError;

  class MultiOut {
    constructor(values) {
      this.values = values;
    }
  }

  const isM = (v) => v instanceof MMatrix;
  const num = (v) => ML.toScalar(v);
  const mat = (v) => ML.toMatrix(v);
  const rnd = (ctx) => ctx.random();

  function ew(v, f) {
    if (isM(v)) return MMatrix.from(v.data.map((r) => r.map(f)));
    if (typeof v === "boolean") return f(v ? 1 : 0);
    return f(v);
  }

  function ew2(a, b, f) {
    const A = isM(a) ? a : MMatrix.scalar(a);
    const B = isM(b) ? b : MMatrix.scalar(b);
    if (A.rows === B.rows && A.cols === B.cols) {
      return MMatrix.from(A.data.map((row, i) => row.map((v, j) => f(v, B.data[i][j]))));
    }
    if (B.rows === 1 && B.cols === 1) return MMatrix.from(A.data.map((r) => r.map((v) => f(v, B.data[0][0]))));
    if (A.rows === 1 && A.cols === 1) return MMatrix.from(B.data.map((r) => r.map((v) => f(A.data[0][0], v))));
    throw new MLError("两个矩阵大小不一致： " + A.rows + "×" + A.cols + " 与 " + B.rows + "×" + B.cols);
  }

  function matmul(a, b) {
    const A = mat(a), B = mat(b);
    if (A.cols !== B.rows) {
      throw new MLError("矩阵乘法维度不匹配： " + A.rows + "×" + A.cols + " * " + B.rows + "×" + B.cols + "（提示：元素级相乘要用 .*）");
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

  /* ---------- 线性代数工具 ---------- */
  function luSolve(A, b) {
    const n = A.rows;
    const M = A.data.map((r) => r.slice());
    const x = b.slice();
    for (let k = 0; k < n; k++) {
      let p = k;
      for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
      if (Math.abs(M[p][k]) < 1e-12) throw new MLError("矩阵是奇异的（行列式为 0），不能用 inv 求逆，请检查 det 或改用 \\ 运算");
      if (p !== k) {
        const t = M[p]; M[p] = M[k]; M[k] = t;
        const tb = x[p]; x[p] = x[k]; x[k] = tb;
      }
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

  function detOf(A) {
    const n = A.rows;
    if (n !== A.cols) throw new MLError("det 需要方阵");
    const M = A.data.map((r) => r.slice());
    let d = 1;
    for (let k = 0; k < n; k++) {
      let p = k;
      for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
      if (Math.abs(M[p][k]) < 1e-14) return 0;
      if (p !== k) {
        const t = M[p]; M[p] = M[k]; M[k] = t;
        d = -d;
      }
      d *= M[k][k];
      for (let i = k + 1; i < n; i++) {
        const f = M[i][k] / M[k][k];
        for (let j = k; j < n; j++) M[i][j] -= f * M[k][j];
      }
    }
    return d;
  }

  function invOf(A) {
    const n = A.rows;
    if (n !== A.cols) throw new MLError("inv 需要方阵");
    const cols = [];
    for (let j = 0; j < n; j++) {
      const e = new Array(n).fill(0);
      e[j] = 1;
      cols.push(luSolve(A, e));
    }
    const out = [];
    for (let i = 0; i < n; i++) {
      const row = [];
      for (let j = 0; j < n; j++) row.push(cols[j][i]);
      out.push(row);
    }
    return MMatrix.from(out);
  }

  function qrEig(A) {
    const n = A.rows;
    if (n === 1) return [A.data[0][0]];
    let sym = true;
    for (let i = 0; i < n && sym; i++)
      for (let j = i + 1; j < n; j++)
        if (Math.abs(A.data[i][j] - A.data[j][i]) > 1e-9 * (1 + Math.abs(A.data[i][j]))) { sym = false; break; }
    if (sym) return jacobiEig(A.data.map((r) => r.slice()));
    if (n === 2) {
      const a = A.data[0][0], b = A.data[0][1], c = A.data[1][0], d = A.data[1][1];
      const tr = a + d, de = a * d - b * c;
      const disc = tr * tr - 4 * de;
      if (disc < 0) return [tr / 2, tr / 2];
      const s = Math.sqrt(disc);
      return [(tr + s) / 2, (tr - s) / 2];
    }
    return shiftedQR(A.data.map((r) => r.slice()));
  }

  function jacobiEig(M) {
    const n = M.length;
    const A = M.map((r) => r.slice());
    for (let sweep = 0; sweep < 120; sweep++) {
      let off = 0;
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += A[i][j] * A[i][j];
      if (off < 1e-24) break;
      for (let p = 0; p < n; p++) {
        for (let q = p + 1; q < n; q++) {
          if (Math.abs(A[p][q]) < 1e-18) continue;
          const theta = (A[q][q] - A[p][p]) / (2 * A[p][q]);
          const t = (theta >= 0 ? 1 : -1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
          const c = 1 / Math.sqrt(t * t + 1), s = t * c;
          for (let k = 0; k < n; k++) {
            const akp = A[k][p], akq = A[k][q];
            A[k][p] = c * akp - s * akq;
            A[k][q] = s * akp + c * akq;
          }
          for (let k = 0; k < n; k++) {
            const apk = A[p][k], aqk = A[q][k];
            A[p][k] = c * apk - s * aqk;
            A[q][k] = s * apk + c * aqk;
          }
        }
      }
    }
    return A.map((r, i) => r[i]);
  }

  function shiftedQR(M) {
    const n = M.length;
    const H = M.map((r) => r.slice());
    for (let iter = 0; iter < 600; iter++) {
      let converged = true;
      for (let i = 1; i < n; i++) {
        if (Math.abs(H[i][i - 1]) < 1e-13 * (Math.abs(H[i - 1][i - 1]) + Math.abs(H[i][i]) + 1e-300)) H[i][i - 1] = 0;
        else converged = false;
      }
      if (converged) break;
      let m = n - 1;
      while (m > 0 && H[m][m - 1] === 0) m--;
      const a = H[m - 1][m - 1], b = H[m - 1][m], c = H[m][m - 1], d = H[m][m];
      const tr = a + d, det = a * d - b * c;
      const disc = tr * tr - 4 * det;
      let mu;
      if (disc >= 0) {
        const sq = Math.sqrt(disc);
        const l1 = (tr + sq) / 2, l2 = (tr - sq) / 2;
        mu = Math.abs(l1 - d) < Math.abs(l2 - d) ? l1 : l2;
      } else mu = tr / 2;
      const block = [];
      for (let i = 0; i <= m; i++) {
        const row = [];
        for (let j = 0; j <= m; j++) row.push(H[i][j] - (i === j ? mu : 0));
        block.push(row);
      }
      const [Q, R] = qrDecompose(block);
      const P = matmul(MMatrix.from(R), MMatrix.from(Q)).data;
      for (let i = 0; i <= m; i++) for (let j = 0; j <= m; j++) H[i][j] = P[i][j] + (i === j ? mu : 0);
    }
    return H.map((r, i) => r[i]);
  }

  function qrDecompose(M) {
    const n = M.length, m = M[0].length;
    const Q = [];
    const R = [];
    for (let i = 0; i < m; i++) R.push(new Array(m).fill(0));
    const cols = [];
    for (let j = 0; j < m; j++) {
      let v = [];
      for (let i = 0; i < n; i++) v.push(M[i][j]);
      for (let k = 0; k < j; k++) {
        let d = 0;
        for (let i = 0; i < n; i++) d += cols[k][i] * v[i];
        R[k][j] = d;
        for (let i = 0; i < n; i++) v[i] -= d * cols[k][i];
      }
      let nrm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
      if (nrm < 1e-14) nrm = 1e-14;
      R[j][j] = nrm;
      cols.push(v.map((x) => x / nrm));
    }
    for (let i = 0; i < n; i++) {
      const row = [];
      for (let j = 0; j < m; j++) row.push(cols[j][i]);
      Q.push(row);
    }
    return [Q, R];
  }

  /* ---------- 格式化 ---------- */
  function strFormat(fmt, args, ctx) {
    let i = 0;
    return String(fmt).replace(/%(-?\d*(?:\.\d+)?)([dfegscix%])/g, (m, spec, kind) => {
      if (kind === "%") return "%";
      const v = args[i++];
      if (kind === "s") return typeof v === "string" ? v : ML.briefValue(v);
      if (kind === "c") return String.fromCharCode(typeof v === "string" ? v.charCodeAt(0) : num(v));
      const x = typeof v === "string" ? parseFloat(v) : num(v);
      if (kind === "d" || kind === "i") return String(Math.round(x));
      if (kind === "x") return Math.round(x).toString(16);
      const prec = /\.(\d+)/.exec(spec);
      if (kind === "e" || kind === "g") return x.toExponential(prec ? parseInt(prec[1], 10) : 6);
      return x.toFixed(prec ? parseInt(prec[1], 10) : 6);
    });
  }

  function applyFormatEscapes(s) {
    return String(s).replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/%%/g, "%");
  }

  /* ---------- 内置函数表 ---------- */
  const F = {};

  const math1 = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos,
    atan: Math.atan, sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
    exp: Math.exp, sqrt: Math.sqrt, abs: Math.abs,
    floor: Math.floor, ceil: Math.ceil, fix: Math.trunc, sign: Math.sign,
    log: Math.log, log2: Math.log2, log10: Math.log10,
  };
  Object.keys(math1).forEach((name) => {
    F[name] = (ctx, args) => {
      if (!args.length) throw new MLError(name + " 需要参数");
      const f = math1[name];
      if (name === "sqrt" || name === "log" || name === "log2" || name === "log10") {
        const chk = (x) => {
          if (x < 0) throw new MLError(name + " 的参数出现了负数（本环境不支持复数结果）");
          return f(x);
        };
        return ew(args[0], chk);
      }
      return ew(args[0], f);
    };
  });

  F.atan2 = (ctx, a) => ew2(a[0], a[1], Math.atan2);
  F.power = (ctx, a) => ew2(a[0], a[1], Math.pow);
  F.hypot = (ctx, a) => ew2(a[0], a[1], Math.hypot);
  F.mod = (ctx, a) => ew2(a[0], a[1], (x, y) => x - Math.floor(x / y) * y);
  F.rem = (ctx, a) => ew2(a[0], a[1], (x, y) => x - Math.trunc(x / y) * y);
  F.pow2 = (ctx, a) => ew(a[0], (x) => Math.pow(2, x));
  F.exp = (ctx, a) => ew(a[0], Math.exp);

  F.round = (ctx, a) => {
    if (a.length < 2) return ew(a[0], (x) => Math.round(x));
    const d = Math.pow(10, num(a[1]));
    return ew(a[0], (x) => Math.round(x * d) / d);
  };

  /* 数组/矩阵 */
  F.size = (ctx, a) => {
    const m = mat(a[0]);
    if (a.length > 1) {
      const d = num(a[1]);
      return d === 1 ? m.rows : d === 2 ? m.cols : 1;
    }
    if (ctx.nargout > 1) return new MultiOut([m.rows, m.cols]);
    return MMatrix.from([[m.rows, m.cols]]);
  };
  F.length = (ctx, a) => {
    if (typeof a[0] === "string") return a[0].split("\n")[0].length;
    const m = mat(a[0]);
    return Math.max(m.rows, m.cols);
  };
  F.numel = (ctx, a) => {
    const m = mat(a[0]);
    return m.rows * m.cols;
  };
  F.ndims = (ctx, a) => (isM(a[0]) ? 2 : 2);
  F.isempty = (ctx, a) => {
    const m = mat(a[0]);
    return m.rows === 0 || m.cols === 0 || (m.rows === 1 && m.cols === 1 && m.data[0][0] === 0 && a[0].isEmptyMark === true);
  };
  F.isscalar = (ctx, a) => (isM(a[0]) ? a[0].isScalar() : typeof a[0] === "number" || typeof a[0] === "string");
  F.isvector = (ctx, a) => (isM(a[0]) ? a[0].isVector() : true);
  F.ismatrix = (ctx, a) => isM(a[0]);
  F.isnumeric = (ctx, a) => (typeof a[0] === "number" || (isM(a[0]) && true));
  F.ischar = (ctx, a) => typeof a[0] === "string";
  F.islogical = (ctx, a) => typeof a[0] === "boolean";

  F.zeros = (ctx, a) => {
    const [r, c] = dimsFrom(ctx, a);
    return MMatrix.zeros(r, c);
  };
  F.ones = (ctx, a) => {
    const [r, c] = dimsFrom(ctx, a);
    return MMatrix.ones(r, c);
  };
  F.eye = (ctx, a) => {
    const [r, c] = dimsFrom(ctx, a);
    return MMatrix.eye(r, c);
  };
  F.rand = (ctx, a) => {
    const [r, c] = dimsFrom(ctx, a);
    return MMatrix.from(MMatrix.zeros(r, c).data.map((row) => row.map(() => rnd(ctx))));
  };
  F.randn = (ctx, a) => {
    const [r, c] = dimsFrom(ctx, a);
    return MMatrix.from(
      MMatrix.zeros(r, c).data.map((row) => row.map(() => gauss(ctx)))
    );
  };
  F.randi = (ctx, a) => {
    if (a.length === 1) return Math.floor(rnd(ctx) * num(a[0])) + 1;
    let lo = 1, hi, r, c;
    if (a.length === 2) { hi = num(a[0]); r = num(a[1]); c = r; }
    else if (a.length === 3) { hi = num(a[0]); r = num(a[1]); c = num(a[2]); }
    else { lo = num(a[0]); hi = num(a[1]); r = num(a[2]); c = a.length > 3 ? num(a[3]) : r; }
    return MMatrix.from(MMatrix.zeros(r, c).data.map((row) => row.map(() => lo + Math.floor(rnd(ctx) * (hi - lo + 1)))));
  };
  function dimsFrom(ctx, a) {
    if (!a.length) throw new MLError("需要给出矩阵大小");
    if (a.length === 1) {
      const v = a[0];
      if (isM(v)) {
        if (v.isScalar()) return [v.data[0][0], v.data[0][0]];
        if (v.rows === 1 && v.cols === 2) return [v.data[0][0], v.data[0][1]];
        if (v.rows === 2 && v.cols === 1) return [v.data[0][0], v.data[1][0]];
        return [v.rows, v.cols];
      }
      const n = num(v);
      return [n, n];
    }
    return [num(a[0]), num(a[1])];
  }

  F.linspace = (ctx, a) => {
    const x1 = num(a[0]), x2 = num(a[1]);
    const n = a.length > 2 ? num(a[2]) : 100;
    const d = n <= 1 ? 0 : (x2 - x1) / (n - 1);
    const row = [];
    for (let i = 0; i < n; i++) row.push(x1 + i * d);
    return MMatrix.from([row]);
  };
  F.logspace = (ctx, a) => {
    const x1 = num(a[0]), x2 = num(a[1]);
    const n = a.length > 2 ? num(a[2]) : 50;
    const d = n <= 1 ? 0 : (x2 - x1) / (n - 1);
    const row = [];
    for (let i = 0; i < n; i++) row.push(Math.pow(10, x1 + i * d));
    return MMatrix.from([row]);
  };
  F.magic = (ctx, a) => {
    const n = num(a[0]);
    const d = MMatrix.zeros(n, n).data;
    let i = 0, j = Math.floor(n / 2);
    for (let k = 1; k <= n * n; k++) {
      d[i][j] = k;
      const ni = (i - 1 + n) % n, nj = (j + 1) % n;
      if (d[ni][nj]) { i = (i + 1) % n; } else { i = ni; j = nj; }
    }
    return MMatrix.from(d);
  };

  F.reshape = (ctx, a) => {
    const m = mat(a[0]);
    const flat = [];
    for (let j = 0; j < m.cols; j++) for (let i = 0; i < m.rows; i++) flat.push(m.data[i][j]);
    const [r, c] = dimsFrom(ctx, a.slice(1));
    if (r * c !== flat.length) throw new MLError("reshape 要求元素个数不变：" + m.rows + "×" + m.cols + " 不能变成 " + r + "×" + c);
    const out = MMatrix.zeros(r, c).data;
    let k = 0;
    for (let j = 0; j < c; j++) for (let i = 0; i < r; i++) out[i][j] = flat[k++];
    return MMatrix.from(out);
  };
  F.repmat = (ctx, a) => {
    const m = mat(a[0]);
    const [r, c] = dimsFrom(ctx, a.slice(1));
    const out = [];
    for (let i = 0; i < m.rows * r; i++) {
      const row = [];
      for (let j = 0; j < m.cols * c; j++) row.push(m.data[i % m.rows][j % m.cols]);
      out.push(row);
    }
    return MMatrix.from(out);
  };
  F.transpose = (ctx, a) => transposeOf(mat(a[0]));
  F.cat = (ctx, a) => {
    const dim = num(a[0]);
    const rest = a.slice(1).map(mat);
    return dim === 1 ? vcat(rest) : hcat(rest);
  };
  F.horzcat = (ctx, a) => hcat(a.map(mat));
  F.vertcat = (ctx, a) => vcat(a.map(mat));
  function hcat(list) {
    const rows = list[0].rows;
    const out = [];
    for (let i = 0; i < rows; i++) {
      let row = [];
      for (const m of list) {
        if (m.rows !== rows) throw new MLError("横向拼接要求行数相同");
        row = row.concat(m.data[i]);
      }
      out.push(row);
    }
    return MMatrix.from(out);
  }
  function vcat(list) {
    const cols = list[0].cols;
    const out = [];
    for (const m of list) {
      if (m.cols !== cols) throw new MLError("纵向拼接要求列数相同");
      for (const r of m.data) out.push(r.slice());
    }
    return MMatrix.from(out);
  }
  function transposeOf(m) {
    const out = [];
    for (let j = 0; j < m.cols; j++) {
      const row = [];
      for (let i = 0; i < m.rows; i++) row.push(m.data[i][j]);
      out.push(row);
    }
    return MMatrix.from(out);
  }
  ML.transposeOf = transposeOf;

  F.diag = (ctx, a) => {
    const m = mat(a[0]);
    const k = a.length > 1 ? num(a[1]) : 0;
    if (m.isVector()) {
      const v = m.toVector();
      const n = v.length + Math.abs(k);
      const d = MMatrix.zeros(n, n).data;
      for (let i = 0; i < v.length; i++) {
        const r = k >= 0 ? i : i - k;
        const c = k >= 0 ? i + k : i;
        d[r][c] = v[i];
      }
      return MMatrix.from(d);
    }
    const out = [];
    for (let i = 0; i < m.rows; i++) {
      const j = i + k;
      if (j >= 0 && j < m.cols) out.push(m.data[i][j]);
    }
    return MMatrix.from([out]);
  };
  F.tril = (ctx, a) => {
    const m = mat(a[0]);
    const k = a.length > 1 ? num(a[1]) : 0;
    return MMatrix.from(m.data.map((row, i) => row.map((v, j) => (j - i <= k ? v : 0))));
  };
  F.triu = (ctx, a) => {
    const m = mat(a[0]);
    const k = a.length > 1 ? num(a[1]) : 0;
    return MMatrix.from(m.data.map((row, i) => row.map((v, j) => (j - i >= k ? v : 0))));
  };
  F.flipud = (ctx, a) => MMatrix.from(mat(a[0]).data.slice().reverse());
  F.fliplr = (ctx, a) => MMatrix.from(mat(a[0]).data.map((r) => r.slice().reverse()));
  F.rot90 = (ctx, a) => {
    const m = mat(a[0]);
    const k = ((a.length > 1 ? num(a[1]) : 1) % 4 + 4) % 4;
    let cur = m;
    for (let t = 0; t < k; t++) {
      const out = [];
      for (let j = cur.cols - 1; j >= 0; j--) {
        const row = [];
        for (let i = 0; i < cur.rows; i++) row.push(cur.data[i][j]);
        out.push(row);
      }
      cur = MMatrix.from(out);
    }
    return cur;
  };
  F.circshift = (ctx, a) => {
    const m = mat(a[0]);
    const k = mat(a[1]).toVector().map((x) => Math.round(x));
    const dr = k[0] || 0, dc = k[1] || 0;
    const out = MMatrix.zeros(m.rows, m.cols).data;
    for (let i = 0; i < m.rows; i++)
      for (let j = 0; j < m.cols; j++) {
        const ni = ((i - dr) % m.rows + m.rows) % m.rows;
        const nj = ((j - dc) % m.cols + m.cols) % m.cols;
        out[i][j] = m.data[ni][nj];
      }
    return MMatrix.from(out);
  };

  function reduceAll(m, f, init) {
    let acc = init;
    for (let i = 0; i < m.rows; i++) for (let j = 0; j < m.cols; j++) acc = f(acc, m.data[i][j]);
    return acc;
  }
  F.sum = (ctx, a) => reduceAxis(a, 0);
  F.prod = (ctx, a) => reduceAxis(a, 1);
  function reduceAxis(a, mode) {
    const m = mat(a[0]);
    const dim = a.length > 1 ? num(a[1]) : (m.isVector() ? (m.rows === 1 ? 2 : 1) : 1);
    const op = mode === 0 ? (x, y) => x + y : (x, y) => x * y;
    const init = mode === 0 ? 0 : 1;
    if (m.isScalar()) return m.data[0][0];
    if (m.isVector() && a.length < 2) return reduceAll(m, op, init);
    if (dim === 2) {
      const out = [];
      for (let i = 0; i < m.rows; i++) {
        let s = init;
        for (let j = 0; j < m.cols; j++) s = op(s, m.data[i][j]);
        out.push([s]);
      }
      return MMatrix.from(out);
    }
    const row = [];
    for (let j = 0; j < m.cols; j++) {
      let s = init;
      for (let i = 0; i < m.rows; i++) s = op(s, m.data[i][j]);
      row.push(s);
    }
    return MMatrix.from([row]);
  }
  function statAxis(a, fn) {
    const m = mat(a[0]);
    const dim = a.length > 1 ? num(a[1]) : (m.isVector() ? (m.rows === 1 ? 2 : 1) : 1);
    if (m.isScalar()) return m.data[0][0];
    if (m.isVector() && a.length < 2) return fn(m.toVector());
    if (dim === 2) {
      const out = [];
      for (let i = 0; i < m.rows; i++) out.push([fn(m.data[i].slice())]);
      return MMatrix.from(out);
    }
    const row = [];
    for (let j = 0; j < m.cols; j++) {
      const col = [];
      for (let i = 0; i < m.rows; i++) col.push(m.data[i][j]);
      row.push(fn(col));
    }
    return MMatrix.from([row]);
  }
  const meanOf = (v) => v.reduce((a, b) => a + b, 0) / (v.length || 1);
  F.mean = (ctx, a) => statAxis(a, meanOf);
  F.median = (ctx, a) =>
    statAxis(a, (v) => {
      const s = v.slice().sort((x, y) => x - y);
      const n = s.length;
      return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
    });
  F.std = (ctx, a) => statAxis(a, (v) => Math.sqrt(v.reduce((s, x) => s + Math.pow(x - meanOf(v), 2), 0) / (v.length - 1)));
  F.var = (ctx, a) => statAxis(a, (v) => v.reduce((s, x) => s + Math.pow(x - meanOf(v), 2), 0) / (v.length - 1));

  F.max = (ctx, a) => extremum(a, Math.max, false, ctx);
  F.min = (ctx, a) => extremum(a, Math.min, true, ctx);
  function extremum(a, fn, isMin, ctx) {
    if (a.length > 1 && isM(a[1])) {
      return ew2(a[0], a[1], fn);
    }
    const m = mat(a[0]);
    if (m.isVector() && a.length < 2) {
      const v = m.toVector();
      let best = v[0], idx = 1;
      for (let i = 1; i < v.length; i++) {
        if (isMin ? v[i] < best : v[i] > best) { best = v[i]; idx = i + 1; }
      }
      if (ctx && ctx.nargout > 1) return new MultiOut([best, idx]);
      return best;
    }
    if (m.isScalar()) return m.data[0][0];
    const vals = [], idxs = [];
    for (let j = 0; j < m.cols; j++) {
      const col = [];
      for (let i = 0; i < m.rows; i++) col.push(m.data[i][j]);
      let best = col[0], bi = 1;
      for (let i = 1; i < col.length; i++) {
        if (isMin ? col[i] < best : col[i] > best) { best = col[i]; bi = i + 1; }
      }
      vals.push(best); idxs.push(bi);
    }
    if (ctx && ctx.nargout > 1) return new MultiOut([MMatrix.from([vals]), MMatrix.from([idxs])]);
    return MMatrix.from([vals]);
  }

  F.sort = (ctx, a) => {
    const m = mat(a[0]);
    const dir = a.length > 1 ? String(a[1]) : "ascend";
    const sign = dir === "descend" ? -1 : 1;
    if (m.isVector()) {
      const indexed = m.toVector().map((v, i) => [v, i + 1]);
      indexed.sort((p, q) => (p[0] - q[0]) * sign);
      const vals = indexed.map((p) => p[0]);
      const idx = indexed.map((p) => p[1]);
      const shape = m.rows === 1 ? MMatrix.from([vals]) : MMatrix.from(vals.map((v) => [v]));
      if (ctx.nargout > 1) return new MultiOut([shape, m.rows === 1 ? MMatrix.from([idx]) : MMatrix.from(idx.map((v) => [v]))]);
      return shape;
    }
    const vals = MMatrix.zeros(m.rows, m.cols).data;
    const idxs = MMatrix.zeros(m.rows, m.cols).data;
    for (let j = 0; j < m.cols; j++) {
      const col = [];
      for (let i = 0; i < m.rows; i++) col.push([m.data[i][j], i + 1]);
      col.sort((p, q) => (p[0] - q[0]) * sign);
      for (let i = 0; i < m.rows; i++) { vals[i][j] = col[i][0]; idxs[i][j] = col[i][1]; }
    }
    if (ctx.nargout > 1) return new MultiOut([MMatrix.from(vals), MMatrix.from(idxs)]);
    return MMatrix.from(vals);
  };

  F.find = (ctx, a) => {
    const m = mat(a[0]);
    const rs = [], cs = [], vs = [];
    for (let i = 0; i < m.rows; i++)
      for (let j = 0; j < m.cols; j++)
        if (m.data[i][j] !== 0) { rs.push(i + 1); cs.push(j + 1); vs.push(m.data[i][j]); }
    if (ctx.nargout > 2) return new MultiOut([MMatrix.from(rs.map((v) => [v])), MMatrix.from(cs.map((v) => [v])), MMatrix.from(vs.map((v) => [v]))]);
    if (ctx.nargout > 1) return new MultiOut([MMatrix.from(rs.map((v) => [v])), MMatrix.from(cs.map((v) => [v]))]);
    if (m.rows === 1 || m.cols === 1) {
      const out = [];
      for (let i = 0; i < m.rows; i++) for (let j = 0; j < m.cols; j++) if (m.data[i][j] !== 0) out.push(i * m.cols + j + 1);
      return MMatrix.from([out]);
    }
    return MMatrix.from([rs]);
  };
  F.any = (ctx, a) => boolReduce(a, (v) => v.some((x) => x !== 0));
  F.all = (ctx, a) => boolReduce(a, (v) => v.every((x) => x !== 0));
  function boolReduce(a, f) {
    const m = mat(a[0]);
    if (m.isVector()) return f(m.toVector()) ? 1 : 0;
    const row = [];
    for (let j = 0; j < m.cols; j++) {
      const col = [];
      for (let i = 0; i < m.rows; i++) col.push(m.data[i][j]);
      row.push(f(col) ? 1 : 0);
    }
    return MMatrix.from([row]);
  }

  F.isequal = (ctx, a) => (ML.deepEqualValue(a[0], a[1]) ? 1 : 0);
  F.norm = (ctx, a) => {
    const m = mat(a[0]);
    if (m.isVector()) {
      const p = a.length > 1 ? num(a[1]) : 2;
      const v = m.toVector();
      if (p === 1) return v.reduce((s, x) => s + Math.abs(x), 0);
      if (p === Infinity) return Math.max(...v.map(Math.abs));
      return Math.pow(v.reduce((s, x) => s + Math.pow(Math.abs(x), p), 0), 1 / p);
    }
    return Math.sqrt(reduceAll(m, (s, x) => s + x * x, 0));
  };
  F.det = (ctx, a) => detOf(mat(a[0]));
  F.inv = (ctx, a) => invOf(mat(a[0]));
  F.trace = (ctx, a) => {
    const m = mat(a[0]);
    let s = 0;
    for (let i = 0; i < Math.min(m.rows, m.cols); i++) s += m.data[i][i];
    return s;
  };
  F.rank = (ctx, a) => rankOf(mat(a[0]));
  function rankOf(A) {
    const M = A.data.map((r) => r.slice());
    const rows = M.length, cols = M[0].length;
    let rank = 0;
    for (let c = 0, r = 0; c < cols && r < rows; c++) {
      let p = r;
      for (let i = r + 1; i < rows; i++) if (Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i;
      if (Math.abs(M[p][c]) < 1e-10) continue;
      const t = M[p]; M[p] = M[r]; M[r] = t;
      for (let i = r + 1; i < rows; i++) {
        const f = M[i][c] / M[r][c];
        for (let j = c; j < cols; j++) M[i][j] -= f * M[r][j];
      }
      r++;
      rank++;
    }
    return rank;
  }
  F.eig = (ctx, a) => {
    const A = mat(a[0]);
    if (A.rows !== A.cols) throw new MLError("eig 需要方阵");
    const vals = qrEig(A);
    if (ctx.nargout > 1) {
      return new MultiOut([MMatrix.from([[1]]), MMatrix.from(vals.map((v) => [v]))]);
    }
    return MMatrix.from(vals.map((v) => [v]));
  };
  F.cross = (ctx, a) => {
    const u = mat(a[0]).toVector(), v = mat(a[1]).toVector();
    if (u.length !== 3 || v.length !== 3) throw new MLError("cross 需要三维向量");
    return MMatrix.from([[u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]]);
  };
  F.dot = (ctx, a) => {
    const u = mat(a[0]).toVector(), v = mat(a[1]).toVector();
    if (u.length !== v.length) throw new MLError("dot 要求两个向量长度相同");
    return u.reduce((s, x, i) => s + x * v[i], 0);
  };
  F.cumsum = (ctx, a) => cumOp(a, (x, y) => x + y);
  F.cumprod = (ctx, a) => cumOp(a, (x, y) => x * y);
  function cumOp(a, op) {
    const m = mat(a[0]);
    if (m.isVector() && a.length < 2) {
      const v = m.toVector();
      const out = [];
      let acc = m.rows === 1 ? 0 : 1;
      for (const x of v) { acc = op(acc, x); out.push(acc); }
      return m.rows === 1 ? MMatrix.from([out]) : MMatrix.from(out.map((x) => [x]));
    }
    const dim = a.length > 1 ? num(a[1]) : 1;
    const out = MMatrix.zeros(m.rows, m.cols).data;
    if (dim === 2) {
      for (let i = 0; i < m.rows; i++) {
        let acc = 0;
        for (let j = 0; j < m.cols; j++) { acc = op(acc, m.data[i][j]); out[i][j] = acc; }
      }
    } else {
      for (let j = 0; j < m.cols; j++) {
        let acc = 0;
        for (let i = 0; i < m.rows; i++) { acc = op(acc, m.data[i][j]); out[i][j] = acc; }
      }
    }
    return MMatrix.from(out);
  }
  F.diff = (ctx, a) => {
    const m = mat(a[0]);
    const n = a.length > 1 ? num(a[1]) : 1;
    let cur = m;
    for (let k = 0; k < n; k++) {
      if (cur.isVector() && cur.rows === 1) {
        const v = cur.toVector();
        const out = [];
        for (let i = 1; i < v.length; i++) out.push(v[i] - v[i - 1]);
        cur = MMatrix.from([out]);
      } else {
        const out = [];
        for (let i = 1; i < cur.rows; i++) {
          const row = [];
          for (let j = 0; j < cur.cols; j++) row.push(cur.data[i][j] - cur.data[i - 1][j]);
          out.push(row);
        }
        cur = MMatrix.from(out);
      }
    }
    return cur;
  };

  /* 多项式 */
  F.polyval = (ctx, a) => {
    const p = mat(a[0]).toVector();
    const x = mat(a[1]);
    const evalAt = (t) => p.reduce((s, c) => s * t + c, 0);
    return isM(a[1]) && !x.isScalar() ? MMatrix.from(x.data.map((r) => r.map(evalAt))) : evalAt(num(a[1]));
  };
  F.polyfit = (ctx, a) => {
    const x = mat(a[0]).toVector();
    const y = mat(a[1]).toVector();
    const n = num(a[2]);
    const m = n + 1;
    const A = [];
    for (let i = 0; i < m; i++) {
      const row = [];
      for (let j = 0; j < m; j++) {
        let s = 0;
        for (const xi of x) s += Math.pow(xi, 2 * n - i - j);
        row.push(s);
      }
      let s = 0;
      for (let k = 0; k < x.length; k++) s += y[k] * Math.pow(x[k], n - i);
      A.push(row);
    }
    const b = [];
    for (let i = 0; i < m; i++) {
      let s = 0;
      for (let k = 0; k < x.length; k++) s += y[k] * Math.pow(x[k], n - i);
      b.push(s);
    }
    const sol = luSolve(MMatrix.from(A), b);
    return MMatrix.from([sol]);
  };
  F.conv = (ctx, a) => {
    const u = mat(a[0]).toVector(), v = mat(a[1]).toVector();
    const out = new Array(u.length + v.length - 1).fill(0);
    for (let i = 0; i < u.length; i++) for (let j = 0; j < v.length; j++) out[i + j] += u[i] * v[j];
    return MMatrix.from([out]);
  };
  F.polyder = (ctx, a) => {
    const p = mat(a[0]).toVector();
    const n = p.length - 1;
    return MMatrix.from([p.slice(0, n).map((c, i) => c * (n - i))]);
  };
  F.roots = (ctx, a) => {
    const p = mat(a[0]).toVector();
    let start = 0;
    while (start < p.length - 1 && Math.abs(p[start]) < 1e-14) start++;
    const c = p.slice(start).map((v) => v / p[start]);
    const n = c.length - 1;
    if (n < 1) return MMatrix.from([[]]);
    const comp = MMatrix.zeros(n, n).data;
    for (let i = 0; i < n; i++) comp[0][i] = -c[i + 1];
    for (let i = 1; i < n; i++) comp[i][i - 1] = 1;
    const vals = qrEig(MMatrix.from(comp));
    return MMatrix.from(vals.map((v) => [v]));
  };
  F.interp1 = (ctx, a) => {
    const x = mat(a[0]).toVector();
    const y = mat(a[1]).toVector();
    const xi = mat(a[2]);
    const method = a.length > 3 ? String(a[3]) : "linear";
    const one = (t) => {
      if (method === "nearest") {
        let best = 0, bd = Infinity;
        for (let i = 0; i < x.length; i++) if (Math.abs(x[i] - t) < bd) { bd = Math.abs(x[i] - t); best = i; }
        return y[best];
      }
      if (t <= x[0]) return y[0];
      if (t >= x[x.length - 1]) return y[y.length - 1];
      for (let i = 1; i < x.length; i++) {
        if (t <= x[i]) {
          const r = (t - x[i - 1]) / (x[i] - x[i - 1]);
          return y[i - 1] + r * (y[i] - y[i - 1]);
        }
      }
      return y[y.length - 1];
    };
    return xi.isScalar() ? one(xi.data[0][0]) : MMatrix.from(xi.data.map((r) => r.map(one)));
  };
  F.trapz = (ctx, a) => {
    let x, y;
    if (a.length > 1) { x = mat(a[0]).toVector(); y = mat(a[1]).toVector(); }
    else { y = mat(a[0]).toVector(); x = y.map((_, i) => i + 1); }
    let s = 0;
    for (let i = 1; i < y.length; i++) s += (y[i] + y[i - 1]) / 2 * (x[i] - x[i - 1]);
    return s;
  };
  /* (sum 定义在上方 reduceAxis 处) */

  /* 字符与字符串 */
  F.disp = (ctx, a) => {
    ctx.write(ML.formatValue(a.length ? a[0] : "", null));
    return null;
  };
  F.fprintf = (ctx, a) => {
    if (!a.length) return null;
    const fmt = String(a[0]);
    ctx.write(applyFormatEscapes(strFormat(fmt, a.slice(1), ctx)));
    return null;
  };
  F.sprintf = (ctx, a) => applyFormatEscapes(strFormat(String(a[0]), a.slice(1), ctx));
  F.num2str = (ctx, a) => {
    const v = a[0];
    if (isM(v)) {
      if (v.isScalar()) return ML.fmtNum(v.data[0][0]);
      if (v.isVector() && v.rows === 1) return v.toVector().map(ML.fmtNum).join("   ");
      if (v.isVector()) return v.toVector().map(ML.fmtNum).join("\n");
      return v.data.map((r) => r.map(ML.fmtNum).join("   ")).join(";  ");
    }
    return ML.fmtNum(v);
  };
  F.int2str = (ctx, a) => String(Math.round(num(a[0])));
  F.mat2str = (ctx, a) => {
    const m = mat(a[0]);
    return "[" + m.data.map((r) => r.map(ML.fmtNum).join(" ")).join("; ") + "]";
  };
  F.str2num = (ctx, a) => {
    const s = String(a[0]).trim();
    const nums = s.split(/[\s,]+/).filter((t) => t.length).map(Number);
    if (!nums.length || nums.some((x) => isNaN(x))) throw new MLError("str2num 无法把 “" + s + "” 转成数字");
    return nums.length === 1 ? nums[0] : MMatrix.from([nums]);
  };
  F.str2double = F.str2num;
  F.strcat = (ctx, a) => a.map((v) => (typeof v === "string" ? v : ML.briefValue(v))).join("");
  F.strcmp = (ctx, a) => (String(a[0]) === String(a[1]) ? 1 : 0);
  F.strcmpi = (ctx, a) => (String(a[0]).toLowerCase() === String(a[1]).toLowerCase() ? 1 : 0);
  F.strtrim = (ctx, a) => String(a[0]).trim();
  F.upper = (ctx, a) => String(a[0]).toUpperCase();
  F.lower = (ctx, a) => String(a[0]).toLowerCase();
  F.blanks = (ctx, a) => " ".repeat(num(a[0]));
  F.strrep = (ctx, a) => String(a[0]).split(String(a[1])).join(String(a[2]));
  F.strfind = (ctx, a) => {
    const s = String(a[0]), p = String(a[1]);
    const out = [];
    let i = s.indexOf(p);
    while (i >= 0) { out.push(i + 1); i = s.indexOf(p, i + 1); }
    return MMatrix.from([out]);
  };
  F.numel2 = F.numel;
  F.char = (ctx, a) => {
    if (typeof a[0] === "number") return String.fromCharCode(Math.round(a[0]));
    const m = mat(a[0]);
    return m.data.map((r) => r.map((x) => String.fromCharCode(Math.round(x))).join("")).join("\n");
  };
  F.double = (ctx, a) => {
    if (typeof a[0] === "string") {
      const chars = Array.from(a[0]).map((ch) => ch.charCodeAt(0));
      return MMatrix.from([chars]);
    }
    return a[0];
  };
  F.isletter = (ctx, a) => (/^[A-Za-z]$/.test(String(a[0])) ? 1 : 0);
  F.isspace = (ctx, a) => (/\s/.test(String(a[0])) ? 1 : 0);

  /* 逻辑 */
  F.xor = (ctx, a) => ew2(a[0], a[1], (x, y) => ((x !== 0) !== (y !== 0) ? 1 : 0));
  F.true = (ctx, a) => {
    const [r, c] = dimsFrom(ctx, a);
    return MMatrix.from(MMatrix.ones(r, c).data);
  };
  F.false = (ctx, a) => {
    const [r, c] = dimsFrom(ctx, a);
    return MMatrix.zeros(r, c);
  };

  /* 输出/环境 */
  F.clc = (ctx) => { ctx.clear(); return null; };
  F.clear = (ctx) => {
    if (ctx.statement) {
      const names = ctx.statement.args.filter((x) => x.t === "var").map((x) => x.name);
      if (!names.length || names.indexOf("all") >= 0 || names.indexOf("variables") >= 0) ctx.clearAll();
      else names.forEach((n) => ctx.deleteVar(n));
    }
    return null;
  };
  F.who = (ctx) => { ctx.write("  " + ctx.varNames().join("  ") + "\n"); return null; };
  F.whos = (ctx) => {
    ctx.write("  Name      Size            Bytes  Class\n");
    ctx.varNames().forEach((n) => {
      const v = ctx.getVar(n);
      const size = isM(v) ? v.rows + "x" + v.cols : "1x1";
      ctx.write("  " + n.padEnd(9) + " " + size.padEnd(15) + " 8     " + ML.typeName(v) + "\n");
    });
    return null;
  };
  F.format = (ctx) => null;
  F.help = (ctx, a) => {
    const name = a.length && typeof a[0] === "string" ? a[0] : "";
    ctx.write(ML.helpText(name) + "\n");
    return null;
  };
  F.doc = F.help;
  F.input = () => {
    throw new MLError("本练习环境不支持 input()（没有键盘输入）。请把要用的数据直接用变量写在代码里，例如 x = 10;");
  };
  F.error = (ctx, a) => {
    throw new MLError(a.length ? String(a[0]) : "运行时错误");
  };
  F.warning = (ctx, a) => {
    ctx.write("警告: " + a.map((v) => String(v)).join(" ") + "\n");
    return null;
  };
  F.pause = () => null;
  F.tic = (ctx) => { ctx.tic = Date.now(); return null; };
  F.toc = (ctx) => (ctx.tic ? (Date.now() - ctx.tic) / 1000 : 0);
  F.eval = (ctx, a) => ctx.evalString(String(a[0]));
  F.abs_sum = null;

  /* 绘图（收集数据，交给页面绘制） */
  function seriesFrom(args) {
    const out = [];
    let i = 0;
    while (i < args.length) {
      const v = args[i];
      if (typeof v === "string") { out.spec = v; i++; continue; }
      out.push(mat(v));
      i++;
    }
    return out;
  }
  F.figure = (ctx) => { ctx.newFigure(); return null; };
  F.plot = (ctx, a) => {
    const fig = ctx.currentFigure();
    const spec = a.filter((v) => typeof v === "string");
    const nums = a.filter((v) => typeof v !== "string");
    let xs, ys;
    if (nums.length >= 2) { xs = mat(nums[0]); ys = mat(nums[1]); }
    else { ys = mat(nums[0]); xs = null; }
    fig.series.push({
      x: xs ? (xs.isVector() ? xs.toVector() : null) : null,
      y: ys.isVector() ? ys.toVector() : ys.toVector(),
      spec: spec[0] || "",
      type: "line",
    });
    fig.touched = true;
    return null;
  };
  F.plot3 = (ctx, a) => { F.plot(ctx, a); return null; };
  F.stem = (ctx, a) => {
    const fig = ctx.currentFigure();
    const nums = a.filter((v) => typeof v !== "string");
    const x = nums.length >= 2 ? mat(nums[0]).toVector() : null;
    const y = mat(nums[nums.length - 1]).toVector();
    fig.series.push({ x: x, y: y, spec: "", type: "stem" });
    fig.touched = true;
    return null;
  };
  F.bar = (ctx, a) => {
    const fig = ctx.currentFigure();
    const nums = a.filter((v) => typeof v !== "string");
    const x = nums.length >= 2 ? mat(nums[0]).toVector() : null;
    const y = mat(nums[nums.length - 1]).toVector();
    fig.series.push({ x: x, y: y, spec: "", type: "bar" });
    fig.touched = true;
    return null;
  };
  F.scatter = (ctx, a) => {
    const fig = ctx.currentFigure();
    const nums = a.filter((v) => typeof v !== "string");
    fig.series.push({
      x: nums.length >= 2 ? mat(nums[0]).toVector() : null,
      y: mat(nums[nums.length - 1]).toVector(),
      spec: a.filter((v) => typeof v === "string")[0] || "",
      type: "scatter",
    });
    fig.touched = true;
    return null;
  };
  F.pie = (ctx, a) => {
    const fig = ctx.currentFigure();
    fig.series.push({ x: null, y: mat(a[0]).toVector(), spec: "", type: "pie" });
    fig.touched = true;
    return null;
  };
  F.hist = (ctx, a) => {
    const fig = ctx.currentFigure();
    const y = mat(a[0]).toVector();
    const nb = a.length > 1 && typeof a[1] !== "string" ? num(a[1]) : 10;
    const lo = Math.min.apply(null, y), hi = Math.max.apply(null, y);
    const bins = new Array(nb).fill(0);
    const w = (hi - lo) / nb || 1;
    y.forEach((v) => {
      let k = Math.floor((v - lo) / w);
      if (k >= nb) k = nb - 1;
      if (k < 0) k = 0;
      bins[k]++;
    });
    const centers = bins.map((_, i) => lo + w * (i + 0.5));
    fig.series.push({ x: centers, y: bins, spec: "", type: "bar" });
    fig.touched = true;
    return null;
  };
  F.hold = (ctx, a) => {
    const s = a.length ? String(a[0]) : "";
    ctx.currentFigure().hold = s !== "off";
    return null;
  };
  F.grid = (ctx, a) => {
    const s = a.length ? String(a[0]) : "";
    ctx.currentFigure().grid = s === "on" || s === "";
    return null;
  };
  F.box = (ctx, a) => {
    ctx.currentFigure().box = a.length ? String(a[0]) === "on" : true;
    return null;
  };
  F.subplot = (ctx, a) => {
    ctx.currentFigure().subplot = [num(a[0]), num(a[1]), num(a[2])];
    return null;
  };
  F.title = (ctx, a) => { ctx.currentFigure().title = a.length ? String(a[0]) : ""; return null; };
  F.xlabel = (ctx, a) => { ctx.currentFigure().xlabel = a.length ? String(a[0]) : ""; return null; };
  F.ylabel = (ctx, a) => { ctx.currentFigure().ylabel = a.length ? String(a[0]) : ""; return null; };
  F.zlabel = (ctx) => null;
  F.legend = (ctx, a) => {
    const fig = ctx.currentFigure();
    const parts = String(a[0]).split(",");
    fig.legend = a.length === 1 ? parts.map((s) => s.trim()) : a.map((v) => String(v));
    return null;
  };
  F.axis = (ctx, a) => {
    const fig = ctx.currentFigure();
    if (a.length && isM(a[0])) {
      const v = a[0].toVector();
      if (v.length === 4) fig.axis = v;
      return null;
    }
    const s = a.length ? String(a[0]) : "";
    if (s === "equal") fig.axisEqual = true;
    if (s === "off") fig.axisOff = true;
    if (s === "tight") fig.axisTight = true;
    return null;
  };
  F.xlim = (ctx, a) => { const v = mat(a[0]).toVector(); ctx.currentFigure().xlim = v.length === 2 ? v : [num(a[0]), num(a[1])]; return null; };
  F.ylim = (ctx, a) => { const v = mat(a[0]).toVector(); ctx.currentFigure().ylim = v.length === 2 ? v : [num(a[0]), num(a[1])]; return null; };
  F.text = () => null;
  F.colorbar = (ctx) => null;
  F.colormap = (ctx) => null;
  F.clf = (ctx) => { ctx.currentFigure().series = []; return null; };
  F.close = (ctx) => { ctx.closeFigures(); return null; };
  F.mesh = F.plot;
  F.surf = F.plot;
  function gauss(ctx) {
    let u = 0, v = 0;
    while (u === 0) u = rnd(ctx);
    while (v === 0) v = rnd(ctx);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  ML.builtins = F;
  ML.MultiOut = MultiOut;
  ML.isBuiltinName = function (name) {
    return Object.prototype.hasOwnProperty.call(F, name);
  };
})(window);
