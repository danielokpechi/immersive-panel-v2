import type { CSSProperties, ReactNode } from 'react'
import { A, PEOPLE, type Crew, type CrewEvent, type Rsvp } from '../data'
import { useStore } from '../store'
import { Icon } from './Icon'

export function Avatar({ id, size = 28 }: { id: string; size?: number }) {
  const p = PEOPLE[id] ?? { initials: '?', color: '#999', name: 'Fan' }
  if ('photo' in p && p.photo) return <img src={p.photo} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  return (
    <div aria-hidden="true" style={{ width: size, height: size, borderRadius: '50%', background: p.color, color: '#fff', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(size * 0.4), fontWeight: 500 }}>{p.initials}</div>
  )
}

export function AvatarStack({ ids, size = 22, ring = 'var(--bubble)' }: { ids: string[]; size?: number; ring?: string }) {
  return (
    <div style={{ display: 'flex' }}>
      {ids.map((id, i) => (
        <div key={id} style={{ marginLeft: i ? -7 : 0, borderRadius: '50%', border: `2px solid ${ring}` }}><Avatar id={id} size={size} /></div>
      ))}
    </div>
  )
}

export function CrewAvatar({ crew, size = 44, ring }: { crew: Crew; size?: number; ring?: string }) {
  return (
    <div aria-hidden="true" style={{ width: size + (ring ? 6 : 0), height: size + (ring ? 6 : 0), borderRadius: '50%', flexShrink: 0,
      border: ring ? `3px solid ${ring}` : undefined, background: crew.color, color: '#fff', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: Math.round(size * 0.34), fontWeight: 700, letterSpacing: 0.3 }}>{crew.initials}</div>
  )
}

export function PrivacyTag({ crew }: { crew: Crew }) {
  return crew.visibility === 'private'
    ? <span className="tag private"><Icon name="lock" size={10} stroke={2.2} />Private</span>
    : <span className="tag public"><Icon name="globe" size={10} stroke={2} />Public</span>
}

/** The club hero that sits behind every panel. */
export function Hero({ dim = false }: { dim?: boolean }) {
  const { push } = useStore()
  return (
    <div className="hero">
      <img className="bg" src={A('stadium.png')} alt="" />
      <button aria-label="Ask IRIS" onClick={() => push({ name: 'iris' })}
        style={{ position: 'absolute', left: 17, top: 66, width: 44, height: 44, padding: 0, border: 0, background: 'none' }}>
        <img src={A('iris-button.png')} alt="" width={44} height={44} />
      </button>
      {!dim && <span style={{ position: 'absolute', left: 17, top: 118, height: 22, padding: '0 10px', borderRadius: 11, background: '#f2f0ed',
        border: '1px solid #cfcac3', fontSize: 12, display: 'flex', alignItems: 'center' }}>Ask IRIS</span>}
      <img src={A('arsenal-crest.png')} alt="Arsenal crest" style={{ position: 'absolute', left: 'calc(50% - 43px)', top: 44, width: 86, height: 86 }} />
      <div className="title">Arsenal</div>
      <ShareButton dim={dim} />
    </div>
  )
}

function ShareButton({ dim }: { dim: boolean }) {
  const { toast } = useStore()
  const share = async () => {
    const data = { title: 'Arsenal on Connect', url: location.href }
    try {
      if (navigator.share) await navigator.share(data)
      else { await navigator.clipboard.writeText(data.url); toast('Link copied') }
    } catch { /* user cancelled */ }
  }
  return (
    <button aria-label="Share" onClick={share} style={{ position: 'absolute', right: 17, top: 66, width: 44, height: 44, borderRadius: 12,
      background: '#f2f0ed', border: '1px solid #cfcac3', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: dim ? 0.15 : 1 }}>
      <Icon name="share" size={20} />
    </button>
  )
}

/** Full-height surface over the hero (chat, crews, forms). */
export function Panel({ head, children, foot, bodyRef }: { head: ReactNode; children: ReactNode; foot?: ReactNode; bodyRef?: React.Ref<HTMLDivElement> }) {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Hero dim />
      <div className="panel">
        <div className="panel-head">{head}</div>
        <div className="panel-body scroll" ref={bodyRef}>{children}</div>
        {foot && <div className="panel-foot">{foot}</div>}
      </div>
    </div>
  )
}

