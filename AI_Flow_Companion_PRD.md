# PRD — AI Flow Companion
## Make boring work feel shorter

**Version:** 1.0  
**Product type:** Simple AI productivity web app  
**Primary AI provider:** OpenRouter  
**Target build style:** Small MVP that an AI coding agent should be able to build in one pass

---

## 1. Product Summary

AI Flow Companion is a lightweight web app that turns a boring or intimidating work session into a sequence of short, varied, game-like missions.

Instead of showing the user:

> “Work for 60 minutes.”

the app transforms that hour into a guided sequence such as:

- Understand one concept
- Explain it back in your own words
- Solve one challenge
- Take a tiny reset
- Complete the next milestone
- Finish with a quick recap

The goal is not to become a large productivity platform.

The goal is simple:

> **Make boring work feel shorter by reducing time-monitoring and increasing engagement, novelty, progress, and small wins.**

The user can enter any OpenRouter API key and any valid OpenRouter model ID directly in the GUI. No API key or model name should be hardcoded into source files or environment files.

---

# 2. Core Problem

A fixed amount of time can feel very different depending on what a person is doing.

An hour of:

- waiting,
- repetitive studying,
- documentation,
- admin work,
- reading,
- debugging,
- writing,

can feel much longer than an hour spent:

- watching short-form content,
- gaming,
- talking with friends,
- travelling,
- doing something novel.

The product will not claim to “change time.”

Instead, it tries to make work sessions feel more engaging by using:

- short goals,
- clear progress,
- varied task formats,
- frequent completion moments,
- novelty,
- interactive feedback,
- adaptive AI guidance.

---

# 3. MVP Goal

Build a web app where a user can:

1. Enter their OpenRouter API key in the GUI.
2. Enter any valid OpenRouter model ID in the GUI.
3. Enter a task.
4. Enter how much time they want to spend.
5. Enter what they want to accomplish.
6. Ask AI to convert the session into a sequence of short missions.
7. Complete missions one by one.
8. Tell the app when a mission is boring, difficult, or not useful.
9. Let AI adapt the remaining plan.
10. Finish the session with a simple summary.

That is the entire MVP.

---

# 4. Non-Goals

Do **not** build the following in V1:

- User accounts
- Login/signup
- Team collaboration
- Cloud database
- Social features
- Leaderboards
- Calendar integration
- Browser extension
- Mobile application
- Complex analytics
- Voice features
- AI agents running autonomously in the background
- Notifications
- Payments
- Subscription system
- Habit tracking
- Large gamification system
- Multiple AI providers
- Marketplace
- Complex project management

Keep the project small.

---

# 5. Recommended Tech Stack

Use:

- **Next.js**
- **TypeScript**
- **App Router**
- **Tailwind CSS**
- **Zod** for validating AI JSON responses

No database is required.

Use browser storage only for lightweight settings/session data.

Recommended structure:

```text
/app
  /page.tsx
  /session/page.tsx
  /api/openrouter/test/route.ts
  /api/quest/route.ts
  /api/adapt/route.ts

/components
  SettingsModal.tsx
  TaskSetupForm.tsx
  MissionCard.tsx
  ProgressBar.tsx
  SessionSummary.tsx

/lib
  openrouter.ts
  prompts.ts
  schemas.ts
  storage.ts
```

The exact structure may be adjusted if the implementation is cleaner.

---

# 6. OpenRouter Configuration

## Requirement

The OpenRouter API key and model must be configured **inside the GUI**.

Do not require the user to edit:

- `.env`
- config files
- source code
- constants

for normal use.

---

## Settings UI

Add a **Settings** button in the top-right corner.

Clicking it opens a modal.

The modal contains:

### OpenRouter API Key

Password input:

```text
sk-or-v1-...
```

Include:

- show/hide button
- clear button

### OpenRouter Model

Normal text input.

Placeholder:

```text
openai/gpt-5
```

The user must be able to paste any valid OpenRouter model ID.

Examples only for placeholder/help text:

```text
openai/...
anthropic/...
google/...
deepseek/...
```

Do not maintain a hardcoded model list.

---

## Save Behavior

Button:

**Save & Test Connection**

When clicked:

