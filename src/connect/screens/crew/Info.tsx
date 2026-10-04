import { useState } from 'react'
import { A, ME, PEOPLE, uid, type Visibility } from '../../data'
import { canManage, isAdmin, myRole, rsvpCounts, useStore } from '../../store'
import { Icon } from '../../components/Icon'
import { Avatar, AvatarStack, BackHead, CrewAvatar, DateBlock, Panel, PrivacyTag, SectionTitle } from '../../components/ui'

const roleRank = { admin: 0, mod: 1, member: 2 } as const

export function CrewInfo({ crewId }: { crewId: string }) {
  const { s, push, open } = useStore()
  const crew = s.crews.find((c) => c.id === crewId)
  if (!crew) return null
  const admin = isAdmin(crew)
  const manage = canManage(crew)
  const next = [...crew.events].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).find((e) => e.date >= new Date().toISOString().slice(0, 10))
  const known = crew.members.filter((m) => PEOPLE[m.userId]).sort((a, b) => roleRank[a.role] - roleRank[b.role])
  return (
    <Panel head={<BackHead title="Crew info" sub={crew.name} right={admin &&
      <button className="btn xs" onClick={() => push({ name: 'crewForm', crewId })}><Icon name="edit" size={14} stroke={2} />Edit</button>} />}>
      <div className="col" style={{ gap: 12, padding: '14px 16px 24px' }}>
        <div style={{ height: 100, borderRadius: 14, overflow: 'hidden' }}><img src={crew.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
        <div className="col" style={{ gap: 4, marginTop: -40, paddingLeft: 12, alignItems: 'flex-start' }}>
          <CrewAvatar crew={crew} size={52} ring="var(--card)" />
          <div className="p bold">{crew.name}</div>
          <PrivacyTag crew={crew} />
        </div>
        {crew.description && <div>{crew.description}</div>}
        {next && (
          <button className="tile row" style={{ padding: '10px 12px', borderRadius: 12, textAlign: 'left' }} onClick={() => push({ name: 'events', crewId })}>
            <DateBlock e={next} size={34} />
            <span className="grow"><span className="xs muted" style={{ display: 'block' }}>Next event · {rsvpCounts(next).going} going</span><span className="bold ellipsis" style={{ display: 'block' }}>{next.name}</span></span>
            <Icon name="chev" size={14} color="var(--muted)" />
          </button>
        )}
        {manage && crew.requests.length > 0 && (
          <button className="row" style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--gold)', background: 'none', textAlign: 'left' }} onClick={() => open({ name: 'requests', crewId })}>
            <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="userplus" size={14} /></span>
            <span className="grow">{crew.requests.length} join request{crew.requests.length > 1 ? 's' : ''}</span><Icon name="chev" size={14} color="var(--muted)" />
          </button>
        )}
        {!admin && <div className="row xs muted" style={{ alignItems: 'flex-start', gap: 8 }}><Icon name="info" size={13} /><span>Only the admin can change the crew name, description and cover.</span></div>}
        <SectionTitle right={<span className="xs muted">{crew.members.length} total</span>}>Members</SectionTitle>
        <div className="col">
          {known.map((m) => (
            <div key={m.userId} className="row" style={{ padding: '5px 0' }}>
              <Avatar id={m.userId} size={32} />
              <div className="grow"><div>{m.userId === ME ? 'You' : PEOPLE[m.userId].name}</div><div className="xs muted">{m.role === 'admin' ? 'Admin' : m.role === 'mod' ? 'Moderator' : `Joined ${new Date(m.joinedAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`}</div></div>
              {m.role === 'admin' && <span className="badge" style={{ padding: '0 8px' }}>Admin</span>}
              {m.role === 'mod' && <span className="tag" style={{ border: '1px solid var(--gold-dark)', color: 'var(--gold-dark)', fontWeight: 700 }}>Moderator</span>}
              {admin && m.userId !== ME && (
                <button className="btn round" style={{ width: 30, height: 30, border: 0 }} aria-label={`Manage ${PEOPLE[m.userId].name}`} onClick={() => open({ name: 'member', crewId, userId: m.userId })}><Icon name="dots" size={16} stroke={2.4} /></button>
              )}
            </div>
          ))}
          {crew.members.length > known.length && <div className="xs muted" style={{ paddingTop: 6 }}>+ {crew.members.length - known.length} more members</div>}
        </div>
        <button className="btn danger sm" style={{ alignSelf: 'flex-start', marginTop: 8 }} onClick={() => open({ name: 'leave', crewId })}><Icon name="leave" size={14} />Leave crew</button>
      </div>
    </Panel>
  )
}

