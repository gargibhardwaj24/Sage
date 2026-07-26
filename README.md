# Sage — an AI-powered interactive calendar

> Become the version of yourself you're working towards.

Sage is a calendar you talk to. Ask *"am I free tonight at 8?"* or say *"move my DSA
session from 5 PM to 8 PM"* and it reads your real schedule, checks for conflicts,
proposes a concrete change, and waits for you to confirm it.

Built with **React 18 + Vite + Tailwind CSS** on the *Momentum* design system. No
backend — everything runs locally and persists to `localStorage`.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle
npm test         # NLU + assistant engine test harnesses
```

### Connecting Gemini

The assistant runs on **Gemini** when a key is present and falls back to a built-in
offline engine when it isn't. Either add a key to `.env`:

```bash
cp .env.example .env
# VITE_GEMINI_API_KEY=your_key_here
```

…or paste one into **Preferences → Gemini assistant**, which stores it in this
browser only and overrides `.env`. Get a key from
[Google AI Studio](https://aistudio.google.com/apikey).

> **Before deploying publicly:** this is a client-side app, so any key it holds —
> whether from `.env` or from Preferences — is visible to anyone using the page.
> `.env` is gitignored, but a `VITE_` variable is *baked into the built bundle*.
> For a public deployment, put a small server proxy in front of the API and point
> `ENDPOINT` in `src/lib/ai/gemini.js` at it; that is the only line that changes.

---

## The differentiator: the assistant

Two engines behind one interface. **Gemini** handles language; a local **offline
engine** handles it when there is no key. Both produce the same reply shape and
both go through the same grounding layer, so the app behaves identically either way.

```
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

**Nothing the model says is trusted about your calendar.** Read tools
(`check_availability`, `find_free_slots`, `get_schedule`, `get_productivity_stats`)
execute against the real store and feed real results back. Write tools never
execute — they build a proposal, which is re-checked locally for conflicts before
it is rendered. If the model claims a slot is free and it isn't, the local check
wins and the reply leads with the clash plus ranked alternatives.

**Neither engine mutates the calendar.** Both return proposed actions that the UI
renders as buttons. Nothing changes until you press one, and every applied change
raises a toast with undo. That separation is what makes an assistant with write
access safe to ship.

### What it handles

| You say | What happens |
|---|---|
| *"Am I free tonight at 8?"* | Resolves "tonight" → 8 PM today, checks the window, answers yes/no — and flips the polarity for *"am I **busy**…"* |
| *"Move my DSA session from 5 PM to 8 PM"* | Reads `from X to Y` as **identify → destination**, not as a range. Preserves duration, detects the clash, ranks alternatives |
| *"Push the standup an hour later"* | Relative shifts, no absolute time needed |
| *"Add gym Monday at 7am for 45 minutes"* | Extracts title, infers the category from wording, places and conflict-checks it |
| *"When can I fit 90 minutes of deep work?"* | Scans free slots across the week, weighted by your historical peak focus hour |
| *"How can I improve my schedule?"* | Finds overlaps, focus deficits, missing recovery, meeting load, late-night blocks — each with a one-click fix |
| *"Plan my week with time blocking"* | Generates the full template, previews it, then applies on confirm |
| *"How do I stop procrastinating?"* | Curated productivity knowledge base |

### Details that matter

- **Ambiguity is surfaced, not guessed.** When two events match closely, the reply
  offers *"Actually, I meant …"* instead of silently picking one.
- **The working window stretches for explicit requests.** Ask for 10 PM and Sage
  won't counter-offer 3 PM just because your day "ends" at 22:00.
- **Suggestions respect your active method.** Pomodoro proposes 25-minute blocks;
  Deep Work proposes 120-minute ones, in the morning.
- **Confidence-aware fallback.** Low-confidence utterances degrade to "here's the
  closest match, what do you want to do with it?" rather than a wrong action.

Both layers have runnable harnesses: `npm run test:nlp` covers ~20 date/time
phrasings, `npm run test:ai` drives 18 utterances end-to-end and asserts that
applied actions actually mutate state.

---

## The rest of the app

**Dashboard**
- **Sage Insight** — an unprompted read on your week, ranked by weight. Every insight
  shows the evidence behind it and hands the matching question to the chat.
- **Live session bar** — counts down the block you're in right now (or the wait until
  the next), ticking every second.
- **Action items** — everything still owed, overdue first, with today's progress.
- **Recent activity** — completions, AI additions and applied templates, derived from
  the events themselves rather than a separate log.
- **Unclaimed time** — what's left of the day that nothing owns, one tap to claim it.
- Hero with the score ring, **Plan my week**, quick-add, and a week-load strip.

**Calendar** — day / week / month views, drag-and-drop rescheduling (30-minute
snapping, cross-day drops), column layout for overlapping events, a live "now" rule
with a time badge, category tags inside blocks, category filters,
click-empty-space-to-create, inline conflict warnings, and a quick-action FAB pair.

