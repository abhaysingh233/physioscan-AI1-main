import { useState } from 'react';
import { Leaf, Search, Info, Activity, Wind, Flame, Droplets, BookOpen, Clock, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../context/LanguageContext';

interface AyurvedicTreatment {
  name: string;
  benefits: string[];
  how_to_use: string;
  precaution: string;
}

interface AyurvedicResponse {
  treatments: AyurvedicTreatment[];
  lifestyle_tips: string[];
  dosha_impact: string;
  herbal_recommendations: string[];
}

export default function AyurvedicIntelligence() {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AyurvedicResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'treatments' | 'doshas' | 'herbs' | 'routine'>('treatments');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/ayurveda/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, language })
      });

      if (!response.ok) throw new Error('Failed to fetch Ayurvedic intelligence');
      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const doshas = [
    {
      name: 'Vata',
      element: 'Air & Space',
      icon: <Wind className="w-6 h-6 text-blue-400" />,
      description: 'The energy of movement and impulse. Characteristics: Light, cold, dry, rough, mobile.',
      qualities: ['Creative', 'Energetic', 'Flexible', 'Quick-thinking'],
      imbalance: 'Anxiety, dry skin, insomnia, bloating, fatigue.',
      color: 'bg-blue-50 border-blue-200 text-blue-800'
    },
    {
      name: 'Pitta',
      element: 'Fire & Water',
      icon: <Flame className="w-6 h-6 text-orange-400" />,
      description: 'The energy of digestion and metabolism. Characteristics: Hot, sharp, light, liquid.',
      qualities: ['Intelligent', 'Focused', 'Determined', 'Strong digestion'],
      imbalance: 'Anger, inflammation, skin rashes, heartburn, perfectionism.',
      color: 'bg-orange-50 border-orange-200 text-orange-800'
    },
    {
      name: 'Kapha',
      element: 'Earth & Water',
      icon: <Droplets className="w-6 h-6 text-emerald-400" />,
      description: 'The energy of lubrication and structure. Characteristics: Heavy, slow, cool, oily, smooth.',
      qualities: ['Calm', 'Nurturing', 'Patient', 'Strong stamina'],
      imbalance: 'Lethargy, weight gain, congestion, attachment, depression.',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-800'
    }
  ];

  const commonHerbs = [
    { name: 'Ashwagandha', benefit: 'Stress relief, energy, and immune support.', usage: '1/2 tsp with warm milk/water at night.' },
    { name: 'Turmeric (Haldi)', benefit: 'Anti-inflammatory, healing, and skin health.', usage: 'Mix in food or warm milk (Golden Milk).' },
    { name: 'Tulsi (Holy Basil)', benefit: 'Respiratory health, stress, and immunity.', usage: 'Tea or chew fresh leaves.' },
    { name: 'Triphala', benefit: 'Digestion, detoxification, and eye health.', usage: '1 tsp with warm water before bed.' },
    { name: 'Brahmi', benefit: 'Memory, focus, and nervous system health.', usage: 'Oil massage or powder form.' },
    { name: 'Amla', benefit: 'Vitamin C, hair health, and digestion.', usage: 'Fresh fruit, juice, or powder.' }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-600 to-teal-700 p-8 sm:p-12 text-white shadow-2xl shadow-emerald-200/50">
        <div className="relative z-10 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md border border-white/20">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Ayurvedic Intelligence</h2>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-emerald-50 text-lg leading-relaxed mb-8 font-medium"
          >
            Experience the 5,000-year-old wisdom of Ayurveda powered by advanced AI. Get personalized treatments, understand your Doshas, and embrace a natural lifestyle.
          </motion.p>
          
          <form onSubmit={handleSearch} className="relative group">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for treatments (e.g., Joint pain, Immunity, Hair fall...)"
              className="w-full bg-white/10 border border-white/30 rounded-2xl py-4 pl-14 pr-6 text-white placeholder:text-emerald-100/70 focus:outline-none focus:ring-4 focus:ring-white/20 transition-all backdrop-blur-md text-lg"
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-100/70 group-focus-within:text-white transition-colors" />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white text-emerald-700 px-6 py-2 rounded-xl font-bold hover:bg-emerald-50 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Analyze'}
            </button>
          </form>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-4 p-1.5 bg-slate-100 rounded-2xl w-fit">
        {(['treatments', 'doshas', 'herbs', 'routine'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeCategory === cat
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeCategory === 'treatments' && (
          <motion.div
            key="treatments"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {result ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-xl font-bold text-slate-800">AI Ayurvedic Recommendations</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {result.treatments.map((treatment, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xl shadow-slate-200/40 hover:border-emerald-200 transition-colors"
                      >
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
                          <Leaf className="w-6 h-6 text-emerald-600" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 mb-3">{treatment.name}</h4>
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Benefits</p>
                            <div className="flex flex-wrap gap-2">
                              {treatment.benefits.map((b, i) => (
                                <span key={i} className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full font-bold">
                                  {b}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">How to Use</p>
                            <p className="text-sm text-slate-600 leading-relaxed">{treatment.how_to_use}</p>
                          </div>
                          <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Precaution
                            </p>
                            <p className="text-xs text-amber-800">{treatment.precaution}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="bg-emerald-900 rounded-[2rem] p-8 text-white">
                    <h4 className="text-xl font-bold mb-6 flex items-center gap-3">
                      <BookOpen className="w-6 h-6 text-emerald-400" />
                      Lifestyle & Dietary Wisdom
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {result.lifestyle_tips.map((tip, idx) => (
                        <div key={idx} className="flex items-start gap-3 bg-white/5 p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          </div>
                          <p className="text-sm text-emerald-50 leading-relaxed">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xl shadow-slate-200/40">
                    <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-blue-500" />
                      Dosha Analysis
                    </h4>
                    <div className="prose prose-sm prose-emerald">
                      <ReactMarkdown className="text-slate-600 leading-relaxed">
                        {result.dosha_impact}
                      </ReactMarkdown>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 shadow-xl text-white">
                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Wind className="w-5 h-5 text-blue-400" />
                      Herbal Essence
                    </h4>
                    <div className="space-y-4">
                      {result.herbal_recommendations.map((herb, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                          <span className="text-sm font-medium">{herb}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Discover Ayurvedic Remedies</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  Type your health concern above to get AI-powered Ayurvedic treatment plans and wisdom.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {activeCategory === 'doshas' && (
          <motion.div
            key="doshas"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {doshas.map((dosha, idx) => (
              <div key={idx} className={`rounded-[2.5rem] p-8 border-2 transition-all hover:scale-[1.02] ${dosha.color}`}>
                <div className="bg-white p-4 rounded-3xl w-fit shadow-sm mb-6 border border-inherit">
                  {dosha.icon}
                </div>
                <h3 className="text-2xl font-black mb-1">{dosha.name}</h3>
                <p className="text-sm font-bold opacity-70 mb-6 flex items-center gap-2 uppercase tracking-widest">
                  <Sparkles className="w-4 h-4" /> {dosha.element}
                </p>
                
                <p className="text-sm font-medium leading-relaxed mb-8 opacity-90">{dosha.description}</p>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest mb-3 opacity-60">Prime Qualities</h4>
                    <div className="flex flex-wrap gap-2">
                      {dosha.qualities.map((q, i) => (
                        <span key={i} className="text-[10px] bg-white/50 px-3 py-1.5 rounded-full font-bold border border-inherit">
                          {q}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-white/40 p-5 rounded-2xl border border-inherit">
                    <h4 className="text-xs font-black uppercase tracking-widest mb-2 opacity-60 flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5" /> Signs of Imbalance
                    </h4>
                    <p className="text-xs font-medium leading-relaxed">{dosha.imbalance}</p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeCategory === 'herbs' && (
          <motion.div
            key="herbs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {commonHerbs.map((herb, idx) => (
              <div key={idx} className="bg-white group rounded-3xl border border-slate-100 p-6 shadow-xl shadow-slate-200/40 hover:border-emerald-200 transition-all hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-50 group-hover:bg-emerald-600 transition-colors rounded-2xl flex items-center justify-center">
                    <Leaf className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" />
                  </div>
                  <Sparkles className="w-5 h-5 text-emerald-100 group-hover:text-emerald-500 transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{herb.name}</h3>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">{herb.benefit}</p>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Standard Usage</p>
                  <p className="text-xs text-slate-700 font-medium">{herb.usage}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeCategory === 'routine' && (
          <motion.div
            key="routine"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
              <div className="bg-slate-900 p-10 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-2 flex items-center gap-3">
                    <Clock className="w-7 h-7 text-emerald-400" />
                    Ideal Dinacharya
                  </h3>
                  <p className="text-slate-400 font-medium">Daily Ayurvedic Routine for Optimal Health</p>
                </div>
                <div className="hidden sm:block">
                   <div className="w-20 h-20 rounded-full border-4 border-emerald-500/30 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full border-2 border-emerald-500/50 flex items-center justify-center">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                      </div>
                   </div>
                </div>
              </div>
              
              <div className="p-8 sm:p-10">
                <div className="relative space-y-12 before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                  {[
                    { time: '4:30 - 6:00 AM', title: 'Wake Up (Brahma Muhurta)', activity: 'Rise before the sun to soak up positive energy and clarity.', icon: <Wind className="text-blue-500" /> },
                    { time: '6:00 - 7:00 AM', title: 'Purification', activity: 'Drink warm water, clean tongue, and evacuate. Use a Neti pot if possible.', icon: <Droplets className="text-blue-400" /> },
                    { time: '7:00 - 8:00 AM', title: 'Movement & Self-Care', activity: 'Oil massage (Abhyanga), Yoga, and Pranayama (Breathing).', icon: <Activity className="text-emerald-500" /> },
                    { time: '8:00 - 9:00 AM', title: 'Breakfast', activity: 'Eat a light, warm breakfast suitable for your Dosha.', icon: <Leaf className="text-emerald-400" /> },
                    { time: '12:00 - 1:30 PM', title: 'Main Lunch', activity: 'Fire is strongest (Agni). Eat your biggest meal now.', icon: <Flame className="text-orange-500" /> },
                    { time: '6:00 - 7:30 PM', title: 'Light Dinner', activity: 'Eat at least 3 hours before bed. Keep it very light and warm.', icon: <Wind className="text-indigo-400" /> },
                    { time: '9:00 - 10:00 PM', title: 'Wind Down & Sleep', activity: 'Read, meditate, and sleep by 10 PM to allow liver detox.', icon: <Clock className="text-slate-400" /> },
                  ].map((item, idx) => (
                    <div key={idx} className="relative pl-12">
                      <div className="absolute left-0 top-1.5 w-9 h-9 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center z-10 shadow-sm group-hover:border-emerald-500 transition-colors">
                        <div className="w-5 h-5">{item.icon}</div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <h4 className="text-lg font-extrabold text-slate-900">{item.title}</h4>
                        <span className="text-xs font-black bg-slate-900 text-white px-3 py-1 rounded-full uppercase tracking-widest">{item.time}</span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium">{item.activity}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-emerald-50 p-8 border-t border-emerald-100">
                <div className="flex items-start gap-4">
                   <div className="bg-white p-3 rounded-2xl shadow-sm border border-emerald-100">
                      <Info className="w-6 h-6 text-emerald-600" />
                   </div>
                   <div>
                      <p className="text-sm font-bold text-emerald-900 mb-1">Expert Tip</p>
                      <p className="text-xs text-emerald-800 leading-relaxed">Adjust your routine with the seasons (Ritucharya). In winter, focus more on warming foods and longer rest, while in summer, stay cool and active in the early mornings.</p>
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
