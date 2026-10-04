import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import {
  ME, PEOPLE, moderate, seedCrews, seedFanChat, uid,
  type Crew, type CrewEvent, type FanMessage, type Role, type Rsvp, type Visibility,
} from './data'

// ---------------- State ----------------
export interface State {
  crews: Crew[]
  fanChat: FanMessage[]
  pinnedCrews: string[]
  muted: string[]
  lastRead: Record<string, number>
  pending: string[] // private crews I have asked to join
}

const STORAGE_KEY = 'arsenal-fan-page-2:v1'

function initial(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as State
  } catch { /* storage blocked or corrupt: fall back to seed */ }
  return { crews: seedCrews(), fanChat: seedFanChat(), pinnedCrews: ['nbc'], muted: [], lastRead: { tac: Date.now() }, pending: [] }
}

export type NewCrew = { name: string; description: string; visibility: Visibility; memberLimit?: number; cover: string }
export type EventInput = Omit<CrewEvent, 'id' | 'createdBy' | 'rsvps'>

type Action =
  | { type: 'reset' }
  | { type: 'fanSend'; text: string }
  | { type: 'send'; crewId: string; text: string }
  | { type: 'join'; crewId: string }
  | { type: 'request'; crewId: string }
  | { type: 'approveMe'; crewId: string }
  | { type: 'leave'; crewId: string }
  | { type: 'create'; id: string; data: NewCrew }
  | { type: 'update'; crewId: string; patch: Partial<Crew> }
  | { type: 'delete'; crewId: string }
  | { type: 'togglePin'; crewId: string }
  | { type: 'toggleMute'; crewId: string }
  | { type: 'read'; crewId: string }
  | { type: 'rsvp'; crewId: string; eventId: string; value: Rsvp }
  | { type: 'saveEvent'; crewId: string; eventId?: string; data: EventInput; pin: boolean }
  | { type: 'deleteEvent'; crewId: string; eventId: string }
  | { type: 'pinEvent'; crewId: string; eventId?: string }
  | { type: 'accept'; crewId: string; userId: string }
  | { type: 'decline'; crewId: string; userId: string }
  | { type: 'setRole'; crewId: string; userId: string; role: Role }
  | { type: 'remove'; crewId: string; userId: string }
  | { type: 'invite'; crewId: string; userId: string }

const sys = (text: string) => ({ id: uid('m'), authorId: 'system', text, at: Date.now(), kind: 'system' as const })
const today = () => new Date().toISOString().slice(0, 10)

