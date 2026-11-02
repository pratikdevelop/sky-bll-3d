import React from 'react';
import { X, Check, Lock } from 'lucide-react';
import { BALL_SKINS } from '../game/skins.ts';
import { PlayerProgress, BallSkin } from '../game/types.ts';
import { sounds } from '../game/audio.ts';

interface ShopModalProps {
  progress: PlayerProgress;
  onEquipSkin: (skinId: string) => void;
  onUnlockSkin: (skin: BallSkin) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  progress,
  onEquipSkin,
  onUnlockSkin,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/75 select-none animate-fadeIn">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col space-y-4 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-lg font-black text-white tracking-tight">Ball Skins Shop</h2>
            <p className="text-xs text-slate-400">Unlock custom physics spheres with earned coins</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Coin balance */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-amber-500/40 px-3 py-1 rounded-full shadow">
              <span className="w-3 h-3 rounded-full bg-amber-400"></span>
              <span className="text-xs font-mono font-bold text-amber-200 tabular-nums">{progress.coins}</span>
            </div>

            <button
              onClick={() => {
                sounds.playButtonClick();
                onClose();
              }}
              aria-label="Close Shop"
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Skins Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto pr-1">
          {BALL_SKINS.map((skin) => {
            const isOwned = progress.ownedSkins.includes(skin.id);
            const isEquipped = progress.activeSkinId === skin.id;
            const canAfford = progress.coins >= skin.price;

            // Palette preview swatch
            const colorHex = `#${skin.baseColor.toString(16).padStart(6, '0')}`;

            return (
              <div
                key={skin.id}
                className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                  isEquipped
                    ? 'bg-cyan-950/40 border-cyan-500/70 shadow-lg shadow-cyan-950/50'
                    : isOwned
                    ? 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Sphere Avatar Swatch */}
                  <div
                    className="w-12 h-12 rounded-full border-2 border-white/20 shadow-inner flex items-center justify-center shrink-0 relative overflow-hidden"
                    style={{
                      backgroundColor: colorHex,
                      boxShadow: skin.emissive
                        ? `0 0 12px #${skin.emissive.toString(16).padStart(6, '0')}88`
                        : undefined,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-transparent to-white/60 pointer-events-none rounded-full"></div>
                  </div>

                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{skin.name}</span>
                      {isEquipped && (
                        <span className="text-[9px] font-mono font-bold text-cyan-300 bg-cyan-950 border border-cyan-500/40 px-1.5 py-0.2 rounded">
                          ACTIVE
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight">{skin.description}</p>
                  </div>
                </div>

                {/* Bottom Action Button */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  {isOwned ? (
                    isEquipped ? (
                      <span className="text-xs font-mono text-cyan-400 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> EQUIPPED
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          sounds.playButtonClick();
                          onEquipSkin(skin.id);
                        }}
                        className="w-full py-1.5 px-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold cursor-pointer transition-colors"
                      >
                        EQUIP
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => {
                        sounds.playButtonClick();
                        onUnlockSkin(skin);
                      }}
                      disabled={!canAfford}
                      className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md active:scale-95'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      <span>UNLOCK · {skin.price} COINS</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
