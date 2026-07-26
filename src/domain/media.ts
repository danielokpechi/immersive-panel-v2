// Central map of the reused media (slugified from the V1 image folder).
// Referenced everywhere so a rebrand only swaps this one file.
const base = import.meta.env.BASE_URL; // respects vite `base`

export const media = {
  cityCrest: `${base}media/man-city-transparent.png`,
  cityBadge: `${base}media/mancity-badge.svg`,
  madridBadge: `${base}media/realmadrid-badge.svg`,
  etihad: `${base}media/ethihad.png`,
  floorPlan: `${base}media/floor-plan.png`,
  formation: `${base}media/formation.jpeg`,
  kitHome: `${base}media/kit.jpeg`,
  kitAway: `${base}media/away.jpeg`,
  kitTraining: `${base}media/training-kit.jpeg`,
  kitTraining2: `${base}media/training-2.jpeg`,
  haaland: `${base}media/erling-haaland-manchester-city-ftbol-wallpaper-by-livtorresec.jpeg`,
  cherki: `${base}media/rayan-cherki-manchester-city-2026.jpeg`,
  posterUCL: `${base}media/poster-matchday-champions-league.jpeg`,
  vsPoster: `${base}media/manchester-city-vs-real-madrid.jpeg`,
  vsDesign: `${base}media/real-madrid-vs-man-city-matchday-design.jpeg`,
  meal: `${base}media/meal.jpeg`,
  meal2: `${base}media/meal-2.jpeg`,
  meal3: `${base}media/meal-3.jpeg`,
  revolut: `${base}media/revolut.png`,
  reel1: `${base}media/100557004175719940.jpeg`,
  reel2: `${base}media/156148312077197062.jpeg`,
  reel3: `${base}media/223068987790622209.jpeg`,
  reel4: `${base}media/237213105371834932.jpeg`,
  reel5: `${base}media/25614291625815684.jpeg`,
} as const;

export const reelPhotos = [media.reel1, media.reel2, media.reel3, media.reel4, media.reel5];
