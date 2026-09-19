import { useStore } from '../store.jsx'
import { Icon } from './Icons.jsx'

export default function Toasts() {
  const { toasts, dismissToast } = useStore()
  if (!toasts.length) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-40 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto flex w-full max-w-[440px] items-center gap-3 rounded-2xl px-4 py-3 text-[15px] shadow-[0_8px_24px_rgba(0,0,0,0.18)] ${t.kind === 'error' ? 'bg-danger text-white' : 'bg-ink text-page'}`}
        >
          {t.kind === 'error' ? <Icon name="alert" size={20} className="shrink-0" /> : null}
          <span className="min-w-0 flex-1 leading-snug">{t.message}</span>
          {t.actionLabel ? (
            <button
              type="button"
              className={`shrink-0 rounded-lg px-2 py-1 font-semibold ${t.kind === 'error' ? 'text-white' : 'text-accent'}`}
              onClick={() => { dismissToast(t.id); t.onAction?.() }}
            >
              {t.actionLabel}
            </button>
          ) : (
            <button type="button" aria-label="Закрыть" className="shrink-0 opacity-70" onClick={() => dismissToast(t.id)}>
              <Icon name="x" size={18} />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
