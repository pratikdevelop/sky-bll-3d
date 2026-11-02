import React from 'react';
import { X, Lock, Star, Play } from 'lucide-react';
import { LEVELS } from '../game/levels.ts';
import { PlayerProgress, LevelData } from '../game/types.ts';
import { sounds } from '../game/audio.ts';

interface LevelSelectModalProps {
  progress: PlayerProgress;
  onSelectLevel: (level: LevelData) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  progress,
  onSelectLevel,
  onClose,
}) => {
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/75 select-none animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col space-y-4 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-lg font-black text-white tracking-tight">Select Level</h2>
            <p className="text-xs text-slate-400">5 hand-crafted sky island courses</p>
          </div>
          <button
            onClick={() => {
              sounds.playButtonClick();
              onClose();
            }}
            aria-label="Close Level Select"
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Level List */}
        <div className="space-y-3 overflow-y-auto pr-1">
          {LEVELS.map((lvl) => {
            const isUnlocked = lvl.id <= progress.unlockedLevel;
            const stars = progress.levelStars[lvl.id] || 0;
            const bestTime = progress.bestTimes[lvl.id];

            return (
              <div
                key={lvl.id}
                onClick={() => {
                  if (isUnlocked) {
                    sounds.playButtonClick();
                    onSelectLevel(lvl);
                  }
                }}
                className={`p-4 rounded-xl border transition-all ${
                  isUnlocked
                    ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 hover:border-cyan-500/50 cursor-pointer shadow-lg active:scale-[0.99]'
                    : 'bg-slate-900/50 border-slate-800/60 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-950 text-[10px] font-mono font-bold text-cyan-300 border border-cyan-500/30">
                        STAGE {lvl.id}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase">
                        {lvl.difficulty}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white">{lvl.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-1">{lvl.subtitle}</p>
                  </div>

                  {/* Right side: Star status or Lock */}
                  <div className="flex flex-col items-end gap-1.5 pl-4">
                    {isUnlocked ? (
                      <>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3].map((starIdx) => (
                            <Star
                              key={starIdx}
                              className={`w-4 h-4 ${
                                starIdx <= stars
                                  ? 'fill-amber-400 stroke-amber-500'
                                  : 'stroke-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                        {bestTime !== undefined ? (
                          <span className="text-[10px] font-mono text-emerald-400 font-semibold tabular-nums">
                            {formatTime(bestTime)}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-500 font-semibold">NOT CLEARED</span>
                        )}
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-400 font-bold group-hover:underline pt-1">
                          <Play className="w-3 h-3 fill-cyan-400" /> PLAY
                        </span>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-500">
                        <Lock className="w-5 h-5 mb-0.5" />
                        <span className="text-[9px] font-mono uppercase">LOCKED</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
