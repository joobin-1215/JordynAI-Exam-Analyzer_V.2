# JordynAI Exam Analyzer · V.2

A free DepEd exam checker for public high school teachers in the Philippines. It runs in the browser on a phone, tablet or laptop.

**Open the app:** https://joobin-1215.github.io/JordynAI-Exam-Analyzer_V.2/ (after GitHub Pages is turned on)

## What it does
- **Teacher profile:** region, schools division and school, printed on every answer sheet.
- **Class lists:** paste learners from the class record (Boys B-1…B-50, Girls G-1…G-50), with an A–Z check by last name.
- **Answer sheets:** 4 per A4 portrait, as PDF or Word. Named sheets with a CODE and a dot code; blank extra sheets for late enrollees.
- **Free scanner:** a live camera that captures by itself, or photos. Sheets are read **on the device**: no AI, no cost, works offline, photos never leave the phone.
- **Reports:** Gradesheet (Boys / Girls), Item Analysis (Frequency of Errors, Critical items above 50%), SMEA summary, MAPEH per-component MPS, CSV export.
- **DepEd Order No. 15, s. 2026:** pass mark 70%, ST1 / ST2 / TE per term, Exams Component (raw points and 30/30/40 weights), item-count warnings.
- **Privacy:** learner names are saved only on the teacher's device. Sheets and saved results carry codes only.
- **Password lock:** each teacher sets a password; everything on the device is encrypted. 12-word recovery code; the admin master password (via `admin-key.json`) can open any teacher's device. Auto-lock after 15 minutes.

## Folders
| Path | What |
|---|---|
| `index.html` | The whole app (one file) |
| `docs/claude-spec/` | Design spec, task list and decisions (source of truth for any builder, incl. Google AI Studio) |
| `samples/` | Sample named sheets and blank extra sheets (PDF) |
| `tools/omr-accuracy-test.html` | Accuracy test for the bubble reader (simulated pencil-shaded photos) |
| `assets/` | Logo |

Owner: Joven R. Castro, Teacher II (MAPEH), Leon Garcia Sr. National High School, Davao City.
