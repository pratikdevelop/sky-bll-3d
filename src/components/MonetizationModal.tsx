import React from 'react';
import { X, Tv, Shield, ShoppingCart, HelpCircle } from 'lucide-react';
import { sounds } from '../game/audio.ts';
import { monetization } from '../game/monetization.ts';

interface MonetizationModalProps {
  onClose: () => void;
  adFreePurchased: boolean;
  onSimulateAdTest: () => void;
}

export const MonetizationModal: React.FC<MonetizationModalProps> = ({
  onClose,
  adFreePurchased,
  onSimulateAdTest,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/75 select-none animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col space-y-4 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">Monetization & Privacy</h2>
              <p className="text-xs text-slate-400">Compliant advertising scaffolding & game disclosures</p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playButtonClick();
              onClose();
            }}
            aria-label="Close Info"
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content sections */}
        <div className="space-y-4 overflow-y-auto pr-1 text-xs text-slate-300">
          {/* Section 1: Rewarded Ads */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <Tv className="w-4 h-4 text-cyan-400" />
              <span>1. Native Google AdMob Rewarded Ads</span>
            </div>
            <p className="leading-relaxed text-slate-300">
              Players can optionally view rewarded sponsor video ads to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
              <li>Revive instantly at the last reached checkpoint after a fall.</li>
              <li>Double coins earned upon completing any level.</li>
            </ul>
            <p className="text-[11px] text-slate-400">
              • <strong>Android Native:</strong> Integrated via <code className="text-cyan-300 font-mono">@capacitor-community/admob</code> with official Google test units.
              <br />
              • <strong>Reward Verification:</strong> Rewards are granted strictly after the SDK confirms full view completion.
              <br />
              • <strong>Config Location:</strong> <code className="text-amber-300 font-mono">src/game/admobConfig.ts</code>.
            </p>
            <div className="pt-1">
              <button
                onClick={() => {
                  sounds.playButtonClick();
                  onSimulateAdTest();
                }}
                className="py-1.5 px-3 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 font-mono text-[11px] font-semibold cursor-pointer transition-colors"
              >
                Test Rewarded Ad Flow (Preview Simulation)
              </button>
            </div>
          </div>

          {/* Section 2: Interstitial Ads Policy */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>2. Strict Interstitial Pacing Rules</span>
            </div>
            <p className="leading-relaxed text-slate-400">
              • <strong>Zero mid-game interruptions:</strong> Ads never trigger during active ball rolling.
              <br />
              • <strong>Frequency cap:</strong> Maximum 1 interstitial per 4-minute interval, only after 3+ completed runs or level switches.
              <br />
              • Fully skippable normal gameplay without watching any ads.
            </p>
          </div>

          {/* Section 3: Optional In-App Purchases */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <ShoppingCart className="w-4 h-4 text-purple-400" />
              <span>3. Optional Purchases & Ad-Free VIP</span>
            </div>
            <p className="leading-relaxed text-slate-400">
              Live payment processing is held disabled until a formal merchant account (e.g. Google Play Billing, Stripe, or Web Game Portal) is registered in production.
            </p>
            <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-700">
              <span className="font-mono text-slate-300">Ad-Free VIP Pass Status:</span>
              <span className="font-mono font-bold text-emerald-400">
                {adFreePurchased ? 'ACTIVE' : 'READY TO CONFIGURE'}
              </span>
            </div>
          </div>

          {/* Section 4: Privacy & Publisher Details */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>4. Privacy & Data Safety</span>
            </div>
            <p className="leading-relaxed text-slate-400">
              <strong>Sky Ball 3D</strong> does not collect personal data, emails, or device identifiers. All high scores, unlocked skins, and coin progress are stored locally on your device via HTML5 LocalStorage.
            </p>
            <div className="pt-1 text-[11px] font-mono text-slate-500">
              Publisher: Studio Sky Ball Games · Contact: support@skyball3d.example.com
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