1. Validate that both fields are non-empty.
2. Call the backend test route.
3. Backend makes a very small OpenRouter request using the entered key and model.
4. Display:

```text
Connected ✓
```

or a useful error such as:

```text
Invalid API key
Model not found
OpenRouter request failed
Rate limit exceeded
```

Once connected, all future AI requests automatically use the selected model.

---

## Credential Storage

For the MVP:

### API Key

Prefer storing the API key in:

```text
sessionStorage
```

so it disappears when the browser session is closed.

Optionally add:

```text
Remember on this device
```

If enabled, storing it in `localStorage` is acceptable.

Do not store the API key on the server.

Do not log the API key.

Do not expose it in error messages.

### Model ID

The model ID may be stored in:

```text
localStorage
```

so the selected model remains available after refresh.

---

# 7. Main User Flow

## Screen 1 — Home

Hero copy:

### Make boring work feel shorter.

Subtext:

> Turn one long work session into a sequence of short AI-generated missions.

Main form:

### What do you need to do?

Textarea.

Example:

```text
Study thermodynamics chapter 4
```

### How much time do you have?

Number field or slider.

Allowed range:

```text
10–240 minutes
```

Default:

```text
60 minutes
```

### What do you want to achieve?

Textarea.

Example:

```text
Understand the chapter well enough to explain the important concepts.
```

Optional field:

### Current energy

Three choices:

- Low
- Normal
- High

Default:

```text
Normal
```

Primary button:

# Build My Session

---

# 8. Quest Generation

When the user clicks **Build My Session**:

Send the following information to the AI:

- task
- duration
- desired outcome
- energy level

The AI should return structured JSON.

Example:

```json
{
  "title": "Thermodynamics Sprint",
  "totalMinutes": 60,
  "missions": [
    {
      "id": "m1",
      "title": "Map the chapter",
      "minutes": 6,
      "instruction": "Scan the chapter headings and identify the three ideas that appear most important.",
      "type": "explore",
      "completionQuestion": "What are the three main ideas?"
    },
    {
      "id": "m2",
      "title": "Learn the first idea",
      "minutes": 9,
      "instruction": "Study the first concept and write a two-sentence explanation in your own words.",
      "type": "learn",
      "completionQuestion": "Can you explain it without looking?"
    }
  ]
}
```

---

# 9. Mission Generation Rules

The AI should create approximately:

```text
5–10 missions
```

depending on session duration.

Every mission should usually last:

```text
3–15 minutes
```

Avoid making every mission identical.

Use variety when appropriate:

- read
- observe
- explain
- solve
- recall
- create
- compare
- test yourself
- summarize
- organize
- make a decision
- execute a concrete action

The generated mission times should approximately add up to the selected session duration.

Do not create fake productivity.

Each mission must move the user toward the requested outcome.

Avoid excessive motivational text.

Mission instructions should be short and immediately actionable.

---

# 10. Session Screen

After generation, navigate to the session view.

Show:

### Top section

- Session title
- Overall progress bar
- Mission number

Example:

```text
Mission 3 of 7
```

Do **not** make a large countdown timer the center of the experience.

The product is specifically trying to reduce constant time-monitoring.

The current mission duration can be displayed subtly.

Example:

```text
~8 min
```

---

## Mission Card

Display:

### Mission title

Example:

```text
Explain it without looking
```

### Instruction

Example:

```text
Close the chapter and explain the first law in your own words.
Keep it under four sentences.
```

### Estimated time

Example:

```text
~6 min
```

### Optional completion question

Example:

```text
Could you explain it without checking the book?
```

---

# 11. Mission Controls

Each mission should include these buttons:

### Done

Marks the current mission complete and loads the next mission.

### Too Hard

AI adapts the current or next mission into a smaller/easier step.

### I'm Bored

AI changes the style of the next mission.

Examples:

- convert reading into a challenge
- convert writing into a quick explanation
- convert passive review into self-testing

### Not Useful

AI replaces the current mission with something more directly related to the goal.

### Skip

Skip without AI adaptation.

---

# 12. Adaptive AI Behavior

When the user clicks:

- Too Hard
- I'm Bored
- Not Useful

send a request to:

```text
/api/adapt
```

Input should contain:

