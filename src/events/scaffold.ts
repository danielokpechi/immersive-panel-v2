// The neutral starting point for a new event. No sample's content: generic
// placeholder copy and artwork that every template then reshapes. Every field
// is edited in the builder.
import type { EventConfig } from './config';

export const SCAFFOLD: EventConfig = {
  id: 'new', version: 1, status: 'draft',
  brand: { name: 'Your brand', wordmark: 'YOUR BRAND', wordmarkShort: 'BRAND', logo: 'connect-events/scaffold/logo.svg', accent: '#8B3DF5', dark: '#160925', domain: 'connect.boltos.ai/your-event' },
  event: {
    name: 'Untitled event', template: 'launch', format: 'Hybrid', date: '2027-01-15', time: '20:00', dayLabel: 'FRI 20:00', dateShort: 'FRI 15 JAN',
    venue: 'Your venue', venueShort: 'YOUR VENUE', venueWord: 'VENUE', city: 'Your city',
    kicker: 'YOUR BRAND', kickerSub: 'EVENT · YOUR CITY', title: 'YOUR EVENT',
    countdownLabel: 'STARTS IN', countdownSeconds: 3 * 3600 + 14 * 60, dateLine: 'FRI 20:00 · YOUR VENUE · AND ONLINE',
    inviteTitle: 'BE THERE', inviteSub: 'In person or online, the same moment.',
    venueOption: 'In person', venueOptionSub: 'Your venue · doors 19:30', onlineOptionSub: 'Live stream with this panel · polls, chat, Q&A',
    registeredVenue: 'See you there. Show this panel at the door.', registeredOnline: 'Watching online. This panel is your stream companion.',
    details: [
      { icon: 'event', k: 'When', v: 'Date and time' },
      { icon: 'location_on', k: 'Where', v: 'Venue and city' },
      { icon: 'wifi', k: 'Online', v: 'Live stream on this page' },
    ],
    heroImage: { src: 'connect-events/scaffold/hero.svg', w: 1600, h: 1000 },
  },
  segments: [],
  reveal: { kicker: 'THE MOMENT', word1: 'INTRODUCING', word2: 'PRODUCT', line: 'One line about what was just revealed.', thirdNote: 'Tap the glowing points to explore', title: 'YOUR PRODUCT', sub: 'Tap a glowing point to explore.', triggerBlurb: 'Reveal on every screen' },
  product: { sectionTitle: 'THE PRODUCT', priceLine: '', featuresHint: 'Spotlight the next feature', variants: [{ name: 'Standard', price: '', spec: 'Key specs' }] },
  hotspots: [
    { id: 'h1', x: 40, y: 48, name: 'Feature one', desc: 'What it is and why it matters.', stat: '1', unit: 'number with a unit' },
    { id: 'h2', x: 60, y: 60, name: 'Feature two', desc: 'What it is and why it matters.', stat: '2', unit: 'number with a unit' },
  ],
  polls: [{ id: 'p1', q: 'What do you think so far?', opts: { 'Love it': 60, 'Not sure yet': 40 }, votes: 1200 }],
  breakContent: { minutes: 10, sub: 'Back shortly.', poll: { id: 'break', q: 'First impressions, in one word?', opts: { Great: 60, Okay: 40 }, votes: 800 }, reads: [] },
  announcements: { all: [{ kicker: 'UPDATE', title: 'An announcement for everyone', sub: 'One line of detail' }], venue: [], online: [] },
  reminders: [{ title: 'Starting soon', body: 'Keep this page open.', target: 'all' }],
  presenters: [],
  sponsors: [],
  iris: { intro: 'I’m IRIS. I answer only from the approved facts for this event.', pre: [{ q: 'When does it start?', a: 'Add the approved answer here.', stat: '', label: '' }], live: [], hidden: 'That is announced at the reveal.', fallback: 'That isn’t in my approved facts. Send it to the Q&A.' },
  cta: {
    cardKicker: 'NEXT STEP', title: 'Book a session', sub: 'Pick a place and a time.', button: 'BOOK NOW', screenTitle: 'BOOK', screenMeta: '', intro: 'Choose where and when.',
    optionsLabel: 'LOCATION', options: [{ id: 'o1', name: 'Location one', sub: 'Address' }], slotsLabel: 'TIME', slots: ['Sat 10:00'], submit: 'REQUEST', doneTitle: 'Requested', doneSub: 'We’ll confirm shortly.',
  },
  follow: { title: 'Follow for the next event', sub: 'One ping when the next one is announced.', doneTitle: 'Following', doneSub: 'You’ll hear about the next one.' },
  after: { badge: 'THANKS FOR JOINING', title: 'YOUR EVENT', sub: 'One line recap', stats: [['0', 'WATCHED'], ['0', 'REACTIONS'], ['0', 'QUESTIONS']], recapTitle: 'THE RECAP' },
  community: {
    badge: 'COMMUNITY · ALWAYS ON', title: 'The event is over.\nThe conversation isn’t.', sub: 'Chat, ask IRIS, and hear about the next event first.',
    next: { name: 'Next event', kicker: 'NEXT', date: 'TBC', time: '', place: '', blurb: 'Details soon.', days: 30 },
    pastLabel: 'PAST EVENT', pastDate: '', pastTitle: 'Your event', pastSub: 'Replay and recap.', replay: 'REPLAY',
  },
  chat: { pool: [{ user: 'GUEST', text: 'Hello from the room', where: 'venue', tag: 'VENUE' }, { user: 'VIEWER', text: 'Watching online', where: 'online', tag: 'ONLINE' }], quickBefore: ['Can’t wait'], quickLive: ['Wow'], quickAfter: ['Great event'] },
  qaSeed: [],
  demo: {
    rsvp: { venue: 400, online: 1600 }, audienceBefore: 600, venueBySeg: [200, 380, 400, 390], onlineBySeg: [800, 1500, 1700, 1600],
    breakAud: [300, 1200], afterAud: [100, 600], communityOnline: 80, checkinsBySeg: [180, 360, 380, 380],
    results: {
      reactions: 4200, questions: 60, answered: 8, conversions: 40, conversionLabel: 'BOOKINGS',
      engagement: [], conversionsBy: [{ name: 'Location one', n: 40 }], multiEvent: { total: 0, rows: [] }, follows: 300, votes: 900,
    },
  },
};
