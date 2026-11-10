// ═══════════════════════════════════════════════════════════════════════
// Connect Events · Aurora Nova launch. Shared, fully mocked data for the fan
// panel (EventFan) and the operator Studio (EventStudio). Aurora Motors and the
// Nova are fictional; specs match the earlier car-launch demo.
// ═══════════════════════════════════════════════════════════════════════
import { BASE } from '../base';

export const CHANNEL = 'connect-events:nova';
export const img = {
  car: `${BASE}events/nova.jpg`,
  logo: `${BASE}events/aurora.svg`,
};
// Generic profile photos already in the build (public/voltford/media/crews).
const av = (f: string) => `${BASE}voltford/media/crews/${f}.jpg`;

export type Ms = 'before' | 'live' | 'break' | 'after' | 'community';
export type Mode = 'venue' | 'online';
export type Target = 'all' | 'venue' | 'online';
export type TriggerKind = 'reveal' | 'poll' | 'hotspot' | 'announce';

export const STATES: { id: Ms; name: string }[] = [
  { id: 'before', name: 'Before' }, { id: 'live', name: 'Live' }, { id: 'break', name: 'Break' }, { id: 'after', name: 'After' }, { id: 'community', name: 'Always-on' },
];
export const SEGMENTS = [
  { id: 'doors', name: 'Doors open', short: 'DOORS OPEN', time: '19:30' },
  { id: 'keynote', name: 'Keynote', short: 'KEYNOTE', time: '20:00' },
  { id: 'reveal', name: 'Reveal', short: 'REVEAL', time: '20:25' },
  { id: 'qa', name: 'Q&A', short: 'Q&A', time: '20:40' },
];
export const TARGETS: { id: Target; name: string; icon: string }[] = [
  { id: 'all', name: 'Everyone', icon: 'public' }, { id: 'venue', name: 'In venue', icon: 'location_on' }, { id: 'online', name: 'Online', icon: 'wifi' },
];
export const TRIGGERS: { id: TriggerKind; name: string; blurb: string; icon: string; color: string }[] = [
  { id: 'reveal', name: 'Reveal', blurb: 'Play the reveal moment on every screen', icon: 'auto_awesome', color: '#8B3DF5' },
  { id: 'poll', name: 'Poll', blurb: 'Push the next live poll', icon: 'bar_chart', color: '#8B3DF5' },
  { id: 'hotspot', name: 'Hotspot', blurb: 'Spotlight the next feature on the car', icon: 'my_location', color: '#8B3DF5' },
  { id: 'announce', name: 'Announcement', blurb: 'Drop a banner to the chosen audience', icon: 'campaign', color: '#C0473C' },
];

// Feature points on the car photo (x/y are % of the 1264×848 image).
export const HOTSPOTS = [
  { id: 'lights', x: 34.6, y: 50.3, name: 'Light Blade', desc: 'One 1.6 m light signature that wakes as you walk up to the car.', stat: '2,400', unit: 'individually lit LEDs' },
  { id: 'wheels', x: 46.2, y: 62.6, name: '21" Aero wheels', desc: 'Closed turbine spokes cut drag at highway speed.', stat: '+18 km', unit: 'range vs open spokes' },
  { id: 'cabin', x: 60.5, y: 38.5, name: 'Horizon cockpit', desc: 'A floating 15.6" display and full-width ambient light.', stat: '15.6"', unit: 'OLED centre screen' },
  { id: 'roof', x: 66, y: 32.6, name: 'Sky glass roof', desc: 'One panoramic pane, heat and UV coated for tropical sun.', stat: '2.1 m²', unit: 'of uninterrupted glass' },
  { id: 'charge', x: 82.2, y: 44.6, name: 'Fast-charge port', desc: '800-volt architecture. Top up in the time it takes to grab a kopi.', stat: '18 min', unit: '10 to 80% charge' },
];

export const POLLS = [
  { id: 'colour', q: 'Which colour would you spec?', opts: { 'Glacier White': 38, 'Ember Orange': 31, 'Midnight Teal': 19, Graphite: 12 }, votes: 3412 },
  { id: 'trim', q: 'Which Nova is yours?', opts: { Standard: 34, Pro: 47, 'Launch Edition': 19 }, votes: 2786 },
  { id: 'feature', q: 'Best thing you have seen tonight?', opts: { 'The Light Blade': 36, '18-minute charging': 41, 'Sky glass roof': 23 }, votes: 2204 },
];
export const BREAK_POLL = { id: 'break', q: 'Reveal verdict, in one word?', opts: { Stunning: 52, Clean: 27, 'Not sure yet': 21 }, votes: 1890 };

