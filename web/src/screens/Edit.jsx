import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useStore } from '../store.jsx'
import { CATEGORIES, CATEGORY_BY_KEY, FOR_WHOM, categoryStyle } from '../config/categories.js'
import { FORMS } from '../config/forms.js'
import { isoToMonth, monthToIso } from '../lib/dates.js'
import { fileToImagePayload } from '../lib/image.js'
import { humanError } from '../api/client.js'
import { CategoryIcon, Icon } from '../components/Icons.jsx'
import { Button, Field, Input, Notice, Segmented, Select, Spinner, TextArea } from '../components/ui.jsx'
import Stepper from '../components/Stepper.jsx'
import TopBar from '../components/TopBar.jsx'

const blank = (over = {}) => ({
  название: '', название_рус: '', действующее_вещество: '', форма: '', дозировка: '', количество: 1,
  срок_годности: '', категория: 'Прочее', для_кого: 'взрослый', место_хранения: '', заметка: '', ...over,
})

export default function Edit() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { items, add, update, remove, ai, toast, configured } = useStore()
  const existing = id ? items.find((x) => x.id === id) : null
  const isNew = !id

  const [form, setForm] = useState(() =>
    existing ? { ...blank(), ...existing } : blank({
      название: params.get('name') || '',
      категория: CATEGORY_BY_KEY[params.get('cat') || '']?.label || 'Прочее',
    }),
  )
  const [saving, setSaving] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scan, setScan] = useState(null) // { preview, уверенность, комментарий }
  const cameraRef = useRef(null)
  const galleryRef = useRef(null)

  useEffect(() => {
    if (id && !existing && items.length) navigate('/list', { replace: true })
  }, [id, existing, items.length, navigate])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const onPhoto = async (file) => {
    if (!file) return
    setScanning(true)
    setScan(null)
    try {
      const img = await fileToImagePayload(file)
      const res = await ai('extract', { image: { media_type: img.media_type, data: img.data } })
      setForm((f) => ({
        ...f,
        название: res.название || f.название,
        название_рус: res.название_рус || f.название_рус,
        действующее_вещество: res.действующее_вещество || f.действующее_вещество,
        форма: res.форма || f.форма,
        дозировка: res.дозировка || f.дозировка,
        количество: res.количество || f.количество || 1,
        срок_годности: res.срок_годности || f.срок_годности,
        категория: res.категория || f.категория,
        для_кого: res.для_кого || f.для_кого,
        заметка: res.заметка || f.заметка,
      }))
      setScan({ preview: img.preview, уверенность: res.уверенность, комментарий: res.комментарий })
    } catch (e) {
      toast(humanError(e), { kind: 'error' })
    } finally {
      setScanning(false)
      if (cameraRef.current) cameraRef.current.value = ''
      if (galleryRef.current) galleryRef.current.value = ''
    }
  }

  const onSave = async () => {
    if (!form.название.trim()) {
      toast('Укажи название', { kind: 'error' })
      return
    }
    setSaving(true)
    try {
      const payload = { ...form, название: form.название.trim(), количество: Number(form.количество) || 0 }
      if (isNew) await add(payload)
      else await update({ ...payload, id })
      toast(isNew ? 'Добавлено' : 'Сохранено')
      navigate(isNew ? '/list' : -1)
    } catch (e) {
      toast(humanError(e), { kind: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async () => {
    navigate('/list', { replace: true })
    try { await remove(id) } catch (e) { toast(humanError(e), { kind: 'error' }) }
  }

  const title = isNew ? 'Добавить' : 'Редактировать'

  return (
    <>
      <TopBar title={title} back backTo={isNew ? '/' : undefined} />

      <div className="mx-auto max-w-[520px] px-4 pb-8">
        {isNew && (
          <div className="mb-5">
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
            <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
            <button
              type="button"
              disabled={scanning || !configured}
              onClick={() => cameraRef.current?.click()}
              className="flex min-h-[112px] w-full items-center gap-4 rounded-[var(--radius-card)] bg-accent px-5 text-left text-accent-ink active:brightness-95 disabled:opacity-60"
            >
              <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                {scanning ? <Spinner size={30} /> : <Icon name="camera" size={34} />}
              </span>
              <span>
                <span className="block text-[20px] font-bold leading-tight">{scanning ? 'Распознаю…' : 'Сфотографировать коробку'}</span>
                <span className="mt-1 block text-[14px] opacity-85">{scanning ? 'Обычно 5–10 секунд' : 'Название, состав, срок и категория заполнятся сами'}</span>
              </span>
            </button>
            <button type="button" disabled={scanning || !configured} onClick={() => galleryRef.current?.click()} className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 text-[15px] font-semibold text-accent disabled:opacity-50">
              <Icon name="image" size={20} /> Выбрать фото из галереи
            </button>
            {!configured && <p className="mt-1 text-center text-[13px] text-muted">Распознавание заработает после подключения в настройках.</p>}
          </div>
        )}

        {scan && (
          <div className="mb-5 flex gap-3 rounded-2xl bg-surface p-3">
            <img src={scan.preview} alt="" className="size-16 shrink-0 rounded-xl object-cover" />
            <div className="min-w-0 text-[14px]">
              <div className="font-semibold">
                {scan.уверенность >= 0.7 ? 'Распознано — проверь поля' : 'Распознано неуверенно — проверь внимательно'}
              </div>
              {scan.комментарий ? <div className="mt-0.5 text-muted">{scan.комментарий}</div> : null}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <Field label="Название" hint="Как на упаковке">
            <Input value={form.название} onChange={(e) => set('название', e.target.value)} placeholder="Nurofen" autoCapitalize="words" />
          </Field>
          <Field label="Русское название">
            <Input value={form.название_рус} onChange={(e) => set('название_рус', e.target.value)} placeholder="Нурофен" />
          </Field>
          <Field label="Действующее вещество (МНН)" hint="Нужно помощнику, чтобы находить аналоги">
            <Input value={form.действующее_вещество} onChange={(e) => set('действующее_вещество', e.target.value)} placeholder="ибупрофен" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Форма">
              <Select value={form.форма} onChange={(e) => set('форма', e.target.value)}>
                <option value="">—</option>
                {FORMS.map((f) => <option key={f} value={f}>{f}</option>)}
              </Select>
            </Field>
            <Field label="Дозировка">
              <Input value={form.дозировка} onChange={(e) => set('дозировка', e.target.value)} placeholder="200 мг" />
            </Field>
          </div>

          <div className="grid grid-cols-[auto_1fr] gap-3">
            <div>
              <span className="mb-1.5 block text-[15px] font-medium">Количество</span>
              <Stepper value={form.количество} onChange={(n) => set('количество', n)} size="lg" />
            </div>
            <Field label="Годен до" hint="Месяц с упаковки">
              <Input type="month" value={isoToMonth(form.срок_годности)} onChange={(e) => set('срок_годности', monthToIso(e.target.value))} />
            </Field>
          </div>

          <div>
            <span className="mb-1.5 block text-[15px] font-medium">Категория</span>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((c) => {
                const active = form.категория === c.label
                return (
                  <button
                    key={c.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => set('категория', c.label)}
                    className={`flex min-h-12 items-center gap-2.5 rounded-2xl px-3 text-left text-[15px] font-semibold ring-2 ring-inset ${active ? 'ring-current' : 'ring-transparent opacity-70'}`}
                    style={categoryStyle(c)}
                  >
                    <CategoryIcon catKey={c.key} size={22} />
                    <span className="truncate">{c.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-[15px] font-medium">Для кого</span>
            <Segmented
              value={form.для_кого}
              onChange={(v) => set('для_кого', v)}
              options={FOR_WHOM.map((v) => ({ value: v, label: v === 'взрослый' ? 'Взрослый' : v === 'детский' ? 'Детский' : 'Все' }))}
            />
          </div>

          <Field label="Где лежит">
            <Input value={form.место_хранения} onChange={(e) => set('место_хранения', e.target.value)} placeholder="кухня, верхняя полка" />
          </Field>
          <Field label="Заметка">
            <TextArea value={form.заметка} onChange={(e) => set('заметка', e.target.value)} placeholder="от чего, кому, особенности" rows={2} />
          </Field>

          {!isNew && existing?.обновлено ? (
            <p className="text-[13px] text-muted">Обновлено {existing.обновлено.replace('T', ' ').slice(0, 16)}</p>
          ) : null}
        </div>

        <div className="sticky bottom-[calc(72px+env(safe-area-inset-bottom))] mt-6 bg-page/95 py-2 backdrop-blur-sm">
          <Button size="lg" full icon="check" onClick={onSave} disabled={saving || scanning}>
            {saving ? 'Сохраняю…' : 'Сохранить'}
          </Button>
        </div>

        {!isNew && (
          <Button variant="danger" size="md" full icon="trash" onClick={onDelete} disabled={saving} className="mt-4">
            Удалить из аптечки
          </Button>
        )}

        {!configured && !isNew && (
          <Notice kind="warn" className="mt-4">Изменения сохранятся только после подключения в настройках.</Notice>
        )}
      </div>
    </>
  )
}
