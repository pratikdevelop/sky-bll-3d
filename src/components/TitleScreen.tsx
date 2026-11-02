import React from 'react';
import { Play, Grid, ShoppingBag, ShieldCheck, Volume2, VolumeX } from 'lucide-react';
import { PlayerProgress } from '../game/types.ts';
import { sounds } from '../game/audio.ts';

interface TitleScreenProps {
  progress: PlayerProgress;
  onStart: () => void;
  onOpenLevelSelect: () => void;
  onOpenShop: () => void;
  onOpenMonetization: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  progress,
  onStart,
  onOpenLevelSelect,
  onOpenShop,
  onOpenMonetization,
  onToggleMute,
  isMuted,
}) => {
  return (
    <div className="fixed inset-0 z-30 pointer-events-none flex flex-col justify-between p-6 sm:p-10 select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-amber-500/30 px-3.5 py-1.5 rounded-full shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="text-xs uppercase font-mono tracking-wider text-amber-200">COINS</span>
            <span className="text-sm font-bold font-mono text-white tabular-nums">{progress.coins}</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-slate-900/90 border border-cyan-500/30 px-3.5 py-1.5 rounded-full shadow-lg">
            <span className="text-xs uppercase font-mono tracking-wider text-cyan-300">LEVEL</span>
            <span className="text-sm font-bold font-mono text-white">{progress.unlockedLevel} / 5</span>
          </div>
        </div>

        {/* Audio Mute & Info Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sounds.playButtonClick();
              onToggleMute();
            }}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="w-10 h-10 rounded-xl bg-slate-900/90 border border-slate-700/60 hover:border-cyan-400/80 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
          </button>

          <button
            onClick={() => {
              sounds.playButtonClick();
              onOpenMonetization();
            }}
            aria-label="Monetization and Privacy Info"
            className="w-10 h-10 rounded-xl bg-slate-900/90 border border-slate-700/60 hover:border-cyan-400/80 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
          >
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* Center Title Lockup */}
      <div className="flex flex-col items-center justify-center max-w-lg mx-auto text-center space-y-6 pointer-events-auto my-auto">
        {/* Bespoke Inline SVG Logo */}
        <div className="relative">
          <svg className="w-72 sm:w-96 h-28 drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)]" viewBox="0 0 380 110">
            <defs>
              <linearGradient id="skyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <linearGradient id="ballGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>

            {/* Wing / Island Crest */}
            <path
              d="M 30 85 Q 190 105 350 85 Q 260 100 190 98 Q 120 100 30 85 Z"
              fill="#0284c7"
              opacity="0.8"
            />

            {/* SKY Text */}
            <text
              x="190"
              y="48"
              textAnchor="middle"
              fill="url(#skyGrad)"
              stroke="#0f172a"
              strokeWidth="3"
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontWeight: 900,
                fontSize: '44px',
                letterSpacing: '0.18em',
              }}
            >
              SKY BALL
            </text>

            {/* 3D Badge */}
            <g transform="translate(190, 78)">
              <rect x="-38" y="-14" width="76" height="26" rx="6" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
              <text
                x="0"
                y="5"
                textAnchor="middle"
                fill="#38bdf8"
                style={{
                  fontFamily: 'monospace',
                  fontWeight: 900,
                  fontSize: '17px',
                  letterSpacing: '0.22em',
                }}
              >
                3D
              </text>
            </g>
          </svg>

          <p className="text-xs sm:text-sm font-medium tracking-wide text-cyan-200/90 mt-1 drop-shadow">
            Precision Sky Island Platformer
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
          <button
            data-start="true"
            onClick={() => {
              sounds.playButtonClick();
              onStart();
            }}
            className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-base flex items-center justify-center gap-2.5 shadow-xl shadow-cyan-900/40 border border-cyan-300/40 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>PLAY NOW</span>
          </button>
        </div>

        {/* Secondary Menus */}
        <div className="flex items-center justify-center gap-3 w-full max-w-sm">
          <button
            onClick={() => {
              sounds.playButtonClick();
              onOpenLevelSelect();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-400/60 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95"
          >
            <Grid className="w-4 h-4 text-cyan-400" />
            <span>LEVELS ({progress.unlockedLevel}/5)</span>
          </button>

          <button
            onClick={() => {
              sounds.playButtonClick();
              onOpenShop();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-400/60 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span>BALL SKINS</span>
          </button>
        </div>
      </div>

      {/* Flat Control Hint Line */}
      <div className="flex items-center justify-center text-center text-xs tracking-wider font-mono text-slate-300 bg-slate-900/80 border border-slate-800 py-2 px-4 rounded-full max-w-md mx-auto pointer-events-auto">
        WASD / Touch Move · Space Jump · Esc Pause
      </div>
    </div>
  );
};