const COVERS = ['stadium.png', 'read-match.png', 'read-celebrate.png', 'membership.png']

export function CrewForm({ crewId }: { crewId?: string }) {
  const { s, d, replace, back, open, toast } = useStore()
  const crew = s.crews.find((c) => c.id === crewId)
  const [f, setF] = useState({
    name: crew?.name ?? '', description: crew?.description ?? '', visibility: (crew?.visibility ?? 'public') as Visibility,
    memberLimit: crew?.memberLimit ?? 25, cover: crew?.cover ?? A(COVERS[1]),
  })
  const [tried, setTried] = useState(false)
  const nameErr = !f.name.trim() ? 'Give your crew a name' : s.crews.some((c) => c.id !== crewId && c.name.toLowerCase() === f.name.trim().toLowerCase()) ? 'A crew with this name already exists' : ''
  const cycleCover = () => { const i = COVERS.findIndex((c) => f.cover.endsWith(c)); setF({ ...f, cover: A(COVERS[(i + 1) % COVERS.length]) }) }
  const save = () => {
    setTried(true)
    if (nameErr) return
    if (crew) {
      d({ type: 'update', crewId: crew.id, patch: { name: f.name.trim(), description: f.description.trim(), visibility: f.visibility, memberLimit: f.visibility === 'private' ? f.memberLimit : undefined, cover: f.cover } })
      toast('Crew updated'); back()
    } else {
      const id = uid('crew')
      d({ type: 'create', id, data: f })
      toast('Crew created')
      replace({ name: 'crewChat', crewId: id })
    }
  }
  const initials = f.name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?'
  return (
    <Panel head={<BackHead title={crew ? 'Edit crew' : 'New crew'} sub="Arsenal" />}
      foot={<div className="col" style={{ gap: 8 }}>
        <button className="btn gold block" style={{ height: 48, fontWeight: 700 }} onClick={save}>{crew ? 'Save changes' : 'Create crew'}</button>
        {crew && isAdmin(crew) && <button className="btn" style={{ border: 0, color: 'var(--danger)', height: 28 }} onClick={() => open({ name: 'deleteCrew', crewId: crew.id })}>Delete crew</button>}
      </div>}>
      <div className="col" style={{ gap: 14, padding: '16px 16px 24px' }}>
        <div style={{ position: 'relative', height: 92, borderRadius: 14, overflow: 'hidden' }}>
          <img src={f.cover} alt="Crew cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <button className="row" style={{ position: 'absolute', right: 10, top: 10, height: 28, padding: '0 10px', borderRadius: 14, border: 0, background: 'rgba(20,19,18,.7)', color: '#fff', fontSize: 11, gap: 5 }} onClick={cycleCover}>
            <Icon name="image" size={13} />Change cover</button>
        </div>
        <div style={{ marginTop: -40, marginLeft: 14, width: 58, height: 58, borderRadius: '50%', border: '3px solid var(--card)', background: crew?.color ?? '#9E1B22', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, position: 'relative' }}>{initials}</div>
        <label className="field"><span className="field-label">Crew name<small>{f.name.length} / 40</small></span>
          <input className="input" maxLength={40} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Clock End Regulars" />
          {tried && nameErr && <span className="error">{nameErr}</span>}</label>
        <label className="field"><span className="field-label">Description<small>Optional</small></span>
          <textarea className="input" maxLength={160} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="What brings this crew together?" /></label>
        <div className="field"><span className="field-label">Visibility</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }} role="radiogroup" aria-label="Visibility">
            {([['public', 'globe', 'Public', 'In Discover. Anyone joins, no limit'], ['private', 'lock', 'Private', 'Link only. Admins approve requests']] as const).map(([k, ic, l, sub]) => (
              <button key={k} role="radio" aria-checked={f.visibility === k} onClick={() => setF({ ...f, visibility: k })}
                style={{ minHeight: 64, borderRadius: 10, border: `1px solid ${f.visibility === k ? 'var(--gold)' : '#b5b0aa'}`, background: f.visibility === k ? '#f6f4f1' : 'transparent', textAlign: 'left', padding: '8px 12px' }}>
                <span className="row" style={{ gap: 5, fontWeight: 500 }}><Icon name={ic} size={13} />{l}</span><span className="xs muted" style={{ display: 'block' }}>{sub}</span>
              </button>
            ))}
          </div>
        </div>
        {f.visibility === 'private' && (
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 500 }}>Member limit</span>
            <div className="row" style={{ gap: 12 }}>
              <button className="btn round" style={{ width: 32, height: 32 }} aria-label="Fewer members" onClick={() => setF({ ...f, memberLimit: Math.max(Math.max(5, crew?.members.length ?? 0), f.memberLimit - 5) })}><Icon name="minus" /></button>
              <span className="p bold" style={{ minWidth: 28, textAlign: 'center' }} aria-live="polite">{f.memberLimit}</span>
              <button className="btn round" style={{ width: 32, height: 32 }} aria-label="More members" onClick={() => setF({ ...f, memberLimit: Math.min(200, f.memberLimit + 5) })}><Icon name="plus" /></button>
            </div>
          </div>
        )}
      </div>
    </Panel>
  )
}

