// ═══════════════════════════════════════════════════════════════════════
// V2 domain model. The "core" carried over from V1, made real: a panel is
// configured in the studio, driven through ordered SESSIONS, and rendered
// on fans' phones. A MATCH + a MATCHDAY SCRIPT let the whole thing run
// itself on a timeline (auto-run) or be driven live by an operator — the
// same event reducer powers both, so nothing is "simulated" ad-hoc.
// ═══════════════════════════════════════════════════════════════════════

/** Fan-facing feature blocks a panel can show. */
export type ModuleId =
  | 'chat'
  | 'intel' // IRIS match intel (insight cards, not a chatbot)
  | 'rewards' // XP / tiers / quests
  | 'reactions' // fan video-reaction reels
  | 'predictions'
  | 'polls'
  | 'shop'
  | 'food'
  | 'photos'
  | 'timeline'
  | 'floorplan'
  | 'reads';

export type Phase = 'idle' | 'pre' | 'live' | 'break' | 'post';

/** An operator-authored session: an ordered state with its own module stack. */
export interface Session {
  id: string;
  label: string;
  phase: Phase;
  modules: ModuleId[];
}

export interface Team {
  name: string;
  short: string; // 3-letter, e.g. MCI
  crest?: string; // asset URL; falls back to the short badge
  color: string; // primary kit colour
  kit?: string; // kit swatch colour (defaults to color)
}

export interface Branding {
  primary: string;
  accent: string;
  crest?: string;
}

export interface Match {
  home: Team;
  away: Team;
  competition: string;
  venue: string;
  kickoffISO: string; // scheduled kickoff
}

/** A panel = one deployable fan experience. */
export interface PanelConfig {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'live';
  branding: Branding;
  match: Match;
  modules: ModuleId[]; // the library: what this panel may use at all
  sessions: Session[]; // ordered flow the fan moves through
  defaultSessionId: string;
  scriptId: string; // which matchday timeline drives auto-run
  updatedAt: number;
}

// ── live match events (fired by the script in auto-run, or by the operator) ──
export type MatchEventType =
  | 'kickoff'
  | 'goal'
  | 'var'
  | 'sub'
  | 'yellow'
  | 'red'
  | 'halftime'
  | 'second-half'
  | 'fulltime'
  | 'motm'
  | 'poll'
  | 'question'
  | 'clear-prompt'
  | 'announce'
  | 'flash-sale'
  | 'reaction'
  | 'chat'; // a fan/mod chat message arriving

export interface MatchEvent {
  id: string;
  type: MatchEventType;
  /** seconds from kickoff; negative = pre-match. Used by the auto-run clock. */
  atSec: number;
  team?: 'home' | 'away';
  title?: string;
  detail?: string;
  meta?: Record<string, unknown>;
}

/** The timeline that lets a match play itself out. */
export interface MatchdayScript {
  id: string;
  durationSec: number; // full 90' compressed timeline length
  events: MatchEvent[];
}

// ── derived live state the fan surface renders ──
export interface ChatMessage {
  id: string;
  author: string;
  initials: string;
  text: string;
  self?: boolean;
  kind?: 'fan' | 'mod' | 'system';
}

export interface Prompt {
  kind: 'poll' | 'question';
  q: string;
  options?: string[];
  votes?: number[];
}

export interface MatchState {
  phase: Phase;
  live: boolean;
  clockSec: number; // seconds from kickoff (can be negative pre-match)
  minuteLabel: string; // "67'", "HT", "FT", "—"
  score: { home: number; away: number };
  events: MatchEvent[]; // accumulated feed, newest last
  scorers: { team: 'home' | 'away'; name: string; minute: string }[];
  chat: ChatMessage[];
  prompt: Prompt | null;
  banner: { type: string; title: string; detail?: string } | null;
}

/** Run mode: the link auto-plays, or an operator drives it. */
export type RunMode = 'auto' | 'operator';
