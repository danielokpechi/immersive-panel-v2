// Central map of the Voltford Athletic media assets (public/voltford/media).
// Referenced everywhere so a rebrand only swaps this one file. Every image is
// fictional: the BoltOS Gemini set from the Connect demo, plus generated player
// portraits and matchday food, and a hand-drawn line-up board.
import { BASE } from '../../base';

const m = `${BASE}voltford/media/`; // respects next.config basePath

export const media = {
  clubBadge: `${m}crest.png`,
  rivalBadge: `${m}rival-crest.png`,
  formation: `${m}formation.svg`,
  kitHome: `${m}shirt-home.jpg`,
  tackle: `${m}tackle.jpg`,
  celebration: `${m}celebration.jpg`,
  celebrationWide: `${m}celebration-wide.jpg`,
  crowdFlags: `${m}crowd-flags.jpg`,
  stadium: `${m}stadium.jpg`,
  standsDusk: `${m}stands-dusk.jpg`,
  coach: `${m}coach.jpg`,
  membership: `${m}membership.jpg`,
  meal: `${m}food-burgers.jpg`,
  meal2: `${m}food-pie.jpg`,
  meal3: `${m}food-hotdog.jpg`,
  reel1: `${m}reel-1.jpg`,
  reel2: `${m}reel-2.jpg`,
  reel3: `${m}reel-3.jpg`,
  reel4: `${m}reel-4.jpg`,
  reel5: `${m}reel-5.jpg`,
  // Crews layer imagery.
  crowd: `${m}crowd-flags.jpg`,
  avMarcus: `${m}crews/av-marcus.jpg`,
  avPriya: `${m}crews/av-priya.jpg`,
  avDeclan: `${m}crews/av-declan.jpg`,
  avHannah: `${m}crews/av-hannah.jpg`,
  avR1: `${m}crews/av-r1.jpg`,
  avR2: `${m}crews/av-r2.jpg`,
  avR3: `${m}crews/av-r3.jpg`,
  playerBrink: `${m}crews/player-brink.jpg`,
  playerMarsh: `${m}crews/player-marsh.jpg`,
  playerAdebayo: `${m}crews/player-adebayo.jpg`,
  playerHaddad: `${m}crews/player-haddad.jpg`,
  roomBrink: `${m}crews/player-brink.jpg`,
} as const;

export const reelPhotos = [media.reel1, media.reel2, media.reel3, media.reel4, media.reel5];