**Methods** — six frameworks, each an explainer *and* a **generator**: `buildWeek()`
produces a real weekly template you can preview and apply. Sorted into
**Recommended for you** — scored against your actual weak signal (completion rate,
focus deficit, meeting load, consistency), each card showing why it surfaced — and
**All frameworks**, with search, difficulty filters, key benefits and a detail dialog.
Whichever is active changes how the assistant plans.

**Analytics** — four stat tiles with deltas and inline visuals (sparkline, progress
meter, segment meter, activity bars), an explainable score, **flow-state velocity**
(weekly score against its running average), an **energy heatmap** (day × hour),
category donut, completed hours by day, **recent sessions**, a "when you actually
focus" histogram, and **CSV export** of the selected range.

**Everywhere** — a notification bell that counts real conflicts and imminent starts,
`⌘K` command bar, conversation history in the assistant, and full light/dark parity.

---

## Design system — "Momentum"

High-precision minimalism: flat surfaces, tonal layering instead of colour washes,
and **Geist** throughout. **The dark theme is the source of truth**; light is its
tonal counterpart rather than a second design language, so the theme toggle changes
lightness, never identity.

| token | light | dark |
|---|---|---|
| canvas | `#f7f8f9` | `#12131a` |
| card | `#ffffff` | `#1e1f26` |
| ink | `#16171c` | `#e3e1ec` |
| accent (mint) | `#00875c` | `#4edea3` |
| primary (inverted ink) | `#16171c` | `#ffffff` |

**Two-tier action language.** `primary` is inverted ink — the neutral, high-contrast
main action. `accent` is mint, reserved for AI and brand moments, so "Ask Sage" reads
as a different *kind* of action from "Save". Mint also carries progress: the score
ring, meters, and the single-series charts.

**Depth is ambient.** No black drop-shadows — high-blur glows at 4–5% opacity, a 1px
hairline, and a 24px radius. Level 1 inset wells, level 2 cards, level 3 modals.

### Colour is computed, not eyeballed

Every value below came out of a CVD + contrast validator, not taste.

**Green is deliberately absent from the categorical palette.** Mint is the brand
accent, and an aqua category measured **ΔE 3.1** against it — indistinguishable. It
was cut and Fitness re-hued, which freed green entirely for the accent.

Six categorical hues, stepped for the card surfaces the marks actually render on
(`#ffffff` / `#1e1f26`). Slot order is the CVD-safety mechanism, not cosmetic:

| | light | dark |
|---|---|---|
| worst adjacent CVD ΔE | 13.0 | 13.2 |
| worst adjacent normal-vision ΔE | 19.6 | 19.3 |

Two light marks sit below 3:1 on white by design, so every chart and chip using them
also carries a text label — colour never encodes alone. The donut ships a named,
quantified legend that doubles as its table view.

Every text pair clears WCAG AA in both modes (measured against the live DOM):

| | light | dark |
|---|---|---|
| ink on canvas | 16.8 | 14.3 |
| muted on card | 6.5 | 6.1 |
| eyebrow on card | 4.9 | 5.4 |
| accent on card | 4.6 | 9.6 |
| label on accent fill | 4.6 | 7.7 |

The light mint is stepped to `#00875c` specifically so it clears 4.5:1 — the
system's `#00a572` only reached **3.17:1**, fine for marks but not for button labels.

**The productivity score is explainable by construction.** Four components with
fixed, visible weights — follow-through (0.40), focus depth (0.28), consistency
(0.20), recovery (0.12) — each surfaced in the UI. No black-box number.

---

## Structure

```
src/
├── components/
│   ├── ui/            Button, Card, Modal, Field, Segmented, ProgressRing, Badge…
│   ├── layout/        AppShell, Sidebar, Topbar, MobileNav, toasts, settings
│   ├── calendar/      Day/Week/Month views, TimeGrid, EventBlock, EventDialog
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
│   ├── insights.js    insight ranking, method recommendation, heatmap, activity
│   ├── export.js      CSV report generation
│   └── date.js        the app's single date vocabulary
├── data/              categories · methods · seed
└── hooks/             useNow, useReminders, useMediaQuery
```

State lives in four focused contexts rather than one store. Events go through a
reducer with a bounded undo stack, so *every* mutation — drag, dialog, AI action,
template apply — is undoable through the same path.

---

## Notes

- Seeded with ~12 weeks of realistic history (including off-days, so streaks mean
  something) and two weeks ahead. Reset it any time from **Preferences → Reset demo data**.
- Routes are code-split; the charting library only loads on `/analytics`.
- Respects `prefers-reduced-motion` and `prefers-color-scheme`.
- `⌘K` focuses the command bar from anywhere.
- Responsive down to 375px: the sidebar becomes a bottom bar and the calendar opens
  on the day view.
