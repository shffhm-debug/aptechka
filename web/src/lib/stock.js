import { SMALL_UNIT_FORMS } from '../config/forms.js'
import { expiryStatus } from './dates.js'

/** 'out' | 'low' | 'ok' */
export function stockStatus(item) {
  const q = Number(item.количество) || 0
  if (q <= 0) return 'out'
  if (q <= 1 && SMALL_UNIT_FORMS.has(item.форма)) return 'low'
  return 'ok'
}

/** Сводка для бейджей главного экрана. */
export function summarize(items) {
  const s = { expired: 0, soon: 0, low: 0, out: 0 }
  for (const it of items) {
    const e = expiryStatus(it.срок_годности)
    if (e === 'expired') s.expired++
    else if (e === 'soon') s.soon++
    const st = stockStatus(it)
    if (st === 'out') s.out++
    else if (st === 'low') s.low++
  }
  return s
}

/** Фильтр по ключу из URL: expired | soon | low */
export function matchesFilter(item, filter) {
  if (!filter) return true
  const e = expiryStatus(item.срок_годности)
  const st = stockStatus(item)
  if (filter === 'expired') return e === 'expired'
  if (filter === 'soon') return e === 'soon' || e === 'expired'
  if (filter === 'low') return st === 'low' || st === 'out'
  return true
}
