/**
 * Groq Cloud 的薄封装；当 GROQ_API_KEY 未设置时回退到本地 Ollama（调试/离线用）。
 * 调用方看到的返回形态（{ ok, json } | { ok: false, error }）保持稳定。
 *
 * 环境变量（按优先级）：
 *   - GROQ_API_KEY      置位即走 Groq Cloud（https://api.groq.com/openai/v1）
 *   - GROQ_MODEL        指定 Groq 模型，默认见 DEFAULT_GROQ_MODEL
 *   - OLLAMA_BASE_URL   仅在无 GROQ_API_KEY 时启用本地 Ollama 回退
 *   - OLLAMA_MODEL      Ollama 下使用的模型名（默认 qwen2.5:3b）
 */
export const DEFAULT_GROQ_MODEL = 'llama-3.1-8b-instant'
const DEFAULT_OLLAMA_MODEL = 'qwen2.5:3b'
const DEFAULT_OLLAMA_BASE_URL = 'http://127.0.0.1:11434'
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

type GroqChatResponse = {
  choices?: Array<{ message?: { role?: string; content?: string } }>
  error?: { message?: string; type?: string } | string
}

type OllamaChatResponse = {
  message?: { role?: string; content?: string }
  error?: string
  done?: boolean
}

function extractFirstJsonObject(s: string): string | null {
  const t = (s ?? '').trim()
  if (!t) return null
  const start = t.indexOf('{')
  if (start < 0) return null
  let depth = 0
  for (let i = start; i < t.length; i++) {
    const ch = t[i]
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return t.slice(start, i + 1)
    }
  }
  return null
}

function resolveGroqModel(override?: string): string {
  return override || process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL
}

function resolveOllamaBaseUrl(): string {
  const raw = process.env.OLLAMA_BASE_URL?.trim() || DEFAULT_OLLAMA_BASE_URL
  return raw.replace(/\/+$/, '')
}

function resolveOllamaModel(override?: string): string {
  return override || process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL
}

async function callGroq<T>(
  apiKey: string,
  messages: ChatMessage[],
  opts?: { model?: string; maxTokens?: number },
): Promise<{ ok: true; json: T } | { ok: false; error: string }> {
  const model = resolveGroqModel(opts?.model)
  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0,
        max_tokens: opts?.maxTokens ?? 450,
        /** OpenAI-compatible JSON mode；Groq 支持并会强制输出合法 JSON */
        response_format: { type: 'json_object' },
      }),
    })
    const data = (await res.json().catch(() => ({}))) as GroqChatResponse
    if (!res.ok) {
      const msg =
        typeof data?.error === 'string'
          ? data.error
          : data?.error?.message || `groq_${res.status}`
      return { ok: false, error: msg }
    }
    const content = data?.choices?.[0]?.message?.content ?? ''
    const jsonText = extractFirstJsonObject(content) ?? content.trim()
    if (!jsonText) return { ok: false, error: 'no_json' }
    try {
      const parsed = JSON.parse(jsonText) as T
      return { ok: true, json: parsed }
    } catch {
      return { ok: false, error: 'invalid_json' }
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'groq_fetch_failed' }
  }
}

async function callOllama<T>(
  messages: ChatMessage[],
  opts?: { model?: string; maxTokens?: number },
): Promise<{ ok: true; json: T } | { ok: false; error: string }> {
  const baseUrl = resolveOllamaBaseUrl()
  const model = resolveOllamaModel(opts?.model)
  const num_predict = opts?.maxTokens ?? 450
  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        format: 'json',
        options: { temperature: 0, num_predict },
      }),
    })
    const data = (await res.json().catch(() => ({}))) as OllamaChatResponse
    if (!res.ok) {
      return { ok: false, error: data?.error || `ollama_${res.status}` }
    }
    const content = data?.message?.content ?? ''
    const jsonText = extractFirstJsonObject(content)
    if (!jsonText) return { ok: false, error: 'no_json' }
    try {
      const parsed = JSON.parse(jsonText) as T
      return { ok: true, json: parsed }
    } catch {
      return { ok: false, error: 'invalid_json' }
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'ollama_fetch_failed' }
  }
}

export async function groqChatJson<T>(
  messages: ChatMessage[],
  opts?: { model?: string; maxTokens?: number },
): Promise<{ ok: true; json: T } | { ok: false; error: string }> {
  const apiKey = process.env.GROQ_API_KEY?.trim()
  if (apiKey) return callGroq<T>(apiKey, messages, opts)
  return callOllama<T>(messages, opts)
}
