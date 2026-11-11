// ═══════════════════════════════════════════════════════════════════════
// Connect Events · event configuration.
// Everything an event shows lives in one EventConfig: brand, event basics,
// segments, reveal, hero image + hotspots, polls, announcements, reminders,
// presenters, sponsors, IRIS approved answers, the call to action, chat
// script, community/next event and the demo numbers. The fan view and Studio
// render only from the selected config. Samples ship in code; events made or
// edited in the Studio builder are kept in this browser's localStorage.
// ═══════════════════════════════════════════════════════════════════════
import { BASE } from '../base';
import { AURORA_NOVA } from './samples/aurora-nova';
// Second sample, built through the Studio builder and exported as JSON.
import { TIDEWELL } from './samples/tidewell';
// Sports samples: an endurance race over three days, and a three-stage series.
import { SPORTS } from './samples/sports';

export type Ms = 'before' | 'live' | 'break' | 'after' | 'community';
export type Mode = 'venue' | 'online';
export type Target = 'all' | 'venue' | 'online';
export type TriggerKind = 'reveal' | 'poll' | 'hotspot' | 'announce' | 'challenge';
export type SegKind = 'doors' | 'talk' | 'reveal' | 'qa' | 'other';
export type QA = { q: string; a: string; stat?: string; label?: string; keys?: string };
export type Poll = { id: string; q: string; opts: Record<string, number>; votes: number; sponsor?: string };
export type Msg = { kicker: string; title: string; sub: string; sponsor?: string };
// Sports extras. Challenges earn points; rewards unlock at a points total.
// A challenge, poll or announcement can be owned by a sponsor (sponsorKit name).
export type ChallengeKind = 'predict' | 'checkin' | 'trivia' | 'poll';
export type Challenge = { id: string; kind: ChallengeKind; title: string; sub: string; points: number; options?: string[]; answer?: string; poll?: string; sponsor?: string };
export type Reward = { id: string; name: string; sub: string; points: number; stock: number; sponsor?: string };
export type SponsorBadge = { name: string; short: string; color: string };
// Interest + lead model (proposal: one consented profile per person, scored and routed).
export type LeadStatus = 'New' | 'Contacted' | 'Booked' | 'Reserved' | 'Sold' | 'Not now';
export const LEAD_STATUSES: LeadStatus[] = ['New', 'Contacted', 'Booked', 'Reserved', 'Sold', 'Not now'];
export type Signals = { features: number; polls: number; iris: number; questions: number; built: boolean; finance: boolean; booked: boolean; checkedIn: boolean; following: boolean };
export type Lead = {
  id: string; name: string; where: Mode; answers: Record<string, string>; consent: boolean;
  source: string; signals: Signals; seen?: string[]; colour?: string; variant?: string; monthly?: string;
  route: string; status: LeadStatus; at: string;
};

