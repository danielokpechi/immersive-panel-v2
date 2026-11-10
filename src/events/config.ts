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

export type Ms = 'before' | 'live' | 'break' | 'after' | 'community';
export type Mode = 'venue' | 'online';
export type Target = 'all' | 'venue' | 'online';
export type TriggerKind = 'reveal' | 'poll' | 'hotspot' | 'announce';
export type SegKind = 'doors' | 'talk' | 'reveal' | 'qa' | 'other';
export type QA = { q: string; a: string; stat?: string; label?: string; keys?: string };
export type Poll = { id: string; q: string; opts: Record<string, number>; votes: number };
export type Msg = { kicker: string; title: string; sub: string };

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
    name: string; template: 'launch' | 'conference' | 'fan'; format: 'In person' | 'Online' | 'Hybrid';
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
  segments: { id: string; name: string; short: string; time: string; kind: SegKind; blurb: string; note: string; heroTitle: string; heroSub: string; heroSubOnline?: string }[];
  reveal: { kicker: string; word1: string; word2: string; line: string; thirdNote: string; title: string; sub: string; triggerBlurb: string };
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
  demo: {
    rsvp: { venue: number; online: number };
    audienceBefore: number; venueBySeg: number[]; onlineBySeg: number[];
    breakAud: [number, number]; afterAud: [number, number]; communityOnline: number;
    checkinsBySeg: number[];
    results: {
      reactions: number; questions: number; answered: number; conversions: number; conversionLabel: string;
      engagement: { seg: string; pct: number }[]; conversionsBy: { name: string; n: number }[];
      multiEvent: { total: number; rows: { name: string; n: number }[] }; follows: number; votes: number;
    };
  };
}

// ── samples ──
export const SAMPLES: EventConfig[] = [AURORA_NOVA, ...TIDEWELL];
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
const write = (k: string, v: string | null) => { try { if (v === null) window.localStorage.removeItem(k); else window.localStorage.setItem(k, v); } catch { /* storage blocked */ } };
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

function localMap(): Record<string, EventConfig> {
  try { return JSON.parse(read(KEY) || '{}'); } catch { return {}; }
}
export function listEvents(): { cfg: EventConfig; sample: boolean; edited: boolean }[] {
  const local = localMap();
  const samples = SAMPLES.map((e) => ({ cfg: local[e.id] || e, sample: true, edited: !!local[e.id] }));
  const own = Object.values(local).filter((e) => !SAMPLES.some((x) => x.id === e.id)).map((cfg) => ({ cfg, sample: false, edited: false }));
  return [...samples, ...own];
}
export function getEvent(idOrAlias: string, opts: { draft?: boolean } = {}): EventConfig | null {
  const id = ALIASES[idOrAlias] || idOrAlias;
  if (opts.draft) { const d = read(DRAFT(id)); if (d) try { return JSON.parse(d); } catch { /* fall through */ } }
  return localMap()[id] || clone(SAMPLES.find((e) => e.id === id) || null);
}
export function saveEvent(cfg: EventConfig) { const m = localMap(); m[cfg.id] = cfg; write(KEY, JSON.stringify(m)); write(DRAFT(cfg.id), null); }
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
  { id: 'fan' as const, name: 'Fan event', icon: 'celebration', blurb: 'Door check-in, a main-stage running order, a drop moment, chat and a community that stays on.', format: 'In person' as const,
    segments: [['Gates open', 'doors'], ['Main stage', 'talk'], ['The drop', 'reveal'], ['Meet & greet', 'qa']] as [string, SegKind][] },
];

// A fresh event from a template: Nova's structure as the scaffold, with the
// brand and the template's segments swapped in. Every field stays editable.
export function newFromTemplate(id: string, tpl: (typeof TEMPLATES)[number]): EventConfig {
  const c = clone(AURORA_NOVA) as EventConfig;
  c.id = id; c.status = 'draft';
  c.event.template = tpl.id; c.event.format = tpl.format; c.event.name = 'Untitled ' + tpl.name.toLowerCase();
  const times = ['09:00', '09:30', '10:30', '13:00', '15:00', '16:00'];
  c.segments = tpl.segments.map(([name, kind], i) => ({ id: 's' + (i + 1), name, short: name.toUpperCase(), time: times[i] || '17:00', kind, blurb: '', note: '', heroTitle: name.toUpperCase(), heroSub: '' }));
  c.demo.results.engagement = c.segments.map((g, i) => ({ seg: g.name, pct: [38, 64, 92, 71, 55, 44][i] || 40 }));
  return c;
}
