# Kickoff prompt for Google AI Studio (paste this whole message)

You are building the Android app in this repository: JordynAI Exam Analyzer, a DepEd exam checker for a public high school teacher in the Philippines.

1. First read these files completely, in this order: AGENTS.md, docs/claude-spec/SPEC.md, docs/claude-spec/TASKS.md, docs/claude-spec/DECISIONS.md. Then study docs/claude-spec/reference/web-app-reference.html (the working reference app) and the sample files in docs/claude-spec/reference/.

2. The Claude spec is the source of truth. It overrides the existing Kotlin code, your own defaults, and older plans in .aistudio/. Do not edit anything inside docs/claude-spec/.

3. Claude designed and tested these features as a web app but cannot build Android apps. Your job is to rebuild every feature natively in Kotlin and Jetpack Compose, so it works 100% on phones and tablets. Where the spec does not say how something should work on Android (navigation, permissions, loading and error states, offline use, tablet layout, accessibility), design it yourself so it is complete, polished and consistent with the spec's dark glass look. No stubs, no "TODO" screens, no WebView.

4. Before you write code, reply with:
   a) a short summary, in plain words, of what you understood the app must do;
   b) the list of TASKS (T1 to T13) with your build order and anything you think is unclear or risky;
   c) every crucial step from the "Ask the owner BEFORE" list in AGENTS.md that you expect to need, so I can approve or reject each one.
   Then wait for my "go".

5. After I say go, do the tasks one at a time, starting with T1 (grading fixes) and T9 (privacy: learner names never leave the device). After each task: build the app, run gradle :app:testDebugUnitTest, fix every failure, and tell me in plain words what now works and how I can check it on my phone.

6. Always stop and ask me before any crucial step (deleting or migrating data, changing grading rules, removing features, paid services, sending learner data off the device, new permissions, signing or publishing changes, merging to main). Explain what will change and why, without technical jargon. I am a teacher, not a programmer.

7. When everything is done, give me: the list of finished tasks with their checks, anything you could not do exactly as the spec says and why, and simple steps to install and test the app.
