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
  Info,
  Database
} from "lucide-react";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, deleteDoc, getDocs, orderBy, query } from "firebase/firestore";

// --- CONFIGURACIÓN DE FIREBASE ---
// Copia y pega tus credenciales de Firestore de la consola de Firebase aquí para guardar tus clases en la nube:
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// Comprobamos si las claves de Firebase están configuradas
const isFirebaseConfigured = !!(firebaseConfig.projectId && firebaseConfig.apiKey);

let app;
let db: any = null;

if (typeof window !== "undefined" && isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
  } catch (err) {
    console.error("No se pudo conectar con Firebase Firestore:", err);
  }
}

// Storage Key name for LocalStorage fallback
const LOCAL_STORAGE_KEY = "pilates-class-studio-saved";

export default function App() {
  const [mode, setMode] = useState<"setup" | "play">("setup");
  const [savedClasses, setSavedClasses] = useState<PilatesClass[]>([]);
  
  // Storage for the class being played
  const [activeSession, setActiveSession] = useState<{
    name: string;
    blocks: { [blockId: number]: string[] };
  } | null>(null);

  // Fallback function to load presets or items from LocalStorage
  const loadFromLocalStorage = () => {
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
      console.error("Local storage fallback loading failed:", e);
    }
  };

  // Initialize and load saved classes from Firestore or standard LocalStorage fallback
  useEffect(() => {
    if (db) {
      const loadFromFirestore = async () => {
        try {
          const q = query(collection(db, "classes"), orderBy("createdAt", "desc"));
          const snapshot = await getDocs(q);
          const classes: PilatesClass[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            classes.push({
              id: docSnap.id,
              name: data.name,
              blocks: data.blocks,
              createdAt: data.createdAt
            });
          });
          
          if (classes.length > 0) {
            setSavedClasses(classes);
          } else {
            // If Cloud DB is completely empty, populate with local default templates to provide instant beautiful onboarding
            loadFromLocalStorage();
          }
        } catch (err) {
          console.error("Error reading from Firestore:", err);
          loadFromLocalStorage();
        }
      };
      loadFromFirestore();
    } else {
      loadFromLocalStorage();
    }
  }, [db]);

  // Save class callback (sync to State, LocalStorage and Firestore cloud asynchronously if connected)
  const handleSaveClass = async (newClass: PilatesClass) => {
    // 1. Sync to local state and local storage immediately
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

    // 2. Clear async write to firestore
    if (db) {
      try {
        await setDoc(doc(db, "classes", newClass.id), {
          name: newClass.name,
          blocks: newClass.blocks,
          createdAt: newClass.createdAt
        });
        console.log(`Clase "${newClass.name}" guardada con éxito en Google Cloud Firestore.`);
      } catch (err) {
        console.error("Fallo al guardar en Firestore:", err);
      }
    }
  };

  // Delete class callback (sync deletions to State, LocalStorage and Firestore cloud asynchronously if connected)
  const handleDeleteClass = async (classId: string) => {
    // 1. Delete from local state and LocalStorage immediately
    setSavedClasses((prev) => {
      const updated = prev.filter((c) => c.id !== classId);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    // 2. Delete from Cloud
    if (db) {
      try {
        await deleteDoc(doc(db, "classes", classId));
        console.log(`Clase con ID ${classId} eliminada con éxito de Google Cloud Firestore.`);
      } catch (err) {
        console.error("Fallo al eliminar de Firestore:", err);
      }
    }
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
          <div className="flex flex-wrap items-center gap-3">
            {/* Database Sync Indicator */}
            {isFirebaseConfigured ? (
              <span className="text-[11px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-3 py-1 rounded-full flex items-center gap-1.5" title="Sincronizado en tiempo real con Google Cloud Firestore">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                Nube Activa (Firestore)
              </span>
            ) : (
              <span className="text-[11px] bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold px-3 py-1 rounded-full flex items-center gap-1.5" title="Guardando de forma local en tu navegador. Completa las credenciales del objeto 'firebaseConfig' en App.tsx para activar la base de datos de Google Cloud en producción.">
                <Database className="w-3.5 h-3.5 text-amber-500" />
                Almacenamiento Local (Modo Sandbox)
              </span>
            )}

            <div className="h-4 w-px bg-[#2A2A2A] hidden sm:block"></div>

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
