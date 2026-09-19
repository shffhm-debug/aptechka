import { useRef, useState } from 'react'
import { Icon } from './Icons.jsx'

const REVEAL = 92       // ширина кнопки «Удалить»
const FLING = 1.9       // во сколько раз дальше REVEAL надо утянуть, чтобы удалить сразу

/** Свайп влево открывает кнопку «Удалить»; длинный свайп удаляет сразу. Вертикальный скролл не мешает. */
export default function SwipeRow({ onDelete, children }) {
  const [dx, setDx] = useState(0)
  const [animating, setAnimating] = useState(true)
  const dxRef = useRef(0)          // актуальное смещение (state может отставать на один кадр)
  const gesture = useRef(null)
  const lastSwipe = useRef(0)      // чтобы click сразу после жеста не открывал карточку
  const open = dx <= -REVEAL / 2

  const move = (v) => { dxRef.current = v; setDx(v) }

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    gesture.current = { x: e.clientX, y: e.clientY, dx0: dxRef.current, horizontal: null, id: e.pointerId }
    setAnimating(false)
  }

  const onPointerMove = (e) => {
    const g = gesture.current
    if (!g) return
    const mx = e.clientX - g.x
    const my = e.clientY - g.y
    if (g.horizontal === null) {
      if (Math.abs(mx) < 6 && Math.abs(my) < 6) return
      g.horizontal = Math.abs(mx) > Math.abs(my) * 1.2
      if (g.horizontal) {
        try { e.currentTarget.setPointerCapture(g.id) } catch { /* ignore */ }
      }
    }
    if (!g.horizontal) return
    let next = g.dx0 + mx
    if (next > 0) next = 0
    const max = -REVEAL * (FLING + 0.6)
    if (next < max) next = max
    move(next)
  }

  const finish = () => {
    const g = gesture.current
    gesture.current = null
    setAnimating(true)
    if (!g || !g.horizontal) return
    lastSwipe.current = Date.now()
    const cur = dxRef.current
    if (cur <= -REVEAL * FLING) {
      move(-window.innerWidth)
      setTimeout(onDelete, 120)
      return
    }
    move(cur <= -REVEAL / 2 ? -REVEAL : 0)
  }

  const onClickCapture = (e) => {
    // click, который браузер синтезирует сразу после жеста, — игнорируем;
    // тап по открытой карточке — только закрывает её
    if (Date.now() - lastSwipe.current < 400) {
      e.stopPropagation()
      e.preventDefault()
      return
    }
    if (open) {
      e.stopPropagation()
      e.preventDefault()
      move(0)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-card)]">
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        aria-hidden={!open}
        onClick={() => { move(-window.innerWidth); setTimeout(onDelete, 120) }}
        className="absolute inset-y-0 right-0 flex flex-col items-center justify-center gap-1 bg-danger text-white"
        style={{ width: REVEAL }}
      >
        <Icon name="trash" size={22} />
        <span className="text-[13px] font-semibold">Удалить</span>
      </button>
      <div
        className="swipe-row relative"
        style={{ transform: `translateX(${dx}px)`, transition: animating ? 'transform 180ms ease-out' : 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finish}
        onPointerCancel={finish}
        onClickCapture={onClickCapture}
      >
        {children}
      </div>
    </div>
  )
}
