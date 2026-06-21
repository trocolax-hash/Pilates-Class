import React, { useState, useEffect, useRef } from "react";
import { PILATES_BLOCKS } from "../data/exercises";
import { playTibetanBowl, playTingshaChime } from "../utils/audio";
import { 
  X, 
  Hourglass, 
  ChevronRight, 
  Activity, 
  VolumeX, 
  Volume2, 
  Compass, 
  Flame, 
  Award,
  Info
} from "lucide-react";

interface PlayModeProps {
  className: string;
  selectedBlocks: { [blockId: number]: string[] };
  onStopClass: () => void;
}

export default function PlayMode({ className, selectedBlocks, onStopClass }: PlayModeProps) {
  // Playback timer states
  const [elapsed, setElapsed] = useState<number>(0); // 0 to 3600 seconds
  const [muted, setMuted] = useState<boolean>(false);

  // Keep track of audio notifications fired to prevent multiple triggers within the same second/frame
  const playedGongSecsGroup = useRef<Set<number>>(new Set());
  const playedChimeSecsGroup = useRef<Set<number>>(new Set());

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Configure continuous strict timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= 3600) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 3600;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Handle playing custom synthesized sound effects based on absolute seconds elapsed
  useEffect(() => {
    if (muted) return;

    const blockDuration = 600; // 10 minutes in seconds
    const transitionThreshold = 570; // 9 minutes 30 seconds

    // 1. GONG Sound trigger (at exactly 9m30s of each block)
    // Marks commencement of transition period for EACH block
    for (let b = 0; b < 6; b++) {
      const gongSecond = b * blockDuration + transitionThreshold;
      if (elapsed === gongSecond && !playedGongSecsGroup.current.has(gongSecond)) {
        playedGongSecsGroup.current.add(gongSecond);
        playTibetanBowl();
        console.log(`[Audio Event] Played transition Gong at ${formatTime(gongSecond)}`);
      }
    }

    // 2. CHIME Sound trigger (at exactly the start (0m0s) of blocks 2, 3, 4, 5, 6)
    // Marks commencement of exercise work period
    for (let b = 1; b < 6; b++) {
      const chimeSecond = b * blockDuration;
      if (elapsed === chimeSecond && !playedChimeSecsGroup.current.has(chimeSecond)) {
        playedChimeSecsGroup.current.add(chimeSecond);
        playTingshaChime();
        console.log(`[Audio Event] Played work Chime at ${formatTime(chimeSecond)}`);
      }
    }

    // 3. FINAL DOUBLE-GONG Sound trigger (at exactly 3600 seconds)
    // Marks complete ending
    const finalSecond = 3600;
    if (elapsed === finalSecond && !playedGongSecsGroup.current.has(finalSecond)) {
      playedGongSecsGroup.current.add(finalSecond);
      playTibetanBowl();
      setTimeout(() => playTibetanBowl(), 1200); // glorious double ring
      console.log(`[Audio Event] Played final double Gong`);
    }
  }, [elapsed, muted]);

  // Helper utility to format seconds -> MM:SS
  const formatTime = (secs: number): string => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // State calculations for current state
  const isCompleted = elapsed >= 3600;
  
  // Active block number (1 to 6)
  const currentBlockId = isCompleted ? 6 : Math.min(6, Math.floor(elapsed / 600) + 1);
  const currentBlockObj = PILATES_BLOCKS[currentBlockId - 1];

  // Exercises selected for current block
  const currentExercisesOfBlock = selectedBlocks[currentBlockId] || [];

  // Local seconds into the current 10-minute block (0 to 599)
  const localSeconds = isCompleted ? 600 : elapsed % 600;
  
  // Transition Phase checks (it's transition during the last 30 seconds of the block i.e. 570 - 599s)
  const isTransition = !isCompleted && localSeconds >= 570;
  const transitionCountdown = isTransition ? 600 - localSeconds : 0;

  // Next block identifier
  const nextBlockId = currentBlockId < 6 ? currentBlockId + 1 : null;
  const nextBlockObj = nextBlockId ? PILATES_BLOCKS[nextBlockId - 1] : null;
  const nextExercisesOfBlock = nextBlockId ? (selectedBlocks[nextBlockId] || []) : [];

  return (
    <div 
      id="play-mode-viewport"
      className={`w-full min-h-[82vh] rounded-3xl p-6 md:p-10 flex flex-col justify-between transition-all duration-700 select-none border ${
        isCompleted 
          ? "bg-[#141414] border-emerald-900 text-[#E0DCD4]"
          : isTransition
            ? "bg-gradient-to-b from-amber-955/40 via-[#141414] to-[#141414] text-[#E0DCD4] border-amber-900"
            : "bg-[#141414] text-[#E0DCD4] border-[#2A2A2A]"
      }`}
    >
      {/* 1. TOP HEADER: Global status, mute, exit */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-6 border-b border-[#2A2A2A]">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#A8B9A7] flex items-center gap-1.5 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-[#A8B9A7] animate-ping inline-block shrink-0"></span>
            CLASE DE PILATES ACTIVA
          </span>
          <h2 className="text-xl font-serif font-light italic text-white tracking-wide mt-1">
            {className || "Sesión de Pilates"}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Mute toggle */}
          <button
            onClick={() => setMuted(!muted)}
            className={`p-3 rounded-xl border transition-colors cursor-pointer ${
              muted 
                ? "bg-rose-950/20 border-rose-905 text-rose-400 hover:bg-rose-900/40" 
                : "bg-[#0F0F0F] border border-[#2A2A2A] text-[#E0DCD4] hover:bg-[#1A1A1A]"
            }`}
            title={muted ? "Activar avisos sonoros de gong" : "Silenciar avisos sonoros de gong"}
            id="btn-toggle-mute"
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-[#A8B9A7]" />}
          </button>

          {/* Continuous stopwatch style banner */}
          <div className="bg-[#0F0F0F] border border-[#2A2A2A] py-2.5 px-4 rounded-xl flex items-center gap-2">
            <Hourglass className="w-4 h-4 text-[#A8B9A7] animate-spin" style={{ animationDuration: '6s' }} />
            <span className="text-xs font-mono font-bold tracking-wide text-[#E0DCD4]">
              SIN PAUSA (60 MIN TOTAL)
            </span>
          </div>

          <button
            onClick={() => {
              if (confirm("¿Estás seguro de que deseas salir de la sesión? Perderás el progreso del tiempo actual.")) {
                onStopClass();
              }
            }}
            className="bg-[#0F0F0F] hover:bg-rose-950/40 hover:text-rose-400 border border-[#2A2A2A] text-[#E0DCD4]/80 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            id="btn-exit-play-mode"
          >
            <X className="w-4 h-4" />
            Salir de la Clase
          </button>
        </div>
      </div>

      {/* 2. TIMELINE COMPONENT (Progress of the 6 blocks) */}
      <div className="my-6 md:my-8" id="play-timeline">
        <div className="grid grid-cols-6 gap-2 text-[10px] md:text-xs font-bold tracking-wider mb-2 font-display">
          {PILATES_BLOCKS.map((block) => {
            const blockNum = block.id;
            const isBlockPast = blockNum < currentBlockId;
            const isBlockCurrent = blockNum === currentBlockId;
            
            return (
              <span 
                key={block.id} 
                className={`truncate ${
                  isBlockCurrent 
                    ? "text-[#A8B9A7] font-bold" 
                    : isBlockPast 
                      ? "text-[#E0DCD4]/40" 
                      : "text-[#E0DCD4]/20"
                }`}
              >
                B{blockNum}: {block.name.split(" ")[0]}
              </span>
            );
          })}
        </div>

        {/* Outer progress frame */}
        <div className="w-full h-3 md:h-4 bg-[#0F0F0F] rounded-full overflow-hidden flex gap-[2px] p-[2px] border border-[#2A2A2A]">
          {PILATES_BLOCKS.map((block) => {
            const blockNum = block.id;
            const isBlockPast = blockNum < currentBlockId;
            const isBlockCurrent = blockNum === currentBlockId;
            
            // Calculate segment internal progress fill percentage
            let fillPercent = 0;
            if (isBlockPast) {
              fillPercent = 100;
            } else if (isBlockCurrent) {
              // Current block progress from 0% to 100%
              fillPercent = (localSeconds / 600) * 100;
            }

            return (
              <div 
                key={block.id} 
                className="h-full flex-1 bg-[#141414] rounded-sm overflow-hidden"
              >
                <div 
                  className={`h-full transition-all duration-300 ${
                    isBlockCurrent 
                      ? isTransition 
                        ? "bg-amber-500 animate-pulse" 
                        : "bg-[#A8B9A7]" 
                      : "bg-[#A8B9A7]/40"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, fillPercent))}%` }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. CORE DISPLAY ENGINE (Radical screen changes based on state) */}
      <div className="flex-1 flex flex-col justify-center items-center text-center py-6 min-h-[300px]">
        {isCompleted ? (
          /* SESSION COMPLETED SCREEN */
          <div className="max-w-2xl flex flex-col items-center gap-6 py-10 animate-fade-in" id="completion-screen">
            <div className="w-20 h-20 bg-[#A8B9A7] rounded-full flex items-center justify-center text-[#0F0F0F] shadow-lg animate-bounce">
              <Award className="w-12 h-12" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-serif font-light italic tracking-tight text-white uppercase">
                ¡Clase Completada!
              </h1>
              <p className="text-[#A8B9A7] text-lg md:text-xl font-medium tracking-wide mt-3 font-sans">
                Excelente trabajo guiando los 60 minutos de sesión.
              </p>
              <p className="text-[#E0DCD4]/50 text-sm mt-4 leading-relaxed max-w-md mx-auto">
                Todos los bloques de Pilates han finalizado con absoluto rigor y control postural. Puedes volver al catálogo de diseño.
              </p>
            </div>
            <button
              onClick={onStopClass}
              className="mt-6 px-10 py-5 bg-[#A8B9A7] hover:bg-[#869885] text-[#0F0F0F] font-display font-semibold rounded-2xl tracking-widest text-sm uppercase shadow-xl hover:scale-[1.02] active:scale-95 transition-all cursor-pointer border-none"
            >
              Volver al Diseñador
            </button>
          </div>
        ) : isTransition ? (
          /* TRANSITION SCREEN: LAST 30 SECONDS OF A BLOCK */
          <div className="w-full flex flex-col items-center gap-8 justify-center animate-fade-in" id="transition-screen">
            {/* Luminous Shimmer Countdown */}
            <div className="relative flex flex-col items-center">
              <span className="text-[11px] uppercase tracking-widest font-black text-amber-400 bg-amber-950/20 border border-amber-900/40 px-4 py-1.5 rounded-full mb-3 pulse-active font-mono">
                PRÓXIMO INICIO EN AUDIO GONG
              </span>
              <div className="text-7xl md:text-9xl font-display font-black text-white mix-blend-difference tracking-tight select-none">
                {transitionCountdown}s
              </div>
              <p className="text-sm font-semibold tracking-wider text-amber-400 uppercase mt-2">
                Preparando siguiente bloque...
              </p>
            </div>

            {/* Next Block Exercise Highlight Card */}
            <div className="w-full max-w-4xl bg-[#0F0F0F]/80 border border-amber-900/45 backdrop-blur-md p-6 md:p-8 rounded-3xl shadow-2xl">
              <div className="flex flex-col items-center gap-2 mb-6">
                <span className="text-xs font-bold text-[#A8B9A7] uppercase tracking-widest">
                  SIGUIENTE EN MINUTO {(currentBlockId) * 10}
                </span>
                <h3 className="text-2xl md:text-4xl font-serif font-light italic text-white uppercase tracking-wide">
                  Bloque {nextBlockId}: {nextBlockObj?.name}
                </h3>
              </div>

              <p className="text-xs font-bold text-[#E0DCD4]/40 uppercase tracking-widest mb-4">
                Ejercicios del próximo bloque:
              </p>
              
              <div className="flex flex-wrap justify-center gap-3">
                {nextExercisesOfBlock.map((ex, idx) => (
                  <div 
                    key={ex}
                    className="bg-[#141414] border border-[#2A2A2A] px-5 py-3 rounded-2xl flex items-center gap-2 shadow-xs"
                  >
                    <span className="w-6 h-6 rounded-full bg-amber-950 text-amber-400 font-mono font-semibold text-xs flex items-center justify-center border border-amber-900">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-white uppercase tracking-wide">{ex}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* WORKOUT SCREEN: PRIMARY SELECTIONS DISPLAYED TO BE VIEWED FROM A DISTANCE */
          <div className="w-full flex flex-col items-center justify-center gap-6 animate-fade-in" id="workout-screen">
            {/* Round Block Marker */}
            <div className="flex items-center gap-2 bg-[#A8B9A7]/10 border border-[#A8B9A7]/20 px-4 py-1.5 rounded-full">
              <span className="w-2.5 h-2.5 rounded-full bg-[#A8B9A7] animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-widest text-[#A8B9A7] font-mono">
                BLOQUE {currentBlockId} DE 6
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-serif font-light italic leading-tight text-white uppercase max-w-5xl">
              {currentBlockObj?.name}
            </h1>

            {/* Huge exercises listing (Visible from meters away) */}
            <div className="w-full max-w-4xl flex flex-col gap-4 mt-6">
              {currentExercisesOfBlock.map((exercise, idx) => (
                <div
                  key={exercise}
                  className="bg-[#0F0F0F] border border-[#2A2A2A] hover:border-[#A8B9A7]/30 rounded-2xl p-5 md:p-6 text-left flex items-center gap-4 md:gap-6 shadow-xs hover:bg-[#1C1C1C] transition-all"
                >
                  {/* Huge numeric badge */}
                  <span className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-[#A8B9A7]/10 border border-[#A8B9A7]/20 text-[#A8B9A7] font-display font-bold text-xl md:text-3xl flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  
                  {/* Exercise Title */}
                  <div className="flex-1">
                    <span className="text-xl md:text-2xl font-display font-medium text-white uppercase tracking-normal font-sans">
                      {exercise}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. FOOTER CLOCKS & TIME DISPENSERS */}
      <div className="mt-8 pt-6 border-t border-[#2A2A2A] flex flex-col md:flex-row items-center justify-between gap-6 font-mono">
        {/* Left indicators: Block timer & total state */}
        <div className="flex items-center gap-6 text-center md:text-left">
          <div>
            <span className="text-[10px] text-[#E0DCD4]/45 uppercase tracking-widest block font-sans">
              TIEMPO EN ESTE BLOQUE
            </span>
            <span className="text-2xl md:text-3xl font-bold tracking-wider text-[#A8B9A7] mt-0.5 block">
              {formatTime(localSeconds)} / 10:00
            </span>
          </div>

          <div className="h-10 w-px bg-[#2A2A2A]"></div>

          <div>
            <span className="text-[10px] text-[#E0DCD4]/45 uppercase tracking-widest block font-sans">
              FASE DE BLOQUE
            </span>
            {isTransition ? (
              <span className="text-xs bg-amber-955/20 border border-amber-900/40 text-amber-400 font-bold px-2.5 py-1 rounded-md inline-block uppercase mt-1 animate-pulse">
                Transición
              </span>
            ) : (
              <span className="text-xs bg-emerald-955/20 border border-emerald-900/40 text-[#A8B9A7] font-bold px-2.5 py-1 rounded-md inline-block uppercase mt-1">
                Ejecución
              </span>
            )}
          </div>
        </div>

        {/* Right Indicators: Mega Countdown (Non-stop class timers) */}
        <div className="flex items-center gap-6 text-center md:text-right">
          <div>
            <span className="text-[10px] text-[#E0DCD4]/45 uppercase tracking-widest block font-sans">
              TRANSCURRIDO (60M)
            </span>
            <span className="text-3xl md:text-4xl font-black tracking-wider text-white mt-0.5 block">
              {formatTime(elapsed)}
            </span>
          </div>

          <div className="h-12 w-px bg-[#2A2A2A]"></div>

          <div>
            <span className="text-[10px] text-[#E0DCD4]/45 uppercase tracking-widest block font-sans">
              RESTANTE TOTAL
            </span>
            <span className="text-3xl md:text-4xl font-black tracking-wider text-[#A8B9A7] mt-0.5 block">
              {formatTime(3600 - elapsed)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
