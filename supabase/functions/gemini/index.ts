const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions'

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function matchOrigin(origin: string | null) {
  if (!origin) return null

  for (const pattern of ALLOWED_ORIGINS) {
    if (pattern === origin) return origin
    if (!pattern.includes('*')) continue

    const rx = new RegExp(`^${pattern.split('*').map(escapeRegex).join('[^.]*')}$`)
    if (rx.test(origin)) return origin
  }

  return null
}

const ALLOWED_MODELS = new Set([
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
])

function corsHeaders(origin: string | null) {
  const allowed = matchOrigin(origin) ?? ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

const json = (body: unknown, status: number, origin: string | null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }

  if (req.method !== 'POST') {
    return json({ error: { message: 'Method not allowed.' } }, 405, origin)
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) {
    return json({ error: { message: 'GEMINI_API_KEY is not set on the server.' } }, 500, origin)
  }

  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return json({ error: { message: 'Request body was not valid JSON.' } }, 400, origin)
  }

  const model = typeof payload.model === 'string' ? payload.model : ''
  if (!ALLOWED_MODELS.has(model)) {
    return json({ error: { message: `Model "${model}" is not allowed.` } }, 400, origin)
  }

  const upstream = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      store: false,
      system_instruction: payload.system_instruction,
      input: payload.input,
      tools: payload.tools,
      generation_config: payload.generation_config,
    }),
  })

  const text = await upstream.text()
  return new Response(text, {
    status: upstream.status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  })
})
