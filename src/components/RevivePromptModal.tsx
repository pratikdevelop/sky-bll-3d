import React, { useState } from 'react';
import { RotateCcw, Tv, ArrowUpRight } from 'lucide-react';
import { sounds } from '../game/audio.ts';
import { monetization } from '../game/monetization.ts';

interface RevivePromptModalProps {
  checkpointName: string;
  onReviveSuccess: () => void;
  onRetryCheckpoint: () => void;
  onRestartLevel: () => void;
}

export const RevivePromptModal: React.FC<RevivePromptModalProps> = ({
  checkpointName,
  onReviveSuccess,
  onRetryCheckpoint,
  onRestartLevel,
}) => {
  const [isAdLoading, setIsAdLoading] = useState(false);

  const handleRewardedRevive = () => {
    sounds.playButtonClick();
    setIsAdLoading(true);
    monetization.requestRewardedAd('revive', (granted) => {
      setIsAdLoading(false);
      if (granted) {
        onReviveSuccess();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/75 select-none animate-fadeIn">
      <div className="w-full max-w-sm bg-slate-900 border border-rose-500/30 rounded-2xl p-6 shadow-2xl flex flex-col items-center space-y-5 text-center">
        {/* Header */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400 font-bold">
            FELL FROM THE CLOUDS
          </span>
          <h2 className="text-xl font-black text-white tracking-tight">Keep Rolling?</h2>
          <p className="text-xs text-slate-400">
            Last saved checkpoint: <span className="text-cyan-300 font-semibold">{checkpointName}</span>
          </p>
        </div>

        {/* Primary Rewarded Ad Revive */}
        <div className="w-full space-y-2.5">
          <button
            onClick={handleRewardedRevive}
            disabled={isAdLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 border border-emerald-300/40 cursor-pointer active:scale-95 transition-all"
          >
            <Tv className="w-4 h-4 text-emerald-200" />
            <span>{isAdLoading ? 'Loading Sponsor...' : 'REVIVE AT CHECKPOINT (AD)'}</span>
          </button>

          {/* Standard Free Restart Options */}
          <button
            onClick={() => {
              sounds.playButtonClick();
              onRetryCheckpoint();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>RETRY AT CHECKPOINT (FREE)</span>
          </button>

          <button
            onClick={() => {
              sounds.playButtonClick();
              onRestartLevel();
            }}
            className="w-full py-2 px-3 text-slate-400 hover:text-slate-200 text-xs font-mono flex items-center justify-center gap-1 cursor-pointer transition-colors"
          >
            <span>Restart Level From Start</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
