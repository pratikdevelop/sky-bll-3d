# Sky Ball 3D — Android game project

React + TypeScript + Vite + Three.js game packaged for Android with Capacitor 8.

## Android identity

- App name: **Sky Ball 3D**
- Android application ID: `com.pratikdevelop.skyball3d`
- Version: `1.0.0` (version code `1`)

The application ID is intended to be the permanent Google Play identity. Confirm that it is available in your Play Console before the first production upload; changing it after publishing creates a different app. When applying these updates to the original ZIP, delete the old `android/app/src/main/java/com/neon3d/game/MainActivity.java` file; its replacement is under `com/pratikdevelop/skyball3d/`.

## Requirements

- Node.js compatible with the installed Vite/Capacitor versions
- Android Studio with Android SDK and a compatible JDK
- Google AdMob account for production advertising

## Install and run the web game

```bash
npm install
npm run dev
```

## Build and sync Android

```bash
npm run cap:sync
npm run cap:open
```

In Android Studio, run the `app` configuration on a physical Android device. For a command-line debug build (from the `android` directory):

```bash
./gradlew assembleDebug
```

The debug APK is normally written to `android/app/build/outputs/apk/debug/app-debug.apk`.

## AdMob setup — development only until configured

The project currently uses Google's official Android test App ID and test ad-unit IDs. Keep test mode enabled while developing. Do not click your own production ads.

Before production release:

1. Create the Android app in your AdMob account using `com.pratikdevelop.skyball3d`.
2. Create banner, interstitial, and rewarded ad units as needed.
3. Replace the test App ID in **both** `capacitor.config.ts` and `android/app/src/main/AndroidManifest.xml` with your real AdMob App ID.
4. Replace the production ad-unit placeholders in `src/game/admobConfig.ts`.
5. Only then switch `IS_PRODUCTION` to `true` and run `npm run cap:sync`.
6. Complete the applicable UMP consent, privacy policy, Play Console Ads/Data safety, and app-readiness steps.

Do not use production ad IDs during development or test with your own live ads.

## Release bundle

Configure a private release signing key in Android Studio (do not commit the keystore or passwords). Then select **Build → Generate Signed Bundle / APK → Android App Bundle**. The resulting `.aab` must be tested and uploaded through your Google Play Console account.

## Important release status

This repository is a development project, not yet a verified Play Store release. Production AdMob IDs, publisher privacy details, consent policy review, release signing, device testing, store listing, and Google Play review remain account-owner tasks.
