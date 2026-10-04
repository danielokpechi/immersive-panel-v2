import { useEffect, useRef, useState } from 'react'
import { ME } from '../data'
import { useStore } from '../store'
import { Icon, Spark } from '../components/Icon'
import { Avatar, Hero } from '../components/ui'
import { FanComposer } from './FanChat'

const SUGGESTIONS = [
  'What are the latest updates on Arsenal?',
  'How do I buy tickets for an Arsenal game?',
  'Which Arsenal players should I watch closely?',
  'When is the next Arsenal match?',
]

// Stand-in answers. In production IRIS calls the Connect assistant API.
function answer(q: string) {
  const t = q.toLowerCase()
  if (t.includes('ticket')) return 'Tickets are sold through arsenal.com/tickets. Members get priority windows, then general sale opens if seats remain. Crews can also share travel plans for away games.'
  if (t.includes('next') || t.includes('match') || t.includes('fixture')) return 'Next up is Arsenal v Chelsea at the Emirates on Saturday 25 October, kick-off 15:00.'
  if (t.includes('player') || t.includes('watch')) return 'Keep an eye on Bukayo Saka on the right, Declan Rice running the midfield, and the young full-backs pushing on.'
  if (t.includes('concise') || t.includes('short')) return 'Arsenal: London club, Premier League, huge fanbase, rich history.'
  if (t.includes('crew')) return 'Crews are small fan groups inside Connect. Join one from the banner on the club page, or start your own and plan events together.'
  return 'Arsenal FC is a professional football club based in London, competing in the Premier League. They’re known for their passionate fans and rich history.'
}

interface Turn { from: 'me' | 'iris'; text: string }

export function Iris() {
  const { back } = useStore()
  const [turns, setTurns] = useState<Turn[]>([])
  const [thinking, setThinking] = useState(false)
  const list = useRef<HTMLDivElement>(null)
  useEffect(() => { list.current?.scrollTo({ top: 1e6, behavior: 'smooth' }) }, [turns.length, thinking])

  const ask = (q: string) => {
    setTurns((t) => [...t, { from: 'me', text: q }])
    setThinking(true)
    setTimeout(() => { setThinking(false); setTurns((t) => [...t, { from: 'iris', text: answer(q) }]) }, 1100)
  }

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Hero dim />
      <div className="panel" style={{ top: 100 }}>
        <div className="panel-head">
          <span>Ask IRIS</span>
          <button className="btn round" style={{ border: 0, background: '#e9e6e2', width: 40, height: 40 }} aria-label={turns.length ? 'Back' : 'Close'}
            onClick={() => (turns.length ? setTurns([]) : back())}><Icon name={turns.length ? 'left' : 'x'} size={19} stroke={2} /></button>
        </div>
        <div ref={list} className="panel-body scroll">
          {!turns.length ? (
            <div className="col" style={{ alignItems: 'center', padding: '22px 17px', textAlign: 'center' }}>
              <span style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--iris)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spark size={26} color="#fff" /></span>
              <div className="p" style={{ fontWeight: 500, marginTop: 16 }}>Hi! I&apos;m IRIS</div>
              <div className="xs muted" style={{ marginTop: 10 }}>Your intelligent assistant.<br />Ask me anything or try one of these:</div>
              <div className="col" style={{ gap: 8, width: '100%', marginTop: 16 }}>
                {SUGGESTIONS.map((q) => <button key={q} className="btn" style={{ borderRadius: 10, height: 42, borderColor: '#b5b0aa', whiteSpace: 'normal' }} onClick={() => ask(q)}>{q}</button>)}
              </div>
            </div>
          ) : (
            <div className="col" style={{ gap: 14, padding: '14px 16px' }}>
              {turns.map((t, i) => t.from === 'me' ? (
                <div key={i} className="col" style={{ alignItems: 'flex-end', gap: 4 }}>
                  <div className="row" style={{ gap: 8 }}><span className="xs muted">You</span><Avatar id={ME} size={26} /></div>
                  <div style={{ marginTop: -10, marginRight: 34, background: '#1e1d1c', color: '#fff', borderRadius: 14, padding: '9px 13px', maxWidth: '80%' }}>{t.text}</div>
                </div>
              ) : (
                <div key={i} className="row" style={{ alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--iris)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spark size={14} color="#fff" /></span>
                  <div className="col" style={{ gap: 4, maxWidth: '85%' }}><span className="xs muted">IRIS</span><div className="bubble">{t.text}</div></div>
                </div>
              ))}
              {thinking && <div className="row" style={{ gap: 8, paddingLeft: 4 }} aria-live="polite"><Spark size={16} color="var(--ink)" />Thinking...</div>}
            </div>
          )}
        </div>
        <div className="panel-foot"><FanComposer onSend={ask} placeholder="Ask IRIS anything..." /></div>
      </div>
    </div>
  )
}
