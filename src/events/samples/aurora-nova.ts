// Sample event: the Aurora Nova world premiere (fictional brand, fictional car).
// Every word and number the Nova fan view and Studio show comes from here.
import type { EventConfig } from '../config';

const av = (f: string) => `voltford/media/crews/${f}.jpg`;

export const AURORA_NOVA: EventConfig = {
  id: 'aurora-nova',
  version: 1,
  status: 'live',
  brand: {
    name: 'Aurora Motors', wordmark: 'AURORA NOVA', wordmarkShort: 'NOVA',
    logo: 'connect-events/aurora.svg', accent: '#8B3DF5', dark: '#160925', domain: 'connect.boltos.ai/aurora',
  },
  event: {
    name: 'Aurora Nova World Premiere', template: 'launch', format: 'Hybrid',
    date: '2026-11-10', time: '20:00', dayLabel: 'TUE 20:00', dateShort: 'TUE 10 NOV',
    venue: 'Aurora Hall, Bangsar South', venueShort: 'AURORA HALL, KL', venueWord: 'HALL', city: 'Kuala Lumpur',
    kicker: 'AURORA MOTORS', kickerSub: 'WORLD PREMIERE · KUALA LUMPUR', title: 'AURORA NOVA',
    countdownLabel: 'REVEAL IN', countdownSeconds: 3 * 3600 + 14 * 60 + 54, dateLine: 'TUE 20:00 · AURORA HALL, KL · AND ONLINE',
    inviteTitle: 'BE THERE FOR THE REVEAL', inviteSub: 'In the hall or online, the same moment.',
    venueOption: 'In person', venueOptionSub: 'Aurora Hall, Bangsar South · doors 19:30', onlineOptionSub: 'Live stream with this panel · polls, chat, Q&A',
    registeredVenue: 'Aurora Hall, Bangsar South. Show this panel at the door.', registeredOnline: 'Watching online. This panel is your stream companion.',
    details: [
      { icon: 'event', k: 'When', v: 'Tue 10 Nov · doors 19:30, reveal 20:25' },
      { icon: 'location_on', k: 'Where', v: 'Aurora Hall, Bangsar South, Kuala Lumpur' },
      { icon: 'wifi', k: 'Online', v: 'Live stream on this page, same polls and Q&A' },
      { icon: 'confirmation_number', k: 'Entry', v: 'Free, registration required for the hall' },
    ],
    heroImage: { src: 'connect-events/nova.jpg', w: 1264, h: 848 },
  },
  segments: [
    { id: 'doors', name: 'Doors open', short: 'DOORS OPEN', time: '19:30', kind: 'doors', blurb: 'Drinks, music, first look at the stage', note: 'Find your seat, the keynote is at 20:00', heroTitle: 'DOORS ARE OPEN', heroSub: 'Find your seat. The keynote starts at 20:00.', heroSubOnline: 'The stream starts at 20:00. Say hello in the chat.' },
    { id: 'keynote', name: 'Keynote', short: 'KEYNOTE', time: '20:00', kind: 'talk', blurb: 'Amira Hassan, CEO, Aurora Motors', note: 'Amira Hassan, CEO, Aurora Motors', heroTitle: 'AMIRA HASSAN', heroSub: 'Keynote · why Aurora built its first car for the city.' },
    { id: 'reveal', name: 'Reveal', short: 'REVEAL', time: '20:25', kind: 'reveal', blurb: 'The Nova, specs and price', note: 'Keep this screen open', heroTitle: 'THE REVEAL', heroSub: 'Any moment now. Keep this screen open.' },
    { id: 'qa', name: 'Q&A', short: 'Q&A', time: '20:40', kind: 'qa', blurb: 'Your questions, answered on stage', note: 'Ask and upvote, the top questions go first', heroTitle: 'Q&A IS OPEN', heroSub: 'Ask anything. The most upvoted go first.' },
  ],
  reveal: {
    kicker: 'AURORA MOTORS PRESENTS', word1: 'AURORA', word2: 'NOVA', line: 'All-electric · 610 km · from RM159,000',
    thirdNote: 'From RM159,000 · tap the glowing points to explore', title: 'AURORA NOVA', sub: 'Tap a glowing point to explore the car.',
    triggerBlurb: 'Uncover the Nova on every screen',
  },
  product: {
    sectionTitle: 'THE NOVA', priceLine: 'FROM RM159,000', featuresHint: 'Spotlight the next feature on the car',
    variants: [
      { name: 'Nova Standard', price: 'RM159,000', spec: '520 km · 0–100 in 6.1 s · Single motor, RWD' },
      { name: 'Nova Pro', price: 'RM189,000', spec: '610 km · 0–100 in 4.4 s · Dual motor, AWD' },
      { name: 'Nova Launch Edition', price: 'RM219,000', spec: '640 km · 0–100 in 3.6 s · Dual motor, 1 of 500' },
    ],
  },
  hotspots: [
    { id: 'lights', x: 34.6, y: 50.3, name: 'Light Blade', desc: 'One 1.6 m light signature that wakes as you walk up to the car.', stat: '2,400', unit: 'individually lit LEDs' },
    { id: 'wheels', x: 46.2, y: 62.6, name: '21" Aero wheels', desc: 'Closed turbine spokes cut drag at highway speed.', stat: '+18 km', unit: 'range vs open spokes' },
    { id: 'cabin', x: 60.5, y: 38.5, name: 'Horizon cockpit', desc: 'A floating 15.6" display and full-width ambient light.', stat: '15.6"', unit: 'OLED centre screen' },
    { id: 'roof', x: 66, y: 32.6, name: 'Sky glass roof', desc: 'One panoramic pane, heat and UV coated for tropical sun.', stat: '2.1 m²', unit: 'of uninterrupted glass' },
    { id: 'charge', x: 82.2, y: 44.6, name: 'Fast-charge port', desc: '800-volt architecture. Top up in the time it takes to grab a kopi.', stat: '18 min', unit: '10 to 80% charge' },
  ],
  polls: [
    { id: 'colour', q: 'Which colour would you spec?', opts: { 'Glacier White': 38, 'Ember Orange': 31, 'Midnight Teal': 19, Graphite: 12 }, votes: 3412 },
    { id: 'trim', q: 'Which Nova is yours?', opts: { Standard: 34, Pro: 47, 'Launch Edition': 19 }, votes: 2786 },
    { id: 'feature', q: 'Best thing you have seen tonight?', opts: { 'The Light Blade': 36, '18-minute charging': 41, 'Sky glass roof': 23 }, votes: 2204 },
  ],
  breakContent: {
    minutes: 8, sub: 'Q&A is next. Stretch your legs, or stay for a minute of design notes.',
    poll: { id: 'break', q: 'Reveal verdict, in one word?', opts: { Stunning: 52, Clean: 27, 'Not sure yet': 21 }, votes: 1890 },
    reads: [
      { kicker: 'WHY 800 VOLTS', title: 'Half the charging time, same cable size', body: 'Doubling the voltage halves the current for the same power, so the Nova can pull 270 kW without thicker, heavier cables.' },
      { kicker: 'THE LIGHT BLADE', title: '2,400 LEDs, one line', body: 'Each LED is addressed individually, so the blade can sweep a welcome as you walk up and show charge level at a glance.' },
      { kicker: 'BUILT FOR THE CITY', title: 'Tuned for stop-start traffic', body: 'One-pedal driving recovers energy at every red light. In testing it added about 9% range on a typical KL commute.' },
    ],
  },
  announcements: {
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
  },
  reminders: [
    { title: 'Doors open in 1 hour', body: 'Aurora Hall opens at 19:30. Your QR check-in is on this page, no ticket needed.', target: 'venue' },
    { title: 'The stream starts in 15 minutes', body: 'Keep this page open, the player appears here at 20:00.', target: 'online' },
    { title: 'Parking update', body: 'Basement levels B2 and B3 are reserved for guests. Show this page at the barrier.', target: 'venue' },
    { title: 'Send your questions now', body: 'The most upvoted questions go to the team on stage at 20:40.', target: 'all' },
  ],
  presenters: [
    { name: 'Amira Hassan', role: 'CEO, Aurora Motors', slot: 'Keynote · 20:00', photo: av('av-hannah') },
    { name: 'Farid Rahman', role: 'Head of Design', slot: 'Reveal · 20:25', photo: av('av-marcus') },
    { name: 'Lena Kwok', role: 'Chief Engineer', slot: 'Q&A · 20:40', photo: av('av-priya') },
  ],
  sponsors: ['Gridline Charging', 'Strata Bank', 'Lumen Air', 'Kopi Lane'],
  iris: {
    intro: 'I’m IRIS. I answer from Aurora’s approved Nova facts: tonight’s running order, range, charging, price and finance.',
    pre: [
      { q: 'What is being revealed?', a: 'Aurora’s first all-electric crossover, the Nova. Specs, price and the first look all land at the reveal, 20:25.', stat: '20:25', label: 'REVEAL TIME' },
      { q: 'Can I watch online?', a: 'Yes. The full launch streams here, and online viewers get the same polls, chat and Q&A as the hall.', stat: '2', label: 'WAYS TO JOIN' },
      { q: 'How do I ask a question?', a: 'Send it from the panel any time. The most upvoted questions are put to the team in the Q&A at 20:40.', stat: '20:40', label: 'Q&A STARTS' },
    ],
    live: [
      { q: 'What range does it get?', a: 'The Nova Pro is rated at 610 km (WLTP). In city traffic with the aircon on, testing averaged about 525 km, a week of commuting on one charge.', stat: '610 km', label: 'NOVA PRO RANGE', keys: 'range|km|far|battery' },
      { q: 'How fast does it charge?', a: 'On an 800-volt fast charger, 10 to 80% takes about 18 minutes. At home a 7 kW wallbox does a full charge overnight.', stat: '18 min', label: '10 TO 80% CHARGE', keys: 'charg|wallbox|plug' },
      { q: 'How much is it?', a: 'From RM159,000 for the Nova Standard, RM189,000 for the Pro and RM219,000 for the Launch Edition, on the road.', stat: 'RM159k', label: 'STARTING PRICE', keys: 'price|cost|much|rm|expensive' },
      { q: 'Can I finance it?', a: 'Yes. With 20% down over 7 years at an indicative 2.49% flat rate, the Nova Standard is about RM1,778 a month.', stat: 'RM1,778', label: 'A MONTH, INDICATIVE', keys: 'financ|month|loan|instal' },
    ],
    hidden: 'That is announced at the reveal at 20:25. Stay with the panel, I’ll have the full answer the moment the car is out.',
    fallback: 'I only answer from Aurora’s approved Nova facts, and that one isn’t in them. Send it to the Q&A and the team can answer it.',
  },
  cta: {
    cardKicker: 'NEXT STEP', title: 'Book a test drive', sub: 'Three showrooms in the Klang Valley, weekend slots from Saturday.', button: 'BOOK A TEST DRIVE',
    screenTitle: 'TEST DRIVE', screenMeta: '3 SHOWROOMS', intro: 'Forty-five minutes behind the wheel of a Nova Pro, with a product specialist.',
    optionsLabel: 'SHOWROOM', options: [
      { id: 'kl', name: 'Aurora KL', sub: 'Bangsar South · 4.2 km' },
      { id: 'pj', name: 'Aurora Petaling Jaya', sub: 'Section 13 · 9.8 km' },
      { id: 'sa', name: 'Aurora Shah Alam', sub: 'Glenmarie · 21 km' },
    ],
    slotsLabel: 'TIME', slots: ['Sat 14 Nov · 10:00', 'Sat 14 Nov · 14:00', 'Sun 15 Nov · 11:00'],
    submit: 'REQUEST TEST DRIVE', doneTitle: 'Test drive requested', doneSub: 'The showroom will confirm by SMS. Bring your driving licence.',
  },
  follow: { title: 'Follow for the next launch', sub: 'One ping when the next premiere is announced. Nothing else.', doneTitle: 'Following Aurora Motors', doneSub: 'You’ll get a ping when the next premiere is announced.' },
  after: { badge: 'THAT WAS THE NOVA', title: 'AURORA NOVA', sub: 'From RM159,000 · first deliveries in March', stats: [['10,426', 'WATCHED'], ['48.2k', 'REACTIONS'], ['312', 'QUESTIONS']], recapTitle: 'THE RECAP' },
  community: {
    badge: 'AURORA COMMUNITY · ALWAYS ON', title: 'The launch is over.\nThe conversation isn’t.',
    sub: 'Chat with other Nova fans, ask IRIS anything from the approved facts, and get first access to the next Aurora event.',
    next: { name: 'Nova Drive Week', kicker: 'FAN EVENT', date: 'SAT 5 DEC', time: '10:00', place: 'AURORA KL + ONLINE', blurb: 'Test-drive weekends across the Klang Valley, and a live Q&A with the Nova engineers.', days: 25 },
    pastLabel: 'PAST EVENT', pastDate: 'TUE 10 NOV', pastTitle: 'Aurora Nova World Premiere', pastSub: '10,426 watched, 1,240 in the hall. From RM159,000, first deliveries in March.', replay: 'REPLAY · 1:12:40',
  },
  chat: {
    pool: [
      { user: 'NADIA.KL', text: 'Front row energy in here tonight', where: 'venue', tag: 'HALL · ROW C', avatar: av('av-priya') },
      { user: 'JUNSHENG88', text: 'Watching from Penang, stream is crisp', where: 'online', tag: 'ONLINE · PENANG', avatar: av('av-r1') },
      { user: 'TMK_EV', text: 'Range in KL traffic is what I need to hear', where: 'online', tag: 'ONLINE · KL', avatar: av('av-declan') },
      { user: 'AISYAH_R', text: 'The lighting on that stage though', where: 'venue', tag: 'HALL · ROW F', avatar: av('av-hannah') },
      { user: 'DANIEL.L', text: 'If it is under 170k I am in', where: 'online', tag: 'ONLINE · JB', avatar: av('av-marcus') },
      { user: 'PRIYA.M', text: 'Brought my dad, he still drives a 2009 sedan', where: 'venue', tag: 'HALL · ROW K', avatar: av('av-priya') },
      { user: 'HAZIQ', text: 'Anyone else here for the charging numbers?', where: 'online', tag: 'ONLINE · IPOH', avatar: av('av-r2') },
      { user: 'MEI_TAN', text: 'Booked a test drive already, no regrets', where: 'venue', tag: 'HALL · ROW B', avatar: av('av-hannah') },
      { user: 'KAVIN_S', text: '800 volts at this price would be wild', where: 'online', tag: 'ONLINE · SHAH ALAM', avatar: av('av-r3') },
      { user: 'SOFEA', text: 'That light bar, honestly', where: 'venue', tag: 'HALL · ROW D', avatar: av('av-priya') },
      { user: 'RYAN_K', text: 'Glacier White or nothing', where: 'online', tag: 'ONLINE · KUCHING', avatar: av('av-r1') },
      { user: 'LINA_Z', text: 'Wallbox included? Say it again', where: 'online', tag: 'ONLINE · MELAKA', avatar: av('av-hannah') },
    ],
    quickBefore: ['Can’t wait', 'Who else is in the hall?', 'Watching from home'],
    quickLive: ['That light bar 😍', 'Price please!', 'Range in traffic?', 'Hello from online'],
    quickAfter: ['What a launch', 'Booked my test drive', 'Glacier White for me'],
  },
  qaSeed: [
    { id: 'q1', text: 'What is the real-world range in city traffic?', who: 'tmk_ev', where: 'online', votes: 412 },
    { id: 'q2', text: 'Is the home wallbox included with the car?', who: 'lina_z', where: 'online', votes: 356 },
    { id: 'q3', text: 'When do the first deliveries start?', who: 'nadia.kl', where: 'venue', votes: 298 },
    { id: 'q4', text: 'Can I finance the Launch Edition?', who: 'daniel.l', where: 'online', votes: 221 },
    { id: 'q5', text: 'How long is the battery warranty?', who: 'priya.m', where: 'venue', votes: 187 },
  ],
  demo: {
    rsvp: { venue: 1380, online: 5040 },
    audienceBefore: 2140, venueBySeg: [612, 1186, 1240, 1228], onlineBySeg: [3420, 7860, 9186, 8740],
    breakAud: [1104, 7310], afterAud: [486, 3920], communityOnline: 412,
    checkinsBySeg: [604, 1158, 1212, 1212],
    results: {
      reactions: 48210, questions: 312, answered: 23, conversions: 186, conversionLabel: 'TEST DRIVE REQUESTS',
      engagement: [{ seg: 'Doors open', pct: 38 }, { seg: 'Keynote', pct: 64 }, { seg: 'Reveal', pct: 92 }, { seg: 'Q&A', pct: 71 }, { seg: 'Break', pct: 44 }],
      conversionsBy: [{ name: 'Aurora KL', n: 94 }, { name: 'Aurora Petaling Jaya', n: 61 }, { name: 'Aurora Shah Alam', n: 31 }],
      multiEvent: { total: 2140, rows: [{ name: 'Owners Day + Nova launch', n: 1320 }, { name: 'Nova launch + registered for Drive Week', n: 640 }, { name: 'All three events', n: 180 }] },
      follows: 2140, votes: 8902,
    },
  },
};
