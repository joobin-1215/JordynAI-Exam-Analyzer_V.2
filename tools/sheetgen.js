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

