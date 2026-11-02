import React, { useState, useEffect, useRef, useCallback } from 'react';
import { App as CapApp } from '@capacitor/app';
import { GameEngine } from './game/engine.ts';
import { GameState, LevelData, PlayerProgress, BallSkin } from './game/types.ts';
import { LEVELS } from './game/levels.ts';
import { loadProgress, saveProgress, recordLevelCompletion, unlockSkin, setActiveSkin } from './game/storage.ts';
import { calculateStarRating } from './game/rules.ts';
import { sounds } from './game/audio.ts';
import { monetization } from './game/monetization.ts';

import { TitleScreen } from './components/TitleScreen.tsx';
import { HUD } from './components/HUD.tsx';
import { PauseModal } from './components/PauseModal.tsx';
import { VictoryModal } from './components/VictoryModal.tsx';
import { RevivePromptModal } from './components/RevivePromptModal.tsx';
import { LevelSelectModal } from './components/LevelSelectModal.tsx';
import { ShopModal } from './components/ShopModal.tsx';
import { MonetizationModal } from './components/MonetizationModal.tsx';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Game UI State
  const [gameState, setGameState] = useState<GameState>('title');
  const [currentLevel, setCurrentLevel] = useState<LevelData>(LEVELS[0]);
  const [progress, setProgress] = useState<PlayerProgress>(loadProgress());

  // In-run HUD metrics (throttled)
  const [elapsedTime, setElapsedTime] = useState(0);
  const [coinsCollectedInRun, setCoinsCollectedInRun] = useState(0);
  const [gemsCollectedInRun, setGemsCollectedInRun] = useState(0);
  const [ballSpeed, setBallSpeed] = useState(0);
  const [checkpointToast, setCheckpointToast] = useState<string | null>(null);

  // Victory Run snapshot
  const [victoryStats, setVictoryStats] = useState<{
    timeSec: number;
    stars: number;
    coinsEarned: number;
    timeBonus: number;
    isNewBest: boolean;
  } | null>(null);

  // Checkpoint for revive prompt
  const [lastCheckpointName, setLastCheckpointName] = useState('Starting Platform');

  // Active Modals
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showMonetization, setShowMonetization] = useState(false);

  // Sync document body data-state for accessibility and testing
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Audio mute preference sync
  useEffect(() => {
    sounds.setMuted(progress.isMuted);
  }, [progress.isMuted]);

  // Initialize Three.js Engine once on mount
  useEffect(() => {
    if (!mountRef.current) return;

    const initialProgress = loadProgress();
    setProgress(initialProgress);

    const engine = new GameEngine(mountRef.current, {
      onCoinCollected: (count) => {
        setCoinsCollectedInRun(count);
      },
      onGemCollected: (count) => {
        setGemsCollectedInRun(count);
      },
      onCheckpointReached: (name) => {
        setLastCheckpointName(name);
        setCheckpointToast(name);
        setTimeout(() => setCheckpointToast(null), 3000);
      },
      onLevelComplete: (timeSec) => {
        // Calculate stars and coins
        const rating = calculateStarRating({
          completionTime: timeSec,
          parTime: currentLevel.parTime,
          coinsCollected: coinsCollectedInRun,
          totalCoins: currentLevel.collectibles.filter((c) => c.type === 'coin').length,
          gemsCollected: gemsCollectedInRun,
          totalGems: currentLevel.collectibles.filter((c) => c.type === 'gem').length,
        });

        const { progress: nextProg, isNewBest } = recordLevelCompletion(
          currentLevel.id,
          timeSec,
          rating.stars,
          rating.coinsEarned
        );
        setProgress(nextProg);

        setVictoryStats({
          timeSec,
          stars: rating.stars,
          coinsEarned: rating.coinsEarned,
          timeBonus: rating.timeBonus,
          isNewBest,
        });

        setGameState('victory');
        monetization.recordLevelEnd();
        monetization.triggerInterstitialIfEligible(nextProg.adFreePurchased);
      },
      onBallFell: () => {
        setGameState('revive_prompt');
      },
      onSpeedUpdate: (spd) => {
        setBallSpeed(spd);
      },
      onTimeUpdate: (timeSec) => {
        setElapsedTime(timeSec);
      },
    });

    engine.loadLevel(LEVELS[0]);
    engine.updateSkin(initialProgress.activeSkinId);
    engineRef.current = engine;

    // Check ?autostart=1 support
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autostart') === '1') {
      engine.startPlaying();
      setGameState('playing');
    }

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Actions
  const handleStartGame = useCallback(() => {
    if (!engineRef.current) return;
    setCoinsCollectedInRun(0);
    setGemsCollectedInRun(0);
    setElapsedTime(0);
    setLastCheckpointName('Starting Platform');
    engineRef.current.startPlaying();
    setGameState('playing');
    setShowLevelSelect(false);
    setShowShop(false);
    setShowMonetization(false);
  }, []);

  const handlePause = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.setPaused(true);
    setGameState('paused');
  }, []);

  const handleResume = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.setPaused(false);
    setGameState('playing');
  }, []);

  const handleReturnToTitle = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.returnToTitle();
    setGameState('title');
  }, []);

  // Android Hardware Back Button & App State Lifecycle Handling
  useEffect(() => {
    // Initialize monetization and AdMob
    monetization.initialize().catch(() => {});

    let backHandler: { remove: () => void } | null = null;
    let stateHandler: { remove: () => void } | null = null;

    try {
      CapApp.addListener('backButton', () => {
        if (showShop) {
          setShowShop(false);
          return;
        }
        if (showLevelSelect) {
          setShowLevelSelect(false);
          return;
        }
        if (showMonetization) {
          setShowMonetization(false);
          return;
        }
        if (gameState === 'playing') {
          handlePause();
          return;
        }
        if (gameState === 'paused') {
          handleResume();
          return;
        }
        if (gameState === 'victory' || gameState === 'revive_prompt') {
          handleReturnToTitle();
          return;
        }
        if (gameState === 'title') {
          CapApp.exitApp();
        }
      }).then((h) => {
        backHandler = h;
      });

      CapApp.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) {
          // App went into background -> automatically pause to conserve battery and mute audio
          if (engineRef.current) {
            engineRef.current.setPaused(true);
          }
          sounds.stopRollingSound();
          if (gameState === 'playing') {
            setGameState('paused');
          }
        }
      }).then((h) => {
        stateHandler = h;
      });
    } catch {
      // Ignored on web
    }

    return () => {
      backHandler?.remove();
      stateHandler?.remove();
    };
  }, [showShop, showLevelSelect, showMonetization, gameState, handlePause, handleResume, handleReturnToTitle]);

  // Keyboard shortcut listener for Pause (Escape / P) and Title start (Enter / Space)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'title') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          handleStartGame();
        }
      } else if (gameState === 'playing') {
        if (e.code === 'Escape' || e.code === 'KeyP') {
          e.preventDefault();
          handlePause();
        }
      } else if (gameState === 'paused') {
        if (e.code === 'Escape' || e.code === 'KeyP') {
          e.preventDefault();
          handleResume();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [gameState, handleStartGame, handlePause, handleResume]);

  const handleRestartLevel = useCallback(() => {
    if (!engineRef.current) return;
    setCoinsCollectedInRun(0);
    setGemsCollectedInRun(0);
    setElapsedTime(0);
    setLastCheckpointName('Starting Platform');
    engineRef.current.loadLevel(currentLevel);
    engineRef.current.startPlaying();
    setGameState('playing');
  }, [currentLevel]);

  const handleSelectLevel = useCallback((lvl: LevelData) => {
    setCurrentLevel(lvl);
    setShowLevelSelect(false);
    if (engineRef.current) {
      engineRef.current.loadLevel(lvl);
      setCoinsCollectedInRun(0);
      setGemsCollectedInRun(0);
      setElapsedTime(0);
      setLastCheckpointName('Starting Platform');
      engineRef.current.startPlaying();
      setGameState('playing');
    }
  }, []);

  const handleNextLevel = useCallback(() => {
    const nextIdx = currentLevel.id; // level 1 -> index 1 is Level 2
    if (nextIdx < LEVELS.length) {
      handleSelectLevel(LEVELS[nextIdx]);
    } else {
      setShowLevelSelect(true);
      setGameState('title');
      engineRef.current?.returnToTitle();
    }
  }, [currentLevel, handleSelectLevel]);

  const handleReviveSuccess = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.respawnAtLastCheckpoint();
    setGameState('playing');
  }, []);

  const handleRetryCheckpoint = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.respawnAtLastCheckpoint();
    setGameState('playing');
  }, []);


  const handleToggleMute = useCallback(() => {
    setProgress((prev) => {
      const nextMuted = !prev.isMuted;
      sounds.setMuted(nextMuted);
      const updated = { ...prev, isMuted: nextMuted };
      saveProgress(updated);
      return updated;
    });
  }, []);

  const handleEquipSkin = useCallback((skinId: string) => {
    const updated = setActiveSkin(skinId);
    setProgress(updated);
    engineRef.current?.updateSkin(skinId);
  }, []);

  const handleUnlockSkin = useCallback((skin: BallSkin) => {
    const res = unlockSkin(skin.id, skin.price);
    if (res.success) {
      setProgress(res.progress);
      engineRef.current?.updateSkin(skin.id);
      sounds.playGem();
    }
  }, []);

  const handleBonusCoinsAwarded = useCallback((extraCoins: number) => {
    setProgress((prev) => {
      const updated = { ...prev, coins: prev.coins + extraCoins };
      saveProgress(updated);
      return updated;
    });
  }, []);

  const handleTouchInput = useCallback((x: number, z: number, jumpJustPressed: boolean, jumpHeld: boolean) => {
    engineRef.current?.setInput(x, z, jumpJustPressed, jumpHeld);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 3D WebGL Canvas isolated mount */}
      <div ref={mountRef} className="absolute inset-0 z-0 touch-none" />

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <TitleScreen
          progress={progress}
          onStart={handleStartGame}
          onOpenLevelSelect={() => setShowLevelSelect(true)}
          onOpenShop={() => setShowShop(true)}
          onOpenMonetization={() => setShowMonetization(true)}
          onToggleMute={handleToggleMute}
          isMuted={progress.isMuted}
        />
      )}

      {/* In-game HUD */}
      {gameState === 'playing' && (
        <HUD
          level={currentLevel}
          timeSec={elapsedTime}
          bestTime={progress.bestTimes[currentLevel.id]}
          coinsCount={coinsCollectedInRun}
          gemsCount={gemsCollectedInRun}
          speed={ballSpeed}
          checkpointNotification={checkpointToast}
          onPause={handlePause}
          onToggleMute={handleToggleMute}
          isMuted={progress.isMuted}
          onTouchInput={handleTouchInput}
        />
      )}

      {/* Paused Modal */}
      {gameState === 'paused' && (
        <PauseModal
          levelTitle={currentLevel.title}
          onPlayResume={handleResume}
          onRestart={handleRestartLevel}
          onOpenLevelSelect={() => setShowLevelSelect(true)}
          onOpenShop={() => setShowShop(true)}
          onReturnTitle={handleReturnToTitle}
          onToggleMute={handleToggleMute}
          isMuted={progress.isMuted}
        />
      )}

      {/* Victory / Stage Complete Modal */}
      {gameState === 'victory' && victoryStats && (
        <VictoryModal
          level={currentLevel}
          timeSec={victoryStats.timeSec}
          stars={victoryStats.stars}
          coinsEarned={victoryStats.coinsEarned}
          timeBonus={victoryStats.timeBonus}
          gemsCollected={gemsCollectedInRun}
          totalGems={currentLevel.collectibles.filter((c) => c.type === 'gem').length}
          isNewBest={victoryStats.isNewBest}
          onNextLevel={handleNextLevel}
          onRetry={handleRestartLevel}
          onOpenLevelSelect={() => setShowLevelSelect(true)}
          onBonusCoinsAwarded={handleBonusCoinsAwarded}
        />
      )}

      {/* Fall / Out of bounds Revive Prompt */}
      {gameState === 'revive_prompt' && (
        <RevivePromptModal
          checkpointName={lastCheckpointName}
          onReviveSuccess={handleReviveSuccess}
          onRetryCheckpoint={handleRetryCheckpoint}
          onRestartLevel={handleRestartLevel}
        />
      )}

      {/* Modals & Dialogs */}
      {showLevelSelect && (
        <LevelSelectModal
          progress={progress}
          onSelectLevel={handleSelectLevel}
          onClose={() => setShowLevelSelect(false)}
        />
      )}

      {showShop && (
        <ShopModal
          progress={progress}
          onEquipSkin={handleEquipSkin}
          onUnlockSkin={handleUnlockSkin}
          onClose={() => setShowShop(false)}
        />
      )}

      {showMonetization && (
        <MonetizationModal
          onClose={() => setShowMonetization(false)}
          adFreePurchased={progress.adFreePurchased}
          onSimulateAdTest={() => {
            monetization.requestRewardedAd('double_coins', (granted) => {
              if (granted) {
                handleBonusCoinsAwarded(50);
                sounds.playGem();
              }
            });
          }}
        />
      )}
    </div>
  );
}
