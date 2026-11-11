// Sample event: the Aurora Nova world premiere (fictional brand, fictional car).
// Every word and number the Nova fan view and Studio show comes from here.
import type { EventConfig, Lead, Signals } from '../config';

const sg = (p: Partial<Signals>): Signals => ({ features: 0, polls: 0, iris: 0, questions: 0, built: false, finance: false, booked: false, checkedIn: false, following: false, ...p });
const lead = (id: string, name: string, where: 'venue' | 'online', model: string, budget: string, area: string, source: string, route: string, status: Lead['status'], at: string, signals: Partial<Signals>, extra: Partial<Lead> = {}): Lead =>
  ({ id, name, where, answers: { model, budget, area }, consent: true, source, signals: sg(signals), route, status, at, ...extra });

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
    { name: 'Amira Hassan', role: 'CEO, Aurora Motors', slot: 'Keynote · 20:00', photo: '' },
    { name: 'Farid Rahman', role: 'Head of Design', slot: 'Reveal · 20:25', photo: '' },
    { name: 'Lena Kwok', role: 'Chief Engineer', slot: 'Q&A · 20:40', photo: '' },
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
  interest: {
    title: 'Tell us what you’re after', sub: 'Three taps. It shapes what IRIS tells you and matches you to the nearest showroom.',
    consent: 'Aurora Motors and its showrooms can contact me about the Nova. I can opt out any time.',
    fields: [
      { id: 'model', label: 'Preferred model', short: 'Model', options: ['The new Nova', 'Aurora Terra', 'Aurora Vela', 'Not sure yet'] },
      { id: 'budget', label: 'Budget', short: 'Budget', options: ['Under RM160k', 'RM160k–190k', 'RM190k–220k', 'Over RM220k'] },
      { id: 'area', label: 'Nearest to', short: 'Area', options: ['Kuala Lumpur', 'Petaling Jaya', 'Shah Alam', 'Elsewhere'], routes: { 'Kuala Lumpur': 'kl', 'Petaling Jaya': 'pj', 'Shah Alam': 'sa' } },
    ],
  },
  showroom: {
    buildTitle: 'BUILD YOUR NOVA', buildSub: 'Pick a colour and a trim. Prices are on the road.',
    colours: [
      { name: 'Glacier White', hex: '#E6E9EC' }, { name: 'Ember Orange', hex: '#E2622B' },
      { name: 'Midnight Teal', hex: '#17646A' }, { name: 'Graphite', hex: '#44474D' },
    ],
    finance: {
      title: 'MONTHLY COST', sub: 'Indicative hire purchase with Strata Bank, the launch finance partner.',
      rate: 2.49, deposits: [10, 20, 30], terms: [5, 7, 9], defaultDeposit: 20, defaultTerm: 7,
      note: 'Indicative only, at a 2.49% flat rate. Final terms depend on approval by Strata Bank.',
      depositRange: [10, 50, 5], termRange: [3, 9, 1],
      ownership: {
        title: 'ESTIMATED RUNNING COST', sub: 'A typical month: 1,500 km, charging mostly at home.',
        items: [{ label: 'Charging at home', v: 96 }, { label: 'Insurance, comprehensive', v: 310 }],
        note: 'Estimates for illustration. Insurance depends on the driver, the area and no-claims discount.',
      },
      running: {
        title: 'CHARGING VS PETROL', sub: 'Energy for a month of 1,500 km, typical Klang Valley driving.',
        rows: [{ label: 'Nova, charging at home', v: 96 }, { label: 'Nova, fast chargers only', v: 288 }, { label: 'Petrol crossover, 8 L/100 km', v: 246 }],
      },
    },
  },
  dealers: [
    { id: 'kl', name: 'Aurora KL', area: 'Bangsar South, Kuala Lumpur', contact: 'kl@auroramotors.example · 03-2201 0000', areas: ['Kuala Lumpur'] },
    { id: 'pj', name: 'Aurora Petaling Jaya', area: 'Section 13, Petaling Jaya', contact: 'pj@auroramotors.example · 03-7955 0000', areas: ['Petaling Jaya'] },
    { id: 'sa', name: 'Aurora Shah Alam', area: 'Glenmarie, Shah Alam', contact: 'sa@auroramotors.example · 03-5569 0000', areas: ['Shah Alam'] },
  ],
  leadStatuses: ['New', 'Contacted', 'Test drive done', 'Sold'],
  leadSegments: [
    { id: 'pro-kl', name: 'Built a Nova Pro, Kuala Lumpur', variant: 'Nova Pro', area: 'Kuala Lumpur', template: 'Hi {first}, your Nova Pro in {colour} is ready to drive at Aurora KL this weekend. Reply with a time and we’ll have it charged and waiting.' },
    { id: 'finance', name: 'Asked about finance', finance: true, template: 'Hi {first}, thanks for checking the Nova’s monthly cost. Launch finance with Strata Bank is held for 30 days. Want a personalised quote from {dealer}?' },
    { id: 'booked', name: 'Booked a test drive', booked: true, template: 'Hi {first}, see you at {dealer} for your Nova test drive. Bring your driving licence; it takes about 45 minutes.' },
  ],
  followUp: {
    template: 'Hi {first}, thanks for joining the Aurora Nova premiere. {extra}{route} has a Nova ready for a test drive this weekend, with a product specialist. Reply with a time that suits you.',
    extraBuilt: 'You specced a {variant} in {colour}. ', extraFinance: 'At about {monthly} a month on the launch finance, launch pricing is held for 30 days. ', extraFeature: 'You spent the most time on the {feature}, so we’ll start there. ',
  },
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
      funnel: [
        { label: 'Registered', n: 6420, key: 'registered' },
        { label: 'Engaged', n: 4880, key: 'engaged' },
        { label: 'Built a Nova', n: 1940, key: 'built' },
        { label: 'Test drive', n: 186, key: 'booked' },
        { label: 'Reserved', n: 64 },
        { label: 'Sold (reported by showroom)', n: 21 },
      ],
      features: { lights: 64, wheels: 38, cabin: 57, roof: 41, charge: 72 },
      leadQuality: [
        { name: 'Aurora KL', hot: 212, warm: 640, cold: 1380, won: 11 },
        { name: 'Aurora Petaling Jaya', hot: 158, warm: 512, cold: 1110, won: 7 },
        { name: 'Aurora Shah Alam', hot: 74, warm: 290, cold: 820, won: 3 },
      ],
      sources: [
        { name: 'Instagram + TikTok ads', n: 2410, icon: 'campaign' }, { name: 'Search + direct', n: 1290, icon: 'search' },
        { name: 'Aurora owners newsletter', n: 1120, icon: 'mail' }, { name: 'Showroom invites', n: 860, icon: 'storefront' },
        { name: 'Strata Bank app (partner)', n: 740, icon: 'handshake' },
      ],
    },
    leads: [
      lead('L-2041', 'Mei Tan', 'venue', 'The new Nova', 'RM160k–190k', 'Petaling Jaya', 'Showroom invites', 'pj', 'Test drive done', 'Hall · 21:02', { features: 5, polls: 3, iris: 2, built: true, finance: true, booked: true, checkedIn: true }, { seen: ['charge', 'lights', 'cabin', 'roof', 'wheels'], colour: 'Glacier White', variant: 'Nova Pro', monthly: 'RM2,114' }),
      lead('L-2042', 'Tan Jun Sheng', 'online', 'The new Nova', 'RM190k–220k', 'Elsewhere', 'Instagram + TikTok ads', 'kl', 'New', 'Online · 20:58', { features: 4, polls: 2, iris: 3, questions: 1, built: true, finance: true, following: true }, { seen: ['charge', 'cabin', 'lights', 'roof'], colour: 'Midnight Teal', variant: 'Nova Launch Edition', monthly: 'RM2,449' }),
      lead('L-2043', 'Kavin Subramaniam', 'online', 'The new Nova', 'RM160k–190k', 'Kuala Lumpur', 'Search + direct', 'kl', 'Contacted', 'Online · 20:51', { features: 3, polls: 3, iris: 2, built: true, finance: true }, { seen: ['charge', 'wheels', 'lights'], colour: 'Graphite', variant: 'Nova Pro', monthly: 'RM2,114' }),
      lead('L-2044', 'Nadia Kamal', 'venue', 'The new Nova', 'Over RM220k', 'Kuala Lumpur', 'Aurora owners newsletter', 'kl', 'Sold', 'Hall · 20:47', { features: 5, polls: 2, iris: 1, built: true, booked: true, checkedIn: true, following: true }, { seen: ['lights', 'roof', 'cabin', 'charge', 'wheels'], colour: 'Ember Orange', variant: 'Nova Launch Edition' }),
      lead('L-2045', 'Haziq Ismail', 'online', 'Not sure yet', 'Under RM160k', 'Kuala Lumpur', 'Instagram + TikTok ads', 'kl', 'New', 'Online · 20:44', { features: 2, polls: 2, iris: 3, finance: true }, { seen: ['charge', 'wheels'], variant: 'Nova Standard', monthly: 'RM1,778' }),
      lead('L-2046', 'Priya Menon', 'venue', 'Aurora Terra', 'RM160k–190k', 'Petaling Jaya', 'Showroom invites', 'pj', 'New', 'Hall · 20:40', { features: 3, polls: 1, checkedIn: true }, { seen: ['cabin', 'roof', 'lights'] }),
      lead('L-2047', 'Ryan Khoo', 'online', 'The new Nova', 'RM160k–190k', 'Elsewhere', 'Strata Bank app (partner)', 'kl', 'New', 'Online · 20:39', { features: 1, polls: 3, built: true }, { seen: ['lights'], colour: 'Glacier White', variant: 'Nova Standard' }),
      lead('L-2048', 'Lina Zainal', 'online', 'The new Nova', 'Under RM160k', 'Shah Alam', 'Instagram + TikTok ads', 'sa', 'New', 'Online · 20:36', { features: 2, polls: 1, iris: 1, questions: 1 }, { seen: ['charge', 'wheels'] }),
      lead('L-2049', 'Aisyah Rahman', 'venue', 'Aurora Vela', 'Under RM160k', 'Kuala Lumpur', 'Aurora owners newsletter', 'kl', 'Contacted', 'Hall · 20:31', { features: 1, polls: 1, checkedIn: true }, { seen: ['lights'] }),
      lead('L-2050', 'Darren Lim', 'online', 'Not sure yet', 'RM190k–220k', 'Petaling Jaya', 'Search + direct', 'pj', 'New', 'Online · 20:29', { polls: 1, iris: 1 }),
      lead('L-2051', 'Sofea Aziz', 'online', 'Aurora Terra', 'Under RM160k', 'Elsewhere', 'Strata Bank app (partner)', 'kl', 'New', 'Online · 20:22', { polls: 1 }, { consent: false }),
    ],
  },
};