export interface EventConfig {
  id: string;
  version: 1;
  status: 'live' | 'upcoming' | 'draft' | 'past';
  brand: {
    name: string;            // "Aurora Motors"
    wordmark: string;        // header text, e.g. "AURORA NOVA"
    wordmarkShort: string;   // header text under 380px
    logo: string;            // URL or data: URL (square)
    accent: string;          // brand accent (buttons, highlights)
    dark: string;            // dark brand base (heroes, panels)
    domain: string;          // the address pill at the foot of the fan view
  };
  event: {
    name: string; template: 'launch' | 'conference' | 'fan' | 'sport'; format: 'In person' | 'Online' | 'Hybrid';
    date: string; time: string; dayLabel: string;   // dayLabel: "TUE 20:00"
    dateShort: string;                               // "TUE 10 NOV"
    venue: string; venueShort: string; venueWord: string; city: string;
    kicker: string; kickerSub: string; title: string; // Before hero
    countdownLabel: string; countdownSeconds: number; dateLine: string;
    inviteTitle: string; inviteSub: string;           // the strip under the Before hero
    venueOption: string; venueOptionSub: string; onlineOptionSub: string;
    registeredVenue: string; registeredOnline: string;
    details: { icon: string; k: string; v: string }[];
    heroImage: { src: string; w: number; h: number };
  };
  segments: { id: string; name: string; short: string; time: string; kind: SegKind; blurb: string; note: string; heroTitle: string; heroSub: string; heroSubOnline?: string; day?: number }[];
  // Multi-day events: segments carry a day index into this list.
  days?: { label: string; date: string; sub: string }[];
  // Events grouped into a series share a community and a points total.
  series?: { id: string; name: string; stage: string; order: number; total: number; stages: string[] };
  // Team / driver / player story cards.
  stories?: { title: string; items: { kicker: string; title: string; body: string; stat?: string; unit?: string; color?: string }[] };
  // External ticketing with referral codes per attendee and per crew.
  tickets?: { url: string; label: string; sub: string; priceFrom: string; crewLabel: string; crews: string[] };
  challenges?: Challenge[];
  rewards?: Reward[];
  sponsorKit?: SponsorBadge[];
  // litBefore: the hero image is lit (and its points tappable) before the reveal, e.g. a race car on the grid.
  reveal: { kicker: string; word1: string; word2: string; line: string; thirdNote: string; title: string; sub: string; triggerBlurb: string; litBefore?: boolean };
  product: { sectionTitle: string; priceLine: string; featuresHint: string; variants: { name: string; price: string; spec: string }[] };
  hotspots: { id: string; x: number; y: number; name: string; desc: string; stat: string; unit: string }[];
  polls: Poll[];
  breakContent: { minutes: number; sub: string; poll: Poll; reads: { kicker: string; title: string; body: string }[] };
  announcements: Record<Target, Msg[]>;
  reminders: { title: string; body: string; target: Target }[];
  presenters: { name: string; role: string; slot: string; photo: string }[];
  sponsors: string[];
  iris: { intro: string; pre: QA[]; live: QA[]; hidden: string; fallback: string };
  cta: {
    cardKicker: string; title: string; sub: string; button: string; screenTitle: string; screenMeta: string;
    intro: string; optionsLabel: string; options: { id: string; name: string; sub: string }[];
    slotsLabel: string; slots: string[]; submit: string; doneTitle: string; doneSub: string;
  };
  follow: { title: string; sub: string; doneTitle: string; doneSub: string };
  after: { badge: string; title: string; sub: string; stats: [string, string][]; recapTitle: string };
  community: {
    badge: string; title: string; sub: string;
    next: { name: string; kicker: string; date: string; time: string; place: string; blurb: string; days: number };
    pastLabel: string; pastDate: string; pastTitle: string; pastSub: string; replay: string;
  };
  chat: { pool: { user: string; text: string; where: Mode; tag: string; avatar?: string }[]; quickBefore: string[]; quickLive: string[]; quickAfter: string[] };
  qaSeed: { id: string; text: string; who: string; where: Mode; votes: number }[];
  // Register-interest questions asked with the RSVP. A field with `routes`
  // maps an answer to a CTA option id (nearest showroom, right demo format).
  interest?: {
    title: string; sub: string; consent: string;
    fields: { id: string; label: string; short: string; options: string[]; routes?: Record<string, string> }[];
  };
  // Launch extras: colour + trim picker and a finance / running-cost estimate.
  showroom?: {
    buildTitle: string; buildSub: string; colours: { name: string; hex: string }[];
    finance: {
      title: string; sub: string; rate: number; deposits: number[]; terms: number[]; defaultDeposit: number; defaultTerm: number; note: string;
      running?: { title: string; sub: string; rows: { label: string; v: number }[] };
    };
  };
  // Follow-up message drafted for a lead; {first} {model} {route} {extra} are filled in.
  followUp?: { template: string; extraBuilt: string; extraFinance: string; extraFeature: string };
  demo: {
    rsvp: { venue: number; online: number };
    audienceBefore: number; venueBySeg: number[]; onlineBySeg: number[];
    breakAud: [number, number]; afterAud: [number, number]; communityOnline: number;
    checkinsBySeg: number[];
    results: {
      reactions: number; questions: number; answered: number; conversions: number; conversionLabel: string;
      engagement: { seg: string; pct: number }[]; conversionsBy: { name: string; n: number }[];
      multiEvent: { total: number; rows: { name: string; n: number }[] }; follows: number; votes: number;
      funnel?: { label: string; n: number; key?: 'registered' | 'engaged' | 'built' | 'booked' }[];
      features?: Record<string, number>;                 // hotspot id -> % of viewers who opened it
      leadQuality?: { name: string; hot: number; warm: number; cold: number; won: number }[];
      sources?: { name: string; n: number; icon: string }[];
      tickets?: { clicks: number; sales: number; top: { name: string; crew: boolean; clicks: number; sales: number }[] };
      challenges?: Record<string, number>;               // challenge id -> completions
      sponsors?: { name: string; views: number; taps: number }[];
    };
    leads?: Lead[];
  };
}

