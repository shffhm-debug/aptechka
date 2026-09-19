import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { ApiError, humanError, isConfigured, request } from './api/client.js'
import { newId } from './lib/id.js'

const SETTINGS_KEY = 'aptechka.settings.v1'
const ITEMS_KEY = 'aptechka.items.v1'

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}
function writeJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* private mode */ }
}

const initial = () => {
  const cached = readJson(ITEMS_KEY, null)
  return {
    settings: { url: '', token: '', demo: false, ...readJson(SETTINGS_KEY, {}) },
    items: cached?.items || [],
    lastSync: cached?.lastSync || null,
    syncing: false,
    syncError: null,
    toasts: [],
  }
}

function reducer(state, a) {
  switch (a.type) {
    case 'settings': return { ...state, settings: { ...state.settings, ...a.patch } }
    case 'sync:start': return { ...state, syncing: true, syncError: null }
    case 'sync:ok': return { ...state, syncing: false, items: a.items, lastSync: a.at, syncError: null }
    case 'sync:fail': return { ...state, syncing: false, syncError: a.error }
    case 'items': return { ...state, items: a.items }
    case 'toast:add': return { ...state, toasts: [...state.toasts.filter((t) => t.key !== a.toast.key), a.toast] }
    case 'toast:remove': return { ...state, toasts: state.toasts.filter((t) => t.id !== a.id) }
    default: return state
  }
}

const Ctx = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initial)
  const stateRef = useRef(state)
  stateRef.current = state
  const qtyTimers = useRef(new Map())

  useEffect(() => { writeJson(SETTINGS_KEY, state.settings) }, [state.settings])
  useEffect(() => { writeJson(ITEMS_KEY, { items: state.items, lastSync: state.lastSync }) }, [state.items, state.lastSync])

  const api = useCallback((action, payload) => request(stateRef.current.settings, action, payload), [])

  const toast = useCallback((message, opts = {}) => {
    const id = newId()
    const t = { id, key: opts.key || id, message, kind: opts.kind || 'info', actionLabel: opts.actionLabel, onAction: opts.onAction }
    dispatch({ type: 'toast:add', toast: t })
    const ms = opts.duration ?? (opts.actionLabel ? 6000 : 3500)
    setTimeout(() => dispatch({ type: 'toast:remove', id }), ms)
    return id
  }, [])

  const dismissToast = useCallback((id) => dispatch({ type: 'toast:remove', id }), [])

  const refresh = useCallback(async () => {
    if (!isConfigured(stateRef.current.settings)) return false
    dispatch({ type: 'sync:start' })
    try {
      const data = await api('list')
      dispatch({ type: 'sync:ok', items: data.items || [], at: new Date().toISOString() })
      return true
    } catch (err) {
      dispatch({ type: 'sync:fail', error: humanError(err) })
      return false
    }
  }, [api])

  const setItems = (fn) => dispatch({ type: 'items', items: fn(stateRef.current.items) })

  const add = useCallback(async (item) => {
    const id = item.id || newId()
    const optimistic = { ...item, id, обновлено: new Date().toISOString().slice(0, 19) }
    setItems((items) => [...items.filter((x) => x.id !== id), optimistic])
    try {
      const saved = await api('add', { ...item, id })
      setItems((items) => items.map((x) => (x.id === id ? saved : x)))
      return saved
    } catch (err) {
      setItems((items) => items.filter((x) => x.id !== id))
      throw err
    }
  }, [api])

  const update = useCallback(async (item) => {
    const prev = stateRef.current.items.find((x) => x.id === item.id)
    setItems((items) => items.map((x) => (x.id === item.id ? { ...x, ...item } : x)))
    try {
      const saved = await api('update', item)
      setItems((items) => items.map((x) => (x.id === item.id ? saved : x)))
      return saved
    } catch (err) {
      if (prev) setItems((items) => items.map((x) => (x.id === item.id ? prev : x)))
      throw err
    }
  }, [api])

  const remove = useCallback(async (id, { undoable = true } = {}) => {
    const prev = stateRef.current.items.find((x) => x.id === id)
    if (!prev) return
    setItems((items) => items.filter((x) => x.id !== id))
    try {
      await api('delete', { id })
    } catch (err) {
      if (!(err instanceof ApiError && err.code === 'not_found')) {
        setItems((items) => [...items, prev])
        throw err
      }
    }
    if (undoable) {
      toast(`Удалено: ${prev.название_рус || prev.название}`, {
        key: 'undo:' + id,
        actionLabel: 'Вернуть',
        onAction: () => add(prev).catch((e) => toast(humanError(e), { kind: 'error' })),
      })
    }
  }, [api, add, toast])

  /** Оптимистичное изменение количества с дебаунсом записи 700 мс на позицию. */
  const setQty = useCallback((id, qty) => {
    const q = Math.max(0, Math.round(Number(qty) || 0))
    setItems((items) => items.map((x) => (x.id === id ? { ...x, количество: q } : x)))
    const timers = qtyTimers.current
    if (timers.has(id)) clearTimeout(timers.get(id))
    timers.set(id, setTimeout(async () => {
      timers.delete(id)
      const cur = stateRef.current.items.find((x) => x.id === id)
      if (!cur) return
      try {
        await api('update', { id, количество: cur.количество })
      } catch (err) {
        toast(humanError(err), { kind: 'error' })
        refresh()
      }
    }, 700))
  }, [api, toast, refresh])

  const ai = useCallback((mode, payload) => api('ai', { mode, ...payload }), [api])

  const setSettings = useCallback((patch) => dispatch({ type: 'settings', patch }), [])

  // первая загрузка + при возврате в приложение
  useEffect(() => {
    refresh()
    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', refresh)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', refresh)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.settings.url, state.settings.token, state.settings.demo])

  const value = useMemo(() => ({
    ...state,
    configured: isConfigured(state.settings),
    setSettings, refresh, add, update, remove, setQty, ai, toast, dismissToast,
  }), [state, setSettings, refresh, add, update, remove, setQty, ai, toast, dismissToast])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore вне StoreProvider')
  return ctx
}
