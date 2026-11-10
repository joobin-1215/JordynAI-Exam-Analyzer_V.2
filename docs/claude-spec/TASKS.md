# TASKS for Google AI Studio (do them in order)

Read `/AGENTS.md` and `SPEC.md` first. Mark a task done only when the build passes (`gradle :app:testDebugUnitTest`) and its checks pass. Report done and not-done tasks to the owner when you finish.

---

## T1. Apply the grading fixes (SPEC §2): HIGHEST PRIORITY
Apply `reference/grading-fixes.patch` (the same change is on branch `fix/deped-grading-rules`, commit `a988a0e`). It:
- restores the 7 proficiency bands in `DepEdCalculator.proficiencyFromPct`;
- removes the faked item results (`(i + score) % 3 == 0`) and counts only learners who have item responses;
- adds `DepEdCalculator.itemRemark()` (Critical > 50% wrong, Least Mastered > 25%, else Mastered) and `PASSING_FRACTION`; **after applying, change `PASSING_FRACTION` to `0.70`** (DO 15, s. 2026, SPEC §2.1) and update the test to expect 0.70;
- makes the learner remark Passed / Failed;
- sets the MAPEH summative default split to 12 + 13;
- adds `app/src/test/java/com/example/data/DepEdCalculatorRulesTest.kt`.

If the patch doesn't apply cleanly, make the same changes by hand.
**Checks:** the build passes; `DepEdCalculatorRulesTest` passes; searching the code for `Average / Low` and `% 3 == 0` finds nothing; UI colors and labels for the item remark show the new three remarks.

## T2. Per-item MAPEH component tags (SPEC §3.1)
- Add `tags: List<Int>` (one component index per item) to `ExamConfig` and save it in Firestore with the config.
- Components by subject: Music and Arts → [Music, Arts]; PE and Health → [PE, Health]; MAPEH whole → [Music, Arts, PE, Health].
- Default tags as in SPEC §3.1 (25 → 12/13; 50 with 4 components → 12/13/12/13). For old configs, build tags from `mapehComp1Items`/`mapehComp2Items`.
- Answer Key screen: a colored tag under each item (tap to cycle), a "type item numbers" field per component (`1, 3, 6-7`) with a Set button, per-component counts, and Reset to blocks. Copy the behavior from `reference/web-app-reference.html` (search `parseItems`, `defaultTags`, `cycleTag`).
- Per-component Mean / MPS / level in the Summary, SMEA text, CSV, History and the Item Analysis Component column.
- Remove the old Music/Arts item-count modal.

**Checks:** unit test: tags for the Grade 7 Term 2 split (Music 1, 3, 6, 7, 10–12, 14, 16, 19, 20, 24; Arts the rest of 1–25; PE 37, 38, 41–50; Health 26–36, 39, 40) give counts 12/13/12/13. A learner who answers only the Music items correctly gets Music MPS 100% and the other components 0%.

## T3. Tab locking also requires the profile (SPEC §6)
Tabs unlock only when the profile is confirmed **and** the answer key is saved. Changing Total Items marks the key unsaved again. A scanned KEY sheet saves the key.
**Checks:** a fresh account sees only Class Setup unlocked; after profile + key, all tabs unlock; changing Total Items re-locks them.

## T4. Scanner contract (SPEC §8)
Use the exact `SCAN_PROMPT` text from `reference/web-app-reference.html` and the same JSON output. Show flagged items. Read one quarter-sheet per photo. A re-scanned ID replaces the earlier one.
**Checks:** a sheet with a double-shaded item shows it as flagged and counts it wrong; a KEY sheet fills the answer key.

## T5. Reports match the reference (SPEC §9–§10)
SMEA text order, CSV blocks and filename, the Boys/Girls tables, the 50% line in the chart, and History fields as in the spec. Initials only (SPEC §2.5).
**Checks:** run the same learners through the Android app and the web reference: Mean, SD, MPS, level, FOE and component MPS are identical.

## T6. Named answer sheets without the ID box (SPEC §7)
Rebuild Copy A/S and the class download to match `buildSheetsHtml()` / `sheetLayout()` in `reference/web-app-reference.html`: printed name, grade & section, subject and CODE box; no Learner ID box; items area balanced by item count; key sheet first, then boys, then girls, 4 per A4.
**Checks:** 50 items → 4×13 layout; 25 → 3×9; 10 → 2×5. 23 learners + key → 6 A4 pages. Printing at 100% gives 105 × 148.5 mm sheets with nothing cut off.

