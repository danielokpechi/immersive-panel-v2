// Admin seed data for Panel Studio (Manchester City — one club, many panels).

export interface AdminModule { id: string; name: string; icon: string; blurb: string }
export const MODULES: AdminModule[] = [
  { id: 'chat', name: 'Fan Chat', icon: 'forum', blurb: 'Live moderated chat' },
  { id: 'intel', name: 'Match Intel', icon: 'insights', blurb: 'Pre-written xG, form, H2H' },
  { id: 'predict', name: 'Predictions', icon: 'scoreboard', blurb: 'Score + scorer, locks at KO' },
  { id: 'polls', name: 'Polls', icon: 'bar_chart', blurb: 'One-tap operator polls' },
  { id: 'reactions', name: 'Fan Reactions', icon: 'play_circle', blurb: '30-second fan reels' },
  { id: 'highlights', name: 'Highlights', icon: 'movie', blurb: 'Clip drops mid-match' },
  { id: 'rewards', name: 'Rewards / XP', icon: 'redeem', blurb: 'Tiers, quests, leaderboard' },
  { id: 'food', name: 'Order Food', icon: 'restaurant', blurb: 'To-seat ordering' },
  { id: 'photos', name: 'Photo Pool', icon: 'photo_library', blurb: 'Shared fan gallery' },
  { id: 'timeline', name: 'Timeline', icon: 'timeline', blurb: 'Goals, cards, VAR, subs' },
  { id: 'floor', name: 'Floor Plan', icon: 'event_seat', blurb: 'Seat, kiosks, exits' },
  { id: 'shop', name: 'Store', icon: 'shopping_bag', blurb: 'Match-day drops' },
];

export interface AdminSport { id: string; name: string; icon: string; states: string }
export const SPORTS: AdminSport[] = [
  { id: 'pl', name: 'Premier League', icon: 'shield', states: '5 states' },
  { id: 'ucl', name: 'Champions League', icon: 'star', states: '5 states' },
  { id: 'facup', name: 'FA Cup', icon: 'emoji_events', states: '6 states' },
  { id: 'carabao', name: 'Carabao Cup', icon: 'sports_soccer', states: '6 states' },
  { id: 'wsl', name: "Women's Super League", icon: 'female', states: '5 states' },
  { id: 'cwc', name: 'Club World Cup', icon: 'public', states: '5 states' },
  { id: 'shield', name: 'Community Shield', icon: 'workspace_premium', states: '4 states' },
  { id: 'tour', name: 'Pre-season tour', icon: 'flight', states: '4 states' },
  { id: 'academy', name: 'Academy / EDS', icon: 'school', states: '4 states' },
  { id: 'event', name: 'Club event', icon: 'campaign', states: '4 states' },
];

export const PHASES = ['Idle', 'Pre', 'Live', 'Break', 'Post'] as const;
export type AdminPhase = (typeof PHASES)[number];
export const PHASE_COLOR: Record<string, string> = { Idle: '#8C8577', Pre: '#6CABDD', Live: '#C0473C', Break: '#0C3A5E', Post: '#5B5449' };

export interface AdminTrigger { id: string; name: string; icon: string; blurb: string; color: string }
export const TRIGGERS: AdminTrigger[] = [
  { id: 'goal', name: 'Goal', icon: 'sports_soccer', blurb: 'Score event + celebration', color: '#6CABDD' },
  { id: 'var', name: 'VAR check', icon: 'videocam', blurb: 'Pending, then decision', color: '#6CABDD' },
  { id: 'sub', name: 'Substitution', icon: 'swap_vert', blurb: 'On / off with minutes', color: '#5B5449' },
  { id: 'yellow', name: 'Yellow card', icon: 'style', blurb: 'Booking to the timeline', color: '#5B5449' },
  { id: 'motm', name: 'Man of the Match', icon: 'emoji_events', blurb: 'Opens fan vote', color: '#6CABDD' },
  { id: 'poll', name: 'Push poll', icon: 'bar_chart', blurb: 'Sends the staged poll', color: '#5B5449' },
  { id: 'ask', name: 'Ask question', icon: 'help', blurb: 'Prompt for fan replies', color: '#5B5449' },
  { id: 'react', name: 'Push reaction', icon: 'celebration', blurb: 'Full-screen reaction burst', color: '#C0473C' },
  { id: 'clear', name: 'Clear prompt', icon: 'layers_clear', blurb: 'Dismiss on every device', color: '#8C8577' },
];