// Announcements: the copy depends on who the operator is targeting.
export const ANNOUNCE: Record<Target, { kicker: string; title: string; sub: string }[]> = {
  all: [
    { kicker: 'RESERVATIONS OPEN', title: 'Reserve a Nova tonight', sub: 'RM1,000 refundable deposit holds launch pricing for 30 days' },
    { kicker: 'COMING UP', title: 'Q&A starts in five minutes', sub: 'Send your question now, the most upvoted go first' },
  ],
  venue: [
    { kicker: 'IN THE HALL', title: 'Test drives on the forecourt', sub: 'Straight after Q&A. Show your wristband at the east doors' },
    { kicker: 'IN THE HALL', title: 'The Nova is on the turntable', sub: 'Step up to the stage for a closer look after the reveal' },
  ],
  online: [
    { kicker: 'ONLINE EXCLUSIVE', title: 'Free 7 kW wallbox, installed', sub: 'For reservations made from the stream tonight' },
    { kicker: 'ONLINE', title: 'Switch to the 4K stream', sub: 'Tap the player settings, the reveal is filmed in 4K HDR' },
  ],
};

export const VARIANTS = [
  { name: 'Nova Standard', price: 'RM159,000', range: '520 km', sprint: '6.1 s', motor: 'Single motor, RWD' },
  { name: 'Nova Pro', price: 'RM189,000', range: '610 km', sprint: '4.4 s', motor: 'Dual motor, AWD' },
  { name: 'Nova Launch Edition', price: 'RM219,000', range: '640 km', sprint: '3.6 s', motor: 'Dual motor, 1 of 500' },
];

export const SHOWROOMS = [
  { id: 'kl', name: 'Aurora KL', area: 'Bangsar South', dist: '4.2 km' },
  { id: 'pj', name: 'Aurora Petaling Jaya', area: 'Section 13', dist: '9.8 km' },
  { id: 'sa', name: 'Aurora Shah Alam', area: 'Glenmarie', dist: '21 km' },
];
export const SLOTS = ['Sat 14 Nov · 10:00', 'Sat 14 Nov · 14:00', 'Sun 15 Nov · 11:00'];

// Live chat (venue + online mixed).
export const CHAT_POOL = [
  { user: 'NADIA.KL', text: 'Front row energy in here tonight', where: 'venue', tag: 'HALL · ROW C' },
  { user: 'JUNSHENG88', text: 'Watching from Penang, stream is crisp', where: 'online', tag: 'ONLINE · PENANG' },
  { user: 'TMK_EV', text: 'Range in KL traffic is what I need to hear', where: 'online', tag: 'ONLINE · KL' },
  { user: 'AISYAH_R', text: 'The lighting on that stage though', where: 'venue', tag: 'HALL · ROW F' },
  { user: 'DANIEL.L', text: 'If it is under 170k I am in', where: 'online', tag: 'ONLINE · JB' },
  { user: 'PRIYA.M', text: 'Brought my dad, he still drives a 2009 sedan', where: 'venue', tag: 'HALL · ROW K' },
  { user: 'HAZIQ', text: 'Anyone else here for the charging numbers?', where: 'online', tag: 'ONLINE · IPOH' },
  { user: 'MEI_TAN', text: 'Booked a test drive already, no regrets', where: 'venue', tag: 'HALL · ROW B' },
  { user: 'KAVIN_S', text: '800 volts at this price would be wild', where: 'online', tag: 'ONLINE · SHAH ALAM' },
  { user: 'SOFEA', text: 'That light bar, honestly', where: 'venue', tag: 'HALL · ROW D' },
  { user: 'RYAN_K', text: 'Glacier White or nothing', where: 'online', tag: 'ONLINE · KUCHING' },
  { user: 'LINA_Z', text: 'Wallbox included? Say it again', where: 'online', tag: 'ONLINE · MELAKA' },
];
export const CHAT_AV: Record<string, string> = {
  'NADIA.KL': av('av-priya'), JUNSHENG88: av('av-r1'), TMK_EV: av('av-declan'), AISYAH_R: av('av-hannah'),
  'DANIEL.L': av('av-marcus'), 'PRIYA.M': av('av-priya'), HAZIQ: av('av-r2'), MEI_TAN: av('av-hannah'),
  KAVIN_S: av('av-r3'), SOFEA: av('av-priya'), RYAN_K: av('av-r1'), LINA_Z: av('av-hannah'),
};

// Seeded audience questions (the Studio queue + the fan Q&A board).
export const SEED_QS = [
  { id: 'q1', text: 'What is the real-world range in city traffic?', who: 'tmk_ev', where: 'online' as Mode, votes: 412 },
  { id: 'q2', text: 'Is the home wallbox included with the car?', who: 'lina_z', where: 'online' as Mode, votes: 356 },
  { id: 'q3', text: 'When do the first deliveries start?', who: 'nadia.kl', where: 'venue' as Mode, votes: 298 },
  { id: 'q4', text: 'Can I finance the Launch Edition?', who: 'daniel.l', where: 'online' as Mode, votes: 221 },
  { id: 'q5', text: 'How long is the battery warranty?', who: 'priya.m', where: 'venue' as Mode, votes: 187 },
];

