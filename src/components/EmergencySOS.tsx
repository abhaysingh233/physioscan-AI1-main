import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, MapPin, Phone, Volume2, VolumeX, Loader2, ShieldAlert, HeartPulse, Flame, Activity } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface Hospital {
  name: string;
  address: string;
  distance: string;
  phone: string;
  status: string;
  uri?: string;
}

interface EmergencyGuide {
  title: string;
  steps: string[];
  voice_script: string;
  warning: string;
}

import { generateAIContent } from '../lib/gemini';

export default function EmergencySOS() {
  const { t, language } = useLanguage();
  const [activeMode, setActiveMode] = useState<'menu' | 'hospitals' | 'guide'>('menu');
  const [loading, setLoading] = useState(false);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [guide, setGuide] = useState<EmergencyGuide | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Speech Synthesis
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any previous speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    return () => stopSpeaking(); // Cleanup on unmount
  }, []);

  const findHospitals = () => {
    setLoading(true);
    setLocationError(null);
    setActiveMode('hospitals');

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const prompt = `
Find the nearest EMERGENCY HOSPITALS and TRAUMA CENTERS near latitude ${position.coords.latitude} and longitude ${position.coords.longitude}.
Prioritize facilities that are likely OPEN 24/7.

Return a STRICT JSON array of the top 3 results.
Each object must have:
- "name": Hospital Name
- "address": Full address
- "distance": Estimated distance
- "phone": Emergency contact number (if available)
- "status": "Open 24/7" or "Open" (inferred)
- "uri": A Google Maps search URL for this hospital (e.g. https://www.google.com/maps/search/?api=1&query=Hospital+Name)

Do not include markdown. Just the raw JSON array.
`;

          const response = await generateAIContent(prompt, true, "gemini-3-flash-preview");

          let parsedHospitals = [];
          if (Array.isArray(response)) {
            parsedHospitals = response;
          } else if (response && Array.isArray(response.hospitals)) {
            parsedHospitals = response.hospitals;
          }

          if (parsedHospitals.length === 0) {
            throw new Error("No hospitals found in the response.");
          }

          setHospitals(parsedHospitals);
        } catch (error) {
          console.error(error);
          setLocationError("Failed to find nearby hospitals. Please try again.");
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error(error);
        setLocationError("Unable to retrieve your location. Please enable location services.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const getGuide = async (type: string) => {
    setLoading(true);
    setActiveMode('guide');
    setGuide(null);
    stopSpeaking();

    try {
      const prompt = `
Provide IMMEDIATE, STEP-BY-STEP First Aid instructions for: "${type}".
Target Audience: A panicked bystander.
Tone: Calm, Authoritative, Urgent, Clear.
Language: ${language === 'hi' ? 'Hindi' : 'English'}

STRICT JSON RESPONSE FORMAT:
{
  "title": "Emergency Protocol: ${type}",
  "steps": [
    "Step 1 instruction...",
    "Step 2 instruction..."
  ],
  "voice_script": "Speak this text to guide the user. Keep it simple and rhythmic for CPR etc.",
  "warning": "CRITICAL WARNING (e.g., Do not give water)"
}
Do not use markdown.
Provide 'title', 'steps', 'voice_script', and 'warning' in ${language === 'hi' ? 'Hindi' : 'English'}. Keep JSON keys in English.
`;

      const response = await generateAIContent(prompt, true, "gemini-3-flash-preview");
      setGuide(response);
      
      // Auto-speak the script
      if (response.voice_script) {
        speak(response.voice_script);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-xl flex items-start gap-3 shadow-sm">
        <ShieldAlert className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <h2 className="text-lg font-bold text-blue-900">{t('emergency_mode')}</h2>
          <p className="text-blue-700 text-sm font-medium mt-1">
            {t('emergency_text')}
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeMode === 'menu' && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Find Hospital Button */}
            <button
              onClick={findHospitals}
              className="col-span-1 md:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-3xl p-8 flex flex-col items-center justify-center gap-4 shadow-xl shadow-blue-600/20 hover:shadow-2xl hover:shadow-blue-600/30 transition-all group active:scale-[0.98]"
            >
              <div className="bg-white/20 p-5 rounded-2xl group-hover:scale-110 transition-transform backdrop-blur-sm border border-white/10">
                <MapPin className="w-12 h-12 text-white" />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold tracking-wide">{t('find_hospital')}</h3>
                <p className="text-blue-100 mt-2 font-medium">{t('locate_hospitals_text')}</p>
              </div>
            </button>

            {/* Emergency Guides */}
            <div className="col-span-1 md:col-span-2 mt-4">
              <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                {t('first_aid_guides')}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <button
                  onClick={() => getGuide('CPR (Cardiopulmonary Resuscitation)')}
                  className="bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 p-5 rounded-2xl flex flex-col items-center gap-3 transition-all shadow-sm hover:shadow-md group"
                >
                  <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                    <HeartPulse className="w-8 h-8 text-blue-600" />
                  </div>
                  <span className="font-semibold text-slate-700 text-center text-sm">{t('cpr')}</span>
                </button>
                <button
                  onClick={() => getGuide('Choking (Heimlich Maneuver)')}
                  className="bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 p-5 rounded-2xl flex flex-col items-center gap-3 transition-all shadow-sm hover:shadow-md group"
                >
                  <div className="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors">
                    <AlertTriangle className="w-8 h-8 text-indigo-600" />
                  </div>
                  <span className="font-semibold text-slate-700 text-center text-sm">{t('choking')}</span>
                </button>
                <button
                  onClick={() => getGuide('Severe Bleeding')}
                  className="bg-white border border-slate-200 hover:border-rose-300 hover:bg-rose-50 p-5 rounded-2xl flex flex-col items-center gap-3 transition-all shadow-sm hover:shadow-md group"
                >
                  <div className="w-14 h-14 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 font-bold text-2xl group-hover:bg-rose-100 transition-colors">🩸</div>
                  <span className="font-semibold text-slate-700 text-center text-sm">{t('bleeding')}</span>
                </button>
                <button
                  onClick={() => getGuide('Burns')}
                  className="bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50 p-5 rounded-2xl flex flex-col items-center gap-3 transition-all shadow-sm hover:shadow-md group"
                >
                  <div className="p-3 bg-amber-50 rounded-xl group-hover:bg-amber-100 transition-colors">
                    <Flame className="w-8 h-8 text-amber-600" />
                  </div>
                  <span className="font-semibold text-slate-700 text-center text-sm">{t('burns')}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeMode === 'hospitals' && (
          <motion.div
            key="hospitals"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <button
              onClick={() => setActiveMode('menu')}
              className="mb-6 text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-2 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors w-fit"
            >
              ← {t('back_to_menu')}
            </button>

            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              {t('nearby_facilities')}
            </h3>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <Loader2 className="w-12 h-12 animate-spin mb-4 text-blue-600" />
                <p className="font-medium">{t('locating_hospitals')}</p>
              </div>
            ) : locationError ? (
              <div className="bg-red-50 text-red-700 p-5 rounded-2xl border border-red-100 font-medium flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                {locationError}
              </div>
            ) : (
              <div className="space-y-4">
                {hospitals.map((hospital, index) => (
                  <div key={index} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-slate-900 group-hover:text-blue-700 transition-colors">{hospital.name}</h4>
                        <p className="text-slate-600 mt-1.5 text-sm leading-relaxed">{hospital.address}</p>
                        <div className="flex items-center gap-4 mt-4 text-sm">
                          <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-semibold border border-emerald-200/50">
                            {hospital.status || 'Open'}
                          </span>
                          <span className="text-slate-500 flex items-center gap-1.5 font-medium bg-slate-50 px-3 py-1 rounded-full border border-slate-200/50">
                            <MapPin className="w-3.5 h-3.5 text-blue-500" /> {hospital.distance}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3">
                        {hospital.phone && hospital.phone !== 'N/A' && (
                          <a
                            href={`tel:${hospital.phone}`}
                            className="bg-emerald-50 text-emerald-600 p-3 rounded-xl hover:bg-emerald-100 hover:text-emerald-700 transition-colors shadow-sm"
                            title="Call Now"
                          >
                            <Phone className="w-5 h-5" />
                          </a>
                        )}
                        <a
                          href={hospital.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-50 text-blue-600 p-3 rounded-xl hover:bg-blue-100 hover:text-blue-700 transition-colors shadow-sm"
                          title="View on Map"
                        >
                          <MapPin className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeMode === 'guide' && (
          <motion.div
            key="guide"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <button
              onClick={() => {
                stopSpeaking();
                setActiveMode('menu');
              }}
              className="mb-6 text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-2 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors w-fit"
            >
              ← {t('back_to_menu')}
            </button>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <Loader2 className="w-12 h-12 animate-spin mb-4 text-blue-600" />
                <p className="font-medium">{t('loading_guide')}</p>
              </div>
            ) : guide && (
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/40">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-6 flex items-center justify-between">
                  <h3 className="font-bold text-xl tracking-wide">{guide.title}</h3>
                  <button
                    onClick={() => isSpeaking ? stopSpeaking() : speak(guide.voice_script)}
                    className="bg-white/20 hover:bg-white/30 p-3 rounded-full transition-colors backdrop-blur-sm border border-white/10"
                  >
                    {isSpeaking ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                  </button>
                </div>

                <div className="p-8">
                  {guide.warning && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 p-5 rounded-2xl mb-8 font-medium flex gap-4 shadow-sm">
                      <AlertTriangle className="w-6 h-6 flex-shrink-0 text-rose-600" />
                      <p className="leading-relaxed">{guide.warning}</p>
                    </div>
                  )}

                  <div className="space-y-8">
                    {guide.steps.map((step, index) => (
                      <div key={index} className="flex gap-5 group">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                          {index + 1}
                        </div>
                        <p className="text-lg text-slate-700 pt-1.5 leading-relaxed font-medium">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
