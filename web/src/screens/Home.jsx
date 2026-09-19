import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store.jsx'
import { CATEGORIES, categoryOf, categoryStyle } from '../config/categories.js'
import { plural } from '../config/forms.js'
import { matches, sortByName } from '../lib/search.js'
import { summarize } from '../lib/stock.js'
import { CategoryIcon, Icon } from '../components/Icons.jsx'
import { IconButton, Notice } from '../components/ui.jsx'
import MedCard from '../components/MedCard.jsx'
import TopBar from '../components/TopBar.jsx'

export default function Home() {
  const { items, setQty, syncing, syncError, lastSync, configured, settings } = useStore()
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const counts = useMemo(() => {
    const c = {}
    for (const it of items) { const k = categoryOf(it).key; c[k] = (c[k] || 0) + 1 }
    return c
  }, [items])
  const stats = useMemo(() => summarize(items), [items])
  const results = useMemo(() => (q.trim() ? sortByName(items.filter((it) => matches(it, q))) : null), [items, q])

  return (
    <>
      <TopBar
        title="Аптечка"
        subtitle={settings.demo ? 'демо-режим' : lastSync ? `${items.length} ${plural(items.length, ['позиция', 'позиции', 'позиций'])}` : ''}
        right={<IconButton icon="settings" label="Настройки" onClick={() => navigate('/settings')} />}
      />

      <div className="mx-auto max-w-[520px] px-4 pb-6">
        <label className="relative block">
          <span className="sr-only">Поиск лекарства</span>
          <Icon name="search" size={24} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Найти лекарство"
            enterKeyHint="search"
            autoComplete="off"
            className="min-h-14 w-full rounded-2xl border border-line bg-surface pl-13 pr-12 text-[18px] placeholder:text-muted/70"
          />
          {q ? (
            <button type="button" aria-label="Очистить" onClick={() => setQ('')} className="absolute right-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-muted active:bg-surface-2">
              <Icon name="x" size={20} />
            </button>
          ) : null}
        </label>

        {!configured && (
          <Notice kind="info" title="Приложение ещё не подключено" className="mt-4">
            Открой <Link to="/settings" className="font-semibold underline">настройки</Link> и введи адрес скрипта и семейный токен, или включи демо-режим.
          </Notice>
        )}
        {configured && syncError && !syncing && (
          <Notice kind="warn" title={items.length ? 'Показан сохранённый список' : 'Не удалось загрузить список'} className="mt-4">
            {syncError}
          </Notice>
        )}

        {results ? (
          <section className="mt-4">
            <h2 className="mb-2 px-1 text-[15px] text-muted">
              {results.length ? `Найдено: ${results.length}` : 'Ничего не найдено'}
            </h2>
            <div className="flex flex-col gap-2">
              {results.map((it) => (
                <MedCard key={it.id} item={it} onOpen={() => navigate(`/edit/${it.id}`)} onQty={(n) => setQty(it.id, n)} />
              ))}
            </div>
            {!results.length && (
              <Link to={`/add?name=${encodeURIComponent(q.trim())}`} className="mt-3 flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-accent-soft text-[16px] font-semibold text-accent">
                <Icon name="plus" size={22} /> Добавить «{q.trim()}»
              </Link>
            )}
          </section>
        ) : (
          <>
            {(stats.expired > 0 || stats.soon > 0 || stats.low + stats.out > 0) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {stats.expired > 0 && <StatusLink to="/list?filter=expired" kind="danger" icon="alert" n={stats.expired} words={['просрочено', 'просрочено', 'просрочено']} />}
                {stats.soon > 0 && <StatusLink to="/list?filter=soon" kind="warn" icon="clock" n={stats.soon} words={['истекает срок', 'истекает срок', 'истекает срок']} />}
                {stats.low + stats.out > 0 && <StatusLink to="/list?filter=low" kind="warn" icon="pill" n={stats.low + stats.out} words={['заканчивается', 'заканчиваются', 'заканчиваются']} />}
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3">
              {CATEGORIES.map((c) => (
                <Link
                  key={c.key}
                  to={`/list?cat=${c.key}`}
                  className="flex min-h-[132px] flex-col justify-between rounded-[var(--radius-card)] p-4 active:brightness-95"
                  style={categoryStyle(c)}
                >
                  <CategoryIcon catKey={c.key} size={34} />
                  <div>
                    <div className="text-[18px] font-bold leading-tight">{c.label}</div>
                    <div className="mt-0.5 text-[14px] opacity-80">
                      {counts[c.key] ? `${counts[c.key]} ${plural(counts[c.key], ['позиция', 'позиции', 'позиций'])}` : 'пусто'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <Link to="/list" className="mt-3 flex min-h-14 items-center justify-between rounded-2xl bg-surface px-4 text-[16px] font-semibold active:bg-surface-2">
              <span>Все лекарства</span>
              <span className="flex items-center gap-1 text-muted">{items.length} <Icon name="forward" size={20} /></span>
            </Link>
          </>
        )}
      </div>
    </>
  )
}

function StatusLink({ to, kind, icon, n, words }) {
  const cls = kind === 'danger' ? 'bg-danger-soft text-danger' : 'bg-warn-soft text-warn'
  return (
    <Link to={to} className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-[15px] font-semibold ${cls}`}>
      <Icon name={icon} size={18} />
      {n} · {plural(n, words)}
    </Link>
  )
}
