# Owner decisions (newest first)

Decisions by Joven R. Castro, recorded by Claude. Each one overrides any older plan or code.

## 2026-11-10
- **Scanner speed + flashlight; Name line back; saved sheet images** (name strip + whole sheet, on the device, encrypted) organized by Grade & Section → Exam, with ZIP (phones) and direct folder saving (laptops); lighter row stripes.
- **Password lock:** me + co-teachers, each with a password on their own device; device data encrypted; 12-word recovery code; admin master password via an admin key file; auto-lock after 15 minutes.
- **100% free reading:** sheets are read ON THE DEVICE by our own bubble reader (exact sheet geometry + perspective correction + darkness check), with a tiny CODE dot strip for learner codes. No Gemini or paid API. Claude is only an optional backup for unclear sheets (inside Claude).
- **Free public website** (GitHub Pages) so the live camera works; only the app is public, never learner data.
- **Copy A/S = blank extra sheets** (late enrollees, spoiled sheets): profile header printed; Name, Grade & Section, Date and CODE blank; download as **PDF** or **Microsoft Word (.docx)** only.
- **Scan frame = answer sheet shape** (1 : 1.414) on any phone or tablet, with guide squares on the black corners, auto corner detection, and crop to the sheet before the AI reads it.
- **DO 15, s. 2026 alignment** (as reported by DepEd Teachers Club and Philstar; to be checked against the official order):
  - **Codes only to AI:** learner names stay on the device; sheets print codes, not names; the scanner never reads names; cloud data is codes and scores only.
  - **Pass mark 70%** (SY 2026–2027 adjusted table: 70 = 75).
  - **ST1 / ST2 / TE per term**, with an Exams Component that shows **both** A (raw points, e.g. 25 + 25 + 50) and B (DO 15 weights 30/30/40).
  - **Item-count warning only** (Grades 7–10: TE 50, ST ≤ 25).
- **RESET ALL DATA** button (red, with a danger sign) at the bottom of History: Yes erases everything and restarts the app as new; Cancel returns to the home page.
- **Named answer sheets:** the Learner ID bubble box is removed. Each sheet prints the learner's name, grade & section, subject and a CODE box (B-1…B-50 / G-1…G-50). The items area grows to fill the space, balanced to the number of items. The download per class = 1 ANSWER KEY sheet + one sheet per enrolled learner.
- **Learner list rules:** names as LAST NAME, Given Name, Middle Initial (a full middle name is changed to its initial automatically); boys left, girls right; codes are permanent row labels; names must be A–Z by last name. A 3-second check on "Save Learners in <Grade> – Section <SECTION>" marks out-of-order rows red and offers "Sort A–Z for me".
- **Student list per class:** each saved class gets an "Add Students from <SECTION>" button that opens a page where the teacher pastes officially enrolled learners from the class record or masterlist: Boys B1–B50 on the left, Girls G1–G50 on the right. The list order sets the learner IDs and fills in initials in reports.
- **Claude plans, Google AI Studio builds.** `docs/claude-spec/` is the source of truth and wins every conflict (see `/AGENTS.md`). The spec lives on `main`.
- **The grading fixes are applied by AI Studio** (TASKS T1), with a build and tests, not merged blindly.
- **Both apps stay in sync:** the Android app and the Claude web app follow the same spec.
- **MAPEH: tag each item** with its component (Music/Arts/PE/Health) instead of a fixed first-N split.
- **Pass mark 60% raw** (= 75 transmuted). The teacher can change it.
- **Learner IDs up to 59** per gender (TENS 0–5) are enough.
- **Answer sheet: 4 per A4 portrait**, 105 × 148.5 mm each, cut lines, with the teacher profile in the header.
- **Initials only** for learners (first-name letters, then last-name letters).
- **Pure Claude reading** for the web app (no Google AI Studio OMR). The Android app may use Gemini with the same prompt and JSON.
- Ported from the AI Studio app into the spec: teacher profile onboarding (17 regions, divisions, uppercase, Confirmed / Edit Again), Copy A/S, guided prompts, tab locking, class setup, portrait scanner, Finalize + History, clear for a new exam.
- Rejected from the AI Studio app (bugs): the "Average / Low Mastery" band, item remarks at 60% / 35%, the 13 + 12 MAPEH summative default, and faked item results for score-only learners.

## 2026-11-09
- Summatives: 2 sets per term, 25 items each (Music 12 + Arts 13; PE 12 + Health 13), with questions taken from the term exam.
- The correct answer is never the longest choice. Balance A–D.
