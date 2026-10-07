import { useRef, useState } from 'react'
import type { Crew } from '../../data'
import { lastMessage, myRole, unread, useStore } from '../../store'
import { Icon } from '../../components/Icon'
import { BackHead, CrewAvatar, Panel, PrivacyTag, SectionTitle, ago } from '../../components/ui'

const lastAt = (c: Crew) => c.messages[c.messages.length - 1]?.at ?? 0

export function useCrewLists() {
  const { s } = useStore()
  const mine = s.crews.filter((c) => myRole(c))
    .sort((a, b) => (Number(s.pinnedCrews.includes(b.id)) - Number(s.pinnedCrews.includes(a.id))) || lastAt(b) - lastAt(a))
  const pending = s.crews.filter((c) => s.pending.includes(c.id))
  const discover = s.crews.filter((c) => !myRole(c) && c.visibility === 'public')
  return { mine, pending, discover }
}

export function CrewHub() {
  const { push, open, s } = useStore()
  const { mine, pending, discover } = useCrewLists()
  return (
    <Panel head={<BackHead title="Crews" sub={`Voltford · ${mine.length} joined`} right={
      <button className="btn xs" onClick={() => push({ name: 'crewForm' })}><Icon name="plus" size={14} stroke={2} />New crew</button>} />}>
      <div className="col" style={{ gap: 14, padding: '14px 16px 24px' }}>
        <button className="pill-input row" style={{ height: 44, gap: 10, color: 'var(--muted)', textAlign: 'left' }} onClick={() => push({ name: 'crewSearch' })}>
          <Icon name="search" />Search crews
        </button>

        <SectionTitle right={mine.length ? <span className="xs muted">Hold a crew for options</span> : undefined}>My crews</SectionTitle>
        {mine.length === 0 && pending.length === 0 ? (
          <div className="col" style={{ border: '1px dashed var(--outline)', borderRadius: 16, padding: '18px 16px', alignItems: 'center', gap: 8, textAlign: 'center' }}>
            <span style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bubble)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-dark)' }}><Icon name="users" size={22} /></span>
            <div style={{ fontWeight: 500 }}>You haven&apos;t joined a crew yet</div>
            <div className="xs muted">Crews are small groups of fans who plan matchdays together.<br />Join one below or start your own.</div>
            <button className="btn dark sm" onClick={() => push({ name: 'crewForm' })}><Icon name="plus" size={14} stroke={2} />Start a crew</button>
          </div>
        ) : (
          <div className="col" style={{ gap: 8, marginTop: -4 }}>
            {mine.map((c) => <MyCrewRow key={c.id} crew={c} pinned={s.pinnedCrews.includes(c.id)} />)}
            {pending.map((c) => (
              <div key={c.id} className="tile row" style={{ padding: '10px 12px', gap: 12, opacity: 0.75 }}>
                <CrewAvatar crew={c} size={44} />
                <div className="grow"><div className="bold ellipsis">{c.name}</div><div className="xs muted">Request sent · waiting for approval</div></div>
                <Icon name="clock" size={16} color="var(--muted)" />
              </div>
            ))}
          </div>
        )}

        <SectionTitle right={<button className="row xs" style={{ border: 0, background: 'none', color: 'var(--gold-dark)', gap: 2 }} onClick={() => push({ name: 'crewDiscover' })}>See all<Icon name="chev" size={12} stroke={2.2} /></button>}>Discover crews</SectionTitle>
        <div className="hscroll" style={{ gap: 10, margin: '-4px -16px 0 0', paddingRight: 16 }}>
          {discover.map((c) => <DiscoverCard key={c.id} crew={c} width={196} />)}
        </div>

        <button className="row" style={{ border: 0, background: 'none', padding: '4px 2px', gap: 8, color: 'var(--muted)' }} onClick={() => open({ name: 'code', crewId: '' })}>
          <Icon name="lock" size={14} /><span className="xs">Got an invite code for a private crew?</span><Icon name="chev" size={12} />
        </button>
      </div>
    </Panel>
  )
}

