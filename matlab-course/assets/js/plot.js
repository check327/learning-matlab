/* 把解释器收集到的图形数据画成 SVG */
(function (global) {
  "use strict";
  const ML = global.ML || (global.ML = {});

  const PALETTE = ["#C2410C", "#0F766E", "#1D4ED8", "#9333EA", "#B45309", "#15803D", "#BE123C"];

  function niceStep(range, target) {
    const raw = range / target;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
    return step * mag;
  }

  function render(fig, width, height) {
    width = width || 560;
    height = height || 380;
    const m = { l: 62, r: 18, t: fig.title ? 34 : 16, b: fig.xlabel ? 46 : 30 };
    const W = width - m.l - m.r;
    const H = height - m.t - m.b;

    const pies = fig.series.filter((s) => s.type === "pie");
    const drawable = fig.series.filter((s) => s.type !== "pie");
    if (!drawable.length && pies.length) {
      const inner = pie(pies[0].y || [], Math.min(width, height));
      const title = fig.title
        ? `<text x="${width / 2}" y="22" text-anchor="middle" font-size="15" font-weight="600" fill="#1b2733">${esc(fig.title)}</text>`
        : "";
      return `<svg viewBox="0 0 ${width} ${height}" width="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="饼图">${title}<g transform="translate(${(width - Math.min(width, height)) / 2}, ${(height - Math.min(width, height)) / 2 + 8})">${inner.replace(/^<svg[^>]*>|<\/svg>$/g, "")}</g></svg>`;
    }
    const all = [];
    drawable.forEach((s) => {
      (s.y || []).forEach((v, i) => all.push({ x: s.x ? s.x[i] : i + 1, y: v }));
    });
    if (!all.length) return "";
    let xmin = Math.min.apply(null, all.map((p) => p.x));
    let xmax = Math.max.apply(null, all.map((p) => p.x));
    let ymin = Math.min.apply(null, all.map((p) => p.y));
    let ymax = Math.max.apply(null, all.map((p) => p.y));
    if (fig.axis) { xmin = fig.axis[0]; xmax = fig.axis[1]; ymin = fig.axis[2]; ymax = fig.axis[3]; }
    if (fig.xlim) { xmin = fig.xlim[0]; xmax = fig.xlim[1]; }
    if (fig.ylim) { ymin = fig.ylim[0]; ymax = fig.ylim[1]; }
    if (xmax === xmin) { xmax += 1; xmin -= 1; }
    if (ymax === ymin) { ymax += 1; ymin -= 1; }
    const yPad = (ymax - ymin) * 0.08;
    ymin -= yPad; ymax += yPad;

    const sx = (x) => m.l + ((x - xmin) / (xmax - xmin)) * W;
    const sy = (y) => m.t + H - ((y - ymin) / (ymax - ymin)) * H;

    const parts = [];
    parts.push(`<rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff"/>`);
    if (fig.title) {
      parts.push(`<text x="${width / 2}" y="22" text-anchor="middle" font-size="15" font-weight="600" fill="#1b2733">${esc(fig.title)}</text>`);
    }
    // 网格与刻度
    const xs = niceStep(xmax - xmin, 6);
    const ys = niceStep(ymax - ymin, 5);
    if (fig.grid) {
      for (let v = Math.ceil(xmin / xs) * xs; v <= xmax; v += xs) {
        parts.push(`<line x1="${sx(v).toFixed(1)}" y1="${m.t}" x2="${sx(v).toFixed(1)}" y2="${m.t + H}" stroke="#e6ebef" stroke-width="1"/>`);
      }
      for (let v = Math.ceil(ymin / ys) * ys; v <= ymax; v += ys) {
        parts.push(`<line x1="${m.l}" y1="${sy(v).toFixed(1)}" x2="${m.l + W}" y2="${sy(v).toFixed(1)}" stroke="#e6ebef" stroke-width="1"/>`);
      }
    }
    // 坐标轴
    parts.push(`<line x1="${m.l}" y1="${m.t + H}" x2="${m.l + W}" y2="${m.t + H}" stroke="#94a3b8" stroke-width="1.2"/>`);
    parts.push(`<line x1="${m.l}" y1="${m.t}" x2="${m.l}" y2="${m.t + H}" stroke="#94a3b8" stroke-width="1.2"/>`);
    for (let v = Math.ceil(xmin / xs) * xs; v <= xmax + 1e-9; v += xs) {
      parts.push(`<text x="${sx(v).toFixed(1)}" y="${m.t + H + 18}" text-anchor="middle" font-size="11" fill="#64748b">${fmtTick(v)}</text>`);
    }
    for (let v = Math.ceil(ymin / ys) * ys; v <= ymax + 1e-9; v += ys) {
      parts.push(`<text x="${m.l - 8}" y="${(sy(v) + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="#64748b">${fmtTick(v)}</text>`);
    }
    if (fig.xlabel) parts.push(`<text x="${m.l + W / 2}" y="${height - 8}" text-anchor="middle" font-size="12" fill="#334155">${esc(fig.xlabel)}</text>`);
    if (fig.ylabel) parts.push(`<text x="14" y="${m.t + H / 2}" text-anchor="middle" font-size="12" fill="#334155" transform="rotate(-90 14 ${m.t + H / 2})">${esc(fig.ylabel)}</text>`);

    // 数据
    drawable.forEach((s, si) => {
      const color = PALETTE[si % PALETTE.length];
      const y = s.y || [];
      const x = s.x || y.map((_, i) => i + 1);
      if (s.type === "bar") {
        const bw = Math.max(2, (W / Math.max(y.length, 1)) * 0.62);
        y.forEach((v, i) => {
          const x0 = sx(x[i]) - bw / 2;
          const y0 = sy(Math.max(v, 0));
          parts.push(`<rect x="${x0.toFixed(1)}" y="${y0.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.abs(sy(v) - sy(0)).toFixed(1)}" fill="${color}" opacity="0.78"/>`);
        });
      } else if (s.type === "stem") {
        y.forEach((v, i) => {
          parts.push(`<line x1="${sx(x[i]).toFixed(1)}" y1="${sy(0).toFixed(1)}" x2="${sx(x[i]).toFixed(1)}" y2="${sy(v).toFixed(1)}" stroke="${color}" stroke-width="1.4"/>`);
          parts.push(`<circle cx="${sx(x[i]).toFixed(1)}" cy="${sy(v).toFixed(1)}" r="3" fill="${color}"/>`);
        });
      } else if (s.type === "scatter") {
        y.forEach((v, i) => {
          parts.push(`<circle cx="${sx(x[i]).toFixed(1)}" cy="${sy(v).toFixed(1)}" r="3.4" fill="${color}"/>`);
        });
      } else if (s.type === "pie") {
        return;
      } else {
        let d = "";
        y.forEach((v, i) => {
          d += (i ? " L" : "M") + sx(x[i]).toFixed(1) + "," + sy(v).toFixed(1);
        });
        const dashed = /--/.test(s.spec);
        const dotted = /:/.test(s.spec) && !/--/.test(s.spec);
        parts.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="2" ${dashed ? 'stroke-dasharray="7 5"' : dotted ? 'stroke-dasharray="2 4"' : ""}/>`);
        if (/\bo/.test(s.spec)) {
          y.forEach((v, i) => parts.push(`<circle cx="${sx(x[i]).toFixed(1)}" cy="${sy(v).toFixed(1)}" r="3" fill="none" stroke="${color}" stroke-width="1.6"/>`));
        }
      }
    });

    // 图例
    if (fig.legend && fig.legend.length) {
      fig.legend.forEach((name, i) => {
        const y0 = m.t + 6 + i * 18;
        parts.push(`<line x1="${m.l + W - 120}" y1="${y0}" x2="${m.l + W - 96}" y2="${y0}" stroke="${PALETTE[i % PALETTE.length]}" stroke-width="2.4"/>`);
        parts.push(`<text x="${m.l + W - 90}" y="${y0 + 4}" font-size="11.5" fill="#334155">${esc(name)}</text>`);
      });
    }
    return `<svg viewBox="0 0 ${width} ${height}" width="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="图形结果">${parts.join("")}</svg>`;
  }

  function pie(data, size) {
    size = size || 320;
    const total = data.reduce((a, b) => a + b, 0);
    if (!total) return "";
    const cx = size / 2, cy = size / 2, r = size / 2 - 24;
    let ang = -Math.PI / 2;
    const parts = [`<svg viewBox="0 0 ${size} ${size}" width="100%" preserveAspectRatio="xMidYMid meet">`];
    data.forEach((v, i) => {
      const a2 = ang + (v / total) * Math.PI * 2;
      const x1 = cx + r * Math.cos(ang), y1 = cy + r * Math.sin(ang);
      const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
      const large = a2 - ang > Math.PI ? 1 : 0;
      parts.push(`<path d="M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${large} 1 ${x2.toFixed(1)},${y2.toFixed(1)} Z" fill="${PALETTE[i % PALETTE.length]}" opacity="0.85"/>`);
      const mid = (ang + a2) / 2;
      parts.push(`<text x="${(cx + r * 0.66 * Math.cos(mid)).toFixed(1)}" y="${(cy + r * 0.66 * Math.sin(mid) + 4).toFixed(1)}" text-anchor="middle" font-size="11" fill="#ffffff">${((v / total) * 100).toFixed(0)}%</text>`);
      ang = a2;
    });
    parts.push("</svg>");
    return parts.join("");
  }

  function fmtTick(v) {
    if (Math.abs(v) < 1e-9) return "0";
    if (Number.isInteger(v)) return String(v);
    return String(Math.round(v * 1000) / 1000);
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  ML.renderFigure = render;
  ML.renderPie = pie;
})(window);
