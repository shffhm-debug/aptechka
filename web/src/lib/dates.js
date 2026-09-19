const SOON_DAYS = 30

export function todayIso() {
  const d = new Date()
  return [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())].join('-')
}

function pad(n) { return String(n).padStart(2, '0') }

/** «2027-03-31» → «03.2027»; пусто → «». */
export function formatExpiry(iso) {
  if (!iso) return ''
  const m = String(iso).match(/^(\d{4})-(\d{2})/)
  return m ? `${m[2]}.${m[1]}` : String(iso)
}

/** «2027-03» → «2027-03-31» (последний день месяца). */
export function monthToIso(month) {
  const m = String(month || '').match(/^(\d{4})-(\d{2})$/)
  if (!m) return ''
  const last = new Date(Number(m[1]), Number(m[2]), 0).getDate()
  return `${m[1]}-${m[2]}-${pad(last)}`
}

/** «2027-03-31» → «2027-03» для input[type=month]. */
export function isoToMonth(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})/)
  return m ? `${m[1]}-${m[2]}` : ''
}

/** 'expired' | 'soon' | 'ok' | 'none' */
export function expiryStatus(iso, today = todayIso()) {
  if (!iso) return 'none'
  if (iso < today) return 'expired'
  const d = daysBetween(today, iso)
  return d <= SOON_DAYS ? 'soon' : 'ok'
}

export function daysBetween(a, b) {
  const da = new Date(a + 'T00:00:00')
  const db = new Date(b + 'T00:00:00')
  return Math.round((db - da) / 86400000)
}
