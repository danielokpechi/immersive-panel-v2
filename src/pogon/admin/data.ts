// Admin seed data for Panel Studio (Pogoń Szczecin, one club, many panels).
import { getAdmDark } from './s';

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
  { id: 'pl', name: 'PKO BP Ekstraklasa', icon: 'shield', states: '5 states' },
  { id: 'ucl', name: 'UEFA Conference League', icon: 'star', states: '5 states' },
  { id: 'facup', name: 'Puchar Polski', icon: 'emoji_events', states: '6 states' },
  { id: 'carabao', name: 'Polish Super Cup', icon: 'sports_soccer', states: '6 states' },
  { id: 'wsl', name: "Orlen Ekstraliga Kobiet", icon: 'female', states: '5 states' },
  { id: 'cwc', name: 'Conference League', icon: 'public', states: '5 states' },
  { id: 'shield', name: 'Club Friendly', icon: 'workspace_premium', states: '4 states' },
  { id: 'tour', name: 'Pre-season tour', icon: 'flight', states: '4 states' },
  { id: 'academy', name: 'Academy / EDS', icon: 'school', states: '4 states' },
  { id: 'event', name: 'Club event', icon: 'campaign', states: '4 states' },
];

export const PHASES = ['Idle', 'Pre', 'Live', 'Break', 'Post'] as const;
export type AdminPhase = (typeof PHASES)[number];
export const PHASE_COLOR: Record<string, string> = { Idle: '#8C8577', Pre: '#C8102E', Live: '#C0473C', Break: '#1B324F', Post: '#5B5449' };

export interface AdminTrigger { id: string; name: string; icon: string; blurb: string; color: string }
export const TRIGGERS: AdminTrigger[] = [
  { id: 'goal', name: 'Goal', icon: 'sports_soccer', blurb: 'Score event + celebration', color: '#C8102E' },
  { id: 'var', name: 'VAR check', icon: 'videocam', blurb: 'Pending, then decision', color: '#C8102E' },
  { id: 'sub', name: 'Substitution', icon: 'swap_vert', blurb: 'On / off with minutes', color: '#5B5449' },
  { id: 'yellow', name: 'Yellow card', icon: 'style', blurb: 'Booking to the timeline', color: '#5B5449' },
  { id: 'red', name: 'Red card', icon: 'style', blurb: 'Sending-off to every phone', color: '#C0473C' },
  { id: 'offside', name: 'Offside', icon: 'flag', blurb: 'Flag up, chance ruled out', color: '#5B5449' },
  { id: 'motm', name: 'Man of the Match', icon: 'emoji_events', blurb: 'Opens fan vote', color: '#C8102E' },
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
  { id: 'PNL-4471', title: 'Round 15 · Pogoń v Śląsk Wrocław', club: 'PKO BP Ekstraklasa', abbr: 'POG', sport: 'pl', experience: 'IN-PERSON', primary: '#C8102E', accent: '#102A49', venue: 'HOME', venueIcon: 'stadium', desc: 'Scan-to-open companion for the Krygier, driven live from the control room.', live: true, fans: 5.2, mods: ['timeline', 'chat', 'intel', 'predict', 'polls', 'rewards', 'food', 'photos', 'floor'], updated: 'Updated 12 min ago' },
  { id: 'PNL-4455', title: 'Krygier home matchday', club: 'PKO BP Ekstraklasa', abbr: 'POG', sport: 'pl', experience: 'IN-PERSON', primary: '#C8102E', accent: '#1B324F', venue: 'HOME', venueIcon: 'stadium', desc: 'The standing league template, reused for every home fixture, fixture data swapped in.', live: true, fans: 3.4, mods: ['timeline', 'chat', 'intel', 'predict', 'food', 'floor', 'rewards', 'shop'], updated: 'Updated 2 hours ago' },
  { id: 'PNL-4402', title: 'Away day · travelling support', club: 'PKO BP Ekstraklasa', abbr: 'POG', sport: 'pl', experience: 'STREAM', primary: '#1B324F', accent: '#C8102E', venue: 'AWAY', venueIcon: 'flight', desc: 'Second-screen panel for members watching on the road, chat, intel, reactions.', live: false, fans: 0, mods: ['chat', 'intel', 'timeline', 'reactions'], updated: 'Updated yesterday' },
  { id: 'PNL-4388', title: "Women's matchday · Twardowskiego", club: "Orlen Ekstraliga Kobiet", abbr: 'POG', sport: 'wsl', experience: 'IN-PERSON', primary: '#C8102E', accent: '#102A49', venue: 'HOME', venueIcon: 'stadium', desc: 'WSL panel with its own squad data, seat map and family-stand ordering.', live: false, fans: 0, mods: ['timeline', 'chat', 'predict', 'photos', 'floor', 'rewards'], updated: 'Updated 3 days ago' },
  { id: 'PNL-4351', title: 'Puchar Polski final · PGE Narodowy', club: 'Puchar Polski', abbr: 'POG', sport: 'facup', experience: 'IN-PERSON', primary: '#201C17', accent: '#C8102E', venue: 'NEUTRAL', venueIcon: 'place', desc: 'Neutral-venue variant: travel info, PGE Narodowy floor plan, no to-seat ordering.', live: false, fans: 0, mods: ['timeline', 'chat', 'intel', 'photos', 'floor'], updated: 'Updated last week' },
  { id: 'PNL-4310', title: 'Winter camp · Antalya', club: 'Pre-season tour', abbr: 'POG', sport: 'tour', experience: 'VOD', primary: '#C8102E', accent: '#C0473C', venue: 'TOUR', venueIcon: 'flight_takeoff', desc: 'On-demand panel for tour fixtures in Turkish time, replayed after the whistle.', live: false, fans: 0, mods: ['highlights', 'chat', 'polls', 'shop', 'rewards'], updated: 'Updated 2 weeks ago' },
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

export const PRIMARIES = ['#C8102E', '#1B324F', '#101214', '#FFC709'];
export const ACCENTS = ['#FFC709', '#C8102E', '#35C7DF', '#101214'];
export const PACKS = ['Stadium', 'Broadcast', 'Minimal'];

export const clone = <T,>(o: T): T => JSON.parse(JSON.stringify(o));
export const ring = (on: boolean) => getAdmDark()
  ? (on ? 'inset 0 0 0 2px #C8102E' : 'inset 0 0 0 1px rgba(149,175,207,.18)')
  : (on ? 'inset 0 0 0 2px #201C17' : 'inset 0 0 0 1px rgba(32,28,23,.12)');
