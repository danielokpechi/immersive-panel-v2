import type { EventConfig } from '../config';
// Sports samples (fictional events, brands and sponsors). Each was created in
// the Studio builder from the Sports template and exported from its Publish
// step, then given a readable id.
import KINRARA from './kinrara-12h.json';
import SKY_Q from './skyhawks-qualifiers.json';
import SKY_S from './skyhawks-semis.json';
import SKY_F from './skyhawks-final.json';

export const SPORTS: EventConfig[] = [KINRARA, SKY_Q, SKY_S, SKY_F] as unknown as EventConfig[];
