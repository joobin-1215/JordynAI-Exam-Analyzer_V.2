# AGENTS.md: read this first (Google AI Studio, Gemini, and any coding agent)

## Priority rule (set by the owner, Joven R. Castro, Nov 10, 2026)

**The design for this app is planned in Claude. Google AI Studio builds what Claude planned.**

1. **`docs/claude-spec/` is the source of truth.** Read `docs/claude-spec/SPEC.md` before any change.
2. **When anything conflicts, the Claude spec wins**: over code already in this repo, over your own defaults, and over older AI Studio plans (including `.aistudio/artifacts/brain/**/implementation_plan.md`). Change the code to match the spec, not the spec to match the code.
3. **Do not edit `docs/claude-spec/`.** Only Claude (with the owner) changes it. If the spec seems wrong or impossible, keep the code as close to it as you can and **tell the owner which line you could not follow and why**. Never silently do something else.
4. **Work through `docs/claude-spec/TASKS.md` in order.** Each task has acceptance checks. A task is done only when the build passes and its checks pass.
5. **Grading rules are fixed** (SPEC §2). Never invent, estimate, or fill in learner answers, scores or item results. Missing data stays missing.
6. **Privacy:** learners appear as initials plus learner ID (B-1, G-1) on screens, exports and sheets. Never log or commit API keys or learner names.
7. Before you finish: run `gradle :app:testDebugUnitTest`, then list in your reply what you changed and which TASKS items are done.

## How to build (Claude designs, AI Studio builds the Android app)
- Claude cannot build or run Android apps. The working reference is a **web app** (`docs/claude-spec/reference/web-app-reference.html`, React). **Rebuild every behavior natively** in Kotlin + Jetpack Compose (CameraX, PdfDocument, Room/DataStore, Firestore); never wrap the web page in a WebView.
- Where the spec or reference leaves something out for Android (navigation, permissions, error states, loading states, empty states, offline, tablet layouts, accessibility), **fill it in yourself**, staying faithful to the spec's intent and the dark glass look (SPEC §11). The result must be complete and working, not a stub.
- Keep the app's behavior and numbers identical to the reference (same inputs → same Mean, SD, MPS, FOE, component MPS, Exams Component).
- Work task by task (TASKS.md). After each task: build, run the unit tests, fix failures, then report.

## Ask the owner BEFORE these crucial steps (wait for a "yes")
1. Deleting or migrating existing user data (Firestore collections or fields, local databases), or anything that can't be undone.
2. Changing a grading rule, threshold, formula or DepEd-related wording in SPEC §2, §3 or §10.2.
3. Removing or replacing an existing feature or screen.
4. Adding a paid service or API, or anything that may cost money; adding a new third-party SDK that sends data off the device.
5. Sending any learner data off the device, or changing the privacy rules (SPEC §2.5).
6. Requesting new Android permissions beyond the camera and file access.
7. Changing the package name, app signing, Firebase project or keys; publishing to Play Store; force-pushing or rewriting git history; merging to `main` when tests fail.
When you ask, say in plain words what will change, why, and what happens if the owner says no. The owner is a teacher, not a programmer: avoid jargon.

Spec files:
- `docs/claude-spec/SPEC.md`: what the app must do (rules, data, screens, flows)
- `docs/claude-spec/TASKS.md`: ordered work list for AI Studio, with acceptance checks
- `docs/claude-spec/DECISIONS.md`: dated log of the owner's decisions (newest first)
- `docs/claude-spec/AI_STUDIO_PROMPT.md`: the kickoff prompt the owner pastes into Google AI Studio
- `docs/claude-spec/reference/`: working reference implementation (web), grading core (JS + test), answer sheet (HTML + print CSS + PDF generator), and `grading-fixes.patch`

## Who may change this project
Only the owner account joobin-1215 may push. Never add collaborators, deploy keys, tokens or other accounts, and never ask any user for an email password: sign-in is Google's own sign-in only.
