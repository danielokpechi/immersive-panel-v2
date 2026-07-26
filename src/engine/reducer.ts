// ═══════════════════════════════════════════════════════════════════════
// The match reducer. ONE pure function turns a MatchEvent into new
// MatchState — used identically by auto-run (script fires events on a
// clock) and by the operator (fires events by hand). No ad-hoc simulation.
// ═══════════════════════════════════════════════════════════════════════

import type { ChatMessage, Match, MatchEvent, MatchState } from '../domain/types';

export function initialMatchState(): MatchState {
  return {
    phase: 'pre',
    live: false,
    clockSec: -1,
    minuteLabel: '—',
    score: { home: 0, away: 0 },
    events: [],
    scorers: [],
    chat: [],
    prompt: null,
    banner: null,
  };
}

/** Map match-seconds to a broadcast-style minute label. */
export function minuteLabel(sec: number, phase: MatchState['phase']): string {
  if (phase === 'pre') return '—';
  if (phase === 'break') return 'HT';
  if (phase === 'post') return 'FT';
  // compress the 300s auto timeline onto 90 minutes
  const min = Math.max(1, Math.min(90, Math.round((sec / 300) * 90)));
  return `${min}'`;
}

let cid = 0;
const chatId = () => `c_${cid++}`;
const initials = (name: string) =>
  name.replace(/[^A-Za-z ]/g, '').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'FN';

export function applyEvent(state: MatchState, ev: MatchEvent, _match?: Match): MatchState {
  const s: MatchState = { ...state, events: [...state.events, ev] };
  s.clockSec = Math.max(s.clockSec, ev.atSec);

  switch (ev.type) {
    case 'kickoff':
      s.phase = 'live';
      s.live = true;
      s.clockSec = Math.max(0, s.clockSec);
      s.banner = { type: 'kickoff', title: ev.title ?? 'Kick-off' };
      break;
    case 'goal': {
      if (ev.team === 'home') s.score = { ...s.score, home: s.score.home + 1 };
      else if (ev.team === 'away') s.score = { ...s.score, away: s.score.away + 1 };
      const scorer = String(ev.meta?.scorer ?? 'Scorer');
      s.scorers = [...s.scorers, { team: ev.team ?? 'home', name: scorer, minute: minuteLabel(ev.atSec, 'live') }];
      s.banner = { type: 'goal', title: ev.title ?? 'GOAL!', detail: ev.detail };
      break;
    }
    case 'var':
    case 'yellow':
    case 'red':
    case 'sub':
      s.banner = { type: ev.type, title: ev.title ?? ev.type, detail: ev.detail };
      break;
    case 'halftime':
      s.phase = 'break';
      s.live = false;
      s.banner = { type: 'halftime', title: ev.title ?? 'Half-time', detail: ev.detail };
      break;
    case 'second-half':
      s.phase = 'live';
      s.live = true;
      s.banner = { type: 'second-half', title: ev.title ?? 'Second half' };
      break;
    case 'fulltime':
      s.phase = 'post';
      s.live = false;
      s.banner = { type: 'fulltime', title: ev.title ?? 'Full-time', detail: ev.detail };
      break;
    case 'poll':
      s.prompt = { kind: 'poll', q: String(ev.meta?.q ?? 'Fan poll'), options: (ev.meta?.opts as string[]) ?? [] };
      break;
    case 'question':
      s.prompt = { kind: 'question', q: String(ev.meta?.q ?? 'Moderator question') };
      break;
    case 'motm':
      s.prompt = { kind: 'poll', q: 'Man of the Match?', options: (ev.meta?.opts as string[]) ?? ['—'] };
      break;
    case 'clear-prompt':
      s.prompt = null;
      break;
    case 'announce':
    case 'flash-sale':
    case 'reaction':
      s.banner = { type: ev.type, title: ev.title ?? '', detail: ev.detail };
      break;
    case 'chat': {
      const author = String(ev.meta?.author ?? 'Fan');
      const msg: ChatMessage = {
        id: chatId(),
        author,
        initials: initials(author),
        text: String(ev.meta?.text ?? ''),
        self: Boolean(ev.meta?.self),
        kind: (ev.meta?.kind as ChatMessage['kind']) ?? 'fan',
      };
      s.chat = [...state.chat, msg].slice(-60);
      s.events = state.events; // chat doesn't belong in the moment-feed
      break;
    }
  }
  s.minuteLabel = minuteLabel(s.clockSec, s.phase);
  return s;
}

/** Add an ambient chat line (used to keep the room alive between beats). */
export function pushChat(state: MatchState, author: string, text: string, self = false): MatchState {
  const msg: ChatMessage = { id: chatId(), author, initials: initials(author), text, self, kind: self ? 'fan' : 'fan' };
  return { ...state, chat: [...state.chat, msg].slice(-60) };
}
