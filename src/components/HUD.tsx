import React, { useState, useEffect, useRef } from 'react';
import { Pause, Volume2, VolumeX, ArrowUp } from 'lucide-react';
import { LevelData } from '../game/types.ts';
import { sounds } from '../game/audio.ts';

interface HUDProps {
  level: LevelData;
  timeSec: number;
  bestTime?: number;
  coinsCount: number;
  gemsCount: number;
  speed: number;
  checkpointNotification: string | null;
  onPause: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
  onTouchInput: (x: number, z: number, jumpJustPressed: boolean, jumpHeld: boolean) => void;
}

export const HUD: React.FC<HUDProps> = ({
  level,
  timeSec,
  bestTime,
  coinsCount,
  gemsCount,
  speed,
  checkpointNotification,
  onPause,
  onToggleMute,
  isMuted,
  onTouchInput,
}) => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const joystickRef = useRef<HTMLDivElement>(null);
  const joystickTouchId = useRef<number | null>(null);
  const joystickCenter = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Detect touch capability or mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 768;
      setIsTouchDevice(hasTouch);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Format time MM:SS.S
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  // Virtual Joystick Pointer Handlers (Works with both touch and mouse)
  const isPointerDown = useRef(false);

  const startJoystick = (clientX: number, clientY: number) => {
    if (!joystickRef.current) return;
    isPointerDown.current = true;
    const rect = joystickRef.current.getBoundingClientRect();
    joystickCenter.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    updateJoystickPos(clientX, clientY);
  };

  const updateJoystickPos = (clientX: number, clientY: number) => {
    if (!isPointerDown.current) return;
    const dx = clientX - joystickCenter.current.x;
    const dy = clientY - joystickCenter.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = 45;

    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);
    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    setKnobPos({ x: knobX, y: knobY });

    // Normalize input: up is forward (+Z), down is backward (-Z)
    const normX = knobX / maxRadius;
    const normZ = -knobY / maxRadius;
    onTouchInput(normX, normZ, false, false);
  };

  const endJoystick = () => {
    isPointerDown.current = false;
    joystickTouchId.current = null;
    setKnobPos({ x: 0, y: 0 });
    onTouchInput(0, 0, false, false);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    startJoystick(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPointerDown.current) {
      updateJoystickPos(e.clientX, e.clientY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    endJoystick();
  };

  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-4 sm:p-6 select-none font-sans">
      {/* Top Perimeter Cluster */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Level Title, Difficulty & Time */}
        <div className="flex flex-col gap-1.5 pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-slate-900/90 border border-cyan-500/40 text-[11px] font-mono font-bold tracking-wider text-cyan-300 uppercase shadow-md">
              LVL {level.id} · {level.difficulty}
            </span>
            <span className="text-sm sm:text-base font-bold text-white tracking-tight drop-shadow-md">
              {level.title}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/60 px-3 py-1 rounded-xl shadow-lg w-fit">
            <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase">TIME</span>
            <span className="text-sm font-bold font-mono text-cyan-300 tabular-nums">{formatTime(timeSec)}</span>
            {bestTime !== undefined && (
              <span className="text-[10px] font-mono text-emerald-400 pl-1 border-l border-slate-700 tabular-nums">
                BEST: {formatTime(bestTime)}
              </span>
            )}
          </div>
        </div>

        {/* Center: Checkpoint Notification Toast */}
        {checkpointNotification && (
          <div className="absolute left-1/2 -translate-x-1/2 top-6 pointer-events-none animate-bounce">
            <div className="px-4 py-1.5 rounded-full bg-emerald-950/95 border border-emerald-400/80 text-emerald-200 text-xs font-mono font-bold tracking-wider shadow-2xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              {checkpointNotification} REACHED!
            </div>
          </div>
        )}

        {/* Right: Pickups Counter & Pause / Mute */}
        <div className="flex items-center gap-2.5 pointer-events-auto">
          {/* Gems counter */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-cyan-500/40 px-3 py-1.5 rounded-xl shadow-lg">
            <svg className="w-4 h-4 text-cyan-400 fill-cyan-400" viewBox="0 0 24 24">
              <polygon points="12,2 22,8.5 12,22 2,8.5" />
            </svg>
            <span className="text-xs font-bold font-mono text-cyan-200 tabular-nums">{gemsCount}</span>
          </div>

          {/* Coins counter */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-amber-500/40 px-3 py-1.5 rounded-xl shadow-lg">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-400 border border-amber-200 inline-block"></span>
            <span className="text-xs font-bold font-mono text-amber-200 tabular-nums">{coinsCount}</span>
          </div>

          {/* Audio Mute */}
          <button
            onClick={() => {
              sounds.playButtonClick();
              onToggleMute();
            }}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="w-9 h-9 rounded-xl bg-slate-900/90 border border-slate-700/60 hover:border-cyan-400/70 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Pause Button */}
          <button
            onClick={() => {
              sounds.playButtonClick();
              onPause();
            }}
            aria-label="Pause Game"
            className="w-9 h-9 rounded-xl bg-slate-900/90 border border-slate-700/60 hover:border-cyan-400/70 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
          >
            <Pause className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* Bottom Perimeter: Speed Indicator & Mobile Virtual Controls */}
      <div className="flex items-end justify-between w-full">
        {/* Speedometer (bottom-left) */}
        <div className="bg-slate-900/90 border border-slate-700/60 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 pointer-events-auto">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">SPEED</span>
          <span className="text-xs font-mono font-bold text-white tabular-nums">
            {Math.round(speed * 3.6)} <span className="text-[9px] text-slate-400 font-normal">KM/H</span>
          </span>
          <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-cyan-400 h-full transition-all duration-75"
              style={{ width: `${Math.min(100, (speed / 16) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Mobile / Touch Screen Controls */}
        {isTouchDevice && (
          <div className="flex items-end justify-between w-full absolute bottom-4 left-0 px-6 pointer-events-none">
            {/* Virtual Joystick */}
            <div
              ref={joystickRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="w-28 h-28 rounded-full bg-slate-900/80 border-2 border-cyan-400/40 relative flex items-center justify-center pointer-events-auto touch-none shadow-2xl active:border-cyan-400 cursor-grab active:cursor-grabbing"
            >
              <div
                className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 shadow-lg border border-cyan-200 pointer-events-none transition-transform duration-75"
                style={{ transform: `translate(${knobPos.x}px, ${knobPos.y}px)` }}
              ></div>
            </div>

            {/* Jump Button */}
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                onTouchInput(0, 0, true, true);
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                onTouchInput(0, 0, false, false);
              }}
              aria-label="Jump"
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 border-2 border-emerald-300 text-white font-bold flex flex-col items-center justify-center shadow-2xl active:scale-95 pointer-events-auto touch-none cursor-pointer"
            >
              <ArrowUp className="w-7 h-7" />
              <span className="text-[10px] font-mono tracking-wider">JUMP</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
