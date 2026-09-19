import { Icon } from './Icons.jsx'

/** Крупный счётчик количества: − [n] + */
export default function Stepper({ value, onChange, size = 'md', label = 'количество' }) {
  const n = Number(value) || 0
  const btn = size === 'lg' ? 'size-14' : 'size-11'
  const num = size === 'lg' ? 'min-w-14 text-[26px]' : 'min-w-10 text-[20px]'
  return (
    <div className="inline-flex items-center rounded-2xl bg-surface-2" role="group" aria-label={label}>
      <button
        type="button"
        aria-label="Меньше"
        disabled={n <= 0}
        onClick={(e) => { e.stopPropagation(); onChange(Math.max(0, n - 1)) }}
        className={`${btn} flex items-center justify-center rounded-2xl text-ink active:bg-line disabled:opacity-30`}
      >
        <Icon name="minus" size={22} />
      </button>
      <span className={`${num} text-center font-bold tabular-nums ${n === 0 ? 'text-danger' : 'text-ink'}`}>{n}</span>
      <button
        type="button"
        aria-label="Больше"
        onClick={(e) => { e.stopPropagation(); onChange(n + 1) }}
        className={`${btn} flex items-center justify-center rounded-2xl text-ink active:bg-line`}
      >
        <Icon name="plus" size={22} />
      </button>
    </div>
  )
}
