// ═══════════════════════════════════════════════════════════════════════
// RealtimeBus — how the operator's console reaches fan devices (and the
// live monitor). Ships a BroadcastChannel provider (same browser / demo).
// The interface is the seam: drop in an Ably/Supabase/Pusher provider for
// true cross-device without touching any caller. Falls back to a no-op
// where BroadcastChannel is unavailable.
// ═══════════════════════════════════════════════════════════════════════

import type { MatchState } from '../domain/types';

export type BusMessage =
  | { type: 'state'; state: MatchState }
  | { type: 'requestState' }
  | { type: 'hello' };

export interface RealtimeBus {
  send(msg: BusMessage): void;
  subscribe(fn: (msg: BusMessage) => void): () => void;
  dispose(): void;
}

class BroadcastBus implements RealtimeBus {
  private ch: BroadcastChannel | null;
  private fns = new Set<(m: BusMessage) => void>();

  constructor(panelId: string) {
    this.ch = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(`panel:${panelId}`) : null;
    if (this.ch) this.ch.onmessage = (e) => this.fns.forEach((f) => f(e.data as BusMessage));
  }
  send(msg: BusMessage) {
    this.ch?.postMessage(msg);
  }
  subscribe(fn: (m: BusMessage) => void) {
    this.fns.add(fn);
    return () => this.fns.delete(fn);
  }
  dispose() {
    this.ch?.close();
    this.ch = null;
    this.fns.clear();
  }
}

export function createBus(panelId: string): RealtimeBus {
  return new BroadcastBus(panelId);
}
