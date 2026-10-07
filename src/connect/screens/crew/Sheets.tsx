import { useState } from 'react'
import { ME, PEOPLE } from '../../data'
import { canManage, isAdmin, onlineCount, type Sheet as SheetT, useStore } from '../../store'
import { Icon } from '../../components/Icon'
import { Avatar, AvatarStack, CrewAvatar, MenuRow, PrivacyTag, Sheet, SheetTop, Toggle } from '../../components/ui'

export function SheetHost() {
  const { sheet } = useStore()
  if (!sheet) return null
  switch (sheet.name) {
    case 'preview': return <Preview crewId={sheet.crewId} />
    case 'invite': return <Invite crewId={sheet.crewId} />
    case 'menu': return <Menu crewId={sheet.crewId} />
    case 'leave': return <Leave crewId={sheet.crewId} />
    case 'rowActions': return <RowActions crewId={sheet.crewId} />
    case 'requests': return <Requests crewId={sheet.crewId} />
    case 'member': return <MemberActions crewId={sheet.crewId} userId={sheet.userId} />
    case 'pending': return <Pending crewId={sheet.crewId} />
    case 'deleteCrew': return <DeleteCrew crewId={sheet.crewId} />
    case 'deleteEvent': return <DeleteEvent sheet={sheet} />
    case 'code': return <Code />
  }
}

function useCrew(id: string) { const { s } = useStore(); return s.crews.find((c) => c.id === id) }

