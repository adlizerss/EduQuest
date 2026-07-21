import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Award, RotateCcw, ArrowRight, CheckCircle, 
  XCircle, Trophy, BookOpen, User, Hash, School, AlertCircle, Clock, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QuizQuestion, StudentResult } from '../types';
import { addStudentResult } from '../db';
import sound from '../utils/audio';

interface StudentRPGProps {
  studentName: string;
  attendanceNum: string;
  className: string;
  questions: QuizQuestion[];
  onQuit: () => void;
}

export default function StudentRPG({ studentName, attendanceNum, className, questions, onQuit }: StudentRPGProps) {
  // Gameplay State
  const [score, setScore] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(25);
  
  // Interaction State
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [shakeScreen, setShakeScreen] = useState<boolean>(false);
  
  // Floating Event Feedback Text
  const [combatEvent, setCombatEvent] = useState<{ text: string; color: string; id: number } | null>(null);

  // Track results submission
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  // Game completed state
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  const currentQuestion = questions[currentIdx];

  const handleTimeOut = () => {
    if (isAnswered) return;
    sound.playDamage();
    setIsAnswered(true);
    setSelectedAnswer(null);
    showCombatEvent("⏰ WAKTU HABIS! (+0 Poin)", "text-amber-400 font-extrabold");
  };

  // Countdown Timer Effect (25 seconds per question)
  useEffect(() => {
    if (isAnswered || isGameOver) return;
    
    setTimeLeft(25);
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [currentIdx, isAnswered, isGameOver]);

  const triggerGameOver = (isSuccess: boolean) => {
    setIsGameOver(true);
    sound.playGameOver(isSuccess);
    saveGameResult();
  };

  const showCombatEvent = (text: string, color: string) => {
    setCombatEvent({ text, color, id: Date.now() });
  };

  const handleOptionClick = (opt: 'A' | 'B' | 'C' | 'D') => {
    if (isAnswered) return;

    sound.playClick();
    setSelectedAnswer(opt);
    setIsAnswered(true);

    const isCognitive = currentQuestion.type === 'cognitive';

    if (isCognitive) {
      const isCorrect = opt === currentQuestion.correct_answer;
      if (isCorrect) {
        sound.playCorrect();
        const timeBonus = timeLeft * 10;
        const earnedScore = 50 + timeBonus;
        setScore(prev => prev + earnedScore);
        setCorrectCount(prev => prev + 1);
        showCombatEvent(`+${earnedScore} POIN! (Bonus Waktu: ${timeLeft}s)`, "text-emerald-400 font-extrabold");
      } else {
        sound.playDamage();
        setShakeScreen(true);
        showCombatEvent("JAWABAN SALAH! (+0 Poin)", "text-rose-500 font-extrabold");
        setTimeout(() => setShakeScreen(false), 500);
      }
    } else {
      sound.playCorrect();
      const timeBonus = timeLeft * 10;
      const earnedScore = 50 + timeBonus;
      setScore(prev => prev + earnedScore);
      setCorrectCount(prev => prev + 1);
      showCombatEvent(`+${earnedScore} POIN! (Eksplorasi Minat)`, "text-purple-400 font-extrabold");
    }
  };

  const handleNext = () => {
    sound.playClick();
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      triggerGameOver(true);
    }
  };

  // Save game result to database / localStorage
  const saveGameResult = async () => {
    setIsSubmitting(true);
    
    const finalResult: StudentResult = {
      student_name: studentName,
      class_name: `${className} (Absen ${attendanceNum})`,
      score: score,
      remaining_hp: 100,
      role: "Siswa Active Learner",
      submit_at: new Date().toISOString()
    };

    try {
      await addStudentResult(finalResult);
      setSubmitSuccess(true);
    } catch (e) {
      console.error("Gagal menyimpan hasil kuis siswa:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rendering Game Completion Screen
  if (isGameOver) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative font-sans overflow-y-auto">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl -z-10" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-3xl w-full bg-slate-900/95 border border-slate-800 rounded-3xl p-8 md:p-10 shadow-2xl text-center neon-glow-cyan my-8"
        >
          {/* Badge Status */}
          <div className="mx-auto mb-6 inline-block">
            <div className="w-24 h-24 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center text-5xl shadow-lg neon-glow-emerald animate-bounce">
              🏆
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-display text-white tracking-tight leading-none uppercase">
            KUIS SELESAI!
          </h1>
          <p className="text-slate-400 text-base md:text-lg mt-2 font-medium">
            Selamat! Kamu telah menyelesaikan seluruh soal kuis EduQuest.
          </p>

          {/* Stats Bento Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 my-8">
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl shadow-inner">
              <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">TOTAL POIN</span>
              <span className="text-3xl md:text-4xl font-black text-cyan-400 font-display mt-1 block">{score} Poin</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl shadow-inner">
              <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">JAWABAN BENAR</span>
              <span className="text-3xl md:text-4xl font-black text-emerald-400 font-display mt-1 block">{correctCount} / {questions.length}</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl shadow-inner">
              <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">NAMA SISWA</span>
              <span className="text-base font-extrabold text-white truncate block mt-2">{studentName}</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl shadow-inner">
              <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">KELAS (ABSEN)</span>
              <span className="text-base font-extrabold text-indigo-400 truncate block mt-2">{className} ({attendanceNum})</span>
            </div>
          </div>

          {/* Auto submit report indicator */}
          <div className="text-sm py-3 px-5 bg-slate-950 border border-slate-800 rounded-2xl inline-flex items-center gap-2 mb-8 font-semibold shadow-inner">
            {isSubmitting ? (
              <span className="text-slate-400 animate-pulse flex items-center gap-1.5">
                ⏳ Melaporkan perolehan poin ke server guru...
              </span>
            ) : submitSuccess ? (
              <span className="text-emerald-400 font-extrabold flex items-center gap-1.5">
                ✓ Hasil poin berhasil terekap otomatis di database Guru!
              </span>
            ) : (
              <span className="text-rose-400 font-extrabold">
                ⚠ Gagal menyimpan rekap nilai otomatis ke database.
              </span>
            )}
          </div>

          {/* Action button */}
          <div className="flex justify-center">
            <button
              onClick={() => { sound.playClick(); onQuit(); }}
              className="bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black py-4 px-8 rounded-2xl text-base tracking-widest cursor-pointer transition flex items-center justify-center gap-2 shadow-lg uppercase"
            >
              <RotateCcw className="w-5 h-5" /> KEMBALI KE MENU UTAMA
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col p-6 relative font-sans select-none overflow-hidden ${shakeScreen ? 'shake-animation' : ''}`}>
      
      {/* Dynamic Background Pulse */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl -z-10" />

      {/* Floating Score Event Text */}
      <AnimatePresence>
        {combatEvent && (
          <motion.div
            key={combatEvent.id}
            initial={{ opacity: 1, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: -80, scale: 1.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className={`absolute left-1/2 -translate-x-1/2 z-50 pointer-events-none font-display font-black text-2xl md:text-4xl tracking-wider text-center drop-shadow-[0_6px_12px_rgba(0,0,0,0.9)] ${combatEvent.color}`}
          >
            {combatEvent.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top HUD Header */}
      <header className="max-w-5xl w-full mx-auto bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 flex flex-wrap gap-6 items-center justify-between mb-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-cyan-500 to-indigo-600 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-lg shadow-cyan-500/30 shrink-0">
            {attendanceNum}
          </div>
          <div>
            <h2 className="text-lg font-black text-white truncate max-w-[150px] sm:max-w-xs">{studentName}</h2>
            <p className="text-xs text-cyan-400 font-extrabold uppercase tracking-widest">{className}</p>
          </div>
        </div>

        {/* Total Points Display */}
        <div className="flex items-center gap-6">
          <div className="bg-slate-950 border border-slate-800 px-5 py-2.5 rounded-2xl flex items-center gap-3 shadow-inner">
            <Zap className="w-6 h-6 text-amber-400 animate-bounce" />
            <div>
              <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">TOTAL POIN</span>
              <span className="text-xl font-black text-amber-400 font-display">{score} Poin</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Gameplay Screen */}
      <main className="flex-1 max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-6">
        
        {/* Left Section: Question and Answer Options */}
        <section className="col-span-1 lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-2xl">
          
          {/* Header of Quiz Card */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-slate-800/60 mb-6 gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-mono font-black uppercase tracking-widest">
                Soal {currentIdx + 1} dari {questions.length}
              </span>
              
              <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                currentQuestion.type === 'cognitive' 
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                  : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
              }`}>
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                {currentQuestion.type === 'cognitive' ? 'Soal Pengetahuan' : 'Eksplorasi Minat'}
              </span>
            </div>

            {/* 25-Second Countdown Timer Display */}
            {!isAnswered ? (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">⌛ WAKTU:</span>
                <span className={`font-black font-display text-sm px-3 py-1 rounded-lg border transition duration-150 flex items-center gap-1 ${
                  timeLeft > 15 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : timeLeft > 7 
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' 
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/30 font-black'
                }`}>
                  {timeLeft} Detik
                </span>
              </div>
            ) : (
              <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest font-mono bg-slate-950 px-2.5 py-1 border border-slate-900 rounded-lg">
                🔒 Waktu Terkunci
              </div>
            )}
          </div>

          {/* Timer Progress Bar */}
          {!isAnswered && (
            <div className="w-full bg-slate-950 h-2 border border-slate-800 rounded-full overflow-hidden relative -mt-4 mb-6 shadow-inner">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  timeLeft > 15 
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' 
                    : timeLeft > 7 
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400 animate-pulse' 
                    : 'bg-gradient-to-r from-rose-600 to-rose-400 animate-pulse'
                }`}
                style={{ width: `${(timeLeft / 25) * 100}%` }}
              />
            </div>
          )}

          {/* Question Text */}
          <div className="flex-1 flex flex-col justify-center min-h-[160px] mb-8">
            <h1 className="text-2xl md:text-3xl font-black text-white leading-snug tracking-tight font-display">
              {currentQuestion.question}
            </h1>
            {currentQuestion.type === 'interest' && (
              <p className="text-xs text-amber-400/90 font-bold italic mt-3">
                * Kuis Eksplorasi Minat: Pilih opsi yang paling menggambarkan dirimu!
              </p>
            )}
          </div>

          {/* Options Grid */}
          <div className="space-y-4">
            {(['A', 'B', 'C', 'D'] as const).map((opt) => {
              const optionText = opt === 'A' ? currentQuestion.option_a :
                                 opt === 'B' ? currentQuestion.option_b :
                                 opt === 'C' ? currentQuestion.option_c :
                                 currentQuestion.option_d;

              let buttonStyle = "border-slate-800 bg-slate-950/80 hover:border-slate-700 hover:bg-slate-900 text-slate-200";
              let iconFeedback = null;

              if (isAnswered) {
                const isSelected = selectedAnswer === opt;
                const isCorrect = opt === currentQuestion.correct_answer;
                
                if (currentQuestion.type === 'cognitive') {
                  if (isCorrect) {
                    buttonStyle = "border-2 border-emerald-500 bg-emerald-500/15 text-emerald-300 font-extrabold";
                    iconFeedback = <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />;
                  } else if (isSelected) {
                    buttonStyle = "border-2 border-rose-500 bg-rose-500/15 text-rose-300 font-extrabold";
                    iconFeedback = <XCircle className="w-5 h-5 text-rose-400 shrink-0" />;
                  } else {
                    buttonStyle = "border-slate-950 bg-slate-950/20 text-slate-600 opacity-30";
                  }
                } else {
                  if (isSelected) {
                    buttonStyle = "border-2 border-purple-500 bg-purple-500/20 text-purple-300 font-black";
                    iconFeedback = <Sparkles className="w-5 h-5 text-purple-400 shrink-0" />;
                  } else {
                    buttonStyle = "border-slate-950 bg-slate-950/20 text-slate-600 opacity-30";
                  }
                }
              }

              return (
                <button
                  key={opt}
                  disabled={isAnswered}
                  onClick={() => handleOptionClick(opt)}
                  className={`w-full border p-5 md:p-6 rounded-2xl text-left text-sm md:text-base lg:text-lg font-bold transition duration-150 flex items-center justify-between gap-4 ${
                    isAnswered ? '' : 'cursor-pointer active:scale-[0.99] hover:shadow-lg'
                  } ${buttonStyle}`}
                >
                  <span className="leading-relaxed flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center font-black text-xs shrink-0">
                      {opt}
                    </span>
                    {optionText}
                  </span>
                  {iconFeedback}
                </button>
              );
            })}
          </div>

          {/* Next / Actions Button */}
          <div className="pt-6 border-t border-slate-800/40 mt-8 flex justify-end">
            <button
              disabled={!isAnswered}
              onClick={handleNext}
              className={`px-8 py-4 rounded-2xl text-sm md:text-base font-black uppercase tracking-wider transition-all duration-150 flex items-center gap-2.5 ${
                isAnswered 
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white cursor-pointer hover:shadow-xl hover:shadow-cyan-500/20 active:scale-95' 
                  : 'bg-slate-950 border border-slate-900 text-slate-600 cursor-not-allowed'
              }`}
            >
              {currentIdx === questions.length - 1 ? 'Selesaikan Kuis' : 'Soal Selanjutnya'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* Right Section: Speed Scoring Rules Card */}
        <section className="col-span-1 lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-2xl">
          <div className="space-y-5">
            <div className="pb-4 border-b border-slate-800/60">
              <h2 className="text-base font-black text-white font-display flex items-center gap-2 uppercase tracking-widest">
                ⚡ Sistem Poin Kecepatan
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Semakin cepat Anda menjawab dengan benar, semakin banyak poin yang didapatkan!
              </p>
            </div>

            {/* Point Bonus Card */}
            <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl space-y-3 shadow-inner font-sans">
              <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest">Rumus Poin:</h3>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs font-mono text-slate-200">
                Poin = 50 Base + (Sisa Detik × 10)
              </div>
              <ul className="text-xs text-slate-400 space-y-2 font-medium">
                <li className="flex items-center justify-between">
                  <span>⏱️ Jawab di detik 25:</span>
                  <span className="font-bold text-emerald-400">300 Poin</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>⏱️ Jawab di detik 15:</span>
                  <span className="font-bold text-cyan-400">200 Poin</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>⏱️ Jawab di detik 5:</span>
                  <span className="font-bold text-amber-400">100 Poin</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>❌ Salah / Waktu Habis:</span>
                  <span className="font-bold text-rose-400">0 Poin</span>
                </li>
              </ul>
            </div>

            {/* Current Quiz Progress Stats */}
            <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl space-y-3 shadow-inner font-sans">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Statistik Pengerjaan</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block font-bold text-[10px]">TOTAL POIN</span>
                  <span className="text-lg font-black text-amber-400 mt-0.5 block">{score}</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block font-bold text-[10px]">JAWABAN BENAR</span>
                  <span className="text-lg font-black text-emerald-400 mt-0.5 block">{correctCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick instructions/statistics footer */}
          <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-2xl flex items-start gap-3 text-xs text-slate-400 leading-relaxed font-medium mt-5">
            <AlertCircle className="w-5 h-5 shrink-0 text-cyan-400 mt-0.5" />
            <span>
              <b>Tips:</b> Baca soal dengan teliti dan pilih jawaban secepat mungkin untuk memaksimalkan total poin Anda!
            </span>
          </div>
        </section>
      </main>

      {/* Footer Back trigger */}
      <footer className="max-w-5xl w-full mx-auto flex justify-between text-xs sm:text-sm text-slate-500 px-2 font-medium">
        <span>EduQuest © 2026</span>
        <button 
          onClick={() => { sound.playClick(); onQuit(); }}
          className="text-slate-400 hover:text-white font-extrabold transition cursor-pointer flex items-center gap-1 uppercase tracking-wider"
        >
          Keluar Ke Menu Utama
        </button>
      </footer>
    </div>
  );
}
