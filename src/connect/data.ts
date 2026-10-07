// Types and seed data. In production these come from the Connect API (one shared, multi-tenant DB).

export type Role = 'admin' | 'mod' | 'member'
export type Rsvp = 'going' | 'maybe' | 'no'
export type Repeat = 'none' | 'weekly' | 'home'
export type Visibility = 'public' | 'private'

export interface Person { id: string; name: string; initials: string; color: string; photo?: string }

export interface Member { userId: string; role: Role; joinedAt: string }

export interface JoinRequest { userId: string; invitedBy?: string; at: number }

export interface CrewEvent {
  id: string
  name: string
  date: string // yyyy-mm-dd
  time: string // HH:mm
  location: string
  description: string
  repeat: Repeat
  createdBy: string
  rsvps: Record<string, Rsvp>
}

export type MessageKind = 'text' | 'system' | 'event' | 'held'
export interface Message {
  id: string
  authorId: string
  text: string
  at: number
  kind: MessageKind
  eventId?: string
}

export interface Crew {
  id: string
  name: string
  description: string
  initials: string
  color: string
  cover: string
  visibility: Visibility
  memberLimit?: number // private crews only
  members: Member[]
  requests: JoinRequest[]
  messages: Message[]
  events: CrewEvent[]
  pinnedEventId?: string
  inviteCode: string
}

export const ME = 'me'
// Images live in src/assets so Vite fingerprints them (and inlines them in the single-file build).
const ASSETS = import.meta.glob('./assets/*.{png,jpg}', { eager: true, import: 'default' }) as Record<string, string>
export const A = (f: string) => ASSETS[`./assets/${f}`] ?? ''

export const PEOPLE: Record<string, Person> = {
  me: { id: 'me', name: 'You', initials: 'DO', color: '#9B6BEA', photo: A('user-avatar.png') },
  oh: { id: 'oh', name: 'Olivia H.', initials: 'OH', color: '#E8C35C' },
  ta: { id: 'ta', name: 'Tom A.', initials: 'TA', color: '#2A9D8F' },
  em: { id: 'em', name: 'Ella M.', initials: 'EM', color: '#3B7BE0' },
  ko: { id: 'ko', name: 'Katie O.', initials: 'KO', color: '#D9774B' },
  hw: { id: 'hw', name: 'Harry W.', initials: 'HW', color: '#3B7BE0' },
  cp: { id: 'cp', name: 'Chloe P.', initials: 'CP', color: '#D9774B' },
  jk: { id: 'jk', name: 'Jack K.', initials: 'JK', color: '#2A9D8F' },
  lb: { id: 'lb', name: 'Lucy B.', initials: 'LB', color: '#4A7C59' },
  gt: { id: 'gt', name: 'George T.', initials: 'GT', color: '#E8C35C' },
  df: { id: 'df', name: 'Daisy F.', initials: 'DF', color: '#3B7BE0' },
  sb: { id: 'sb', name: 'Sam B.', initials: 'SB', color: '#4A7C59' },
  rn: { id: 'rn', name: 'Rachel N.', initials: 'RN', color: '#3B7BE0' },
  yr: { id: 'yr', name: 'Yusuf R.', initials: 'YR', color: '#6B5B95' },
  // Track A fan chat
  kl: { id: 'kl', name: 'Karim.L', initials: 'KL', color: '#3B7BE0' },
  ma: { id: 'ma', name: 'Mohamed A.', initials: 'MA', color: '#E8C35C' },
  fz: { id: 'fz', name: 'Fatima Z.', initials: 'FZ', color: '#2A9D8F' },
  jd: { id: 'jd', name: 'John Doe', initials: 'JD', color: '#2A9D8F' },
  ls: { id: 'ls', name: 'Lina Smith', initials: 'LS', color: '#E8C35C' },
  kt: { id: 'kt', name: 'Kevin T.', initials: 'KT', color: '#2A9D8F' },
}

const now = Date.now()
const m = (mins: number) => now - mins * 60_000
let seq = 0
export const uid = (p = 'id') => `${p}_${Date.now().toString(36)}_${(seq++).toString(36)}`

