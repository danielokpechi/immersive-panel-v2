import { PANELS } from '../admin/data';

// Static export prerenders one page per known panel. Panels created live in the
// Studio have no page of their own until they are added to the seed data.
export const panelParams = () => PANELS.map((p) => ({ id: p.id.toLowerCase() }));