## T7. Student list per class (SPEC §5.1)
"👥 Add Students from <SECTION>" for each saved class → the Learners page (BOYS B-1…B-50 left, GIRLS G-1…G-50 right, permanent code labels, paste + Fill, middle name → initial, editable rows, multi-line paste into a row), the "Save Learners in <Grade> – Section <SECTION>" button with the 3-second A–Z check, red rows, "Sort A–Z for me", the download of named sheets, and the use in grading. Copy from `reference/web-app-reference.html` (search `RosterPage`, `cleanName`, `toMiddleInitial`, `orderProblems`, `compareNames`).
**Checks:** unit tests: `"b-1\tABADIA, KRISTOPHER RYAN, NOBLEFRANCA"` → `ABADIA, KRISTOPHER RYAN N.`; `"11\tLOR, RAYMUND JR., BABATO-AN"` → `LOR, RAYMUND JR. B.`; `"21\t"` → skipped; `orderProblems(["ABADIA…","ZAMORA…","BRIDOL…"])` flags rows 1 and 2; "BRIDOL" sorts before "CAÑA" and "NUÑEZ" after "NUNEZ"… Saving is blocked while any row is red. A scanned B-2 shows the initials of the 2nd boy.

## T8. RESET ALL DATA (SPEC §10.1)
Red "⚠️ RESET ALL DATA" button at the bottom of History, the confirmation dialog, Yes = erase everything (Firestore docs under `/users/{uid}/…`, including learner lists and finalized sessions) and restart onboarding, Cancel = back to Class Setup.
**Checks:** after Yes and an app restart, the profile dialog appears and there are no classes, learners or History; after Cancel, all data is still there.

## T9. Codes-only privacy (SPEC §2.5): HIGH PRIORITY
Move learner lists out of Firestore into local device storage; remove names from printed sheets (Exam line instead), from the scanner prompt/JSON and from cloud-saved sessions; add the device-only Code List.
**Checks:** search the Firestore writes: no learner names; the scanner prompt contains "do NOT read, copy or report any person's name"; the sheet HTML for a class contains no names.

## T10. Term + ST1/ST2/TE + item-count warning (SPEC §3)
**Checks:** a Grade 7 ST with 30 items shows the warning; a TE with 50 items shows none; History labels read like "ST1 · Term 2".

## T11. Exams Component (SPEC §10.2)
**Checks:** the example 20/25, 15/25, 30/50 shows A 65.00 and B 66.00; a learner missing a test shows "incomplete".

## T12. Sheet-shaped live scanner (SPEC §8)
CameraX live preview with the 1 : 1.414 frame and 4 guide squares, corner detection + auto-capture, manual fallback (drag, pinch, rotate), crop to 1050 × 1485 before sending to Gemini.
**Checks:** on a phone and a tablet, the frame keeps the 1 : 1.414 shape and fits the screen; a tilted photo of a sheet comes out straight and cropped; a photo without 4 corners falls back to manual alignment.

## T13. Copy A/S = blank extra sheets, PDF + Word (SPEC §7)
**Checks:** the modal shows only Download PDF and Download Word; 2 pages → 8 sheets; the header shows the profile; Name, Grade & Section, Date and CODE are blank; both files print A4 portrait at 100% with nothing cut off.

## T14. Free on-device OMR + CODE dots (SPEC 7.1, 8): HIGH PRIORITY (replaces Gemini as the main reader)
Port `GEO`, `drawSheetCell`, `codeToBits`/`bitsToCode`, `bubbleCenters`, `coarseCorners`/`refineCorners`/`homography`/`readSheet` to Kotlin (pure functions, unit-tested), and draw sheets with Android PdfDocument using the same geometry. Use Gemini only as an optional backup **after the owner approves the cost**.
**Checks:** port `reference/omr-accuracy-test.html` cases into JVM tests with generated bitmaps: 0 wrong answers and 0 wrong codes; a 50-item sheet read as 25 is rejected; CameraX auto-capture when the corners are steady.

## T15. Password lock + encrypted device data (SPEC 2.6)
Per-device password, 12-word recovery code, admin public-key lock (admin-key.json), lock screen with Password / Recovery / Admin tabs, 15-minute auto-lock, Security card, Erase this device. Android: store the vault in app-private storage; use Android Keystore for an optional biometric unlock **only after the owner approves**.
**Checks:** nothing readable (school, names, classes) in storage; wrong password and wrong master password refused; admin unlock works on a co-teacher device; recovery code works in any letter case; the admin-key.json contains no password.

---
When all tasks are done, tell the owner, and ask Claude to update `SPEC.md` / `DECISIONS.md` if anything had to differ.