function reducer(s: State, a: Action): State {
  const upd = (id: string, f: (c: Crew) => Crew): State => ({ ...s, crews: s.crews.map((c) => (c.id === id ? f(c) : c)) })
  switch (a.type) {
    case 'reset':
      return { crews: seedCrews(), fanChat: seedFanChat(), pinnedCrews: ['nbc'], muted: [], lastRead: {}, pending: [] }
    case 'fanSend':
      return { ...s, fanChat: [...s.fanChat, { id: uid('f'), authorId: ME, text: a.text, at: Date.now() }] }
    case 'send': {
      const ok = moderate(a.text)
      const msg = { id: uid('m'), authorId: ME, text: a.text, at: Date.now(), kind: ok ? ('text' as const) : ('held' as const) }
      return { ...upd(a.crewId, (c) => ({ ...c, messages: [...c.messages, msg] })), lastRead: { ...s.lastRead, [a.crewId]: Date.now() } }
    }
    case 'join':
      return upd(a.crewId, (c) => ({
        ...c,
        members: [...c.members, { userId: ME, role: 'member', joinedAt: today() }],
        messages: [...c.messages, sys('You joined the crew')],
      }))
    case 'request':
      return {
        ...upd(a.crewId, (c) => ({ ...c, requests: [...c.requests, { userId: ME, at: Date.now() }] })),
        pending: [...s.pending, a.crewId],
      }
    case 'approveMe': {
      const next = upd(a.crewId, (c) => ({
        ...c,
        requests: c.requests.filter((r) => r.userId !== ME),
        members: [...c.members, { userId: ME, role: 'member', joinedAt: today() }],
        messages: [...c.messages, sys('Your request was approved. Welcome in!')],
      }))
      return { ...next, pending: s.pending.filter((p) => p !== a.crewId) }
    }
    case 'leave': {
      const next = upd(a.crewId, (c) => {
        let members = c.members.filter((m) => m.userId !== ME)
        // If the admin leaves, hand admin to a moderator, else the longest-standing member.
        if (c.members.find((m) => m.userId === ME)?.role === 'admin' && members.length) {
          const heir = members.find((m) => m.role === 'mod') ?? members[0]
          members = members.map((m) => (m.userId === heir.userId ? { ...m, role: 'admin' } : m))
        }
        return { ...c, members, messages: [...c.messages, sys('You left the crew')] }
      })
      return { ...next, pinnedCrews: s.pinnedCrews.filter((p) => p !== a.crewId) }
    }
    case 'create': {
      const d = a.data
      const crew: Crew = {
        id: a.id, name: d.name.trim(), description: d.description.trim(), visibility: d.visibility,
        memberLimit: d.visibility === 'private' ? d.memberLimit : undefined, cover: d.cover,
        initials: d.name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join(''),
        color: '#9E1B22', inviteCode: `${a.id.slice(-6)}`,
        members: [{ userId: ME, role: 'admin', joinedAt: today() }], requests: [], events: [],
        messages: [sys('You started the crew. Invite fans or post your first event.')],
      }
      return { ...s, crews: [crew, ...s.crews], lastRead: { ...s.lastRead, [a.id]: Date.now() } }
    }
    case 'update':
      return upd(a.crewId, (c) => ({ ...c, ...a.patch }))
    case 'delete':
      return { ...s, crews: s.crews.filter((c) => c.id !== a.crewId), pinnedCrews: s.pinnedCrews.filter((p) => p !== a.crewId) }
    case 'togglePin':
      return { ...s, pinnedCrews: s.pinnedCrews.includes(a.crewId) ? s.pinnedCrews.filter((p) => p !== a.crewId) : [a.crewId, ...s.pinnedCrews] }
    case 'toggleMute':
      return { ...s, muted: s.muted.includes(a.crewId) ? s.muted.filter((p) => p !== a.crewId) : [...s.muted, a.crewId] }
    case 'read':
      return { ...s, lastRead: { ...s.lastRead, [a.crewId]: Date.now() } }
    case 'rsvp':
      return upd(a.crewId, (c) => ({
        ...c,
        events: c.events.map((e) => (e.id === a.eventId ? { ...e, rsvps: { ...e.rsvps, [ME]: a.value } } : e)),
      }))
    case 'saveEvent': {
      if (a.eventId) {
        return upd(a.crewId, (c) => ({
          ...c,
          events: c.events.map((e) => (e.id === a.eventId ? { ...e, ...a.data } : e)),
          pinnedEventId: a.pin ? a.eventId : c.pinnedEventId === a.eventId ? undefined : c.pinnedEventId,
        }))
      }
      const ev: CrewEvent = { ...a.data, id: uid('ev'), createdBy: ME, rsvps: { [ME]: 'going' } }
      return upd(a.crewId, (c) => ({
        ...c,
        events: [...c.events, ev],
        pinnedEventId: a.pin ? ev.id : c.pinnedEventId,
        messages: [...c.messages, { id: uid('m'), authorId: ME, text: ev.name, at: Date.now(), kind: 'event', eventId: ev.id }],
      }))
    }
    case 'deleteEvent':
      return upd(a.crewId, (c) => ({
        ...c,
        events: c.events.filter((e) => e.id !== a.eventId),
        messages: c.messages.filter((m) => m.eventId !== a.eventId),
        pinnedEventId: c.pinnedEventId === a.eventId ? undefined : c.pinnedEventId,
      }))
    case 'pinEvent':
      return upd(a.crewId, (c) => ({ ...c, pinnedEventId: a.eventId }))
    case 'accept':
      return upd(a.crewId, (c) => ({
        ...c,
        requests: c.requests.filter((r) => r.userId !== a.userId),
        members: [...c.members, { userId: a.userId, role: 'member', joinedAt: today() }],
        messages: [...c.messages, sys(`${PEOPLE[a.userId]?.name ?? 'A fan'} joined the crew`)],
      }))
    case 'decline':
      return upd(a.crewId, (c) => ({ ...c, requests: c.requests.filter((r) => r.userId !== a.userId) }))
    case 'setRole':
      return upd(a.crewId, (c) => ({
        ...c,
        members: c.members.map((m) => (m.userId === a.userId ? { ...m, role: a.role } : m)),
        messages: [...c.messages, sys(`${PEOPLE[a.userId]?.name} is now ${a.role === 'mod' ? 'a moderator' : 'a member'}`)],
      }))
    case 'remove':
      return upd(a.crewId, (c) => ({
        ...c,
        members: c.members.filter((m) => m.userId !== a.userId),
        messages: [...c.messages, sys(`${PEOPLE[a.userId]?.name} was removed from the crew`)],
      }))
    case 'invite':
      return upd(a.crewId, (c) => {
        const me = c.members.find((m) => m.userId === ME)
        const canApprove = me && me.role !== 'member'
        if (c.members.some((m) => m.userId === a.userId)) return c
        if (canApprove || c.visibility === 'public') {
          return {
            ...c,
            members: [...c.members, { userId: a.userId, role: 'member', joinedAt: today() }],
            messages: [...c.messages, sys(`You added ${PEOPLE[a.userId]?.name} to the crew`)],
          }
        }
        return { ...c, requests: [...c.requests, { userId: a.userId, invitedBy: ME, at: Date.now() }] }
      })
  }
}

