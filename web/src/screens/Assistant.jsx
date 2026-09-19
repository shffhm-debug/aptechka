import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store.jsx'
import { fileToImagePayload } from '../lib/image.js'
import { humanError } from '../api/client.js'
import { Icon } from '../components/Icons.jsx'
import { Button, Card, Field, Input, Notice, Pill, Segmented, Spinner, TextArea } from '../components/ui.jsx'
import TopBar from '../components/TopBar.jsx'

export default function Assistant() {
  const [mode, setMode] = useState('symptoms')
  return (
    <>
      <TopBar title="Помощник" subtitle="подсказка по тому, что есть дома" />
      <div className="mx-auto max-w-[520px] px-4 pb-8">
        <Segmented
          value={mode}
          onChange={setMode}
          options={[{ value: 'symptoms', label: 'Что-то болит' }, { value: 'prescription', label: 'Рецепт врача' }]}
        />
        <div className="mt-4">
          {mode === 'symptoms' ? <Symptoms /> : <Prescription />}
        </div>
      </div>
    </>
  )
}

function useAsk(mode) {
  const { ai, toast, configured } = useStore()
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const ask = async (payload) => {
    if (!configured) { toast('Сначала подключи приложение в настройках', { kind: 'error' }); return }
    setBusy(true)
    setResult(null)
    try {
      setResult(await ai(mode, payload))
    } catch (e) {
      toast(humanError(e), { kind: 'error' })
    } finally {
      setBusy(false)
    }
  }
  return { busy, result, ask, reset: () => setResult(null) }
}

/* ---------------- Что-то болит ---------------- */

function Symptoms() {
  const [text, setText] = useState('')
  const [who, setWho] = useState('взрослый')
  const [age, setAge] = useState('')
  const { busy, result, ask } = useAsk('symptoms')

  return (
    <div className="flex flex-col gap-4">
      <Field label="Что беспокоит?">
        <TextArea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="температура 38.5 и болит горло со вчера" />
      </Field>
      <div>
        <span className="mb-1.5 block text-[15px] font-medium">Для кого</span>
        <Segmented value={who} onChange={setWho} options={[{ value: 'взрослый', label: 'Взрослый' }, { value: 'ребёнок', label: 'Ребёнок' }]} />
      </div>
      {who === 'ребёнок' && (
        <Field label="Возраст ребёнка" hint="Например: 8 месяцев, 3 года, 12 лет">
          <Input value={age} onChange={(e) => setAge(e.target.value)} placeholder="3 года" inputMode="text" />
        </Field>
      )}
      <Button size="lg" full icon="sparkle" onClick={() => ask({ symptoms: text, who, age })} disabled={busy || !text.trim() || (who === 'ребёнок' && !age.trim())}>
        {busy ? <><Spinner size={22} /> Смотрю аптечку…</> : 'Подобрать из аптечки'}
      </Button>

      {result && <SymptomsResult r={result} />}
    </div>
  )
}

