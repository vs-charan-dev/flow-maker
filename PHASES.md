# AI Flow Companion — implementation phases

This is the execution plan for [AI_Flow_Companion_PRD.md](AI_Flow_Companion_PRD.md). Work through phases 0–7 in order. After **each** phase, run its checks in [test.md](test.md) and record the result before starting the next phase. The PRD is the product authority; this file makes its implementation order and ambiguous cases explicit.

## Instructions for the coding agent

1. Read the PRD, this file, and `test.md` before editing. Inspect the actual repository; at the time these documents were written it contained only the PRD. Do not assume files, scripts, dependencies, or tests already exist.
2. Implement only the current phase. Keep the app runnable at every phase boundary. Use Next.js App Router, TypeScript, Tailwind CSS, and Zod. Add no database, account system, alternate AI provider, or unnecessary framework.
3. Use the exact route paths required by the PRD: `POST /api/openrouter/test`, `POST /api/quest`, and `POST /api/adapt`. Keep OpenRouter calls in server routes through one shared helper. React code must never call OpenRouter directly.
4. Use the installed package versions and their documented APIs. Before changing a command or import, check `package.json` and the installed package. Do not invent scripts, CLI flags, exports, test results, API responses, or working credentials.
5. Keep TypeScript types and Zod schemas aligned. Validate untrusted request bodies, provider responses, and browser storage before use. Display user-facing errors; do not show raw provider bodies or secrets.
6. Finish each phase by running the matching test section, fixing failures, and writing a short report: changed files, commands run, manual checks, pass/fail, and any limitation. Never claim an unrun check passed. Do not mark a phase complete if a required check failed. If a check requires a real key and none was supplied, mark it **NOT RUN — real key required** and continue only where `test.md` permits.
7. Do not replace an unfinished requirement with a placeholder, static mission list, fake connection success, fabricated test output, or TODO. Keep work scoped to the phase; later phases add later features.

## Decisions that remove ambiguity

- **Credentials:** The API key is entered in Settings and stored in `sessionStorage` for this MVP. Do not add the optional “Remember on this device” control. Store the model ID in `localStorage`. No key or model is hardcoded, stored in `.env`, or persisted server-side. The key travels only in the body of a same-origin request to the relevant route, then in the server-to-OpenRouter authorization header. Never put it in a URL, log, error message, history record, or rendered HTML.
- **Connection:** “Connected” means the test route completed a real, small OpenRouter request for the exact entered key and model. A local mock can verify the UI and routing, but it cannot establish a real connection. Saving an untested or failed pair must not show “Connected.” Quest and adaptation still handle provider errors even after a successful test.
- **Session budget:** Sum of mission `minutes` must equal the user-selected duration. Aim for 5–10 missions of 3–15 minutes when mathematically possible. At 10–14 minutes, fewer than five missions are acceptable. Above 150 minutes, some missions must exceed 15 minutes if limited to ten; use sensible chunks and retain the selected total. Never silently change the requested duration to satisfy a guideline.
- **Session state:** Maintain ordered missions with `pending`, `completed`, or `skipped` status and a current mission index. Show one pending mission at a time. `Done` and `Skip` move forward immediately. Estimated focused minutes equal the sum of **completed** mission estimates; skips contribute zero. The app does not claim to measure actual elapsed time.
- **Adaptation:** `Too Hard`, `I'm Bored`, and `Not Useful` act on the current pending mission and any later pending missions. Send original goal, desired outcome, feedback, current mission, completed missions, and the remaining **planned** minute budget. Keep completed and skipped records unchanged. The validated replacement must fill exactly that remaining budget; otherwise retry once, then show an error and retain the original plan. Do not advance on a failed adaptation. Prevent duplicate requests while one is running.
- **Storage:** Keep the active session in browser storage so refresh can restore it. Keep at most ten finished summaries in local history. Storage may fail or contain old/corrupt data; handle that without crashing. History and summaries must contain no API key. Repeating a session pre-fills the home form, then generates a new plan rather than replaying old missions.
- **AI contract:** Parse provider content as JSON and validate with Zod. One correction retry is allowed for malformed or schema-invalid provider output. Do not silently substitute handcrafted missions. Validate mission IDs as unique, strings as non-empty, durations as positive integers, and the minute total as above. The OpenRouter request format must be checked against current official docs during implementation; do not assume every model accepts a special JSON response mode. Prompt for JSON and validate regardless.
- **Error mapping:** Distinguish missing fields, invalid key, unavailable/invalid model, rate limit, network/provider failure, and invalid AI response where evidence permits. For ambiguous provider failures, use a generic safe error rather than guessing. Never return provider headers, request bodies, or raw error text containing credentials to the browser.

## Phase 0 — Project foundation

**Build**

- Initialize a minimal Next.js App Router project in this repository with TypeScript, Tailwind CSS, ESLint, and Zod. Keep the PRD and these documents.
- Add a short `README.md` with actual install, development, and production build commands. Do not mention a required API key environment variable.
- Add a simple home page and global layout that render without credentials. Set a clear page title. Add no fake functional controls.
- Ensure generated files and dependencies are ignored appropriately; avoid committing secret or build artifacts.

**Done when:** clean install, lint, and build succeed using commands that really exist in `package.json`; the home page loads with no API key.

**Gate:** `test.md` → Phase 0. Do not start Settings until this gate passes.

## Phase 1 — Home form and Settings

**Build**