const member = (userId: string, role: Role = 'member', joinedAt = '2026-08-01'): Member => ({ userId, role, joinedAt })
const filler = (n: number, prefix: string) =>
  Array.from({ length: n }, (_, i) => member(`${prefix}${i}`))

export function seedCrews(): Crew[] {
  return [
    {
      id: 'nbc', name: 'East Stand Collective', initials: 'ES', color: '#7B2FE2', cover: A('stadium.jpg'),
      description: 'East Stand regulars. Pre-match pints, block 9 seats and post-match debriefs.',
      visibility: 'private', memberLimit: 30, inviteCode: 'nbc-7Q2',
      members: [member(ME, 'admin', '2026-08-02'), member('oh', 'mod'), member('ta'), member('em'), member('ko'), ...filler(19, 'nbc')],
      requests: [
        { userId: 'lb', invitedBy: 'ta', at: m(5) },
        { userId: 'gt', invitedBy: 'oh', at: m(60) },
        { userId: 'df', at: m(180) },
      ],
      pinnedEventId: 'ev_tol',
      events: [
        { id: 'ev_tol', name: 'Pre-match at the Lamplighter', date: '2026-10-25', time: '13:00', location: 'The Lamplighter, Arc Road',
          description: 'Corner table by the window. Leave for the ground at 14:15, seats in block 9. Bring your membership card.',
          repeat: 'home', createdBy: 'oh', rsvps: { me: 'going', oh: 'going', ta: 'going', em: 'maybe', ...fillRsvp(11, 'nbc', 'going'), ...fillRsvp(2, 'nbcm', 'maybe') } },
        { id: 'ev_watch', name: 'European night watch party', date: '2026-10-22', time: '19:30', location: 'The Foundry Tap, Mill Lane',
          description: 'Big screen booked. Food from 7.', repeat: 'none', createdBy: 'ta', rsvps: { ta: 'going', ko: 'going', em: 'maybe', ...fillRsvp(9, 'nbcw', 'going') } },
        { id: 'ev_che', name: 'Kingsmere away: travel together', date: '2026-11-09', time: '10:30', location: 'Meet at Voltford Central',
          description: '10:52 train to Kingsmere. Pub first, then the away end.', repeat: 'none', createdBy: 'oh', rsvps: { oh: 'going', ...fillRsvp(7, 'nbcc', 'going'), ...fillRsvp(4, 'nbccm', 'maybe') } },
      ],
      messages: [
        { id: 'm1', authorId: 'oh', text: 'Who’s at the Lamplighter before kick-off? 🍻', at: m(70), kind: 'text' },
        { id: 'm2', authorId: 'ta', text: 'European night watch party', at: m(60), kind: 'event', eventId: 'ev_watch' },
        { id: 'm3', authorId: 'ta', text: 'In for Wednesday. I’ll grab the big table by the screen', at: m(40), kind: 'text' },
        { id: 'm4', authorId: 'system', text: 'Tom invited Katie O. to the crew', at: m(20), kind: 'system' },
        { id: 'm5', authorId: 'ko', text: 'Thanks for the add! First time at the Arc this season 🙌', at: m(6), kind: 'text' },
        { id: 'm6', authorId: 'em', text: 'Welcome Katie! You’re sitting with us in block 9', at: m(2), kind: 'text' },
      ],
    },
    {
      id: 'adt', name: 'Away Day Travellers', initials: 'AD', color: '#2A9D8F', cover: A('coach.jpg'),
      description: 'Coaches, trains and tickets for every away trip.', visibility: 'public', inviteCode: 'adt-K81',
      members: [member('yr', 'admin'), member('ta', 'mod'), member(ME), ...filler(12, 'adt')], requests: [], events: [],
      messages: [{ id: 'a1', authorId: 'ta', text: 'Coach leaves Voltford Central at 8 sharp', at: m(18), kind: 'text' }],
    },
    {
      id: 'tac', name: 'Tactics Board', initials: 'TB', color: '#3B7BE0', cover: A('read-match.jpg'),
      description: 'Shape, set pieces and transfer talk.', visibility: 'private', memberLimit: 50, inviteCode: 'tac-P20',
      members: [member('em', 'admin'), member(ME), ...filler(39, 'tac')], requests: [], events: [],
      messages: [{ id: 't1', authorId: 'em', text: 'Hale in the 8 is working, leave him there', at: m(60), kind: 'text' }],
    },
    pub('gil', 'Volts Pub Club', 'VP', '#D62086', 'read-celebrate.jpg', 'Pub meetups and watch parties across Voltford.', 32),
    pub('wtw', 'Women’s Team Watch', 'WT', '#D9774B', 'read-match.jpg', 'Every Voltford Women fixture, live together.', 19),
    pub('yg', 'Young Volts', 'YV', '#4A7C59', 'read-celebrate.jpg', 'Following academy talent up through the ranks.', 11),
    pub('aex', 'Away End Express', 'AE', '#6B5B95', 'stadium.jpg', 'Sharing trains, tickets and stories from every away end.', 28),
    pub('fas', 'Five-a-side Volts', 'FS', '#3B7BE0', 'stadium.jpg', 'Weekly kickabouts in Riverside Park, all levels welcome.', 22),
    // A private crew you are not in: used for the "opened invite link" flow.
    {
      id: 'ceb', name: 'Foundry End Book Club', initials: 'FB', color: '#7A5C3A', cover: A('read-celebrate.jpg'),
      description: 'Club history books and pre-match coffee.', visibility: 'private', memberLimit: 20, inviteCode: 'ceb-4X9',
      members: [member('sb', 'admin'), member('rn'), ...filler(10, 'ceb')], requests: [], events: [], messages: [],
    },
  ]
}