// IRIS, grounded in the launch press kit. Answers change once the car is out.
export type QA = [string, string, string?, string?];
export const IRIS_PRE: QA[] = [
  ['What is being revealed?', 'Aurora’s first all-electric crossover, the Nova. Specs, price and the first look all land at the reveal, 20:25.', '20:25', 'REVEAL TIME'],
  ['Can I watch online?', 'Yes. The full launch streams here, and online viewers get the same polls, chat and Q&A as the hall.', '2', 'WAYS TO JOIN'],
  ['How do I ask a question?', 'Send it from the panel any time. The most upvoted questions are put to the team in the Q&A at 20:40.', '20:40', 'Q&A STARTS'],
  ['How much is it?', 'Pricing is announced at the reveal. Register interest and I’ll have the full price list ready for you the moment it lands.', '20:25', 'PRICE REVEALED'],
];
export const IRIS_LIVE: QA[] = [
  ['What range does it get?', 'The Nova Pro is rated at 610 km (WLTP). In city traffic with the aircon on, testing averaged about 525 km, a week of commuting on one charge.', '610 km', 'NOVA PRO RANGE'],
  ['How fast does it charge?', 'On an 800-volt fast charger, 10 to 80% takes about 18 minutes. At home a 7 kW wallbox does a full charge overnight.', '18 min', '10 TO 80% CHARGE'],
  ['How much is it?', 'From RM159,000 for the Nova Standard, RM189,000 for the Pro and RM219,000 for the Launch Edition, on the road.', 'RM159k', 'STARTING PRICE'],
  ['Can I finance it?', 'Yes. With 20% down over 7 years at an indicative 2.49% flat rate, the Nova Standard is about RM1,778 a month.', 'RM1,778', 'A MONTH, INDICATIVE'],
];
export const IRIS_HIDDEN = 'That is announced at the reveal at 20:25. Stay with the panel, I’ll have the full answer the moment the car is out.';
export const IRIS_FALLBACK = 'I only answer from Aurora’s approved Nova facts, and that one isn’t in them. Send it to the Q&A and the team can answer it.';

export const BREAK_READS = [
  { kicker: 'WHY 800 VOLTS', title: 'Half the charging time, same cable size', body: 'Doubling the voltage halves the current for the same power, so the Nova can pull 270 kW without thicker, heavier cables.' },
  { kicker: 'THE LIGHT BLADE', title: '2,400 LEDs, one line', body: 'Each LED is addressed individually, so the blade can sweep a welcome as you walk up and show charge level at a glance.' },
  { kicker: 'BUILT FOR THE CITY', title: 'Tuned for stop-start traffic', body: 'One-pedal driving recovers energy at every red light. In testing it added about 9% range on a typical KL commute.' },
];

// Results (Studio), seeded for the demo and topped up by live fan actions.
export const RESULTS = {
  venuePeak: 1240, onlinePeak: 9186, reactions: 48210, questions: 312, testDrives: 186, registrations: 6420,
  engagement: [
    { seg: 'Doors open', pct: 38 }, { seg: 'Keynote', pct: 64 }, { seg: 'Reveal', pct: 92 }, { seg: 'Q&A', pct: 71 }, { seg: 'Break', pct: 44 },
  ],
  drives: [{ name: 'Aurora KL', n: 94 }, { name: 'Aurora Petaling Jaya', n: 61 }, { name: 'Aurora Shah Alam', n: 31 }],
};

// Mock audience size for a state/segment, wobbling a little each tick.
export function audience(ms: Ms, seg: number, tick: number) {
  const w = (a: number) => Math.round(Math.sin(tick / 5 + a) * 14);
  if (ms === 'before') return { venue: 0, online: 2140 + w(1) + tick * 3 };
  if (ms === 'live') return { venue: [612, 1186, 1240, 1228][seg] + Math.round(w(2) / 2), online: [3420, 7860, 9186, 8740][seg] + w(3) * 3 };
  if (ms === 'break') return { venue: 1104 + w(4), online: 7310 + w(5) * 3 };
  if (ms === 'after') return { venue: 486 + w(6), online: 3920 + w(7) * 3 };
  return { venue: 0, online: 412 + w(8) };
}

