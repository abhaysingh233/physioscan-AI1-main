import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wind, Play, Pause, RotateCcw, Clock, CheckCircle2, Volume2, VolumeX } from 'lucide-react';

type BreathingTechnique = 'box' | '4-7-8' | 'relax';

interface TechniqueConfig {
  name: string;
  description: string;
  phases: {
    inhale: number;
    hold1?: number; // Hold after inhale
    exhale: number;
    hold2?: number; // Hold after exhale
  };
}

const TECHNIQUES: Record<BreathingTechnique, TechniqueConfig> = {
  'box': {
    name: 'Box Breathing',
    description: 'Equal duration for inhaling, holding, exhaling, and holding again. Great for focus and stress relief.',
    phases: { inhale: 4, hold1: 4, exhale: 4, hold2: 4 }
  },
  '4-7-8': {
    name: '4-7-8 Relaxing Breath',
    description: 'Inhale for 4s, hold for 7s, exhale for 8s. Helps with anxiety and sleep.',
    phases: { inhale: 4, hold1: 7, exhale: 8 }
  },
  'relax': {
    name: 'Simple Relaxation',
    description: 'Simple extended exhale to trigger the relaxation response.',
    phases: { inhale: 4, exhale: 6 }
  }
};

export default function BreathingExercises() {
  const [technique, setTechnique] = useState<BreathingTechnique>('box');
  const [durationMinutes, setDurationMinutes] = useState(1);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [phase, setPhase] = useState<'inhale' | 'hold-high' | 'exhale' | 'hold-low' | 'ready' | 'completed'>('ready');
  const [instruction, setInstruction] = useState('Ready to start');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const soundEnabledRef = useRef(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentConfig = TECHNIQUES[technique];

  // Update ref when state changes to access in effect without re-triggering
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const playCue = (type: 'inhale' | 'exhale' | 'hold') => {
    if (!soundEnabledRef.current) return;

    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      osc.type = 'sine';
      
      // Frequencies: Inhale (Low to High), Exhale (High to Low), Hold (Steady)
      const baseFreq = 180; 

      switch (type) {
        case 'inhale':
          osc.frequency.setValueAtTime(baseFreq, now);
          osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 2);
          break;
        case 'exhale':
          osc.frequency.setValueAtTime(baseFreq * 1.5, now);
          osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 2);
          break;
        case 'hold':
          osc.frequency.setValueAtTime(baseFreq * 1.25, now);
          break;
      }

      // Soft envelope
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

      osc.start(now);
      osc.stop(now + 2.5);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  // Reset when technique or duration changes
  useEffect(() => {
    resetExercise();
  }, [technique, durationMinutes]);

  // Main countdown timer
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            completeExercise();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  // Breathing phase logic
  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;

    let mounted = true;

    const runPhases = async () => {
      const { inhale, hold1, exhale, hold2 } = currentConfig.phases;

      while (mounted && isActive && timeLeft > 0) {
        // Inhale
        if (!mounted) break;
        setPhase('inhale');
        setInstruction('Inhale...');
        playCue('inhale');
        await new Promise(r => setTimeout(r, inhale * 1000));

        // Hold 1 (High - Lungs full)
        if (hold1) {
          if (!mounted) break;
          setPhase('hold-high');
          setInstruction('Hold...');
          playCue('hold');
          await new Promise(r => setTimeout(r, hold1 * 1000));
        }

        // Exhale
        if (!mounted) break;
        setPhase('exhale');
        setInstruction('Exhale...');
        playCue('exhale');
        await new Promise(r => setTimeout(r, exhale * 1000));

        // Hold 2 (Low - Lungs empty)
        if (hold2) {
          if (!mounted) break;
          setPhase('hold-low');
          setInstruction('Hold...');
          playCue('hold');
          await new Promise(r => setTimeout(r, hold2 * 1000));
        }
      }
    };

    runPhases();

    return () => {
      mounted = false;
    };
  }, [isActive, technique]);

  const startExercise = () => {
    setIsActive(true);
  };

  const stopExercise = () => {
    setIsActive(false);
    setPhase('ready');
    setInstruction('Paused');
  };

  const resetExercise = () => {
    setIsActive(false);
    setTimeLeft(durationMinutes * 60);
    setPhase('ready');
    setInstruction('Ready to start');
  };

  const completeExercise = () => {
    setIsActive(false);
    setPhase('completed');
    setInstruction('Session Completed');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getCircleAnimation = () => {
    switch (phase) {
      case 'inhale': 
        return { 
          scale: 1.5, 
          opacity: 1, 
          boxShadow: "0px 0px 40px 10px rgba(59, 130, 246, 0.3)",
          backgroundColor: "rgba(59, 130, 246, 0.2)",
          transition: { duration: currentConfig.phases.inhale, ease: "easeInOut" as const } 
        };
      case 'hold-high': 
        return { 
          scale: [1.5, 1.55, 1.5], 
          opacity: 1, 
          boxShadow: "0px 0px 50px 15px rgba(59, 130, 246, 0.4)",
          backgroundColor: "rgba(59, 130, 246, 0.25)",
          transition: { 
            duration: 2, 
            ease: "easeInOut" as const, 
            repeat: Infinity, 
            repeatType: "reverse" as const 
          } 
        };
      case 'exhale': 
        return { 
          scale: 1, 
          opacity: 0.6, 
          boxShadow: "0px 0px 0px 0px rgba(59, 130, 246, 0)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          transition: { duration: currentConfig.phases.exhale, ease: "easeInOut" as const } 
        };
      case 'hold-low': 
        return { 
          scale: 1, 
          opacity: 0.6, 
          boxShadow: "0px 0px 0px 0px rgba(59, 130, 246, 0)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          transition: { duration: currentConfig.phases.hold2 || 1, ease: "linear" as const } 
        };
      case 'ready': 
        return { 
          scale: 1, 
          opacity: 0.5,
          boxShadow: "0px 0px 0px 0px rgba(59, 130, 246, 0)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
        };
      case 'completed': 
        return { 
          scale: 1.2, 
          opacity: 1,
          boxShadow: "0px 0px 20px 5px rgba(59, 130, 246, 0.2)",
          backgroundColor: "rgba(59, 130, 246, 0.15)",
        };
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 p-6 sm:p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Wind className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Guided Breathing</h2>
        </div>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-2.5 rounded-xl transition-all ${
            soundEnabled ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-400 hover:bg-slate-100'
          }`}
          title={soundEnabled ? "Mute sounds" : "Enable sounds"}
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-8">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-4">Technique</label>
            <div className="grid grid-cols-1 gap-3">
              {(Object.keys(TECHNIQUES) as BreathingTechnique[]).map((t) => (
                <button
                  key={t}
                  onClick={() => !isActive && setTechnique(t)}
                  disabled={isActive}
                  className={`text-left p-5 rounded-2xl border transition-all ${
                    technique === t
                      ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-sm'
                      : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50'
                  } ${isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="font-bold text-slate-900">{TECHNIQUES[t].name}</div>
                  <div className="text-sm text-slate-500 mt-1.5 leading-relaxed">{TECHNIQUES[t].description}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-4">Duration</label>
            <div className="flex gap-3">
              {[1, 3, 5].map((min) => (
                <button
                  key={min}
                  onClick={() => !isActive && setDurationMinutes(min)}
                  disabled={isActive}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${
                    durationMinutes === min
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  } ${isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {min} min
                </button>
              ))}
            </div>
          </div>
        </div>

          {/* Visualizer */}
          <div className="bg-slate-50/50 rounded-3xl border border-slate-100 p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[400px]">
            {/* Background rings - Animated */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Outer pulsing ring */}
              <motion.div 
                animate={{
                  scale: phase === 'inhale' || phase === 'hold-high' ? 1.5 : 0.8,
                  opacity: phase === 'inhale' || phase === 'hold-high' ? 0.1 : 0,
                }}
                transition={{ 
                  duration: phase === 'inhale' ? currentConfig.phases.inhale : currentConfig.phases.exhale, 
                  ease: "easeInOut" 
                }}
                className="absolute w-96 h-96 rounded-full bg-blue-400 blur-3xl"
              />
              
              {/* Middle ring */}
               <motion.div 
                 animate={{
                   scale: phase === 'inhale' || phase === 'hold-high' ? 1.2 : 1,
                   opacity: phase === 'inhale' || phase === 'hold-high' ? 0.2 : 0.05,
                   borderColor: phase === 'hold-high' || phase === 'hold-low' ? '#3b82f6' : '#60a5fa'
                 }}
                 transition={{ duration: phase === 'inhale' ? currentConfig.phases.inhale : currentConfig.phases.exhale, ease: "easeInOut" }}
                 className="absolute w-64 h-64 rounded-full border-2 border-blue-400"
               />
               
               {/* Outer ring */}
               <motion.div 
                 animate={{
                   scale: phase === 'inhale' || phase === 'hold-high' ? 1.4 : 1,
                   opacity: phase === 'inhale' || phase === 'hold-high' ? 0.15 : 0.05,
                 }}
                 transition={{ duration: phase === 'inhale' ? currentConfig.phases.inhale : currentConfig.phases.exhale, ease: "easeInOut", delay: 0.1 }}
                 className="absolute w-80 h-80 rounded-full border border-blue-300"
               />
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="relative mb-8 flex items-center justify-center w-64 h-64">
                {/* Main Breathing Circle */}
                <motion.div
                  animate={{
                    scale: phase === 'inhale' || phase === 'hold-high' ? 1.5 : 1,
                    backgroundColor: phase === 'hold-high' || phase === 'hold-low' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)',
                    boxShadow: phase === 'inhale' || phase === 'hold-high' 
                      ? "0px 0px 60px 20px rgba(59, 130, 246, 0.4)" 
                      : "0px 0px 20px 5px rgba(59, 130, 246, 0.1)",
                  }}
                  transition={{
                    duration: phase === 'inhale' ? currentConfig.phases.inhale : 
                              phase === 'exhale' ? currentConfig.phases.exhale : 0.5,
                    ease: "easeInOut"
                  }}
                  className="w-32 h-32 rounded-full bg-blue-500/20 flex items-center justify-center backdrop-blur-sm border border-blue-500/30"
                >
                  <div className="text-center z-10 relative">
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={instruction}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex flex-col items-center"
                      >
                        {phase === 'completed' ? (
                          <CheckCircle2 className="w-12 h-12 text-blue-600 mb-2" />
                        ) : (
                          <span className="text-xl font-bold text-blue-900 block mb-1">
                            {instruction}
                          </span>
                        )}
                        
                        {isActive && phase !== 'completed' && (
                          <span className="text-blue-700 font-mono text-lg font-bold bg-white/60 px-3 py-0.5 rounded-full shadow-sm">
                            {formatTime(timeLeft)}
                          </span>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </motion.div>

                {/* Progress Ring SVG Overlay */}
                {isActive && phase !== 'completed' && phase !== 'ready' && (
                  <svg className="absolute w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="48"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeDasharray="301.59" // 2 * pi * 48
                      strokeDashoffset="301.59"
                      animate={{ 
                        strokeDashoffset: 0,
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{ 
                        strokeDashoffset: {
                          duration: 
                            phase === 'inhale' ? currentConfig.phases.inhale :
                            phase === 'hold-high' ? (currentConfig.phases.hold1 || 0) :
                            phase === 'exhale' ? currentConfig.phases.exhale :
                            phase === 'hold-low' ? (currentConfig.phases.hold2 || 0) : 0,
                          ease: "linear"
                        },
                        opacity: {
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }
                      }}
                      key={phase} // Reset animation on phase change
                    />
                  </svg>
                )}
              </div>

              <div className="flex items-center gap-4">
              {!isActive && phase !== 'completed' && (
                <button
                  onClick={startExercise}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 active:scale-[0.98]"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Start Session
                </button>
              )}
              
              {isActive && (
                <button
                  onClick={stopExercise}
                  className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-8 py-3.5 rounded-xl font-bold transition-all shadow-sm active:scale-[0.98]"
                >
                  <Pause className="w-5 h-5 fill-current" />
                  Pause
                </button>
              )}

              {(phase === 'completed' || (!isActive && timeLeft !== durationMinutes * 60)) && (
                <button
                  onClick={resetExercise}
                  className="flex items-center gap-2 text-slate-500 hover:text-slate-700 px-4 py-2 font-medium transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
