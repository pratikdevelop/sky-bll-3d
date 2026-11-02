/**
 * Production-Ready Google AdMob & Web Game Monetization Engine
 *
 * Supports:
 * - Native Android AdMob via @capacitor-community/admob on devices
 * - Google User Messaging Platform (UMP) consent flow
 * - Rewarded video ads (Revive at checkpoint & 2x Bonus coins)
 * - Interstitial ad frequency limits & pacing
 * - Optional bottom banner ads (non-gameplay screens only)
 * - Clearly labeled browser-only reward preview for local UI development
 */

import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  AdmobConsentStatus,
  BannerAdSize,
  BannerAdPosition,
} from '@capacitor-community/admob';
import { activeAdConfig } from './admobConfig.ts';

export interface AdRewardResult {
  rewardGranted: boolean;
  type: 'revive' | 'double_coins';
  error?: string;
}

class MonetizationManager {
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;
  private adsAllowed: boolean = false;
  private isRewardedAdInProgress: boolean = false;

  // Interstitial pacing
  private lastInterstitialTime: number = 0;
  private attemptsSinceLastAd: number = 0;
  private readonly MIN_INTERSTITIAL_INTERVAL_MS = 240000; // 4 minutes
  private readonly MIN_LEVEL_ATTEMPTS = 3;

  // Banner state
  private isBannerVisible: boolean = false;

  constructor() {
    // Lazy initialize on first interaction or app start
  }

