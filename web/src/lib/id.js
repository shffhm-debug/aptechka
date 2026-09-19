export function newId() {
  if (crypto?.randomUUID) return crypto.randomUUID().replace(/-/g, '').slice(0, 8)
  return Math.random().toString(36).slice(2, 10)
}
