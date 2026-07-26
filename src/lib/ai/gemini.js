import { functionsUrl, isSupabaseConfigured, supabase } from '@/lib/supabase'
import { assistantMessage, logDev } from '@/lib/errors'

const DIRECT_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions'

export const DEFAULT_MODEL = 'gemini-3.6-flash'

let proxyReachable = null

export class GeminiError extends Error {
  constructor(kind, detail) {
    super(assistantMessage(kind))
    this.name = 'GeminiError'
    this.kind = kind
    this.detail = detail
    logDev('assistant', detail ?? kind)
  }
}

export function resolveApiKey(settings) {
  const fromSettings = settings?.geminiApiKey?.trim()
  if (fromSettings) return fromSettings
  const fromEnv = import.meta.env?.VITE_GEMINI_API_KEY
  return typeof fromEnv === 'string' && fromEnv.trim() ? fromEnv.trim() : ''
}

export const usesProxy = () => isSupabaseConfigured && proxyReachable !== false

export function hasCredentials(settings) {
  return isSupabaseConfigured || Boolean(resolveApiKey(settings))
}

function describe(status, body, transport) {
  const detail = `${transport} ${status}: ${body?.error?.message ?? 'no detail'}`

  if (status === 401 || status === 403) return new GeminiError('auth', detail)
  if (status === 404) {
    return new GeminiError(transport === 'proxy' ? 'missing-proxy' : 'model', detail)
  }
  if (status === 429) return new GeminiError('rate', detail)
  if (status >= 500) return new GeminiError('server', detail)
  if (status === 400 && /api key not valid/i.test(body?.error?.message ?? '')) {
    return new GeminiError('auth', detail)
  }
  return new GeminiError('request', detail)
}

async function send(url, headers, payload, signal, transport) {
  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      signal,
      body: JSON.stringify(payload),
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new GeminiError('network', `${transport} fetch failed: ${error.message}`)
  }

  if (!response.ok) {
    let parsed = null
    try {
      parsed = await response.json()
    } catch {
      parsed = null
    }
    throw describe(response.status, parsed, transport)
  }

  return response.json()
}

async function callProxy(payload, signal) {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) {
    throw new GeminiError('auth', 'no supabase access token')
  }

  return send(
    functionsUrl('gemini'),
    {
      Authorization: `Bearer ${token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    payload,
    signal,
    'proxy'
  )
}

const callDirect = (payload, apiKey, signal) =>
  send(
    DIRECT_ENDPOINT,
    { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
    payload,
    signal,
    'direct'
  )

export async function createInteraction({
  settings,
  model = DEFAULT_MODEL,
  systemInstruction,
  input,
  tools,
  signal,
}) {
  const payload = {
    model,
    store: false,
    system_instruction: systemInstruction,
    input,
    tools,
    generation_config: { tool_choice: 'auto' },
  }

  const directKey = resolveApiKey(settings)

  if (usesProxy()) {
    try {
      const interaction = await callProxy(payload, signal)
      proxyReachable = true
      return interaction
    } catch (error) {
      const missing = error.kind === 'network' || error.kind === 'missing-proxy'
      if (!missing) throw error

      proxyReachable = false
      if (!directKey) {
        throw new GeminiError('missing-proxy', 'edge function unreachable and no direct key')
      }
    }
  }

  if (!directKey) throw new GeminiError('config', 'no gemini credentials available')
  return callDirect(payload, directKey, signal)
}

export function extractSteps(interaction) {
  const steps = Array.isArray(interaction?.steps) ? interaction.steps : []
  const calls = []
  const texts = []

  for (const step of steps) {
    if (step?.type === 'function_call') {
      let args = step.arguments
      if (typeof args === 'string') {
        try {
          args = JSON.parse(args)
        } catch {
          args = {}
        }
      }
      calls.push({ id: step.id, name: step.name, args: args ?? {} })
      continue
    }

    const content = Array.isArray(step?.content) ? step.content : []
    for (const part of content) {
      if (part?.type === 'text' && part.text) texts.push(part.text)
    }
    if (typeof step?.text === 'string' && step.text) texts.push(step.text)
  }

  const fallback = typeof interaction?.output_text === 'string' ? interaction.output_text : ''
  const text = texts.join('\n').trim() || fallback.trim()

  return { steps, calls, text }
}
