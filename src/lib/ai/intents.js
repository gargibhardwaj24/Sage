import { normalize } from './datetime'

export const INTENTS = {
  MOVE: 'move',
  CREATE: 'create',
  DELETE: 'delete',
  COMPLETE: 'complete',
  AVAILABILITY: 'availability',
  AGENDA: 'agenda',
  FIND_SLOT: 'find_slot',
  STATS: 'stats',
  SUGGEST: 'suggest',
  APPLY_METHOD: 'apply_method',
  EXPLAIN_METHOD: 'explain_method',
  ADVICE: 'advice',
  GREETING: 'greeting',
  HELP: 'help',
  UNKNOWN: 'unknown',
}

const RULES = {
  [INTENTS.MOVE]: [
    [/\b(move|reschedul\w*|shift|push|pull|bump)\b/, 5],
    [/\bchange\b.*\b(to|time)\b/, 3],
    [/\bswap\b/, 2.5],
    [/\bfrom\b.*\bto\b/, 1.5],
    [/\b(earlier|later)\b/, 1.5],
  ],
  [INTENTS.CREATE]: [
    [/\b(add|schedule|book|create|set up|setup|put|pencil|slot in|block off|block out)\b/, 5],
    [/\bblock\b\s+\d/, 3],
    [/\bnew (event|meeting|session|block)\b/, 4],
    [/\bremind me to\b/, 4],
    [/\bi (need|want) to\b/, 1.5],
  ],
  [INTENTS.DELETE]: [
    [/\b(cancel|delete|remove|drop|scrap|call off)\b/, 5],
    [/\bclear (my )?(schedule|calendar|day|afternoon|morning|evening)\b/, 5],
    [/\bget rid of\b/, 4],
  ],
  [INTENTS.COMPLETE]: [
    [/\bmark\b.*\b(done|complete|finished)\b/, 6],
    [/\b(i )?(finished|completed|did)\b/, 3.5],
    [/\btick off\b/, 4],
  ],
  [INTENTS.AVAILABILITY]: [
    [/\b(am i|are we|is there anything)\b.*\b(free|busy|available|open)\b/, 6],
    [/\b(do i have|have i got|anything)\b.*\b(on|planned|scheduled|going on)\b/, 4],
    [/\bfree\b.*\b(at|on|tonight|tomorrow|today|this)\b/, 3.5],
    [/\bcan i\b.*\b(fit|make it|do)\b/, 3],
    [/\bis .* (free|open|clear)\b/, 3],
  ],
  [INTENTS.AGENDA]: [
    [/\bwhat('?s| is| does| do)\b.*\b(day|week|schedule|calendar|plan|agenda|look like|on)\b/, 5],
    [/\b(show|list|tell me)\b.*\b(schedule|calendar|events|agenda|day|week|plan)\b/, 5],
    [/\bwhat('?s| is) (on|next|coming up)\b/, 4.5],
    [/\bmy (day|week|schedule|agenda|calendar)\b/, 2.5],
    [/\bhow (busy|packed|full)\b/, 3],
  ],
  [INTENTS.FIND_SLOT]: [
    [/\b(when|where) can i\b/, 5],
    [/\bfind (me )?(a |some )?(time|slot|space|gap|window)\b/, 6],
    [/\b(free|open|available) (slots?|time|windows?|gaps?)\b/, 5],
    [/\bfit (in )?\b/, 3],
    [/\bbest time (to|for)\b/, 4],
    [/\bsqueeze in\b/, 4],
  ],
  [INTENTS.STATS]: [
    [/\b(productivity )?score\b/, 5],
    [/\b(how (productive|well|good))\b/, 5],
    [/\bstreak\b/, 5],
    [/\b(stats|statistics|analytics|numbers|metrics)\b/, 5],
    [/\bhow (did|am) i (do|doing)\b/, 5],
    [/\b(completed|finished) (this|last) week\b/, 3],
  ],
  [INTENTS.SUGGEST]: [
    [/\b(improve|optimi[sz]e|better|fix|tighten|clean up|rebalance)\b.*\b(week|schedule|day|calendar|routine)\b/, 6],
    [/\b(any )?(suggestions?|advice|ideas|tips)\b.*\b(schedule|week|calendar|day)\b/, 5],
    [/\bwhat should i (do|change|focus on)\b/, 4],
    [/\bmake my (week|day|schedule) better\b/, 6],
    [/\breview my (week|schedule|calendar)\b/, 5],
  ],
  [INTENTS.APPLY_METHOD]: [
    [/\b(apply|use|set up|switch to|start using|try)\b.*\b(time.?block\w*|time.?box\w*|pomodoro|deep work|eisenhower|eat the frog|method|template)\b/, 6],
    [/\bplan my week (with|using)\b/, 6],
    [/\b(time.?block|time.?box|pomodoro|eisenhower|eat the frog)\b.*\b(my week|template|plan)\b/, 5],
  ],
  [INTENTS.EXPLAIN_METHOD]: [
    [/\b(what|explain|tell me about|how does)\b.*\b(time.?block\w*|time.?box\w*|pomodoro|deep work|eisenhower|eat the frog)\b/, 6],
    [/\bwhich method\b/, 5],
    [/\b(difference between)\b/, 3],
  ],
  [INTENTS.ADVICE]: [
    [/\bhow (do|can) i\b.*\b(focus|concentrate|procrastinat\w*|distract\w*|burn ?out|motivat\w*|habit|discipline|consistent|energy|prioriti[sz]e)\b/, 6],
    [/\b(procrastinat\w*|burn ?out|distract\w*|motivation|willpower|multitask\w*)\b/, 4],
    [/\bwhy (do|am) i\b/, 2.5],
    [/\bhow many hours\b/, 2],
  ],
  [INTENTS.GREETING]: [
    [/^(hi|hey|hello|yo|hiya|howdy|sup|good (morning|afternoon|evening))\b/, 6],
    [/^(thanks|thank you|ty|cheers|nice|cool|great|awesome|perfect)\b/, 5],
  ],
  [INTENTS.HELP]: [
    [/\b(help|what can you do|capabilities|commands|how do you work|who are you|what are you)\b/, 5],
  ],
}

export function classify(input) {
  const text = normalize(input)
  const scores = {}

  for (const [intent, rules] of Object.entries(RULES)) {
    let score = 0
    for (const [re, weight] of rules) if (re.test(text)) score += weight
    if (score > 0) scores[intent] = score
  }

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1])
  if (!ranked.length) return { intent: INTENTS.UNKNOWN, confidence: 0, scores, text }

  const [intent, score] = ranked[0]
  const runnerUp = ranked[1]?.[1] ?? 0
  const confidence = Math.min(1, (score / 8) * (1 - Math.min(0.4, runnerUp / (score * 2.5))))

  return { intent, score, confidence, scores, text }
}

export function detectMethod(input) {
  const text = normalize(input)
  if (/\btime.?box\w*\b/.test(text)) return 'time-boxing'
  if (/\btime.?block\w*\b/.test(text)) return 'time-blocking'
  if (/\bpomodoro\b|\b25.?(min|minute)\b/.test(text)) return 'pomodoro'
  if (/\beisenhower\b|\bmatrix\b|\bquadrant\b|\burgent.*important\b/.test(text)) return 'eisenhower'
  if (/\beat the frog\b|\bfrog\b/.test(text)) return 'eat-the-frog'
  if (/\bdeep work\b/.test(text)) return 'deep-work'
  return null
}

export function detectCategory(input) {
  const text = normalize(input)
  if (/\b(gym|run|running|workout|training|yoga|walk|swim|exercise|lift)\b/.test(text)) return 'fitness'
  if (/\b(meeting|call|standup|stand-up|sync|1:1|one on one|interview|review with|catch up)\b/.test(text)) return 'meeting'
  if (/\b(study|studying|revision|revise|learn|course|reading|read|dsa|leetcode|practice|lecture|tutorial)\b/.test(text)) return 'learning'
  if (/\b(email|inbox|admin|errand|chores|paperwork|invoice|expenses|laundry)\b/.test(text)) return 'admin'
  if (/\b(lunch|dinner|breakfast|family|friends|rest|break|nap|movie|date|coffee|birthday)\b/.test(text)) return 'personal'
  if (/\b(deep work|focus|writing|write|build|code|coding|design|project)\b/.test(text)) return 'deep-work'
  return null
}

export function extractTitle(input) {
  let text = String(input).trim().replace(/[?!.]+$/, '')

  text = text.replace(
    /^\s*(?:can you |could you |please |hey |sage,?\s*)*(?:add|schedule|book|create|set up|setup|put|block off|block out|block|pencil in|slot in|plan|remind me to)\s+/i,
    ''
  )
  text = text.replace(/^\s*(?:a|an|the|my|some)\s+/i, '')

  const cut = text.search(
    /\b(at|on|from|for|tomorrow|today|tonight|this|next|in|every|monday|tuesday|wednesday|thursday|friday|saturday|sunday|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i
  )
  if (cut > 0) text = text.slice(0, cut)

  text = text.replace(/\b(session|block|event|slot)\s*$/i, '').trim()
  text = text.replace(/[,\-–]\s*$/, '').trim()

  if (!text || text.length < 2) return null
  return text.charAt(0).toUpperCase() + text.slice(1)
}
