import { PANELS } from '../../voltford/admin/data';

// Static export prerenders one page per seeded Voltford panel, plus the ids the
// Studio hands out to new panels (PNL-4500 up), so those don't 404 into City.
const NEW_IDS = Array.from({ length: 40 }, (_, i) => `pnl-${4500 + i}`);

export const panelParams = () => [...PANELS.map((p) => ({ id: p.id.toLowerCase() })), ...NEW_IDS.map((id) => ({ id }))];
