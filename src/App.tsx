import { useState, useEffect } from 'react';
import { Activity, Stethoscope, AlertCircle, Send, User, Calendar, Wind, Heart, MapPin, Clock, PlusCircle, Pill, MessageSquare, Globe, LogOut, Loader2, Shield, Brain, Leaf, ShieldAlert, Utensils, CheckCircle, XCircle, Coffee, Sun, Moon, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'motion/react';
import BreathingExercises from './components/BreathingExercises';
import HealthProfile from './components/HealthProfile';
import DoctorFinder from './components/DoctorFinder';
import VoiceAssistant from './components/VoiceAssistant';
import DailyRoutine from './components/DailyRoutine';
import SymptomTracker from './components/SymptomTracker';
import PoseDetection from './components/PoseDetection';
import AyurvedicIntelligence from './components/AyurvedicIntelligence';

import HealthChatbot from './components/HealthChatbot';
import EmergencySOS from './components/EmergencySOS';
import Auth from './components/Auth';
import { LanguageProvider, useLanguage } from './context/LanguageContext';

import { generateAIContent } from './lib/gemini';

interface AyurvedicRemedy {
  remedy: string;
  dosage: string;
  duration: string;
}

interface MealPlan {
  breakfast: string;
  lunch: string;
  dinner: string;
}

interface DietPlan {
  foods_to_eat: string[];
  foods_to_avoid: string[];
  meal_plan: MealPlan;
}

interface Prediction {
  disease: string;
  confidence: number;
}

interface AnalysisResult {
  top_predictions: Prediction[];
  severity: 'Low' | 'Moderate' | 'High' | 'Emergency';
  ayurvedic_remedies: AyurvedicRemedy[];
  ayurvedic_insight: string;
  precautions: string[];
  diet_plan: DietPlan;
  recommended_specialist: string;
  detailed_analysis: string;
}

type Tab = 'analysis' | 'ayurveda' | 'breathing' | 'profile' | 'doctors' | 'routine' | 'tracker' | 'chatbot' | 'pose' | 'emergency';

function AppContent() {
  const { t, language, setLanguage } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('ayurveda');
  const [symptoms, setSymptoms] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    // Load cached result for fast UI
    const cachedResult = localStorage.getItem('lastAnalysisResult');
    if (cachedResult) {
      try {
        setResult(JSON.parse(cachedResult));
      } catch (e) {
        console.error("Failed to parse cached result");
      }
    }
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error("Auth check failed:", err);
    } finally {
      setAuthChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/analyze-symptoms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symptoms,
          age,
          gender,
          language
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze symptoms');
      }

      const analysis = await response.json();
      
      // Fetch diet and remedies in parallel based on the top predicted disease
      const condition = analysis.top_predictions?.[0]?.disease || "Unknown Condition";
      
      const [dietRes, remediesRes] = await Promise.all([
        fetch('/api/get-diet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ condition, language })
        }),
        fetch('/api/get-remedies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ condition, language })
        })
      ]);

      const dietData = dietRes.ok ? await dietRes.json() : { diet_plan: null };
      const remediesData = remediesRes.ok ? await remediesRes.json() : { ayurvedic_remedies: [], precautions: [] };

      const finalResult = {
        ...analysis,
        diet_plan: dietData.diet_plan,
        ayurvedic_remedies: remediesData.ayurvedic_remedies || [],
        precautions: remediesData.precautions || []
      };

      setResult(finalResult);
      localStorage.setItem('lastAnalysisResult', JSON.stringify(finalResult));
    } catch (err: any) {
      setError(err.message || 'An error occurred while analyzing your symptoms. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
          <p className="text-slate-500 font-medium">Initializing PhysioScan AI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">
                PhysioScan<span className="text-emerald-600">.AI</span>
              </h1>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Ayurvedic Intelligence System</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
            >
              <Globe className="w-4 h-4" />
              {language === 'en' ? 'English' : 'हिंदी'}
            </button>
            
            <div className="h-8 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-bold text-slate-900">{user.name}</span>
                <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">Student Portal</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                title={t('logout')}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveTab('ayurveda')}
            className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'ayurveda'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Leaf className="w-4 h-4" />
            Ayurveda
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'analysis'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            {t('symptoms')}
          </button>
          <button
            onClick={() => setActiveTab('breathing')}
            className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'breathing'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Wind className="w-4 h-4" />
            Breathing
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Heart className="w-4 h-4" />
            {t('profile')}
          </button>
          <button
            onClick={() => setActiveTab('doctors')}
            className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'doctors'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            {t('hospitals')}
          </button>
          <button
            onClick={() => setActiveTab('routine')}
            className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'routine'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            Routine
          </button>
          <button
            onClick={() => setActiveTab('tracker')}
            className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'tracker'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Tracker
          </button>
          <button
            onClick={() => setActiveTab('chatbot')}
            className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'chatbot'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Chatbot
          </button>
          
          <button
            onClick={() => setActiveTab('pose')}
            className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'pose'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            AI Pose
          </button>
          
          <button
            onClick={() => setActiveTab('emergency')}
            className={`px-4 py-2.5 ml-auto text-sm font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'emergency'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-100'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            {t('emergency')}
          </button>
        </div>

        {activeTab === 'analysis' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Input Section */}
            <div className="lg:col-span-5 space-y-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 p-6 sm:p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">AI Symptom Analysis</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="symptoms" className="block text-sm font-semibold text-slate-700 mb-2">
                      What are you experiencing?
                    </label>
                    <textarea
                      id="symptoms"
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      placeholder={language === 'en' ? "e.g., I have a severe headache and nausea since morning..." : "उदाहरण: मुझे सुबह से तेज सिरदर्द और मतली हो रही है..."}
                      className="w-full h-40 px-4 py-3 rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all resize-none text-slate-700 placeholder:text-slate-400 bg-slate-50 hover:bg-white"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="age" className="block text-sm font-semibold text-slate-700 mb-2">
                        Age (Optional)
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="number"
                          id="age"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          placeholder="Age"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-slate-50 hover:bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="gender" className="block text-sm font-semibold text-slate-700 mb-2">
                        Gender (Optional)
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                          id="gender"
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all appearance-none bg-slate-50 hover:bg-white"
                        >
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !symptoms.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 active:scale-[0.98]"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Analyzing with AI...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Run AI Diagnosis</span>
                      </>
                    )}
                  </button>
                </form>
              </motion.div>

              <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-5 flex gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-sm text-amber-900">
                  <p className="font-bold mb-1">Medical Disclaimer</p>
                  <p className="text-amber-800/80 leading-relaxed">PhysioScan AI is an educational tool and not a substitute for professional medical advice. In case of a medical emergency, please contact your local emergency services immediately.</p>
                </div>
              </div>
            </div>

            {/* Results Section */}
            <div className="lg:col-span-7">
              {result ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col h-full space-y-6"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
                      <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                        <Activity className="w-4 h-4" />
                        Top Predictions
                      </div>
                      <div className="space-y-3">
                        {result.top_predictions?.map((pred, idx) => (
                          <div key={idx}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium text-slate-700">{pred.disease}</span>
                              <span className="text-slate-500">{pred.confidence}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${pred.confidence}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className={`rounded-2xl p-6 shadow-sm border flex flex-col gap-2 ${
                      result.severity === 'Emergency' || result.severity === 'High' ? 'bg-red-50 border-red-100' :
                      result.severity === 'Moderate' ? 'bg-amber-50 border-amber-100' :
                      'bg-emerald-50 border-emerald-100'
                    }`}>
                      <div className={`flex items-center gap-2 font-medium text-sm ${
                        result.severity === 'Emergency' || result.severity === 'High' ? 'text-red-600' :
                        result.severity === 'Moderate' ? 'text-amber-600' :
                        'text-emerald-600'
                      }`}>
                        <AlertCircle className="w-4 h-4" />
                        Severity Level
                      </div>
                      <div className={`text-xl font-bold ${
                        result.severity === 'Emergency' || result.severity === 'High' ? 'text-red-700' :
                        result.severity === 'Moderate' ? 'text-amber-700' :
                        'text-emerald-700'
                      }`}>{result.severity}</div>
                    </div>
                  </div>

                  {result.ayurvedic_insight && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 text-white shadow-xl shadow-emerald-200/50 relative overflow-hidden"
                    >
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                            <Leaf className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-xl font-bold">Ayurvedic Intelligence Insight</h3>
                        </div>
                        <p className="text-emerald-50 leading-relaxed text-lg font-medium italic">
                          "{result.ayurvedic_insight}"
                        </p>
                      </div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                    </motion.div>
                  )}

                  {result.recommended_specialist && (
                    <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-blue-800 font-bold mb-1">
                          <Stethoscope className="w-5 h-5 text-blue-600" />
                          Recommended Specialist
                        </div>
                        <p className="text-sm text-blue-700">Based on your symptoms, we recommend consulting a <span className="font-bold">{result.recommended_specialist}</span>.</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('doctors')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-sm whitespace-nowrap"
                      >
                        <MapPin className="w-4 h-4" />
                        Find Nearby
                      </button>
                    </div>
                  )}

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-800 font-bold mb-4">
                      <Leaf className="w-5 h-5 text-emerald-500" />
                      Ayurvedic Remedies & First Aid
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {result.ayurvedic_remedies?.map((item, idx) => (
                        <div key={idx} className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
                          <div className="font-bold text-emerald-900 mb-1">{item.remedy}</div>
                          <div className="text-sm text-emerald-700 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" /> {item.dosage} • {item.duration}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-800 font-bold mb-4">
                      <ShieldAlert className="w-5 h-5 text-amber-500" />
                      Precautions & Care
                    </div>
                    <ul className="space-y-3">
                      {result.precautions?.map((precaution, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-slate-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                          <span className="leading-relaxed">{precaution}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {result.diet_plan && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-800 font-bold mb-4">
                        <Utensils className="w-5 h-5 text-orange-500" />
                        Dietary Guidelines & Meal Plan
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Foods to Eat */}
                        <div className="bg-emerald-50/30 rounded-xl p-4 border border-emerald-100/50">
                          <h4 className="font-bold text-emerald-800 flex items-center gap-2 mb-3">
                            <CheckCircle className="w-4 h-4 text-emerald-500" /> Foods to Eat
                          </h4>
                          <ul className="space-y-2">
                            {result.diet_plan.foods_to_eat?.map((food, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                                <span>{food}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Foods to Avoid */}
                        <div className="bg-red-50/30 rounded-xl p-4 border border-red-100/50">
                          <h4 className="font-bold text-red-800 flex items-center gap-2 mb-3">
                            <XCircle className="w-4 h-4 text-red-500" /> Foods to Avoid
                          </h4>
                          <ul className="space-y-2">
                            {result.diet_plan.foods_to_avoid?.map((food, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                                <span>{food}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Meal Plan */}
                      <div className="bg-orange-50/30 rounded-xl p-4 border border-orange-100/50">
                        <h4 className="font-bold text-orange-800 mb-4">Suggested Daily Meal Plan</h4>
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Coffee className="w-4 h-4 text-orange-600" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 text-sm">Breakfast</div>
                              <div className="text-sm text-slate-600 mt-0.5">{result.diet_plan.meal_plan.breakfast}</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Sun className="w-4 h-4 text-orange-600" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 text-sm">Lunch</div>
                              <div className="text-sm text-slate-600 mt-0.5">{result.diet_plan.meal_plan.lunch}</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Moon className="w-4 h-4 text-orange-600" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 text-sm">Dinner</div>
                              <div className="text-sm text-slate-600 mt-0.5">{result.diet_plan.meal_plan.dinner}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden flex flex-col flex-1">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100/50 px-6 py-5 flex items-center justify-between">
                      <h3 className="font-bold text-blue-900 flex items-center gap-3 text-lg">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Brain className="w-4 h-4 text-blue-600" />
                        </div>
                        Detailed Analysis
                      </h3>
                      <span className="text-xs font-bold px-3 py-1.5 bg-white border border-blue-200 text-blue-700 rounded-full shadow-sm">
                        AI Generated
                      </span>
                    </div>
                    <div className="p-6 sm:p-8 flex-1 overflow-y-auto prose prose-blue max-w-none">
                      <ReactMarkdown
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-slate-900 mb-6 pb-4 border-b border-slate-100" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-xl font-bold text-slate-800 mb-4 mt-8 flex items-center gap-2 before:content-[''] before:w-1.5 before:h-6 before:bg-blue-500 before:rounded-full before:mr-2" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-lg font-bold text-blue-900 mb-3 mt-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100" {...props} />,
                          p: ({node, ...props}) => <p className="text-slate-600 mb-4 leading-relaxed text-[15px]" {...props} />,
                          ul: ({node, ...props}) => <ul className="space-y-3 mb-6 list-none pl-0" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-3 mb-6 text-slate-600 marker:text-blue-600 marker:font-bold" {...props} />,
                          li: ({node, ...props}) => (
                            <li className="text-slate-600 leading-relaxed flex items-start gap-3 relative pl-6 before:content-[''] before:absolute before:left-0 before:top-2.5 before:w-1.5 before:h-1.5 before:bg-blue-400 before:rounded-full" {...props} />
                          ),
                          a: ({node, ...props}) => <a className="text-blue-600 hover:text-blue-700 underline underline-offset-4 font-medium transition-colors" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-bold text-slate-900 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-200/60" {...props} />,
                          blockquote: ({node, ...props}) => (
                            <blockquote className="border-l-4 border-blue-500 pl-5 py-3 my-6 bg-blue-50/50 rounded-r-xl italic text-slate-700 font-medium" {...props} />
                          ),
                        }}
                      >
                        {result.detailed_analysis}
                      </ReactMarkdown>
                    </div>
                    <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-100 text-center">
                      <p className="text-sm text-slate-500 font-medium">
                        Remember: This is an AI analysis, not a medical diagnosis.
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 min-h-[500px] border-2 border-dashed border-slate-200 rounded-3xl bg-white">
                  <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
                    <Activity className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">Ready for Analysis</h3>
                  <p className="max-w-md mx-auto text-slate-500 leading-relaxed">
                    Describe your symptoms in detail on the left. Our AI will analyze them and provide structured health guidance and recommendations.
                  </p>
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl flex items-start gap-3 shadow-sm"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="font-medium leading-relaxed">{error}</p>
                </motion.div>
              )}
            </div>
          </div>
        ) : activeTab === 'ayurveda' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AyurvedicIntelligence />
          </motion.div>
        ) : activeTab === 'breathing' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <BreathingExercises />
          </motion.div>
        ) : activeTab === 'profile' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <HealthProfile />
          </motion.div>
        ) : activeTab === 'doctors' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <DoctorFinder recommendedSpecialty={result?.recommended_specialist} />
          </motion.div>
        ) : activeTab === 'routine' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <DailyRoutine />
          </motion.div>
        ) : activeTab === 'tracker' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <SymptomTracker />
          </motion.div>
        ) : activeTab === 'chatbot' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <HealthChatbot />
          </motion.div>
        ) : activeTab === 'pose' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <PoseDetection />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <EmergencySOS />
          </motion.div>
        )}
      </main>

      <VoiceAssistant />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
