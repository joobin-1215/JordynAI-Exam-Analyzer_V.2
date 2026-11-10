/* ===================== ANSWER SHEETS: exact millimetre geometry (shared by printing AND the bubble reader) ===================== */
/* Every position below is in mm inside one 105 x 148.5 mm quarter-sheet. The reader uses the SAME numbers. */
const GEO = {
  W: 105, H: 148.5,
  corners: [[4, 4], [96, 4], [4, 139.5], [96, 139.5]], cornerSize: 5,          // black squares; centers 6.5 mm from the edges
  itemsTop: 46.2, itemsLeft: 6, colGap: 1.6,
  codeBox: { x: 79, y: 19.5, w: 20, h: 18.5 },
  dots: { x0: 80.2, y: 33.4, size: 1.6, step: 2.0, count: 9 },                 // CODE dot strip inside the box
  paperProbe: [[20, 138.6], [35, 138.6], [50, 138.6], [65, 138.6], [80, 138.6], [52.5, 41.9], [30, 20.5], [70, 20.5]],
};
/* Dot code, 9 cells: [start=1, isGirl, isKey, n5 n4 n3 n2 n1 n0] -> B-1..B-63, G-1..G-63, KEY */
function codeToBits(code) {
  const c = up(code).replace(/\s/g, "");
  if (c === "KEY") return [1, 0, 1, 0, 0, 0, 0, 0, 0];
  const m = c.match(/^([BG])-?(\d{1,2})$/); if (!m) return null;
  const n = +m[2]; if (n < 1 || n > 63) return null;
  return [1, m[1] === "G" ? 1 : 0, 0, ...[5, 4, 3, 2, 1, 0].map(b => (n >> b) & 1)];
}
function bitsToCode(bits) {
  if (!bits || bits[0] !== 1) return null;
  if (bits[2]) return bits[1] || bits.slice(3).some(Boolean) ? null : "KEY";
  const n = bits.slice(3).reduce((t, b) => t * 2 + b, 0);
  return n >= 1 ? `${bits[1] ? "G" : "B"}-${n}` : null;
}
/* Where each bubble's center is (mm, sheet-local). */
function bubbleCenters(n) {
  const L = sheetLayout(n), noW = Math.max(4.4, L.b * 1.3), out = [];
  for (let q = 1; q <= n; q++) {
    const c = Math.floor((q - 1) / L.rows), r = (q - 1) % L.rows;
    const cx = GEO.itemsLeft + c * (L.colW + GEO.colGap);
    const cy = GEO.itemsTop + 3.4 + r * L.rowH + L.rowH / 2;
    out.push([0, 1, 2, 3].map(k => [cx + noW + L.b / 2 + k * (L.b + L.gap), cy]));
  }
  return { L, noW, centers: out };
}