  /**
   * Initializes native AdMob SDK & gathers UMP user consent if on Android
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (!Capacitor.isNativePlatform()) {
      // Browser preview is not a real advertising environment.
      this.isInitialized = true;
      this.adsAllowed = false;
      return;
    }

    // Share one initialization operation between concurrent callers.
    if (this.initializationPromise) {
      await this.initializationPromise;
      return;
    }

    this.initializationPromise = (async () => {
      // UMP must be checked before requesting ads. A failed consent request
      // must fail closed rather than silently continuing to load advertisements.
      let consentInfo = await AdMob.requestConsentInfo();
      if (
        consentInfo.isConsentFormAvailable &&
        consentInfo.status === AdmobConsentStatus.REQUIRED
      ) {
        consentInfo = await AdMob.showConsentForm();
      }

      this.adsAllowed = consentInfo.canRequestAds;
      if (!this.adsAllowed) {
        console.info('AdMob ads are unavailable until consent requirements are satisfied.');
        return;
      }

      await AdMob.initialize({
        testingDevices: activeAdConfig.testDevices,
        initializeForTesting: activeAdConfig.isTesting,
      });

      this.isInitialized = true;
    })();

    try {
      await this.initializationPromise;
    } catch (err) {
      this.adsAllowed = false;
      console.warn('AdMob initialization or consent notice:', err);
    } finally {
      this.initializationPromise = null;
    }
  }

  /**
   * Shows a Rewarded Video Ad (Revive at checkpoint or Double Coins).
   * Ensures the reward callback is executed exactly once only after confirmed SDK reward.
   */
  public async requestRewardedAd(
    type: 'revive' | 'double_coins',
    onReward: (granted: boolean) => void
  ): Promise<void> {
    if (this.isRewardedAdInProgress) {
      onReward(false);
      return;
    }

    await this.initialize();

    if (Capacitor.isNativePlatform()) {
      if (!this.isInitialized || !this.adsAllowed) {
        onReward(false);
        return;
      }

      this.isRewardedAdInProgress = true;
      let callbackExecuted = false;
      const finish = (granted: boolean) => {
        if (callbackExecuted) return;
        callbackExecuted = true;
        this.isRewardedAdInProgress = false;
        onReward(granted);
      };

      try {
        await AdMob.prepareRewardVideoAd({
          adId: activeAdConfig.rewardedAdUnitId,
          isTesting: activeAdConfig.isTesting,
        });

        // In plugin v8, the promise resolves with a reward item only after
        // the SDK confirms that the reward has been earned. Closing an ad or
        // clicking it is not sufficient to grant the in-game reward.
        const reward = await AdMob.showRewardVideoAd();
        finish(Boolean(reward));
      } catch (nativeErr) {
        console.warn('Native AdMob rewarded ad unavailable:', nativeErr);
        finish(false);
      }
      return;
    }

    // Clearly labeled browser-only preview. This is not a real ad and must
    // never be used as proof of production ad delivery or revenue.
    const overlay = document.createElement('div');
    overlay.id = 'simulated-ad-overlay';
    overlay.className =
      'fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 text-white font-sans select-none';
    overlay.innerHTML = `
      <div class="max-w-md w-full bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 shadow-2xl text-center space-y-4">
        <div class="inline-flex items-center gap-2 px-3 py-1 bg-cyan-950/80 border border-cyan-500/40 rounded-full text-xs font-mono text-cyan-300">
          <span class="w-2 h-2 rounded-full bg-cyan-400"></span>
          DEVELOPMENT PREVIEW — NOT AN AD
        </div>
        <h3 class="text-xl font-bold tracking-tight text-white">
          ${type === 'revive' ? 'Checkpoint Revive Preview' : 'Double Coin Preview'}
        </h3>
        <p class="text-xs text-slate-400 leading-relaxed">
          Browser-only simulation for UI testing. No advertisement is served and no advertising revenue is generated.
        </p>
        <div class="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div id="sim-ad-progress" class="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full w-0 transition-all duration-300"></div>
        </div>
        <div class="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
          <span id="sim-ad-timer">Preview completes in 3s...</span>
          <button id="sim-ad-cancel" class="text-rose-400 hover:text-rose-300 cursor-pointer underline">Cancel</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    let secondsLeft = 3;
    const progressEl = overlay.querySelector('#sim-ad-progress') as HTMLElement;
    const timerEl = overlay.querySelector('#sim-ad-timer') as HTMLElement;
    const cancelBtn = overlay.querySelector('#sim-ad-cancel') as HTMLElement;
    let timerInterval: number | null = null;
    let completed = false;

    const cleanup = () => {
      if (timerInterval !== null) window.clearInterval(timerInterval);
      overlay.remove();
    };

    cancelBtn.onclick = () => {
      if (completed) return;
      completed = true;
      cleanup();
      onReward(false);
    };

    timerInterval = window.setInterval(() => {
      secondsLeft -= 1;
      if (progressEl) progressEl.style.width = `${((3 - secondsLeft) / 3) * 100}%`;

      if (secondsLeft <= 0) {
        if (completed) return;
        completed = true;
        cleanup();
        onReward(true);
      } else if (timerEl) {
        timerEl.textContent = `Preview completes in ${secondsLeft}s...`;
      }
    }, 1000);
  }

  /**
   * Pacing rule for interstitial full-screen ads:
   * - Never during active ball controls
   * - At least 4 minutes interval
   * - At least 3 attempts completed
   */
  public canShowInterstitial(adFreePurchased: boolean): boolean {
    if (
      adFreePurchased ||
      !Capacitor.isNativePlatform() ||
      !this.adsAllowed ||
      !this.isInitialized
    ) {
      return false;
    }
    const now = Date.now();
    const timeElapsed = now - this.lastInterstitialTime;
    return (
      timeElapsed >= this.MIN_INTERSTITIAL_INTERVAL_MS &&
      this.attemptsSinceLastAd >= this.MIN_LEVEL_ATTEMPTS
    );
  }

  public recordLevelEnd(): void {
    this.attemptsSinceLastAd += 1;
  }

  /**
   * Triggers native Interstitial ad if frequency criteria are met
   */
  public async triggerInterstitialIfEligible(adFreePurchased: boolean): Promise<void> {
    if (!this.canShowInterstitial(adFreePurchased)) return;

    this.lastInterstitialTime = Date.now();
    this.attemptsSinceLastAd = 0;

    await this.initialize();

    if (Capacitor.isNativePlatform() && this.isInitialized && this.adsAllowed) {
      try {
        await AdMob.prepareInterstitial({
          adId: activeAdConfig.interstitialAdUnitId,
          isTesting: activeAdConfig.isTesting,
        });

        await AdMob.showInterstitial();
      } catch (err) {
        console.warn('AdMob interstitial notice:', err);
      }
    }
  }

  /**
   * Optional banner ad for non-gameplay screens (Shop / Title)
   */
  public async showBanner(adFreePurchased: boolean): Promise<void> {
    if (adFreePurchased || !Capacitor.isNativePlatform() || this.isBannerVisible) return;

    await this.initialize();
    if (!this.isInitialized || !this.adsAllowed) return;

    try {
      await AdMob.showBanner({
        adId: activeAdConfig.bannerAdUnitId,
        adSize: BannerAdSize.BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: activeAdConfig.isTesting,
      });
      this.isBannerVisible = true;
    } catch (err) {
      console.warn('AdMob banner notice:', err);
    }
  }

  public async hideBanner(): Promise<void> {
    if (!Capacitor.isNativePlatform() || !this.isBannerVisible) return;
    try {
      await AdMob.hideBanner();
      this.isBannerVisible = false;
    } catch (err) {
      console.warn('AdMob hide banner notice:', err);
    }
  }
}

export const monetization = new MonetizationManager();
