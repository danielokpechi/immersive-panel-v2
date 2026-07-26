// Panel persistence. localStorage today (seam for a real DB later — swap the
// four functions). Seeds the flagship panel on first run so the studio and a
// shareable fan link work immediately.

import type { PanelConfig } from '../domain/types';
import { defaultPanel } from '../domain/seed';

const KEY = 'ipv2.panels';

function read(): PanelConfig[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as PanelConfig[];
  } catch {
    /* ignore */
  }
  const seeded = [defaultPanel()];
  write(seeded);
  return seeded;
}

function write(panels: PanelConfig[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(panels));
  } catch {
    /* ignore */
  }
}

export function loadPanels(): PanelConfig[] {
  return read();
}

export function getPanel(id: string): PanelConfig | undefined {
  return read().find((p) => p.id === id);
}

export function upsertPanel(panel: PanelConfig): PanelConfig[] {
  const panels = read();
  const i = panels.findIndex((p) => p.id === panel.id);
  const next = { ...panel, updatedAt: Date.now() };
  if (i >= 0) panels[i] = next;
  else panels.unshift(next);
  write(panels);
  return panels;
}

export function deletePanel(id: string): PanelConfig[] {
  const panels = read().filter((p) => p.id !== id);
  write(panels);
  return panels;
}

export function resetPanels(): PanelConfig[] {
  const seeded = [defaultPanel()];
  write(seeded);
  return seeded;
}
