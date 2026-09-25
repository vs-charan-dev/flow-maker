# AI Flow Companion — phase test plan

Use this with [PHASES.md](PHASES.md) and the [PRD](AI_Flow_Companion_PRD.md). Tests are organized by the phase that first introduces a feature. At each phase boundary, run that phase's tests **and** rerun relevant earlier tests. At Phase 7, run the full suite and the complete user flow.

## Rules for the tester or coding agent

- Inspect `package.json` before running commands. Use the actual package manager and script names. The examples below assume npm scripts named `dev`, `lint`, `test`, and `build`; add or adjust scripts deliberately. Do not report a command as passing if it does not exist or was not run.
- Automated tests must be deterministic and must not require a paid OpenRouter key. Stub the server-side HTTP boundary or shared helper. Test route status and safe response bodies, not internal prompt wording. Use a small number of meaningful tests; do not create tests that only repeat constant values or mirror implementation details.
- Manual browser tests use a local development server. Verify normal desktop and narrow mobile widths. Check browser console and network responses for errors and credential leakage. Never paste a real key into test output, screenshots, logs, fixtures, issue text, or commits.
- For any real-provider test, use a key entered through Settings and a model the tester is authorized to use. A mock pass proves routing/behavior only; label live checks **NOT RUN** unless they actually completed against OpenRouter.
- When a check fails, fix it and rerun it before marking the phase passed. Record exact failed IDs and observed behavior. Do not infer success from a build alone.
- Key input may be visible as masked dots. The important security checks are that it does not appear in URL/query strings, local history, rendered page text, logs, or responses. It is expected in the browser-to-app request body and server-to-OpenRouter authorization header for the current request.

## Test environment and evidence

1. Install dependencies using the documented command. Start the app with the documented development command. Note the local URL and browser used.
2. Run the existing lint, test, and build scripts at each phase where they exist. A phase with new logic should include automated checks for its important failure paths.
3. For mocked OpenRouter tests, use fixtures for success, unauthorized key, invalid model, rate limit, network failure/timeout, malformed JSON, schema-invalid JSON, and success after one correction retry. Confirm the mock was actually invoked the expected number of times.
4. Store test results in the phase report described in `PHASES.md`. Evidence can be command output summaries and observed UI behavior; do not save credentials.

## Phase 0 — foundation

| ID | Action | Expected result |
| --- | --- | --- |
| F0-1 | From a clean checkout, run the README install command, lint, and build. | All exit successfully; no missing script or dependency. |
| F0-2 | Start the app and open `/` with no `.env` or key. | Home renders without runtime errors. |
| F0-3 | Inspect `package.json` and project files. | Next.js App Router, TypeScript, Tailwind, Zod present; no database/auth/extra provider; generated artifacts ignored. |

**Gate:** all F0 checks pass.

## Phase 1 — form and Settings

| ID | Action | Expected result |
| --- | --- | --- |
| F1-1 | Open and close Settings by mouse and keyboard; tab through every control. | Modal is usable, focus is visible, inputs have labels, and closing returns focus sensibly. |
| F1-2 | Enter key and arbitrary non-empty model ID; toggle show/hide. | Key is masked by default; no model allowlist rejects the ID locally. Save & Test is visibly unavailable until Phase 2. |
| F1-3 | Clear key; try to build. | Missing-settings message appears. No generation request is sent. |
| F1-4 | Try blank task/outcome, duration 9, 241, fractional/non-numeric values; then valid values. | Invalid values are rejected with field guidance; valid 10 and 240 are accepted. Default duration is 60 and energy is Normal. |
| F1-5 | Inspect storage helper code and URL after entering settings. | Helpers target `sessionStorage` for key and `localStorage` for model; key absent from URL. Persistence is checked in F2-6. |

**Gate:** all F1 checks pass. The main session action may remain unavailable until Phase 3.

## Phase 2 — connection

| ID | Action | Expected result |
| --- | --- | --- |
| F2-1 | Automated: send missing/blank key or model to test route. | Client error; shared helper is not called; response contains no key. |
| F2-2 | Automated: stub provider success for the exact supplied model. | Route makes one small request and returns success; UI shows Connected only after response. |
| F2-3 | Automated: stub 401/403, recognizable bad-model error, 429, timeout/network failure. | Useful distinct safe messages/statuses; no raw auth header, key, or upstream body exposed. |
| F2-4 | Change model/key after a successful test and test a failed pair. | Connected indicator clears; failure is shown; no false success. |
| F2-5 | Inspect server/client code and captured requests. | Provider URL is called only server-side; no server persistence or secret logging; key never goes into a URL. |
| F2-6 | Enter key/model and click Save & Test; refresh, then clear the key. | Key remains in `sessionStorage` for the browser session, model in `localStorage`; clear removes the key; no key appears in history data. |
| F2-LIVE | With an authorized real key and valid model, click Save & Test Connection, then try an invalid key and invalid model. | Valid pair connects; invalid pair receives a useful error. Record each as PASS or NOT RUN separately. |

**Gate:** F2-1–F2-6 pass. F2-LIVE may be NOT RUN when credentials are unavailable; that limitation carries to Phase 7.

## Phase 3 — quest generation

