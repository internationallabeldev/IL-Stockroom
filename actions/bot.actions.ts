'use server'

import Groq from 'groq-sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionUser } from './auth.actions'
import { botTools } from '@/lib/bot/tools'
import { executeTool } from '@/lib/bot/tool-handlers'
import type { ChatChannel } from './chat.actions'

// ── Config (app_settings claude_bot.*) ───────────────────────────────────────────

type BotConfig = {
  enabled: boolean
  max_queries_per_day: number
  model: string
  context_messages: number
}

const BOT_DEFAULTS: BotConfig = {
  enabled: true,
  max_queries_per_day: 50,
  model: 'llama-3.1-8b-instant',
  context_messages: 10,
}

/** Read the bot's global config from app_settings, falling back to defaults. */
async function getBotConfig(): Promise<BotConfig> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('app_settings')
    .select('key, value')
    .like('key', 'claude_bot.%')
  const map = Object.fromEntries((data ?? []).map(r => [r.key, r.value]))
  return {
    enabled: (map['claude_bot.enabled'] as boolean) ?? BOT_DEFAULTS.enabled,
    max_queries_per_day: (map['claude_bot.max_queries_per_day'] as number) ?? BOT_DEFAULTS.max_queries_per_day,
    model: (map['claude_bot.model'] as string) ?? BOT_DEFAULTS.model,
    context_messages: (map['claude_bot.context_messages'] as number) ?? BOT_DEFAULTS.context_messages,
  }
}

const BOT_USER_ID = process.env.NEXT_PUBLIC_BOT_USER_ID
const todayStr = () => new Date().toISOString().slice(0, 10)

// ── Quota ────────────────────────────────────────────────────────────────────────

/** Current user's bot usage today (auto-resets when the stored date is stale). */
export async function getBotQueryStatus(): Promise<{ used: number; max: number; enabled: boolean }> {
  const me = await getSessionUser()
  const config = await getBotConfig()
  if (!me) return { used: 0, max: config.max_queries_per_day, enabled: config.enabled }

  const admin = createAdminClient()
  const { data } = await admin
    .from('users')
    .select('bot_queries_today, bot_queries_reset_at')
    .eq('id', me.id)
    .maybeSingle()

  const fresh = data?.bot_queries_reset_at === todayStr()
  return {
    used: fresh ? data?.bot_queries_today ?? 0 : 0,
    max: config.max_queries_per_day,
    enabled: config.enabled,
  }
}

async function incrementQuota(userId: string, currentUsed: number): Promise<void> {
  const admin = createAdminClient()
  await admin
    .from('users')
    .update({ bot_queries_today: currentUsed + 1, bot_queries_reset_at: todayStr() })
    .eq('id', userId)
}

// ── Bot DM channel (per-user private "Asistente IA") ──────────────────────────────

/** Find — or lazily create — the current user's private chat with the bot. */
export async function getOrCreateBotChannel(): Promise<{ channel?: ChatChannel; error?: string }> {
  const me = await getSessionUser()
  if (!me) return { error: 'Sin sesión' }
  if (!BOT_USER_ID) return { error: 'El asistente no está configurado (falta NEXT_PUBLIC_BOT_USER_ID).' }

  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('chat_channels')
    .select('*')
    .eq('is_bot_dm', true)
    .eq('bot_owner_id', me.id)
    .maybeSingle()
  if (existing) return { channel: existing }

  const slug = `claude-${me.id.slice(0, 8)}`
  const { data: channel, error } = await admin
    .from('chat_channels')
    .insert({
      name: 'Asistente IA',
      slug,
      is_default: false,
      is_private: true,
      is_bot_dm: true,
      bot_owner_id: me.id,
      created_by: me.id,
      retention_days: null,
    })
    .select('*')
    .single()
  if (error || !channel) return { error: error?.message ?? 'No se pudo crear el canal del asistente' }

  // Members = {user, bot} so RLS lets the user read/post and the bot's messages show.
  await admin.from('chat_channel_members').insert([
    { channel_id: channel.id, user_id: me.id, added_by: me.id },
    { channel_id: channel.id, user_id: BOT_USER_ID, added_by: me.id },
  ])

  return { channel }
}

