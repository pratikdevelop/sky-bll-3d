import React, { useState } from 'react';
import { Star, Play, RotateCcw, Grid, Sparkles, Tv } from 'lucide-react';
import { LevelData } from '../game/types.ts';
import { sounds } from '../game/audio.ts';
import { monetization } from '../game/monetization.ts';

interface VictoryModalProps {
  level: LevelData;
  timeSec: number;
  stars: number;
  coinsEarned: number;
  timeBonus: number;
  gemsCollected: number;
  totalGems: number;
  isNewBest: boolean;
  onNextLevel: () => void;
  onRetry: () => void;
  onOpenLevelSelect: () => void;
  onBonusCoinsAwarded: (extraCoins: number) => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  level,
  timeSec,
  stars,
  coinsEarned,
  timeBonus,
  gemsCollected,
  totalGems,
  isNewBest,
  onNextLevel,
  onRetry,
  onOpenLevelSelect,
  onBonusCoinsAwarded,
}) => {
  const [adWatched, setAdWatched] = useState(false);
  const [isAdLoading, setIsAdLoading] = useState(false);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const handleDoubleCoinsAd = () => {
    sounds.playButtonClick();
    setIsAdLoading(true);
    monetization.requestRewardedAd('double_coins', (granted) => {
      setIsAdLoading(false);
      if (granted) {
        setAdWatched(true);
        sounds.playGem();
        onBonusCoinsAwarded(coinsEarned);
      }
    });
  };

  const hasNextLevel = level.id < 5;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/75 select-none animate-fadeIn">
      <div className="w-full max-w-sm bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 shadow-2xl flex flex-col items-center space-y-5 text-center">
        {/* Header Banner */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-950/80 border border-cyan-500/40 rounded-full text-[10px] font-mono tracking-widest text-cyan-300 font-bold uppercase">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            LEVEL COMPLETED!
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">{level.title}</h2>
        </div>

        {/* 3 Stars Rating Display */}
        <div className="flex items-center justify-center gap-3 py-1">
          {[1, 2, 3].map((starIdx) => {
            const isEarned = starIdx <= stars;
            return (
              <div
                key={starIdx}
                className={`transition-all duration-500 transform ${
                  isEarned ? 'scale-110 text-amber-400' : 'scale-90 text-slate-700'
                }`}
              >
                <Star
                  className={`w-10 h-10 ${
                    isEarned
                      ? 'fill-amber-400 stroke-amber-500 filter drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]'
                      : 'stroke-slate-700'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Stat Breakdown Grid */}
        <div className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5 space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between text-slate-300">
            <span>TIME</span>
            <span className="font-bold text-white tabular-nums">
              {formatTime(timeSec)}
              {isNewBest && <span className="text-[10px] text-emerald-400 ml-1.5 font-bold">NEW BEST!</span>}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span>PAR TIME (3-STAR)</span>
            <span className="text-slate-400 tabular-nums">{formatTime(level.parTime)}</span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span>GEMS COLLECTED</span>
            <span className="font-bold text-cyan-300 tabular-nums">
              {gemsCollected} / {totalGems}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-300 pt-1.5 border-t border-slate-700">
            <span>COINS EARNED</span>
            <span className="font-bold text-amber-400 text-sm tabular-nums">
              +{coinsEarned} {adWatched && <span className="text-emerald-400 font-extrabold">(x2 BONUS!)</span>}
            </span>
          </div>
        </div>

        {/* Monetization: Double Coins Rewarded Ad Option */}
        {!adWatched && (
          <button
            onClick={handleDoubleCoinsAd}
            disabled={isAdLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/50 text-amber-300 hover:text-amber-200 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Tv className="w-4 h-4 text-amber-400" />
            <span>{isAdLoading ? 'Loading Sponsor...' : `DOUBLE COINS (+${coinsEarned})`}</span>
          </button>
        )}

        {/* Navigation Action Buttons */}
        <div className="w-full space-y-2 pt-1">
          {hasNextLevel ? (
            <button
              data-start="true"
              onClick={() => {
                sounds.playButtonClick();
                onNextLevel();
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/40 cursor-pointer active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>NEXT LEVEL</span>
            </button>
          ) : (
            <button
              data-start="true"
              onClick={() => {
                sounds.playButtonClick();
                onOpenLevelSelect();
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 cursor-pointer active:scale-95 transition-all"
            >
              <Grid className="w-4 h-4" />
              <span>ALL LEVELS MASTERED</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                sounds.playButtonClick();
                onRetry();
              }}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>REPLAY</span>
            </button>

            <button
              onClick={() => {
                sounds.playButtonClick();
                onOpenLevelSelect();
              }}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Grid className="w-3.5 h-3.5 text-cyan-400" />
              <span>LEVEL SELECT</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