/* Draw one quarter-sheet at (ox, oy). learner = {code, name} (code "" = blank sheet to fill by hand) */
function drawSheetCell(pen, o, learner, ox, oy) {
  const X = v => ox + v, Y = v => oy + v;
  const { L, noW, centers } = bubbleCenters(o.n);
  const reg = up(o.profile.region) || "REGION", div = up(o.profile.division) || "SCHOOLS DIVISION";
  const school = up(o.profile.school) || "SCHOOL NAME";
  const code = up(learner.code || ""), isKey = code === "KEY", blank = !code;
  for (const [x, y] of GEO.corners) pen.rect(X(x), Y(y), GEO.cornerSize, GEO.cornerSize, { fill: "#000" });
  pen.text("REPUBLIC OF THE PHILIPPINES · DEPARTMENT OF EDUCATION", X(52.5), Y(8), 5, { align: "center" });
  pen.text(`${reg} · ${div}`, X(52.5), Y(10.4), 5, { align: "center" });
  pen.text(school, X(52.5), Y(13.6), school.length > 44 ? 5.8 : 7, { align: "center", bold: true });
  pen.text("ANSWER SHEET", X(52.5), Y(17.4), 8.5, { align: "center", bold: true });
  const field = (label, x, y, x2, printed) => {
    pen.text(label, X(x), Y(y), 6.2);
    const lx = X(x) + pen.width(label, 6.2) + 1;
    pen.line(lx, Y(y + 0.6), X(x2), Y(y + 0.6), 0.15, "#000");
    if (printed) pen.text(printed, lx + 0.8, Y(y - 0.2), 6, { bold: true });
  };
  field("Name:", 6, 23, 76, isKey ? "TEACHER'S ANSWER KEY" : "");
  field("Grade & Section:", 6, 27.6, 76, blank ? "" : (o.gradeSection || ""));
  field("Subject:", 6, 32.2, 52, o.subject || ""); field("Date:", 54, 32.2, 76, "");
  field("Exam:", 6, 36.8, 52, o.exam || ""); field("Score:", 54, 36.8, 70, "");
  pen.text(`/ ${o.n}`, X(70.6), Y(36.8), 6.2);
  const B = GEO.codeBox;
  pen.rect(X(B.x), Y(B.y), B.w, B.h, { stroke: "#000", lw: 0.6, r: 1.5 });
  pen.text("CODE", X(B.x + B.w / 2), Y(B.y + 2.8), 4.8, { align: "center", bold: true });
  if (blank) pen.text("write: B-__ or G-__", X(B.x + B.w / 2), Y(B.y + 17.1), 3.8, { align: "center", color: "#777777" });
  else {
    pen.text(isKey ? "KEY" : code, X(B.x + B.w / 2), Y(B.y + 10.6), isKey ? 13 : (code.length > 4 ? 14 : 16), { align: "center", bold: true });
    const bits = codeToBits(code), D = GEO.dots;
    if (bits) bits.forEach((bit, i) => pen.rect(X(D.x0 + i * D.step), Y(D.y), D.size, D.size, bit ? { fill: "#000" } : { stroke: "#000", lw: 0.15 }));
  }
  pen.text("Shade the circle of your answer FULLY and darkly. Use a pencil or black pen. One answer per number.", X(52.5), Y(41.3), 4.8, { align: "center" });
  pen.text(blank ? "No check or X marks. Write your CODE in the box (ask your teacher)." : "No check or X marks. Do not write your name; your CODE identifies you.", X(52.5), Y(43.4), 4.8, { align: "center" });
  const fs = Math.max(4.6, Math.min(9, L.b * 1.45)), nf = Math.max(5.4, Math.min(10, L.b * 1.7));
  for (let c = 0; c < L.cols; c++) {
    const start = c * L.rows + 1; if (start > o.n) break;
    const cx = GEO.itemsLeft + c * (L.colW + GEO.colGap);
    ["A", "B", "C", "D"].forEach((l, k) => pen.text(l, X(cx + noW + L.b / 2 + k * (L.b + L.gap)), Y(GEO.itemsTop + 2.4), Math.max(5, fs), { align: "center", bold: true }));
    for (let q = start; q <= Math.min(start + L.rows - 1, o.n); q++) {
      const r = q - start, ry = GEO.itemsTop + 3.4 + r * L.rowH;
      if (r % 2 === 0) pen.rect(X(cx), Y(ry), L.colW, L.rowH, { fill: "#eef0f8" });
      const cy = ry + L.rowH / 2;
      pen.text(String(q), X(cx + noW - 0.8), Y(cy + nf * 0.12), nf, { align: "right", bold: true });
      centers[q - 1].forEach(([bx], k) => {
        pen.circle(X(bx), Y(cy), L.b / 2, { stroke: "#000", lw: 0.22, fill: "#fff" });
        pen.text("ABCD"[k], X(bx), Y(cy + fs * 0.12), fs, { align: "center", color: "#b4b4b4" });   // light letters: not mistaken for shading
      });
    }
  }
  pen.text(blank ? "Extra / late-enrollee answer sheet · Do not fold. Keep the four black corners clean." : (isKey ? "TEACHER'S ANSWER KEY · scan this first" : "Do not fold. Keep the four black corners and the CODE dots clean."), X(52.5), Y(144), 4.3, { align: "center", color: "#777777" });
}
function drawPage(pen, o, cells) {
  pen.dash(true); pen.line(105, 0, 105, 297, 0.3, "#888888"); pen.line(0, 148.5, 210, 148.5, 0.3, "#888888"); pen.dash(false);
  [[0, 0], [105, 0], [0, 148.5], [105, 148.5]].forEach(([ox, oy], i) => { if (cells[i]) drawSheetCell(pen, o, cells[i], ox, oy); });
}

