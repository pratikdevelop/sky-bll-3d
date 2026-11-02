import React from 'react';
import { Play, RotateCcw, Grid, ShoppingBag, Home, Volume2, VolumeX } from 'lucide-react';
import { sounds } from '../game/audio.ts';

interface PauseModalProps {
  levelTitle: string;
  onPlayResume: () => void;
  onRestart: () => void;
  onOpenLevelSelect: () => void;
  onOpenShop: () => void;
  onReturnTitle: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  levelTitle,
  onPlayResume,
  onRestart,
  onOpenLevelSelect,
  onOpenShop,
  onReturnTitle,
  onToggleMute,
  isMuted,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 select-none">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center space-y-5 text-center">
        {/* Title */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">GAME PAUSED</span>
          <h2 className="text-xl font-black text-white tracking-tight">{levelTitle}</h2>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2.5">
          <button
            onClick={() => {
              sounds.playButtonClick();
              onPlayResume();
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/30 transition-all cursor-pointer active:scale-95"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>RESUME [ESC]</span>
          </button>

          <button
            onClick={() => {
              sounds.playButtonClick();
              onRestart();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span>RESTART LEVEL</span>
          </button>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                sounds.playButtonClick();
                onOpenLevelSelect();
              }}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Grid className="w-3.5 h-3.5 text-cyan-400" />
              <span>LEVELS</span>
            </button>

            <button
              onClick={() => {
                sounds.playButtonClick();
                onOpenShop();
              }}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
              <span>SKINS</span>
            </button>
          </div>
        </div>

        {/* Footer options */}
        <div className="w-full flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
          <button
            onClick={() => {
              sounds.playButtonClick();
              onToggleMute();
            }}
            className="flex items-center gap-1.5 hover:text-white cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            <span>{isMuted ? 'UNMUTE' : 'MUTE'}</span>
          </button>

          <button
            onClick={() => {
              sounds.playButtonClick();
              onReturnTitle();
            }}
            className="flex items-center gap-1.5 hover:text-white cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>TITLE MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
