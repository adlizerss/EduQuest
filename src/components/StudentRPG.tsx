import React, { useState, useEffect } from 'react';
import { 
  Heart, Zap, Shield, Sparkles, Award, RotateCcw, ArrowRight, CheckCircle, 
  XCircle, Trophy, BookOpen, User, Hash, School, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QuizQuestion, StudentResult, RPGState } from '../types';
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
  // RPG State
  const [hp, setHp] = useState<number>(100);
  const [mp, setMp] = useState<number>(0);
  const [shieldActive, setShieldActive] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(15);
  
  // Interaction State
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [eliminatedOptions, setEliminatedOptions] = useState<('A' | 'B' | 'C' | 'D')[]>([]);
  const [shakeScreen, setShakeScreen] = useState<boolean>(false);
  
  // Float text for combat events (+20 Mana, -25 HP, Shield block)
  const [combatEvent, setCombatEvent] = useState<{ text: string; color: string; id: number } | null>(null);
  
  // Track interest questionnaire answers
  const [interestVotes, setInterestVotes] = useState<{ A: number; B: number; C: number; D: number }>({
    A: 0, B: 0, C: 0, D: 0
  });

  // Track results submission
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  // Game over state
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  const currentQuestion = questions[currentIdx];

  // Auto end game if HP is 0
  useEffect(() => {
    if (hp <= 0) {
      triggerGameOver(false);
    }
  }, [hp]);

  const handleTimeOut = () => {
    if (isAnswered) return;
    sound.playDamage();
    setIsAnswered(true);
    setSelectedAnswer(null);

    if (currentQuestion.type === 'cognitive') {
      if (shieldActive) {
        sound.playShield();
        setShieldActive(false);
        showCombatEvent("WAKTU HABIS! Perisai Menahan Damage", "text-cyan-400 font-extrabold");
      } else {
        setHp(prev => Math.max(0, prev - 25));
        setShakeScreen(true);
        showCombatEvent("WAKTU HABIS! -25 HP (Damage)", "text-rose-500 font-extrabold");
        setTimeout(() => setShakeScreen(false), 500);
      }
    } else {
      showCombatEvent("WAKTU HABIS! (Eksplorasi)", "text-amber-400 font-extrabold");
    }
  };

  // Countdown Timer Effect (15 seconds per question)
  useEffect(() => {
    if (isAnswered || isGameOver) return;
    
    setTimeLeft(15);
    
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
    // Auto-save results when game ends
    saveGameResult(isSuccess);
  };

  const showCombatEvent = (text: string, color: string) => {
    setCombatEvent({ text, color, id: Date.now() });
  };

  // Use Spell: Bagi Dua (Cost: 40 MP)
  const castBagiDua = () => {
    if (mp < 40) {
      sound.playDamage();
      showCombatEvent("MANA TIDAK CUKUP!", "text-cyan-400");
      return;
    }
    if (isAnswered) return;
    if (currentQuestion.type === 'interest') {
      showCombatEvent("SOAL MINAT - JAWABAN BEBAS!", "text-amber-400");
      return;
    }

    sound.playSpell();
    setMp(prev => prev - 40);
    showCombatEvent("JURUS BAGI DUA! -40 MP", "text-pink-400");

    // Logic: find 2 wrong options that are not the correct answer, and not already eliminated
    const correctAnswer = currentQuestion.correct_answer;
    const options: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
    const wrongOptions = options.filter(opt => opt !== correctAnswer);
    
    // Shuffle wrong options and pick 2 to eliminate
    const shuffledWrong = [...wrongOptions].sort(() => Math.random() - 0.5);
    const toEliminate = shuffledWrong.slice(0, 2);
    setEliminatedOptions(toEliminate);
  };

  // Use Spell: Perisai Kognitif (Cost: 30 MP)
  const castPerisai = () => {
    if (mp < 30) {
      sound.playDamage();
      showCombatEvent("MANA TIDAK CUKUP!", "text-cyan-400");
      return;
    }
    if (shieldActive) {
      showCombatEvent("PERISAI SUDAH AKTIF!", "text-yellow-400");
      return;
    }

    sound.playShield();
    setMp(prev => prev - 30);
    setShieldActive(true);
    showCombatEvent("PERISAI AKTIF! -30 MP", "text-emerald-400");
  };

  const handleOptionClick = (opt: 'A' | 'B' | 'C' | 'D') => {
    if (isAnswered) return;
    if (eliminatedOptions.includes(opt)) return;

    sound.playClick();
    setSelectedAnswer(opt);
    setIsAnswered(true);

    const isCognitive = currentQuestion.type === 'cognitive';

    if (isCognitive) {
      const isCorrect = opt === currentQuestion.correct_answer;
      if (isCorrect) {
        sound.playCorrect();
        const earnedScore = 10 + timeLeft;
        setScore(prev => prev + earnedScore);
        setMp(prev => Math.min(100, prev + 20));
        showCombatEvent(`+${earnedScore} Skor! (Bonus Detik: +${timeLeft})`, "text-emerald-400 font-extrabold");
      } else {
        // Incorrect answer
        if (shieldActive) {
          sound.playShield();
          setShieldActive(false); // consume shield
          showCombatEvent("PERISAI MENAHAN DAMAGE!", "text-cyan-400");
        } else {
          sound.playDamage();
          setHp(prev => Math.max(0, prev - 25));
          setShakeScreen(true);
          showCombatEvent("-25 HP (Damage)", "text-rose-500");
          setTimeout(() => setShakeScreen(false), 4000);
        }
      }
    } else {
      // Interest survey type: All answers are correct, and they map to wirausaha roles
      sound.playCorrect();
      const earnedScore = 10 + timeLeft;
      setScore(prev => prev + earnedScore);
      setMp(prev => Math.min(100, prev + 20));
      showCombatEvent(`+${earnedScore} Skor! (Eksplorasi)`, "text-purple-400 font-extrabold");
      
      // Track the selected choice for final role calculation
      setInterestVotes(prev => ({
        ...prev,
        [opt]: prev[opt] + 1
      }));
    }
  };

  const handleNext = () => {
    sound.playClick();
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      // Reset interaction states
      setSelectedAnswer(null);
      setIsAnswered(false);
      setEliminatedOptions([]);
    } else {
      // Last question finished
      triggerGameOver(true);
    }
  };

  // Determine Persona Role
  const calculatePersona = () => {
    const { A, B, C, D } = interestVotes;
    const maxVal = Math.max(A, B, C, D);
    
    if (maxVal === 0) {
      // Fallback if no interest questions were answered
      return {
        role: "Inovator Muda Serba Bisa (Generalist)",
        icon: "✨",
        color: "from-amber-400 to-orange-500",
        description: "Anda memiliki profil seimbang dalam berbagai aspek pengerjaan tim! Anda adalah pembelajar cepat yang berpotensi memimpin inovasi secara fleksibel.",
        strengths: "Beradaptasi dengan cepat, berwawasan luas, kolaboratif.",
        tip: "Fokuslah mendalami satu keterampilan spesifik yang paling Anda sukai untuk mengasah keahlian utama Anda."
      };
    }

    if (maxVal === A) {
      return {
        role: "Perencana Strategis (Strategic Planner)",
        icon: "📝",
        color: "from-indigo-500 to-cyan-500",
        description: "Anda sangat kuat dalam menyusun perencanaan taktis, menganalisis peluang, merinci struktur anggaran atau data, dan merancang visi jangka panjang.",
        strengths: "Berpikir logis, jago perencanaan, visioner, pandai membaca peluang.",
        tip: "Latihlah untuk mengeksekusi ide-ide Anda ke dalam bentuk nyata, bukan hanya di atas konsep rancangan!"
      };
    } else if (maxVal === B) {
      return {
        role: "Kreator & Pelaksana (Creator / Maker)",
        icon: "🛠️",
        color: "from-emerald-500 to-teal-500",
        description: "Anda menyukai pengerjaan karya nyata, eksperimen teknis, merancang keluaran berkualitas tinggi, dan tekun dalam mengutamakan detail fungsional.",
        strengths: "Fokus pada detail karya, memiliki keterampilan teknis yang tinggi, tekun dalam proses pengerjaan.",
        tip: "Ingatlah untuk belajar membagikan ide dan mengomunikasikan karya hebat Anda agar orang lain memahami nilainya!"
      };
    } else if (maxVal === C) {
      return {
        role: "Komunikator & Presenter (Communicator Specialist)",
        icon: "📢",
        color: "from-pink-500 to-rose-500",
        description: "Anda memiliki kemampuan komunikasi yang tajam. Anda ahli dalam membuat narasi kreatif, merancang presentasi memikat, dan meyakinkan tim atau publik.",
        strengths: "Kemampuan komunikasi persuasif, melek cara presentasi modern, sangat memahami audiens.",
        tip: "Perdalam juga pemahaman teknis atau data dasar agar presentasi Anda didukung landasan argumen yang kuat!"
      };
    } else {
      return {
        role: "Koordinator Tim (Operations Coordinator)",
        icon: "👑",
        color: "from-amber-500 to-yellow-500",
        description: "Anda adalah pemimpin alami. Anda unggul dalam mengatur alur kerja kelompok, mendelegasikan peran secara adil, serta memastikan kualitas hasil berjalan lancar.",
        strengths: "Kepemimpinan tegas, manajemen tim yang rapi, disiplin, berorientasi pada kualitas bersama.",
        tip: "Berikan ruang bagi rekan tim Anda untuk berkreasi secara fleksibel agar iklim kerja kelompok tetap menyenangkan!"
      };
    }
  };

  const persona = calculatePersona();

  // Save game result to Supabase / Local Storage
  const saveGameResult = async (isSuccess: boolean) => {
    setIsSubmitting(true);
    
    const finalResult: StudentResult = {
      student_name: studentName,
      class_name: `${className} (${attendanceNum})`,
      score: score,
      remaining_hp: hp,
      role: persona.role,
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

  // Rendering Game Over Screen
  if (isGameOver) {
    const isVictory = hp > 0;
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
            {isVictory ? (
              <div className="w-24 h-24 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center text-5xl shadow-lg neon-glow-emerald animate-bounce">
                🏆
              </div>
            ) : (
              <div className="w-24 h-24 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-full flex items-center justify-center text-5xl shadow-lg neon-glow-pink">
                💀
              </div>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-display text-white tracking-tight leading-none uppercase">
            {isVictory ? "MISI SELESAI!" : "GAME OVER!"}
          </h1>
          <p className="text-slate-400 text-base md:text-lg mt-2 font-medium">
            {isVictory 
              ? "Hebat! Kamu berhasil menyelesaikan seluruh tantangan kuis." 
              : "HP kamu habis! Tetap semangat belajar dan coba lagi nanti."
            }
          </p>

          {/* Stats Bento Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 my-8">
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl shadow-inner">
              <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">SKOR AKHIR</span>
              <span className="text-3xl md:text-4xl font-black text-cyan-400 font-display mt-1 block">{score} Pt</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl shadow-inner">
              <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">SISA HP</span>
              <span className="text-3xl md:text-4xl font-black text-rose-400 font-display mt-1 block">{hp} HP</span>
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

          {/* Persona Card */}
          <div className={`bg-gradient-to-r ${persona.color} p-0.5 rounded-3xl my-8 shadow-2xl`}>
            <div className="bg-slate-950/95 rounded-[22px] p-8 text-left space-y-5">
              <div className="flex items-center gap-4">
                <span className="text-4xl shrink-0">{persona.icon}</span>
                <div>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">PERSONALITAS & PERAN TIM</span>
                  <h3 className="text-xl md:text-2xl font-black text-white mt-0.5">{persona.role}</h3>
                </div>
              </div>

              <p className="text-slate-300 text-sm md:text-base leading-relaxed font-medium">{persona.description}</p>
              
              <div className="border-t border-slate-800 pt-4 space-y-3">
                <p className="text-sm text-slate-300 font-medium">
                  <span className="text-emerald-400 font-extrabold">Kekuatan Utama: </span> {persona.strengths}
                </p>
                <p className="text-sm text-slate-300 font-medium">
                  <span className="text-amber-400 font-extrabold">Tips Sukses: </span> {persona.tip}
                </p>
              </div>
            </div>
          </div>

          {/* Auto submit report indicator */}
          <div className="text-sm py-3 px-5 bg-slate-950 border border-slate-800 rounded-2xl inline-flex items-center gap-2 mb-8 font-semibold shadow-inner">
            {isSubmitting ? (
              <span className="text-slate-400 animate-pulse flex items-center gap-1.5">
                ⏳ Melaporkan rekap nilai ke server guru...
              </span>
            ) : submitSuccess ? (
              <span className="text-emerald-400 font-extrabold flex items-center gap-1.5">
                ✓ Laporan nilai berhasil tersimpan di database Guru!
              </span>
            ) : (
              <span className="text-rose-400 font-extrabold">
                ⚠ Gagal menyimpan rekap nilai otomatis ke database.
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => { sound.playClick(); onQuit(); }}
              className="bg-slate-850 hover:bg-slate-800 text-slate-200 font-black py-4 px-8 rounded-2xl text-base tracking-widest cursor-pointer transition flex items-center justify-center gap-2 shadow-lg"
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

      {/* Floating Combat Text Component */}
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

      {/* Top HUD Panel */}
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

        {/* HP, Mana, and Shield indicators */}
        <div className="flex flex-wrap items-center gap-6">
          
          {/* Health Point (HP) */}
          <div className="space-y-1.5 w-36 sm:w-48">
            <div className="flex justify-between text-xs font-black text-slate-300 tracking-wider">
              <span className="flex items-center gap-1">❤️ NYAWA (HP)</span>
              <span className={hp <= 25 ? "text-rose-400 animate-pulse font-black text-sm" : "text-white font-black"}>{hp} / 100</span>
            </div>
            <div className="w-full bg-slate-950 h-4 border border-slate-800 rounded-full overflow-hidden p-0.5 shadow-inner">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  hp > 50 
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' 
                    : hp > 25 
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400' 
                    : 'bg-gradient-to-r from-rose-600 to-rose-400 animate-pulse'
                }`}
                style={{ width: `${hp}%` }}
              />
            </div>
          </div>

          {/* Mana Point (MP) */}
          <div className="space-y-1.5 w-36 sm:w-48">
            <div className="flex justify-between text-xs font-black text-slate-300 tracking-wider">
              <span className="flex items-center gap-1">⚡ TENAGA (MANA)</span>
              <span className="text-cyan-400 font-black">{mp} / 100</span>
            </div>
            <div className="w-full bg-slate-950 h-4 border border-slate-800 rounded-full overflow-hidden p-0.5 shadow-inner">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-400 transition-all duration-300"
                style={{ width: `${mp}%` }}
              />
            </div>
          </div>

          {/* Shield Status Indicator */}
          <div className="flex items-center justify-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              shieldActive 
                ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/50 neon-glow-emerald animate-pulse' 
                : 'bg-slate-950 text-slate-600 border border-slate-800'
            }`}>
              <Shield className={`w-5 h-5 ${shieldActive ? 'animate-bounce' : ''}`} />
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

            {/* Timer Countdown Display */}
            {!isAnswered ? (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">⌛ WAKTU:</span>
                <span className={`font-black font-display text-xs px-2.5 py-1 rounded-lg border transition duration-150 flex items-center gap-1 ${
                  timeLeft > 10 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : timeLeft > 4 
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' 
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/30 text-sm font-black'
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
            <div className="w-full bg-slate-950 h-1.5 border border-slate-800 rounded-full overflow-hidden relative -mt-4 mb-6 shadow-inner">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  timeLeft > 10 
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' 
                    : timeLeft > 4 
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400 animate-pulse' 
                    : 'bg-gradient-to-r from-rose-600 to-rose-400 animate-pulse'
                }`}
                style={{ width: `${(timeLeft / 15) * 100}%` }}
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
                * Kuis Eksplorasi Minat: Pilih opsi yang paling menggambarkan dirimu! (Tidak ada jawaban salah)
              </p>
            )}
          </div>

          {/* Options Grid */}
          <div className="space-y-4">
            {(['A', 'B', 'C', 'D'] as const).map((opt) => {
              const isOptionEliminated = eliminatedOptions.includes(opt);
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
                  // Interest: option chosen glows magenta/purple, other are translucent
                  if (isSelected) {
                    buttonStyle = "border-2 border-purple-500 bg-purple-500/20 text-purple-300 font-black";
                    iconFeedback = <Sparkles className="w-5 h-5 text-purple-400 shrink-0" />;
                  } else {
                    buttonStyle = "border-slate-950 bg-slate-950/20 text-slate-600 opacity-30";
                  }
                }
              }

              if (isOptionEliminated) {
                return (
                  <div 
                    key={opt}
                    className="w-full border border-dashed border-slate-900/50 p-5 rounded-2xl text-left text-sm text-slate-600 line-through select-none cursor-not-allowed opacity-30"
                  >
                    Opsi {opt} (Dieliminasi Jurus Bagi Dua)
                  </div>
                );
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

        {/* Right Section: Magic Spells (Jurus RPG) */}
        <section className="col-span-1 lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-2xl">
          <div className="space-y-5">
            <div className="pb-4 border-b border-slate-800/60">
              <h2 className="text-base font-black text-white font-display flex items-center gap-2 uppercase tracking-widest">
                🔮 Jurus Sihir Bertahan
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-1">Gunakan poin Mana (MP) untuk melancarkan jurus bertahan hidup.</p>
            </div>

            {/* Spell 1: Bagi Dua */}
            <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl space-y-3.5 shadow-inner">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    🪄 Jurus "Bagi Dua"
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed font-medium">
                    Menghilangkan 2 pilihan jawaban salah pada soal kognitif aktif.
                  </p>
                </div>
                <span className="bg-pink-500/10 text-pink-400 font-black px-2.5 py-1 border border-pink-500/20 rounded-lg text-xs uppercase shrink-0">
                  40 MP
                </span>
              </div>
              <button
                onClick={castBagiDua}
                disabled={mp < 40 || isAnswered || currentQuestion.type === 'interest'}
                className="w-full py-3 bg-gradient-to-r from-pink-500/20 to-pink-600/20 hover:from-pink-500/30 hover:to-pink-600/30 text-pink-400 hover:text-pink-300 font-black text-xs md:text-sm rounded-xl border border-pink-500/30 disabled:opacity-40 disabled:pointer-events-none transition flex items-center justify-center gap-2 cursor-pointer uppercase tracking-widest"
              >
                Launch "Bagi Dua"
              </button>
            </div>

            {/* Spell 2: Perisai Kognitif */}
            <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl space-y-3.5 shadow-inner">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    🛡️ "Perisai Kognitif"
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed font-medium">
                    Melindungi HP dari pengurangan sebesar -25 jika pilihan Anda salah berikutnya.
                  </p>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 font-black px-2.5 py-1 border border-emerald-500/20 rounded-lg text-xs uppercase shrink-0">
                  30 MP
                </span>
              </div>
              <button
                onClick={castPerisai}
                disabled={mp < 30 || shieldActive || isAnswered}
                className="w-full py-3 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 hover:from-emerald-500/30 hover:to-emerald-600/30 text-emerald-400 hover:text-emerald-300 font-black text-xs md:text-sm rounded-xl border border-emerald-500/30 disabled:opacity-40 disabled:pointer-events-none transition flex items-center justify-center gap-2 cursor-pointer uppercase tracking-widest"
              >
                Launch "Perisai"
              </button>
            </div>
          </div>

          {/* Quick instructions/statistics footer */}
          <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-2xl flex items-start gap-3 text-xs text-slate-400 leading-relaxed font-medium mt-5">
            <AlertCircle className="w-5 h-5 shrink-0 text-cyan-400 mt-0.5" />
            <span>
              <b>Tips:</b> Kumpulkan poin Mana tambahan dengan menjawab soal kognitif secara berturut-turut!
            </span>
          </div>
        </section>
      </main>

      {/* Footer Back trigger */}
      <footer className="max-w-5xl w-full mx-auto flex justify-between text-xs sm:text-sm text-slate-500 px-2 font-medium">
        <span>EduQuest RPG © 2026</span>
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
