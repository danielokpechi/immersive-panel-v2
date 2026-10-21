import { PANELS } from '../../voltford/admin/data';

// Static export prerenders one page per seeded Voltford panel.
export const panelParams = () => PANELS.map((p) => ({ id: p.id.toLowerCase() }));