| ID | Action | Expected result |
| --- | --- | --- |
| F3-1 | Automated: send invalid task/outcome/duration/energy or missing credentials to `/api/quest`. | Request rejected before provider call. |
| F3-2 | Automated: return valid JSON for 10, 60, and 240 minutes. | Plan accepted; IDs unique; fields non-empty; positive integer minutes sum exactly to the requested duration. Short/long range exceptions follow `PHASES.md`. |
| F3-3 | Automated: first provider response malformed or schema-invalid, second valid. | Exactly one correction retry; valid plan returned. |
| F3-4 | Automated: both provider responses invalid, or provider rejects request. | Safe error after no more than two calls; no static fallback plan or crash. |
| F3-5 | Manual: submit valid form, then simulate failure and retry. | Changing loading text appears during work; success enters `/session`; failure leaves entries intact and offers retry. |
| F3-6 | Inspect outgoing request under a stubbed provider. | It uses the entered model, task, goal, duration, and energy; no hardcoded model ID. |
| F3-LIVE | Generate a session through a real valid model. | Missions are actionable, varied where appropriate, and relevant to the entered goal. Mark NOT RUN without credentials. |

**Gate:** F3-1–F3-6 pass. F3-LIVE may remain NOT RUN.

## Phase 4 — mission flow

| ID | Action | Expected result |
| --- | --- | --- |
| F4-1 | Open `/session` without a valid active session, including with corrupt stored JSON. | App does not crash; offers a clear way home. |
| F4-2 | Start a plan, click Done on one mission and Skip on another. | Exactly one mission shown at a time; progress and counts match statuses; no duplicate advancement. |
| F4-3 | Refresh partway through the session. | Current mission and completed/skipped states are restored. |
| F4-4 | Finish the last mission, then refresh. | Completion state remains available; no out-of-range mission or duplicate completion event. |
| F4-5 | Inspect session on a narrow viewport. | Main actions usable without horizontal scrolling; mission duration is subtle; no large countdown dominates. |

**Gate:** all F4 checks pass.

## Phase 5 — adaptation

| ID | Action | Expected result |
| --- | --- | --- |
| F5-1 | Automated: send each feedback value with a valid active-session payload. | Route uses `too_hard`, `bored`, or `not_useful`; original goal and outcome included; completed records provided as context. |
| F5-2 | Automated: return valid replacement missions. | Only current/later pending missions change; completed/skipped records stay byte-for-byte intact; remaining minutes and all IDs validate. |
| F5-3 | Automated: return duplicate ID, wrong minute sum, malformed JSON, or schema-invalid data. | One correction retry, then safe error if still invalid; original plan retained. |
| F5-4 | Manual: click each feedback action on separate sessions. | Too Hard yields a smaller step; I'm Bored changes interaction style; Not Useful is closer to goal. Current progress is unchanged. |
| F5-5 | Trigger slow/error response and click feedback repeatedly. | One in-flight request; UI indicates work; failure leaves controls and original mission usable. |
| F5-LIVE | Use one real feedback action after real generation. | Returned plan is useful and preserves completed work. Mark NOT RUN without credentials. |

**Gate:** F5-1–F5-5 pass. F5-LIVE may remain NOT RUN.

## Phase 6 — completion and history

| ID | Action | Expected result |
| --- | --- | --- |
| F6-1 | Complete some missions and skip others; finish. | Correct lists/counts, original goal, and estimated focused minutes from completed missions only. No claim of measured elapsed time. |
| F6-2 | Submit each speed reflection; optionally submit engagement 1 or 5; refresh. | Selection persists and can be changed; optional rating may stay empty. |
| F6-3 | Finish eleven sessions, including refresh on completion. | At most ten summaries, newest first; refresh does not duplicate a summary. |
| F6-4 | Click Repeat on a history card. | Task, duration, outcome, energy pre-fill; creating a session requests a new plan. |
| F6-5 | Inspect stored summaries and corrupt/blocked browser storage behavior. | No API key in history; app remains usable if storage fails or stored data is invalid. |

**Gate:** all F6 checks pass.

## Phase 7 — final acceptance

| ID | Action | Expected result |
| --- | --- | --- |
| F7-1 | Run documented install, lint, automated tests, and production build from the finished repository. | Commands succeed; README matches actual scripts. |
| F7-2 | Walk through Settings → connection → setup → generation → Done/Skip → each adaptation → completion → history → Repeat. | PRD acceptance criteria 1–17 pass; no fake or dead action. Use mock for deterministic checks and live provider where available. |
| F7-3 | Exercise missing configuration, invalid key/model, rate limit, network failure, bad AI JSON, refresh, and corrupt storage. | Recoverable UI errors; no crash; PRD criterion 18 passes. |
| F7-4 | Search source and inspect storage, logs, request/response payloads, and build output for credentials. | No hardcoded key or stored server secret; no key in history or logs; PRD criterion 19 passes. Do not print a real key during this check. |
| F7-5 | Check narrow mobile (~375px), tablet (~768px), and desktop (~1280px); navigate via keyboard. | No broken layout or horizontal scrolling; labels, focus, contrast, controls usable; PRD criterion 20 passes. |
| F7-LIVE | With authorized credentials, run one real connection, generation, and adaptation; check invalid key and model responses. | Actual OpenRouter integration verified. If unavailable, mark each external check NOT RUN and state that acceptance criteria 6, 9, 12–14 are validated only with mocks. |

**Final report:** list results for all 20 PRD acceptance criteria, any NOT RUN live checks, the exact commands run, and remaining limitations. A green build alone is insufficient.
