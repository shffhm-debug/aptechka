// Единственное место, где фронт знает про бэкенд.
// Сейчас — Google Apps Script (POST text/plain → без CORS preflight). Потом — свой API: меняется только этот файл.
import * as demo from './demo.js'

export class ApiError extends Error {
  constructor(code, message) {
    super(message || code)
    this.name = 'ApiError'
    this.code = String(code || 'unknown')
  }
}

const MESSAGES = {
  no_url: 'Не задан адрес скрипта. Открой настройки.',
  unauthorized: 'Неверный семейный токен. Проверь в настройках.',
  server_not_configured: 'На сервере не задан семейный токен: в таблице меню Аптечка → «Создать семейный токен».',
  unknown_action: 'Сервер не понял запрос. Обнови приложение.',
  bad_json: 'Сервер не понял запрос.',
  bad_response: 'Сервер вернул не JSON. Проверь адрес скрипта (должен заканчиваться на /exec) и что доступ «Все».',
  bad_shape: 'Сервер ответил невпопад. Попробуй ещё раз.',
  method_get: 'Сервер ответил невпопад. Попробуй ещё раз.',
  name_required: 'Укажи название.',
  id_required: 'Не хватает id позиции.',
  not_found: 'Позиция уже удалена или не найдена.',
  no_api_key: 'На сервере не задан ключ Claude (ANTHROPIC_API_KEY в Script Properties).',
  image_required: 'Нужно фото.',
  bad_image_type: 'Такой формат фото не поддерживается.',
  symptoms_required: 'Опиши, что беспокоит.',
  prescription_required: 'Нужен текст или фото рецепта.',
  unknown_ai_mode: 'Сервер не знает такой режим помощника. Обнови приложение.',
  claude_refusal: 'ИИ отказался отвечать на этот запрос.',
  claude_truncated: 'Ответ ИИ получился слишком длинным. Попробуй короче.',
  claude_empty: 'ИИ вернул пустой ответ. Попробуй ещё раз.',
}

export function humanError(err) {
  if (!err) return 'Что-то пошло не так'
  if (err instanceof ApiError) {
    const [code, ...rest] = err.code.split(':')
    const detail = rest.join(':').trim()
    if (MESSAGES[code]) return MESSAGES[code]
    if (code.startsWith('sheet_')) return 'Таблица не готова: ' + (detail || 'запусти миграцию из меню «Аптечка»')
    if (code.startsWith('claude_')) return 'Ошибка ИИ (' + code.replace('claude_', '') + '): ' + (detail || 'попробуй ещё раз')
    return detail ? `${code}: ${detail}` : code
  }
  if (err.name === 'TypeError' || /fetch|network|Failed/i.test(err.message || '')) {
    return 'Нет связи с сервером. Проверь интернет и адрес скрипта.'
  }
  return err.message || String(err)
}

export function isConfigured(settings) {
  return Boolean(settings?.demo || (settings?.url && settings?.token))
}

/**
 * Apps Script отвечает через 302 → googleusercontent. Иногда цепочка редиректов ломается:
 * POST превращается в GET (приходит ответ doGet без данных), либо echo отдаёт 404 HTML.
 * Поэтому: проверяем форму ответа под конкретный action и повторяем запрос до 3 раз.
 */
const RETRYABLE = new Set(['bad_response', 'bad_shape', 'method_get', 'network'])
const RETRY_DELAYS = [400, 1000, 2200]

function checkShape(action, data) {
  const isObj = data && typeof data === 'object' && !Array.isArray(data)
  switch (action) {
    case 'list': return isObj && Array.isArray(data.items)
    case 'add':
    case 'update': return isObj && typeof data.id === 'string' && data.id.length > 0
    case 'delete': return isObj && data.id != null
    case 'ai': return isObj
    default: return true
  }
}

async function once(settings, action, payload) {
  let res
  try {
    res = await fetch(settings.url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ token: settings.token || '', action, payload }),
      redirect: 'follow',
    })
  } catch (e) {
    throw new ApiError('network', e?.message)
  }
  let data
  try {
    data = await res.json()
  } catch {
    throw new ApiError('bad_response')
  }
  if (!data || data.ok !== true) throw new ApiError(data?.error || 'unknown')
  if (!checkShape(action, data.data)) throw new ApiError('bad_shape')
  return data.data
}

export async function request(settings, action, payload = {}) {
  if (settings?.demo) return demo.handle(action, payload)
  if (!settings?.url) throw new ApiError('no_url')

  let lastErr
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      return await once(settings, action, payload)
    } catch (err) {
      lastErr = err
      const code = err instanceof ApiError ? err.code.split(':')[0] : 'network'
      // повторять только транспортные сбои; чтение (list/ai) — всегда, запись — тоже безопасно:
      // add с тем же id не дублирует, update идемпотентен, delete отвечает not_found
      if (!RETRYABLE.has(code) || attempt === RETRY_DELAYS.length) break
      await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]))
    }
  }
  throw lastErr
}
