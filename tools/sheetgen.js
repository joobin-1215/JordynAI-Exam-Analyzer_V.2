/* ===================== NAMED ANSWER SHEETS (4 per A4, no Learner ID box) ===================== */
/* Pick the column count that gives the biggest bubbles for this many items. All sizes in mm. */
function sheetLayout(n) {
  const AVAIL_H = 87, WIDTH = 93, GAP = 1.6;
  let best = null;
  for (let cols = 1; cols <= 4; cols++) {
    const rows = Math.ceil(n / cols);
    const rowH = Math.min(13, AVAIL_H / rows);
    const colW = (WIDTH - GAP * (cols - 1)) / cols;
    const b = Math.min(rowH * 0.62, ((colW - 6) / 4) * 0.8, 7);
    if (!best || b > best.b + 0.05 || (Math.abs(b - best.b) <= 0.05 && rowH > best.rowH)) best = { cols, rows, rowH, colW, b };
  }
  best.gap = Math.max(0.8, Math.min(2.2, ((best.colW - 6) / 4) - best.b));
  return best;
}

const SHEET_CSS = `
@page { size: A4 portrait; margin: 0; }
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #e5e7eb; font-family: "Helvetica Neue", Arial, sans-serif; color: #000; }
.page { width: 210mm; height: 297mm; margin: 10mm auto; background: #fff; display: grid;
  grid-template-columns: 105mm 105mm; grid-template-rows: 148.5mm 148.5mm; position: relative; overflow: hidden; }
.page::before, .page::after { content: ""; position: absolute; pointer-events: none; }
.page::before { left: 50%; top: 0; bottom: 0; border-left: 0.3mm dashed #888; }
.page::after { top: 50%; left: 0; right: 0; border-top: 0.3mm dashed #888; }
.sheet { position: relative; width: 105mm; height: 148.5mm; padding: 4mm 6mm; overflow: hidden; }
.sheet.empty { visibility: hidden; }
.mk { position: absolute; width: 5mm; height: 5mm; background: #000; }
.mk.tl { top: 4mm; left: 4mm; } .mk.tr { top: 4mm; right: 4mm; } .mk.bl { bottom: 4mm; left: 4mm; } .mk.br { bottom: 4mm; right: 4mm; }
.hd { text-align: center; line-height: 1.25; margin-top: 1.2mm; }
.hd .small { font-size: 5pt; }
.hd .school { font-size: 7pt; font-weight: 700; margin-top: 0.5mm; }
.hd .school.long { font-size: 5.8pt; }
.hd .title { font-size: 8.5pt; font-weight: 700; letter-spacing: 0.3mm; }
.who { display: flex; gap: 2.5mm; margin-top: 2.2mm; align-items: stretch; }
.info { flex: 1; font-size: 6.2pt; display: flex; flex-direction: column; gap: 1.5mm; min-width: 0; }
.info .row { display: flex; gap: 1mm; align-items: flex-end; white-space: nowrap; }
.info .v { flex: 1; border-bottom: 0.15mm solid #000; font-weight: 700; overflow: hidden; text-overflow: ellipsis; padding-left: 0.6mm; min-height: 2.8mm; }
.info .name .v { font-size: 7.2pt; }
.code { width: 21mm; border: 0.6mm solid #000; border-radius: 1.5mm; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0.8mm 0; }
.code small { font-size: 4.8pt; font-weight: 700; letter-spacing: 0.3mm; }
.code b { font-size: 17pt; line-height: 1; }
.code b.key { font-size: 11pt; }
.code b.blank { display: block; width: 15mm; height: 7mm; }
.dir { text-align: center; font-size: 5pt; margin: 2mm 0 1.2mm; }
.items { display: grid; column-gap: 1.6mm; }
.abcd { display: flex; align-items: center; height: 3.4mm; font-weight: 700; }
.abcd span { text-align: center; }
.item { display: flex; align-items: center; }
.col .item:nth-child(even) { background: #eef0f8; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.no { text-align: right; font-weight: 700; padding-right: 0.8mm; }
.bs { display: flex; }
.b { border: 0.22mm solid #000; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: #666; background: #fff; }
.foot { position: absolute; bottom: 5mm; left: 0; right: 0; text-align: center; font-size: 4.3pt; color: #777; }
.toolbar { text-align: center; margin: 6mm 0 0; font: 11pt Arial, sans-serif; }
@media print {
  html, body { background: #fff; }
  .page { margin: 0; break-after: page; page-break-after: always; }
  .page:last-child { break-after: auto; page-break-after: auto; }
  .toolbar { display: none !important; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}`;

