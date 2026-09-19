import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../store.jsx'
import { humanError, request } from '../api/client.js'
import { Button, Field, Input, Notice, Spinner } from '../components/ui.jsx'
import TopBar from '../components/TopBar.jsx'

export default function Settings() {
  const { settings, setSettings, refresh, toast, lastSync, items } = useStore()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [url, setUrl] = useState(settings.url)
  const [token, setToken] = useState(settings.token)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  // ссылка «поделиться настройками» со второго телефона: #/settings?url=...&token=...
  useEffect(() => {
    const u = params.get('url'); const t = params.get('token')
    if (u) setUrl(u)
    if (t) setToken(t)
  }, [params])

  const dirty = url !== settings.url || token !== settings.token

  const test = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const data = await request({ url: url.trim(), token: token.trim() }, 'list')
      setTestResult({ ok: true, n: data.items?.length ?? 0 })
    } catch (e) {
      setTestResult({ ok: false, error: humanError(e) })
    } finally {
      setTesting(false)
    }
  }

  const save = () => {
    setSettings({ url: url.trim(), token: token.trim(), demo: false })
    toast('Сохранено')
    navigate('/')
  }

  const toggleDemo = () => {
    const demo = !settings.demo
    setSettings({ demo })
    toast(demo ? 'Демо-режим включён' : 'Демо-режим выключен')
    if (demo) navigate('/')
  }

  const share = async () => {
    const link = `${location.origin}${location.pathname}#/settings?url=${encodeURIComponent(settings.url)}&token=${encodeURIComponent(settings.token)}`
    try {
      if (navigator.share) await navigator.share({ title: 'Аптечка — настройки', text: 'Открой ссылку на телефоне и нажми «Сохранить»', url: link })
      else { await navigator.clipboard.writeText(link); toast('Ссылка скопирована') }
    } catch { /* отменили */ }
  }

  return (
    <>
      <TopBar title="Настройки" back backTo="/" />
      <div className="mx-auto flex max-w-[520px] flex-col gap-5 px-4 pb-8">
        {settings.demo && (
          <Notice kind="info" title="Включён демо-режим">
            Данные хранятся только на этом телефоне, помощник отвечает заготовками. Чтобы подключить семейную таблицу — заполни поля ниже.
          </Notice>
        )}

        <Field label="Адрес скрипта" hint="Ссылка Web App из Apps Script, заканчивается на /exec">
          <Input type="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://script.google.com/macros/s/…/exec" autoCapitalize="off" autoCorrect="off" spellCheck={false} />
        </Field>
        <Field label="Семейный токен" hint="Из таблицы: меню Аптечка → «Создать семейный токен»">
          <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="a1b2c3…" autoCapitalize="off" autoCorrect="off" spellCheck={false} />
        </Field>

        <div className="flex flex-col gap-2">
          <Button variant="secondary" size="lg" full onClick={test} disabled={testing || !url.trim() || !token.trim()}>
            {testing ? <><Spinner size={22} /> Проверяю…</> : 'Проверить связь'}
          </Button>
          {testResult && (
            testResult.ok
              ? <Notice kind="info" title="Связь есть">В таблице {testResult.n} позиций.</Notice>
              : <Notice kind="danger" title="Не получилось">{testResult.error}</Notice>
          )}
          <Button size="lg" full icon="check" onClick={save} disabled={!url.trim() || !token.trim() || (!dirty && !settings.demo)}>
            Сохранить
          </Button>
        </div>

        {settings.url && settings.token && !settings.demo && (
          <Button variant="soft" size="md" full icon="share" onClick={share}>Поделиться настройками со вторым телефоном</Button>
        )}

        <div className="mt-2 rounded-2xl bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold">Демо-режим</div>
              <div className="text-[14px] text-muted">Попробовать без таблицы и ключей</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.demo}
              onClick={toggleDemo}
              className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${settings.demo ? 'bg-accent' : 'bg-line'}`}
            >
              <span className={`absolute top-1 size-6 rounded-full bg-white shadow transition-[left] ${settings.demo ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>

        <div className="text-[13px] text-muted">
          {lastSync ? <>Последняя синхронизация: {new Date(lastSync).toLocaleString('ru-RU')} · {items.length} позиций в кэше</> : 'Ещё не синхронизировалось'}
          <br />
          <button type="button" className="mt-1 font-semibold text-accent" onClick={() => refresh().then((ok) => toast(ok ? 'Список обновлён' : 'Не удалось обновить', ok ? {} : { kind: 'error' }))}>Обновить сейчас</button>
        </div>
      </div>
    </>
  )
}
