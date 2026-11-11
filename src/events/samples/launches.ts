import type { EventConfig } from '../config';
// Halo Lumen X1 (fictional brand and phone). Made entirely in the Studio
// builder on the live site, exported from its Publish step; its uploaded
// images were moved into public/connect-events/halo/.
import HALO from './halo-lumen-x1.json';

export const LAUNCHES: EventConfig[] = [HALO as unknown as EventConfig];