export function BackHead({ title, sub, right, onBack }: { title: ReactNode; sub?: ReactNode; right?: ReactNode; onBack?: () => void }) {
  const { back } = useStore()
  return (
    <>
      <div className="row grow">
        <button className="btn round" aria-label="Back" onClick={onBack ?? back}><Icon name="left" /></button>
        <div className="grow">
          <div className="ellipsis" style={{ fontWeight: 500 }}>{title}</div>
          {sub && <div className="xs muted ellipsis">{sub}</div>}
        </div>
      </div>
      {right}
    </>
  )
}

export function Sheet({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  const { open } = useStore()
  return (
    <>
      <div className="sheet-scrim" onClick={onClose ?? (() => open(null))} />
      <div className="sheet" role="dialog" aria-modal="true">{children}</div>
    </>
  )
}

export function SheetTop({ icon, label, onClose }: { icon: ReactNode; label: ReactNode; onClose?: () => void }) {
  const { open } = useStore()
  return (
    <div className="row" style={{ justifyContent: 'space-between' }}>
      <span className="chip ellipsis">{icon}<span className="ellipsis">{label}</span></span>
      <button className="btn icon" aria-label="Close" onClick={onClose ?? (() => open(null))}><Icon name="x" size={16} /></button>
    </div>
  )
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return <button className="toggle" role="switch" aria-checked={on} aria-label={label} onClick={onChange} />
}

export function MenuRow({ icon, label, sub, danger, onClick, right }: { icon: string; label: string; sub?: string; danger?: boolean; onClick?: () => void; right?: ReactNode }) {
  const color = danger ? 'var(--danger)' : 'var(--ink)'
  const body = (
    <>
      <span style={{ width: 36, height: 36, borderRadius: '50%', background: danger ? 'var(--danger-soft)' : 'var(--bubble)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={icon} size={17} color={color} /></span>
      <span className="grow" style={{ textAlign: 'left' }}>
        <span style={{ display: 'block', fontWeight: 500, color }}>{label}</span>
        {sub && <span className="xs muted" style={{ display: 'block' }}>{sub}</span>}
      </span>
      {right}
    </>
  )
  const st: CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 4px', border: 0,
    borderBottom: danger ? 0 : '1px solid var(--line)', background: 'none' }
  return right
    ? <div style={st}>{body}</div>
    : <button style={st} onClick={onClick}>{body}</button>
}

export function DateBlock({ e, size = 44 }: { e: CrewEvent; size?: number }) {
  const d = new Date(e.date + 'T12:00:00')
  return (
    <div style={{ width: size, height: size + 4, flexShrink: 0, borderRadius: 10, border: '1px solid var(--gold)', background: 'var(--card)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1.2 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-dark)', letterSpacing: 0.5 }}>{d.toLocaleString('en-GB', { month: 'short' }).toUpperCase()}</span>
      <span style={{ fontSize: 16, fontWeight: 700 }}>{d.getDate()}</span>
    </div>
  )
}

export function Meta({ icon, children }: { icon: string; children: ReactNode }) {
  return <div className="row xs muted" style={{ gap: 6 }}><Icon name={icon} size={13} /><span className="ellipsis">{children}</span></div>
}

export function RsvpButtons({ value, onChange, h = 32 }: { value?: Rsvp; onChange: (v: Rsvp) => void; h?: number }) {
  const opts: [Rsvp, string][] = [['going', 'Going'], ['maybe', 'Maybe'], ['no', 'Can’t go']]
  return (
    <div className="row" style={{ gap: 6 }} role="radiogroup" aria-label="RSVP">
      {opts.map(([k, l]) => (
        <button key={k} role="radio" aria-checked={value === k} onClick={() => onChange(k)} className={`btn ${value === k ? 'gold' : ''}`}
          style={{ flex: 1, height: h, padding: 0, fontSize: 12, fontWeight: value === k ? 700 : 400 }}>
          {value === k && <Icon name="check" size={12} stroke={2.4} />}{l}
        </button>
      ))}
    </div>
  )
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{children}</h3>{right}
    </div>
  )
}

export const fmtEventDate = (e: CrewEvent) =>
  new Date(e.date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + e.time

export const repeatLabel = { none: 'One-off', weekly: 'Every week', home: 'Every home game' } as const

export function ago(t: number) {
  const s = Math.max(0, (Date.now() - t) / 1000)
  if (s < 60) return 'now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
