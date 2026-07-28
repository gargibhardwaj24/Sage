<div align="center">
  <img width="1527" height="427" alt="image" src="https://github.com/user-attachments/assets/57f778ac-ec34-4a6a-87e7-f431ebcd1219" />

  <h1>🌿 Sage</h1>
  <p><strong>Become the version of yourself you're working towards.</strong></p>

  <p>
    An intelligent, local-first calendar that organizes your life using <b>proven productivity methods</b>, augmented by a robust AI assistant.
  </p>
  
</div>

---

## 🎯 The Core Experience: Methods

At the heart of Sage isn't just an AI—it's a structured approach to your time. Sage features six powerful productivity frameworks, each acting as both an explainer and a **generator**. 

Your active **Method** dictates how your calendar is shaped and how the assistant plans for you.

- **Intelligent Generation (`buildWeek`)**: Sage produces a real weekly template based on your selected framework that you can preview and apply instantly.
- **Data-Driven Recommendations**: Frameworks are recommended for you by scoring against your actual weak signals (completion rate, focus deficit, meeting load, consistency). Each recommendation card explains *why* it surfaced.
- **Method-Aware Assistant**: The active method changes the assistant's behavior. If you use Pomodoro, it proposes 25-minute blocks. If you use Deep Work, it proposes 120-minute blocks in the morning.
- **Library of Frameworks**: Browse all frameworks, filter by difficulty, read key benefits, and learn how to implement them via the detailed dialog.

---

## 🤖 The Assistant: Execution

While Methods drive the strategy, the Assistant handles the tactics. Ask *"am I free tonight at 8?"* or say *"move my DSA session from 5 PM to 8 PM"* and it reads your real schedule, checks for conflicts, proposes a concrete change, and waits for you to confirm it.

Two engines power one interface. **Gemini** handles language; a local **offline engine** steps in when there is no key. Both produce the same reply shape and go through the same grounding layer.

```text
utterance
   │
   ├── Gemini (remote.js) ─────────────────────────────┐
   │     system prompt + compact schedule snapshot     │
   │     9 tools, tool-call loop (max 4 rounds)        │
   │       read tools  → executed locally, fed back    │
   │       write tools → become proposals, loop stops  │
   │                                                   │
   └── Offline engine (engine.js) ─────────────────────┤
         intents.js   weighted-pattern classifier      │
         datetime.js  days, times, ranges, durations   │
         match.js     "my DSA session" → the event     │
                                                       ▼
                              schedule.js   conflicts, free slots, alternatives
                              analytics.js  score, streaks, peak focus hours
                              methods.js    the active productivity method
                                                       │
                                                       ▼
                              reply { text, blocks[], actions[] }
                                                       │
   └─ actions are *proposals*. applyAction() runs only on a click.
```

**Nothing the model says is trusted about your calendar.** Read tools execute against the real store. Write tools never execute directly—they build a proposal, which is re-checked locally for conflicts before rendering as a button.

### What it handles

| You say | What happens |
|---|---|
| *"Plan my week with time blocking"* | Generates the full template, previews it, then applies on confirm |
| *"When can I fit 90 minutes of deep work?"* | Scans free slots across the week, weighted by your historical peak focus hour |
| *"Move my DSA session from 5 PM to 8 PM"* | Reads `from X to Y` as **identify → destination**. Preserves duration, detects clashes, ranks alternatives |
| *"How can I improve my schedule?"* | Finds overlaps, focus deficits, missing recovery, meeting load—each with a one-click fix |
| *"Am I free tonight at 8?"* | Resolves "tonight" → 8 PM today, checks the window, answers yes/no |
| *"How do I stop procrastinating?"* | Curates knowledge from the active productivity method |

---

## ✅ Core Requirements Met

Sage comprehensively fulfills all core functional requirements:

