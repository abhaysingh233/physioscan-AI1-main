import { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { Activity, Loader2, Zap, AlertTriangle, CheckCircle2, ChevronRight, TrendingUp, History, Dumbbell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Helper to calculate angle between three points
const calculateAngle = (a: any, b: any, c: any) => {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) angle = 360 - angle;
  return angle;
};

interface PoseFeedback {
  status: 'Correct' | 'Incorrect' | 'Searching';
  message: string;
  angleLabel?: string;
  angleValue?: number;
}

const PoseDetection = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [fps, setFps] = useState(0);
  const [feedback, setFeedback] = useState<PoseFeedback>({ status: 'Searching', message: 'Position yourself in the camera frame' });
  const [selectedExercise, setSelectedExercise] = useState<'Squat' | 'Pushup' | 'Plank'>('Squat');
  const [history, setHistory] = useState<{ date: string; exercise: string; score: number }[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  let lastFrameTime = 0;

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pose_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveProgress = (score: number) => {
    const newEntry = {
      date: new Date().toLocaleTimeString(),
      exercise: selectedExercise,
      score: score
    };
    const updatedHistory = [newEntry, ...history].slice(0, 5);
    setHistory(updatedHistory);
    localStorage.setItem('pose_history', JSON.stringify(updatedHistory));
  };

  useEffect(() => {
    const pose = new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      },
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    pose.onResults((results) => {
      if (!canvasRef.current || !webcamRef.current?.video) return;

      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      const canvasCtx = canvasRef.current.getContext('2d');
      if (!canvasCtx) return;

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      if (results.poseLandmarks) {
        // Analysis Logic
        analyzePose(results.poseLandmarks);

        // Draw connections
        drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
          color: feedback.status === 'Correct' ? '#10B981' : feedback.status === 'Incorrect' ? '#EF4444' : '#3B82F6',
          lineWidth: 4,
        });

        drawLandmarks(canvasCtx, results.poseLandmarks, {
          color: '#FFFFFF',
          lineWidth: 2,
          radius: 3,
        });
      } else {
        setFeedback({ status: 'Searching', message: 'No person detected' });
      }
      canvasCtx.restore();

      const now = performance.now();
      if (lastFrameTime > 0) {
        setFps(Math.round(1000 / (now - lastFrameTime)));
      }
      lastFrameTime = now;
      if (isModelLoading) setIsModelLoading(false);
    });

    const analyzePose = (landmarks: any) => {
      if (selectedExercise === 'Squat') {
        // Points: Hip(24), Knee(26), Ankle(28)
        const angle = calculateAngle(landmarks[24], landmarks[26], landmarks[28]);
        const hipKneeDiff = Math.abs(landmarks[24].y - landmarks[26].y);

        if (angle < 100) {
          if (hipKneeDiff < 0.1) {
            setFeedback({ status: 'Correct', message: 'Great depth!', angleLabel: 'Knee Angle', angleValue: Math.round(angle) });
            setRecommendations([]);
          } else {
            setFeedback({ status: 'Incorrect', message: 'Lower your hips more', angleLabel: 'Knee Angle', angleValue: Math.round(angle) });
            setRecommendations(['Keep your back straight', 'Weight on your heels']);
          }
        } else if (angle > 160) {
          setFeedback({ status: 'Searching', message: 'Ready to squat', angleLabel: 'Knee Angle', angleValue: Math.round(angle) });
        } else {
          setFeedback({ status: 'Incorrect', message: 'Go lower for a full rep', angleLabel: 'Knee Angle', angleValue: Math.round(angle) });
        }
      } else if (selectedExercise === 'Pushup') {
        // Points: Shoulder(12), Elbow(14), Wrist(16)
        const angle = calculateAngle(landmarks[12], landmarks[14], landmarks[16]);
        if (angle < 90) {
          setFeedback({ status: 'Correct', message: 'Excellent pushup!', angleLabel: 'Elbow Angle', angleValue: Math.round(angle) });
        } else {
          setFeedback({ status: 'Incorrect', message: 'Lower your chest more', angleLabel: 'Elbow Angle', angleValue: Math.round(angle) });
        }
      }
    };

    if (webcamRef.current?.video) {
      const camera = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (webcamRef.current?.video) {
            await pose.send({ image: webcamRef.current.video });
          }
        },
        width: 1280,
        height: 720,
      });
      camera.start();
    }

    return () => {
      pose.close();
    };
  }, [selectedExercise, feedback.status]);

  return (
    <div className="space-y-6">
      {/* Header with Exercise Selection */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            Smart Posture Analysis
          </h2>
          <p className="text-slate-500 mt-1">Real-time joint angle calculation and corrective feedback</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {(['Squat', 'Pushup', 'Plank'] as const).map((ex) => (
            <button
              key={ex}
              onClick={() => setSelectedExercise(ex)}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${selectedExercise === ex
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Viewport */}
        <div className="lg:col-span-8 space-y-6">
          <div className="relative aspect-video bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border border-slate-800 group">
            {isModelLoading && (
              <div className="absolute inset-0 z-20 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <p className="font-bold text-lg">Initializing Bio-Engine...</p>
              </div>
            )}

            <Webcam ref={webcamRef} className="absolute inset-0 w-full h-full object-cover" mirrored={true} onUserMedia={() => setIsCameraActive(true)} />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover z-10" style={{ transform: 'scaleX(-1)' }} />

            {/* Live Feedback Overlay */}
            <AnimatePresence>
              {isCameraActive && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-6 left-6 z-30 space-y-3"
                >
                  <div className={`px-4 py-3 rounded-2xl backdrop-blur-md border flex items-center gap-3 shadow-xl ${feedback.status === 'Correct' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-100' :
                      feedback.status === 'Incorrect' ? 'bg-red-500/20 border-red-500/30 text-red-100' :
                        'bg-black/40 border-white/10 text-white'
                    }`}>
                    {feedback.status === 'Correct' ? <CheckCircle2 className="w-5 h-5" /> :
                      feedback.status === 'Incorrect' ? <AlertTriangle className="w-5 h-5" /> :
                        <Loader2 className="w-5 h-5 animate-spin" />}
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Status</div>
                      <div className="font-bold leading-tight">{feedback.message}</div>
                    </div>
                  </div>

                  {feedback.angleLabel && (
                    <div className="px-4 py-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-white inline-block">
                      <span className="text-[10px] font-bold uppercase opacity-60 mr-2">{feedback.angleLabel}:</span>
                      <span className="font-mono font-bold text-blue-400">{feedback.angleValue}°</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Real-time Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase">Current Performance</div>
                <div className="text-xl font-black text-slate-800">{feedback.status === 'Correct' ? '98%' : '---'}</div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <Dumbbell className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase">Target Reps</div>
                <div className="text-xl font-black text-slate-800">12 / 15</div>
              </div>
            </div>
            <button
              onClick={() => saveProgress(95)}
              className="bg-slate-900 p-5 rounded-3xl shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-3 group"
            >
              <div className="text-left">
                <div className="text-xs font-bold text-slate-500 uppercase">Save Session</div>
                <div className="text-white font-bold">Track Progress</div>
              </div>
              <ChevronRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Sidebar Features */}
        <div className="lg:col-span-4 space-y-6">
          {/* Recommendations */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/40 border border-slate-100"
          >
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              AI Exercise Tips
            </h3>
            {recommendations.length > 0 ? (
              <div className="space-y-3">
                {recommendations.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-red-50 text-red-700 text-sm font-medium">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {tip}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-700 text-sm font-medium flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5" />
                Posture looks stable! Maintain this form.
              </div>
            )}
          </motion.div>

          {/* History / Dashboard */}
          <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/40 border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              Recent Progress
            </h3>
            <div className="space-y-4">
              {history.length > 0 ? history.map((entry, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-xs">
                      {entry.exercise[0]}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{entry.exercise}</div>
                      <div className="text-[10px] text-slate-400 font-bold">{entry.date}</div>
                    </div>
                  </div>
                  <div className="text-emerald-600 font-black text-sm">{entry.score}%</div>
                </div>
              )) : (
                <div className="text-center py-8 text-slate-400">
                  <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm font-medium">No sessions recorded yet</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Assistance */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-6 text-white shadow-xl shadow-blue-200">
            <h4 className="font-bold mb-2 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              AI Assistant
            </h4>
            <p className="text-xs text-blue-100 leading-relaxed mb-4">
              Need help with your routine? Our AI can guide you through corrective exercises based on your detected posture errors.
            </p>
            <button className="w-full py-2.5 bg-white text-blue-600 rounded-xl text-xs font-black shadow-lg shadow-blue-900/20 active:scale-95 transition-all">
              START AI GUIDANCE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoseDetection;
