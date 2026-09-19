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

export async function request(settings, action, payload = {}) {
  if (settings?.demo) return demo.handle(action, payload)
  if (!settings?.url) throw new ApiError('no_url')

  const res = await fetch(settings.url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ token: settings.token || '', action, payload }),
    redirect: 'follow',
  })
  let data
  try {
    data = await res.json()
  } catch {
    throw new ApiError('bad_response')
  }
  if (!data || data.ok !== true) throw new ApiError(data?.error || 'unknown')
  return data.data
}