- Add the task, duration (10–240, default 60), desired outcome, and energy (Low/Normal/High, default Normal) inputs. Label controls and show field errors. The form should not submit empty task/outcome or an invalid duration.
- Add the Settings button/modal with password-style key field, show/hide, clear, free-text model ID, and a **Save & Test Connection** control that is visibly unavailable until Phase 2 wires the real route. Allow any non-empty model ID; do not make a hardcoded allowlist.
- Add safe storage helpers for the session key and local model, but do not claim to save or connect until Phase 2. Read and write only in browser code. Add the PRD privacy note. Show missing-settings guidance when the user tries to build a session without both values.
- Keep the main action disabled or show a clear “not yet available” state until the real generation route exists in Phase 3. Do not claim to generate a session yet.

**Done when:** form and Settings behave correctly with keyboard and mouse, storage helpers are ready for Phase 2, and no key appears in the URL or page source.

**Gate:** `test.md` → Phase 1.

## Phase 2 — OpenRouter test route and shared helper

**Build**

- Implement the shared server-only OpenRouter helper and `POST /api/openrouter/test`. Validate body fields before any provider call. Make a minimal provider request using the exact supplied model. Return a small success payload only after a successful provider response.
- Map recognizable authentication, invalid model, rate limit, and network/provider errors to safe status codes/messages. Apply a bounded timeout. Do not log secrets or reflect raw upstream errors.
- Wire **Save & Test Connection** to the route. Show pending, success, and useful error states. Persist the entered settings according to the credential decision above, but clear the “Connected” indicator whenever key or model changes until a new test succeeds.
- Use a mock HTTP response or stubbed helper for deterministic route tests. Do not make automated tests depend on a paid key.

**Done when:** test success is based on a provider response; invalid input is rejected locally; provider errors are visible and safe; no key is stored on the server.

**Gate:** `test.md` → Phase 2. Real-provider checks remain explicitly unverified if no key is available.

## Phase 3 — Quest generation

**Build**

- Define request and response Zod schemas. Implement `POST /api/quest` with input validation, a goal-focused generation prompt, OpenRouter call, JSON parsing, schema/semantic validation, one correction retry, and safe errors.
- Enforce unique IDs, usable instructions, the duration budget, and session timing decisions above. If the provider cannot meet the contract after the retry, report an error; do not fabricate a plan.
- Wire **Build My Session** to the route using the browser-held key/model for that request. Show changing loading copy without fake percentages. On success, create active session state and navigate to `/session`; on failure, keep form input and allow retry.

**Done when:** a valid provider response produces an ordered mission plan for the entered goal and budget; invalid provider output fails safely after exactly one correction retry.

**Gate:** `test.md` → Phase 3.

## Phase 4 — Mission session and basic controls

**Build**

- Add `/session` with title, progress, mission count, one mission card, subtle duration, instruction, and optional completion question. Avoid a prominent countdown timer.
- Add `Done` and `Skip`; advance once per click. Preserve statuses and keep progress consistent. Refresh should restore the active session. If there is no valid active session, show a route back home.
- After the last mission, show a basic completion state; Phase 6 expands its summary/history.

**Done when:** a plan can be completed or skipped end to end without off-by-one errors, and refresh does not lose progress.

**Gate:** `test.md` → Phase 4.

## Phase 5 — Adaptive feedback

**Build**

- Implement `POST /api/adapt` with validated input/output and the same one-retry rule. Include completed work as context, but accept replacements only for the current and later pending missions. Enforce unique IDs across the resulting session and the exact remaining minute budget.
- Add `Too Hard`, `I'm Bored`, and `Not Useful` controls. Send the corresponding feedback value (`too_hard`, `bored`, `not_useful`). Replace pending work atomically after successful validation. Preserve completed/skipped missions and current progress.
- Show loading and recoverable errors; a failed adaptation leaves the prior plan usable. Block duplicate feedback actions while a request is in flight.

**Done when:** all three actions change only pending work and failure never destroys the active session.

**Gate:** `test.md` → Phase 5.

## Phase 6 — Completion and local history

**Build**

- Show completed/skipped counts and missions, estimated focused minutes, original goal, and simple reflection. Add “faster than normal” (Yes/About the same/Slower) and optional engagement rating (1–5). Save revisions locally.
- Store at most ten finished session summaries, newest first, with title, date, selected duration, completion percentage, and setup values needed for Repeat. Do not duplicate a summary on refresh.
- Show Recent Sessions on home. Repeat pre-fills setup and leaves the user in control of generating a fresh session.

**Done when:** completion details are accurate, history survives refresh, trims to ten, and contains no credential.

**Gate:** `test.md` → Phase 6.

## Phase 7 — Full acceptance and polish

**Build**

- Review all 20 PRD acceptance criteria. Finish responsive layouts, focus visibility, keyboard navigation, labels, contrast, loading/error states, and empty/corrupt storage handling.
- Verify README commands against the finished app. Remove dead code, fake success paths, unused dependencies, and any accidental secret logging. Keep changes within the MVP.
- Run the full automated suite and a manual desktop/mobile walk-through. If a valid OpenRouter key/model is available, perform one real connection test, generation, and adaptation. Record the model used without recording the key. If unavailable, say exactly which live checks were not run.

**Done when:** every PRD acceptance criterion has a recorded result in the final phase report. The app starts and builds, and any remaining unverified external-provider behavior is clearly identified.

**Gate:** `test.md` → Phase 7.

## Phase report template

Use this after every phase (in the work report or an implementation log):

```text
Phase N — PASS / FAIL / BLOCKED
Changed files:
Commands and results:
Manual checks and results:
Automated test IDs passed:
Test IDs not run and why:
Known limitations:
Next phase allowed: yes/no
```

`BLOCKED` is for a genuine external dependency such as unavailable live credentials. It is not a substitute for fixing failing local checks. Never write “all tests pass” when some tests were skipped.
