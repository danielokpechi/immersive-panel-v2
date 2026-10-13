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
npm run dev        # http://localhost:3000
npm run build      # static export → out/ (BASE_PATH=/sub/path for GitHub Pages)
```

## Deploy with Docker

The app is a static export, served by a small Node `serve` container (no nginx).
Put your own reverse proxy in front of it.

```bash
docker compose up -d --build   # builds and serves on http://localhost:7778
docker compose logs -f         # follow logs
docker compose down            # stop
```

Proxy your domain to `127.0.0.1:7778`. To bind only to the host, change the
port mapping in `docker-compose.yml` to `"127.0.0.1:7778:7778"`. The app is
served from the root path; set `BASE_PATH` at build time for a sub-path.

## Notes

Realistic seeded data (no live backend yet) — a live score feed, real chat and
auth plug in behind clean seams (`src/realtime`, `src/domain/seed.ts`). Club
crests are trademarks of their respective clubs, used here for a prototype.

Built with Next.js (App Router, static export) + TypeScript. Routes live in `src/app/`.
