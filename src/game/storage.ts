import { PlayerProgress } from './types.ts';

const STORAGE_KEY = 'sky_ball_3d_player_data';

const DEFAULT_PROGRESS: PlayerProgress = {
  coins: 50, // Starting gift coins for quick first shop interaction
  unlockedLevel: 1,
  levelStars: {},
  bestTimes: {},
  ownedSkins: ['marble_classic'],
  activeSkinId: 'marble_classic',
  isMuted: false,
  adFreePurchased: false,
  hasShownInterstitialCount: 0,
};

export function loadProgress(): PlayerProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      levelStars: parsed.levelStars || {},
      bestTimes: parsed.bestTimes || {},
      ownedSkins: parsed.ownedSkins?.length ? parsed.ownedSkins : ['marble_classic'],
    };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function saveProgress(progress: PlayerProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Graceful fallback if storage disabled
  }
}

export function recordLevelCompletion(
  levelId: number,
  timeSec: number,
  stars: number,
  coinsEarned: number
): { progress: PlayerProgress; isNewBest: boolean; starsImproved: boolean } {
  const current = loadProgress();
  const prevBest = current.bestTimes[levelId];
  const isNewBest = prevBest === undefined || timeSec < prevBest;
  const prevStars = current.levelStars[levelId] || 0;
  const starsImproved = stars > prevStars;

  const nextBestTimes = {
    ...current.bestTimes,
    [levelId]: isNewBest ? timeSec : prevBest,
  };

  const nextStars = {
    ...current.levelStars,
    [levelId]: Math.max(prevStars, stars),
  };

  const nextUnlocked = Math.min(5, Math.max(current.unlockedLevel, levelId + 1));

  const updated: PlayerProgress = {
    ...current,
    coins: current.coins + coinsEarned,
    unlockedLevel: nextUnlocked,
    levelStars: nextStars,
    bestTimes: nextBestTimes,
  };

  saveProgress(updated);
  return { progress: updated, isNewBest, starsImproved };
}

export function unlockSkin(skinId: string, price: number): { success: boolean; progress: PlayerProgress } {
  const current = loadProgress();
  if (current.ownedSkins.includes(skinId)) {
    return { success: true, progress: current };
  }
  if (current.coins < price) {
    return { success: false, progress: current };
  }

  const updated: PlayerProgress = {
    ...current,
    coins: current.coins - price,
    ownedSkins: [...current.ownedSkins, skinId],
    activeSkinId: skinId,
  };

  saveProgress(updated);
  return { success: true, progress: updated };
}

export function setActiveSkin(skinId: string): PlayerProgress {
  const current = loadProgress();
  if (!current.ownedSkins.includes(skinId)) {
    return current;
  }
  const updated: PlayerProgress = {
    ...current,
    activeSkinId: skinId,
  };
  saveProgress(updated);
  return updated;
}
