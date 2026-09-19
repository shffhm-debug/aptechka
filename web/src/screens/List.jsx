import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../store.jsx'
import { CATEGORIES, CATEGORY_BY_KEY, categoryOf, categoryStyle } from '../config/categories.js'
import { plural } from '../config/forms.js'
import { matches, sortByName } from '../lib/search.js'
import { matchesFilter } from '../lib/stock.js'
import { humanError } from '../api/client.js'
import { Icon } from '../components/Icons.jsx'
import { Chip, EmptyState, Button, Spinner } from '../components/ui.jsx'
import MedCard from '../components/MedCard.jsx'
import SwipeRow from '../components/SwipeRow.jsx'
import TopBar from '../components/TopBar.jsx'

const FILTERS = [
  { key: 'expired', label: 'Просрочено' },
  { key: 'soon', label: 'Истекает срок' },
  { key: 'low', label: 'Заканчивается' },
]

export default function List() {
  const { items, setQty, remove, toast, syncing, refresh } = useStore()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const catKey = params.get('cat') || ''
  const filter = params.get('filter') || ''
  const [q, setQ] = useState('')

  const cat = CATEGORY_BY_KEY[catKey]
  const list = useMemo(() => {
    let out = items
    if (cat) out = out.filter((it) => categoryOf(it).key === cat.key)
    if (filter) out = out.filter((it) => matchesFilter(it, filter))
    if (q.trim()) out = out.filter((it) => matches(it, q))
    return sortByName(out)
  }, [items, cat, filter, q])

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value); else next.delete(key)
    setParams(next, { replace: true })
  }

  const title = cat ? cat.label : filter ? FILTERS.find((f) => f.key === filter)?.label : 'Все лекарства'

  const onDelete = (it) => remove(it.id).catch((e) => toast(humanError(e), { kind: 'error' }))

  return (
    <>
      <TopBar
        title={title}
        back={Boolean(cat || filter)}
        backTo="/"
        subtitle={`${list.length} ${plural(list.length, ['позиция', 'позиции', 'позиций'])}`}
        right={
          <button type="button" aria-label="Обновить" onClick={refresh} className="flex size-12 items-center justify-center rounded-full text-muted active:bg-surface-2">
            {syncing ? <Spinner size={20} /> : <Icon name="refresh" size={22} />}
          </button>
        }
      />

      <div className="mx-auto max-w-[520px] px-4 pb-6">
        <label className="relative block">
          <span className="sr-only">Поиск</span>
          <Icon name="search" size={22} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={cat ? `Искать в «${cat.label}»` : 'Найти лекарство'}
            autoComplete="off"
            className="min-h-13 w-full rounded-2xl border border-line bg-surface pl-12 pr-4 text-[17px] placeholder:text-muted/70"
          />
        </label>

        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
          <Chip active={!cat} onClick={() => setParam('cat', '')}>Все</Chip>
          {CATEGORIES.map((c) => (
            <Chip
              key={c.key}
              active={cat?.key === c.key}
              onClick={() => setParam('cat', cat?.key === c.key ? '' : c.key)}
              style={cat?.key === c.key ? categoryStyle(c) : undefined}
              className={cat?.key === c.key ? 'border-transparent' : ''}
            >
              {c.label}
            </Chip>
          ))}
        </div>
        {filter ? (
          <div className="mt-2 flex">
            <Chip active onClick={() => setParam('filter', '')} className="bg-warn-soft! text-warn!">
              {FILTERS.find((f) => f.key === filter)?.label} <Icon name="x" size={16} />
            </Chip>
          </div>
        ) : null}

        {list.length ? (
          <div className="mt-3 flex flex-col gap-2">
            {list.map((it) => (
              <SwipeRow key={it.id} onDelete={() => onDelete(it)}>
                <MedCard item={it} onOpen={() => navigate(`/edit/${it.id}`)} onQty={(n) => setQty(it.id, n)} />
              </SwipeRow>
            ))}
            <p className="mt-2 px-2 text-center text-[13px] text-muted">Смахни карточку влево, чтобы удалить. Тап — открыть.</p>
          </div>
        ) : (
          <EmptyState
            icon={filter ? 'check' : 'pill'}
            title={filter ? 'Здесь пусто — и это хорошо' : q ? 'Ничего не найдено' : 'Здесь пока пусто'}
            text={filter ? 'Ничего не просрочено и не заканчивается.' : 'Сфотографируй коробку — приложение само заполнит карточку.'}
          >
            {!filter && (
              <Link to={`/add${q.trim() ? `?name=${encodeURIComponent(q.trim())}` : cat ? `?cat=${cat.key}` : ''}`}>
                <Button icon="camera" size="lg">Добавить лекарство</Button>
              </Link>
            )}
          </EmptyState>
        )}
      </div>
    </>
  )
}