```json
{
  "originalGoal": "...",
  "desiredOutcome": "...",
  "remainingMinutes": 35,
  "completedMissions": [],
  "currentMission": {},
  "feedback": "bored"
}
```

The AI should return either:

- one replacement mission, or
- a revised list of remaining missions.

For simplicity, revising the current + remaining missions is acceptable.

Important:

Do not regenerate already completed missions.

---

# 13. Session Completion

After the final mission, show:

# Session Complete

Display:

- completed missions
- skipped missions
- approximate focused minutes
- original goal
- simple reflection

Ask:

### Did this session feel faster than normal?

Buttons:

- Yes
- About the same
- Slower

Optional:

### How engaged were you?

1–5 rating.

These values may be stored locally.

No account/database is required.

---

# 14. Lightweight Local History

Store the latest sessions locally.

Maximum:

```text
10 sessions
```

Home page can contain:

### Recent Sessions

Each card shows:

- title
- date
- duration
- completion percentage

Button:

```text
Repeat
```

Repeating a session pre-fills the setup form.

Do not build a complex analytics dashboard.

---

# 15. OpenRouter Integration

Create a shared helper.

Conceptual interface:

```ts
callOpenRouter({
  apiKey,
  model,
  messages,
  responseFormat
})
```

OpenRouter requests must be made from Next.js server routes rather than calling the provider directly from React components.

The frontend sends the key and model to the server route only for the current request.

The server route forwards the request to OpenRouter.

The server must never persist the key.

---

# 16. AI Output Reliability

AI responses used to generate missions must be structured.

Use Zod schemas.

Example mission schema:

```ts
const MissionSchema = z.object({
  id: z.string(),
  title: z.string(),
  minutes: z.number().min(1),
  instruction: z.string(),
  type: z.string(),
  completionQuestion: z.string().optional()
});
```

Quest schema:

```ts
const QuestSchema = z.object({
  title: z.string(),
  totalMinutes: z.number(),
  missions: z.array(MissionSchema).min(1)
});
```

If parsing fails:

1. Retry once with a correction prompt.
2. If it still fails, show a useful GUI error.

Do not crash the application.

---

# 17. AI System Prompt — Quest Generation

Use a prompt similar to:

```text
You are an AI session designer.

Your job is to transform one long work session into a sequence of short,
engaging and useful missions.

The missions must help the user accomplish their real goal.

Do not add meaningless gamification.
Do not waste time with motivational filler.

Use variety:
- learning
- recall
- solving
- explaining
- creating
- executing
- checking progress

Prefer short, concrete actions.

The user should focus on the current mission instead of constantly thinking
about how much time remains.

Return ONLY valid JSON matching the required schema.
```

Then provide:

- task
- duration
- desired outcome
- energy level

---

# 18. AI System Prompt — Adaptation

Use a prompt similar to:

```text
You are adapting an active work session.

The user has given feedback about the current mission.

Preserve completed work.

Modify only the current and remaining missions.

If the user says:
- "too_hard": make the next step smaller and clearer
- "bored": introduce a different interaction style or challenge
- "not_useful": make the work more directly connected to the desired outcome

Do not add motivational filler.
Do not increase the remaining session length.
Return only valid JSON.
```

---

# 19. UI / Visual Style

The app should feel:

- clean
- modern
- calm
- lightweight
- slightly playful

Avoid the look of:

- enterprise project-management software
- complex dashboards
- childish games

Suggested layout:

```text
------------------------------------------------
Flow Companion                         Settings
------------------------------------------------

Make boring work feel shorter.

What do you need to do?
[                                        ]

How much time?
[ 60 minutes ]

What do you want to achieve?
[                                        ]

Energy
[ Low ] [ Normal ] [ High ]

        [ Build My Session ]

Recent Sessions
------------------------------------------------
```

Session view:

```text
Thermodynamics Sprint

████████░░░░░░░░  3 / 7

MISSION 3

Explain it without looking

Close the chapter and explain the first law
in your own words.

~6 min

[ Done ]

[ Too Hard ] [ I'm Bored ]
[ Not Useful ] [ Skip ]
```

---

# 20. Loading Experience

Quest generation may take several seconds.