export interface AdminPanel {
  id: string; title: string; club: string; abbr: string; sport: string; experience: string;
  primary: string; accent: string; venue: string; venueIcon: string; desc: string;
  live: boolean; fans: number; mods: string[]; updated: string;
}
export const PANELS: AdminPanel[] = [
  { id: 'PNL-4471', title: 'Semi-final, 2nd leg · Real Madrid', club: 'Champions League', abbr: 'MCI', sport: 'ucl', experience: 'IN-PERSON', primary: '#6CABDD', accent: '#6CABDD', venue: 'HOME', venueIcon: 'stadium', desc: 'Scan-to-open companion for the Etihad, driven live from the control room.', live: true, fans: 5.2, mods: ['timeline', 'chat', 'intel', 'predict', 'polls', 'rewards', 'food', 'photos', 'floor'], updated: 'Updated 12 min ago' },
  { id: 'PNL-4455', title: 'Etihad home matchday', club: 'Premier League', abbr: 'MCI', sport: 'pl', experience: 'IN-PERSON', primary: '#6CABDD', accent: '#0C3A5E', venue: 'HOME', venueIcon: 'stadium', desc: 'The standing league template — reused for every home fixture, fixture data swapped in.', live: true, fans: 3.4, mods: ['timeline', 'chat', 'intel', 'predict', 'food', 'floor', 'rewards', 'shop'], updated: 'Updated 2 hours ago' },
  { id: 'PNL-4402', title: 'Away day · travelling support', club: 'Premier League', abbr: 'MCI', sport: 'pl', experience: 'STREAM', primary: '#0C3A5E', accent: '#6CABDD', venue: 'AWAY', venueIcon: 'flight', desc: 'Second-screen panel for members watching on the road — chat, intel, reactions.', live: false, fans: 0, mods: ['chat', 'intel', 'timeline', 'reactions'], updated: 'Updated yesterday' },
  { id: 'PNL-4388', title: "Women's matchday · Joie Stadium", club: "Women's Super League", abbr: 'MCI', sport: 'wsl', experience: 'IN-PERSON', primary: '#6CABDD', accent: '#6CABDD', venue: 'HOME', venueIcon: 'stadium', desc: 'WSL panel with its own squad data, seat map and family-stand ordering.', live: false, fans: 0, mods: ['timeline', 'chat', 'predict', 'photos', 'floor', 'rewards'], updated: 'Updated 3 days ago' },
  { id: 'PNL-4351', title: 'Wembley semi-final', club: 'FA Cup', abbr: 'MCI', sport: 'facup', experience: 'IN-PERSON', primary: '#201C17', accent: '#6CABDD', venue: 'NEUTRAL', venueIcon: 'place', desc: 'Neutral-venue variant: travel info, Wembley floor plan, no to-seat ordering.', live: false, fans: 0, mods: ['timeline', 'chat', 'intel', 'photos', 'floor'], updated: 'Updated last week' },
  { id: 'PNL-4310', title: 'Pre-season tour · USA', club: 'Pre-season tour', abbr: 'MCI', sport: 'tour', experience: 'VOD', primary: '#6CABDD', accent: '#C0473C', venue: 'TOUR', venueIcon: 'flight_takeoff', desc: 'On-demand panel for tour fixtures in US time zones, replayed after the whistle.', live: false, fans: 0, mods: ['highlights', 'chat', 'polls', 'shop', 'rewards'], updated: 'Updated 2 weeks ago' },
];

export interface AdminSession { name: string; phase: string; stack: string[]; def?: boolean }
export const SESSIONS: AdminSession[] = [
  { name: 'Warm-up', phase: 'Idle', stack: ['intel', 'chat'] },
  { name: 'Build-up', phase: 'Pre', stack: ['predict', 'intel', 'chat'] },
  { name: 'First half', phase: 'Live', stack: ['timeline', 'chat', 'polls'] },
  { name: 'Half-time', phase: 'Break', stack: ['food', 'polls', 'chat'] },
  { name: 'Second half', phase: 'Live', stack: ['timeline', 'chat', 'reactions'] },
  { name: 'Full-time', phase: 'Post', stack: ['photos', 'reactions', 'rewards'] },
];

export const PRIMARIES = ['#6CABDD', '#0C3A5E', '#201C17', '#C0473C'];
export const ACCENTS = ['#0C3A5E', '#6CABDD', '#201C17', '#C0473C'];
export const PACKS = ['Stadium', 'Broadcast', 'Minimal'];

export const clone = <T,>(o: T): T => JSON.parse(JSON.stringify(o));
export const ring = (on: boolean) => (on ? 'inset 0 0 0 2px #201C17' : 'inset 0 0 0 1px rgba(32,28,23,.12)');