function fillRsvp(n: number, prefix: string, r: Rsvp) {
  return Object.fromEntries(Array.from({ length: n }, (_, i) => [`${prefix}${i}`, r]))
}

function pub(id: string, name: string, initials: string, color: string, cover: string, description: string, size: number): Crew {
  return {
    id, name, initials, color, cover: A(cover), description, visibility: 'public', inviteCode: `${id}-PUB`,
    members: [member('sb', 'admin'), member('rn'), member('oh'), ...filler(size - 3, id)],
    requests: [], events: [], messages: [{ id: `${id}_1`, authorId: 'sb', text: `Welcome to ${name}! Say hi 👋`, at: m(300), kind: 'text' }],
  }
}

// Track A: universal fan chat (unchanged by the Crew module)
export interface FanMessage { id: string; authorId: string; text: string; at: number }
export const seedFanChat = (): FanMessage[] => [
  { id: 'f1', authorId: 'jd', text: 'Counting down to kickoff! Let’s secure the win 🎉', at: m(58) },
  { id: 'f2', authorId: 'ls', text: 'Still buzzing from that last victory! 🥳', at: m(53) },
  { id: 'f3', authorId: 'oh', text: 'Who else is at the Arc today? 💜⚡', at: m(49) },
  { id: 'f4', authorId: 'ma', text: 'New signing looked sharp in training all week 💪', at: m(44) },
  { id: 'f5', authorId: 'hw', text: 'Calling it now: 2-0, Reyes with the opener 🎯', at: m(40) },
  { id: 'f6', authorId: 'fz', text: 'Anyone meeting at the Lamplighter before? 🍻', at: m(35) },
  { id: 'f7', authorId: 'kt', text: 'Hale has been absolutely immense this season 🙌', at: m(31) },
  { id: 'f8', authorId: 'cp', text: 'Queuing for the shop — the new kit is 🔥', at: m(27) },
  { id: 'f9', authorId: 'kl', text: 'Go Volts! Ready for the big clash 💜⚡', at: m(22) },
  { id: 'f10', authorId: 'jk', text: 'Atmosphere already building out here 📣', at: m(18) },
  { id: 'f11', authorId: 'lb', text: 'COYV!! up the Volts 💜', at: m(14) },
  { id: 'f12', authorId: 'gt', text: 'Traffic on Arc Road is mad, leave early 🚗', at: m(11) },
  { id: 'f13', authorId: 'me', text: 'Squad announcement when?! 👀', at: m(9) },
  { id: 'f14', authorId: 'em', text: 'Lineup’s out — Brandt captains 🙌', at: m(6) },
  { id: 'f15', authorId: 'ta', text: 'Let’s gooo. East Stand in full voice 🎶', at: m(4) },
  { id: 'f16', authorId: 'yr', text: 'On my way — hold me a seat, row J 🙏', at: m(2) },
  { id: 'f17', authorId: 'rn', text: 'One hour to kickoff!! nerves kicking in 😅', at: m(1) },
]

