import { useEffect, useRef, useState } from 'react'
import { A, ME, PEOPLE, type FanMessage } from '../data'
import { useStore } from '../store'
import { Badge16, Icon, Spark } from '../components/Icon'
import { Avatar, Hero, ago } from '../components/ui'

export function ChatLine({ m }: { m: FanMessage }) {
  const mine = m.authorId === ME
  if (mine) {
    return (
      <div className="col" style={{ alignItems: 'flex-end', gap: 4 }}>
        <div className="row" style={{ gap: 8 }}><span className="xs muted">You · {ago(m.at)}</span><Avatar id={ME} size={26} /></div>
        <div className="bubble me" style={{ marginRight: 34, marginTop: -8, maxWidth: '78%' }}>{m.text}</div>
      </div>
    )
  }
  return (
    <div className="row" style={{ alignItems: 'flex-start' }}>
      <Avatar id={m.authorId} size={26} />
      <div className="col" style={{ gap: 4, maxWidth: '82%' }}>
        <span className="xs muted">{PEOPLE[m.authorId]?.name} · {ago(m.at)}</span>
        <div className="bubble">{m.text}</div>
      </div>
    </div>
  )
}

export function FanComposer({ onSend, placeholder = 'Join the conversation...' }: { onSend: (t: string) => void; placeholder?: string }) {
  const [t, setT] = useState('')
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (t.trim()) { onSend(t.trim()); setT('') } }
  return (
    <form className="row" style={{ gap: 6 }} onSubmit={submit}>
      <label className="grow"><span className="sr-only">Message</span>
        <input className="pill-input" value={t} onChange={(e) => setT(e.target.value)} placeholder={placeholder} /></label>
      <button className="btn gold" aria-label="Send" style={{ width: 52, height: 48, borderRadius: 14, padding: 0 }} disabled={!t.trim()}><Icon name="send" size={20} /></button>
    </form>
  )
}

type Activity = 'poll' | 'quiz' | 'pick' | 'sponsored' | 'summary'
const ORDER: Activity[] = ['summary', 'poll', 'quiz', 'pick', 'sponsored']

export function FanChat() {
  const { s, d, back, push } = useStore()
  const list = useRef<HTMLDivElement>(null)
  const [idx, setIdx] = useState(0)
  const [active, setActive] = useState<Activity | null>(null)

  useEffect(() => { list.current?.scrollTo({ top: 1e6, behavior: 'smooth' }) }, [s.fanChat.length])
  // Studio pushes live activities into the chat. Demo: one every few seconds after the last is closed.
  useEffect(() => {
    if (active) return
    const t = window.setTimeout(() => { setActive(ORDER[idx % ORDER.length]); setIdx((i) => i + 1) }, idx === 0 ? 1500 : 5000)
    return () => clearTimeout(t)
  }, [active, idx])
  const close = () => setActive(null)

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Hero dim />
      <div className="panel">
        <div className="panel-head">
          <div className="row" style={{ gap: 13 }}>
            <span style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--gold)', border: '1px solid var(--gold-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="chat" /></span>
            <div><div style={{ fontWeight: 500 }}>Fan Chat</div><div className="xs muted">312 fans active</div></div>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <button className="btn icon" aria-label="Ask IRIS" onClick={() => push({ name: 'iris' })}><Spark size={15} /></button>
            <button className="btn icon" aria-label="Collapse chat" onClick={back}><Icon name="collapse" size={15} /></button>
          </div>
        </div>
        <div ref={list} className="panel-body scroll col" style={{ gap: 14, padding: '12px 16px 16px' }}>
          {s.fanChat.map((m) => <ChatLine key={m.id} m={m} />)}
        </div>
        <div className="panel-foot"><FanComposer onSend={(t) => d({ type: 'fanSend', text: t })} /></div>
      </div>
      {active && (
        <div className="sheet" style={{ bottom: 100 }} role="dialog" aria-label="Live activity">
          {active === 'poll' && <Poll onClose={close} />}
          {active === 'quiz' && <Quiz onClose={close} />}
          {active === 'pick' && <PickWin onClose={close} />}
          {active === 'sponsored' && <Sponsored onClose={close} />}
          {active === 'summary' && <Summary onClose={close} />}
        </div>
      )}
    </div>
  )
}

