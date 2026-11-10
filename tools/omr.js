/* ===================== FREE BUBBLE READER (runs on the device, no AI) ===================== */
function toGray(src, maxDim) {
  const w0 = src.naturalWidth || src.videoWidth || src.width, h0 = src.naturalHeight || src.videoHeight || src.height;
  const k = Math.min(1, maxDim / Math.max(w0, h0));
  const W = Math.round(w0 * k), H = Math.round(h0 * k);
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: true }); ctx.drawImage(src, 0, 0, W, H);
  const px = ctx.getImageData(0, 0, W, H).data, g = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) g[i] = (px[i * 4] * 0.3 + px[i * 4 + 1] * 0.59 + px[i * 4 + 2] * 0.11) | 0;
  return { g, W, H, k };
}
/* Coarse corner search on a small image: dark, solid, square blobs at the 4 extremes. */
function coarseCorners(G) {
  const { g, W, H } = G; let sum = 0;
  for (let i = 0; i < W * H; i++) sum += g[i];
  const thr = Math.min(100, (sum / (W * H)) * 0.5);
  const seen = new Uint8Array(W * H), blobs = [], area = W * H;
  for (let i = 0; i < W * H; i++) {
    if (seen[i] || g[i] > thr) continue;
    let minx = W, maxx = 0, miny = H, maxy = 0, n = 0, sx = 0, sy = 0; const st = [i]; seen[i] = 1;
    while (st.length) {
      const j = st.pop(), x = j % W, y = (j / W) | 0; n++; sx += x; sy += y;
      if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y;
      if (x > 0 && !seen[j - 1] && g[j - 1] <= thr) { seen[j - 1] = 1; st.push(j - 1); }
      if (x < W - 1 && !seen[j + 1] && g[j + 1] <= thr) { seen[j + 1] = 1; st.push(j + 1); }
      if (y > 0 && !seen[j - W] && g[j - W] <= thr) { seen[j - W] = 1; st.push(j - W); }
      if (y < H - 1 && !seen[j + W] && g[j + W] <= thr) { seen[j + W] = 1; st.push(j + W); }
    }
    const bw = maxx - minx + 1, bh = maxy - miny + 1;
    if (n > area * 0.00008 && n < area * 0.02 && bw / bh > 0.6 && bw / bh < 1.65 && n / (bw * bh) > 0.62) blobs.push({ x: sx / n, y: sy / n, n });
  }
  if (blobs.length < 4) return null;
  const pick = f => blobs.reduce((a, b) => (f(b) > f(a) ? b : a));
  const tl = pick(b => -(b.x + b.y)), br = pick(b => b.x + b.y), tr = pick(b => b.x - b.y), bl = pick(b => b.y - b.x);
  const pts = [tl, tr, bl, br];
  if (new Set(pts).size < 4) return null;
  const sizes = pts.map(p => p.n), smin = Math.min(...sizes), smax = Math.max(...sizes);
  if (smax > smin * 4) return null;                                  // the 4 squares should be about the same size
  const wTop = Math.hypot(tr.x - tl.x, tr.y - tl.y), wBot = Math.hypot(br.x - bl.x, br.y - bl.y);
  const hL = Math.hypot(bl.x - tl.x, bl.y - tl.y), hR = Math.hypot(br.x - tr.x, br.y - tr.y);
  const ratio = (hL + hR) / (wTop + wBot);                            // (142-6.5)/(98.5-6.5) = 1.473
  if (ratio < 1.2 || ratio > 1.8 || wTop < W * 0.12) return null;
  return { pts: pts.map(p => ({ x: p.x, y: p.y })), thr };
}
/* Precise centers on a bigger image: flood-fill the dark square nearest each coarse guess. */
function refineCorners(G, guess, thr) {
  const { g, W, H } = G;
  return guess.map(p => {
    const cx = Math.round(p.x), cy = Math.round(p.y);
    let start = -1;
    for (let r = 0; r < 25 && start < 0; r++) for (let dy = -r; dy <= r && start < 0; dy++) for (let dx = -r; dx <= r; dx++) {
      const x = cx + dx, y = cy + dy; if (x < 0 || y < 0 || x >= W || y >= H) continue;
      if (g[y * W + x] <= thr) { start = y * W + x; break; }
    }
    if (start < 0) return p;
    const seen = new Set([start]), st = [start]; let n = 0, sx = 0, sy = 0; const lim = W * H * 0.03;
    while (st.length && n < lim) {
      const j = st.pop(), x = j % W, y = (j / W) | 0; n++; sx += x; sy += y;
      for (const q of [x > 0 ? j - 1 : -1, x < W - 1 ? j + 1 : -1, j - W, j + W]) if (q >= 0 && q < W * H && !seen.has(q) && g[q] <= thr) { seen.add(q); st.push(q); }
    }
    return { x: sx / n, y: sy / n };
  });
}
/* Perspective transform from 4 point pairs (src -> dst). */
function homography(src, dst) {
  const A = [], b = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i], [u, v] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
  }
  for (let c = 0; c < 8; c++) {                                       // Gaussian elimination
    let p = c; for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]];
    for (let r = 0; r < 8; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let k = c; k < 8; k++) A[r][k] -= f * A[c][k]; b[r] -= f * b[c]; }
  }
  const h = b.map((v, i) => v / A[i][i]);
  return (x, y) => { const d = h[6] * x + h[7] * y + 1; return [(h[0] * x + h[1] * y + h[2]) / d, (h[3] * x + h[4] * y + h[5]) / d]; };
}
const CORNER_MM = GEO.corners.map(([x, y]) => [x + GEO.cornerSize / 2, y + GEO.cornerSize / 2]);

