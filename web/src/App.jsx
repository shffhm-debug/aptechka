import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useStore } from './store.jsx'
import BottomNav from './components/BottomNav.jsx'
import Toasts from './components/Toasts.jsx'
import Home from './screens/Home.jsx'
import List from './screens/List.jsx'
import Edit from './screens/Edit.jsx'
import Assistant from './screens/Assistant.jsx'
import Settings from './screens/Settings.jsx'

export default function App() {
  const { configured } = useStore()
  const location = useLocation()

  useEffect(() => { window.scrollTo(0, 0) }, [location.pathname])

  return (
    <div className="min-h-dvh pb-[calc(80px+env(safe-area-inset-bottom))]">
      <Routes>
        <Route path="/" element={configured ? <Home /> : <Navigate to="/settings" replace />} />
        <Route path="/list" element={<List />} />
        <Route path="/add" element={<Edit />} />
        <Route path="/edit/:id" element={<Edit />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
      <Toasts />
    </div>
  )
}
