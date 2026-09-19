import { Icon } from './Icons.jsx'

const BTN = {
  primary: 'bg-accent text-accent-ink active:brightness-95',
  secondary: 'bg-surface text-ink border border-line active:bg-surface-2',
  soft: 'bg-accent-soft text-accent active:brightness-95',
  ghost: 'bg-transparent text-accent active:bg-surface-2',
  danger: 'bg-danger-soft text-danger active:brightness-95',
}
const SIZE = { lg: 'min-h-14 px-5 text-[17px]', md: 'min-h-12 px-4 text-[16px]', sm: 'min-h-10 px-3 text-[15px]' }

export function Button({ variant = 'primary', size = 'md', full = false, icon, className = '', children, ...rest }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-[filter,background-color] select-none disabled:opacity-50 disabled:pointer-events-none ${BTN[variant]} ${SIZE[size]} ${full ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {icon ? <Icon name={icon} size={size === 'lg' ? 24 : 20} /> : null}
      {children}
    </button>
  )
}

export function IconButton({ icon, label, className = '', size = 24, ...rest }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex size-12 items-center justify-center rounded-full text-ink active:bg-surface-2 ${className}`}
      {...rest}
    >
      <Icon name={icon} size={size} />
    </button>
  )
}

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[15px] font-medium text-ink">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[13px] text-muted">{hint}</span> : null}
    </label>
  )
}

const FIELD = 'w-full min-h-13 rounded-[var(--radius-field)] border border-line bg-surface px-4 text-[17px] text-ink placeholder:text-muted/70'

export function Input({ className = '', ...rest }) {
  return <input className={`${FIELD} ${className}`} {...rest} />
}

export function TextArea({ className = '', rows = 3, ...rest }) {
  return <textarea rows={rows} className={`${FIELD} py-3 leading-snug ${className}`} {...rest} />
}

export function Select({ className = '', children, ...rest }) {
  return (
    <select className={`${FIELD} appearance-none bg-[length:20px] bg-[right_14px_center] bg-no-repeat pr-11 ${className}`}
      style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235E6E67' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>\")" }}
      {...rest}
    >
      {children}
    </select>
  )
}

export function Chip({ active = false, className = '', style, children, ...rest }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[15px] font-medium transition-colors ${active ? 'bg-ink text-page' : 'bg-surface border border-line text-ink'} ${className}`}
      style={style}
      {...rest}
    >
      {children}
    </button>
  )
}

/** Крупный переключатель на 2–3 варианта. */
export function Segmented({ options, value, onChange, className = '' }) {
  return (
    <div role="radiogroup" className={`grid gap-1 rounded-2xl bg-surface-2 p-1 ${className}`} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))` }}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`min-h-11 rounded-xl px-2 text-[15px] font-semibold transition-colors ${active ? 'bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,0.08)]' : 'text-muted'}`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

const PILL = {
  danger: 'bg-danger-soft text-danger',
  warn: 'bg-warn-soft text-warn',
  ok: 'bg-ok-soft text-ok',
  muted: 'bg-surface-2 text-muted',
  accent: 'bg-accent-soft text-accent',
}

export function Pill({ kind = 'muted', icon, className = '', style, children }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[13px] font-medium leading-none ${PILL[kind] || ''} ${className}`} style={style}>
      {icon ? <Icon name={icon} size={14} /> : null}
      {children}
    </span>
  )
}

export function Spinner({ size = 22, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={`animate-spin ${className}`} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export function EmptyState({ icon = 'pill', title, text, children }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-surface-2 text-muted">
        <Icon name={icon} size={30} />
      </div>
      <h2 className="text-[20px] font-semibold">{title}</h2>
      {text ? <p className="mt-1.5 max-w-[30ch] text-[15px] text-muted">{text}</p> : null}
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  )
}

export function Card({ className = '', children, ...rest }) {
  return (
    <div className={`rounded-[var(--radius-card)] bg-surface ${className}`} {...rest}>
      {children}
    </div>
  )
}

/** Блок-предупреждение. kind: danger | warn | info */
export function Notice({ kind = 'info', title, children, className = '' }) {
  const styles = {
    danger: 'bg-danger-soft text-danger',
    warn: 'bg-warn-soft text-warn',
    info: 'bg-accent-soft text-accent',
  }
  const icons = { danger: 'alert', warn: 'alert', info: 'info' }
  return (
    <div className={`flex gap-3 rounded-2xl p-4 ${styles[kind]} ${className}`}>
      <Icon name={icons[kind]} size={22} className="mt-0.5 shrink-0" />
      <div className="min-w-0 text-[15px] leading-snug">
        {title ? <div className="font-semibold">{title}</div> : null}
        {children ? <div className={title ? 'mt-0.5' : ''}>{children}</div> : null}
      </div>
    </div>
  )
}
