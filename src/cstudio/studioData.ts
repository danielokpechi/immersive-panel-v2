// BoltOS Studio — tokens, seed data, and the section/activity catalogues.
// Ported from the boltos-studio prototype; the React screens consume these.

// Surface tokens are CSS variables so the light/dark toggle can swap them live.
// Accent colours stay fixed (they read fine on both themes).
export const T = {
  bg: 'var(--cs-bg)',
  surface: 'var(--cs-surface)',
  surface2: 'var(--cs-surface2)',
  line: 'var(--cs-line)',
  line2: 'var(--cs-line2)',
  ink: 'var(--cs-ink)',
  muted: 'var(--cs-muted)',
  dim: 'var(--cs-dim)',
  purple: '#8B3DF5',
  purpleSoft: 'rgba(139,61,245,0.16)',
  purpleText: 'var(--cs-purpleText)',
  green: '#2BD47D',
  amber: '#F5A524',
  font: "'Inter',system-ui,-apple-system,'Segoe UI',sans-serif",
};

export type Theme = 'dark' | 'light';
export const THEME_VARS: Record<Theme, Record<string, string>> = {
  dark: {
    '--cs-bg': '#0E0E12', '--cs-surface': '#16161C', '--cs-surface2': '#1E1E26',
    '--cs-line': '#2C2C36', '--cs-line2': '#4A4A55', '--cs-ink': '#F2F2F5',
    '--cs-muted': '#B4B4C0', '--cs-dim': '#E0E0E7', '--cs-purpleText': '#C9B6FF',
    '--cs-logo-filter': 'brightness(3)', '--cs-hover': 'rgba(255,255,255,0.05)',
  },
  light: {
    '--cs-bg': '#F3F3F6', '--cs-surface': '#FFFFFF', '--cs-surface2': '#F1F1F5',
    '--cs-line': '#E4E4EA', '--cs-line2': '#CFCFD8', '--cs-ink': '#18171E',
    '--cs-muted': '#565661', '--cs-dim': '#3A3A44', '--cs-purpleText': '#6D28C9',
    '--cs-logo-filter': 'none', '--cs-hover': 'rgba(0,0,0,0.04)',
  },
};

// Assets live in public/connect-studio/assets/ (BASE_URL-aware for sub-path deploys).
export const A = (f: string) =>
  (import.meta.env.BASE_URL || '/') + 'connect-studio/assets/' + f;

export type Status = 'live' | 'scheduled' | 'archived';
export type PType = 'stream' | 'vod' | 'inperson';
export type Template = 'home' | 'away' | 'stadium';
export type SectionKey = 'fanChat' | 'polls' | 'predictions' | 'rewards' | 'shop' | 'reads' | 'crews' | 'iris';

export type Colors = { primary: string; accent: string; bg: string };

export type Panel = {
  id: string;
  title: string;
  desc: string;
  insight: string;
  status: Status;
  type: PType;
  template?: Template;
  typeLabel: string; // "In-person · Home game"
  image: string;
  dimImage?: boolean;
  footer: string; // meta line, left side
  live?: boolean;
  sections: Record<SectionKey, boolean>;
  colors: Colors;
};

export const STATUS_STYLE: Record<Status, { fg: string; label: string }> = {
  live: { fg: '#2BD47D', label: 'Live' },
  scheduled: { fg: '#F5A524', label: 'Scheduled' },
  archived: { fg: '#9C9CA8', label: 'Archived' },
};

export const TYPES: { key: PType; label: string; sub: string; icon: string }[] = [
  { key: 'stream', label: 'Online stream', sub: 'Live broadcasts with chat alongside: press conferences, watch-alongs.', icon: 'radio' },
  { key: 'vod', label: 'VOD', sub: 'On-demand video with chat replay and polls: highlights, season reviews.', icon: 'play' },
  { key: 'inperson', label: 'In-person event', sub: 'Fans at the ground or a venue: home games, away days, stadium tours.', icon: 'pin' },
];

export const TEMPLATES: { key: Template; label: string; sub: string; colors: Colors }[] = [
  { key: 'home', label: 'Home game', sub: 'Your ground, your colours. Chat, predictions, polls and the shop.', colors: { primary: '#7B2FE2', accent: '#D62086', bg: '#F7F7F5' } },
  { key: 'away', label: 'Away game', sub: 'Travelling support: travel updates, fan chat and predictions.', colors: { primary: '#101014', accent: '#35C7DF', bg: '#EEF3F5' } },
  { key: 'stadium', label: 'Stadium event', sub: 'Tours and club events: trivia, rewards and the shop.', colors: { primary: '#2E2A4F', accent: '#35C7DF', bg: '#F7F7F5' } },
];

