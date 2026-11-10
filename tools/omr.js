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
  let sum = 0; for (let i = 0; i < G.W * G.H; i++) sum += G.g[i];
  const mean = sum / (G.W * G.H);
  for (const f of [0.5, 0.62, 0.38, 0.75]) {           // try several darkness levels: works in bright AND dim rooms
    const r = coarseCornersAt(G, Math.min(f >= 0.62 ? 125 : 100, mean * f));
    if (r) return r;
  }
  return null;
}
function coarseCornersAt(G, thr) {
  const { g, W, H } = G;
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

/* Average darkness inside a circle: 0 = paper white, 1 = black. Erased smudges stay low; real shading is high. */
function darknessOf(G, map, cx, cy, r, white) {
  let sum = 0, tot = 0;
  for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) { const dx = i / 3 * r, dy = j / 3 * r; if (dx * dx + dy * dy > r * r) continue; const [x, y] = map(cx + dx, cy + dy); sum += lum(G, x, y); tot++; }
  return Math.max(0, 1 - sum / tot / white);
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
    const deep = top >= 0.42 ? darknessOf(G, map, row[order[0]][0], cy, r * 0.55, white) : 0;
    if (top >= 0.42 && second < 0.3 && deep >= 0.4) answers.push("ABCD"[order[0]]);
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
function warpCrop(res, ppm = 5, x0 = 0, y0 = 0, x1 = GEO.W, y1 = GEO.H) {
  const W = Math.round((x1 - x0) * ppm), H = Math.round((y1 - y0) * ppm);
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d"), img = ctx.createImageData(W, H), k = ppm;
  for (let v = 0; v < H; v++) for (let u = 0; u < W; u++) {
    const [x, y] = res.map(x0 + u / k, y0 + v / k), L = lum(res.G, x, y), i = (v * W + u) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = L; img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0); return c;
}
const canvasBlob = (c, q = 0.85) => new Promise(r => c.toBlob(r, "image/jpeg", q));
const loadImage = blob => new Promise((res, rej) => { const u = URL.createObjectURL(blob), im = new Image(); im.onload = () => { res(im); setTimeout(() => URL.revokeObjectURL(u), 1000); }; im.onerror = rej; im.src = u; });

/* ===================== SECURITY: password lock + encrypted device data ===================== */
/* Data on this device is encrypted with a random key (DEK). The DEK is locked ("wrapped") three ways:
   1) the teacher's password, 2) a 12-word recovery code, 3) the admin's public key (only the admin master password opens it).
   Nothing secret is stored in plain text, and the master password is never stored anywhere. */
const VAULT_KEY = "jordynai_vault";
const PBKDF2_ITER = 310000;
const enc = new TextEncoder(), dec = new TextDecoder();
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const rand = n => crypto.getRandomValues(new Uint8Array(n));
const RECOVERY_WORDS = ("acid aloe amber anchor apple arch arrow atlas badge bagel bamboo banana basil beach beacon berry bison blade blaze bloom bolt bonus brave bread brick bridge brook brush cabin cable cactus camel candle canoe canyon carbon cargo carrot castle cedar chalk cherry chess chili cider cinema circle citrus clay cliff cloud clover cobra cocoa comet coral cotton crane crater crisp crown crystal cube daisy delta denim desert diamond dingo dolphin domino donut dragon drum dune eagle echo eclipse elbow ember emerald engine falcon feather fern ferry fiber fig flame flute forest fossil fox frost galaxy garden garlic gecko ginger glacier globe goose grape gravel guava guitar hammer harbor hazel helmet hero hippo honey hornet humble igloo indigo iris island ivory jacket jade jaguar jasmine jelly jewel jungle kayak kettle kiwi koala ladder lagoon lantern laser lava lemon lily lime lizard llama lobster lotus magnet mango maple marble meadow melon meteor mint mirror mocha moon mosaic moss mountain muffin nectar needle nest noodle nova oasis ocean olive onion opal orbit orchid otter owl oyster paddle palm panda papaya parrot pastel peach peanut pearl pebble pepper piano pickle pilot pine pixel planet plum polar pony poppy prism pumpkin puzzle quartz quill rabbit radar rain raven reef rhino ribbon river robin rocket rose ruby saddle saffron salmon sand satin scarf shell shrimp silver sky sloth snow solar spark spice spider sponge spruce squid star stone storm sugar summit sunset swan tango thunder tiger timber tomato topaz torch tulip tundra turtle umbrella valley vanilla velvet violet walnut wave whale willow wind wolf yacht yarn zebra zinc").split(" ");

async function kekFromSecret(secret, salt) {
  const base = await crypto.subtle.importKey("raw", enc.encode(secret), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: PBKDF2_ITER, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
async function aesEnc(key, bytes) { const iv = rand(12); const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, bytes); return { iv: b64(iv), ct: b64(ct) }; }
async function aesDec(key, box) { return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(box.iv) }, key, unb64(box.ct))); }
async function wrapWithSecret(rawDek, secret) { const salt = rand(16); const kek = await kekFromSecret(secret, salt); return { salt: b64(salt), ...(await aesEnc(kek, rawDek)) }; }
async function unwrapWithSecret(w, secret) { const kek = await kekFromSecret(secret, unb64(w.salt)); return aesDec(kek, w); }
/* admin: ECDH P-256 */
async function wrapForAdmin(rawDek, adminKey) {
  const pub = await crypto.subtle.importKey("jwk", adminKey.pub, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const eph = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey"]);
  const k = await crypto.subtle.deriveKey({ name: "ECDH", public: pub }, eph.privateKey, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
  return { eph: await crypto.subtle.exportKey("jwk", eph.publicKey), kid: adminKey.kid, ...(await aesEnc(k, rawDek)) };
}
async function unwrapForAdmin(w, adminKey, master) {
  const pkcs8 = await unwrapWithSecret(adminKey.privEnc, master);             // wrong master password -> throws
  const priv = await crypto.subtle.importKey("pkcs8", pkcs8, { name: "ECDH", namedCurve: "P-256" }, false, ["deriveKey"]);
  const eph = await crypto.subtle.importKey("jwk", w.eph, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const k = await crypto.subtle.deriveKey({ name: "ECDH", public: eph }, priv, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  return aesDec(k, w);
}
async function createAdminKey(master) {
  const kp = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey"]);
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", kp.privateKey));
  return { type: "jordynai-admin-key", version: 1, kid: b64(rand(6)), created: new Date().toISOString(), pub: await crypto.subtle.exportKey("jwk", kp.publicKey), privEnc: await wrapWithSecret(pkcs8, master) };
}
const newRecoveryCode = () => Array.from(rand(12), b => RECOVERY_WORDS[b]).join(" ");
const normCode = s => String(s || "").toLowerCase().trim().split(/\s+/).join(" ");

const Vault = {
  map: null, dek: null, rawDek: null, wraps: null, saveTimer: null, adminKey: null, unlockedBy: "",
  exists() { try { return !!localStorage.getItem(VAULT_KEY); } catch (e) { return false; } },
  isOpen() { return !!this.map; },
  async loadAdminKey() {
    if (this.adminKey !== null) return this.adminKey;
    try { const r = await fetch("admin-key.json", { cache: "no-store" }); const j = r.ok ? await r.json() : null; this.adminKey = j && j.type === "jordynai-admin-key" ? j : false; }
    catch (e) { this.adminKey = false; }
    return this.adminKey;
  },
  async open(rawDek, wraps, by) {
    this.rawDek = rawDek; this.wraps = wraps; this.unlockedBy = by;
    this.dek = await crypto.subtle.importKey("raw", rawDek, "AES-GCM", false, ["encrypt", "decrypt"]);
    const v = JSON.parse(localStorage.getItem(VAULT_KEY));
    this.map = v.data ? JSON.parse(dec.decode(await aesDec(this.dek, v.data))) : {};
    const ak = await this.loadAdminKey();                                       // add the admin lock if it's missing or outdated
    if (ak && (!wraps.admin || wraps.admin.kid !== ak.kid)) { this.wraps.admin = await wrapForAdmin(rawDek, ak); await this.save(); }
  },
  async create(password) {
    const rawDek = rand(32), code = newRecoveryCode();
    const wraps = { pw: await wrapWithSecret(rawDek, password), rc: await wrapWithSecret(rawDek, normCode(code)) };
    const ak = await this.loadAdminKey(); if (ak) wraps.admin = await wrapForAdmin(rawDek, ak);
    // move any existing plain data into the vault
    const map = {}; Object.keys(localStorage).filter(k => k.startsWith("jordynai_") && k !== VAULT_KEY).forEach(k => { try { map[k] = JSON.parse(localStorage.getItem(k)); } catch (e) {} });
    localStorage.setItem(VAULT_KEY, JSON.stringify({ v: 1, wraps, data: null }));
    this.rawDek = rawDek; this.wraps = wraps; this.unlockedBy = "password";
    this.dek = await crypto.subtle.importKey("raw", rawDek, "AES-GCM", false, ["encrypt", "decrypt"]);
    this.map = map; await this.save();
    Object.keys(map).forEach(k => localStorage.removeItem(k));
    return code;
  },
  async unlock(kind, secret) {
    const v = JSON.parse(localStorage.getItem(VAULT_KEY)), w = v.wraps;
    let raw;
    if (kind === "password") raw = await unwrapWithSecret(w.pw, secret);
    else if (kind === "recovery") raw = await unwrapWithSecret(w.rc, normCode(secret));
    else { const ak = await this.loadAdminKey(); if (!ak || !w.admin) throw new Error("no-admin"); raw = await unwrapForAdmin(w.admin, ak, secret); }
    await this.open(raw, w, kind);
  },
  async setPassword(newPw) { this.wraps.pw = await wrapWithSecret(this.rawDek, newPw); await this.save(); },
  async newRecovery() { const code = newRecoveryCode(); this.wraps.rc = await wrapWithSecret(this.rawDek, normCode(code)); await this.save(); return code; },
  async save() {
    const map = this.map, dek = this.dek, wraps = this.wraps;   // captured now: lock() may clear them while this runs
    if (!map || !dek) return;
    const data = await aesEnc(dek, enc.encode(JSON.stringify(map)));
    localStorage.setItem(VAULT_KEY, JSON.stringify({ v: 1, wraps, data }));
  },
  get(k, fb) { const v = this.map ? this.map[k] : undefined; return v == null ? fb : JSON.parse(JSON.stringify(v)); },
  set(k, v) { if (!this.map) return false; if (v == null) delete this.map[k]; else this.map[k] = v; clearTimeout(this.saveTimer); this.saveTimer = setTimeout(() => this.save(), 250); return true; },
  async flush() { clearTimeout(this.saveTimer); await this.save(); },
  lock() { clearTimeout(this.saveTimer); this.save(); this.map = null; this.dek = null; this.rawDek = null; this.wraps = null; this.unlockedBy = ""; },
  erase() { this.lock(); try { Object.keys(localStorage).filter(k => k.startsWith("jordynai_")).forEach(k => localStorage.removeItem(k)); } catch (e) {} },
};


