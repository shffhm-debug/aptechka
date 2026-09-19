import { NavLink } from 'react-router-dom'
import { Icon } from './Icons.jsx'

const TABS = [
  { to: '/', icon: 'home', label: 'Главная', end: true },
  { to: '/list', icon: 'list', label: 'Список' },
  { to: '/add', icon: 'plus', label: 'Добавить' },
  { to: '/assistant', icon: 'sparkle', label: 'Помощник' },
]

export default function BottomNav() {
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-[520px] grid-cols-4">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `flex min-h-16 flex-col items-center justify-center gap-0.5 text-[12px] font-medium ${isActive ? 'text-accent' : 'text-muted'}`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`flex h-8 w-14 items-center justify-center rounded-full ${isActive ? 'bg-accent-soft' : ''}`}>
                  <Icon name={t.icon} size={24} strokeWidth={isActive ? 2.4 : 2} />
                </span>
                {t.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