export type Product = { id: string; name: string; price: number; reviews: number; img: string; badge?: string }
export const PRODUCTS: Product[] = [
  { id: 'p1', name: 'Voltford Strata 26/27 Authentic Home Shirt', price: 120.99, reviews: 229, img: A('shirt.jpg'), badge: 'New in' },
  { id: 'p3', name: 'Voltford 26/27 Home Shirt', price: 84.99, reviews: 312, img: A('shirt.jpg') },
  { id: 'p4', name: 'Voltford Kids 26/27 Home Shirt', price: 54.99, reviews: 86, img: A('shirt.jpg'), badge: 'Kids' },
]

export type Read = { id: string; title: string; tag: string; ago: string; img?: string; author: string; dek: string; body: string[] }
export const READS: Read[] = [
  {
    id: 'r1', title: 'Rinaldi hails defensive effort after win at Harrow Vale', tag: 'Match Report', ago: '2 days ago', img: A('read-match.jpg'),
    author: 'Voltford FC staff',
    dek: 'The defender was full of praise for the back line after a hard-fought three points at Oakfield Park.',
    body: [
      'Matteo Rinaldi was quick to credit his team-mates after Voltford ground out a vital away win, pointing to the collective shift off the ball as the difference on the night.',
      '“We defended as a unit from the front,” he said. “Everyone ran for each other — that’s what wins you these away games. The clean sheet belongs to all eleven, not just the back four.”',
      'The result lifts the Volts up the table ahead of a busy run of fixtures, with the manager rotating his squad to keep legs fresh for the derby to come.',
    ],
  },
  {
    id: 'r2', title: '38 shots from a relentless away day', tag: 'Analysis', ago: '2 days ago', img: A('read-celebrate.jpg'),
    author: 'Josh Wright',
    dek: 'A deep dive into the numbers behind one of the most dominant away performances of the season.',
    body: [
      'Thirty-eight shots, nineteen of them on target, and an xG north of three. By almost every attacking metric, this was a statement away day for Voltford.',
      'The pressing numbers tell the same story: the front line forced turnovers high up the pitch again and again, turning defence into attack in a matter of seconds.',
      'If the finishing had matched the creation, this could have been a rout. As it was, three points and a growing sense that this side can win ugly as well as pretty.',
    ],
  },
  {
    id: 'r3', title: 'Ferro proud of squad after win at Oakfield Park', tag: 'Club', ago: '3 days ago', img: A('stadium.jpg'),
    author: 'Voltford FC staff',
    dek: 'The manager reflected on character, depth and the standards the group is setting for itself.',
    body: [
      'Tomás Ferro reserved special praise for his squad’s mentality after a demanding evening at Harrow Vale, describing the performance as “exactly what the badge demands.”',
      '“I’m proud of them,” he said. “The way they fought for each other, the discipline without the ball — these are the nights that build a team.”',
      'Attention now turns to the next fixture, with the manager confirming the group came through the game without fresh injury concerns.',
    ],
  },
]

// Simple stand-in for Connect's OpenAI-based moderation. Swap for the real API call.
export const BLOCKED_WORDS = ['idiot', 'stupid', 'rubbish ref', 'scum', 'hate']
export function moderate(text: string): boolean {
  const t = text.toLowerCase()
  return !BLOCKED_WORDS.some((w) => t.includes(w)) && !/\*{3,}/.test(text)
}
