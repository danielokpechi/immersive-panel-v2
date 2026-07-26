import type { ModuleId } from './types';

export interface ModuleMeta {
  id: ModuleId;
  label: string;
  blurb: string;
}

/** The full module library. Admin picks which a panel uses; the fan surface
 *  renders whichever are in the active session's stack. */
export const MODULES: Record<ModuleId, ModuleMeta> = {
  chat: { id: 'chat', label: 'Fan Chat', blurb: 'The live matchday conversation.' },
  intel: { id: 'intel', label: 'Match Intel', blurb: 'IRIS insight — form, xG, win probability.' },
  rewards: { id: 'rewards', label: 'Rewards', blurb: 'XP, tiers and what they unlock.' },
  reactions: { id: 'reactions', label: 'Fan Reactions', blurb: 'Short fan reaction reels.' },
  predictions: { id: 'predictions', label: 'Predictions', blurb: 'Call the score, earn XP.' },
  polls: { id: 'polls', label: 'Polls & Quizzes', blurb: 'Vote and play along live.' },
  shop: { id: 'shop', label: 'Shop', blurb: 'Kits and matchday drops.' },
  food: { id: 'food', label: 'Order Food', blurb: 'Skip the queue at the ground.' },
  photos: { id: 'photos', label: 'Photo Pool', blurb: 'Fan photos from the stands.' },
  timeline: { id: 'timeline', label: 'Timeline', blurb: 'Every key moment, in order.' },
  floorplan: { id: 'floorplan', label: 'Floor Plan', blurb: 'Your seat and the way there.' },
  reads: { id: 'reads', label: 'Reads', blurb: 'Previews, tactics and interviews.' },
};

export const ALL_MODULES = Object.keys(MODULES) as ModuleId[];
