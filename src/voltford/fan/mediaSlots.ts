// Maps the fan view's image-slot ids to the Voltford media assets.
import { media, reelPhotos } from '../domain/media';

const MAP: Record<string, string> = {
  'last-meeting': media.crowdFlags,
  'ft-hero-photo': media.celebrationWide,
  'ft-reel': reelPhotos[1],
  'shop-hero': media.kitHome,
  'reel-1': reelPhotos[0],
  'reel-2': reelPhotos[1],
  'reel-3': reelPhotos[2],
  'read-1': media.formation,
  'read-2': media.tackle,
  'read-3': media.stadium,
  'read-4': media.celebrationWide,
  'read-1-hero': media.formation,
  'read-2-hero': media.tackle,
  'read-3-hero': media.stadium,
  'read-4-hero': media.celebrationWide,
  'profile-photo-1': reelPhotos[3],
  'profile-photo-2': media.meal,
  'profile-photo-3': reelPhotos[4],
  // Player posts dropped into a Crew thread.
  'pp-brink-tunnel': media.playerBrink,
  // Crew banners (Twitter-style header art) + the Crews intro backdrop.
  'crew-banner-msb': media.coach,
  'crew-banner-northtier': media.standsDusk,
  'crew-banner-academy': media.formation,
  'crew-banner-seasontix': media.membership,
  'crews-intro-bg': media.crowd,
};
const PHOTO_CYCLE = [reelPhotos[0], reelPhotos[1], reelPhotos[2], media.meal, media.meal2, media.meal3, reelPhotos[3], reelPhotos[4], media.tackle];
// Player-post images use Voltford shots (operator posts carry a `pp-<ts>` id).
const PLAYER_CYCLE = [media.tackle, media.celebration, media.stadium, media.celebrationWide, media.formation];

export function mediaFor(id: string): string | undefined {
  if (MAP[id]) return MAP[id];
  const m = /^photo-(\d+)$/.exec(id);
  if (m) return PHOTO_CYCLE[Number(m[1]) % PHOTO_CYCLE.length];
  if (id.startsWith('pp-')) return PLAYER_CYCLE[Math.abs(hash(id)) % PLAYER_CYCLE.length];
  return undefined;
}
function hash(s: string): number { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
