// Scripted autoplay timeline for the fan panel marketing embed (?autoplay=1).
//
// The panel stays pinned to LIVE (first half) — it never cycles match states.
// Instead it loops through the things a real supporter does on matchday:
// conversation, Ask IRIS, buying from the City store, and ordering food.
// Each step runs a named action, then waits `next` ms; the sequence loops.
// The panel's ambient chat keeps streaming underneath the whole time.
import type { AutoStep } from './useAutoplay';

// A fan calmly moving through the panel: open a section, do something, tap Back
// to the hub, open the next one. No teleporting — every move uses the real
// nav (so the Back button appears) and the cursor taps it.
export const FAN_TIMELINE: AutoStep[] = [
  { run: (a) => a('home'),     next: 3200 }, // land on the matchday hub
  { run: (a) => a('tour'),     next: 21500 }, // slowly browse the whole panel top-to-bottom, then back up
  { run: (a) => a('chat'),     next: 6600 }, // tap into Fan Chat, read the room
  { run: (a) => a('post'),     next: 5400 }, // send a text
  { run: (a) => a('post'),     next: 5400 }, // and another
  { run: (a) => a('post'),     next: 6000 }, // and one more
  { run: (a) => a('iris'),     next: 8600 }, // ask IRIS, read the answer
  { run: (a) => a('back'),     next: 4600 }, // tap Back to the hub
  { run: (a) => a('shopOpen'), next: 5200 }, // tap into the City store
  { run: (a) => a('shopAdd'),  next: 5200 }, // add a shirt to the basket
  { run: (a) => a('shopBuy'),  next: 6800 }, // check out
  { run: (a) => a('back'),     next: 4600 }, // Back to the hub
  { run: (a) => a('foodOpen'), next: 5200 }, // tap into Order Food
  { run: (a) => a('foodAdd'),  next: 5000 }, // pick food to the seat
  { run: (a) => a('foodBuy'),  next: 7000 }, // send the order
  { run: (a) => a('back'),     next: 4000 }, // Back to the hub, loop
];

export const AUTOPLAY_IDLE_RESUME_MS = 15000;