export const SECTIONS: { key: SectionKey; label: string; sub: string; icon: string }[] = [
  { key: 'fanChat', label: 'Fan chat', sub: 'Live chat with moderation', icon: 'chat' },
  { key: 'polls', label: 'Polls', sub: 'Quick votes pushed into chat', icon: 'poll' },
  { key: 'predictions', label: 'Predictions', sub: 'Pick & Win before and during the match', icon: 'target' },
  { key: 'rewards', label: 'Rewards', sub: 'Points and prizes for taking part', icon: 'gift' },
  { key: 'shop', label: 'Shop', sub: 'Matchday products', icon: 'bag' },
  { key: 'reads', label: 'Reads', sub: 'Club news and articles', icon: 'book' },
  { key: 'crews', label: 'Crews', sub: 'Small fan groups (trial module)', icon: 'users' },
  { key: 'iris', label: 'IRIS', sub: 'AI assistant for fan questions', icon: 'spark' },
];

export const ACTIVITIES: { key: string; label: string; sub: string; icon: string }[] = [
  { key: 'poll', label: 'Poll', sub: 'Who will win the next match?', icon: 'poll' },
  { key: 'quiz', label: 'Quiz', sub: 'When did Voltford move to the Arc?', icon: 'spark' },
  { key: 'pick', label: 'Pick & Win', sub: 'Who scores first for Voltford?', icon: 'target' },
  { key: 'sponsored', label: 'Sponsored', sub: 'Lumen Air: 15% off away flights', icon: 'flag' },
  { key: 'summary', label: 'Chat summary', sub: 'AI summary of the last 10 minutes', icon: 'spark' },
];

const ALL_ON: Record<SectionKey, boolean> = {
  fanChat: true, polls: true, predictions: true, rewards: true, shop: true, reads: true, crews: true, iris: false,
};
const CLUB: Colors = { primary: '#7B2FE2', accent: '#D62086', bg: '#F7F7F5' };

export function seedPanels(): Panel[] {
  return [
    {
      id: 'p-home', title: 'Voltford at Home', desc: 'Every home match at the Arc: chat, predictions, polls and the shop.',
      insight: 'Up 18% on last month. Predictions are the busiest section after chat.',
      status: 'live', type: 'inperson', template: 'home', typeLabel: 'In-person · Home game', image: A('stadium.jpg'),
      footer: 'Live now · v Kingsmere · 4,812 fans', live: true, sections: { ...ALL_ON }, colors: { ...CLUB },
    },
    {
      id: 'p-away', title: 'Voltford Away Days', desc: 'Travel updates, fan chat and predictions for every away trip.',
      insight: 'Travel updates get 3x more taps on the day before a trip.',
      status: 'scheduled', type: 'inperson', template: 'away', typeLabel: 'In-person · Away game', image: A('read-match.jpg'),
      footer: 'Next session · Harrow Vale away · Sun 2 Nov', sections: { ...ALL_ON, shop: false }, colors: { ...CLUB },
    },
    {
      id: 'p-tour', title: 'Voltford Stadium Tour', desc: 'Guided tours of the Arc with trivia, rewards and the shop.',
      insight: 'Tour fans spend most time in trivia and the shop.',
      status: 'scheduled', type: 'inperson', template: 'stadium', typeLabel: 'In-person · Stadium event', image: A('stadium.jpg'),
      footer: 'Daily tours · next 10:00 tomorrow', sections: { ...ALL_ON, predictions: false }, colors: { ...CLUB },
    },
    {
      id: 'p-women', title: 'Voltford Women', desc: 'WSL and cup matches with fan chat and Pick & Win.',
      insight: 'Pick & Win entries doubled since the start of the season.',
      status: 'scheduled', type: 'inperson', template: 'home', typeLabel: 'In-person · Home game', image: A('read-celebrate.jpg'),
      footer: 'Next session · v Harrow Vale · Sat 25 Oct', sections: { ...ALL_ON }, colors: { ...CLUB },
    },
    {
      id: 'p-press', title: 'Press & Media', desc: 'Press conferences and watch-alongs, streamed with chat and Q&A polls.',
      insight: 'Q&A polls lift chat activity by 40% during pressers.',
      status: 'scheduled', type: 'stream', typeLabel: 'Online stream', image: A('read-match.jpg'),
      footer: 'Next session · Ferro presser · Fri 24 Oct', sections: { ...ALL_ON, shop: false, crews: false }, colors: { ...CLUB },
    },
    {
      id: 'p-review', title: 'Season Review 25/26', desc: 'On-demand highlights with chat replay and polls.',
      insight: 'Most-watched: the Kingsmere derby recap.',
      status: 'archived', type: 'vod', typeLabel: 'VOD', image: A('membership.jpg'), dimImage: true,
      footer: '38 sessions · 1.2m views', sections: { ...ALL_ON, crews: false }, colors: { ...CLUB },
    },
  ];
}

export const emptyDraft = () => ({
  type: 'inperson' as PType,
  template: 'home' as Template,
  sections: { ...ALL_ON } as Record<SectionKey, boolean>,
  name: '',
  runs: '2026/27 season',
  desc: '',
  colors: { ...CLUB } as Colors,
});
export type Draft = ReturnType<typeof emptyDraft>;
