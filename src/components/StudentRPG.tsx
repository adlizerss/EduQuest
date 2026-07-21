import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Award, RotateCcw, ArrowRight, CheckCircle, 
  XCircle, Trophy, BookOpen, User, Hash, School, AlertCircle, Clock, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QuizQuestion, StudentResult } from '../types';
import { addStudentResult } from '../db';
import sound from '../utils/audio';

interface QuizPlaygroundProps {
  studentName: string;
  attendanceNum: string;
  className: string;
  questions: QuizQuestion[];
  onQuit: () => void;
}

export default function QuizPlayground({ studentName, attendanceNum, className, questions, onQuit }: QuizPlaygroundProps) {
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
      showCombatEvent(`+${earnedScore} POIN! (Eksplorasi Minat)`, "text-purple-300 font-extrabold");
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
      console.error("Gagal menyimpan hasil kuis murid:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rendering Game Completion Screen
  if (isGameOver) {
    return (
      <div className="min-h-screen bg-[#0b0518] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative font-sans overflow-y-auto select-none">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-purple-600/30 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-violet-600/25 rounded-full blur-[130px] -z-10" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="max-w-3xl w-full bg-gradient-to-br from-purple-700 via-violet-800 to-indigo-900 border-2 border-purple-300/50 rounded-3xl p-6 sm:p-10 shadow-[0_15px_50px_rgba(147,51,234,0.5)] text-center my-6 text-white"
        >
          {/* Trophy Icon Badge */}
          <div className="mx-auto mb-6 inline-block">
            <motion.div 
              animate={{ rotate: [0, -5, 5, 0], scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="w-20 h-20 sm:w-24 sm:h-24 bg-amber-400/20 text-amber-300 border-2 border-amber-300/50 rounded-3xl flex items-center justify-center text-4xl sm:text-5xl shadow-xl"
            >
              🏆
            </motion.div>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-display text-white tracking-tight leading-none uppercase">
            KUIS SELESAI!
          </h1>
          <p className="text-purple-100 text-sm sm:text-base md:text-lg mt-3 font-medium max-w-lg mx-auto">
            Selamat <span className="text-amber-300 font-bold">{studentName}</span>! Kamu telah menyelesaikan seluruh soal kuis EduQuest.
          </p>

          {/* Gamified Bento Grid Stats with Vibrant Colors */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 my-8">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 border border-amber-300/50 p-4 rounded-2xl shadow-lg text-center text-white">
              <span className="block text-[10px] font-black text-amber-100 uppercase tracking-widest">TOTAL POIN</span>
              <span className="text-2xl sm:text-3xl font-black text-white font-display mt-1 block">{score} Poin</span>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-teal-700 border border-emerald-300/50 p-4 rounded-2xl shadow-lg text-center text-white">
              <span className="block text-[10px] font-black text-emerald-100 uppercase tracking-widest">JAWABAN BENAR</span>
              <span className="text-2xl sm:text-3xl font-black text-white font-display mt-1 block">{correctCount} / {questions.length}</span>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 border border-blue-300/50 p-4 rounded-2xl shadow-lg text-center text-white">
              <span className="block text-[10px] font-black text-blue-100 uppercase tracking-widest">NAMA MURID</span>
              <span className="text-xs sm:text-sm font-extrabold text-white truncate block mt-2">{studentName}</span>
            </div>
            <div className="bg-gradient-to-br from-pink-500 to-rose-600 border border-pink-300/50 p-4 rounded-2xl shadow-lg text-center text-white">
              <span className="block text-[10px] font-black text-pink-100 uppercase tracking-widest">KELAS (ABSEN)</span>
              <span className="text-xs sm:text-sm font-extrabold text-white truncate block mt-2">{className} ({attendanceNum})</span>
            </div>
          </div>

          {/* Auto submit report indicator */}
          <div className="text-xs sm:text-sm py-3 px-5 bg-purple-950/80 border border-purple-300/40 rounded-2xl inline-flex items-center gap-2 mb-8 font-semibold shadow-inner">
            {isSubmitting ? (
              <span className="text-amber-300 animate-pulse flex items-center gap-1.5">
                ⏳ Melaporkan perolehan poin ke server guru...
              </span>
            ) : submitSuccess ? (
              <span className="text-emerald-300 font-extrabold flex items-center gap-1.5">
                ✓ Hasil poin berhasil terekap otomatis di database Guru!
              </span>
            ) : (
              <span className="text-rose-300 font-extrabold">
                ⚠ Gagal menyimpan rekap nilai otomatis ke database.
              </span>
            )}
          </div>

          {/* Action button */}
          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { sound.playClick(); onQuit(); }}
              className="bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-slate-950 font-black py-3.5 sm:py-4 px-8 rounded-2xl text-xs sm:text-sm tracking-widest cursor-pointer transition-all flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(245,158,11,0.4)] uppercase font-display"
            >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" /> KEMBALI KE MENU UTAMA
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#0b0518] text-slate-100 flex flex-col p-4 sm:p-6 relative font-sans select-none overflow-x-hidden ${shakeScreen ? 'shake-animation' : ''}`}>
      
      {/* Background Decorative Purple Orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-purple-600/30 rounded-full blur-[130px] -z-10" />
      <div className="absolute bottom-1/3 right-1/4 w-80 sm:w-[28rem] h-80 sm:h-[28rem] bg-violet-600/25 rounded-full blur-[140px] -z-10" />

      {/* Floating Score Event Text */}
      <AnimatePresence>
        {combatEvent && (
          <motion.div
            key={combatEvent.id}
            initial={{ opacity: 1, y: 80, scale: 0.8 }}
            animate={{ opacity: 1, y: -60, scale: 1.25 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className={`absolute left-1/2 -translate-x-1/2 z-50 pointer-events-none font-display font-black text-xl sm:text-3xl md:text-4xl tracking-wider text-center drop-shadow-[0_6px_15px_rgba(0,0,0,0.9)] ${combatEvent.color}`}
          >
            {combatEvent.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Electric Purple HUD Header */}
      <header className="max-w-5xl w-full mx-auto bg-gradient-to-r from-purple-700 via-violet-800 to-indigo-900 border-2 border-purple-400/50 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-wrap gap-4 items-center justify-between mb-6 shadow-2xl text-white">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-slate-950 text-base sm:text-lg shadow-lg shrink-0 font-display">
            {attendanceNum}
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-white truncate max-w-[140px] sm:max-w-xs">{studentName}</h2>
            <p className="text-[11px] text-amber-300 font-extrabold uppercase tracking-widest">{className}</p>
          </div>
        </div>

        {/* Total Points Display */}
        <div className="flex items-center gap-4">
          <div className="bg-purple-950/80 border border-purple-300/40 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl flex items-center gap-2.5 shadow-inner">
            <Zap className="w-5 h-5 text-amber-300 animate-bounce" />
            <div>
              <span className="block text-[9px] sm:text-[10px] font-black text-purple-200 uppercase tracking-widest">TOTAL POIN</span>
              <span className="text-base sm:text-xl font-black text-amber-300 font-display">{score} Poin</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Gameplay Screen */}
      <main className="flex-1 max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-6">
        
        {/* Left Section: Question and Answer Options */}
        <section className="col-span-1 lg:col-span-8 bg-gradient-to-br from-purple-900/90 via-violet-950/90 to-slate-950/90 border-2 border-purple-400/40 rounded-2xl sm:rounded-3xl p-5 sm:p-7 md:p-8 flex flex-col justify-between shadow-2xl text-white">
          
          <div>
            {/* Header of Quiz Card */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-purple-400/30 mb-5 gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-amber-300 font-mono font-black uppercase tracking-widest">
                  Soal {currentIdx + 1} dari {questions.length}
                </span>
                
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                  currentQuestion.type === 'cognitive' 
                    ? 'bg-purple-500/30 text-purple-200 border border-purple-300/50' 
                    : 'bg-pink-500/30 text-pink-200 border border-pink-300/50'
                }`}>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  {currentQuestion.type === 'cognitive' ? 'Soal Pengetahuan' : 'Eksplorasi Minat'}
                </span>
              </div>

              {/* 25-Second Countdown Timer Display */}
              {!isAnswered ? (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-300" />
                  <span className="text-[10px] font-black text-purple-200 uppercase tracking-widest font-mono">WAKTU:</span>
                  <span className={`font-black font-display text-xs sm:text-sm px-3 py-1 rounded-lg border transition-all duration-150 flex items-center gap-1 ${
                    timeLeft > 15 
                      ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400/50' 
                      : timeLeft > 7 
                      ? 'bg-amber-500/30 text-amber-200 border-amber-400/50 animate-pulse' 
                      : 'bg-rose-500/30 text-rose-200 border-rose-400/50 font-black'
                  }`}>
                    {timeLeft} Detik
                  </span>
                </div>
              ) : (
                <div className="text-[10px] text-purple-300 font-black uppercase tracking-widest font-mono bg-purple-950/90 px-2.5 py-1 border border-purple-400/30 rounded-lg">
                  🔒 Waktu Terkunci
                </div>
              )}
            </div>

            {/* Timer Progress Bar */}
            {!isAnswered && (
              <div className="w-full bg-purple-950/90 h-2.5 border border-purple-400/30 rounded-full overflow-hidden relative mb-6 shadow-inner">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    timeLeft > 15 
                      ? 'bg-gradient-to-r from-purple-400 via-pink-400 to-emerald-400' 
                      : timeLeft > 7 
                      ? 'bg-gradient-to-r from-amber-400 to-orange-400 animate-pulse' 
                      : 'bg-gradient-to-r from-rose-600 to-rose-400 animate-pulse'
                  }`}
                  style={{ width: `${(timeLeft / 25) * 100}%` }}
                />
              </div>
            )}

            {/* Question Text */}
            <div className="min-h-[120px] sm:min-h-[150px] flex flex-col justify-center mb-6">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-snug tracking-tight font-display">
                {currentQuestion.question}
              </h1>
              {currentQuestion.type === 'interest' && (
                <p className="text-xs text-amber-300/90 font-bold italic mt-2.5">
                  * Kuis Eksplorasi Minat: Pilih opsi yang paling menggambarkan dirimu!
                </p>
              )}
            </div>

            {/* Options Grid with Fluid Hover & Tap Feedback */}
            <div className="space-y-3.5">
              {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                const optionText = opt === 'A' ? currentQuestion.option_a :
                                   opt === 'B' ? currentQuestion.option_b :
                                   opt === 'C' ? currentQuestion.option_c :
                                   currentQuestion.option_d;

                let buttonStyle = "border-2 border-purple-400/40 bg-purple-950/80 hover:border-amber-300 hover:bg-purple-800/60 text-white";
                let iconFeedback = null;

                if (isAnswered) {
                  const isSelected = selectedAnswer === opt;
                  const isCorrect = opt === currentQuestion.correct_answer;
                  
                  if (currentQuestion.type === 'cognitive') {
                    if (isCorrect) {
                      buttonStyle = "border-2 border-emerald-400 bg-emerald-500/30 text-emerald-100 font-extrabold shadow-lg";
                      iconFeedback = <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />;
                    } else if (isSelected) {
                      buttonStyle = "border-2 border-rose-500 bg-rose-500/30 text-rose-100 font-extrabold";
                      iconFeedback = <XCircle className="w-5 h-5 text-rose-400 shrink-0" />;
                    } else {
                      buttonStyle = "border-purple-950 bg-purple-950/30 text-slate-500 opacity-40";
                    }
                  } else {
                    if (isSelected) {
                      buttonStyle = "border-2 border-amber-300 bg-purple-600/50 text-amber-200 font-black shadow-lg";
                      iconFeedback = <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />;
                    } else {
                      buttonStyle = "border-purple-950 bg-purple-950/30 text-slate-500 opacity-40";
                    }
                  }
                }

                return (
                  <motion.button
                    key={opt}
                    disabled={isAnswered}
                    whileHover={isAnswered ? {} : { scale: 1.015, translateY: -1 }}
                    whileTap={isAnswered ? {} : { scale: 0.985 }}
                    onClick={() => handleOptionClick(opt)}
                    className={`w-full p-4 sm:p-5 rounded-2xl text-left text-base sm:text-lg md:text-xl font-extrabold transition-all duration-150 flex items-center justify-between gap-3 sm:gap-4 ${
                      isAnswered ? '' : 'cursor-pointer'
                    } ${buttonStyle}`}
                  >
                    <span className="leading-relaxed flex items-center gap-3.5">
                      <span className="w-9 h-9 rounded-xl bg-purple-900/90 border border-purple-300/40 text-amber-300 flex items-center justify-center font-black text-sm shrink-0 font-display shadow-inner">
                        {opt}
                      </span>
                      {optionText}
                    </span>
                    {iconFeedback}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Next / Actions Button */}
          <div className="pt-5 border-t border-purple-400/30 mt-6 flex justify-end">
            <motion.button
              disabled={!isAnswered}
              whileHover={isAnswered ? { scale: 1.03 } : {}}
              whileTap={isAnswered ? { scale: 0.97 } : {}}
              onClick={handleNext}
              className={`px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-150 flex items-center gap-2 font-display ${
                isAnswered 
                  ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-slate-950 cursor-pointer shadow-lg' 
                  : 'bg-purple-950/50 border border-purple-400/20 text-purple-400/40 cursor-not-allowed'
              }`}
            >
              {currentIdx === questions.length - 1 ? 'Selesaikan Kuis' : 'Soal Selanjutnya'}
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
          </div>
        </section>

        {/* Right Section: Speed Scoring Rules Card */}
        <section className="col-span-1 lg:col-span-4 bg-gradient-to-br from-purple-900/90 via-violet-950/90 to-slate-950/90 border-2 border-purple-400/40 rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-2xl text-white">
          <div className="space-y-5">
            <div className="pb-4 border-b border-purple-400/30">
              <h2 className="text-sm sm:text-base font-black text-white font-display flex items-center gap-2 uppercase tracking-widest">
                ⚡ Poin Kecepatan
              </h2>
              <p className="text-xs text-purple-200 font-medium mt-1 leading-relaxed">
                Semakin cepat Anda menjawab benar, semakin banyak poin bonus yang dikumpulkan!
              </p>
            </div>

            {/* Point Bonus Card */}
            <div className="bg-gradient-to-br from-purple-800 to-indigo-900 border border-purple-300/40 p-4 sm:p-5 rounded-2xl space-y-3 shadow-lg font-sans">
              <h3 className="text-xs font-black text-amber-300 uppercase tracking-widest font-display">Rumus Poin:</h3>
              <div className="bg-purple-950/80 p-2.5 rounded-xl border border-purple-300/40 text-xs font-mono text-amber-300 text-center font-bold">
                50 Base + (Sisa Detik × 10)
              </div>
              <ul className="text-xs text-purple-100 space-y-2 font-medium">
                <li className="flex items-center justify-between">
                  <span>⏱️ Jawab detik 25:</span>
                  <span className="font-bold text-emerald-300 font-display">300 Poin</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>⏱️ Jawab detik 15:</span>
                  <span className="font-bold text-amber-300 font-display">200 Poin</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>⏱️ Jawab detik 5:</span>
                  <span className="font-bold text-pink-300 font-display">100 Poin</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>❌ Salah / Timeout:</span>
                  <span className="font-bold text-rose-400 font-display">0 Poin</span>
                </li>
              </ul>
            </div>

            {/* Current Quiz Progress Stats */}
            <div className="bg-purple-950/80 border border-purple-300/40 p-4 sm:p-5 rounded-2xl space-y-3 shadow-inner font-sans">
              <h3 className="text-xs font-black text-purple-300 uppercase tracking-widest font-display">Statistik Pengerjaan</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-xl text-white shadow">
                  <span className="text-amber-100 block font-bold text-[10px]">TOTAL POIN</span>
                  <span className="text-base sm:text-lg font-black text-white mt-0.5 block font-display">{score}</span>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-teal-700 p-3 rounded-xl text-white shadow">
                  <span className="text-emerald-100 block font-bold text-[10px]">BENAR</span>
                  <span className="text-base sm:text-lg font-black text-white mt-0.5 block font-display">{correctCount} / {questions.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick instructions footer */}
          <div className="bg-purple-950/90 border border-purple-300/40 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-purple-200 leading-relaxed font-medium mt-5">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-300 mt-0.5" />
            <span>
              <b>Tips:</b> Berpikir cepat & teliti untuk mengamankan posisi teratas di papan rekap guru!
            </span>
          </div>
        </section>
      </main>

      {/* Footer Back trigger */}
      <footer className="max-w-5xl w-full mx-auto flex justify-between items-center text-xs text-purple-300 px-2 font-medium">
        <span>EduQuest © 2026</span>
        <button 
          onClick={() => { sound.playClick(); onQuit(); }}
          className="text-amber-300 hover:text-white font-extrabold transition cursor-pointer flex items-center gap-1 uppercase tracking-wider"
        >
          Keluar Ke Menu Utama
        </button>
      </footer>
    </div>
  );
}
