import { useState } from 'react';
import { GoogleLogin, googleLogout, useGoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Mail, Lock, User, ArrowRight, Loader2, Heart, Activity, Brain, Stethoscope, CheckCircle2, AlertCircle, Users, BookOpen, Clock, FileText, Zap, GraduationCap } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface AuthProps {
  onLogin: (user: any) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const body = isLogin ? { email, password } : { email, password, name };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t('auth_error'));
      }

      onLogin(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* Navigation Bar */}
      <nav className="w-full px-6 py-4 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">PhysioScan<span className="text-blue-600">.edu</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
          <a href="#faculty" className="hover:text-blue-600 transition-colors">For Faculty</a>
          <a href="#students" className="hover:text-blue-600 transition-colors">For Students</a>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsLogin(true)}
            className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
          >
            Sign In
          </button>
          <button 
            onClick={() => setIsLogin(false)}
            className="text-sm font-medium bg-slate-900 text-white px-5 py-2.5 rounded-full hover:bg-slate-800 transition-all shadow-md hover:shadow-xl"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Main Hero Section */}
      <main className="flex flex-col lg:flex-row min-h-[calc(100vh-73px)]">
        
        {/* Left Side: Hero & Value Prop */}
        <div className="lg:w-[55%] p-8 lg:p-16 xl:p-24 flex flex-col justify-center relative overflow-hidden bg-white">
          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-blue-50 blur-3xl opacity-70" />
            <div className="absolute top-[40%] -right-[20%] w-[60%] h-[60%] rounded-full bg-emerald-50 blur-3xl opacity-70" />
          </div>

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold tracking-wide uppercase mb-8">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
              University Health Portal 2.0
            </div>
            
            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-slate-900 leading-[1.1] tracking-tight mb-6">
              Intelligent care for <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">
                campus wellness.
              </span>
            </h1>
            
            <p className="text-lg lg:text-xl text-slate-600 mb-10 leading-relaxed max-w-xl">
              Empowering students and faculty with AI-driven symptom analysis, real-time health tracking, and seamless campus clinic integration.
            </p>

            <div className="grid sm:grid-cols-2 gap-6 mb-12">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Brain className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">AI Diagnostics</h3>
                  <p className="text-sm text-slate-500 mt-1">Instant preliminary analysis for peace of mind.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <Activity className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Health Tracking</h3>
                  <p className="text-sm text-slate-500 mt-1">Monitor vitals and symptoms over the semester.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
                  <Stethoscope className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Faculty Dashboard</h3>
                  <p className="text-sm text-slate-500 mt-1">Secure overview of campus health trends.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
                  <Heart className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Mental Wellness</h3>
                  <p className="text-sm text-slate-500 mt-1">Integrated breathing and stress management.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="lg:w-[45%] bg-slate-50 flex items-center justify-center p-8 lg:p-16 border-l border-slate-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {isLogin ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="text-slate-500 text-sm">
                {isLogin ? 'Enter your credentials to access your portal.' : 'Join the campus health network today.'}
              </p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence mode="popLayout">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1.5"
                  >
                    <label className="text-sm font-medium text-slate-700">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-slate-50 hover:bg-white transition-colors sm:text-sm"
                        placeholder="Dr. Jane Doe or Student Name"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">University Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-slate-50 hover:bg-white transition-colors sm:text-sm"
                    placeholder="name@university.edu"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Password</label>
                  {isLogin && (
                    <a href="#" className="text-xs font-medium text-blue-600 hover:text-blue-500">
                      Forgot password?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-slate-50 hover:bg-white transition-colors sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-6"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {isLogin ? 'Sign In to Portal' : 'Create Account'}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </button>
              {/* Google Login Button */}
              <div className="mt-4 flex flex-col items-center">
                <GoogleLogin
                  onSuccess={credentialResponse => {
                    // Send credentialResponse.credential to backend for verification
                    fetch('/api/auth/google', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ token: credentialResponse.credential })
                    })
                      .then(res => res.json())
                      .then(data => {
                        if (data.user) {
                          onLogin(data.user);
                        } else {
                          setError(data.error || 'Google login failed');
                        }
                      })
                      .catch(() => setError('Google login failed'));
                  }}
                  onError={() => setError('Google login failed')}
                  useOneTap
                />
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-600">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                >
                  {isLogin ? 'Sign up now' : 'Sign in instead'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-blue-600 font-semibold tracking-wide uppercase text-sm mb-3">Core Features</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything you need for campus health</h3>
            <p className="text-lg text-slate-600">A comprehensive suite of tools designed to monitor, manage, and improve the wellbeing of the entire university community.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Brain, title: "AI Symptom Analysis", desc: "Get instant, AI-powered insights on health symptoms before visiting the clinic." },
              { icon: Activity, title: "Daily Routine Planner", desc: "Personalized daily schedules for meals, exercise, and study breaks." },
              { icon: Heart, title: "Mental Wellness", desc: "Guided breathing exercises and mental health check-ins to reduce stress." },
              { icon: Stethoscope, title: "Doctor Finder", desc: "Locate and book appointments with nearby healthcare professionals easily." },
              { icon: FileText, title: "Health Records", desc: "Securely store and access your medical history, prescriptions, and test results." },
              { icon: Zap, title: "Emergency SOS", desc: "One-tap access to emergency services, campus security, and first-aid guides." }
            ].map((feature, idx) => (
              <div key={idx} className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-xl hover:shadow-blue-600/5 transition-all group">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200 mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7 text-blue-600" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h4>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Faculty Section */}
      <section id="faculty" className="py-24 bg-slate-900 text-white relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-600/20 to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold tracking-wide uppercase mb-6">
                <Users className="w-4 h-4" /> For Faculty & Staff
              </div>
              <h3 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">Monitor campus health trends in real-time.</h3>
              <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                Empower your administration with anonymized health data, streamline clinic operations, and proactively address campus-wide wellness issues before they escalate.
              </p>
              
              <ul className="space-y-5">
                {[
                  "Dashboard analytics for campus health trends",
                  "Manage clinic appointments and schedules",
                  "Broadcast health alerts to all students",
                  "Secure, HIPAA-compliant data handling"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-slate-200">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-2xl opacity-30 animate-pulse" />
              <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8 relative shadow-2xl">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-700">
                  <div>
                    <h4 className="font-bold text-xl">Campus Health Overview</h4>
                    <p className="text-slate-400 text-sm">Live metrics</p>
                  </div>
                  <Activity className="w-8 h-8 text-blue-400" />
                </div>
                <div className="space-y-6">
                  <div className="bg-slate-900/50 rounded-2xl p-5 border border-slate-700/50">
                    <div className="text-sm text-slate-400 mb-1">Active Clinic Visits Today</div>
                    <div className="text-3xl font-bold text-white">124</div>
                    <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 -rotate-45" /> 12% decrease from yesterday
                    </div>
                  </div>
                  <div className="bg-slate-900/50 rounded-2xl p-5 border border-slate-700/50">
                    <div className="text-sm text-slate-400 mb-1">Reported Flu Symptoms</div>
                    <div className="text-3xl font-bold text-white">38</div>
                    <div className="text-xs text-red-400 mt-2 flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 -rotate-45" /> 5% increase from yesterday
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Students Section */}
      <section id="students" className="py-24 bg-blue-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="absolute -inset-4 bg-white rounded-3xl blur-2xl opacity-60" />
              <div className="bg-white border border-slate-200 rounded-3xl p-8 relative shadow-xl shadow-blue-900/5">
                <div className="flex items-center gap-4 mb-8">
                  <img src="https://picsum.photos/seed/student1/100/100" alt="Student" className="w-16 h-16 rounded-full border-4 border-blue-50" referrerPolicy="no-referrer" />
                  <div>
                    <h4 className="font-bold text-lg text-slate-900">Sarah Jenkins</h4>
                    <p className="text-blue-600 text-sm font-medium">Computer Science, Year 3</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Morning Routine Complete</div>
                      <div className="text-sm text-slate-500">Meditation & Breakfast</div>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Upcoming Appointment</div>
                      <div className="text-sm text-slate-500">Campus Clinic at 2:30 PM</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold tracking-wide uppercase mb-6">
                <GraduationCap className="w-4 h-4" /> For Students
              </div>
              <h3 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">Your personal health companion on campus.</h3>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Balancing academics and health is hard. PhysioScan gives you the tools to manage stress, track symptoms, and access care instantly—so you can focus on your studies.
              </p>
              
              <ul className="space-y-5">
                {[
                  "24/7 AI Health Assistant for quick questions",
                  "Book clinic appointments without waiting in line",
                  "Personalized routines to balance study and health",
                  "Quick access to emergency contacts and guides"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-slate-700 font-medium">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-bold text-slate-900 tracking-tight">PhysioScan<span className="text-blue-600">.edu</span></span>
          </div>
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} PhysioScan AI. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm font-medium text-slate-500">
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