// ── samples ──
export const SAMPLES: EventConfig[] = [AURORA_NOVA, ...TIDEWELL, ...SPORTS];
export const DEFAULT_ID = AURORA_NOVA.id;
// Old links (/events/nova/) point at the Nova sample.
export const ALIASES: Record<string, string> = { nova: AURORA_NOVA.id };
// GitHub Pages only serves pages built ahead of time, so new events take an id
// from this prebuilt pool (like the Voltford panel ids).
export const POOL_IDS = Array.from({ length: 40 }, (_, i) => `evt-${1001 + i}`);
export const STATIC_IDS = [...SAMPLES.map((e) => e.id), ...Object.keys(ALIASES), ...POOL_IDS];

export const fanPath = (id: string) => `${BASE}events/${id}/`;
export const studioPath = (id: string) => `${BASE}events/${id}/studio/`;
export const homePath = () => `${BASE}events/studio/`;
export const abs = (u: string) => (typeof window === 'undefined' ? u : new URL(u, window.location.origin).href);
export const channelName = (id: string) => `connect-events:${id}`;
export const asset = (p: string) => (/^(data:|https?:|\/)/.test(p) ? p : BASE + p);

// ── browser store ──
const KEY = 'connect-events:events:v1';
const DRAFT = (id: string) => `connect-events:draft:${id}`;
const read = (k: string) => { try { return typeof window === 'undefined' ? null : window.localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string | null): boolean => { try { if (v === null) window.localStorage.removeItem(k); else window.localStorage.setItem(k, v); return true; } catch { return false; /* storage blocked or full */ } };
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

function localMap(): Record<string, EventConfig> {
  try { return JSON.parse(read(KEY) || '{}'); } catch { return {}; }
}
export function listEvents(): { cfg: EventConfig; sample: boolean; edited: boolean }[] {
  const local = localMap();
  const samples = SAMPLES.map((e) => ({ cfg: local[e.id] ? withDefaults(local[e.id]) : e, sample: true, edited: !!local[e.id] }));
  const own = Object.values(local).filter((e) => !SAMPLES.some((x) => x.id === e.id)).map((cfg) => ({ cfg, sample: false, edited: false }));
  return [...samples, ...own];
}
// Copies saved before interest / showroom / leads existed pick them up from their sample.
function withDefaults(cfg: EventConfig): EventConfig {
  const base = SAMPLES.find((e) => e.id === cfg.id);
  if (!base) return cfg;
  const c = cfg as any, b = clone(base) as any;
  for (const k of ['interest', 'showroom', 'followUp']) if (c[k] === undefined && b[k] !== undefined) c[k] = b[k];
  if (c.demo.leads === undefined && b.demo.leads) c.demo.leads = b.demo.leads;
  for (const k of ['funnel', 'features', 'leadQuality', 'sources']) if (c.demo.results[k] === undefined && b.demo.results[k] !== undefined) c.demo.results[k] = b.demo.results[k];
  return c;
}
export function getEvent(idOrAlias: string, opts: { draft?: boolean } = {}): EventConfig | null {
  const id = ALIASES[idOrAlias] || idOrAlias;
  if (opts.draft) { const d = read(DRAFT(id)); if (d) try { return withDefaults(JSON.parse(d)); } catch { /* fall through */ } }
  const local = localMap()[id];
  return local ? withDefaults(local) : clone(SAMPLES.find((e) => e.id === id) || null);
}
// Returns false when this browser has no room left (e.g. very large uploaded images).
export function saveEvent(cfg: EventConfig): boolean { const m = localMap(); m[cfg.id] = cfg; const ok = write(KEY, JSON.stringify(m)); if (ok) write(DRAFT(cfg.id), null); return ok; }
export function deleteEvent(id: string) { const m = localMap(); delete m[id]; write(KEY, JSON.stringify(m)); }
export function saveDraft(cfg: EventConfig) { write(DRAFT(cfg.id), JSON.stringify(cfg)); }
export function isSample(id: string) { return SAMPLES.some((e) => e.id === id); }
export function nextFreeId(): string | null {
  const used = new Set(listEvents().map((e) => e.cfg.id));
  return POOL_IDS.find((id) => !used.has(id)) || null;
}
export function duplicateEvent(cfg: EventConfig): EventConfig | null {
  const id = nextFreeId(); if (!id) return null;
  const copy = clone(cfg); copy.id = id; copy.status = 'draft'; copy.event.name = cfg.event.name + ' (copy)';
  saveEvent(copy); return copy;
}

// ── brand theme ──
// The fan view's tokens default to the Voltford/Nova palette. A brand whose
// colours differ gets the same token set derived from its accent + dark base,
// so every event stays inside the one design system.
const hex = (h: string) => { const c = h.replace('#', ''); const f = c.length === 3 ? c.split('').map((x) => x + x).join('') : c.padEnd(6, '0'); return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16) || 0); };
const toHex = (r: number[]) => '#' + r.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
export const mix = (a: string, b: string, t: number) => { const A = hex(a), B = hex(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
const rgb = (h: string) => hex(h).join(',');
export const NOVA_COLOURS = { accent: '#8B3DF5', dark: '#160925' };

export function themeCss(brand: { accent: string; dark: string }): string {
  const acc = brand.accent, dk = brand.dark;
  if (acc.toLowerCase() === NOVA_COLOURS.accent.toLowerCase() && dk.toLowerCase() === NOVA_COLOURS.dark.toLowerCase()) return '';
  const ink = mix(dk, '#000000', 0.05);
  const deep = mix(dk, '#000000', 0.6);
  const muted = mix(mix(dk, '#ffffff', 0.58), acc, 0.12);
  const light = `--ground:#F6F6F5;--sand:#EEEEEA;--sand2:#D5D5D2;--sand3:#E4E4E2;--ink:${ink};--body:${mix(ink, '#ffffff', 0.2)};--label:${mix(ink, '#ffffff', 0.42)};--panel:${ink};--panel-hover:${mix(ink, '#ffffff', 0.08)};--chrome:${mix(dk, '#000000', 0.25)};--on-panel:#F2F2F0;--hair:rgba(${rgb(ink)},.12);--desk:#D5D5D2`;
  const g = mix(dk, '#141414', 0.45);
  const dark = `--ground:${g};--sand:${mix(g, '#ffffff', 0.07)};--sand2:${mix(g, '#ffffff', 0.16)};--sand3:${mix(g, '#ffffff', 0.1)};--ink:#F2F2F0;--body:#C4C4BF;--label:${mix(muted, '#808080', 0.2)};--panel:${mix(dk, '#ffffff', 0.12)};--panel-hover:${mix(dk, '#ffffff', 0.18)};--chrome:${mix(g, '#000000', 0.15)};--on-panel:#F2F2F0;--hair:rgba(208,208,204,.12);--desk:#0B0B0D`;
  const brandVars = `--acc:${acc};--acc-rgb:${rgb(acc)};--acc-lt:${mix(acc, '#ffffff', 0.38)};--acc-dk:${mix(acc, '#000000', 0.12)};--hero:${dk};--hero-rgb:${rgb(dk)};--hero-deep:${deep};--hero-deep-rgb:${rgb(deep)};--muted:${muted};--muted-lt:${mix(muted, '#ffffff', 0.15)}`;
  return `:root{${brandVars};${light}}\n:root[data-theme="dark"]{${dark}}\n@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${dark}}}`;
}

// ── mock audience numbers for a state/segment, wobbling a little each tick ──
export function audience(cfg: EventConfig, ms: Ms, seg: number, tick: number) {
  const w = (a: number) => Math.round(Math.sin(tick / 5 + a) * 14);
  const d = cfg.demo;
  const at = (arr: number[]) => arr[Math.min(seg, arr.length - 1)] ?? 0;
  if (ms === 'before') return { venue: 0, online: d.audienceBefore + w(1) + tick * 3 };
  if (ms === 'live') return { venue: Math.max(0, at(d.venueBySeg) + Math.round(w(2) / 2)), online: at(d.onlineBySeg) + w(3) * 3 };
  if (ms === 'break') return { venue: d.breakAud[0] + w(4), online: d.breakAud[1] + w(5) * 3 };
  if (ms === 'after') return { venue: d.afterAud[0] + w(6), online: d.afterAud[1] + w(7) * 3 };
  return { venue: 0, online: d.communityOnline + w(8) };
}
export const checkinsSeed = (cfg: EventConfig, ms: Ms, seg: number) => {
  const a = cfg.demo.checkinsBySeg;
  return ms === 'before' ? 0 : ms === 'live' ? a[Math.min(seg, a.length - 1)] ?? 0 : a[a.length - 1] ?? 0;
};

export const STATES: { id: Ms; name: string }[] = [
  { id: 'before', name: 'Before' }, { id: 'live', name: 'Live' }, { id: 'break', name: 'Break' }, { id: 'after', name: 'After' }, { id: 'community', name: 'Always-on' },
];
export const TARGETS: { id: Target; name: string; icon: string }[] = [
  { id: 'all', name: 'Everyone', icon: 'public' }, { id: 'venue', name: 'In venue', icon: 'location_on' }, { id: 'online', name: 'Online', icon: 'wifi' },
];
export const revealSegIndex = (cfg: EventConfig) => Math.max(0, cfg.segments.findIndex((g) => g.kind === 'reveal'));
export const qaSegIndex = (cfg: EventConfig) => cfg.segments.findIndex((g) => g.kind === 'qa');
// Live clock labels in the fan status bar: a few minutes after each segment starts.
export const clockAfter = (t: string, mins = 8) => { const [h, m] = t.split(':').map(Number); if (isNaN(h)) return t; const x = (((h * 60 + (m || 0) + mins) % 1440) + 1440) % 1440; return String(Math.floor(x / 60) % 24).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0'); };

export const TEMPLATES = [
  { id: 'launch' as const, name: 'Product launch', icon: 'rocket_launch', blurb: 'Countdown, a reveal moment, product hotspots, Q&A and a reserve or test-drive CTA.', format: 'Hybrid' as const,
    segments: [['Doors open', 'doors'], ['Keynote', 'talk'], ['Reveal', 'reveal'], ['Q&A', 'qa']] as [string, SegKind][] },
  { id: 'conference' as const, name: 'Conference', icon: 'co_present', blurb: 'Agenda by session, a keynote announcement, speaker Q&A, polls and recaps afterwards.', format: 'Hybrid' as const,
    segments: [['Registration', 'doors'], ['Opening keynote', 'reveal'], ['Sessions', 'talk'], ['Panel', 'talk'], ['Q&A', 'qa']] as [string, SegKind][] },
  { id: 'sport' as const, name: 'Sports event', icon: 'sports_score', blurb: 'Days and live segments, team stories, predictions and challenges for points, rewards, tickets and sponsor moments.', format: 'Hybrid' as const,
    segments: [['Gates open', 'doors'], ['Build-up', 'talk'], ['Start', 'reveal'], ['Live action', 'other'], ['Result', 'other']] as [string, SegKind][] },
  { id: 'fan' as const, name: 'Fan event', icon: 'celebration', blurb: 'Door check-in, a main-stage running order, a drop moment, chat and a community that stays on.', format: 'In person' as const,
    segments: [['Gates open', 'doors'], ['Main stage', 'talk'], ['The drop', 'reveal'], ['Meet & greet', 'qa']] as [string, SegKind][] },
];

// A fresh event from a template: Nova's structure as the scaffold, with the
// brand and the template's segments swapped in. Every field stays editable.
export function newFromTemplate(id: string, tpl: (typeof TEMPLATES)[number]): EventConfig {
  const c = clone(AURORA_NOVA) as EventConfig;
  c.id = id; c.status = 'draft';
  c.event.template = tpl.id; c.event.format = tpl.format; c.event.name = 'Untitled ' + tpl.name.toLowerCase();
  if (tpl.id !== 'launch') { delete c.showroom; delete c.interest; delete c.followUp; delete c.demo.leads; } // car-launch only
  if (tpl.id === 'sport') {
    c.challenges = [
      { id: 'c1', kind: 'predict', title: 'Predict the winner', sub: 'Locks when it starts.', points: 50, options: ['Team A', 'Team B'] },
      { id: 'c2', kind: 'checkin', title: 'Check in at the fan zone', sub: 'Scan the venue QR.', points: 30 },
      { id: 'c3', kind: 'trivia', title: 'Trivia', sub: 'One question, one go.', points: 20, options: ['A', 'B', 'C'], answer: 'A' },
    ];
    c.rewards = [{ id: 'r1', name: 'Signed merch', sub: 'Collect at the merch stand.', points: 80, stock: 50 }];
    c.tickets = { url: 'https://tickets.example.com/event', label: 'Buy tickets', sub: 'Official ticketing partner', priceFrom: 'From RM50', crewLabel: 'Join a crew', crews: [] };
  }
  const times = ['09:00', '09:30', '10:30', '13:00', '15:00', '16:00'];
  c.segments = tpl.segments.map(([name, kind], i) => ({ id: 's' + (i + 1), name, short: name.toUpperCase(), time: times[i] || '17:00', kind, blurb: '', note: '', heroTitle: name.toUpperCase(), heroSub: '' }));
  c.demo.results.engagement = c.segments.map((g, i) => ({ seg: g.name, pct: [38, 64, 92, 71, 55, 44][i] || 40 }));
  return c;
}

// ── leads ──
// A transparent score from what the person did: every signal is worth a fixed
// number of points, so the organiser can see why someone is hot.
export const SCORE_RULES: { key: keyof Signals; label: string; pts: number; per?: boolean; max?: number }[] = [
  { key: 'booked', label: 'Booked the next step', pts: 30 },
  { key: 'finance', label: 'Checked the monthly cost', pts: 15 },
  { key: 'built', label: 'Picked a colour and trim', pts: 10 },
  { key: 'features', label: 'Features explored', pts: 4, per: true, max: 20 },
  { key: 'iris', label: 'Questions to IRIS', pts: 3, per: true, max: 9 },
  { key: 'questions', label: 'Questions for the Q&A', pts: 3, per: true, max: 6 },
  { key: 'polls', label: 'Poll votes', pts: 2, per: true, max: 6 },
  { key: 'checkedIn', label: 'Checked in at the venue', pts: 8 },
  { key: 'following', label: 'Follows the brand', pts: 4 },
];
export const scoreParts = (sg: Signals) => SCORE_RULES.map((r) => {
  const v = sg[r.key]; const n = typeof v === 'number' ? v : v ? 1 : 0;
  return { ...r, n, pts: Math.min(r.max ?? r.pts, r.per ? n * r.pts : n ? r.pts : 0) };
}).filter((r) => r.n > 0);
export const leadScore = (l: { signals: Signals; answers: Record<string, string> }) =>
  Math.min(99, 6 + Object.keys(l.answers || {}).length * 2 + scoreParts(l.signals).reduce((a, r) => a + r.pts, 0));
export const leadTier = (score: number) => (score >= 60 ? 'Hot' : score >= 35 ? 'Warm' : 'Cold');
export const NO_SIGNALS: Signals = { features: 0, polls: 0, iris: 0, questions: 0, built: false, finance: false, booked: false, checkedIn: false, following: false };
// Which CTA option an answer routes to (nearest showroom, the right demo format).
export function routeFor(cfg: EventConfig, answers: Record<string, string>): string | null {
  for (const f of cfg.interest?.fields || []) { const a = answers[f.id]; if (a && f.routes?.[a]) return f.routes[a]; }
  return null;
}
// Price strings like "RM159,000" -> 159000 and "RM".
export const priceNum = (p: string) => Number((p.match(/[\d,.]+/) || ['0'])[0].replace(/,/g, '')) || 0;
export const priceCur = (p: string) => (p.match(/^[^\d]*/) || [''])[0];
// Flat-rate hire purchase, the way car loans are quoted in Malaysia.
export const monthlyFlat = (price: number, depositPct: number, ratePct: number, years: number) => {
  const loan = price * (1 - depositPct / 100);
  const total = loan * (1 + (ratePct / 100) * years);
  return { loan, interest: total - loan, total, monthly: total / (years * 12) };
};
export const fmtMoney = (cur: string, n: number) => cur + Math.round(n).toLocaleString('en-GB');

// ── points, referral codes ──
// Points live in this browser per series (or per event), so they carry across a series.
export const pointsKey = (cfg: EventConfig) => 'connect-events:points:' + (cfg.series?.id || cfg.id);
export type PointsBook = { done: Record<string, { pts: number; ev: string; pick?: string }>; claimed: string[] };
export function readPoints(cfg: EventConfig): PointsBook {
  try { const v = JSON.parse(read(pointsKey(cfg)) || 'null'); if (v && v.done) return { done: v.done, claimed: v.claimed || [] }; } catch { /* empty */ }
  return { done: {}, claimed: [] };
}
export const writePoints = (cfg: EventConfig, b: PointsBook) => write(pointsKey(cfg), JSON.stringify(b));
export const pointsTotal = (b: PointsBook) => Object.values(b.done).reduce((a, x) => a + x.pts, 0);
// Short, readable codes. Crew codes are stable per crew name.
const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function myRefCode(cfg: EventConfig): string {
  const k = 'connect-events:ref:' + (cfg.series?.id || cfg.id);
  const have = read(k); if (have) return have;
  const c = Array.from({ length: 5 }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join('');
  write(k, c); return c;
}
export const crewCode = (crew: string) => 'CREW-' + crew.toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 12);
export const ticketUrl = (cfg: EventConfig, ref: string) => { const u = cfg.tickets?.url || ''; return u + (u.includes('?') ? '&' : '?') + 'ref=' + encodeURIComponent(ref); };
export const sponsorOf = (cfg: EventConfig, name?: string) => (name ? cfg.sponsorKit?.find((x) => x.name === name) || { name, short: name.slice(0, 2).toUpperCase(), color: '#555555' } : null);