/* Locate the sheet in an image: returns { G, map: mm -> pixel } or null */
function locateSheet(src) {
  const small = toGray(src, 520), coarse = coarseCorners(small);
  if (!coarse) return null;
  const G = toGray(src, 2200), s = G.k / small.k;
  const pts = refineCorners(G, coarse.pts.map(p => ({ x: p.x * s, y: p.y * s })), coarse.thr + 10);
  return { G, pts, map: homography(CORNER_MM, pts.map(p => [p.x, p.y])) };
}
function lum(G, x, y) { const xi = Math.round(x), yi = Math.round(y); if (xi < 0 || yi < 0 || xi >= G.W || yi >= G.H) return 255; return G.g[yi * G.W + xi]; }
function patchMedian(G, map, xmm, ymm, rmm) {
  const v = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const [x, y] = map(xmm + dx * rmm, ymm + dy * rmm); v.push(lum(G, x, y)); }
  v.sort((a, b) => a - b); return v[4];
}
/* Fraction of dark sample points inside a circle (mm). */
function fillOf(G, map, cx, cy, r, thr) {
  let dark = 0, tot = 0;
  for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) {
    const dx = i / 4 * r, dy = j / 4 * r; if (dx * dx + dy * dy > r * r) continue;
    const [x, y] = map(cx + dx, cy + dy); tot++; if (lum(G, x, y) < thr) dark++;
  }
  return dark / tot;
}

/* Read a whole sheet. n = items on the sheet. */
function readSheet(src, n) {
  const loc = locateSheet(src);
  if (!loc) return { ok: false, reason: "corners" };
  const { G, map } = loc;
  const probes = GEO.paperProbe.map(([x, y]) => patchMedian(G, map, x, y, 0.6)).sort((a, b) => a - b);
  const paper = probes[Math.floor(probes.length / 2)];
  const cornerInk = CORNER_MM.map(([x, y]) => patchMedian(G, map, x, y, 0.8));
  if (cornerInk.some(v => v > paper * 0.6)) return { ok: false, reason: "corners" };
  const { L, centers } = bubbleCenters(n), r = L.b / 2;
  // layout check: printed bubble outlines must be where we expect them
  let ringDark = 0, ringTot = 0;
  centers.forEach(row => row.forEach(([cx, cy]) => { for (let a = 0; a < 16; a++) { const [x, y] = map(cx + Math.cos(a / 8 * Math.PI) * r, cy + Math.sin(a / 8 * Math.PI) * r); ringTot++; if (lum(G, x, y) < paper * 0.72) ringDark++; } }));
  const ringScore = ringDark / ringTot;
  const answers = [], flagged = [], fills = [];
  centers.forEach((row, qi) => {
    const cy = row[0][1], above = cy - (r + (L.rowH / 2 - r) / 2), below = cy + (r + (L.rowH / 2 - r) / 2);
    const white = Math.max(patchMedian(G, map, row[1][0], above, 0.3), patchMedian(G, map, row[2][0], below, 0.3), paper * 0.8);
    const thr = white * 0.6;
    const f = row.map(([cx]) => fillOf(G, map, cx, cy, r * 0.62, thr));
    fills.push(f);
    const order = [0, 1, 2, 3].sort((a, b) => f[b] - f[a]), top = f[order[0]], second = f[order[1]];
    if (top >= 0.42 && second < 0.3) answers.push("ABCD"[order[0]]);
    else if (top < 0.22) answers.push(null);                                     // blank
    else { answers.push(null); flagged.push(qi + 1); }                           // double, light or erased
  });
  // CODE dots
  const D = GEO.dots, codeBoxPaper = Math.max(patchMedian(G, map, GEO.codeBox.x + GEO.codeBox.w / 2, GEO.codeBox.y + 5.2, 0.4), paper * 0.8);
  const bits = Array.from({ length: D.count }, (_, i) => (fillOf(G, map, D.x0 + i * D.step + D.size / 2, D.y + D.size / 2, D.size * 0.3, codeBoxPaper * 0.55) > 0.5 ? 1 : 0));
  const code = bitsToCode(bits);
  return { ok: true, answers, flagged, fills, code, bits, ringScore, layoutOk: ringScore > 0.35, paper, map, G, pts: loc.pts };
}
/* Straightened 1050 x 1485 crop (for thumbnails and the Claude backup). */
function warpCrop(res) {
  const c = document.createElement("canvas"); c.width = 525; c.height = 742;
  const ctx = c.getContext("2d"), img = ctx.createImageData(525, 742), k = 525 / GEO.W;
  for (let v = 0; v < 742; v++) for (let u = 0; u < 525; u++) {
    const [x, y] = res.map(u / k, v / k), L = lum(res.G, x, y), i = (v * 525 + u) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = L; img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0); return c;
}
const canvasBlob = (c, q = 0.85) => new Promise(r => c.toBlob(r, "image/jpeg", q));
const loadImage = blob => new Promise((res, rej) => { const u = URL.createObjectURL(blob), im = new Image(); im.onload = () => { res(im); setTimeout(() => URL.revokeObjectURL(u), 1000); }; im.onerror = rej; im.src = u; });