- **Event Management**: Easily create, edit, and delete events across the calendar.
- **Interactivity**: Holidays and active events are highlighted with clear visual markers to distinguish them at a glance.
- **Validation**: Automatically detects overlapping events and provides inline conflict warnings.
- **Search & Filter**: Robust search functionality and category-based filtering to quickly find what you need.
- **Persistence**: All user data and preferences are securely persisted in Local Storage.
- **Responsive Design**: Flawlessly adapts to any screen size—working perfectly on both mobile and desktop devices.
- **State Management**: Handles loading states elegantly, showing placeholders while searching and displaying appropriate error messages when needed.

---

## 🖥️ The Rest of the App

### 📊 Dashboard
- **Sage Insight** — an unprompted read on your week, ranked by weight. Every insight shows evidence and hands the matching question to the chat.
- **Live session bar** — counts down the block you're in right now, ticking every second.
- **Action items** — everything still owed, overdue first, with today's progress.
- **Recent activity** — completions, AI additions and applied templates, derived from the events themselves.
- **Unclaimed time** — what's left of the day that nothing owns, one tap to claim it.

### 📅 Calendar
Day / week / month views, drag-and-drop rescheduling (30-minute snapping, cross-day drops), column layout for overlapping events, a live "now" rule with a time badge, category tags, filters, inline conflict warnings, and click-empty-space-to-create.

### 📈 Analytics
Four stat tiles with deltas and inline visuals, an explainable productivity score, **flow-state velocity**, an **energy heatmap**, category donuts, **recent sessions**, a focus histogram, and **CSV export**.

---

## 🎨 Design System: "Momentum"

High-precision minimalism: flat surfaces, tonal layering instead of colour washes, and **Geist** throughout. **The dark theme is the source of truth**; light is its tonal counterpart.

| token | light | dark |
|---|---|---|
| canvas | `#f7f8f9` | `#12131a` |
| card | `#ffffff` | `#1e1f26` |
| ink | `#16171c` | `#e3e1ec` |
| accent (mint) | `#00875c` | `#4edea3` |
| primary (inverted ink) | `#16171c` | `#ffffff` |

### Colour is computed, not eyeballed
Every value came out of a CVD (Color Vision Deficiency) + contrast validator.
Green is deliberately absent from the categorical palette. Mint is the brand accent, and every text pair clears WCAG AA in both modes.

---

## 🚀 Getting Started

Built with **React 18 + Vite + Tailwind CSS**. No backend — everything runs locally and persists to `localStorage`.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle
npm test         # NLU + assistant engine test harnesses
```

### Connecting Gemini

The assistant runs on **Gemini** when a key is present and falls back to a built-in offline engine when it isn't. Either add a key to `.env`:

```bash
cp .env.example .env
# VITE_GEMINI_API_KEY=your_key_here
```


---

## 🏗️ Structure

```text
src/
├── components/
│   ├── ui/            Button, Card, Modal, Field, Segmented, ProgressRing…
│   ├── layout/        AppShell, Sidebar, Topbar, toasts, settings
│   ├── calendar/      Day/Week/Month views, TimeGrid, EventBlock
│   ├── dashboard/     Hero, TodayOverview, QuickAdd, WeekAhead
│   ├── assistant/     ChatMessage, MessageBlocks, RichText, Composer
│   ├── methods/       MethodCard
│   └── analytics/     Charts, tooltip, chart theme
├── pages/             One per route
├── store/             Theme, Settings, Events (reducer + undo), Toast, Dialog
├── lib/
│   ├── ai/            datetime · intents · match · knowledge · engine
│   ├── schedule.js    conflicts, free slots, alternatives, day layout
│   ├── analytics.js   score, trend, streaks, focus histogram
│   ├── insights.js    insight ranking, method recommendation
│   └── export.js      CSV report generation
```

> **Note:** Seeded with ~12 weeks of realistic history. Reset it any time from **Preferences → Reset demo data**. Routes are code-split. Respects `prefers-reduced-motion` and `prefers-color-scheme`. Responsive down to 375px.