function sheetHtml(o, L) {
  const reg = esc(up(o.profile.region) || "REGION"), div = esc(up(o.profile.division) || "SCHOOLS DIVISION");
  const school = up(o.profile.school) || "SCHOOL NAME";
  const fs = Math.max(4.6, Math.min(9, L.b * 1.45)), nf = Math.max(5.4, Math.min(10, L.b * 1.7));
  const bubble = l => `<span class="b" style="width:${L.b}mm;height:${L.b}mm;font-size:${fs}pt">${l}</span>`;
  const bsStyle = `gap:${L.gap}mm`;
  const noW = Math.max(4.4, L.b * 1.3);
  let cols = "";
  for (let c = 0; c < L.cols; c++) {
    const start = c * L.rows + 1, end = Math.min(start + L.rows - 1, o.n);
    if (start > o.n) break;
    let rows = "";
    for (let q = start; q <= end; q++) rows += `<div class="item" style="height:${L.rowH}mm"><span class="no" style="width:${noW}mm;font-size:${nf}pt">${q}</span><span class="bs" style="${bsStyle}">${["A", "B", "C", "D"].map(bubble).join("")}</span></div>`;
    cols += `<div class="col"><div class="abcd" style="padding-left:${noW}mm;gap:${L.gap}mm;font-size:${Math.max(5, fs)}pt">${["A", "B", "C", "D"].map(x => `<span style="width:${L.b}mm">${x}</span>`).join("")}</div>${rows}</div>`;
  }
  const isKey = o.learner.code === "KEY";
  const codeBox = o.learner.code ? `<b class="${isKey ? "key" : ""}">${isKey ? "ANSWER<br>KEY" : esc(o.learner.code)}</b>` : `<b class="blank"></b>`;
  return `<section class="sheet">
<i class="mk tl"></i><i class="mk tr"></i><i class="mk bl"></i><i class="mk br"></i>
<header class="hd"><div class="small">REPUBLIC OF THE PHILIPPINES · DEPARTMENT OF EDUCATION</div><div class="small">${reg} · ${div}</div>
<div class="school${school.length > 44 ? " long" : ""}">${esc(school)}</div><div class="title">ANSWER SHEET</div></header>
<div class="who"><div class="info">
<div class="row name">Name:<span class="v" style="font-size:${(o.learner.name || "").length > 40 ? 5.2 : (o.learner.name || "").length > 30 ? 6.2 : 7.2}pt">${esc(o.learner.name || "")}</span></div>
<div class="row">Grade &amp; Section:<span class="v">${esc(o.gradeSection || "")}</span></div>
<div class="row">Subject:<span class="v">${esc(o.subject || "")}</span>Date:<span class="v" style="flex:.7"></span></div>
<div class="row">Score:<span class="v" style="flex:.5"></span><span style="font-weight:400">/ ${o.n}</span></div>
</div><div class="code"><small>CODE</small>${codeBox}</div></div>
<p class="dir">Shade the circle of your answer FULLY and darkly. Use a pencil or black pen. One answer per number. No check or X marks.</p>
<div class="items" style="grid-template-columns:repeat(${L.cols},1fr)">${cols}</div>
<div class="foot">${isKey ? "TEACHER'S ANSWER KEY · scan this first" : "Do not fold. Keep the four black corners clean."}</div>
</section>`;
}

/* o: { profile, gradeSection, subject, n, learners:[{code,name}] } -> full printable HTML (4 sheets per A4) */
function buildSheetsHtml(o) {
  const L = sheetLayout(o.n);
  const list = o.learners.length ? o.learners : [{ code: "", name: "" }];
  let pages = "";
  for (let i = 0; i < list.length; i += 4) {
    let cells = "";
    for (let k = 0; k < 4; k++) cells += list[i + k] ? sheetHtml({ ...o, learner: list[i + k] }, L) : `<section class="sheet empty"></section>`;
    pages += `<main class="page">${cells}</main>\n`;
  }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>DepEd OMR Answer Sheets · ${esc(o.gradeSection || "")}</title><style>${SHEET_CSS}</style></head><body>
<div class="toolbar">${list.length} sheet(s) on ${Math.ceil(list.length / 4)} A4 page(s). Print: A4 · Portrait · Scale 100% (Actual size) · Margins None · Background graphics ON. Cut on the dashed lines.</div>
${pages}</body></html>`;
}