/** Wipe the messages of the caller's own bot DM (resets context + frees tokens).
 *  Verifies the channel really is this user's bot DM before deleting. */
export async function clearBotConversation(channelId: number): Promise<{ success?: boolean; error?: string }> {
  const me = await getSessionUser()
  if (!me) return { error: 'Sin sesión' }

  const admin = createAdminClient()
  const { data: channel } = await admin
    .from('chat_channels')
    .select('is_bot_dm, bot_owner_id')
    .eq('id', channelId)
    .maybeSingle()
  if (!channel?.is_bot_dm || channel.bot_owner_id !== me.id) {
    return { error: 'No es tu chat con el asistente' }
  }

  // Detach FKs that point at these messages before deleting them. The schema
  // intends these as ON DELETE SET NULL, but deployments created before that was
  // added still carry plain FKs, so clear them explicitly to avoid violations.
  await admin.from('chat_read_status').update({ last_read_message_id: null }).eq('channel_id', channelId)
  await admin.from('chat_messages').update({ reply_to_id: null }).eq('channel_id', channelId)

  const { error } = await admin.from('chat_messages').delete().eq('channel_id', channelId)
  if (error) return { error: error.message }
  return { success: true }
}

// ── Ask the bot ────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = (date: string) =>
  `Eres el asistente de inventario de la imprenta International Label.\n` +
  `Reglas:\n` +
  `- Responde SIEMPRE en español, breve y directo. Usa listas cuando ayude.\n` +
  `- Para cualquier pregunta sobre tintas, papel, suministros, requisiciones, órdenes de ` +
  `compra, proveedores o movimientos DEBES usar las herramientas disponibles; no respondas de memoria.\n` +
  `- Usa ÚNICAMENTE los datos que devuelvan las herramientas. NUNCA inventes datos, nombres, códigos ni cifras.\n` +
  `- Si una herramienta devuelve found: false o un array vacío, responde EXACTAMENTE: ` +
  `"No encontré información para esa consulta en el sistema." No generes números ni datos que no vengan de las herramientas.\n` +
  `- Responde solo lo que se preguntó; no agregues datos que no se pidieron.\n` +
  `- Eres de solo lectura: si te piden crear, editar o eliminar algo, explica que solo puedes consultar.\n` +
  `- No reveles correos, teléfonos ni datos personales de usuarios.\n` +
  `Fecha actual: ${date}`

async function insertBotMessage(channelId: number, text: string): Promise<void> {
  if (!BOT_USER_ID) return
  const admin = createAdminClient()
  await admin.from('chat_messages').insert({
    channel_id: channelId,
    user_id: BOT_USER_ID,
    content: `<p>${escapeHtml(text)}</p>`,
    content_text: text,
  })
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Build the prior-conversation context for the private DM (last N, oldest→newest). */
async function buildHistory(channelId: number, limit: number) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('chat_messages')
    .select('user_id, content_text')
    .eq('channel_id', channelId)
    .eq('is_deleted', false)
    .order('id', { ascending: false })
    .limit(limit)
  const rows = (data ?? []).reverse()
  return rows
    .filter(r => r.content_text)
    .map(r => ({
      role: (r.user_id === BOT_USER_ID ? 'assistant' : 'user') as 'assistant' | 'user',
      content: r.content_text as string,
    }))
}

const TEMPERATURE = 0.1

/** Names of the bot's tools and their argument keys, used to spot when the model
 *  has emitted a tool call (or its arguments) as plain text instead of a real
 *  `tool_calls` payload. */
const TOOL_ARG_TAGS =
  /<\/?(ink_name|paper_name|category|status|material_type|provider_type|days|only_low_stock|only_critical)\b/i

/** Heuristic: the model's "final" message is not a natural-language answer but a
 *  leftover/malformed tool call or raw structured data (XML tags or bare JSON).
 *  Llama-class models sometimes return these with finish_reason: 'stop'. */
