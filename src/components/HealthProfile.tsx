import { useState } from 'react';
import { User, Activity, Heart, Cigarette, Utensils, Dumbbell, Send, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../context/LanguageContext';

interface ProfileResponse {
  analysis: string;
}

import { generateAIContent } from '../lib/gemini';

export default function HealthProfile() {
  const { t, language } = useLanguage();
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [smoker, setSmoker] = useState('no');
  const [diet, setDiet] = useState('balanced');
  const [activity, setActivity] = useState('moderate');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!age || !gender) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const prompt = `
User Profile:
- Age: ${age}
- Gender: ${gender}
- Smoker: ${smoker}
- Diet: ${diet}
- Activity Level: ${activity}
- Language: ${language === 'hi' ? 'Hindi' : 'English'}

Analyze this health profile and provide a personalized risk assessment and recommendations.

STRICT RULES:
- You are NOT a doctor.
- Focus on preventative health and lifestyle improvements.
- Use the following logic as a baseline but elaborate:
  - Young (<30) + Healthy Lifestyle -> Low Risk
  - Old (>50) + Smoker/Bad Diet -> High Risk
  - Middle age + Sedentary -> Moderate Risk
- Provide the ENTIRE response in ${language === 'hi' ? 'Hindi' : 'English'}.

RESPONSE STRUCTURE:

1. 📊 Risk Assessment:
- Level: Low / Moderate / High
- Explanation: Why this level was assigned based on inputs.

2. 🔮 Future Health Outlook:
- Potential risks if current habits continue (e.g., heart disease, diabetes).

3. 🥗 Personalized Diet Plan:
- Specific foods to eat and avoid based on age/lifestyle.
- Ayurvedic dietary tips.

4. 🏃 Fitness & Activity Plan:
- Recommended exercises suitable for their age and activity level.
- Yoga poses for their specific profile.

5. 🌿 Wellness & Mental Health:
- Stress management tips.
- Sleep hygiene.

6. 💡 Key Takeaway:
- One main actionable piece of advice.
`;
      const analysis = await generateAIContent(prompt);
      setResult(analysis.text);
    } catch (err) {
      setError('An error occurred while analyzing your profile. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Input Section */}
      <div className="lg:col-span-5 space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 p-6 sm:p-8"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{t('personal_profile')}</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="profile-age" className="block text-sm font-semibold text-slate-700 mb-2">
                  {t('age')}
                </label>
                <input
                  type="number"
                  id="profile-age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Age"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-slate-50 hover:bg-white"
                />
              </div>
              <div>
                <label htmlFor="profile-gender" className="block text-sm font-semibold text-slate-700 mb-2">
                  {t('gender')}
                </label>
                <select
                  id="profile-gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-slate-50 hover:bg-white"
                >
                  <option value="">{t('select')}</option>
                  <option value="male">{t('male')}</option>
                  <option value="female">{t('female')}</option>
                  <option value="other">{t('other')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                {t('smoker')}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['no', 'occasional', 'regular'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSmoker(option)}
                    className={`py-2.5 px-3 rounded-xl text-sm font-bold border transition-all capitalize ${
                      smoker === option
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {t('diet_type')}
              </label>
              <select
                value={diet}
                onChange={(e) => setDiet(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-slate-50 hover:bg-white"
              >
                <option value="balanced">{t('balanced')}</option>
                <option value="vegetarian">{t('vegetarian')}</option>
                <option value="vegan">{t('vegan')}</option>
                <option value="keto">{t('keto')}</option>
                <option value="paleo">{t('paleo')}</option>
                <option value="fast-food">{t('fast_food')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {t('activity_level')}
              </label>
              <select
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-slate-50 hover:bg-white"
              >
                <option value="sedentary">{t('sedentary')}</option>
                <option value="light">{t('light')}</option>
                <option value="moderate">{t('moderate')}</option>
                <option value="active">{t('active')}</option>
                <option value="very-active">{t('very_active')}</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !age || !gender}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 active:scale-[0.98] mt-4"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t('analyzing')}</span>
                </>
              ) : (
                <>
                  <Activity className="w-5 h-5" />
                  <span>{t('generate_profile')}</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>

      {/* Results Section */}
      <div className="lg:col-span-7">
        {result ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden flex flex-col h-full"
          >
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100/50 px-6 py-5 flex items-center justify-between">
              <h3 className="font-bold text-blue-900 flex items-center gap-3 text-lg">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-blue-600" />
                </div>
                {t('health_analysis')}
              </h3>
              <span className="text-xs font-bold px-3 py-1.5 bg-white border border-blue-200 text-blue-700 rounded-full shadow-sm">
                {t('ai_generated')}
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
                {result}
              </ReactMarkdown>
            </div>
          </motion.div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 min-h-[500px] border-2 border-dashed border-slate-200 rounded-3xl bg-white">
            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
              <User className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{t('profile_assessment')}</h3>
            <p className="max-w-md mx-auto text-slate-500 leading-relaxed">
              {t('profile_text')}
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
  );
}