const PT = 0.3528; // 1 pt in mm
function pdfPen(doc) {
  const hex = h => { if (h.length === 4) h = "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3]; return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; };
  return {
    dash(on) { if (doc.setLineDashPattern) doc.setLineDashPattern(on ? [1.5, 1] : [], 0); },
    line(x1, y1, x2, y2, lw, color) { doc.setLineWidth(lw); doc.setDrawColor(...hex(color)); doc.line(x1, y1, x2, y2); },
    rect(x, y, w, h, s) {
      if (s.fill) doc.setFillColor(...hex(s.fill)); if (s.stroke) { doc.setDrawColor(...hex(s.stroke)); doc.setLineWidth(s.lw || 0.2); }
      const mode = s.fill && s.stroke ? "FD" : s.fill ? "F" : "S";
      if (s.r) doc.roundedRect(x, y, w, h, s.r, s.r, mode); else doc.rect(x, y, w, h, mode);
    },
    circle(x, y, r, s) { doc.setFillColor(...hex(s.fill || "#ffffff")); doc.setDrawColor(...hex(s.stroke || "#000000")); doc.setLineWidth(s.lw || 0.2); doc.circle(x, y, r, "FD"); },
    text(t, x, y, pt, s = {}) { doc.setFont("helvetica", s.bold ? "bold" : "normal"); doc.setFontSize(pt); doc.setTextColor(...hex(s.color || "#000000")); doc.text(String(t), x, y, { align: s.align || "left" }); },
    width(t, pt) { doc.setFont("helvetica", "normal"); doc.setFontSize(pt); return doc.getTextWidth(String(t)); },
  };
}
function canvasPen(ctx, k) { // k = pixels per mm
  return {
    dash(on) { ctx.setLineDash(on ? [1.5 * k, 1 * k] : []); },
    line(x1, y1, x2, y2, lw, color) { ctx.strokeStyle = color; ctx.lineWidth = lw * k; ctx.beginPath(); ctx.moveTo(x1 * k, y1 * k); ctx.lineTo(x2 * k, y2 * k); ctx.stroke(); },
    rect(x, y, w, h, s) {
      ctx.beginPath();
      if (s.r && ctx.roundRect) ctx.roundRect(x * k, y * k, w * k, h * k, s.r * k); else ctx.rect(x * k, y * k, w * k, h * k);
      if (s.fill) { ctx.fillStyle = s.fill; ctx.fill(); } if (s.stroke) { ctx.strokeStyle = s.stroke; ctx.lineWidth = (s.lw || 0.2) * k; ctx.stroke(); }
    },
    circle(x, y, r, s) { ctx.beginPath(); ctx.arc(x * k, y * k, r * k, 0, Math.PI * 2); ctx.fillStyle = s.fill || "#fff"; ctx.fill(); ctx.strokeStyle = s.stroke || "#000"; ctx.lineWidth = (s.lw || 0.2) * k; ctx.stroke(); },
    text(t, x, y, pt, s = {}) { ctx.font = `${s.bold ? "bold " : ""}${pt * PT * k}px Helvetica, Arial, sans-serif`; ctx.fillStyle = s.color || "#000"; ctx.textAlign = s.align || "left"; ctx.textBaseline = "alphabetic"; ctx.fillText(String(t), x * k, y * k); },
    width(t, pt) { ctx.font = `${pt * PT * k}px Helvetica, Arial, sans-serif`; return ctx.measureText(String(t)).width / k; },
  };
}
const chunk4 = list => { const out = []; for (let i = 0; i < list.length; i += 4) out.push([list[i], list[i + 1], list[i + 2], list[i + 3]]); return out; };
/* learners: list of {code, name}; blank sheets = [{code:""} x 4 per page] */
function sheetsPdf(o, learners) {
  const doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  chunk4(learners).forEach((cells, p) => { if (p) doc.addPage(); drawPage(pdfPen(doc), o, cells); });
  return doc.output("blob");
}
async function sheetsDocx(o, learners) {
  const k = 300 / 25.4, D = window.docx, pages = [];
  for (const cells of chunk4(learners)) {
    const c = document.createElement("canvas"); c.width = Math.round(210 * k); c.height = Math.round(297 * k);
    const ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
    drawPage(canvasPen(ctx, k), o, cells);
    const jpg = await new Promise(res => c.toBlob(res, "image/jpeg", 0.9));
    pages.push(new Uint8Array(await jpg.arrayBuffer()));
  }
  const doc = new D.Document({
    creator: "JordynAI Exam Analyzer", title: "DepEd OMR Answer Sheets",
    sections: pages.map(data => ({
      properties: { page: { size: { width: 11906, height: 16838, orientation: D.PageOrientation.PORTRAIT }, margin: { top: 0, right: 0, bottom: 0, left: 0, header: 0, footer: 0 } } },
      children: [new D.Paragraph({ spacing: { before: 0, after: 0 }, children: [new D.ImageRun({ type: "jpg", data, transformation: { width: 793, height: 1121 } })] })],
    })),
  });
  return D.Packer.toBlob(doc);
}
const blankList = pages => Array.from({ length: pages * 4 }, () => ({ code: "", name: "" }));