function looksLikeRawOutput(content: string): boolean {
  const t = content.trim()
  if (!t) return false
  return (
    /<function\s*=/.test(t) ||                              // <function=get_paper_stock>{...}
    /<\/?(tool_call|function_call|tool_response)\b/i.test(t) ||
    TOOL_ARG_TAGS.test(t) ||                                // <paper_name>...</paper_name>
    /^[[{][\s\S]*[\]}]$/.test(t)                            // bare JSON object/array
  )
}

/** Some models (esp. Llama) emit a tool call as the literal text
 *  `<function=name>{json}` and Groq replies 400 tool_use_failed. We pull those
 *  calls out of `failed_generation` so we can run them ourselves instead of failing. */
function parseFailedFunctions(failedGeneration: string): { name: string; args: Record<string, unknown> }[] {
  const calls: { name: string; args: Record<string, unknown> }[] = []
  const re = /<function=([^>\s]+)>\s*(\{[\s\S]*?\})/g
  let m: RegExpExecArray | null
  while ((m = re.exec(failedGeneration))) {
    let args: Record<string, unknown> = {}
    try { args = JSON.parse(m[2]) } catch { args = {} }
    calls.push({ name: m[1], args })
  }
  return calls
}

/** Extract the `failed_generation` string from a groq-sdk error, if present.
 *  groq-sdk nests the API body under `.error`, so the field can live at
 *  `.error.error.failed_generation` or `.error.failed_generation`. */
function getFailedGeneration(e: unknown): string | null {
  const anyE = e as {
    error?: { failed_generation?: string; error?: { failed_generation?: string } }
    failed_generation?: string
  }
  const fg =
    anyE?.error?.error?.failed_generation ??
    anyE?.error?.failed_generation ??
    anyE?.failed_generation
  return typeof fg === 'string' && fg.length > 0 ? fg : null
}

/** Recover from a malformed tool call: run any tools the model named (if we could
 *  parse them) and ask the model once more WITHOUT tools, so its reply is always
 *  natural-language text — never a raw tool result or XML/JSON blob. */
async function cleanupAnswer(
  groq: Groq,
  model: string,
  messages: Groq.Chat.Completions.ChatCompletionMessageParam[],
  calls: { name: string; args: Record<string, unknown> }[],
  userId: string,
): Promise<string | null> {
  const blocks: string[] = []
  for (const c of calls) {
    const result = await executeTool(c.name, c.args, userId)
    blocks.push(`Resultado de ${c.name}(${JSON.stringify(c.args)}):\n${result}`)
  }
  const guidance = blocks.length
    ? `Datos consultados en el sistema:\n${blocks.join('\n\n')}\n\n` +
      `Responde la última pregunta del usuario usando solo estos datos, en español y de forma concisa. ` +
      `No incluyas etiquetas XML, JSON ni llamadas a herramientas en tu respuesta.`
    : `Responde la última pregunta del usuario en español, en lenguaje natural y conciso. ` +
      `No incluyas etiquetas XML, JSON ni llamadas a herramientas en tu respuesta.`
  const final = await groq.chat.completions.create({
    model,
    messages: [...messages, { role: 'system', content: guidance }],
    temperature: TEMPERATURE,
    max_tokens: 1000,
  })
  return final.choices[0]?.message?.content?.trim() ?? null
}

/** Drive the model→tools→model loop, recovering from malformed tool calls.
 *  Returns the final assistant text (or null). Mutates `messages`. */