export function InviteLanding({ crewId }: { crewId: string }) {
  const { s, d, open, replace } = useStore()
  const crew = s.crews.find((c) => c.id === crewId)
  if (!crew) return null
  const joined = !!myRole(crew)
  const pending = s.pending.includes(crew.id)
  const full = crew.memberLimit !== undefined && crew.members.length >= crew.memberLimit
  const shown = crew.members.filter((m) => PEOPLE[m.userId]).slice(0, 4).map((m) => m.userId)
  return (
    <Panel head={<BackHead title="Invite" sub="Private crew" />}>
      <div className="col" style={{ gap: 12, padding: '14px 16px 24px' }}>
        <div style={{ height: 120, borderRadius: 14, overflow: 'hidden' }}><img src={crew.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
        <div className="col" style={{ gap: 6, marginTop: -40, paddingLeft: 12, alignItems: 'flex-start' }}>
          <CrewAvatar crew={crew} size={56} ring="var(--card)" />
          <div className="h5" style={{ fontWeight: 500 }}>{crew.name}</div>
          <PrivacyTag crew={crew} />
        </div>
        <div>{crew.description}</div>
        <div className="row xs muted"><AvatarStack ids={shown} size={24} ring="var(--card)" />{crew.members.length} members · messages are hidden until you&apos;re in</div>
        {joined ? <button className="btn gold block" onClick={() => replace({ name: 'crewChat', crewId })}>Open crew</button>
          : full ? <div className="tile" style={{ padding: 12, textAlign: 'center' }}>This crew is full ({crew.memberLimit} members). Ask an admin to raise the limit.</div>
          : pending ? <div className="tile" style={{ padding: 12, textAlign: 'center' }}>Request sent. You&apos;ll be notified when an admin or moderator approves it.</div>
          : <>
            <button className="btn gold block" onClick={() => { d({ type: 'request', crewId }); open({ name: 'pending', crewId }) }}>Request to join</button>
            <div className="xs muted" style={{ textAlign: 'center' }}>An admin or moderator will review your request</div>
          </>}
      </div>
    </Panel>
  )
}
