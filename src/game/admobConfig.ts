/**
 * Google AdMob native advertising configuration for Sky Ball 3D.
 *
 * NOTE FOR PUBLISHING:
 * 1. Keep IS_PRODUCTION = false while developing and testing.
 * 2. When you receive approved AdMob ad units from https://admob.google.com,
 *    replace the placeholder production IDs below and set IS_PRODUCTION = true.
 * 3. Never test production ad units on your own device without adding your device
 *    to testDevices in AdMob (doing so violates AdMob invalid traffic policies).
 */

export interface AdMobConfig {
  appId: string;
  bannerAdUnitId: string;
  interstitialAdUnitId: string;
  rewardedAdUnitId: string;
  testDevices: string[];
  isTesting: boolean;
}

// Development vs. Production configuration flag
export const IS_PRODUCTION = false; // Set to true only when ready for production release

// Official Google AdMob Test Ad Units (Android)
// https://developers.google.com/admob/android/test-ads
const TEST_CONFIG: AdMobConfig = {
  appId: 'ca-app-pub-3940256099942544~3347511713', // Official Google Android Test App ID
  bannerAdUnitId: 'ca-app-pub-3940256099942544/6300978111', // Test Banner
  interstitialAdUnitId: 'ca-app-pub-3940256099942544/1033173712', // Test Interstitial
  rewardedAdUnitId: 'ca-app-pub-3940256099942544/5224354917', // Test Rewarded Video
  testDevices: [],
  isTesting: true,
};

// Production Ad Units: REPLACE THESE PLACEHOLDERS BEFORE GOOGLE PLAY RELEASE
const PRODUCTION_CONFIG: AdMobConfig = {
  appId: 'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX', // <-- ENTER YOUR REAL ADMOB APP ID HERE
  bannerAdUnitId: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // <-- ENTER YOUR REAL BANNER ID
  interstitialAdUnitId: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // <-- ENTER YOUR REAL INTERSTITIAL ID
  rewardedAdUnitId: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // <-- ENTER YOUR REAL REWARDED ID
  testDevices: [], // Add your personal test device hashed IDs from Logcat here
  isTesting: false,
};

export const activeAdConfig: AdMobConfig = IS_PRODUCTION ? PRODUCTION_CONFIG : TEST_CONFIG;
