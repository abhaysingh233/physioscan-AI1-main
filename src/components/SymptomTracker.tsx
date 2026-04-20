import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Plus, Trash2, AlertCircle, CheckCircle2, Loader2, Activity, TrendingUp } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SymptomLog {
  id: number;
  date: string;
  symptom: string;
  severity: number;
  notes: string;
}

export default function SymptomTracker() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<SymptomLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [symptom, setSymptom] = useState('');
  const [severity, setSeverity] = useState(5);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/symptoms');
      if (!res.ok) throw new Error('Failed to fetch logs');
      const data = await res.json();
      setLogs(data.symptoms);
    } catch (err) {
      console.error(err);
      setError('Failed to load symptom history');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, symptom, severity, notes }),
      });

      if (!res.ok) throw new Error('Failed to save log');

      // Refresh logs and reset form
      await fetchLogs();
      setSymptom('');
      setSeverity(5);
      setNotes('');
    } catch (err) {
      console.error(err);
      setError('Failed to save symptom log');
    } finally {
      setSubmitting(false);
    }
  };

  const getSeverityColor = (level: number) => {
    if (level <= 3) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (level <= 7) return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    return 'bg-purple-100 text-purple-700 border-purple-200';
  };

  // Prepare data for the chart (sort by date ascending)
  const chartData = [...logs].reverse().map(log => ({
    date: new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    severity: log.severity,
    symptom: log.symptom
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Input Form */}
      <div className="lg:col-span-4 space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 p-6 sm:p-8 sticky top-6"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{t('log_symptoms')}</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="log-date" className="block text-sm font-semibold text-slate-700 mb-2">
                {t('date')}
              </label>
              <input
                type="date"
                id="log-date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-slate-50 hover:bg-white"
                required
              />
            </div>

            <div>
              <label htmlFor="log-symptom" className="block text-sm font-semibold text-slate-700 mb-2">
                {t('symptom_desc')}
              </label>
              <input
                type="text"
                id="log-symptom"
                value={symptom}
                onChange={(e) => setSymptom(e.target.value)}
                placeholder="e.g., Headache, Nausea, Fatigue"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-slate-50 hover:bg-white"
                required
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label htmlFor="log-severity" className="block text-sm font-semibold text-slate-700">
                  {t('severity')}
                </label>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-md border shadow-sm ${getSeverityColor(severity)}`}>
                  {severity}
                </span>
              </div>
              <input
                type="range"
                id="log-severity"
                min="1"
                max="10"
                value={severity}
                onChange={(e) => setSeverity(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs font-medium text-slate-400 mt-2">
                <span>{t('severity_mild')}</span>
                <span>{t('severity_moderate')}</span>
                <span>{t('severity_severe')}</span>
              </div>
            </div>

            <div>
              <label htmlFor="log-notes" className="block text-sm font-semibold text-slate-700 mb-2">
                {t('notes_optional')}
              </label>
              <textarea
                id="log-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any triggers, duration, or extra details..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all h-28 resize-none bg-slate-50 hover:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !symptom}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 active:scale-[0.98] mt-4"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t('saving')}</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>{t('log_entry')}</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>

      {/* History List & Graph */}
      <div className="lg:col-span-8 space-y-6">
        {/* Graph Section */}
        {chartData.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Severity Trend</h3>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 10]} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="severity" 
                    stroke="#4f46e5" 
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden min-h-[500px]">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100/50 px-6 py-5 flex items-center justify-between">
            <h3 className="font-bold text-blue-900 flex items-center gap-3 text-lg">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              {t('symptom_history')}
            </h3>
            <span className="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full border border-blue-200 shadow-sm">
              {logs.length} {t('entries')}
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
              <p className="font-medium">{t('loading_history')}</p>
            </div>
          ) : logs.length > 0 ? (
            <div className="divide-y divide-slate-100">
              <AnimatePresence>
                {logs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-5 sm:p-6 hover:bg-slate-50/80 transition-colors group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-grow">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                          <span className="text-sm font-bold text-slate-500 w-28 flex-shrink-0 group-hover:text-blue-600 transition-colors">
                            {new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <h4 className="font-bold text-slate-900 text-lg group-hover:text-blue-700 transition-colors">{log.symptom}</h4>
                        </div>
                        
                        {log.notes && (
                          <p className="text-[15px] text-slate-600 sm:ml-[128px] leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 mt-2 group-hover:border-blue-100 transition-colors">{log.notes}</p>
                        )}
                      </div>

                      <div className={`flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-bold border shadow-sm self-start sm:self-auto ${getSeverityColor(log.severity)}`}>
                        Severity: {log.severity}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-slate-400 text-center p-8 bg-white">
              <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
                <Activity className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{t('no_symptoms_logged')}</h3>
              <p className="max-w-md mx-auto text-slate-500 leading-relaxed">
                {t('start_tracking_text')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
