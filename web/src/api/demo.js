// Демо-бэкенд: данные в localStorage, ИИ отвечает заготовками. Нужен, чтобы попробовать приложение без деплоя.
import { newId } from '../lib/id.js'
import { todayIso } from '../lib/dates.js'

const KEY = 'aptechka.demo.items.v1'

function shift(months) {
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(last).padStart(2, '0')}`
}

function seed() {
  const now = new Date().toISOString().slice(0, 19)
  const rows = [
    ['Nurofen', 'Нурофен', 'ибупрофен', 'сироп', '100 мг/5 мл', 1, shift(6), 'Детское', 'детский', 'кухня, верхняя полка', 'детский сироп от температуры и боли, с 3 месяцев'],
    ['Paracetamol', 'Парацетамол', 'парацетамол', 'таблетки', '500 мг', 5, shift(0), 'Жар/боль', 'взрослый', '', ''],
    ['Theraflu', 'Терафлю', 'парацетамол + фенилэфрин + фенирамин', 'пакетики', '', 3, shift(-1), 'Простуда', 'взрослый', '', 'горячий напиток'],
    ['Zyrtec', 'Зиртек', 'цетиризин', 'таблетки', '10 мг', 5, shift(16), 'Аллергия', 'взрослый', '', ''],
    ['Zyrtec', 'Зиртек капли', 'цетиризин', 'капли', '10 мг/мл', 2, shift(8), 'Аллергия', 'все', '', 'детям с 6 месяцев по инструкции'],
    ['Betadine', 'Бетадин', 'повидон-йод', 'раствор', '10%', 1, '', 'Раны/кожа', 'все', 'ванная', 'антисептик'],
    ['Corvalol', 'Корвалол', 'фенобарбитал + этилбромизовалерианат + мята', 'капли', '', 1, shift(14), 'Сердце/давление', 'взрослый', '', ''],
    ['Enterofuryl', 'Энтерофурил', 'нифуроксазид', 'капсулы', '200 мг', 4, shift(12), 'Желудок', 'взрослый', '', 'кишечный антисептик'],
    ['Enterosgel', 'Энтеросгель', 'полиметилсилоксана полигидрат', 'пакетики', '', 1, shift(4), 'Желудок', 'все', '', 'сорбент'],
    ['Dexametazon', 'Дексаметазон', 'дексаметазон', 'ампулы', '4 мг/мл', 13, shift(3), 'Прочее', 'взрослый', 'холодильник', ''],
    ['Panthenol', 'Пантенол', 'декспантенол', 'спрей', '', 1, shift(7), 'Раны/кожа', 'все', 'ванная', 'ожоги, ссадины'],
    ['No-Spa', 'Но-шпа', 'дротаверин', 'таблетки', '40 мг', 1, shift(18), 'Желудок', 'взрослый', '', 'спазмолитик'],
    ['Vibrocil', 'Виброцил', 'фенилэфрин + диметинден', 'капли', '', 3, shift(1), 'Простуда', 'все', '', 'капли в нос'],
    ['Magne B6', 'Магне B6', 'магния лактат + пиридоксин', 'таблетки', '', 0, '', 'Прочее', 'взрослый', '', ''],
    ['Aspirin', 'Аспирин', 'ацетилсалициловая кислота', 'таблетки', '500 мг', 2, shift(9), 'Жар/боль', 'взрослый', '', 'детям нельзя'],
    ['Triderm', 'Тридерм', 'бетаметазон + клотримазол + гентамицин', 'мазь', '', 1, shift(11), 'Раны/кожа', 'взрослый', '', ''],
    ['Septosol', 'Септосол', 'амилметакрезол + дихлорбензиловый спирт', 'таблетки', '', 2, shift(5), 'Простуда', 'взрослый', '', 'для рассасывания'],
  ]
  return rows.map(([a, b, c, d, e, f, g, h, i, j, k]) => ({
    id: newId(), название: a, название_рус: b, действующее_вещество: c, форма: d, дозировка: e,
    количество: f, срок_годности: g, категория: h, для_кого: i, место_хранения: j, заметка: k, обновлено: now,
  }))
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* пересоздать */ }
  const items = seed()
  save(items)
  return items
}

function save(items) {
  try { localStorage.setItem(KEY, JSON.stringify(items)) } catch { /* ignore */ }
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

export async function handle(action, payload) {
  await wait(action === 'ai' ? 1400 : 250)
  const items = load()
  const now = new Date().toISOString().slice(0, 19)
  switch (action) {
    case 'list':
      return { items, updatedAt: now }
    case 'add': {
      if (!String(payload.название || '').trim()) throw Object.assign(new Error('name_required'), { code: 'name_required' })
      const item = { ...blank(), ...payload, id: payload.id || newId(), обновлено: now }
      const i = items.findIndex((x) => x.id === item.id)
      if (i >= 0) items[i] = item; else items.push(item)
      save(items)
      return item
    }
    case 'update': {
      const i = items.findIndex((x) => x.id === payload.id)
      if (i < 0) throw Object.assign(new Error('not_found'), { code: 'not_found' })
      items[i] = { ...items[i], ...payload, обновлено: now }
      save(items)
      return items[i]
    }
    case 'delete': {
      const i = items.findIndex((x) => x.id === payload.id)
      if (i < 0) throw Object.assign(new Error('not_found'), { code: 'not_found' })
      const [deleted] = items.splice(i, 1)
      save(items)
      return { id: payload.id, deleted }
    }
    case 'ai':
      return ai(payload, items)
    default:
      throw Object.assign(new Error('unknown_action'), { code: 'unknown_action' })
  }
}

function blank() {
  return {
    id: '', название: '', название_рус: '', действующее_вещество: '', форма: '', дозировка: '', количество: 1,
    срок_годности: '', категория: 'Прочее', для_кого: 'взрослый', место_хранения: '', заметка: '', обновлено: '',
  }
}

const DISCLAIMER = 'Это подсказка, а не замена врачу.'

function usable(items) {
  const t = todayIso()
  return items.filter((it) => Number(it.количество) > 0 && (!it.срок_годности || it.срок_годности >= t))
}

function ai(p, items) {
  const ok = usable(items)
  const find = (name) => ok.find((it) => it.название.toLowerCase().startsWith(name.toLowerCase()))
  if (p.mode === 'extract') {
    return {
      название: 'Ibuprofen', название_рус: 'Ибупрофен', действующее_вещество: 'ибупрофен', форма: 'таблетки',
      дозировка: '400 мг', количество: 1, срок_годности: shift(20), категория: 'Жар/боль', для_кого: 'взрослый',
      заметка: 'обезболивающее и жаропонижающее', уверенность: 0.93,
      комментарий: 'Демо-режим: это заготовка, а не распознавание твоего фото.',
    }
  }
  if (p.mode === 'symptoms') {
    const child = p.who === 'ребёнок'
    const nurofen = find('Nurofen')
    const para = find('Paracetamol')
    const good = child ? [nurofen] : [para, find('Zyrtec')]
    return {
      срочно: /груд|дыш|судорог/i.test(p.symptoms || ''),
      срочно_текст: 'Боль в груди или затруднённое дыхание — сначала звони 112 или в скорую.',
      подходит: good.filter(Boolean).map((it) => ({
        id: it.id, название: it.название_рус || it.название,
        почему: child ? 'Детская форма ибупрофена, подходит по возрасту.' : 'Снижает температуру и снимает боль.',
        как_принимать: child ? 'Доза по весу — см. таблицу на упаковке. Не чаще чем раз в 6–8 часов.' : 'По инструкции на упаковке, не более 4 раз в сутки.',
        предупреждение: child ? 'Проверь срок годности на флаконе.' : 'Не сочетать с другими средствами, содержащими парацетамол.',
      })),
      не_подходит: child && para
        ? [{ id: para.id, название: para.название_рус || para.название, почему: 'Взрослая дозировка 500 мг — детям не подходит.' }]
        : [],
      дублирование: child ? [] : ['Парацетамол есть и в таблетках, и в Терафлю — не принимать вместе.'],
      нет_дома: child ? ['детский парацетамол в свечах или сиропе'] : [],
      общий_совет: 'Пить больше жидкости, отдых. Если температура держится больше 3 дней — к врачу.',
      disclaimer: DISCLAIMER,
    }
  }
  if (p.mode === 'prescription') {
    const zyr = find('Zyrtec')
    const para = find('Paracetamol')
    return {
      срочно: false,
      срочно_текст: '',
      назначения: [
        { назначено: 'Cetirizin 10 mg', мнн: 'цетиризин', дозировка: '10 мг', форма: 'таблетки', схема: '1 раз в день, 7 дней',
          статус: 'точное', найдено_id: zyr?.id || '', найдено_название: zyr ? (zyr.название_рус || zyr.название) : '', отличия: '', примечание: '' },
        { назначено: 'Paracetamol 325 mg', мнн: 'парацетамол', дозировка: '325 мг', форма: 'таблетки', схема: 'при температуре',
          статус: 'аналог', найдено_id: para?.id || '', найдено_название: para ? (para.название_рус || para.название) : '',
          отличия: 'Дома таблетки 500 мг вместо 325 мг — дозировка выше.', примечание: 'Обсудить с врачом или фармацевтом, можно ли делить таблетку.' },
        { назначено: 'Amoxicillin 500 mg', мнн: 'амоксициллин', дозировка: '500 мг', форма: 'капсулы', схема: '3 раза в день, 7 дней',
          статус: 'нет', найдено_id: '', найдено_название: '', отличия: '', примечание: '' },
      ],
      купить: ['Амоксициллин 500 мг, капсулы, 21 шт.'],
      дублирование: [],
      предупреждения: ['Антибиотик принимать полный курс, не бросать при улучшении.'],
      disclaimer: DISCLAIMER,
    }
  }
  if (p.mode === 'enrich') return { items: [] }
  throw Object.assign(new Error('unknown_ai_mode'), { code: 'unknown_ai_mode' })
}
