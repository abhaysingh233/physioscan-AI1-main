import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, MessageSquare, Loader2, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';

import { generateAIContent } from '../lib/gemini';

export default function VoiceAssistant() {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Speech Recognition Setup
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-IN'; // Better for Hinglish/Indian English

        recognitionRef.current.onstart = () => {
          setIsListening(true);
          setTranscript('');
          setError(null);
        };

        recognitionRef.current.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          setTranscript(text);
          handleVoiceInput(text);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            setError("Microphone access denied. Please allow microphone permissions in your browser settings.");
          } else if (event.error === 'no-speech') {
            setError("No speech detected. Please try again.");
          } else {
            setError(`Error: ${event.error}`);
          }
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }

      // Speech Synthesis Setup
      if ('speechSynthesis' in window) {
        synthRef.current = window.speechSynthesis;
      }
    }
  }, []);

  const handleVoiceInput = async (text: string) => {
    setIsProcessing(true);
    try {
      const prompt = `
User Message: "${text}"
Language: ${language === 'hi' ? 'Hindi' : 'English'}

You are PhysioScan AI's Voice Assistant.
- The user is speaking to you (voice input).
- They might speak in English, Hindi, or Hinglish (e.g., "Mujhe fever hai").
- Your goal is to provide a helpful, comforting, and concise response (max 2-3 sentences).
- If they describe symptoms, give immediate brief advice (e.g., "Stay hydrated, rest") and suggest using the "Symptom Analysis" feature for a full report.
- If they ask about doctors, suggest the "Find Doctors" feature.
- Be polite and professional but warm.

Respond in ${language === 'hi' ? 'Hindi' : 'English'}.
`;

      const aiResponse = await generateAIContent(prompt);
      setResponse(aiResponse.text || "Sorry, I couldn't process that.");
      speakResponse(aiResponse.text || "Sorry, I couldn't process that.");
    } catch (error) {
      console.error("Error processing voice input:", error);
      setResponse("Sorry, I couldn't process that. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = (text: string) => {
    if (!synthRef.current) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    // Try to find a Hindi voice if the text looks like Hindi/Hinglish, otherwise default
    // Simple heuristic: check if available voices include 'hi-IN'
    const voices = synthRef.current.getVoices();
    const hindiVoice = voices.find(v => v.lang === 'hi-IN');
    
    // If we detect Hindi characters or just generally want a neutral voice
    // For now, let's stick to default or a pleasant English voice as fallback
    // If the response is in Hindi, the browser might auto-detect if we don't force it.
    // But let's try to be smart.
    
    // Actually, let's just use the default voice for now to be safe.
    
    synthRef.current.speak(utterance);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setResponse('');
      setTranscript('');
      recognitionRef.current?.start();
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  if (!recognitionRef.current) {
    return null; // Don't render if speech recognition isn't supported
  }

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:shadow-blue-600/50 transition-all z-50 flex items-center justify-center border-2 border-white"
      >
        <Mic className="w-6 h-6" />
      </motion.button>

      {/* Assistant Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-6 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 flex items-center justify-between text-white shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h3 className="font-bold tracking-wide text-sm uppercase">Voice Assistant</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors backdrop-blur-sm">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 flex flex-col items-center justify-center min-h-[350px] text-center space-y-8 bg-slate-50/50">
              
              {/* Status Indicator */}
              <div className="relative">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-inner ${
                  isListening ? 'bg-red-50 ring-8 ring-red-100/50 shadow-red-200' : 
                  isProcessing ? 'bg-indigo-50 ring-8 ring-indigo-100/50 shadow-indigo-200' :
                  isSpeaking ? 'bg-blue-50 ring-8 ring-blue-100/50 shadow-blue-200' :
                  'bg-white shadow-slate-200 border border-slate-100'
                }`}>
                  {isListening ? (
                    <Mic className="w-10 h-10 text-red-500 animate-pulse drop-shadow-sm" />
                  ) : isProcessing ? (
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin drop-shadow-sm" />
                  ) : isSpeaking ? (
                    <Volume2 className="w-10 h-10 text-blue-500 animate-pulse drop-shadow-sm" />
                  ) : (
                    <MicOff className="w-10 h-10 text-slate-300" />
                  )}
                </div>
                
                {/* Ripple effect when listening */}
                {isListening && (
                  <span className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-20"></span>
                )}
              </div>

              {/* Text Output */}
              <div className="w-full space-y-4">
                {error && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 p-4 rounded-2xl text-red-700 text-sm font-medium border border-red-100 flex items-start gap-3 shadow-sm text-left">
                    <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
                    {error}
                  </motion.div>
                )}

                {transcript && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-4 rounded-2xl text-slate-700 text-sm italic border border-slate-200 shadow-sm relative">
                    <div className="absolute -top-2 left-4 bg-white px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">You</div>
                    "{transcript}"
                  </motion.div>
                )}
                
                {response && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-blue-50 p-5 rounded-2xl text-blue-900 text-sm font-medium border border-blue-100 text-left shadow-sm relative leading-relaxed">
                    <div className="absolute -top-2 left-4 bg-blue-50 px-2 text-[10px] font-bold text-blue-500 uppercase tracking-wider">AI</div>
                    {response}
                  </motion.div>
                )}

                {!transcript && !response && !isListening && !isProcessing && (
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">
                    Tap the microphone to start speaking.<br/>
                    <span className="text-slate-400 text-xs mt-2 block font-normal">Try saying "I have a headache" or "Mujhe fever hai".</span>
                  </p>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4 pt-2">
                <button
                  onClick={toggleListening}
                  className={`p-5 rounded-full transition-all shadow-lg active:scale-95 ${
                    isListening 
                      ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30'
                  }`}
                >
                  {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>
                
                {isSpeaking && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={stopSpeaking}
                    className="p-5 rounded-full bg-white hover:bg-slate-50 text-slate-700 transition-all shadow-md border border-slate-200 active:scale-95"
                    title="Stop speaking"
                  >
                    <VolumeX className="w-6 h-6" />
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
