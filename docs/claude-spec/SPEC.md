# JordynAI Exam Analyzer: Claude Design Spec (source of truth)

Owner: **Joven R. Castro**, Teacher II (MAPEH), Leon Garcia Sr. National High School, Schools Division of Davao City, Region XI.
Spec version: **1.2 · Nov 10, 2026** (free on-device bubble reader) (aligned with DepEd Order No. 15, s. 2026, as reported; verify against the official text). This file overrides older plans and existing code (see `/AGENTS.md`).

Two builds follow this spec:
- **Android app** (this repo: Kotlin, Jetpack Compose, Firebase), built by Google AI Studio.
- **Claude web app** (`reference/web-app-reference.html`), a single-file React page running as a Claude artifact. It is the **working reference**: if this spec doesn't describe some behavior, copy what the reference does.

---

## 1. Purpose
Check multiple-choice term exams and summative tests from shaded OMR answer sheets, and produce DepEd numbers for **SMEA / QA forms**: gradesheet in class-record order, Mean, SD, MPS, proficiency level, pass/fail, Frequency of Errors, and per-component MPS for MAPEH.

## 2. Grading rules (FIXED: do not change)

### 2.1 Scores
| Item | Rule |
|---|---|
| Correct answer | learner's answer equals the key, after trim and uppercase ("a" = "A") |
| Blank / double-shaded / unreadable | wrong |
| Percentage | score ÷ items × 100, 2 decimals |
| Mean | Σ scores ÷ learners |
| SD | population SD: √(Σ(x − Mean)² ÷ N) |
| MPS | Mean ÷ items × 100 |
| Pass / Fail | **Passed if percentage ≥ 70%**: DO 15, s. 2026 adjusted table for SY 2026–2027 (70 = passing 75; from SY 2027–2028, zero-based, 75 = 75). The teacher may change it; the default is 70 |
| Passing rate | passed ÷ learners × 100 |

Boys, Girls and Total each get count, Mean, MPS and SD.

### 2.2 Proficiency levels: exactly 7 bands
| MPS / % | Level |
|---|---|
| 96–100 | Mastered |
| 86–95 | Closely Approximating Mastery |
| 66–85 | Moving Towards Mastery |
| 35–65 | Average Mastery |
| 15–34 | Low Mastery |
| 5–14 | Very Low Mastery |
| 0–4 | Absolutely No Mastery |

These apply to the class MPS, the Boys/Girls MPS, each component's MPS, and each learner's %. **"Average / Low Mastery" is wrong and must not appear.**

### 2.3 Item analysis
- **Frequency of Errors (FOE)** per item = learners whose answer ≠ key, among the learners **who have item responses**.
- Error rate = FOE ÷ learners counted × 100.
- Remark by error rate: **> 50% → "Critical Competency for Review"**, **> 25% → "Least Mastered"**, otherwise **"Mastered"**.
- **Never invent item results.** A learner saved with only a score (no item responses) is counted in score stats but **left out** of the item analysis. If nobody has responses for an item, its remark is "No item data". (The old code `(i + score) % 3 == 0` faked results and must stay removed.)

### 2.4 Learner IDs and order
- Boys `B-1 … B-59`, Girls `G-1 … G-59`. `b1`, `B - 01` and `B-01` all normalize to `B-1` (show without zero padding).
- **Order (DepEd class record):** all Boys first, then all Girls, each sorted **numerically** (B-2 before B-10). IDs that aren't B or G plus a number go last as "Unsorted" with a warning; they are never counted as Girls.
- Learner type **KEY** on a sheet means the teacher's answer key, not a learner.

