// Operator → fan bus that works across devices, so a fan who scans the QR on
// their own phone follows the operator console live.
//
// Three transports, all carrying the same small command objects
// ({ cmd: 'state', ms: 'live' }, { cmd: 'event', kind: 'goal' } …):
//   1. BroadcastChannel: same browser (the console's embedded monitor). Instant.
//   2. Same-origin relay (/relay/*): served by server/relay-server.mjs when the
//      site runs from the Docker image (impv2.boltos.ai). Preferred.
//   3. ntfy.sh: public pub/sub fallback when there's no relay (GitHub Pages,
//      `next dev`). Topics are unguessable but public; only demo commands go
//      through it, never fan data.
// Every message carries a `mid` so a receiver that hears it twice (channel +
// network) applies it once. A late joiner gets the last `state` replayed, so a
// phone that scans mid-demo lands in the current match state.
import { BASE } from '../base';

export type BusMsg = { cmd: string; [k: string]: unknown };
type Status = 'connecting' | 'live' | 'down';

const NTFY = 'https://ntfy.sh/';
const topicFor = (id: string) => `boltos-pogon-k7q2x9-${id.toLowerCase()}`;

let relayProbe: Promise<boolean> | null = null;
function hasRelay(): Promise<boolean> {
  if (!relayProbe) {
    relayProbe = fetch(`${BASE}relay/health`, { cache: 'no-store' })
      .then(async (r) => r.ok && (await r.text()).trim() === 'ok')
      .catch(() => false);
  }
  return relayProbe;
}

const newMid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export function openBus(id: string, onMsg: (m: BusMsg) => void, onStatus?: (s: Status) => void) {
  const topic = topicFor(id);
  const seen = new Set<string>();
  let closed = false;
  let es: EventSource | null = null;

  const deliver = (raw: unknown) => {
    if (!raw || typeof raw !== 'object') return;
    const m = raw as BusMsg & { mid?: string };
    if (typeof m.cmd !== 'string') return;
    if (m.mid) {
      if (seen.has(m.mid)) return;
      seen.add(m.mid);
      if (seen.size > 500) seen.clear();
    }
    onMsg(m);
  };
  const parse = (s: string) => { try { return JSON.parse(s); } catch { return null; } };

  // 1. same-browser channel
  const ch = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('pogon-panel:' + id.toLowerCase()) : null;
  if (ch) ch.onmessage = (e) => deliver(e.data);

  // 2/3. network
  onStatus?.('connecting');
  const ready = hasRelay();

  // Replay the latest state for a device that joins (or wakes) mid-demo.
  const catchUp = async () => {
    try {
      if (await ready) {
        const r = await fetch(`${BASE}relay/last/${topic}`, { cache: 'no-store' });
        if (r.ok) deliver(parse(await r.text()));
        return;
      }
      const r = await fetch(`${NTFY}${topic}/json?poll=1&since=3h`, { cache: 'no-store' });
      if (!r.ok) return;
      const lines = (await r.text()).trim().split('\n').map(parse).filter(Boolean);
      const states = lines.map((l: { message?: string }) => parse(l.message || '')).filter((m: BusMsg | null) => m && m.cmd === 'state');
      if (states.length) deliver(states[states.length - 1]);
    } catch { /* offline: the live stream will catch the next command */ }
  };

  ready.then((relay) => {
    if (closed || typeof EventSource === 'undefined') return;
    const url = relay ? `${BASE}relay/sub/${topic}` : `${NTFY}${topic}/sse`;
    es = new EventSource(url);
    es.onopen = () => onStatus?.('live');
    es.onerror = () => onStatus?.(es && es.readyState === EventSource.CLOSED ? 'down' : 'connecting');
    es.onmessage = (e) => {
      const d = parse(e.data);
      if (!d) return;
      // ntfy wraps the payload in an envelope; the own relay sends it bare.
      if (typeof d.message === 'string' && d.event === 'message') deliver(parse(d.message));
      else deliver(d);
    };
    if (!relay) catchUp(); // own relay replays the last state on connect itself
  });

  const onVisible = () => { if (document.visibilityState === 'visible') catchUp(); };
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisible);

  return {
    post(msg: BusMsg) {
      const m = { ...msg, mid: newMid() };
      seen.add(m.mid); // never re-apply our own message if it echoes back
      ch?.postMessage(m);
      ready.then((relay) => {
        const body = JSON.stringify(m);
        const url = relay ? `${BASE}relay/pub/${topic}` : `${NTFY}${topic}`;
        fetch(url, { method: 'POST', body, keepalive: true }).then(
          (r) => onStatus?.(r.ok ? 'live' : 'down'),
          () => onStatus?.('down'),
        );
      });
    },
    close() {
      closed = true;
      ch?.close();
      es?.close();
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisible);
    },
  };
}