// ---------------- Navigation ----------------
export type Route =
  | { name: 'home' }
  | { name: 'fanChat' }
  | { name: 'iris' }
  | { name: 'shop' }
  | { name: 'article'; articleId: string }
  | { name: 'crews' }
  | { name: 'crewSearch' }
  | { name: 'crewDiscover' }
  | { name: 'crewChat'; crewId: string }
  | { name: 'crewInfo'; crewId: string }
  | { name: 'crewForm'; crewId?: string }
  | { name: 'events'; crewId: string }
  | { name: 'event'; crewId: string; eventId: string }
  | { name: 'eventForm'; crewId: string; eventId?: string }
  | { name: 'inviteLink'; crewId: string }

export type Sheet =
  | { name: 'preview'; crewId: string }
  | { name: 'invite'; crewId: string }
  | { name: 'menu'; crewId: string }
  | { name: 'leave'; crewId: string }
  | { name: 'rowActions'; crewId: string }
  | { name: 'requests'; crewId: string }
  | { name: 'member'; crewId: string; userId: string }
  | { name: 'pending'; crewId: string }
  | { name: 'deleteCrew'; crewId: string }
  | { name: 'code'; crewId: string }
  | { name: 'deleteEvent'; crewId: string; eventId: string }

interface Ctx {
  s: State
  d: (a: Action) => void
  route: Route
  push: (r: Route) => void
  back: () => void
  replace: (r: Route) => void
  resetTo: (r: Route[]) => void
  sheet: Sheet | null
  open: (s: Sheet | null) => void
  toast: (t: string) => void
  toastText: string | null
}

const StoreCtx = createContext<Ctx | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, d] = useReducer(reducer, undefined, initial)
  const [stack, setStack] = useState<Route[]>([{ name: 'home' }])
  const [sheet, open] = useState<Sheet | null>(null)
  const [toastText, setToast] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch { /* ignore */ }
  }, [s])

  // Demo: a pending request to a private crew is approved by a moderator after a few seconds.
  useEffect(() => {
    if (!s.pending.length) return
    const id = window.setTimeout(() => {
      const crewId = s.pending[0]
      d({ type: 'approveMe', crewId })
      const name = s.crews.find((c) => c.id === crewId)?.name
      setToast(`You're in! ${name} approved your request`)
    }, 6000)
    return () => clearTimeout(id)
  }, [s.pending, s.crews])

  const value = useMemo<Ctx>(() => ({
    s, d,
    route: stack[stack.length - 1],
    push: (r) => { open(null); setStack((st) => [...st, r]) },
    back: () => { open(null); setStack((st) => (st.length > 1 ? st.slice(0, -1) : st)) },
    replace: (r) => { open(null); setStack((st) => [...st.slice(0, -1), r]) },
    resetTo: (rs) => { open(null); setStack(rs) },
    sheet, open,
    toastText,
    toast: (t) => {
      setToast(t)
      clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setToast(null), 2600)
    },
  }), [s, stack, sheet, toastText])

  useEffect(() => {
    if (!toastText) return
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(null), 2600)
  }, [toastText])

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

export function useStore() {
  const c = useContext(StoreCtx)
  if (!c) throw new Error('useStore outside provider')
  return c
}

// ---------------- Selectors ----------------
export const myRole = (c: Crew): Role | null => c.members.find((m) => m.userId === ME)?.role ?? null
export const canManage = (c: Crew) => { const r = myRole(c); return r === 'admin' || r === 'mod' }
export const isAdmin = (c: Crew) => myRole(c) === 'admin'
export const onlineCount = (c: Crew) => Math.max(1, Math.round(c.members.length / 4))
export function unread(s: State, c: Crew) {
  const t = s.lastRead[c.id] ?? 0
  return c.messages.filter((m) => m.at > t && m.authorId !== ME && m.kind !== 'system').length
}
export function lastMessage(c: Crew) {
  const m = [...c.messages].reverse().find((x) => x.kind !== 'held')
  if (!m) return ''
  if (m.kind === 'system') return m.text
  const who = m.authorId === ME ? 'You' : PEOPLE[m.authorId]?.name.split(' ')[0] ?? 'Someone'
  return m.kind === 'event' ? `${who} posted an event: ${m.text}` : `${who}: ${m.text}`
}
export function rsvpCounts(e: CrewEvent) {
  const v = Object.values(e.rsvps)
  return { going: v.filter((x) => x === 'going').length, maybe: v.filter((x) => x === 'maybe').length }
}
