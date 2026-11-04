# Case Drill (PWA) — v4, gold-standard path

Host at any https URL (GitHub Pages: Settings → Pages → main / root). iPhone: Safari → Share → Add to Home Screen.

**v5 (Nov 4, 2026) — the one-stop casing app.** Same gold-standard path (18 levels, six-stage ladder, atomic SRS, XP/streaks/badges) plus:
- **Live modes (Claude-graded):** full live case with Claude as interviewer (clarify → structure 0–6 → generated exhibit → brainstorm → recommendation → scorecard /100), structure recite, brainstorm sprint, exhibit & math. Persona switch: Friendly Coach / Poker Face.
- **Drills:** clarifying questions (BGOT), hypothesis & synthesis, mental math sprints, numbers cold, review. Live-graded when connected, self-graded otherwise.
- **Scenario generator:** new context-rich cases for any type, checked against the client inventory, saved and used by boss/recite/live case.
- **Library:** 18 frameworks, 13 industry primer cards with framework swap-ins, all cases (library + generated), brainstorms, coaching cards, numbers.
- **Coach tab:** weaknesses by type and rubric item, "ask the coach" weekly read, badges, settings.
- **Three ways to run:** Claude-hosted artifact (live via your Claude account, progress synced through the artifact db), installed PWA with an Anthropic API key (live, pay-per-use), installed PWA offline. Progress key `cd5` (migrates `cd4`).

Build: `python3 src/build.py` assembles `src/head.html + core.js + modes.js` (gold standard in `src/standard.py`, v3 data in `src/data_v3.json`) with data → `index.html` and `artifact_index.html` (no service worker). Bump the cache name in `sw.js` on every release.

**v4 (Nov 4, 2026).** Rebuilt around the locked gold-standard framework library (Nov 2, 2026).
- Path of 18 levels: the 10 standard frameworks first, then the other 8 unlock behind them.
- Each level is a fixed ladder: Buckets → MECE cut → Click-downs → Trap & start → Blank recall (3 separate days = mastered) → Boss case (a real tailored client).
- Every bucket, click-down set, cut, trap and start bucket is its own spaced-repetition item (0/1/3/7/14/30 days, miss resets to today); each return rotates format: build → choose → odd-one-out → type.
- XP with speed and combo multipliers, daily goal, streak with one freeze, ranks (Analyst → Senior Partner), badges, bonus rounds (numbers cold, brainstorm lens).
- Progress lives in localStorage key `cd4` (fresh start from v3).

**Desktop.** Same URL in any browser: at laptop widths the nav becomes a sidebar and the keyboard drives everything (1–4 answer/tap chips, Backspace undo, Enter check/next, Ctrl/⌘+Enter in text, Esc quit). Progress is per device — Stats → Export/Import moves a save between phone and laptop.

Build: `python3 cd4/build.py` patches the 18 types with the gold standard and embeds data into `cd4/app4.html` → `index.html`. Bump the cache name in `sw.js` on every release.
