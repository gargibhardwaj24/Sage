import { uid } from '@/lib/id'
import { buildSystemInstruction } from './context'
import {
  createInteraction,
  extractSteps,
  hasCredentials,
  GeminiError,
  DEFAULT_MODEL,
} from './gemini'
import { buildProposal, runReadTool, READ_TOOLS, getToolDeclarations } from './tools'

const MAX_ROUNDS = 4
const MAX_HISTORY_TURNS = 6

const userStep = (text) => ({ type: 'user_input', content: [{ type: 'text', text }] })

const resultStep = (call, payload) => ({
  type: 'function_result',
  name: call.name,
  call_id: call.id,
  result: [{ type: 'text', text: JSON.stringify(payload) }],
})

export function isRemoteConfigured(settings) {
  return Boolean(settings?.aiEnabled && hasCredentials(settings))
}

function buildHistory(messages) {
  const input = []
  const recent = messages.slice(-MAX_HISTORY_TURNS * 2)

  for (const message of recent) {
    if (message.role === 'user') {
      input.push(userStep(message.text))
      continue
    }
    if (Array.isArray(message.rawSteps) && message.rawSteps.length) {
      input.push(...message.rawSteps)
      continue
    }
    if (message.text) {
      input.push(userStep(`[your previous reply] ${message.text}`))
    }
  }

  return input
}

export async function respondRemote(text, ctx, messages = [], options = {}) {
  const { settings } = ctx
  if (!hasCredentials(settings)) throw new GeminiError('config', 'no credentials')

  const systemInstruction = buildSystemInstruction(ctx.events, settings, ctx.now)
  const input = [...buildHistory(messages), userStep(text)]

  const blocks = []
  const actions = []
  const warnings = []
  const toolTrace = []
  let replyText = ''
  let rawSteps = []

  for (let round = 0; round < MAX_ROUNDS; round += 1) {
    const interaction = await createInteraction({
      settings,
      model: settings.geminiModel || DEFAULT_MODEL,
      systemInstruction,
      input,
      tools: getToolDeclarations(),
      signal: options.signal,
    })

    const { steps, calls, text: stepText } = extractSteps(interaction)
    rawSteps = steps
    if (stepText) replyText = stepText

    if (!calls.length) break

    const writes = calls.filter((c) => !READ_TOOLS.has(c.name))
    const reads = calls.filter((c) => READ_TOOLS.has(c.name))

    if (writes.length) {
      for (const call of writes) {
        toolTrace.push(call.name)
        const proposal = buildProposal(call.name, call.args, ctx)
        if (!proposal) {
          warnings.push(`I could not build that change — the event may no longer exist.`)
          continue
        }
        blocks.push(...proposal.blocks)
        actions.push(...proposal.actions)
        warnings.push(...proposal.warnings)
      }
      break
    }

    input.push(...steps)
    for (const call of reads) {
      toolTrace.push(call.name)
      let payload
      try {
        payload = runReadTool(call.name, call.args, ctx)
      } catch (error) {
        payload = { error: 'That lookup failed. Try a different range.' }
      }
      input.push(resultStep(call, payload))
    }
  }

  const body = [...warnings, replyText].filter(Boolean).join('\n\n')

  return {
    id: uid('msg'),
    role: 'assistant',
    text: body || 'I could not work out a reply for that. Try rephrasing it?',
    blocks,
    actions,
    followUps: [],
    createdAt: new Date().toISOString(),
    source: 'gemini',
    toolTrace,
    rawSteps,
  }
}
