// Поиск: «нурофен» находит «nurofen», «paracetamol» находит «парацетамол».
// Оба текста приводятся к упрощённой латинской «фонетической» форме и сравниваются.

const CYR = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'o', ж: 'zh', з: 'z', и: 'i', й: 'i', к: 'k', л: 'l',
  м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'k', ч: 'ch', ш: 'sh',
  щ: 'sh', ъ: '', ы: 'i', ь: '', э: 'e', ю: 'u', я: 'a',
}

export function phonetic(s) {
  let t = String(s || '').toLowerCase().trim()
  // латиница → упрощённая
  t = t
    .replace(/ph/g, 'f').replace(/th/g, 't').replace(/ch/g, 'ch').replace(/sh/g, 'sh')
    .replace(/ck/g, 'k').replace(/x/g, 'ks').replace(/y/g, 'i').replace(/q/g, 'k').replace(/w/g, 'v')
    .replace(/c(?!h)/g, 'k').replace(/ă|â/g, 'a').replace(/î/g, 'i').replace(/ș|ş/g, 'sh').replace(/ț|ţ/g, 'ts')
  // кириллица → латиница
  t = t.replace(/[а-яё]/g, (ch) => CYR[ch] ?? ch)
  return t.replace(/[^a-z0-9]+/g, ' ').trim()
}

export function normalize(s) {
  return String(s || '').toLowerCase().replace(/ё/g, 'е').trim()
}

/** true, если позиция подходит под запрос. */
export function matches(item, query) {
  const q = normalize(query)
  if (!q) return true
  const fields = [item.название, item.название_рус, item.действующее_вещество, item.заметка, item.дозировка]
  if (fields.some((f) => normalize(f).includes(q))) return true
  const pq = phonetic(q)
  if (!pq) return false
  return fields.some((f) => f && phonetic(f).includes(pq))
}

export function sortByName(items) {
  return [...items].sort((a, b) =>
    (a.название_рус || a.название || '').localeCompare(b.название_рус || b.название || '', 'ru'),
  )
}
