import React, { useState, useEffect } from "react";
import SetupMode from "./components/SetupMode";
import PlayMode from "./components/PlayMode";
import Footer from "./components/Footer";
import { PilatesClass } from "./types";
import { 
  Compass, 
  Layers, 
  HelpCircle, 
  Activity, 
  Sparkles,
  Info
} from "lucide-react";

// Storage Key name
const LOCAL_STORAGE_KEY = "pilates-class-studio-saved";

export default function App() {
  const [mode, setMode] = useState<"setup" | "play">("setup");
  const [savedClasses, setSavedClasses] = useState<PilatesClass[]>([]);
  
  // Storage for the class being played
  const [activeSession, setActiveSession] = useState<{
    name: string;
    blocks: { [blockId: number]: string[] };
  } | null>(null);

  // Initialize and load saved classes from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setSavedClasses(JSON.parse(stored));
      } else {
        // Prepopulate with elegant realistic Pilates presets on first visit to showcase loading capabilities
        const defaultDemos: PilatesClass[] = [
          {
            id: "preset-flow-esencial",
            name: "Pilates Flow Esencial (Demo)",
            blocks: {
              1: ["FIVE POINTS", "PELVIS NEUTRA", "ESCAPULAS ENCAJADAS", "BREATHING EXERCISES"],
              2: ["2 HUNDRED", "2 ROLL UP", "SINGLE LEG CIRCLES"],
              3: ["CHEST LIFT", "1 HUNDRED", "3 ROLL UP"],
              4: ["1 ROLL UP", "SPINE STRETCH", "SPINE TWIST"],
              5: ["1 SIDE KICK", "2 HAMSTREAM PULL", "2 ONE LEG KICK"],
              6: ["1 ONE LEG KICK", "DOUBLE LEG KICK", "SWIMMING"]
            },
            createdAt: new Date(Date.now() - 86400000).toISOString() // yesterday
          },
          {
            id: "preset-core-cardio",
            name: "Core Intensity Challenge (Demo)",
            blocks: {
              1: ["HALF SQUAT DOWN & FULL SQUAT DOWN", "WARM UP SQUAT", "BICYCLE LEGS"],
              2: ["2 PLANK (ADAP)", "4 LEG PULL(ADAP)", "4 SIDE PLANK WITH LEG LIFT"],
              3: ["1 HUNDRED", "DOUBLE LEG STRETCH", "1 CRISS CROSS", "3 PLANKS"],
              4: ["2 CRISS CROSS", "2 CORSCREW", "1 SIDE BEND", "1 KNEELING SIDE KICK"],
              5: ["2 LEG PULL FRONT", "3 SIDE BEND", "2 SIDE PLANK WITH LEG LIFT"],
              6: ["SWIMMING", "1 PLANK SERIES", "5 PLANK WITH LEG LIFT"]
            },
            createdAt: new Date().toISOString()
          }
        ];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultDemos));
        setSavedClasses(defaultDemos);
      }
    } catch (e) {
      console.error("Failed to parse stored sessions:", e);
    }
  }, []);

  // Save class callback
  const handleSaveClass = (newClass: PilatesClass) => {
    setSavedClasses((prev) => {
      // If it exists, replace it, otherwise append
      const exists = prev.some((c) => c.id === newClass.id);
      let updated: PilatesClass[];
      if (exists) {
        updated = prev.map((c) => (c.id === newClass.id ? newClass : c));
      } else {
        updated = [newClass, ...prev];
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Delete class callback
  const handleDeleteClass = (classId: string) => {
    setSavedClasses((prev) => {
      const updated = prev.filter((c) => c.id !== classId);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Triggering the active playback mode
  const handleStartClass = (className: string, selectedBlocks: { [blockId: number]: string[] }) => {
    setActiveSession({
      name: className,
      blocks: selectedBlocks
    });
    setMode("play");
    // Request permission for Web Audio API if any context was blocked
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Escaping the active playback mode back to editor
  const handleStopClass = () => {
    setMode("setup");
    setActiveSession(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#E0DCD4] flex flex-col justify-between" id="app-root-container">
      
      {/* 1. TOP PREMIUM HEADER */}
      <header className="w-full bg-[#141414] border-b border-[#2A2A2A] py-4 px-4 md:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand Frame */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0F0F0F] border border-[#2A2A2A] flex items-center justify-center text-[#A8B9A7] shadow-md">
              <Compass className="w-5 h-5 text-[#A8B9A7] stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-display font-black text-lg md:text-xl text-white tracking-widest uppercase">
                  PILATES CLASS STUDIO
                </h1>
                <span className="text-[9px] bg-[#A8B9A7]/15 text-[#A8B9A7] font-bold px-2 py-0.5 rounded-sm tracking-widest font-mono uppercase">
                  PRO
                </span>
              </div>
              <p className="text-[10px] md:text-xs text-[#E0DCD4]/50 font-medium tracking-wider">
                Diseñador de Sesiones Rítmicas & Reproducción Estricta
              </p>
            </div>
          </div>

          {/* Quick status bar */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#E0DCD4]/60">
              Estado:
            </span>
            {mode === "setup" ? (
              <span className="text-xs bg-[#A8B9A7]/10 border border-[#A8B9A7]/20 text-[#A8B9A7] font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Modo Edición (Setup)
              </span>
            ) : (
              <span className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-3 py-1 rounded-full flex items-center gap-1.5 pulse-active">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                Reproductor Activo (Play)
              </span>
            )}
          </div>
        </div>
      </header>

      {/* 2. DYNAMIC WORKSPACE CONTENT */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8">
        
        {/* Short introduction header during designer mode */}
        {mode === "setup" && (
          <div className="mb-8 bg-[#141414] border border-[#2A2A2A] p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <h2 className="text-lg font-serif font-light italic text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#A8B9A7]" />
                Configurador de Clases de Pilates de 60 Minutos
              </h2>
              <p className="text-xs text-[#E0DCD4]/70 mt-1 leading-relaxed">
                Establece la dosificación perfecta. Diseña tu clase seleccionando entre **2 y 4 ejercicios** de Pilates tradicional para cada uno de los 6 bloques cronometrados. Una vez finalices, haz clic en **INICIAR CLASE** para activar el panel optimizado.
              </p>
            </div>
            
            <div className="bg-[#0F0F0F] px-4 py-3 rounded-xl border border-[#2A2A2A] text-xs text-[#E0DCD4]/85 flex items-start gap-2 max-w-xs shadow-xs">
              <Info className="w-4 h-4 text-[#A8B9A7] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5 text-white">Metodología 6x10:</span>
                Cada bloque dura exactamente 10 minutos (9:30 de ejecución + 30 segundos de transición estricta).
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Display */}
        {mode === "setup" ? (
          <SetupMode 
            onStartClass={handleStartClass}
            savedClasses={savedClasses}
            onSaveClass={handleSaveClass}
            onDeleteClass={handleDeleteClass}
          />
        ) : (
          activeSession && (
            <PlayMode 
              className={activeSession.name}
              selectedBlocks={activeSession.blocks}
              onStopClass={handleStopClass}
            />
          )
        )}
      </main>

      {/* 3. HARDCODED MANDATORY FOOTER */}
      <Footer />
    </div>
  );
}
