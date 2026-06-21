import React, { useState, useEffect } from "react";
import { PILATES_BLOCKS } from "../data/exercises";
import { PilatesClass } from "../types";
import { playTibetanBowl } from "../utils/audio";
import { 
  Play, 
  Save, 
  Trash2, 
  Layers, 
  CheckCircle, 
  AlertTriangle, 
  Download, 
  FileEdit, 
  Volume2, 
  BookOpen,
  RotateCcw,
  Check,
  Plus,
  Printer
} from "lucide-react";

interface SetupModeProps {
  onStartClass: (className: string, selectedBlocks: { [blockId: number]: string[] }) => void;
  savedClasses: PilatesClass[];
  onSaveClass: (newClass: PilatesClass) => void;
  onDeleteClass: (classId: string) => void;
}

export default function SetupMode({ 
  onStartClass, 
  savedClasses, 
  onSaveClass, 
  onDeleteClass 
}: SetupModeProps) {
  // Local states for the designer
  const [className, setClassName] = useState<string>("Mi Clase de Pilates");
  
  // Selected exercises per block: blockId -> array of exercise names
  const [selectedExercises, setSelectedExercises] = useState<{ [blockId: number]: string[] }>({
    1: ["FIVE POINTS", "PELVIS NEUTRA", "ESCAPULAS ENCAJADAS"],
    2: ["2 HUNDRED", "2 ROLL UP", "SINGLE LEG CIRCLES"],
    3: ["CHEST LIFT", "1 HUNDRED", "3 ROLL UP"],
    4: ["1 ROLL UP", "2 ROLLING LIKE A BALL", "SPINE STRETCH"],
    5: ["1 SIDE KICK", "2 HAMSTREAM PULL", "2 ONE LEG KICK"],
    6: ["1 ONE LEG KICK", "DOUBLE LEG KICK", "SWIMMING"]
  });

  const [activeTab, setActiveTab] = useState<number>(1); // Active editing block tab
  const [selectedLoadedClassId, setSelectedLoadedClassId] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Determine if a single block is valid (min 2, max 4)
  const isBlockValid = (blockId: number): boolean => {
    const count = selectedExercises[blockId]?.length || 0;
    return count >= 2 && count <= 4;
  };

  // Determine if all blocks in the class are valid
  const isClassValid = (): boolean => {
    return PILATES_BLOCKS.every(block => isBlockValid(block.id));
  };

  // Toggle selection of an exercise inside a block
  const handleToggleExercise = (blockId: number, exercise: string) => {
    const currentList = selectedExercises[blockId] || [];
    if (currentList.includes(exercise)) {
      // Remove it
      setSelectedExercises(prev => ({
        ...prev,
        [blockId]: currentList.filter(item => item !== exercise)
      }));
    } else {
      // Add it only if we have less than 4, otherwise can't add (alert user)
      if (currentList.length >= 4) {
        setErrorMessage(`El bloque ${blockId} ya tiene el máximo de 4 ejercicios.`);
        setTimeout(() => setErrorMessage(""), 4000);
        return;
      }
      setSelectedExercises(prev => ({
        ...prev,
        [blockId]: [...currentList, exercise]
      }));
    }
  };

  // Load a class
  const handleLoadClass = (classId: string) => {
    if (!classId) return;
    const found = savedClasses.find(c => c.id === classId);
    if (found) {
      setClassName(found.name);
      setSelectedExercises(found.blocks);
      setSelectedLoadedClassId(classId);
    }
  };

  // Save the current configuration to local storage
  const handleSaveClass = () => {
    if (!className.trim()) {
      setSaveStatus("error");
      setErrorMessage("Por favor, introduce un nombre para la clase.");
      setTimeout(() => setSaveStatus("idle"), 3000);
      return;
    }

    if (!isClassValid()) {
      setSaveStatus("error");
      setErrorMessage("La clase no se puede guardar. Todos los bloques deben tener entre 2 y 4 ejercicios.");
      setTimeout(() => setSaveStatus("idle"), 4000);
      return;
    }

    const newClass: PilatesClass = {
      id: selectedLoadedClassId || "class-" + Date.now(),
      name: className.trim(),
      blocks: selectedExercises,
      createdAt: new Date().toISOString()
    };

    onSaveClass(newClass);
    setSaveStatus("success");
    setSelectedLoadedClassId(newClass.id);
    setTimeout(() => setSaveStatus("idle"), 3000);
  };

  // Load demo presets
  const handleLoadPreset = (presetType: "basico" | "intermedio" | "avanzado") => {
    let preset: { [blockId: number]: string[] } = {};
    if (presetType === "basico") {
      setClassName("Clase de Pilates - Nivel Inicial");
      preset = {
        1: ["FIVE POINTS", "PELVIS NEUTRA", "ESCAPULAS ENCAJADAS", "BREATHING EXERCISES"],
        2: ["ABD. ADD. HIP", "FLEX-EXT HIP", "2 ROLL UP"],
        3: ["CHEST LIFT", "1 ONE LEG STRETCH", "1 ROLLING LIKE A BALL"],
        4: ["1 ROLL UP", "SPINE STRETCH", "SPINE TWIST"],
        5: ["1 SIDE KICK", "2 KNEELING SIDE KICK"],
        6: ["1 ONE LEG KICK", "SWAN DIVE", "SCARECROW"]
      };
    } else if (presetType === "intermedio") {
      setClassName("Sesión Pilates Control & Fluidez");
      preset = {
        1: ["GENERAL WARM UP CERVICAL", "HALF SQUAT DOWN & FULL SQUAT DOWN", "ARM ARCS", "ROLL DOWN"],
        2: ["2 HUNDRED", "SINGLE LEG CIRCLES", "2 MAIN SECTIONS", "2 PELVIS CURL"].map(e => e.includes("MAIN") ? "2 PLANK (ADAP)" : e),
        3: ["CHEST LIFT", "1 HUNDRED", "DOUBLE LEG STRETCH", "1 CRISS CROSS"],
        4: ["2 ROLLING LIKE A BALL", "2 CRISS CROSS", "SAW", "1 MERMAID"],
        5: ["2 HAMSTREAM PULL", "2 LEG PULL", "3 SIDE BEND"],
        6: ["DOUBLE LEG KICK", "SWIMMING", "1 PUSH UP UPPER BACK", "3 SIDE TWIST"]
      };
      // fallback overrides for non-matching strings
      preset[2] = ["2 HUNDRED", "SINGLE LEG CIRCLES", "2 PLANK (ADAP)", "2 PELVIS CURL"];
    } else {
      setClassName("Clase de Pilates - Desafío Avanzado");
      preset = {
        1: ["BENT KNEE HIP RAISE- PREP. ROLL OVER", "DOUBLE LEG HEEL RAISE (PUNTILLAS)", "BALANCING SERIES", "BICYCLE LEGS"],
        2: ["3 OPEN LEG ROCKER (ADAP)", "2 JACK KNIFE (ADAP)", "4 LEG PULL(ADAP)", "4 SIDE PLANK WITH LEG LIFT"],
        3: ["1 TEASER", "1 ROLL OVER", "1 CORSCREW", "3 SIDE PLANK WITH LEG LIFT"],
        4: ["3 SCISSORS", "3 BICYCLE", "1 KNEELING SIDE KICK", "1SIDE TWIST"],
        5: ["4 CONTROL BALANCE", "SIDE LEG LIFT A) UP & DOWN B) CIRCLES C) BALET D) DOBLE PATADA E) SUBIR INF. F) FLEX-EXT. G) ABD. ADD.", "2 SIDE PLANK WITH LEG LIFT"],
        6: ["SWIMMING", "1 LEG PULL", "1 PLANK SERIES", "5 PLANK WITH LEG LIFT"]
      };
    }
    setSelectedExercises(preset);
  };

  // Handle resetting selections
  const handleReset = () => {
    if (confirm("¿Estás seguro de que deseas vaciar todas las selecciones?")) {
      setSelectedExercises({
        1: [], 2: [], 3: [], 4: [], 5: [], 6: []
      });
      setClassName("Nueva Clase Vacía");
      setSelectedLoadedClassId("");
    }
  };

  return (
    <div className="w-full flex flex-col gap-6" id="setup-mode">
      {/* Upper Control Bar */}
      <div className="bg-[#141414] p-6 rounded-2xl border border-[#2A2A2A] shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 transition-all duration-300">
        <div className="flex-1 flex flex-col gap-2">
          <label className="text-xs font-semibold tracking-wider text-[#E0DCD4]/50 uppercase" htmlFor="class-name-input">
            Nombre de la Sesión
          </label>
          <div className="relative flex items-center">
            <FileEdit className="absolute left-3 w-5 h-5 text-[#A8B9A7]" />
            <input
              id="class-name-input"
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full bg-[#0F0F0F] pl-11 pr-4 py-3 rounded-xl border border-[#2A2A2A] focus:border-[#A8B9A7] focus:outline-hidden text-white font-semibold text-lg transition-colors placeholder-[#E0DCD4]/30"
              placeholder="Ej. Clase Mañana Control"
            />
          </div>
        </div>

        {/* Saved Session Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <div className="flex flex-col gap-2 flex-1 sm:w-60">
            <label className="text-xs font-semibold tracking-wider text-[#E0DCD4]/50 uppercase" htmlFor="saved-classes-select">
              Cargar Clase Guardada
            </label>
            <div className="relative">
              <select
                id="saved-classes-select"
                value={selectedLoadedClassId}
                onChange={(e) => handleLoadClass(e.target.value)}
                className="w-full bg-[#0F0F0F] pl-4 pr-10 py-3.5 rounded-xl border border-[#2A2A2A] focus:border-[#A8B9A7] focus:outline-hidden text-sm text-[#E0DCD4] font-medium cursor-pointer"
              >
                <option value="">-- Seleccionar Clase --</option>
                {savedClasses.map((item) => (
                  <option key={item.id} value={item.id} className="bg-[#141414]">
                    {item.name} ({new Date(item.createdAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-stretch gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-3.5 rounded-xl bg-[#1C1C1C] hover:bg-[#2C2C2C] text-[#E0DCD4] hover:text-white border border-[#2A2A2A] hover:border-[#A8B9A7]/40 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
              title="Imprimir el Plan de la Clase / Guardar como PDF"
              id="btn-print-class"
            >
              <Printer className="w-4 h-4 text-[#A8B9A7]" />
              <span>Imprimir Plan</span>
            </button>

            <button
              onClick={handleSaveClass}
              className={`px-5 py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 ${
                saveStatus === "success" 
                  ? "bg-emerald-600 text-white border border-emerald-500" 
                  : "bg-[#A8B9A7] hover:bg-[#869885] text-[#0F0F0F]"
              }`}
              title="Guardar esta clase para tu próximo uso"
              id="btn-save-class"
            >
              <Save className="w-4 h-4" />
              {saveStatus === "success" ? "¡Guardado!" : "Guardar"}
            </button>

            {selectedLoadedClassId && (
              <button
                onClick={() => {
                  if (confirm("¿Seguro que deseas eliminar esta clase de tu catálogo?")) {
                    onDeleteClass(selectedLoadedClassId);
                    setSelectedLoadedClassId("");
                    setClassName("Mi Clase de Pilates");
                  }
                }}
                className="px-4 py-3.5 rounded-xl bg-rose-950/20 border border-rose-900 text-rose-400 hover:bg-rose-900/35 cursor-pointer transition-colors"
                title="Eliminar clase seleccionada"
                id="btn-delete-class"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preset Fast Actions */}
      <div className="bg-[#141414] px-6 py-4 rounded-xl border border-[#2A2A2A] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#A8B9A7]" />
          <span className="text-sm font-medium text-[#E0DCD4]/75">
            ¿Comenzar rápido? Selecciona un programa predefinido:
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => handleLoadPreset("basico")}
            className="px-3.5 py-1.5 bg-[#0F0F0F] hover:bg-[#2A2A2A] border border-[#2A2A2A] rounded-lg text-xs font-semibold text-[#E0DCD4] uppercase tracking-wider cursor-pointer transition-all"
          >
            Nivel Básico
          </button>
          <button
            onClick={() => handleLoadPreset("intermedio")}
            className="px-3.5 py-1.5 bg-[#0F0F0F] hover:bg-[#2A2A2A] border border-[#2A2A2A] rounded-lg text-xs font-semibold text-[#E0DCD4] uppercase tracking-wider cursor-pointer transition-all"
          >
            Nivel Medio
          </button>
          <button
            onClick={() => handleLoadPreset("avanzado")}
            className="px-3.5 py-1.5 bg-[#0F0F0F] hover:bg-[#2A2A2A] border border-[#2A2A2A] rounded-lg text-xs font-semibold text-[#E0DCD4] uppercase tracking-wider cursor-pointer transition-all"
          >
            Avanzado / PRO
          </button>
          <div className="h-6 w-px bg-[#2A2A2A] mx-1 hidden sm:block"></div>
          <button
            onClick={handleReset}
            className="px-3.5 py-1.5 bg-rose-950/20 hover:bg-rose-900/35 border border-rose-900/40 rounded-lg text-xs font-semibold text-rose-400 uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1 ml-auto md:ml-0"
          >
            <RotateCcw className="w-3 h-3" />
            Limpiar Todo
          </button>
        </div>
      </div>

      {/* Global Class Alerts / Messages */}
      {errorMessage && (
        <div className="bg-rose-950/20 border border-rose-900 text-rose-300 p-4 rounded-xl flex items-start gap-3 text-sm animate-fade-in" id="setup-error-alert">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Requisitos de validación</p>
            <p className="opacity-95">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Designer Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Blocks Overview & Validation */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          <div className="bg-[#141414] p-6 rounded-2xl border border-[#2A2A2A] shadow-xs">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#E0DCD4]/40 mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#A8B9A7]" />
              Estructura de Bloques (60 min)
            </h2>

            <div className="flex flex-col gap-3">
              {PILATES_BLOCKS.map((block) => {
                const count = selectedExercises[block.id]?.length || 0;
                const isValid = isBlockValid(block.id);
                const isActive = activeTab === block.id;

                return (
                  <button
                    key={block.id}
                    onClick={() => setActiveTab(block.id)}
                    className={`w-full p-4 rounded-xl border text-left flex items-start justify-between gap-4 transition-all duration-200 cursor-pointer ${
                      isActive 
                        ? "bg-[#A8B9A7]/10 border-[#A8B9A7] ring-1 ring-[#A8B9A7]" 
                        : "bg-[#0F0F0F] hover:bg-[#1A1A1A] border-[#2A2A2A]"
                    }`}
                    id={`block-tab-button-${block.id}`}
                  >
                    <div className="flex gap-3">
                      <span className="w-7 h-7 rounded-lg bg-[#2A2A2A] text-[#E0DCD4] font-display font-medium text-xs flex items-center justify-center shrink-0 border border-[#3A3A3A]">
                        B{block.id}
                      </span>
                      <div>
                        <p className="font-display font-semibold text-sm text-white tracking-wide">
                          {block.name}
                        </p>
                        <p className="text-xs text-[#E0DCD4]/50 font-medium mt-1">
                          Duración: 10 min (9:30 Ejec. + 30s Trans.)
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selectedExercises[block.id]?.map((ex, i) => (
                            <span key={i} className="text-[10px] bg-[#141414] border border-[#2A2A2A] text-[#E0DCD4]/90 px-2 py-0.5 rounded-full">
                              {ex}
                            </span>
                          ))}
                          {count === 0 && (
                            <span className="text-[10px] italic text-rose-400">Ninguno seleccionado</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1">
                      {isValid ? (
                        <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded-md text-xs font-semibold border border-emerald-900/40">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Listo ({count})</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-amber-400 bg-amber-950/20 px-2 py-0.5 rounded-md text-xs font-semibold border border-amber-900/40">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{count === 0 ? "Vacío" : `${count} ejerc.`} (2-4)</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Test Audio utilities inside the side panel */}
            <div className="mt-6 pt-5 border-t border-[#2A2A2A] flex items-center justify-between gap-4">
              <div className="text-xs text-[#E0DCD4]/50 pr-4">
                <p className="font-semibold text-[#E0DCD4]/75">Audio Guía</p>
                Asegúrate de tener el audio activo para reproducir los avisos (gong/campanas).
              </div>
              <button
                onClick={playTibetanBowl}
                className="shrink-0 bg-[#0F0F0F] hover:bg-[#A8B9A7]/15 text-[#E0DCD4] py-2 px-3.5 rounded-xl border border-[#2A2A2A] text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                title="Prueba el hermoso sonido de cuenco tibetano"
              >
                <Volume2 className="w-4 h-4 text-[#A8B9A7]" />
                Probar Gong
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Exercise Pool for Active Block */}
        <div className="xl:col-span-7 flex flex-col gap-4">
          {PILATES_BLOCKS.map((block) => {
            if (block.id !== activeTab) return null;
            const currentSelected = selectedExercises[block.id] || [];
            const count = currentSelected.length;
            const isValid = isBlockValid(block.id);

            return (
              <div key={block.id} className="bg-[#141414] p-6 rounded-2xl border border-[#2A2A2A] shadow-xs">
                {/* Block Header Information */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#2A2A2A] mb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-[#2A2A2A] text-[#E0DCD4] rounded-md border border-[#3A3A3A]">
                        Bloque {block.id} de 6
                      </span>
                      <span className="text-xs text-[#E0DCD4]/50 font-medium">60 min totals</span>
                    </div>
                    <h3 className="text-xl font-display font-bold text-white mt-1 tracking-wide">
                      {block.name}
                    </h3>
                  </div>

                  {/* Block Selection Validation Badge */}
                  <div>
                    {isValid ? (
                      <div className="flex items-center gap-2 text-emerald-400 bg-emerald-950/20 border border-emerald-900/40 px-3 py-1.5 rounded-xl text-xs font-semibold">
                        <Check className="w-4 h-4" />
                        Validación Cumplida ({count} de 4)
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-400 bg-amber-950/20 border border-amber-900/40 px-3 py-1.5 rounded-xl text-xs font-semibold">
                        <AlertTriangle className="w-4 h-4" />
                        Obligatorio: Seleccionar de 2 a 4 ({count} actuales)
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Exercise Pills for quick overview */}
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#E0DCD4]/50 mb-3">
                    Ejercicios elegidos en este bloque
                  </p>
                  {currentSelected.length === 0 ? (
                    <div className="bg-[#0F0F0F] p-4 rounded-xl text-center text-xs text-[#E0DCD4]/40 border border-dashed border-[#2A2A2A] font-medium">
                      Ningún ejercicio seleccionado. Haz clic en las tarjetas de abajo para añadir.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {currentSelected.map((ex, idx) => (
                        <div
                          key={ex}
                          className="px-3 py-2 bg-[#A8B9A7] text-[#0F0F0F] text-xs font-semibold rounded-xl flex items-center gap-2 border border-[#A8B9A7] hover:bg-rose-950 hover:border-rose-900 hover:text-white group transition-all cursor-pointer"
                          onClick={() => handleToggleExercise(block.id, ex)}
                          title="Haz clic para quitar de la selección"
                        >
                          <span className="w-4 h-4 rounded-full bg-[#0F0F0F]/20 text-[#0F0F0F] group-hover:text-white text-[10px] flex items-center justify-center font-mono">
                            {idx + 1}
                          </span>
                          <span className="tracking-wide">{ex}</span>
                          <span className="text-[#0F0F0F]/60 group-hover:text-red-300 text-xs font-bold font-mono ml-1">
                            &times;
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pool of all available exercises */}
                <div>
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#E0DCD4]/50">
                      Selecciona de la base de datos de ejercicios del Bloque {block.id}
                    </p>
                    <span className="text-[11px] text-[#E0DCD4]/40 font-medium">
                      {block.allExercises.length} disponibles
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {block.allExercises.map((exercise) => {
                      const isSelected = currentSelected.includes(exercise);

                      return (
                        <button
                          key={exercise}
                          onClick={() => handleToggleExercise(block.id, exercise)}
                          className={`p-3.5 rounded-xl border text-left text-xs font-medium flex items-center justify-between gap-3 transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? "bg-[#A8B9A7]/10 border-[#A8B9A7] text-white font-semibold shadow-xs"
                              : "bg-[#0F0F0F] hover:bg-[#1A1A1A] hover:border-[#3A3A3A] border-[#2A2A2A] text-[#E0DCD4]/85"
                          }`}
                          id={`exercise-picker-${exercise}`}
                        >
                          <span className="tracking-wide text-left">{exercise}</span>
                          <span className="shrink-0">
                            {isSelected ? (
                              <div className="w-5 h-5 rounded-full bg-[#A8B9A7] text-[#0F0F0F] flex items-center justify-center">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-[#0F0F0F] border border-[#2A2A2A] text-[#E0DCD4]/40 hover:text-[#A8B9A7] flex items-center justify-center">
                                <Plus className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gigantic Premium START CLASS Button Area */}
      <div className="bg-[#141414] p-8 rounded-2xl border border-[#2A2A2A] shadow-xs flex flex-col items-center justify-center text-center gap-6 mt-2">
        <div className="max-w-xl">
          <h3 className="text-2xl font-serif font-light italic text-white tracking-wide">
            ¿Preparada la clase?
          </h3>
          <p className="text-sm text-[#E0DCD4]/75 mt-2">
            Al iniciar, la aplicación entrará en el <span className="font-semibold text-white">Modo Reproducción</span>. La interfaz se optimizará radicalmente para proyectores o tablets distantes, ejecutando el temporizador sin interrupciones durante 60 minutos con avisos acústicos de cuencos tibetanos.
          </p>
        </div>

        {isClassValid() ? (
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <button
              onClick={() => onStartClass(className, selectedExercises)}
              className="w-full sm:w-80 h-20 rounded-3xl bg-[#A8B9A7] hover:bg-[#869885] hover:scale-[1.01] text-[#0F0F0F] font-display font-bold text-xl uppercase tracking-widest flex items-center justify-center gap-4 shadow-xl select-none hover:shadow-2xl transition-all duration-300 cursor-pointer active:scale-95 animate-fade-in"
              id="btn-start-class-giant"
            >
              <Play className="w-6 h-6 fill-current text-[#0F0F0F]" />
              <span>Iniciar Clase</span>
            </button>
            
            <button
              onClick={() => window.print()}
              className="w-full sm:w-64 h-20 rounded-3xl bg-[#1C1C1C] hover:bg-[#2C2C2C] border border-[#2A2A2A] hover:border-[#A8B9A7]/55 text-white font-display font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-3 transition-all duration-300 cursor-pointer active:scale-95"
              title="Obtén una copia impresa o PDF de tu clase"
              id="btn-print-class-giant"
            >
              <Printer className="w-5 h-5 text-[#A8B9A7]" />
              <span>Imprimir Ficha</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <button
              disabled
              className="w-full sm:w-80 h-20 rounded-3xl bg-[#2A2A2A] text-[#E0DCD4]/40 border border-[#3A3A3A] font-display font-bold text-xl uppercase tracking-widest flex items-center justify-center gap-4 cursor-not-allowed"
              id="btn-start-class-disabled"
            >
              <Play className="w-6 h-6 text-[#E0DCD4]/40" />
              <span>Clase No Válida</span>
            </button>
            <p className="text-xs text-rose-400 font-semibold flex items-center gap-1.5 bg-rose-950/20 border border-rose-900/40 px-4 py-2 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
              Debes asegurar que cada uno de los 6 bloques tenga entre 2 y 4 ejercicios seleccionados.
            </p>
          </div>
        )}
      </div>

      {/* ----------------- SECCIÓN DE IMPRESIÓN (OCULTA EN PANTALLA, ACTIVA EN PDF/IMPRESORA) ----------------- */}
      <div id="print-root" className="hidden print:block p-8 bg-white text-black font-sans leading-relaxed">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden !important;
            }
            #print-root, #print-root * {
              visibility: visible !important;
            }
            #print-root {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              background: white !important;
              color: black !important;
              padding: 40px 20px !important;
              box-sizing: border-box !important;
            }
            .print-header {
              border-bottom: 2px solid #111 !important;
              padding-bottom: 12px !important;
              margin-bottom: 24px !important;
            }
            .print-grid {
              display: grid !important;
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              gap: 20px !important;
            }
            .print-block-card {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              border: 1px solid #ddd !important;
              border-radius: 8px !important;
              padding: 16px !important;
              background: #fafafa !important;
            }
          }
        `}} />

        <div className="print-header flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 font-serif">
              {className}
            </h1>
            <p className="text-xs text-neutral-500 font-medium mt-1">
              Pilates Class Studio • Planificación Completa de Sesión (60 min)
            </p>
          </div>
          <div className="text-right text-xs text-neutral-400">
            <p>Fecha de Impresión: {new Date().toLocaleDateString()}</p>
            <p className="font-semibold text-neutral-600 mt-0.5">Instructor: ____________________</p>
          </div>
        </div>

        {/* Exercises Grid for Print */}
        <div className="print-grid grid grid-cols-2 gap-5 mt-6">
          {PILATES_BLOCKS.map((block) => {
            const exercises = selectedExercises[block.id] || [];
            return (
              <div key={block.id} className="print-block-card border border-neutral-200 rounded-lg p-5 bg-neutral-50/50">
                <div className="flex justify-between items-start border-b border-neutral-200 pb-2 mb-3">
                  <h3 className="font-serif font-bold text-base text-neutral-800">
                    B{block.id}. {block.name}
                  </h3>
                  <span className="text-[11px] font-sans font-bold uppercase tracking-wider bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded">
                    10 Min
                  </span>
                </div>
                
                <p className="text-[11px] text-neutral-400 italic mb-3">
                  Estructura: 9:30 Ejecución + 30s Transición
                </p>

                {exercises.length === 0 ? (
                  <p className="text-xs text-neutral-400 italic font-medium py-1">
                    (Ningún ejercicio seleccionado para este bloque)
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {exercises.map((ex, idx) => (
                      <li key={ex} className="text-xs text-neutral-800 font-medium flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full border border-neutral-300 text-[10px] text-neutral-600 font-mono font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="truncate">{ex}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Notes box */}
                <div className="mt-4 pt-3 border-t border-dashed border-neutral-300">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400 mb-1">
                    Anotaciones / Cues:
                  </p>
                  <div className="h-10 border border-neutral-200 rounded-md border-dotted bg-white"></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Global Notes */}
        <div className="mt-8 p-5 border border-neutral-200 rounded-lg bg-neutral-50">
          <p className="text-xs uppercase tracking-widest font-bold text-neutral-500 mb-2">
            Notas Globales de la Sesión:
          </p>
          <div className="space-y-3">
            <div className="border-b border-neutral-300 h-6"></div>
            <div className="border-b border-neutral-300 h-6"></div>
            <div className="border-b border-neutral-300 h-6"></div>
          </div>
        </div>

        <div className="text-center text-[10px] text-neutral-400 mt-8 border-t border-neutral-200 pt-4">
          Plan estructurado en bloques de 10 min. Sistema de avisos de audio sincronizados: Gong Tibetano en transición de 30s.
        </div>
      </div>
    </div>
  );
}
