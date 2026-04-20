import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, Utensils, Dumbbell, Coffee, Sun, Moon, CheckCircle2, Bell, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface RoutineItem {
  time: string;
  activity: string;
  type: 'diet' | 'yoga' | 'habit' | 'workout';
  details: string;
  calories?: string;
  ingredients?: string[];
  source?: string;
}

import { generateAIContent } from '../lib/gemini';

export default function DailyRoutine() {
  const { t, language } = useLanguage();
  const [condition, setCondition] = useState('');
  const [wakeUpTime, setWakeUpTime] = useState('07:00');
  const [loading, setLoading] = useState(false);
  const [routine, setRoutine] = useState<RoutineItem[] | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const lastCheckedTimeRef = useRef<string | null>(null);
  const notifiedItemsRef = useRef<Set<string>>(new Set());

  // Check for notifications every minute
  useEffect(() => {
    if (!routine || !notificationsEnabled) return;

    const checkRoutine = () => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTimeString = `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;

      // Avoid checking multiple times in the same minute
      if (currentTimeString === lastCheckedTimeRef.current) return;
      lastCheckedTimeRef.current = currentTimeString;

      routine.forEach((item) => {
        // Parse item time (e.g., "07:00 AM")
        const normalizedTime = item.time.toUpperCase().trim();
        const match = normalizedTime.match(/(\d+):(\d+)\s*(AM|PM)/);
        
        if (match) {
          let [_, h, m, ampm] = match;
          let itemHours = parseInt(h, 10);
          
          if (ampm === 'PM' && itemHours !== 12) itemHours += 12;
          if (ampm === 'AM' && itemHours === 12) itemHours = 0;

          const itemTimeString = `${itemHours.toString().padStart(2, '0')}:${m}`;
          
          // Check if it's time for this activity
          if (itemTimeString === currentTimeString) {
            const notificationKey = `${item.time}-${item.activity}`;
            
            // Only notify if we haven't already for this specific item today
            if (!notifiedItemsRef.current.has(notificationKey)) {
              if (Notification.permission === 'granted') {
                new Notification(`Time for: ${item.activity}`, {
                  body: item.details,
                  icon: "/vite.svg",
                  tag: notificationKey // Prevent duplicate notifications on some platforms
                });
                notifiedItemsRef.current.add(notificationKey);
              }
            }
          }
          
          // Update active item index based on time
          // We can also do this here to keep the UI in sync
          const itemMinutesTotal = itemHours * 60 + parseInt(m, 10);
          const currentMinutesTotal = currentHours * 60 + currentMinutes;
          
          // If the item time is within the last hour, mark it as active
          if (currentMinutesTotal >= itemMinutesTotal && currentMinutesTotal < itemMinutesTotal + 60) {
             // We'll handle active index separately or let the existing logic handle it if it exists
             // For now, let's just use this loop to find the most relevant active item
          }
        }
      });
    };

    const interval = setInterval(checkRoutine, 10000); // Check every 10 seconds to be safe
    checkRoutine();

    return () => clearInterval(interval);
  }, [routine, notificationsEnabled]);

  // Update active item based on time
  useEffect(() => {
    if (!routine) return;
    
    const updateActiveItem = () => {
      const now = new Date();
      const currentMinutesTotal = now.getHours() * 60 + now.getMinutes();
      
      let activeIndex = -1;
      let minDiff = Infinity;

      routine.forEach((item, index) => {
        const normalizedTime = item.time.toUpperCase().trim();
        const match = normalizedTime.match(/(\d+):(\d+)\s*(AM|PM)/);
        
        if (match) {
          let [_, h, m, ampm] = match;
          let itemHours = parseInt(h, 10);
          if (ampm === 'PM' && itemHours !== 12) itemHours += 12;
          if (ampm === 'AM' && itemHours === 12) itemHours = 0;
          
          const itemMinutesTotal = itemHours * 60 + parseInt(m, 10);
          
          // Find the item that is closest to current time but in the past (or now)
          const diff = currentMinutesTotal - itemMinutesTotal;
          if (diff >= 0 && diff < minDiff) {
            minDiff = diff;
            activeIndex = index;
          }
        }
      });
      
      setActiveItemIndex(activeIndex);
    };

    updateActiveItem();
    const interval = setInterval(updateActiveItem, 60000);
    return () => clearInterval(interval);
  }, [routine]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!condition) return;

    setLoading(true);
    setRoutine(null);

    try {
      const prompt = `
User Condition/Goal: "${condition}"
Preferred Wake Up Time: "${wakeUpTime || '7:00 AM'}"
Language: ${language === 'hi' ? 'Hindi' : 'English'}

Generate a personalized Daily Health Routine for this user.
Include specific Diet (Breakfast, Lunch, Dinner, Snacks), Yoga/Exercise, and Healthy Habits.

For DIET items, you MUST include:
- Specific Meal Name
- Estimated Calories
- Key Ingredients list
- A short "Why this helps" explanation
- Cite a general nutritional guideline (e.g., "Aligned with balanced diet principles")

STRICT JSON RESPONSE FORMAT:
Return ONLY a JSON array of objects. Do not include markdown formatting like \`\`\`json.
Provide the 'details', 'activity', 'ingredients', 'source' and 'why it helps' in ${language === 'hi' ? 'Hindi' : 'English'}. Keep JSON keys in English.

Example:
[
  { 
    "time": "07:00 AM", 
    "activity": "Wake up & Hydrate", 
    "type": "habit", 
    "details": "Drink 2 glasses of warm water with lemon." 
  },
  { 
    "time": "08:00 AM", 
    "activity": "Oatmeal with Berries", 
    "type": "diet", 
    "details": "A bowl of oatmeal topped with fresh berries and nuts.",
    "calories": "350 kcal",
    "ingredients": ["Oats", "Mixed Berries", "Almonds", "Milk"],
    "whyItHelps": "High fiber provides sustained energy.",
    "source": "General Nutritional Guidelines"
  }
]
`;

      const response = await generateAIContent(prompt, true, "gemini-3-flash-preview");
      setRoutine(response);
      
      // Active item will be set by the useEffect
    } catch (error) {
      console.error("Error generating routine:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleNotifications = () => {
    if (!notificationsEnabled) {
      // Request permission
      if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            setNotificationsEnabled(true);
            new Notification(t('routine_started'), {
              body: t('routine_notification_body'),
              icon: "/vite.svg"
            });
          }
        });
      } else {
        alert(t('notifications_not_supported'));
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'diet': return <Utensils className="w-5 h-5 text-orange-500" />;
      case 'yoga': return <Sun className="w-5 h-5 text-yellow-500" />;
      case 'workout': return <Dumbbell className="w-5 h-5 text-blue-500" />;
      case 'habit': return <Coffee className="w-5 h-5 text-emerald-500" />;
      default: return <Clock className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Input Section */}
      <div className="lg:col-span-4 space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 p-6 sm:p-8"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{t('routine_generator')}</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="condition" className="block text-sm font-semibold text-slate-700 mb-2">
                {t('health_goal')}
              </label>
              <textarea
                id="condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder="e.g., Weight loss, Managing Diabetes, Recovering from Flu, Stress relief..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none h-28 bg-slate-50 hover:bg-white"
                required
              />
            </div>

            <div>
              <label htmlFor="wakeTime" className="block text-sm font-semibold text-slate-700 mb-2">
                {t('wake_up_time')}
              </label>
              <input
                type="time"
                id="wakeTime"
                value={wakeUpTime}
                onChange={(e) => setWakeUpTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-slate-50 hover:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !condition}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 active:scale-[0.98] mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t('generating')}</span>
                </>
              ) : (
                <>
                  <Calendar className="w-5 h-5" />
                  <span>{t('create_routine')}</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
      
      {/* Routine Display */}
      <div className="lg:col-span-8">
        {routine ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100/50 px-6 py-5 flex items-center justify-between">
              <h3 className="font-bold text-blue-900 flex items-center gap-3 text-lg">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                {t('personalized_schedule')}
              </h3>
              
              <button
                onClick={toggleNotifications}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${
                  notificationsEnabled 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200 shadow-blue-100' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <Bell className={`w-3.5 h-3.5 ${notificationsEnabled ? 'fill-current' : ''}`} />
                {notificationsEnabled ? t('notifications_on') : t('enable_notifications')}
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {routine.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-5 sm:p-6 flex flex-col sm:flex-row gap-5 hover:bg-slate-50/80 transition-colors group ${
                    activeItemIndex === index ? 'bg-blue-50/40 relative overflow-hidden' : ''
                  }`}
                >
                  {activeItemIndex === index && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full" />
                  )}
                  
                  <div className="flex-shrink-0 w-24 text-sm font-bold text-slate-500 pt-1 border-r border-slate-100 sm:border-none pr-4 sm:pr-0 group-hover:text-blue-600 transition-colors">
                    {item.time}
                  </div>
                  
                  <div className="flex-grow space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                          {getTypeIcon(item.type)}
                        </div>
                        <h4 className="font-bold text-slate-900 text-lg group-hover:text-blue-700 transition-colors">{item.activity}</h4>
                      </div>
                      {activeItemIndex === index && (
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse border border-blue-200/50 shadow-sm">
                          {t('now')}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-slate-600 leading-relaxed text-[15px]">{item.details}</p>

                    {item.type === 'diet' && (
                      <div className="mt-4 bg-slate-50 rounded-2xl p-5 border border-slate-100 group-hover:border-blue-100 transition-colors">
                        <div className="flex flex-col sm:flex-row gap-5">
                          {/* Generated Image */}
                          <div className="w-full sm:w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden bg-slate-200 shadow-sm border border-slate-200/50">
                            <img 
                              src={`https://image.pollinations.ai/prompt/${encodeURIComponent(item.activity + " " + item.details)}?width=300&height=300&nologo=true`} 
                              alt={item.activity}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                          </div>
                          
                          <div className="flex-grow space-y-3">
                            {item.calories && (
                              <div className="flex items-center gap-2 text-sm text-slate-700">
                                <span className="font-bold text-orange-600 uppercase tracking-wider text-xs">{t('calories')}</span>
                                <span className="bg-orange-50 text-orange-700 px-2.5 py-1 rounded-md text-xs font-bold border border-orange-200/50 shadow-sm">
                                  {item.calories}
                                </span>
                              </div>
                            )}
                            
                            {item.ingredients && item.ingredients.length > 0 && (
                              <div className="text-sm">
                                <span className="font-bold text-slate-700 block mb-2 uppercase tracking-wider text-xs">{t('ingredients')}</span>
                                <div className="flex flex-wrap gap-2">
                                  {item.ingredients.map((ing, i) => (
                                    <span key={i} className="bg-white border border-slate-200 text-slate-600 px-2.5 py-1 rounded-md text-xs font-medium shadow-sm hover:border-blue-300 hover:text-blue-700 transition-colors cursor-default">
                                      {ing}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {item.source && (
                              <div className="text-xs text-slate-400 mt-3 flex items-center gap-1.5 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                                <span>{t('source')} <span className="text-slate-500">{item.source}</span></span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 min-h-[500px] border-2 border-dashed border-slate-200 rounded-3xl bg-white">
            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
              <Calendar className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{t('no_routine')}</h3>
            <p className="max-w-md mx-auto text-slate-500 leading-relaxed">
              {t('no_routine_text')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