Do not show only a spinner.

Show changing loading text such as:

```text
Breaking the goal into smaller wins...
Adding variety...
Balancing the session...
Building your missions...
```

Do not fake exact progress percentages.

---

# 21. Error States

Handle:

### Missing API configuration

```text
Connect OpenRouter in Settings before creating a session.
```

### Invalid API key

```text
OpenRouter rejected this API key.
```

### Invalid model

```text
The selected OpenRouter model could not be used.
Check the model ID in Settings.
```

### Rate limit

```text
The model is currently rate limited.
Try again or choose another model.
```

### Network failure

Provide:

```text
Retry
```

### Invalid AI JSON

Retry once automatically.

If retry fails:

```text
The model returned an unexpected response.
Try again or use another model.
```

---

# 22. Privacy

Add a small note inside Settings:

> Your API key is used only to send requests to OpenRouter. It is not stored on the application server.

Do not log:

- API keys
- full authorization headers

For local development, avoid console logging secrets.

---

# 23. Accessibility

Basic requirements:

- keyboard-accessible controls
- visible focus states
- semantic buttons
- good text contrast
- labels for inputs
- mobile-friendly layout

---

# 24. Responsive Design

The app must work well on:

- desktop
- laptop
- tablet
- mobile browser

Use a centered content width around:

```text
700–900px
```

No side navigation is needed.

---

# 25. Acceptance Criteria

The project is complete when:

1. The project starts successfully with normal Next.js commands.
2. The home page loads without configuration files containing an API key.
3. The user can open Settings.
4. The user can enter an OpenRouter API key.
5. The user can enter any OpenRouter model ID.
6. The app can test the connection.
7. The selected model is automatically used for future requests.
8. The user can enter a task, duration, outcome, and energy.
9. AI generates a valid mission sequence.
10. Missions appear one at a time.
11. The user can complete and skip missions.
12. Too Hard adapts the remaining session.
13. I'm Bored adapts the remaining session.
14. Not Useful adapts the remaining session.
15. Completed missions are preserved after adaptation.
16. The session ends with a completion screen.
17. Basic session history is stored locally.
18. API/network/model errors are shown cleanly.
19. The API key is never hardcoded.
20. The app works on mobile and desktop.

---

# 26. Suggested Development Priority

Build in this order:

```text
1. App shell and home form
2. Settings modal
3. OpenRouter connection test
4. Quest generation API
5. Zod response validation
6. Session interface
7. Done / Skip flow
8. Adaptive feedback actions
9. Completion screen
10. Local session history
11. Error handling
12. Responsive polish
```

---

# 27. Do Not Overengineer

This is intentionally a small MVP.

Prefer:

- simple code
- clear components
- straightforward state
- browser storage
- a few API routes

Avoid introducing:

- Redux unless genuinely necessary
- database infrastructure
- authentication frameworks
- queues
- microservices
- vector databases
- agent frameworks
- LangChain unless there is a compelling implementation need

A normal LLM request is enough.

---

# 28. Definition of the Product in One Sentence

> **AI Flow Companion converts one long, boring work block into a sequence of short, adaptive AI missions so the user focuses on progress instead of watching the clock.**

---

# 29. Instruction to the AI Coding Agent

Build the complete working MVP described in this PRD.

Important implementation constraints:

- Use Next.js + TypeScript + Tailwind.
- Keep the project simple.
- Do not ask me to manually add the OpenRouter API key to `.env`.
- OpenRouter API key must be entered from the GUI.
- OpenRouter model ID must be entered from the GUI.
- Any valid model ID should work without modifying source code.
- The backend should receive the key only when making the requested OpenRouter call.
- Do not persist API keys server-side.
- Use structured JSON output and validate it with Zod.
- Retry malformed AI output once.
- Include good loading/error states.
- Make the app responsive.
- Do not add features outside the PRD unless they are required for the app to function.

When implementation is complete:

1. Run the app.
2. Fix TypeScript/build errors.
3. Test the primary user flow.
4. Test invalid API-key handling.
5. Test invalid-model handling.
6. Ensure no secrets are hardcoded.
7. Provide a short README with exact commands to run the project.

Do not stop after scaffolding. Deliver the working MVP.
