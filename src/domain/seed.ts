// ═══════════════════════════════════════════════════════════════════════
// Seed content — the flagship Man City vs Real Madrid panel, its matchday
// SCRIPT (the timeline that plays itself out in auto-run), and a chat pool.
// This is realistic sample data with clean seams: swap `defaultMatch` /
// `matchdayScript` for a real live feed and nothing downstream changes.
// ═══════════════════════════════════════════════════════════════════════

import { media } from './media';
import type { ChatMessage, Match, MatchdayScript, MatchEvent, PanelConfig } from './types';

export const defaultMatch: Match = {
  home: { name: 'Manchester City', short: 'MCI', crest: media.cityCrest, color: '#6CABDD', kit: '#6CABDD' },
  away: { name: 'Real Madrid', short: 'RMA', color: '#1a1a1a', kit: '#e9e9e9' },
  competition: 'Champions League',
  venue: 'Etihad Stadium',
  kickoffISO: new Date(Date.now() + 2 * 3600_000).toISOString(),
};

let n = 0;
const e = (
  atSec: number,
  type: MatchEvent['type'],
  extra: Partial<MatchEvent> = {},
): MatchEvent => ({ id: `ev_${n++}`, atSec, type, ...extra });

// A compressed 90' matchday on a ~5-minute auto-run timeline (durationSec).
// atSec is match-seconds-from-kickoff; the engine maps them onto the clock.
export const matchdayScript: MatchdayScript = {
  id: 'mcfc-rma-ucl',
  durationSec: 300, // auto-run plays the whole match in ~5 minutes
  events: [
    e(-30, 'chat', { meta: { author: 'CityFan_Mk', text: 'Buzzing for this one. Title on the line 🔵' } }),
    e(-18, 'chat', { meta: { author: 'NorthEndBlue', text: 'Predicting a Haaland brace. Who’s with me?' } }),
    e(0, 'kickoff', { title: 'Kick-off', detail: 'We are under way at the Etihad.' }),
    e(6, 'chat', { meta: { author: 'SkyBlueKev', text: 'Rodri running this midfield already 🎯' } }),
    e(31, 'var', { team: 'away', title: 'VAR Check', detail: 'Handball review in the box.', meta: { verdict: 'No penalty' } }),
    e(44, 'yellow', { team: 'away', title: 'Yellow card', detail: 'T. Partey — cynical foul on Foden.' }),
    e(54, 'goal', { team: 'home', title: 'GOAL — Man City', detail: 'Haaland taps in, Foden the assist.', meta: { scorer: 'Haaland', assist: 'Foden' } }),
    e(56, 'chat', { meta: { author: 'CityFan_Mk', text: 'YESSSS!!!! GET IN 🔵🔵🔵' } }),
    e(58, 'reaction', { title: 'Featured reaction', detail: 'A fan reel goes live.' }),
    e(90, 'poll', { title: 'Fan poll', meta: { q: 'Who’s been City’s standout?', opts: ['Haaland', 'Rodri', 'Foden'] } }),
    e(115, 'halftime', { title: 'Half-time', detail: 'City lead 1–0 at the break.' }),
    e(130, 'clear-prompt' as MatchEvent['type']),
    e(140, 'second-half', { title: 'Second half', detail: 'Back under way.' }),
    e(162, 'sub', { team: 'home', title: 'Substitution', detail: 'B. Silva on, Kovačić off.' }),
    e(175, 'question', { title: 'Moderator asks', meta: { q: 'Quiet spell — your score prediction for full time? 👀' } }),
    e(210, 'motm', { title: 'Man of the Match', detail: 'Vote for today’s standout.', meta: { opts: ['Haaland', 'Rodri', 'Foden'] } }),
    e(260, 'flash-sale', { title: 'Flash drop', detail: '20% off the Haaland shirt — next 10 minutes.' }),
    e(300, 'fulltime', { title: 'Full-time', detail: 'Manchester City 1–0 Real Madrid.' }),
  ],
};

// Ambient chat that keeps the room feeling alive between scripted beats.
export const chatPool: Omit<ChatMessage, 'id'>[] = [
  { author: 'BlueMoonRising', initials: 'BM', text: 'Real just sitting back, waiting to counter.' },
  { author: 'MikeNorthEnd', initials: 'MN', text: 'Rodri is an absolute metronome today 🎯' },
  { author: 'SkyBlueKev', initials: 'SK', text: 'Foden’s been everywhere this half.' },
  { author: 'CityZoneSam', initials: 'CS', text: 'Haaland is UNPLAYABLE when he’s like this.' },
  { author: 'EastyBlue', initials: 'EB', text: 'Manage the game now, keep the ball.' },
  { author: 'KDBisKing', initials: 'KK', text: 'Tempo’s perfect. Don’t give them a sniff.' },
];

export function defaultPanel(): PanelConfig {
  return {
    id: 'mcfc-flagship',
    name: 'Man City · Matchday',
    description: 'The flagship Champions League matchday companion.',
    status: 'live',
    branding: { primary: '#6CABDD', accent: '#B0842B', crest: media.cityCrest },
    match: defaultMatch,
    modules: ['chat', 'intel', 'rewards', 'reactions', 'predictions', 'polls', 'shop', 'reads', 'timeline'],
    sessions: [
      { id: 'pre', label: 'Pre-match', phase: 'pre', modules: ['intel', 'chat', 'rewards', 'reads'] },
      { id: 'live', label: 'Live', phase: 'live', modules: ['intel', 'chat', 'reactions', 'timeline', 'shop'] },
      { id: 'half', label: 'Half-time', phase: 'break', modules: ['chat', 'polls', 'shop', 'photos'] },
      { id: 'full', label: 'Full-time', phase: 'post', modules: ['timeline', 'chat', 'reactions', 'shop'] },
    ],
    defaultSessionId: 'pre',
    scriptId: matchdayScript.id,
    updatedAt: Date.now(),
  };
}

export const SCRIPTS: Record<string, MatchdayScript> = {
  [matchdayScript.id]: matchdayScript,
};