function MyCrewRow({ crew, pinned }: { crew: Crew; pinned: boolean }) {
  const { s, push, open, d } = useStore()
  const n = unread(s, crew)
  const muted = s.muted.includes(crew.id)
  const timer = useRef<number | undefined>(undefined)
  const long = useRef(false)
  const startPress = () => { long.current = false; timer.current = window.setTimeout(() => { long.current = true; open({ name: 'rowActions', crewId: crew.id }) }, 500) }
  const endPress = () => clearTimeout(timer.current)
  const last = crew.messages[crew.messages.length - 1]
  return (
    <button className="tile row" style={{ padding: '10px 12px', gap: 12, border: `1px solid ${pinned ? 'var(--gold)' : 'transparent'}`, textAlign: 'left', userSelect: 'none' }}
      onPointerDown={startPress} onPointerUp={endPress} onPointerLeave={endPress}
      onContextMenu={(e) => { e.preventDefault(); open({ name: 'rowActions', crewId: crew.id }) }}
      onClick={() => { if (long.current) return; d({ type: 'read', crewId: crew.id }); push({ name: 'crewChat', crewId: crew.id }) }}
      aria-label={`${crew.name}${n ? `, ${n} unread` : ''}`}>
      <CrewAvatar crew={crew} size={44} />
      <div className="grow">
        <div className="bold ellipsis">{crew.name}</div>
        <div className="xs muted ellipsis">{lastMessage(crew)}</div>
      </div>
      <div className="col" style={{ alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
        <span className="row xs muted" style={{ gap: 4 }}>
          {pinned && <Icon name="pin" size={13} stroke={2} color="var(--gold-dark)" />}
          {muted && <Icon name="belloff" size={13} />}
          {last ? ago(last.at) : ''}
        </span>
        {n ? <span className="badge" style={muted ? { background: 'var(--bubble)' } : undefined}>{n}</span> : <span style={{ height: 20 }} />}
      </div>
    </button>
  )
}

export function DiscoverCard({ crew, width }: { crew: Crew; width?: number }) {
  const { open } = useStore()
  return (
    <div className="tile" style={{ flex: width ? `0 0 ${width}px` : undefined, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', height: 64 }}>
        <img src={crew.cover} alt="" style={{ width: '100%', height: 64, objectFit: 'cover' }} />
        <div style={{ position: 'absolute', left: 10, bottom: -18 }}><CrewAvatar crew={crew} size={34} ring="var(--bubble)" /></div>
        <span className="row" style={{ position: 'absolute', right: 8, top: 8, gap: 4, height: 22, padding: '0 8px', borderRadius: 11, background: 'rgba(20,19,18,.7)', color: '#fff', fontSize: 11 }}>
          <Icon name="users" size={12} />{crew.members.length}
        </span>
      </div>
      <div className="col" style={{ padding: '24px 12px 12px', gap: 7, flex: 1 }}>
        <div className="bold" style={{ lineHeight: 1.35 }}>{crew.name}</div>
        <div className="xs muted" style={{ height: 32, overflow: 'hidden' }}>{crew.description}</div>
        <button className="btn gold sm" style={{ marginTop: 'auto', fontWeight: 700 }} onClick={() => open({ name: 'preview', crewId: crew.id })}><Icon name="plus" size={14} stroke={2.2} />Join</button>
      </div>
    </div>
  )
}

export function CrewSearch() {
  const { s, push, open, d } = useStore()
  const [q, setQ] = useState('')
  const term = q.trim().toLowerCase()
  const results = s.crews.filter((c) => (c.visibility === 'public' || myRole(c)) && (!term || c.name.toLowerCase().includes(term) || c.description.toLowerCase().includes(term)))
  const codeMatch = s.crews.find((c) => c.inviteCode.toLowerCase() === term)
  return (
    <Panel head={<BackHead title="Search crews" sub="Public crews and crews you're in" />}>
      <div className="col" style={{ gap: 12, padding: '14px 16px 24px' }}>
        <label style={{ position: 'relative' }}><span className="sr-only">Search crews</span>
          <span style={{ position: 'absolute', left: 16, top: 13, color: 'var(--muted)' }}><Icon name="search" /></span>
          <input autoFocus className="pill-input" style={{ height: 44, paddingLeft: 44 }} placeholder="Search crews" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        {codeMatch && (
          <button className="tile row" style={{ padding: 12, border: '1px solid var(--gold)', textAlign: 'left' }} onClick={() => push({ name: 'inviteLink', crewId: codeMatch.id })}>
            <Icon name="lock" /><span className="grow">Open invite for <b>{codeMatch.name}</b></span><Icon name="chev" />
          </button>
        )}
        <div className="xs muted">{term ? `${results.length} crew${results.length === 1 ? '' : 's'} for “${q.trim()}”` : 'All crews'}</div>
        {results.map((c) => {
          const joined = !!myRole(c)
          return (
            <div key={c.id} className="tile row" style={{ padding: '10px 12px', gap: 12 }}>
              <CrewAvatar crew={c} size={44} />
              <div className="grow"><div className="bold ellipsis">{c.name}</div><div className="xs muted">{c.members.length} members</div></div>
              {joined
                ? <button className="btn sm" onClick={() => { d({ type: 'read', crewId: c.id }); push({ name: 'crewChat', crewId: c.id }) }}>Open</button>
                : <button className="btn gold sm" style={{ fontWeight: 700 }} onClick={() => open({ name: 'preview', crewId: c.id })}>Join</button>}
            </div>
          )
        })}
        {term && !results.length && <div className="muted" style={{ textAlign: 'center', padding: 16 }}>No public crews match that.</div>}
        <div className="row xs muted" style={{ alignItems: 'flex-start', gap: 8 }}><Icon name="lock" size={13} /><span>Private crews don&apos;t show in search. Type an invite code to open one.</span></div>
        <div className="row" style={{ border: '1px dashed var(--outline)', borderRadius: 16, padding: '14px 16px', justifyContent: 'space-between' }}>
          <div><div>Can&apos;t find your people?</div><div className="xs muted">Start a public or private crew.</div></div>
          <button className="btn dark sm" onClick={() => push({ name: 'crewForm' })}><Icon name="plus" size={14} stroke={2} />Start a crew</button>
        </div>
      </div>
    </Panel>
  )
}

export function CrewDiscover() {
  const { discover } = useCrewLists()
  return (
    <Panel head={<BackHead title="Discover crews" sub="Public crews · join straight away" />}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, padding: '14px 16px 24px' }}>
        {discover.map((c) => <DiscoverCard key={c.id} crew={c} />)}
        {!discover.length && <div className="muted">You&apos;ve joined every public crew. Nice.</div>}
      </div>
    </Panel>
  )
}

export { PrivacyTag }