function SymptomsResult({ r }) {
  return (
    <div className="flex flex-col gap-3">
      {r.срочно && <Notice kind="danger" title="Сначала — за помощью">{r.срочно_текст}</Notice>}

      <Section title="Подходит из того, что есть" empty={!r.подходит?.length} emptyText="Из домашней аптечки ничего подходящего нет.">
        {r.подходит?.map((x, i) => (
          <ItemCard key={i} id={x.id} name={x.название} kind="ok">
            <p>{x.почему}</p>
            {x.как_принимать ? <p className="mt-1.5 font-medium">{x.как_принимать}</p> : null}
            {x.предупреждение ? <Warn>{x.предупреждение}</Warn> : null}
          </ItemCard>
        ))}
      </Section>

      {r.не_подходит?.length ? (
        <Section title="Лучше не брать">
          {r.не_подходит.map((x, i) => (
            <ItemCard key={i} id={x.id} name={x.название} kind="warn"><p>{x.почему}</p></ItemCard>
          ))}
        </Section>
      ) : null}

      {r.дублирование?.length ? (
        <Notice kind="warn" title="Одно и то же вещество в разных препаратах">
          <ul className="list-disc pl-4">{r.дублирование.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </Notice>
      ) : null}

      {r.нет_дома?.length ? (
        <Card className="p-4">
          <div className="mb-1 flex items-center gap-2 font-semibold"><Icon name="cart" size={20} className="text-muted" /> Нет дома</div>
          <ul className="list-disc pl-5 text-[15px]">{r.нет_дома.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </Card>
      ) : null}

      {r.общий_совет ? <Card className="p-4 text-[15px]">{r.общий_совет}</Card> : null}
      <Disclaimer text={r.disclaimer} />
    </div>
  )
}

/* ---------------- Рецепт врача ---------------- */

function Prescription() {
  const [text, setText] = useState('')
  const [img, setImg] = useState(null)
  const [reading, setReading] = useState(false)
  const cameraRef = useRef(null)
  const galleryRef = useRef(null)
  const { toast } = useStore()
  const { busy, result, ask } = useAsk('prescription')

  const onPhoto = async (file) => {
    if (!file) return
    setReading(true)
    try { setImg(await fileToImagePayload(file)) } catch (e) { toast(humanError(e), { kind: 'error' }) } finally {
      setReading(false)
      if (cameraRef.current) cameraRef.current.value = ''
      if (galleryRef.current) galleryRef.current.value = ''
    }
  }

  const submit = () => ask({ text, image: img ? { media_type: img.media_type, data: img.data } : undefined })

  return (
    <div className="flex flex-col gap-4">
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />

      {img ? (
        <div className="flex items-center gap-3 rounded-2xl bg-surface p-3">
          <img src={img.preview} alt="Рецепт" className="size-20 shrink-0 rounded-xl object-cover" />
          <div className="min-w-0 flex-1 text-[15px] font-medium">Фото рецепта добавлено</div>
          <button type="button" aria-label="Убрать фото" onClick={() => setImg(null)} className="flex size-11 items-center justify-center rounded-full text-muted active:bg-surface-2">
            <Icon name="x" size={22} />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="soft" size="lg" icon="camera" onClick={() => cameraRef.current?.click()} disabled={reading}>
            {reading ? 'Читаю…' : 'Сфотографировать'}
          </Button>
          <Button variant="secondary" size="lg" icon="image" onClick={() => galleryRef.current?.click()} disabled={reading}>Из галереи</Button>
        </div>
      )}

      <Field label={img ? 'Уточнения (необязательно)' : 'Или впиши назначения текстом'}>
        <TextArea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Cetirizin 10 mg 1 р/д 7 дней; Paracetamol 325 при температуре" />
      </Field>

      <Button size="lg" full icon="sparkle" onClick={submit} disabled={busy || (!text.trim() && !img)}>
        {busy ? <><Spinner size={22} /> Сверяю с аптечкой…</> : 'Сверить с аптечкой'}
      </Button>

      {result && <PrescriptionResult r={result} />}
    </div>
  )
}

const STATUS = {
  'точное': { kind: 'ok', label: 'Есть дома' },
  'аналог': { kind: 'warn', label: 'Есть аналог по МНН' },
  'нет': { kind: 'danger', label: 'Нет дома' },
}

function PrescriptionResult({ r }) {
  const { toast } = useStore()
  const buyText = (r.купить || []).map((t) => '• ' + t).join('\n')
  const copyBuy = async () => {
    try { await navigator.clipboard.writeText(buyText); toast('Список скопирован') } catch { toast('Не удалось скопировать', { kind: 'error' }) }
  }
  return (
    <div className="flex flex-col gap-3">
      {r.срочно && <Notice kind="danger" title="Сначала — за помощью">{r.срочно_текст}</Notice>}

      <Section title="Назначения" empty={!r.назначения?.length} emptyText="Не удалось разобрать назначения. Попробуй сфотографировать чётче или впиши текстом.">
        {r.назначения?.map((x, i) => {
          const s = STATUS[x.статус] || STATUS['нет']
          return (
            <Card key={i} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[17px] font-semibold leading-tight">{x.назначено}</div>
                  <div className="mt-0.5 text-[14px] text-muted">
                    {[x.мнн, x.дозировка, x.форма].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <Pill kind={s.kind} className="shrink-0">{s.label}</Pill>
              </div>
              {x.схема ? <div className="mt-2 text-[15px]">{x.схема}</div> : null}
              {x.статус !== 'нет' && x.найдено_название ? (
                <div className="mt-3 rounded-xl bg-surface-2 p-3 text-[15px]">
                  <div className="flex items-center gap-2">
                    <Icon name="check" size={18} className="text-ok" />
                    <span>Дома: </span>
                    {x.найдено_id ? <Link to={`/edit/${x.найдено_id}`} className="font-semibold text-accent underline">{x.найдено_название}</Link> : <b>{x.найдено_название}</b>}
                  </div>
                  {x.отличия ? <div className="mt-1.5 text-warn">{x.отличия}</div> : null}
                </div>
              ) : null}
              {x.примечание ? <Warn>{x.примечание}</Warn> : null}
            </Card>
          )
        })}
      </Section>

      {r.купить?.length ? (
        <Card className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold"><Icon name="cart" size={20} className="text-muted" /> Купить</div>
            <Button variant="ghost" size="sm" icon="copy" onClick={copyBuy}>Скопировать</Button>
          </div>
          <ul className="list-disc pl-5 text-[15px]">{r.купить.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </Card>
      ) : null}

      {r.дублирование?.length ? (
        <Notice kind="warn" title="Одно и то же вещество в разных препаратах">
          <ul className="list-disc pl-4">{r.дублирование.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </Notice>
      ) : null}
      {r.предупреждения?.length ? (
        <Notice kind="info">
          <ul className={r.предупреждения.length > 1 ? 'list-disc pl-4' : ''}>{r.предупреждения.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </Notice>
      ) : null}
      <Disclaimer text={r.disclaimer} />
    </div>
  )
}

/* ---------------- общие кусочки ---------------- */

function Section({ title, empty, emptyText, children }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-[15px] font-semibold text-muted">{title}</h2>
      {empty ? <Card className="p-4 text-[15px] text-muted">{emptyText}</Card> : <div className="flex flex-col gap-2">{children}</div>}
    </section>
  )
}

function ItemCard({ id, name, kind, children }) {
  const bar = kind === 'ok' ? 'bg-ok' : kind === 'warn' ? 'bg-warn' : 'bg-danger'
  return (
    <Card className="flex overflow-hidden">
      <div className={`w-1.5 shrink-0 ${bar}`} />
      <div className="min-w-0 flex-1 p-4 text-[15px]">
        {id ? <Link to={`/edit/${id}`} className="text-[17px] font-semibold text-accent underline decoration-accent/40">{name}</Link> : <div className="text-[17px] font-semibold">{name}</div>}
        <div className="mt-1">{children}</div>
      </div>
    </Card>
  )
}

function Warn({ children }) {
  return (
    <div className="mt-2 flex gap-2 text-[14px] text-warn">
      <Icon name="alert" size={18} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

function Disclaimer({ text }) {
  return <p className="px-1 text-center text-[13px] text-muted">{text || 'Это подсказка, а не замена врачу.'}</p>
}