function Top({ icon, label, onClose }: { icon: React.ReactNode; label: string; onClose: () => void }) {
  return (
    <div className="row" style={{ justifyContent: 'space-between' }}>
      <span className="chip">{icon}{label}</span>
      <button className="btn icon" aria-label="Close" onClick={onClose}><Icon name="x" size={16} /></button>
    </div>
  )
}

function Option({ label, pct, selected, lead, onClick, disabled }: { label: string; pct?: number; selected?: boolean; lead?: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-pressed={selected}
      style={{ position: 'relative', height: 42, borderRadius: 10, overflow: 'hidden', border: `1px solid ${selected ? 'var(--gold)' : '#b5b0aa'}`,
        background: pct !== undefined ? '#f4f2ef' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px 0 12px', cursor: disabled ? 'default' : 'pointer' }}>
      {pct !== undefined && <span style={{ position: 'absolute', inset: 0, width: `${pct}%`, background: selected ? '#ada9a5' : 'var(--bubble)', transition: 'width .4s' }} />}
      <span className="row" style={{ position: 'relative', gap: 8, fontWeight: selected ? 700 : 400 }}>{lead}{label}</span>
      {pct !== undefined && <span style={{ position: 'relative', fontWeight: 700 }}>{pct}%</span>}
    </button>
  )
}

function Poll({ onClose }: { onClose: () => void }) {
  const [vote, setVote] = useState<string | null>(null)
  const res = vote === 'ars' ? [63, 37] : vote === 'che' ? [61, 39] : null
  return (
    <>
      <Top icon={<Spark size={15} />} label="Poll" onClose={onClose} />
      <div className="p">Who will win the next match?</div>
      <Option label="Voltford" lead={<img src={A('crest.png')} alt="" width={22} height={22} />} pct={res?.[0]} selected={vote === 'ars'} onClick={() => setVote('ars')} disabled={!!vote} />
      <Option label="Kingsmere City" lead={<img src={A('rival-crest.png')} alt="" width={22} height={22} />} pct={res?.[1]} selected={vote === 'che'} onClick={() => setVote('che')} disabled={!!vote} />
      {vote && <div className="xs muted" style={{ textAlign: 'center' }}>Thanks for voting · 1,284 votes</div>}
    </>
  )
}

function Quiz({ onClose }: { onClose: () => void }) {
  const [pick, setPick] = useState<string | null>(null)
  const right = '2006'
  return (
    <>
      <Top icon={<Spark size={15} />} label="Quiz" onClose={onClose} />
      <div className="p">When did Voltford move to the Arc?</div>
      {['2004', '2006', '2008', '2010'].map((y) => {
        const state = pick && (y === right ? 'right' : y === pick ? 'wrong' : '')
        return (
          <button key={y} onClick={() => setPick(y)} disabled={!!pick}
            style={{ height: 42, borderRadius: 10, textAlign: 'left', padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              border: `1px solid ${state === 'right' ? 'var(--gold-dark)' : state === 'wrong' ? 'var(--danger)' : '#b5b0aa'}`,
              background: state === 'right' ? 'var(--gold)' : 'transparent', cursor: pick ? 'default' : 'pointer' }}>
            {y}{state === 'right' && <Icon name="check" size={16} stroke={2.4} />}{state === 'wrong' && <Icon name="x" size={16} color="var(--danger)" />}
          </button>
        )
      })}
      {pick && <div className="xs" style={{ textAlign: 'center', color: pick === right ? 'var(--gold-dark)' : 'var(--danger)' }}>{pick === right ? 'Correct! +10 points' : 'Not quite. It was 2006.'}</div>}
    </>
  )
}

function PickWin({ onClose }: { onClose: () => void }) {
  const { toast } = useStore()
  const [sel, setSel] = useState<string | null>(null)
  const [stage, setStage] = useState<'pick' | 'locked' | 'won'>('pick')
  useEffect(() => { if (stage === 'locked') { const t = setTimeout(() => setStage('won'), 3500); return () => clearTimeout(t) } }, [stage])
  const players = ['Jonah Reyes', 'Theo Lindqvist']
  const pct = [55, 45]
  return (
    <>
      <Top icon={<Badge16 />} label="Pick & Win" onClose={onClose} />
      <div>
        <div className="p">{stage === 'won' ? 'You guessed it right! 🤩' : 'Who scores first for Voltford?'}</div>
        <div className="xs muted">{stage === 'won' ? 'Claim your signed shirt' : 'Choose a Voltford player to win a signed jersey.'}</div>
      </div>
      {players.map((p, i) => (
        <Option key={p} label={p} selected={sel === p} pct={stage === 'pick' ? undefined : pct[i]} lead={stage === 'won' && sel === p ? <Badge16 /> : undefined}
          onClick={() => setSel(p)} disabled={stage !== 'pick'} />
      ))}
      {stage === 'pick' && <button className="btn gold" disabled={!sel} onClick={() => setStage('locked')}>Enter your pick</button>}
      {stage === 'locked' && <>
        <button className="btn dark" disabled style={{ opacity: 1, background: '#f8f7f5' }}><Icon name="check" size={17} stroke={2} />Prediction locked</button>
        <div className="xs muted" style={{ textAlign: 'center', marginTop: -4 }}>Waiting for results...</div>
      </>}
      {stage === 'won' && <button className="btn gold" onClick={() => { toast('Prize claimed! Check your email for delivery details'); onClose() }}>Claim your prize</button>}
    </>
  )
}

function Sponsored({ onClose }: { onClose: () => void }) {
  const { toast } = useStore()
  const [left, setLeft] = useState(2 * 3600 + 45 * 60 + 30)
  useEffect(() => { const t = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000); return () => clearInterval(t) }, [])
  const parts = [Math.floor(left / 3600), Math.floor((left % 3600) / 60), left % 60].map((n) => String(n).padStart(2, '0'))
  return (
    <>
      <Top icon={<Icon name="flag" size={15} color="var(--muted)" />} label="Sponsored" onClose={onClose} />
      <img src={A('sponsor-air.jpg')} alt="Lumen Air" style={{ width: '100%', height: 115, objectFit: 'cover', borderRadius: 10 }} />
      <div className="h5" style={{ fontWeight: 500 }}>Exclusive offer from Lumen Air</div>
      <div className="muted" style={{ marginTop: -6 }}>15% off flights to Voltford away games. Limited time only!</div>
      <div className="xs muted" style={{ letterSpacing: 0.4 }}>OFFER ENDS IN</div>
      <div className="row" style={{ marginTop: -4 }} aria-live="off">
        {parts.map((p, i) => (
          <span key={i} className="row" style={{ gap: 10 }}>
            <span style={{ width: 42, height: 36, borderRadius: 6, border: '1px solid #b5b0aa', background: 'var(--bubble)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, color: '#7b2fe2' }}>{p}</span>
            {i < 2 && <span className="muted">:</span>}
          </span>
        ))}
      </div>
      <button className="btn gold" onClick={() => { toast('Offer code LUMEN15 copied'); onClose() }}>Claim now</button>
    </>
  )
}

function Summary({ onClose }: { onClose: () => void }) {
  return (
    <>
      <Top icon={<Spark size={15} />} label="Chat Summary" onClose={onClose} />
      <div>Fans are hyped about the new signings and the upcoming derby! 🤩</div>
    </>
  )
}
