# Immersive Panel — v2 (Matchday Companion)

A deployable matchday fan experience + club-side operator studio, built for
Manchester City (flagship fixture: City v Real Madrid, Champions League semi).

- **Fan panel** (`/p/:id`) — a mobile web companion across pre-match / live /
  half-time / full-time: score bug, live timeline, single fan chat, match
  intel (IRIS), predictions, polls, store, food, photo pool, reactions, reads,
  seat plan, profile. Light + dark. It auto-runs a matchday and follows an
  operator over a realtime channel.
- **Panel Studio** (`/studio`) — dashboard, create wizard, panel builder,
  stats, and a live **Control Room** that drives the real fan client.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static build → dist/
```

## Notes

Realistic seeded data (no live backend yet) — a live score feed, real chat and
auth plug in behind clean seams (`src/realtime`, `src/domain/seed.ts`). Club
crests are trademarks of their respective clubs, used here for a prototype.

Built with Vite + React + TypeScript.
