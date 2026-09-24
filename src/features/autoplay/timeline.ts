// Scripted autoplay timeline for the marketing embed (?autoplay=1).
//
// Each step runs an action, then waits `next` ms before the following step;
// the sequence loops. Steps only ever call the panel's EXISTING operator
// dispatch (applyState / applyEventCmd) — this module never mutates panel
// state directly, and nothing here is imported unless ?autoplay=1 is active.
//
// Shape: pre-match 6s -> live 15s (GOAL @3s, VAR @8s, SUB @12s) -> HT 8s -> FT 6s -> loop.
// Note: the panel's applyState('live') itself fires the kickoff goal as it goes
// live (existing behaviour), so the live block shows that entry goal plus the
// scripted GOAL at +3s.

export type AutoplayDispatch = {
  state: (ms: 'pre' | 'live' | 'ht' | 'ft') => void;
  event: (kind: 'goal' | 'var' | 'sub') => void;
};

export type AutoplayStep = { run: (d: AutoplayDispatch) => void; next: number };

export const AUTOPLAY_TIMELINE: AutoplayStep[] = [
  { run: (d) => d.state('pre'), next: 6000 },   // 0s   · pre-match, 6s
  { run: (d) => d.state('live'), next: 3000 },  // 6s   · go live (kickoff goal)
  { run: (d) => d.event('goal'), next: 5000 },  // 9s   · GOAL  (live +3s)
  { run: (d) => d.event('var'), next: 4000 },   // 14s  · VAR   (live +8s)
  { run: (d) => d.event('sub'), next: 3000 },   // 18s  · SUB   (live +12s, block = 15s)
  { run: (d) => d.state('ht'), next: 8000 },    // 21s  · half-time, 8s
  { run: (d) => d.state('ft'), next: 6000 },    // 29s  · full-time, 6s -> loop at 35s
];

export const AUTOPLAY_IDLE_RESUME_MS = 15000;