// ── Events platform: the brand's events, templates, the next event ──
export type EventRec = { id: string; name: string; template: string; format: 'In person' | 'Online' | 'Hybrid'; date: string; place: string; status: 'live' | 'past' | 'upcoming' | 'draft'; stat: string; segments: string[]; built?: boolean };
export const EVENTS: EventRec[] = [
  { id: 'nova', name: 'Aurora Nova World Premiere', template: 'Product launch', format: 'Hybrid', date: 'Tue 10 Nov 2026 · 20:00', place: 'Aurora Hall, Bangsar South + online', status: 'live', stat: '10,426 attending', segments: ['Doors open', 'Keynote', 'Reveal', 'Q&A'], built: true },
  { id: 'next', name: 'Nova Drive Week', template: 'Fan event', format: 'Hybrid', date: 'Sat 5 Dec 2026 · 10:00', place: 'Aurora KL + online', status: 'upcoming', stat: '1,904 registered', segments: ['Gates open', 'Engineer Q&A', 'Test drives', 'Closing'] },
  { id: 'owners', name: 'Aurora Owners Day', template: 'Fan event', format: 'In person', date: 'Sat 13 Jun 2026 · 09:00', place: 'Aurora Proving Ground, Selangor', status: 'past', stat: '3,210 attended · 61% engaged', segments: ['Gates open', 'Main stage', 'Meet the engineers', 'Closing'] },
];
export const TEMPLATES = [
  { id: 'launch', name: 'Product launch', icon: 'rocket_launch', blurb: 'Countdown, a reveal moment, product hotspots, Q&A and a test-drive or reserve CTA.', format: 'Hybrid' as const, segments: ['Doors open', 'Keynote', 'Reveal', 'Q&A'], modules: ['Countdown', 'Reveal', 'Hotspots', 'Polls', 'Q&A', 'Ask IRIS', 'Lead CTA'] },
  { id: 'conference', name: 'Conference', icon: 'co_present', blurb: 'Agenda by session, speaker Q&A, polls, and session recaps afterwards.', format: 'Hybrid' as const, segments: ['Registration', 'Opening keynote', 'Sessions', 'Panel', 'Networking'], modules: ['Agenda', 'Q&A', 'Polls', 'Chat', 'Ask IRIS', 'Recaps'] },
  { id: 'fan', name: 'Fan event', icon: 'celebration', blurb: 'Door check-in, a main-stage running order, chat and a community that stays on.', format: 'In person' as const, segments: ['Gates open', 'Main stage', 'Meet & greet', 'Closing'], modules: ['Check-in', 'Chat', 'Polls', 'Ask IRIS', 'Community'] },
];
export const NEXT_EVENT = { name: 'Nova Drive Week', date: 'SAT 5 DEC', time: '10:00', place: 'AURORA KL + ONLINE', blurb: 'Test-drive weekends across the Klang Valley, and a live Q&A with the Nova engineers.', days: 25 };
export const ATTENDED_KEY = 'connect-events:attended';

// ── Event basics: presenters, sponsors, RSVPs, reminders (all mocked) ──
export const SPEAKERS = [
  { name: 'Amira Hassan', role: 'CEO, Aurora Motors', slot: 'Keynote · 20:00', photo: av('av-hannah') },
  { name: 'Farid Rahman', role: 'Head of Design', slot: 'Reveal · 20:25', photo: av('av-marcus') },
  { name: 'Lena Kwok', role: 'Chief Engineer', slot: 'Q&A · 20:40', photo: av('av-priya') },
];
export const SPONSORS = ['Gridline Charging', 'Strata Bank', 'Lumen Air', 'Kopi Lane'];
export const EVENT_DETAILS = [
  { icon: 'event', k: 'When', v: 'Tue 10 Nov · doors 19:30, reveal 20:25' },
  { icon: 'location_on', k: 'Where', v: 'Aurora Hall, Bangsar South, Kuala Lumpur' },
  { icon: 'wifi', k: 'Online', v: 'Live stream on this page, same polls and Q&A' },
  { icon: 'confirmation_number', k: 'Entry', v: 'Free, registration required for the hall' },
];
// Registered before tonight (seed) — live registrations are added on top.
export const RSVP_SEED = { venue: 1380, online: 5040 };
export const REMINDERS = [
  { title: 'Doors open in 1 hour', body: 'Aurora Hall opens at 19:30. Your QR check-in is on this page, no ticket needed.', target: 'venue' as Target },
  { title: 'The stream starts in 15 minutes', body: 'Keep this page open, the player appears here at 20:00.', target: 'online' as Target },
  { title: 'Parking update', body: 'Basement levels B2 and B3 are reserved for guests. Show this page at the barrier.', target: 'venue' as Target },
  { title: 'Send your questions now', body: 'The most upvoted questions go to the team on stage at 20:40.', target: 'all' as Target },
];
export const MULTI_EVENT = { total: 2140, rows: [{ name: 'Owners Day + Nova launch', n: 1320 }, { name: 'Nova launch + registered for Drive Week', n: 640 }, { name: 'All three events', n: 180 }] };
