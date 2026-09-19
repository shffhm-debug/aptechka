// Категории. Значение в таблице — label (по-русски). Должно совпадать с CATEGORIES в apps-script/Prompts.gs.
export const CATEGORIES = [
  { key: 'fever',   label: 'Жар/боль',        hint: 'температура, головная, зубная боль' },
  { key: 'cold',    label: 'Простуда',        hint: 'горло, нос, кашель, вирусы' },
  { key: 'stomach', label: 'Желудок',         hint: 'изжога, диарея, вздутие, спазмы' },
  { key: 'allergy', label: 'Аллергия',        hint: 'антигистаминные' },
  { key: 'skin',    label: 'Раны/кожа',       hint: 'антисептики, мази, пластыри' },
  { key: 'heart',   label: 'Сердце/давление', hint: 'давление, сердечные' },
  { key: 'kids',    label: 'Детское',         hint: 'детские формы' },
  { key: 'other',   label: 'Прочее',          hint: 'витамины, антибиотики, остальное' },
]

export const CATEGORY_BY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.label, c]))
export const CATEGORY_BY_KEY = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]))

/** Категория позиции; пустая или незнакомая → «Прочее». */
export function categoryOf(item) {
  return CATEGORY_BY_LABEL[item?.категория] || CATEGORY_BY_KEY.other
}

/** CSS-переменные плитки/чипа категории. */
export function categoryStyle(cat) {
  return { background: `var(--cat-${cat.key}-bg)`, color: `var(--cat-${cat.key}-fg)` }
}

export const FOR_WHOM = ['взрослый', 'детский', 'все']
