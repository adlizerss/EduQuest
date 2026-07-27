import React, { useState } from 'react';
import { BookOpen, User, Hash, School, Play, Lock, AlertTriangle, Shield, Sparkles, FolderOpen, Zap, Trophy, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import sound from '../utils/audio';
import { QuizQuestion, StudentAccount, ClassAssignment } from '../types';

interface WelcomeScreenProps {
  onStartGame: (name: string, attendanceNum: string, className: string, category: string) => void;
  onGoToAdmin: () => void;
  quizzes: QuizQuestion[];
  students: StudentAccount[];
  assignments: ClassAssignment[];
}

export default function WelcomeScreen({ onStartGame, onGoToAdmin, quizzes, students, assignments }: WelcomeScreenProps) {
  const [uniqueCode, setUniqueCode] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [error, setError] = useState('');

  const quizCount = quizzes.length;
  const categories = Array.from(new Set(quizzes.map(q => q.category || 'Umum')));

  const getQuestionCountForCategory = (cat: string) => {
    if (cat === 'Semua') return quizzes.length;
    return quizzes.filter(q => (q.category || 'Umum') === cat).length;
  };

  // Find student by entered unique code
  const foundStudent = students.find(s => 
    s.nis && s.nis.trim().toLowerCase() === uniqueCode.trim().toLowerCase()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    if (!uniqueCode.trim()) {
      setError('Kode unik murid tidak boleh kosong!');
      sound.playDamage();
      return;
    }

    if (!foundStudent) {
      setError('Kode unik murid tidak terdaftar! Periksa kembali kode Anda atau hubungi Guru.');
      sound.playDamage();
      return;
    }

    const { student_name, class_name, attendance_num } = foundStudent;

    // CBT Assignment mode
    const hasAnyAssignments = assignments && assignments.length > 0;
    let targetCategory = selectedCategory;

    if (hasAnyAssignments) {
      const activeAssignment = assignments.find(a => a.class_name.toLowerCase() === class_name.toLowerCase());
      if (!activeAssignment) {
        setError(`Belum ada kuis/ujian yang aktif diposting untuk kelas ${class_name}!`);
        sound.playDamage();
        return;
      }
      targetCategory = activeAssignment.category;
    }

    if (getQuestionCountForCategory(targetCategory) === 0) {
      setError('Paket kuis terpilih tidak memiliki soal! Silakan hubungi guru untuk memposting kuis yang benar.');
      sound.playDamage();
      return;
    }

    setError('');
    sound.playSpell();
    onStartGame(student_name, attendance_num, class_name, targetCategory);
  };

  const loginCardElement = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-gradient-to-br from-purple-700 via-violet-800 to-indigo-900 border-2 border-purple-400/50 rounded-3xl p-6 sm:p-8 shadow-[0_15px_50px_rgba(147,51,234,0.5)] relative overflow-hidden backdrop-blur-2xl text-white"
    >
      {/* Top Card Gradient Bar */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-pink-400 via-amber-300 to-cyan-400" />

      <div className="flex justify-between items-center mb-6 pt-1">
        <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight font-display flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-300 animate-pulse" /> Mulai Kuis Murid
        </h2>
        <span className="text-[11px] bg-purple-950/80 border border-purple-300/40 px-3 py-1 rounded-full text-amber-300 font-mono font-bold">
          {getQuestionCountForCategory(selectedCategory)} SOAL
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Input Kode Unik */}
        <div className="space-y-2.5">
          <label className="block text-sm font-black text-purple-100 uppercase tracking-widest font-sans">
            Masukkan Kode Unik Murid
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-purple-300" />
            <input
              type="text"
              value={uniqueCode}
              onChange={(e) => {
                setUniqueCode(e.target.value);
                setError('');
              }}
              placeholder="EQ-8F2K9L"
              className="w-full bg-purple-950/80 border-2 border-purple-300/60 focus:border-amber-300 focus:ring-4 focus:ring-purple-400/40 text-2xl sm:text-3xl font-mono font-black rounded-2xl pl-14 pr-4 py-4.5 outline-none text-amber-300 uppercase tracking-widest transition-all placeholder:text-purple-300/40 shadow-inner"
            />
          </div>
        </div>

        {/* Dynamic Student Info Verification Badge */}
        {foundStudent && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-purple-950/90 border-2 border-emerald-400/60 p-4.5 rounded-2xl space-y-3 font-sans shadow-xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-300 uppercase tracking-widest flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Identitas Terverifikasi
              </span>
              <span className="text-xs bg-emerald-500/30 text-emerald-200 font-black px-3 py-1 rounded-full font-mono border border-emerald-400/40">
                {foundStudent.nis}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-purple-300 block text-xs uppercase font-extrabold">Nama Lengkap</span>
                <span className="font-black text-white text-base truncate block">{foundStudent.student_name}</span>
              </div>
              <div>
                <span className="text-purple-300 block text-xs uppercase font-extrabold">Kelas (Absen)</span>
                <span className="font-black text-amber-300 text-base truncate block">{foundStudent.class_name} ({foundStudent.attendance_num})</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* CBT Assignment Status or Category Selector when student is logged in */}
        {quizCount > 0 && foundStudent && (() => {
          const targetClassName = foundStudent.class_name;
          const hasAnyAssignments = assignments && assignments.length > 0;

          if (hasAnyAssignments && targetClassName) {
            const activeAssignment = assignments.find(a => a.class_name.toLowerCase() === targetClassName.toLowerCase());
            if (activeAssignment) {
              return (
                <div className="bg-purple-950/80 border border-purple-300/40 p-4 rounded-2xl flex items-center gap-3.5 shadow-inner">
                  <FolderOpen className="w-5 h-5 text-amber-300 shrink-0 animate-pulse" />
                  <div>
                    <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest block font-sans">
                      Paket Kuis Aktif (CBT Mode)
                    </span>
                    <span className="text-sm font-extrabold text-white font-sans mt-0.5 block">
                      📁 {activeAssignment.category} ({getQuestionCountForCategory(activeAssignment.category)} Soal)
                    </span>
                  </div>
                </div>
              );
            } else {
              return (
                <div className="bg-rose-900/60 border border-rose-400/50 p-4 rounded-2xl flex items-center gap-3.5 shadow-inner">
                  <AlertTriangle className="w-5 h-5 text-rose-300 shrink-0" />
                  <div>
                    <span className="text-[10px] font-black text-rose-200 uppercase tracking-widest block font-sans">
                      Status Ujian Kelas
                    </span>
                    <span className="text-xs font-bold text-rose-100 font-sans mt-0.5 block">
                      🔴 Belum ada ujian aktif diposting untuk kelas {targetClassName}
                    </span>
                  </div>
                </div>
              );
            }
          } else {
            return (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-purple-200 uppercase tracking-widest font-sans">
                  Pilih Paket / Folder Soal
                </label>
                <div className="relative">
                  <FolderOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-300" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-purple-950/90 border border-purple-300/40 focus:border-amber-300 text-base rounded-2xl pl-12 pr-4 py-3.5 outline-none text-white font-bold transition-all cursor-pointer appearance-none"
                  >
                    <option value="Semua" className="bg-purple-950 text-white">📦 Semua Paket ({quizzes.length} Soal)</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat} className="bg-purple-950 text-white">
                        📁 {cat} ({getQuestionCountForCategory(cat)} Soal)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          }
        })()}

        {/* Error messages when user submits invalid code */}
        {error && (
          <div className="text-xs sm:text-sm bg-rose-950/90 border-2 border-rose-400/60 text-rose-200 p-4 rounded-2xl flex items-start gap-2.5 leading-relaxed font-semibold shadow-lg">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-300" />
            <span>{error}</span>
          </div>
        )}

        {/* Fluid Animated Submit Button matching vibrant reference theme */}
        <motion.button
          type="submit"
          disabled={quizCount === 0 || !foundStudent}
          whileHover={{ scale: 1.02, boxShadow: "0px 10px 30px rgba(245, 158, 11, 0.5)" }}
          whileTap={{ scale: 0.97 }}
          className="w-full bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 hover:from-amber-300 hover:to-pink-400 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-black py-4 px-4 rounded-2xl shadow-[0_10px_25px_rgba(245,158,11,0.4)] transition-all duration-150 flex items-center justify-center gap-2.5 cursor-pointer mt-4 text-base uppercase tracking-widest font-display"
        >
          <Play className="w-5 h-5 fill-slate-950" /> Mulai Kuis Sekarang
        </motion.button>
      </form>

      {/* Quick Link to Teacher Admin */}
      <div className="mt-6 pt-5 border-t border-purple-400/30 flex items-center justify-between text-xs text-purple-200 font-medium">
        <span>Khusus Pendidik:</span>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { sound.playClick(); onGoToAdmin(); }}
          className="text-amber-300 hover:text-amber-200 font-extrabold flex items-center gap-1.5 transition cursor-pointer text-sm"
        >
          <Lock className="w-4 h-4 text-amber-300" /> Panel Guru
        </motion.button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#0b0518] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans select-none">
      
      {/* Background Decorative Purple Orbs (Reference Image Aesthetic) */}
      <div className="absolute top-1/6 left-1/5 w-72 sm:w-96 h-72 sm:h-96 bg-purple-600/30 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/5 w-80 sm:w-[30rem] h-80 sm:h-[30rem] bg-violet-600/25 rounded-full blur-[130px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-96 bg-indigo-500/20 rounded-full blur-[160px] pointer-events-none -z-10" />

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto py-6">
        
        {/* Left Side: Electric Purple Hero Banner & Features */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-purple-500/25 border border-purple-300/50 text-purple-200 text-xs sm:text-sm font-extrabold uppercase tracking-widest backdrop-blur-md shadow-lg">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" /> Platform Kuis Interaktif
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white leading-tight font-display">
              Selamat Datang di <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-300 to-amber-300">EduQuest</span>
            </h1>
            
            <p className="text-slate-300 text-base sm:text-lg md:text-xl font-medium leading-relaxed max-w-2xl">
              Platform kuis interaktif. Jawab soal presisi 1 menit per soal, kumpulkan poin bonus maksimal, dan jadilah yang terbaik di kelasmu!
            </p>
          </motion.div>
 
          {/* Mobile Login Card: Positioned right under Welcome text on mobile screens */}
          <div className="block lg:hidden w-full my-6">
            {loginCardElement}
          </div>

          {/* Gamification Features list with vibrant bright color cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              whileHover={{ scale: 1.03, translateY: -3 }}
              className="bg-gradient-to-br from-blue-600 to-indigo-700 border border-blue-400/40 p-4 sm:p-5 rounded-2xl flex items-center gap-4 shadow-lg shadow-blue-600/30 text-white backdrop-blur-xl transition-all"
            >
              <div className="p-3 bg-white/20 text-white rounded-xl text-2xl shrink-0 shadow-inner border border-white/30">
                ⏱️
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider font-display">Timer 1 Menit</h3>
                <p className="text-xs text-blue-100 mt-1 leading-snug">Setiap soal berdurasi 1 menit. Berpikir jernih dan tentukan pilihanmu!</p>
              </div>
            </motion.div>
 
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              whileHover={{ scale: 1.03, translateY: -3 }}
              className="bg-gradient-to-br from-amber-500 to-orange-600 border border-amber-300/40 p-4 sm:p-5 rounded-2xl flex items-center gap-4 shadow-lg shadow-orange-500/30 text-white backdrop-blur-xl transition-all"
            >
              <div className="p-3 bg-white/20 text-white rounded-xl text-2xl shrink-0 shadow-inner border border-white/30">
                ⚡
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider font-display">Poin Kecepatan</h3>
                <p className="text-xs text-amber-100 mt-1 leading-snug">Semakin cepat menjawab benar, semakin besar poin bonus yang didapat!</p>
              </div>
            </motion.div>
 
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              whileHover={{ scale: 1.03, translateY: -3 }}
              className="bg-gradient-to-br from-emerald-500 to-teal-700 border border-emerald-300/40 p-4 sm:p-5 rounded-2xl flex items-center gap-4 shadow-lg shadow-emerald-500/30 text-white backdrop-blur-xl transition-all"
            >
              <div className="p-3 bg-white/20 text-white rounded-xl text-2xl shrink-0 shadow-inner border border-white/30">
                🎯
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider font-display">Rekap Otomatis</h3>
                <p className="text-xs text-emerald-100 mt-1 leading-snug">Hasil perolehan poin langsung terekap di server Guru secara real-time.</p>
              </div>
            </motion.div>
 
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              whileHover={{ scale: 1.03, translateY: -3 }}
              className="bg-gradient-to-br from-pink-500 to-rose-600 border border-pink-300/40 p-4 sm:p-5 rounded-2xl flex items-center gap-4 shadow-lg shadow-pink-500/30 text-white backdrop-blur-xl transition-all"
            >
              <div className="p-3 bg-white/20 text-white rounded-xl text-2xl shrink-0 shadow-inner border border-white/30">
                🔑
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider font-display">Login Kode Unik</h3>
                <p className="text-xs text-pink-100 mt-1 leading-snug">Masuk kuis dengan mudah & terverifikasi menggunakan Kode Unik resmi!</p>
              </div>
            </motion.div>
          </div>
        </div>
 
        {/* Right Side: Desktop Login Card */}
        <div className="hidden lg:block lg:col-span-5 w-full">
          {loginCardElement}
        </div>
      </div>
    </div>
  );
}