function Preview({ crewId }: { crewId: string }) {
  const { d, push, open } = useStore()
  const crew = useCrew(crewId)
  if (!crew) return null
  const shown = crew.members.filter((m) => PEOPLE[m.userId]).slice(0, 4).map((m) => m.userId)
  const join = () => { d({ type: 'join', crewId }); open(null); push({ name: 'crewChat', crewId }) }
  return (
    <Sheet>
      <div style={{ position: 'relative', margin: '-14px -16px 0', height: 110, borderRadius: '19px 19px 0 0', overflow: 'hidden' }}>
        <img src={crew.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <button className="btn icon" aria-label="Close" style={{ position: 'absolute', right: 12, top: 12, background: 'var(--bubble)' }} onClick={() => open(null)}><Icon name="x" size={16} /></button>
      </div>
      <div className="col" style={{ gap: 6, marginTop: -34, alignItems: 'flex-start' }}>
        <CrewAvatar crew={crew} size={56} ring="var(--card)" />
        <div className="h5" style={{ fontWeight: 500 }}>{crew.name}</div>
        <PrivacyTag crew={crew} />
      </div>
      <div>{crew.description} {crew.visibility === 'public' ? 'Anyone can join straight away.' : ''}</div>
      <div className="row" style={{ borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', padding: '10px 0' }}>
        {[[crew.members.length, 'members'], [onlineCount(crew), 'online now'], [crew.events.length, 'events planned']].map(([v, l]) => (
          <div key={l} className="grow" style={{ textAlign: 'center' }}><div className="p bold">{v}</div><div className="xs muted">{l}</div></div>
        ))}
      </div>
      <div className="row xs muted"><AvatarStack ids={shown} size={24} ring="var(--card)" />{shown.length ? `${PEOPLE[shown[0]].name.split(' ')[0]} and ${crew.members.length - 1} others` : ''}</div>
      <button className="btn gold block" onClick={join}>Join crew</button>
    </Sheet>
  )
}

function Invite({ crewId }: { crewId: string }) {
  const { d, open, toast } = useStore()
  const crew = useCrew(crewId)
  const [invited, setInvited] = useState<string[]>([])
  if (!crew) return null
  const link = `connect.voltfordfc.com/crew/${crew.inviteCode}`
  const candidates = ['hw', 'cp', 'jk', 'fz', 'ma'].filter((id) => !crew.members.some((m) => m.userId === id)).slice(0, 3)
  const copy = async () => { try { await navigator.clipboard.writeText('https://' + link) } catch { /* clipboard blocked */ } toast('Invite link copied') }
  return (
    <Sheet>
      <SheetTop icon={<Icon name="userplus" size={14} color="var(--muted)" />} label="Invite" />
      <div className="p">Bring fans into {crew.name}</div>
      <div className="row" style={{ height: 42, borderRadius: 10, border: '1px solid #b5b0aa', padding: '0 6px 0 12px' }}>
        <span className="grow ellipsis">{link}</span>
        <button className="btn xs" onClick={copy}><Icon name="copy" size={13} />Copy</button>
      </div>
      {crew.visibility === 'private' && <div className="row xs muted" style={{ alignItems: 'flex-start', gap: 8 }}><Icon name="lock" size={13} />
        <span>Private crew: people who open the link send a request, and an admin or moderator approves it. Invite code: <b>{crew.inviteCode}</b></span></div>}
      {candidates.length > 0 && <div className="xs muted" style={{ letterSpacing: 0.4 }}>ACTIVE IN FAN CHAT</div>}
      {candidates.map((id) => {
        const done = invited.includes(id)
        return (
          <div key={id} className="row">
            <Avatar id={id} size={32} />
            <div className="grow"><div>{PEOPLE[id].name}</div><div className="xs muted">Active in Fan Chat</div></div>
            {done ? <span className="btn xs" style={{ color: 'var(--muted)' }}><Icon name="check" size={12} stroke={2.2} />{canManage(crew) || crew.visibility === 'public' ? 'Added' : 'Requested'}</span>
              : <button className="btn gold xs" style={{ fontWeight: 700 }} onClick={() => { d({ type: 'invite', crewId, userId: id }); setInvited([...invited, id]) }}>Invite</button>}
          </div>
        )
      })}
      <button className="btn gold" onClick={() => open(null)}>Done</button>
    </Sheet>
  )
}

function Menu({ crewId }: { crewId: string }) {
  const { s, d, push, open } = useStore()
  const crew = useCrew(crewId)
  if (!crew) return null
  const muted = s.muted.includes(crewId)
  return (
    <Sheet>
      <SheetTop icon={<Icon name="users" size={14} color="var(--muted)" />} label={crew.name} />
      <div className="col" style={{ marginTop: -4 }}>
        <MenuRow icon="cal" label="Events" sub={`${crew.events.length} planned · RSVP and see who's going`} onClick={() => push({ name: 'events', crewId })} />
        <MenuRow icon="info" label="Crew info" sub="Members, roles and join requests" onClick={() => push({ name: 'crewInfo', crewId })} />
        <MenuRow icon="userplus" label="Invite members" onClick={() => open({ name: 'invite', crewId })} />
        <MenuRow icon="belloff" label="Mute notifications" right={<Toggle on={muted} onChange={() => d({ type: 'toggleMute', crewId })} label="Mute notifications" />} />
        <MenuRow icon="leave" label="Leave crew" danger onClick={() => open({ name: 'leave', crewId })} />
      </div>
    </Sheet>
  )
}

function Leave({ crewId }: { crewId: string }) {
  const { d, open, resetTo, toast } = useStore()
  const crew = useCrew(crewId)
  if (!crew) return null
  const admin = isAdmin(crew)
  return (
    <Sheet>
      <SheetTop icon={<Icon name="leave" size={14} color="var(--muted)" />} label="Leave crew" />
      <div>
        <div className="p">Leave {crew.name}?</div>
        <div className="xs muted">
          You&apos;ll stop getting messages from this crew. {crew.visibility === 'public' ? 'It’s public, so you can rejoin any time.' : 'It’s private, so you’ll need a new invite to come back.'}
          {admin && ' You’re the admin, so admin passes to a moderator (or the longest-standing member).'}
        </div>
      </div>
      <div className="row" style={{ gap: 10 }}>
        <button className="btn gold grow" onClick={() => open(null)}>Stay</button>
        <button className="btn danger grow" onClick={() => { d({ type: 'leave', crewId }); toast(`You left ${crew.name}`); resetTo([{ name: 'home' }, { name: 'crews' }]) }}>Leave crew</button>
      </div>
    </Sheet>
  )
}

function RowActions({ crewId }: { crewId: string }) {
  const { s, d, push, open } = useStore()
  const crew = useCrew(crewId)
  if (!crew) return null
  const pinned = s.pinnedCrews.includes(crewId)
  const muted = s.muted.includes(crewId)
  return (
    <Sheet>
      <SheetTop icon={<Icon name="users" size={14} color="var(--muted)" />} label={crew.name} />
      <div className="col" style={{ marginTop: -4 }}>
        <MenuRow icon="pin" label={pinned ? 'Unpin from top' : 'Pin to top'} sub="Pinned crews stay above the rest" onClick={() => { d({ type: 'togglePin', crewId }); open(null) }} />
        <MenuRow icon="read" label="Mark as read" onClick={() => { d({ type: 'read', crewId }); open(null) }} />
        <MenuRow icon="belloff" label="Mute notifications" right={<Toggle on={muted} onChange={() => d({ type: 'toggleMute', crewId })} label="Mute notifications" />} />
        <MenuRow icon="info" label="Crew info" onClick={() => push({ name: 'crewInfo', crewId })} />
        <MenuRow icon="leave" label="Leave crew" danger onClick={() => open({ name: 'leave', crewId })} />
      </div>
    </Sheet>
  )
}

function Requests({ crewId }: { crewId: string }) {
  const { d, open, toast } = useStore()
  const crew = useCrew(crewId)
  if (!crew) return null
  const n = crew.requests.length
  const room = crew.memberLimit ? crew.memberLimit - crew.members.length : Infinity
  return (
    <Sheet>
      <SheetTop icon={<Icon name="lock" size={14} color="var(--muted)" />} label="Join requests" />
      <div><div className="p">{n ? `${n} fan${n > 1 ? 's' : ''} want${n > 1 ? '' : 's'} to join` : 'All caught up'}</div>
        <div className="xs muted">{n ? `They opened an invite link. ${room !== Infinity ? `${Math.max(0, room)} spaces left.` : ''}` : 'New requests will show here.'}</div></div>
      {crew.requests.map((r) => (
        <div key={r.userId} className="row">
          <Avatar id={r.userId} size={32} />
          <div className="grow"><div>{PEOPLE[r.userId]?.name}</div><div className="xs muted">{r.invitedBy ? `Invited by ${r.invitedBy === ME ? 'you' : PEOPLE[r.invitedBy]?.name}` : 'Opened a shared link'}</div></div>
          <button className="btn round" style={{ width: 32, height: 32 }} aria-label={`Decline ${PEOPLE[r.userId]?.name}`} onClick={() => d({ type: 'decline', crewId, userId: r.userId })}><Icon name="x" size={14} stroke={2} /></button>
          <button className="btn gold xs" style={{ fontWeight: 700 }} disabled={room <= 0} onClick={() => d({ type: 'accept', crewId, userId: r.userId })}>Accept</button>
        </div>
      ))}
      {n > 1 && <button className="btn dark" disabled={room < n} onClick={() => { crew.requests.forEach((r) => d({ type: 'accept', crewId, userId: r.userId })); toast(`${n} fans added`); open(null) }}>Accept all</button>}
      {room <= 0 && <div className="error">The crew is full. Raise the member limit in Edit crew.</div>}
      {!n && <button className="btn" onClick={() => open(null)}>Close</button>}
    </Sheet>
  )
}

function MemberActions({ crewId, userId }: { crewId: string; userId: string }) {
  const { d, open, toast } = useStore()
  const crew = useCrew(crewId)
  const m = crew?.members.find((x) => x.userId === userId)
  if (!crew || !m) return null
  const p = PEOPLE[userId]
  return (
    <Sheet>
      <SheetTop icon={<Icon name="users" size={14} color="var(--muted)" />} label={p.name} />
      <div className="row"><Avatar id={userId} size={40} /><div><div className="p">{p.name}</div><div className="xs muted">{m.role === 'mod' ? 'Moderator' : 'Member'} since {new Date(m.joinedAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</div></div></div>
      <div className="col">
        {m.role === 'mod'
          ? <MenuRow icon="star" label="Remove moderator role" sub="They stay in the crew as a member" onClick={() => { d({ type: 'setRole', crewId, userId, role: 'member' }); open(null) }} />
          : <MenuRow icon="star" label="Make moderator" sub="Can approve requests, post and pin events, and remove messages" onClick={() => { d({ type: 'setRole', crewId, userId, role: 'mod' }); toast(`${p.name} is now a moderator`); open(null) }} />}
        <MenuRow icon="leave" label="Remove from crew" danger onClick={() => { d({ type: 'remove', crewId, userId }); toast(`${p.name} removed`); open(null) }} />
      </div>
    </Sheet>
  )
}

function Pending({ crewId }: { crewId: string }) {
  const { resetTo } = useStore()
  const crew = useCrew(crewId)
  return (
    <Sheet onClose={() => resetTo([{ name: 'home' }, { name: 'crews' }])}>
      <SheetTop icon={<Icon name="lock" size={14} color="var(--muted)" />} label={crew?.name ?? 'Crew'} onClose={() => resetTo([{ name: 'home' }, { name: 'crews' }])} />
      <div className="col" style={{ alignItems: 'center', gap: 8, textAlign: 'center', padding: '8px 0' }}>
        <span style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={24} stroke={2.2} /></span>
        <div className="p">Request sent</div>
        <div className="xs muted">We&apos;ll let you know when an admin or moderator approves it.<br />It&apos;ll appear in My crews once you&apos;re in.</div>
      </div>
      <button className="btn dark" onClick={() => resetTo([{ name: 'home' }, { name: 'crews' }])}>Back to crews</button>
    </Sheet>
  )
}

function DeleteCrew({ crewId }: { crewId: string }) {
  const { d, open, resetTo, toast } = useStore()
  const crew = useCrew(crewId)
  if (!crew) return null
  return (
    <Sheet>
      <SheetTop icon={<Icon name="trash" size={14} color="var(--muted)" />} label="Delete crew" />
      <div><div className="p">Delete {crew.name}?</div><div className="xs muted">This removes the chat, events and all {crew.members.length} members. It can&apos;t be undone.</div></div>
      <div className="row" style={{ gap: 10 }}>
        <button className="btn grow" onClick={() => open(null)}>Cancel</button>
        <button className="btn danger grow" onClick={() => { d({ type: 'delete', crewId }); toast('Crew deleted'); resetTo([{ name: 'home' }, { name: 'crews' }]) }}>Delete</button>
      </div>
    </Sheet>
  )
}

function DeleteEvent({ sheet }: { sheet: Extract<SheetT, { name: 'deleteEvent' }> }) {
  const { d, open, back, toast } = useStore()
  return (
    <Sheet>
      <SheetTop icon={<Icon name="trash" size={14} color="var(--muted)" />} label="Delete event" />
      <div><div className="p">Delete this event?</div><div className="xs muted">Everyone&apos;s RSVPs will be removed too.</div></div>
      <div className="row" style={{ gap: 10 }}>
        <button className="btn grow" onClick={() => open(null)}>Cancel</button>
        <button className="btn danger grow" onClick={() => { d({ type: 'deleteEvent', crewId: sheet.crewId, eventId: sheet.eventId }); toast('Event deleted'); back() }}>Delete</button>
      </div>
    </Sheet>
  )
}

function Code() {
  const { s, push } = useStore()
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const go = (e: React.FormEvent) => {
    e.preventDefault()
    const c = s.crews.find((x) => x.inviteCode.toLowerCase() === code.trim().toLowerCase())
    if (!c) return setErr('That code doesn’t match a crew')
    push({ name: 'inviteLink', crewId: c.id })
  }
  return (
    <Sheet>
      <SheetTop icon={<Icon name="lock" size={14} color="var(--muted)" />} label="Invite code" />
      <form className="col" style={{ gap: 10 }} onSubmit={go}>
        <label className="field"><span className="field-label">Enter the code from your invite link</span>
          <input className="input" autoFocus value={code} onChange={(e) => { setCode(e.target.value); setErr('') }} placeholder="e.g. ceb-4X9" /></label>
        {err && <span className="error">{err}</span>}
        <div className="xs muted">Demo code: <b>ceb-4X9</b> (Foundry End Book Club)</div>
        <button className="btn gold" disabled={!code.trim()}>Open invite</button>
      </form>
    </Sheet>
  )
}
