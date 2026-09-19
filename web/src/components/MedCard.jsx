import { categoryOf, categoryStyle } from '../config/categories.js'
import { unitWord } from '../config/forms.js'
import { expiryStatus, formatExpiry } from '../lib/dates.js'
import { stockStatus } from '../lib/stock.js'
import { CategoryIcon } from './Icons.jsx'
import { Pill } from './ui.jsx'
import Stepper from './Stepper.jsx'

/** Карточка лекарства. Тап — открыть, −/+ — количество. */
export default function MedCard({ item, onOpen, onQty }) {
  const cat = categoryOf(item)
  const title = item.название_рус || item.название
  const subtitle = item.название_рус && item.название !== item.название_рус ? item.название : ''
  const meta = [subtitle, item.форма, item.дозировка].filter(Boolean).join(' · ')
  const exp = expiryStatus(item.срок_годности)
  const stock = stockStatus(item)
  const qty = Number(item.количество) || 0

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen?.() } }}
      className="flex gap-3 rounded-[var(--radius-card)] bg-surface p-3 active:bg-surface-2"
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl" style={categoryStyle(cat)}>
        <CategoryIcon catKey={cat.key} size={24} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[17px] font-semibold leading-tight">{title}</div>
        {meta ? <div className="mt-0.5 text-[14px] leading-snug text-muted">{meta}</div> : null}
        {item.действующее_вещество ? (
          <div className="mt-0.5 truncate text-[13px] text-muted">{item.действующее_вещество}</div>
        ) : null}

        <div className="mt-2 flex items-end justify-between gap-2">
          <div className="flex min-w-0 flex-wrap gap-1.5 pb-1">
            {exp === 'expired' && <Pill kind="danger" icon="alert">просрочено {formatExpiry(item.срок_годности)}</Pill>}
            {exp === 'soon' && <Pill kind="warn" icon="clock">до {formatExpiry(item.срок_годности)}</Pill>}
            {exp === 'ok' && <Pill kind="muted">до {formatExpiry(item.срок_годности)}</Pill>}
            {stock === 'out' && <Pill kind="danger">закончилось</Pill>}
            {stock === 'low' && <Pill kind="warn">заканчивается</Pill>}
            {item.для_кого === 'детский' && <Pill kind="accent">детское</Pill>}
          </div>
          <div className="flex shrink-0 flex-col items-center">
            <Stepper value={qty} onChange={(n) => onQty?.(n)} />
            <span className="mt-0.5 text-[12px] leading-none text-muted">{unitWord(item.форма, qty)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