async function runConversation(
  groq: Groq,
  model: string,
  messages: Groq.Chat.Completions.ChatCompletionMessageParam[],
  userId: string,
): Promise<string | null> {
  let guard = 0
  while (guard++ < 5) {
    let response
    try {
      response = await groq.chat.completions.create({
        model,
        messages,
        tools: botTools,
        tool_choice: 'auto',
        temperature: TEMPERATURE,
        max_tokens: 1000,
      })
    } catch (e) {
      // tool_use_failed → run the intended tools from failed_generation, then
      // ask once more WITHOUT tools so the bad-format call can't recur.
      const fg = getFailedGeneration(e)
      const calls = fg ? parseFailedFunctions(fg) : []
      if (calls.length === 0) throw e
      return cleanupAnswer(groq, model, messages, calls, userId)
    }

    const choice = response.choices[0]
    if (choice?.finish_reason !== 'tool_calls') {
      const content = choice?.message?.content?.trim() ?? null
      // Guard: a "stop" reply can still be a malformed tool call emitted as text
      // (e.g. `<paper_name>X</paper_name> {...}`). Never surface that raw — run any
      // calls we can parse and re-ask without tools for a natural-language answer.
      if (content && looksLikeRawOutput(content)) {
        return cleanupAnswer(groq, model, messages, parseFailedFunctions(content), userId)
      }
      return content
    }

    messages.push(choice.message)
    for (const call of choice.message.tool_calls ?? []) {
      if (!call.function) continue
      let parsed: Record<string, unknown> = {}
      try { parsed = JSON.parse(call.function.arguments || '{}') } catch { parsed = {} }
      const result = await executeTool(call.function.name, parsed, userId)
      messages.push({ role: 'tool', tool_call_id: call.id, content: result })
    }
  }

  // Iterations exhausted → final answer without tools.
  const fallback = await groq.chat.completions.create({
    model, messages, temperature: TEMPERATURE, max_tokens: 1000,
  })
  return fallback.choices[0]?.message?.content?.trim() ?? null
}

/**
 * Run a question through Groq + the inventory tools and post the answer as the bot.
 * - Public channel (`withContext` false): a single @mention query, no memory.
 * - Private DM (`withContext` true): includes the last N messages as context.
 * Authorization, quota and the bot identity are all derived server-side.
 */
export async function askBot({
  question,
  channelId,
  withContext = false,
}: {
  question: string
  channelId: number
  withContext?: boolean
}): Promise<{ success?: boolean; error?: string }> {
  const me = await getSessionUser()
  if (!me) return { error: 'Sin sesión' }
  if (!BOT_USER_ID) return { error: 'Asistente no configurado' }

  const config = await getBotConfig()
  if (!config.enabled) {
    await insertBotMessage(channelId, 'El asistente está deshabilitado por el administrador.')
    return { error: 'Asistente deshabilitado' }
  }

  // Quota (auto-reset on a new day).
  const status = await getBotQueryStatus()
  if (status.used >= status.max) {
    await insertBotMessage(
      channelId,
      `Alcanzaste el límite de ${status.max} consultas por día. Inténtalo de nuevo mañana.`,
    )
    return { error: 'Límite diario alcanzado' }
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    await insertBotMessage(channelId, 'El asistente no está configurado (falta GROQ_API_KEY).')
    return { error: 'GROQ_API_KEY ausente' }
  }

  const history = withContext
    ? await buildHistory(channelId, config.context_messages)
    : [{ role: 'user' as const, content: question }]

  try {
    const groq = new Groq({ apiKey })
    const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT(new Date().toLocaleDateString('es-MX')) },
      ...history,
    ]

    const answer = await runConversation(groq, config.model, messages, me.id)
    if (!answer) {
      await insertBotMessage(channelId, 'No pude generar una respuesta. Intenta reformular tu pregunta.')
      return { error: 'Respuesta vacía' }
    }

    await insertBotMessage(channelId, answer)
    await incrementQuota(me.id, status.used)
    return { success: true }
  } catch (e) {
    // Log solo el error (no el contenido de las queries) para diagnóstico server-side.
    console.error('[askBot]', e instanceof Error ? `${e.message}\n${e.stack ?? ''}` : e)
    const status = (e as { status?: number })?.status
    const msg =
      status === 429
        ? 'Se alcanzó el límite de consultas del proveedor de IA (Groq) por hoy. Intenta más tarde.'
        : 'No pude procesar tu consulta en este momento. Intenta más tarde.'
    await insertBotMessage(channelId, msg)
    return { error: e instanceof Error ? e.message : 'Error del asistente' }
  }
}
