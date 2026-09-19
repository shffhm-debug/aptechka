import { useNavigate } from 'react-router-dom'
import { IconButton } from './ui.jsx'

/** Шапка экрана: назад (опционально), заголовок, действие справа. */
export default function TopBar({ title, back = false, backTo, right, subtitle }) {
  const navigate = useNavigate()
  const goBack = () => {
    if (backTo) navigate(backTo)
    else if (window.history.length > 1) navigate(-1)
    else navigate('/')
  }
  return (
    <header className="pt-safe sticky top-0 z-20 bg-page/90 backdrop-blur-sm">
      <div className="mx-auto flex min-h-16 max-w-[520px] items-center gap-1 px-2">
        {back ? <IconButton icon="back" label="Назад" onClick={goBack} /> : <span className="w-2" />}
        <div className="min-w-0 flex-1 px-1">
          <h1 className="truncate text-[22px] font-bold leading-tight">{title}</h1>
          {subtitle ? <div className="truncate text-[13px] text-muted">{subtitle}</div> : null}
        </div>
        {right}
      </div>
    </header>
  )
}
