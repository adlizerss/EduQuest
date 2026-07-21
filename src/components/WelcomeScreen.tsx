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

  return (
    <div className="min-h-screen bg-[#0b0518] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans select-none">
      
      {/* Background Decorative Purple Orbs (Reference Image Aesthetic) */}
      <div className="absolute top-1/6 left-1/5 w-72 sm:w-96 h-72 sm:h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/5 w-80 sm:w-[30rem] h-80 sm:h-[30rem] bg-violet-600/15 rounded-full blur-[130px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-96 bg-indigo-500/10 rounded-full blur-[160px] pointer-events-none -z-10" />

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto py-6">
        
        {/* Left Side: Electric Purple Hero Banner & Features */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-purple-500/15 border border-purple-400/30 text-purple-300 text-xs sm:text-sm font-extrabold uppercase tracking-widest backdrop-blur-md shadow-lg">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" /> Platform Kuis Interaktif
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white leading-tight font-display">
              Selamat Datang di <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-300 to-pink-400">EduQuest</span>
            </h1>
            
            <p className="text-slate-300 text-base sm:text-lg md:text-xl font-medium leading-relaxed max-w-2xl">
              Platform kuis interaktif berkecepatan tinggi. Jawab soal presisi 25 detik, kumpulkan poin bonus maksimal, dan jadilah yang terbaik di kelasmu!
            </p>
          </motion.div>
 
          {/* Gamification Features list with fluid hover cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              whileHover={{ scale: 1.02, translateY: -3 }}
              className="bg-gradient-to-br from-purple-950/50 to-slate-900/80 border border-purple-500/20 p-4 sm:p-5 rounded-2xl flex items-center gap-4 backdrop-blur-xl shadow-xl transition-all"
            >
              <div className="p-3 bg-purple-500/15 text-purple-300 rounded-xl text-2xl shrink-0 shadow-inner border border-purple-500/20">
                ⏱️
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider font-display">Timer 25 Detik</h3>
                <p className="text-xs text-slate-400 mt-1 leading-snug">Setiap soal berdurasi 25 detik. Berpikir cepat dan tentukan pilihanmu!</p>
              </div>
            </motion.div>
 
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              whileHover={{ scale: 1.02, translateY: -3 }}
              className="bg-gradient-to-br from-purple-950/50 to-slate-900/80 border border-purple-500/20 p-4 sm:p-5 rounded-2xl flex items-center gap-4 backdrop-blur-xl shadow-xl transition-all"
            >
              <div className="p-3 bg-amber-500/15 text-amber-300 rounded-xl text-2xl shrink-0 shadow-inner border border-amber-500/20">
                ⚡
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider font-display">Poin Kecepatan</h3>
                <p className="text-xs text-slate-400 mt-1 leading-snug">Semakin cepat menjawab benar, semakin besar poin bonus yang didapat!</p>
              </div>
            </motion.div>
 
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              whileHover={{ scale: 1.02, translateY: -3 }}
              className="bg-gradient-to-br from-purple-950/50 to-slate-900/80 border border-purple-500/20 p-4 sm:p-5 rounded-2xl flex items-center gap-4 backdrop-blur-xl shadow-xl transition-all"
            >
              <div className="p-3 bg-emerald-500/15 text-emerald-300 rounded-xl text-2xl shrink-0 shadow-inner border border-emerald-500/20">
                🎯
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider font-display">Rekap Otomatis</h3>
                <p className="text-xs text-slate-400 mt-1 leading-snug">Hasil perolehan poin langsung terekap di server Guru secara real-time.</p>
              </div>
            </motion.div>
 
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              whileHover={{ scale: 1.02, translateY: -3 }}
              className="bg-gradient-to-br from-purple-950/50 to-slate-900/80 border border-purple-500/20 p-4 sm:p-5 rounded-2xl flex items-center gap-4 backdrop-blur-xl shadow-xl transition-all"
            >
              <div className="p-3 bg-pink-500/15 text-pink-300 rounded-xl text-2xl shrink-0 shadow-inner border border-pink-500/20">
                🔑
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider font-display">Login Kode Unik</h3>
                <p className="text-xs text-slate-400 mt-1 leading-snug">Masuk kuis dengan mudah & terverifikasi menggunakan Kode Unik resmi!</p>
              </div>
            </motion.div>
          </div>
        </div>
 
        {/* Right Side: Fluid Student Login Card */}
        <div className="lg:col-span-5 w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-panel-purple border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative neon-glow-purple overflow-hidden"
          >
            {/* Top Card Gradient Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500" />

            <div className="flex justify-between items-center mb-6 pt-1">
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight font-display flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-400" /> Mulai Kuis Murid
              </h2>
              <span className="text-[11px] bg-purple-950/80 border border-purple-500/40 px-3 py-1 rounded-full text-purple-300 font-mono font-bold">
                {getQuestionCountForCategory(selectedCategory)} SOAL
              </span>
            </div>
 
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Input Kode Unik */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-purple-200 uppercase tracking-widest font-sans">
                  Masukkan Kode Unik Murid
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                  <input
                    type="text"
                    value={uniqueCode}
                    onChange={(e) => {
                      setUniqueCode(e.target.value);
                      setError('');
                    }}
                    placeholder="Contoh: EQ-8F2K9L"
                    className="w-full bg-slate-950/90 border border-purple-500/30 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 text-lg sm:text-xl font-mono font-bold rounded-2xl pl-12 pr-4 py-3.5 sm:py-4 outline-none text-purple-300 uppercase tracking-wider transition-all placeholder:text-slate-600 shadow-inner"
                  />
                </div>
              </div>

              {/* Dynamic Student Info Verification Badge */}
              {foundStudent && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-purple-950/70 border border-purple-400/40 p-4 rounded-2xl space-y-2.5 font-sans shadow-lg neon-glow-purple"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Identitas Terverifikasi
                    </span>
                    <span className="text-[10px] bg-purple-500/30 text-purple-200 font-bold px-2.5 py-0.5 rounded-full font-mono border border-purple-400/30">
                      {foundStudent.nis}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Nama Lengkap</span>
                      <span className="font-bold text-white text-sm truncate block">{foundStudent.student_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Kelas (Absen)</span>
                      <span className="font-bold text-purple-300 text-sm truncate block">{foundStudent.class_name} ({foundStudent.attendance_num})</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* CBT Assignment Status or Category Selector */}
              {quizCount > 0 && (() => {
                const targetClassName = foundStudent ? foundStudent.class_name : null;
                const hasAnyAssignments = assignments && assignments.length > 0;

                if (!foundStudent) {
                  return (
                    <div className="bg-slate-950/70 border border-purple-500/20 p-4 rounded-2xl text-center text-xs text-slate-400 font-medium">
                      🔑 Silakan masukkan <span className="text-purple-300 font-bold">Kode Unik</span> dari Guru untuk masuk kuis.
                    </div>
                  );
                }

                if (hasAnyAssignments && targetClassName) {
                  const activeAssignment = assignments.find(a => a.class_name.toLowerCase() === targetClassName.toLowerCase());
                  if (activeAssignment) {
                    return (
                      <div className="bg-purple-900/40 border border-purple-500/30 p-4 rounded-2xl flex items-center gap-3.5 shadow-inner">
                        <FolderOpen className="w-5 h-5 text-purple-300 shrink-0 animate-pulse" />
                        <div>
                          <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest block font-sans">
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
                      <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl flex items-center gap-3.5 shadow-inner">
                        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                        <div>
                          <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block font-sans">
                            Status Ujian Kelas
                          </span>
                          <span className="text-xs font-bold text-rose-300 font-sans mt-0.5 block">
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
                        <FolderOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full bg-slate-950/90 border border-purple-500/30 focus:border-purple-400 text-base rounded-2xl pl-12 pr-4 py-3.5 outline-none text-purple-300 font-bold transition-all cursor-pointer appearance-none"
                        >
                          <option value="Semua" className="bg-slate-950 text-white">📦 Semua Paket ({quizzes.length} Soal)</option>
                          {categories.map(cat => (
                            <option key={cat} value={cat} className="bg-slate-950 text-white">
                              📁 {cat} ({getQuestionCountForCategory(cat)} Soal)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                }
              })()}

              {/* Error messages */}
              {error && (
                <div className="text-xs sm:text-sm bg-rose-500/15 border border-rose-500/30 text-rose-300 p-4 rounded-2xl flex items-start gap-2.5 leading-relaxed font-semibold">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {quizCount === 0 && (
                <div className="text-xs sm:text-sm bg-amber-500/15 border border-amber-500/30 text-amber-300 p-4 rounded-2xl flex items-start gap-2.5 leading-relaxed font-semibold">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
                  <span>Soal kuis masih kosong! Minta Guru untuk menambahkan soal kuis di Panel Admin.</span>
                </div>
              )}

              {/* Fluid Animated Submit Button matching reference theme */}
              <motion.button
                type="submit"
                disabled={quizCount === 0 || !foundStudent}
                whileHover={{ scale: 1.02, boxShadow: "0px 10px 30px rgba(147, 51, 234, 0.4)" }}
                whileTap={{ scale: 0.97 }}
                className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white font-black py-4 px-4 rounded-2xl shadow-xl transition-all duration-150 flex items-center justify-center gap-2.5 cursor-pointer mt-4 text-base uppercase tracking-widest font-display"
              >
                <Play className="w-5 h-5 fill-white" /> Mulai Kuis Sekarang
              </motion.button>
            </form>
 
            {/* Quick Link to Teacher Admin */}
            <div className="mt-6 pt-5 border-t border-purple-500/20 flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Khusus Pendidik:</span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { sound.playClick(); onGoToAdmin(); }}
                className="text-purple-300 hover:text-purple-200 font-extrabold flex items-center gap-1.5 transition cursor-pointer text-sm"
              >
                <Lock className="w-4 h-4 text-purple-400" /> Panel Guru
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
