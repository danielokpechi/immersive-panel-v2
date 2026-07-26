// Maps the v4 design's <image-slot> drop-target ids to the real reused City
// media, so the fan view is board-ready (the handoff ships empty drop targets
// because crests/photos are rights-protected — we fill them with our assets).
import { media, reelPhotos } from '../domain/media';

const MAP: Record<string, string> = {
  'last-meeting': media.vsPoster,
  'ft-hero-photo': media.posterUCL,
  'ft-reel': reelPhotos[1],
  'shop-hero': media.kitHome,
  'reel-1': reelPhotos[0],
  'reel-2': reelPhotos[1],
  'reel-3': reelPhotos[2],
  'read-1': media.formation,
  'read-2': media.haaland,
  'read-3': media.vsPoster,
  'read-4': media.posterUCL,
  'read-1-hero': media.formation,
  'read-2-hero': media.haaland,
  'read-3-hero': media.vsPoster,
  'read-4-hero': media.posterUCL,
  'profile-photo-1': reelPhotos[3],
  'profile-photo-2': media.meal,
  'profile-photo-3': reelPhotos[4],
};
const PHOTO_CYCLE = [reelPhotos[0], reelPhotos[1], reelPhotos[2], media.meal, media.meal2, media.meal3, reelPhotos[3], reelPhotos[4], media.haaland];

export function mediaFor(id: string): string | undefined {
  if (MAP[id]) return MAP[id];
  const m = /^photo-(\d+)$/.exec(id);
  if (m) return PHOTO_CYCLE[Number(m[1]) % PHOTO_CYCLE.length];
  return undefined;
}
