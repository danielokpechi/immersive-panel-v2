import { useState } from 'react'
import { ME, PEOPLE, type CrewEvent, type Repeat } from '../../data'
import { canManage, rsvpCounts, useStore } from '../../store'
import { Icon } from '../../components/Icon'
import { Avatar, BackHead, DateBlock, Meta, Panel, RsvpButtons, SectionTitle, Toggle, fmtEventDate, repeatLabel } from '../../components/ui'

const todayISO = () => new Date().toISOString().slice(0, 10)
const sortByDate = (a: CrewEvent, b: CrewEvent) => (a.date + a.time).localeCompare(b.date + b.time)

export function EventsList({ crewId }: { crewId: string }) {
  const { s, push } = useStore()
  const crew = s.crews.find((c) => c.id === crewId)
  if (!crew) return null
  const upcoming = crew.events.filter((e) => e.date >= todayISO()).sort(sortByDate)
  upcoming.sort((a, b) => Number(b.id === crew.pinnedEventId) - Number(a.id === crew.pinnedEventId))
  const past = crew.events.length - upcoming.length
  return (
    <Panel head={<BackHead title="Events" sub={crew.name} right={canManage(crew) &&
      <button className="btn xs" onClick={() => push({ name: 'eventForm', crewId })}><Icon name="plus" size={14} stroke={2} />New event</button>} />}>
      <div className="col" style={{ gap: 10, padding: '14px 16px 24px' }}>
        <SectionTitle right={<span className="xs muted">{upcoming.length} upcoming</span>}>Upcoming</SectionTitle>
        {upcoming.map((e) => {
          const pinned = e.id === crew.pinnedEventId
          const me = e.rsvps[ME]
          const c = rsvpCounts(e)
          return (
            <button key={e.id} className="tile row" style={{ padding: 12, gap: 12, alignItems: 'flex-start', textAlign: 'left', border: `1px solid ${pinned ? 'var(--gold)' : 'transparent'}` }}
              onClick={() => push({ name: 'event', crewId, eventId: e.id })}>
              <DateBlock e={e} />
              <div className="col grow" style={{ gap: 4 }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  {pinned ? <span className="row xs bold" style={{ gap: 3, color: 'var(--gold-dark)' }}><Icon name="pin" size={11} stroke={2.2} />Pinned</span> : <span className="xs muted">{fmtEventDate(e)}</span>}
                  {me === 'going' ? <span className="badge" style={{ gap: 3 }}><Icon name="check" size={10} stroke={2.6} />Going</span>
                    : me === 'maybe' ? <span className="tag public" style={{ color: 'var(--ink)' }}>Maybe</span>
                    : me === 'no' ? <span className="tag public">Not going</span>
                    : <span className="tag public" style={{ borderStyle: 'dashed' }}>RSVP</span>}
                </div>
                <div className="bold">{e.name}</div>
                {pinned && <Meta icon="clock">{fmtEventDate(e)}</Meta>}
                <Meta icon="mappin">{e.location}</Meta>
                {e.repeat !== 'none' && <Meta icon="repeat">{repeatLabel[e.repeat]}</Meta>}
                <span className="xs muted">{c.going} going · {c.maybe} maybe</span>
              </div>
            </button>
          )
        })}
        {!upcoming.length && (
          <div className="col muted" style={{ alignItems: 'center', gap: 8, padding: 24, textAlign: 'center' }}>
            <Icon name="cal" size={28} />No upcoming events{canManage(crew) ? '. Post one so the crew can RSVP.' : ' yet.'}
          </div>
        )}
        {past > 0 && <div className="xs muted" style={{ paddingTop: 6 }}>{past} past event{past > 1 ? 's' : ''} kept in the crew&apos;s history</div>}
      </div>
    </Panel>
  )
}

export function EventDetail({ crewId, eventId }: { crewId: string; eventId: string }) {
  const { s, d, push, open, toast } = useStore()
  const crew = s.crews.find((c) => c.id === crewId)
  const e = crew?.events.find((x) => x.id === eventId)
  if (!crew || !e) return null
  const manage = canManage(crew)
  const pinned = crew.pinnedEventId === e.id
  const c = rsvpCounts(e)
  const going = Object.entries(e.rsvps).filter(([, v]) => v !== 'no').sort(([a], [b]) => Number(b === ME) - Number(a === ME))
  const known = going.filter(([id]) => PEOPLE[id]).slice(0, 5)
  return (
    <Panel head={<BackHead title="Event" sub={crew.name} right={manage && (
      <div className="row" style={{ gap: 8 }}>
        <button className="btn xs" onClick={() => { d({ type: 'pinEvent', crewId, eventId: pinned ? undefined : e.id }); toast(pinned ? 'Unpinned from chat' : 'Pinned to the top of the chat') }}>
          <Icon name="pin" size={14} stroke={2} />{pinned ? 'Unpin' : 'Pin'}</button>
        <button className="btn xs" onClick={() => push({ name: 'eventForm', crewId, eventId: e.id })}><Icon name="edit" size={14} stroke={2} />Edit</button>
      </div>)} />}>
      <div className="col" style={{ gap: 12, padding: '14px 16px 24px' }}>
        <div style={{ position: 'relative', height: 104, borderRadius: 14, overflow: 'hidden' }}>
          <img src={crew.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {pinned && <span className="badge" style={{ position: 'absolute', left: 10, top: 10, height: 24, padding: '0 10px', gap: 4 }}><Icon name="pin" size={11} stroke={2.2} />Pinned in chat</span>}
        </div>
        <div className="row" style={{ gap: 12 }}>
          <DateBlock e={e} size={48} />
          <div><div className="p bold" style={{ lineHeight: 1.35 }}>{e.name}</div><div className="xs muted">Posted by {e.createdBy === ME ? 'you' : PEOPLE[e.createdBy]?.name}</div></div>
        </div>
        <div className="tile col" style={{ gap: 6, padding: '10px 12px', borderRadius: 12 }}>
          <Meta icon="clock">{fmtEventDate(e)}</Meta>
          <Meta icon="mappin">{e.location}</Meta>
          {e.repeat !== 'none' && <Meta icon="repeat">Repeats: {repeatLabel[e.repeat].toLowerCase()}</Meta>}
        </div>
        {e.description && <div>{e.description}</div>}
        <div className="col" style={{ gap: 8 }}>
          <div className="field-label">Are you going?<small>{c.going} going · {c.maybe} maybe</small></div>
          <RsvpButtons h={38} value={e.rsvps[ME]} onChange={(v) => d({ type: 'rsvp', crewId, eventId: e.id, value: v })} />
        </div>
        <SectionTitle right={<span className="xs muted">{going.length} replied</span>}>Who&apos;s coming</SectionTitle>
        {known.map(([id, v]) => (
          <div key={id} className="row"><Avatar id={id} size={30} /><div><div>{id === ME ? 'You' : PEOPLE[id].name}</div><div className="xs muted">{v === 'going' ? 'Going' : 'Maybe'}</div></div></div>
        ))}
        {manage && <button className="btn danger sm" style={{ alignSelf: 'flex-start', marginTop: 8 }} onClick={() => open({ name: 'deleteEvent', crewId, eventId: e.id })}><Icon name="trash" size={14} />Delete event</button>}
      </div>
    </Panel>
  )
}

export function EventForm({ crewId, eventId }: { crewId: string; eventId?: string }) {
  const { s, d, back, toast } = useStore()
  const crew = s.crews.find((c) => c.id === crewId)
  const existing = crew?.events.find((e) => e.id === eventId)
  const [f, setF] = useState({
    name: existing?.name ?? '', date: existing?.date ?? '', time: existing?.time ?? '19:00', location: existing?.location ?? '',
    description: existing?.description ?? '', repeat: (existing?.repeat ?? 'none') as Repeat,
  })
  const [pin, setPin] = useState(existing ? crew?.pinnedEventId === existing.id : true)
  const [tried, setTried] = useState(false)
  if (!crew) return null
  const errors = { name: !f.name.trim(), date: !f.date || f.date < todayISO(), location: !f.location.trim() }
  const valid = !Object.values(errors).some(Boolean)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value })
  const save = () => {
    setTried(true)
    if (!valid) return
    d({ type: 'saveEvent', crewId, eventId, data: { ...f, name: f.name.trim(), location: f.location.trim(), description: f.description.trim() }, pin })
    toast(eventId ? 'Event updated' : 'Event posted to the crew')
    back()
  }
  return (
    <Panel head={<BackHead title={eventId ? 'Edit event' : 'New event'} sub={crew.name} />}
      foot={<button className="btn gold block" style={{ height: 48, fontWeight: 700 }} onClick={save}>{eventId ? 'Save changes' : 'Post event to crew'}</button>}>
      <div className="col" style={{ gap: 14, padding: '14px 16px 24px' }}>
        <label className="field"><span className="field-label">Event name</span>
          <input className="input" value={f.name} onChange={set('name')} placeholder="e.g. Kingsmere away: travel together" />
          {tried && errors.name && <span className="error">Give the event a name</span>}</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
          <label className="field"><span className="field-label">Date</span><input className="input" type="date" min={todayISO()} value={f.date} onChange={set('date')} />
            {tried && errors.date && <span className="error">Pick a future date</span>}</label>
          <label className="field"><span className="field-label">Time</span><input className="input" type="time" value={f.time} onChange={set('time')} /></label>
        </div>
        <label className="field"><span className="field-label">Location</span>
          <input className="input" value={f.location} onChange={set('location')} placeholder="Pub, station or meeting point" />
          {tried && errors.location && <span className="error">Add where people should meet</span>}</label>
        <label className="field"><span className="field-label">Description or agenda <small>Optional</small></span>
          <textarea className="input" value={f.description} onChange={set('description')} placeholder="Trains, tickets, plan for the day" /></label>
        <div className="field"><span className="field-label">Repeats</span>
          <div className="row" style={{ gap: 6 }} role="radiogroup" aria-label="Repeats">
            {(Object.keys(repeatLabel) as Repeat[]).map((k) => (
              <button key={k} role="radio" aria-checked={f.repeat === k} className={`btn sm ${f.repeat === k ? 'gold' : ''}`} style={{ flex: 1, padding: 0 }} onClick={() => setF({ ...f, repeat: k })}>{repeatLabel[k]}</button>
            ))}
          </div>
        </div>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div><div style={{ fontWeight: 500 }}>Pin to the top of the chat</div><div className="xs muted">Replaces the current pinned event</div></div>
          <Toggle on={pin} onChange={() => setPin(!pin)} label="Pin to the top of the chat" />
        </div>
      </div>
    </Panel>
  )
}