### 2.5 Privacy: codes only to AI (DO 15, s. 2026: no learner personal data into AI platforms)
- **Learner names never go to Claude/Gemini or to cloud storage tied to AI.** Learner lists are saved **only on the device** (web: browser localStorage; Android: local Room/DataStore, **not** Firestore).
- **Printed answer sheets carry no names**, only the CODE (B-#/G-#), grade & section, subject and exam. Learners are told not to write their names.
- **The scanner prompt forbids reading or reporting names**, and its JSON has no name field.
- Finalized sessions saved to the cloud hold **codes and scores only** (the saved CSV has an empty Initials column). Initials are added on the device from the local learner list when shown or exported.
- A printable **Code List** (codes + names) is generated on the device for the teacher, to hand out sheets.
- Earlier rule (still applies to on-screen reports):
Names are shown and exported as **initials**: the first letters of the first name(s), then of the last name(s). `Dela Cruz, Juan` → `J.D.C.`; `Juan Dela Cruz` → `J.D.C.`; `Amor, Maria Clara` → `M.C.A.`; already-initials text stays. The learner ID always appears beside the initials.

## 3. Exam configuration
- **Term:** Term 1 / Term 2 / Term 3 (default from today's date: Jun 8–Sep 15 → Term 1, Sep 16–Dec → Term 2, Jan–Apr → Term 3).
- **Exam:** **Summative Test 1 (ST1)**, **Summative Test 2 (ST2)** or **Term Exam (TE)** (DO 15: 2 STs + 1 TE per learning area per term). ST → summative (default 25 items), TE → term (default 50).
- **Item-count warning (warn only):** with the grade from Class Setup: Grades 4–6 TE 40 / ST ≤ 20; Grades 7–10 TE 50 / ST ≤ 25; Grades 11–12 TE 60 / ST ≤ 30. Show a yellow note when the setting differs; still allow it.
- **Subjects:** English, Mathematics, Araling Panlipunan, Science, ESP, TLE, Filipino, **Music and Arts**, **PE and Health**, **MAPEH (whole)**. MAPEH (whole) is offered for Term only.
- **Total items:** 1–100. Changing it resizes the answer key and marks it **unsaved** (tabs lock again, §6).

### 3.1 MAPEH components: tag every item (owner decision, Nov 10)
Real exams mix components (for example, Grade 7 Term 2 Music items are 1, 3, 6, 7, 10–12, 14, 16, 19, 20, 24). So **each item has a component tag** instead of a fixed "first N items" split.

| Subject | Components |
|---|---|
| Music and Arts | Music, Arts |
| PE and Health | PE, Health |
| MAPEH (whole) | Music, Arts, PE, Health |
| others | none (no tags) |

- **Default tags** are contiguous blocks, with the extra item going to the 2nd component of each pair: 25 → Music 12 + Arts 13; 50 with 4 components → 12 / 13 / 12 / 13; 50 with 2 → 25 / 25.
- **Editing:** tap an item's tag to cycle through the components, or type item numbers per component (`1, 3, 6-7, 10-12`) and press Set. Show each component's item count. Offer "Reset to blocks".
- Save tags with the exam config (store as a list of component indexes, one per item).
- **Per-component stats:** Mean = average of correct answers on that component's items; MPS = Mean ÷ component items × 100; level from §2.2. Shown in the Summary, the SMEA text, the CSV and History. Item Analysis shows a Component column.
- **Replaces** the old `mapehComp1Items` / `mapehComp2Items` split. Keep reading those fields only to build default tags for configs saved before this change.

## 4. Teacher profile (onboarding)
- Collected on first use, and editable later with "Edit Profile / School" in the header.
- Step 1 **Region** (all 17: Region I–XIII, IV-A, MIMAROPA, NCR, CAR, BARMM); Step 2 **Schools Division** (search the list for that region, or type your own); Step 3 **School Name**.
- All text is forced to UPPERCASE.
- Confirmation popup "Confirming all the details?" showing REGION / DIVISION / SCHOOL, with a green **Confirmed** button (left) and a red **Edit Again** button (right).
- The profile is used in the answer sheet header (§7), the SMEA summary and the CSV.

## 5. Class setup
Grade (Kinder, Grade 1–12) plus Section (uppercase). Saved classes appear as quick-pick chips (tap to select, × to remove). The active label is "Grade 7 – WALING-WALING".

### 5.1 Student list per class (owner decisions, Nov 10)
- Under "+ Save class", every saved class gets a small button **"👥 Add Students from <SECTION>"** (the saved count shows in brackets).
- It opens a **separate page** "Learners of <Grade – Section>" with a back link and instructions: use the class record or masterlist of officially enrolled learners; write names as **LAST NAME, Given Name, Middle Initial**; names must be **alphabetical by last name** because the order gives the code.
- **BOYS on the left (B-1 … B-50), GIRLS on the right (G-1 … G-50).** Each row = a **permanent, non-editable code label** + an editable name. Each column has a paste box, "Fill B-1 to B-50" / "Fill G-1 to G-50", and Clear column. Pasting several lines into a row fills downward.
- **Paste cleanup:** one name per line; drop leading numbers or codes (`4`, `4.`, `b-1`, `B1`); for Excel rows with tabs, drop number, LRN and sex cells and keep the name cell (prefer the one with a comma); skip empty rows; UPPERCASE. **A full middle name becomes its initial:** `ABADIA, KRISTOPHER RYAN, NOBLEFRANCA` → `ABADIA, KRISTOPHER RYAN N.`; `LOR, RAYMUND JR., BABATO-AN` → `LOR, RAYMUND JR. B.` (the same is applied when a typed row loses focus). More than 50 → tell the teacher how many didn't fit.
- **Save button label:** `Save Learners in <Grade> – Section <SECTION>` (for example "Save Learners in Grade 7 – Section DAMA DE NOCHE").
- **Alphabetical check:** on Save, show "Checking alphabetical order…" for **3 seconds**, then check each column. Compare by last name, then by full name, with a Spanish/Filipino collation (Ñ after N, case-insensitive). Any row that breaks A–Z order (both rows of the wrong pair) **and** any empty row between names turns **red**, and saving is blocked. Show **"🔤 Sort A–Z for me"**, which sorts the column, removes gaps and renumbers the codes. Saving succeeds only when both columns pass.
- After a successful save: **"⬇ Download Answer Sheets for <SECTION>"** with the count: boys + girls + 1 ANSWER KEY = total sheets, on ⌈total ÷ 4⌉ A4 pages. Warn that adding or removing a learner later changes the codes after that name, so the sheets must be reprinted.
- Order = code: 1st boy = **B-1**… The saved list gives initials in reports, "Enrolled but no sheet yet", the "not in this section's list" warning, and "of N enrolled" in the SMEA line.
- Full names appear only on this page and on the printed sheets. Reports and exports show initials (§2.5).

## 6. Guided flow and tab locking
1. Profile not set → profile dialog.
2. Teacher sets Exam Type, Subject and Total Items → popup **"Encode your answer keys in the Answer Key (N) tab"** with an "Encode Answer Keys" button that jumps to the key.
3. Teacher taps A/B/C/D per item (and adjusts MAPEH tags) → **Save Answer Key**.
4. Popup: **"Answer key saved! All tabs are unlocked. Press Copy A/S for your personalized DepEd answer sheets"** with Later and Copy A/S buttons.
5. Tabs: Class Setup · Scanner · Gradesheet · Item Analysis · Summary & CSV · History. Every tab except Class Setup is **locked** (lock icon, shake on tap, short message) until the profile is set **and** the key is saved.
6. A scanned **KEY** sheet fills and saves the key automatically (blank key items default to A and are flagged).

## 7. Answer sheets: named, no Learner ID box (owner decision, Nov 10; replaces the old ID-box sheet)
- Generator: `buildSheetsHtml()` / `sheetLayout()` / `SHEET_CSS` in `reference/web-app-reference.html`. Sample output: `reference/sample-named-sheets-25-items.html`. (`DepEd_OMR_Answer_Sheet_4up.html`, `omr-4up-print.css` and `make4.py` are the **old** ID-box design, kept for history only.)
- **A4 portrait, 4 equal quarter-sheets of 105 × 148.5 mm** (2×2), dashed cut lines, 4 black corner squares (5 mm, 4 mm inset).
- **Privacy update (supersedes the Name line below):** the sheet prints **Exam: <ST1/ST2/TE label> · <Term>** instead of the learner's name, and the directions end with "Do not write your name; your CODE identifies you."
- Header: `REPUBLIC OF THE PHILIPPINES · DEPARTMENT OF EDUCATION`, `<REGION> · <SCHOOLS DIVISION>`, `<SCHOOL NAME>` (smaller font if longer than 44 characters), `ANSWER SHEET`.
- **The Learner ID bubble box is removed.** In its place: printed lines **Name** (the learner's name; the font shrinks for names over 30 or 40 characters), **Grade & Section**, **Subject**, Date ___, Score ___ / n, and on the right a **CODE box** (21 mm wide, thick border) with the big printed code **B-1 / G-12**, or "ANSWER KEY" on the teacher's sheet.
- **The items area fills the freed space, balanced to the item count.** Try 1–4 columns and pick the one with the largest bubbles (if two are within 0.05 mm, pick the taller rows). Available height ≈ 87 mm, row height ≤ 13 mm, bubble = min(0.62 × row height, 0.8 × (column width − 6) ÷ 4, 7 mm). Result: 50 items → 4 columns × 13 rows, 3.2 mm bubbles; 25 → 3 × 9, 4.8 mm; 10 → 2 × 5, 7 mm. Font sizes scale with the bubble size. Alternate rows shaded light blue.
- **The download set for a class** = 1 ANSWER KEY sheet first, then the boys B-1…, then the girls G-1…, 4 per page. Empty cells on the last page stay blank.
- **Copy A/S (yellow header button) = blank EXTRA sheets (owner decision, Nov 10)** for late enrollees and replacements for spoiled sheets. Printed: region · division, school, "ANSWER SHEET", Subject and Exam (from current settings), "/ n" score. **Blank to write by hand: Name, Grade & Section, Date, CODE** (the CODE box says "write: B-__ or G-__"). Same items layout as §7, footer "Extra / late-enrollee answer sheet". The teacher picks 1–25 A4 pages (4 sheets each).
- The modal has a preview and **only two buttons: "⬇ Download PDF"** (vector PDF, A4 portrait) and **"⬇ Download Microsoft Word (.docx)"** (A4 portrait, zero margins, each page = the same sheet image at 300 dpi). The old "Download HTML" and "Full-screen view" buttons are removed. Reference: `drawBlankPage`, `blankSheetsPdf`, `blankSheetsDocx`; sample `reference/sample-blank-extra-sheets.pdf`. Android: generate the PDF natively (PdfDocument) and the .docx (Apache POI or a DOCX template).
- The scanner reads a handwritten code in the CODE box. A name written on an extra sheet is never read (privacy rule §2.5).
- Print: A4 · Portrait · Scale 100% · Margins None · Background graphics ON.

## 7.1 Exact sheet geometry + CODE dots (owner decision, Nov 10; supersedes the HTML sheet generator)
- **All sheets (named, key, blank) are drawn by one routine in millimetres**: `drawSheetCell()` / `drawPage()` with the constants in `GEO`, in `reference/web-app-reference.html`. They're exported as **PDF** (vector) and **Word** (one 300 dpi image per page). The **bubble reader uses the same numbers** (`bubbleCenters(n)`), so printing and reading always match. Sample: `reference/sample-named-sheets-25-items.pdf`.
- **CODE dot strip** inside the CODE box: 9 squares of 1.6 mm, 2.0 mm apart, starting at x = 80.2 mm, y = 33.4 mm. Cells: [start = filled, isGirl, isKey, 6 bits of the number] → B-1…B-63, G-1…G-63, KEY (`codeToBits`, `bitsToCode`). Blank extra sheets have no dots: the teacher types the code once.
- Bubble letters are printed light gray (#b4b4b4), so they're never mistaken for shading.
- Named sheet download = KEY sheet first, then the boys, then the girls; buttons "Answer Sheets (PDF)" and "Word (.docx)". No names printed.

## 8. Scanner
- Portrait viewfinder in a 1 : 1.414 frame with corner guides and the label "One quarter-sheet, portrait, 4 corners in view". One sheet per photo.
- **Primary reader = FREE ON-DEVICE OMR (owner decision, Nov 10). No AI, no cost, offline, photos never leave the device.** Steps (`readSheet` in the reference):
  1. Find the 4 black corner squares (coarse on a 520 px copy, refined on a ≤ 2200 px copy by flood fill).
  2. **Homography (perspective)** from the corner centers (6.5 mm in from each edge) → map any mm point on the sheet to a photo pixel.
  3. Paper brightness from blank probe points; per row, local white from above and below the bubbles; dark threshold = 0.6 × local white.
  4. Each bubble: share of dark points inside 0.62 × radius. **Answer if top ≥ 0.42 and second < 0.30; blank if top < 0.22; otherwise flagged** (double, light or erased). Never guess.
  5. CODE dots → code. **Layout check:** printed bubble outlines must be found where expected (ring score > 0.35); otherwise "this sheet doesn't match n items".
  6. Result: code + no flags → saved automatically (KEY → answer key). Otherwise a **review card**: type the code, tap A/B/C/D/– for each flagged item, Save. **"Ask Claude"** (only inside Claude, uses the teacher's Claude usage) is a backup for unclear sheets; Claude only fills flagged or unreadable items, and the teacher still taps Save.
  - **Tested** (`reference/omr-accuracy-test.html`): 40 simulated pencil-shaded sheets (tilt to 12°, perspective, blur, noise, dark room, low resolution, light pencil): **0 wrong answers, 0 wrong codes**; doubles and erasures were always flagged. End-to-end: PDF → shaded → photographed → scanned = exact scores. Real paper is still to be confirmed with the teacher's own test sheets.
- **Live camera (website version):** `getUserMedia` (rear camera), full screen, sheet-shaped frame with guides. Corner check every 280 ms; when the 4 corners are steady for 3 checks (< 1.5% movement) it **captures by itself** (vibrate + flash), reads the sheet, and waits for the next sheet (the same code isn't captured twice). Manual shutter too. Inside a Claude artifact the camera is blocked, so the button explains to use Take photo.
- **Scan frame = answer sheet shape (owner decision, Nov 10).** The frame is exactly 1 : 1.414 (105 × 148.5 mm) and sized to the device: width = min(92% of screen width, 560 px, 66% of screen height ÷ 1.414). Measured: phone 390 × 844 → 359 × 507 px; tablet 820 × 1180 → 551 × 779 px. Four white guide squares sit where the sheet's black corners are (4 mm inset, 5 mm size, scaled to the frame).
- **Auto-align:** detect the 4 black corner squares (dark blobs, roughly square, in the 4 extremes; corner-to-corner ratio 1.25–1.75) and fit move + turn + zoom so they land on the guides. If not found, the teacher aligns by hand: drag to move, pinch or scroll to zoom, ⟳ rotate 90°, Reset, Auto. "Use this sheet" crops to **1050 × 1485 px** (10 px per mm) and only that crop goes to the AI; "Use whole photo" skips cropping. Chosen photos can be aligned one by one (on by default) and re-aligned from their thumbnails.
- **Camera:** the Claude web app can't open a live camera inside an artifact (the platform blocks it), so "Take photo" opens the device's camera app and the frame appears right after. **Android app: use a live CameraX preview with this same sheet-shaped overlay and guide squares**, auto-capture when all 4 corners are found and steady, then the same crop size.
- Reference: `SheetAligner`, `findCorners`, `fitCorners`, `frameSize` in `reference/web-app-reference.html`.
- **Claude web app:** reads photos through the artifact `sample` capability, using the exact prompt in `reference/web-app-reference.html` (search `scanPrompt`; it takes the item count n). It reads the **printed CODE box** (B-#, G-#, or ANSWER KEY) and the printed name; old ID-box sheets are still accepted. The output JSON is `{code, name, answers{"1".."n"}, flagged[], note}`.
- **Android app:** may use Gemini (server-side) with the **same prompt and the same output JSON**. Rules: read only shaded bubbles; double or unclear marks → null and flagged; never guess.
- Flagged items must be shown so the teacher checks them on paper. A re-scanned learner ID replaces the earlier scan.
- Also accept pasted JSON: `{"students":[{"student_id":"B-1","student_name":"…","responses":{"1":"A",…}}]}` (also `answers` arrays and `id`/`name` keys).

## 9. Reports
- **Gradesheet:** separate BOYS and GIRLS tables (count · Mean · MPS in each title bar). Columns: ID, Initials, one ✓/letter cell per item, Score x/n, %, PASSED/FAILED, Level badge.
- **Item Analysis:** bar chart of FOE per item (red = Critical, amber = Least Mastered, green = Mastered) with a dashed 50% line; a red box listing critical items; a table with Item, Component, Key, Correct, FOE, FOE %, % Correct, Remark.
- **Summary (SMEA):** ready-to-copy text in exactly this order: title (`DEPED TERM EXAMINATION SUMMARY (SMEA)` or `… SUMMATIVE TEST …`), region · division, school, Grade & Section, Exam Type, Subject, Items, Learners (Boys/Girls); pass mark, passed, failed, passing rate; Mean, SD, MPS, level; Boys and Girls Mean/MPS; each component (count, item list, Mean/MPS); highest/lowest; critical items; least mastered items; mastered items. Plus Boys/Girls/Total and component tables.
- **CSV** (UTF-8 with BOM), filename `jordynai_report_<subject>_<examType>_<section>.csv`. Blocks in order: header (region, division, school, section, exam type, subject, items) → GRADESHEET (Group, ID, Initials, Q1..Qn as 1/0, Score, %, Status, Level) → SUMMARY (incl. component MPS) → ITEM ANALYSIS (Item, Component, Key, Correct, FOE, FOE %, % Correct, Remark).

## 10. History
"Finalize Session" (after a confirmation) saves: date, Grade & Section, exam type, subject, items, learners, Boys/Girls counts, Mean, SD, MPS, level, passing rate, pass mark, critical items, component MPS, the full summary text and the CSV. The History tab lists sessions newest first, each with View (summary + copy), CSV re-download, and Delete (tap twice). "Clear answers & key for a new exam" keeps the profile, classes and History.

### 10.1 RESET ALL DATA (owner decision, Nov 10)
- At the very bottom of the History tab, under a "danger zone" line: a red button **"⚠️ RESET ALL DATA"**.
- It opens a confirmation listing what will be erased (school profile, saved classes and their learner lists, answer key and exam settings, finalized sessions) and the warning "This cannot be undone. Download the CSVs you need from History first."
- **Yes, erase everything** → erase every saved item for this user (profile, config, key, keySaved, classes, every class's learner list, history, passMark) and return the app to first-use state (profile onboarding opens, Class Setup tab).
- **Cancel** → close the dialog and go back to the home page (Class Setup tab, top of the page). Nothing is erased.

### 10.2 Exams Component (owner decision, Nov 10)
- In History: pick Class, Subject and Term. Use the **latest finalized ST1, ST2 and TE** for that combination (sessions save `slot`, `term` and `scores: {code: raw score}`).
- One row per learner (enrolled list ∪ codes found), Boys then Girls, numeric: Code, Initials (from the local list), ST1, ST2, TE raw scores, and **both** results:
  - **A: Points %** = (ST1 + ST2 + TE raw) ÷ (ST1 + ST2 + TE items) × 100. Example: 20/25, 15/25, 30/50 → 65.00%.
  - **B: DO 15 weights** = ST1% × 30% + ST2% × 30% + TE% × 40%. Same example → 66.00%.
- Missing any of the three tests → "incomplete" (never estimated). CSV download and Copy (generated on the device).

## 11. Look
Dark glass: background gradient slate-950 → indigo-950, glass cards (white 4% with a white 9% border, blur), cyan-400 accent, emerald for success, amber for warnings, red for critical. Fonts: Inter (text), JetBrains Mono (IDs and numbers). Badge colors: Mastered emerald · Closely Approximating emerald-dark · Moving Towards sky · Average amber · Low orange · Very Low red · Absolutely No dark red.

## 11.1 Hosting (owner decision, Nov 10)
The same single HTML file runs on a **free public website** (GitHub Pages, public repo with only the app; no learner data, since names stay on each device in localStorage). Outside Claude: storage = this browser; downloads = normal browser downloads; the Claude backup is hidden.

## 12. Storage
- Android: Firestore under `/users/{uid}/…` (profile/school_info, exam_configs/active including **tags**, grade_sections, students, finalized_sessions).
- Claude web: the artifact `db` capability, private per user (`data/users/<id>/…`); if that's unavailable, this browser only.
- Same field meanings in both, so data and reports match.
