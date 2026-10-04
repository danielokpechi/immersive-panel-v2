import { useEffect, useRef } from 'react'
import { ME, PEOPLE, type Crew, type Message } from '../../data'
import { canManage, onlineCount, rsvpCounts, useStore } from '../../store'
import { Icon } from '../../components/Icon'
import { Avatar, AvatarStack, CrewAvatar, DateBlock, Meta, Panel, RsvpButtons, ago, fmtEventDate } from '../../components/ui'
import { FanComposer } from '../FanChat'

export function CrewChat({ crewId }: { crewId: string }) {
  const { s, d, push, open, back } = useStore()
  const crew = s.crews.find((c) => c.id === crewId)
  const list = useRef<HTMLDivElement>(null)
  useEffect(() => { list.current?.scrollTo({ top: 1e6, behavior: 'smooth' }) }, [crew?.messages.length])
  useEffect(() => { d({ type: 'read', crewId }) }, [crew?.messages.length, crewId, d])
  if (!crew) return null
  const member = crew.members.some((m) => m.userId === ME)
  const pinned = crew.events.find((e) => e.id === crew.pinnedEventId)

  return (
    <Panel bodyRef={list}
      head={<>
        <div className="row grow">
          <button className="btn round" style={{ width: 32, height: 32 }} aria-label="Back to crews" onClick={back}><Icon name="left" /></button>
          <button className="row grow" style={{ border: 0, background: 'none', padding: 0, textAlign: 'left' }} onClick={() => push({ name: 'crewInfo', crewId })}>
            <CrewAvatar crew={crew} size={38} />
            <span className="grow"><span className="ellipsis" style={{ display: 'block', fontWeight: 500 }}>{crew.name}</span>
              <span className="xs muted">{crew.members.length} members · {onlineCount(crew)} online</span></span>
          </button>
        </div>
        <div className="row" style={{ gap: 8, flexShrink: 0 }}>
          <button className="btn icon" aria-label="Events" onClick={() => push({ name: 'events', crewId })}><Icon name="cal" size={15} /></button>
          <button className="btn icon" aria-label="Crew options" onClick={() => open({ name: 'menu', crewId })}><Icon name="dots" size={16} stroke={2.4} /></button>
        </div>
      </>}
      foot={member ? <Composer crew={crew} /> : <div className="xs muted" style={{ textAlign: 'center', padding: 12 }}>You&apos;re no longer in this crew.</div>}
    >
      {pinned && (
        <button className="row" style={{ position: 'sticky', top: 0, zIndex: 2, width: '100%', padding: '9px 16px', background: '#e6e2dc', border: 0, borderBottom: '1px solid var(--line)', textAlign: 'left' }}
          onClick={() => push({ name: 'event', crewId, eventId: pinned.id })}>
          <DateBlock e={pinned} size={34} />
          <span className="grow">
            <span className="row xs bold" style={{ gap: 4, color: 'var(--gold-dark)' }}><Icon name="pin" size={11} stroke={2.2} />Pinned event</span>
            <span className="ellipsis" style={{ display: 'block', fontSize: 12 }}>{pinned.name} · {pinned.time}</span>
          </span>
          {pinned.rsvps[ME] === 'going'
            ? <span className="badge" style={{ height: 26, padding: '0 10px', borderRadius: 13, gap: 4 }}><Icon name="check" size={11} stroke={2.4} />Going</span>
            : <span className="btn xs" style={{ height: 26 }}>RSVP</span>}
        </button>
      )}
      <div className="col" style={{ gap: 14, padding: '10px 16px 16px' }}>
        {crew.messages.map((m) => <CrewMessage key={m.id} m={m} crew={crew} />)}
      </div>
    </Panel>
  )
}

function Composer({ crew }: { crew: Crew }) {
  const { d, push } = useStore()
  const manage = canManage(crew)
  return (
    <div className="row" style={{ gap: 6 }}>
      {manage && <button className="btn round" style={{ width: 48, height: 48, flexShrink: 0 }} aria-label="Create an event" onClick={() => push({ name: 'eventForm', crewId: crew.id })}><Icon name="plus" size={20} /></button>}
      <div className="grow"><FanComposer placeholder="Message the crew..." onSend={(t) => d({ type: 'send', crewId: crew.id, text: t })} /></div>
    </div>
  )
}

function CrewMessage({ m, crew }: { m: Message; crew: Crew }) {
  const { d, push } = useStore()
  if (m.kind === 'system') return <div className="sys">{m.text}</div>
  if (m.kind === 'held') {
    return (
      <div className="col" style={{ alignItems: 'flex-end', gap: 4 }}>
        <div className="row" style={{ gap: 8 }}><span className="xs muted">You · {ago(m.at)}</span><Avatar id={ME} size={26} /></div>
        <div style={{ marginRight: 34, maxWidth: '75%', border: '1px dashed var(--outline)', borderRadius: 16, padding: '8px 13px', color: 'var(--muted)' }}>{m.text}</div>
        <div className="row xs" style={{ marginRight: 34, gap: 5, color: 'var(--danger)' }}><Icon name="shield" size={13} color="var(--danger)" />Held by moderation · only you can see this</div>
      </div>
    )
  }
  const mine = m.authorId === ME
  if (m.kind === 'event') {
    const e = crew.events.find((x) => x.id === m.eventId)
    if (!e) return null
    const c = rsvpCounts(e)
    const goingIds = Object.entries(e.rsvps).filter(([id, v]) => v === 'going' && PEOPLE[id]).map(([id]) => id).slice(0, 3)
    return (
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <Avatar id={m.authorId} size={26} />
        <div className="col grow" style={{ gap: 4, maxWidth: 280 }}>
          <span className="xs muted">{mine ? 'You' : PEOPLE[m.authorId]?.name} · posted an event · {ago(m.at)}</span>
          <button className="tile col" style={{ gap: 8, padding: 12, border: 0, textAlign: 'left' }} onClick={() => push({ name: 'event', crewId: crew.id, eventId: e.id })}>
            <span className="row"><DateBlock e={e} size={40} /><span className="grow"><span className="bold" style={{ display: 'block', lineHeight: 1.35 }}>{e.name}</span><span className="xs muted">{fmtEventDate(e)}</span></span></span>
            <Meta icon="mappin">{e.location}</Meta>
            <span className="row" style={{ gap: 8 }}>{goingIds.length > 0 && <AvatarStack ids={goingIds} size={20} />}<span className="xs muted">{c.going} going · {c.maybe} maybe</span></span>
          </button>
          <RsvpButtons value={e.rsvps[ME]} onChange={(v) => d({ type: 'rsvp', crewId: crew.id, eventId: e.id, value: v })} />
        </div>
      </div>
    )
  }
  if (mine) {
    return (
      <div className="col" style={{ alignItems: 'flex-end', gap: 4 }}>
        <div className="row" style={{ gap: 8 }}><span className="xs muted">You · {ago(m.at)}</span><Avatar id={ME} size={26} /></div>
        <div className="bubble me" style={{ marginRight: 34, marginTop: -8, maxWidth: '75%' }}>{m.text}</div>
      </div>
    )
  }
  return (
    <div className="row" style={{ alignItems: 'flex-start' }}>
      <Avatar id={m.authorId} size={26} />
      <div className="col" style={{ gap: 4, maxWidth: '80%' }}>
        <span className="xs muted">{PEOPLE[m.authorId]?.name ?? 'Fan'} · {ago(m.at)}</span>
        <div className="bubble">{m.text}</div>
      </div>
    </div>
  )
}
