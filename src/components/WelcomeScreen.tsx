import React, { useState } from 'react';
import { BookOpen, User, Hash, School, Play, Lock, AlertTriangle, Shield, Sparkles, FolderOpen } from 'lucide-react';
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

  const commonClasses = [
    'X MIPA 1', 'X MIPA 2', 'X IPS 1', 'X IPS 2',
    'XI MIPA 1', 'XI MIPA 2', 'XI IPS 1', 'XI IPS 2',
    'XII MIPA 1', 'XII MIPA 2', 'XII IPS 1', 'XII IPS 2',
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Background Decorative Neon Orbs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl -z-10" />

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        
        {/* Left Side: Game Lore & Info */}
        <div className="lg:col-span-7 space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-sm font-extrabold uppercase tracking-widest">
              <Sparkles className="w-4 h-4 animate-pulse" /> EduQuest Kuis RPG
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white leading-none font-display">
              Selamat Datang di <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-400">EduQuest</span>
            </h1>
            <p className="text-slate-300 text-lg md:text-xl font-medium leading-relaxed">
              Platform kuis interaktif serbaguna. Jawab soal secara presisi, dapatkan bonus poin berbasis kecepatan, dan buktikan kemampuan terbaikmu!
            </p>
          </motion.div>
 
          {/* Gamification Features list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-900/70 border border-slate-800/80 p-5 rounded-2xl flex items-center gap-4"
            >
              <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl text-xl shrink-0">
                ⏱️
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Timer 25 Detik</h3>
                <p className="text-xs text-slate-400 mt-1">Setiap soal berdurasi 25 detik. Berpikir cepat dan tentukan jawaban terbaikmu!</p>
              </div>
            </motion.div>
 
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-900/70 border border-slate-800/80 p-5 rounded-2xl flex items-center gap-4"
            >
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl text-xl shrink-0">
                ⚡
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Poin Kecepatan</h3>
                <p className="text-xs text-slate-400 mt-1">Semakin cepat menjawab dengan benar, semakin besar poin bonus yang didapat!</p>
              </div>
            </motion.div>
 
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-900/70 border border-slate-800/80 p-5 rounded-2xl flex items-center gap-4"
            >
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl text-xl shrink-0">
                🎯
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Rekap Otomatis</h3>
                <p className="text-xs text-slate-400 mt-1">Hasil perolehan poin langsung terekap otomatis di panel Guru secara real-time.</p>
              </div>
            </motion.div>
 
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-slate-900/70 border border-slate-800/80 p-5 rounded-2xl flex items-center gap-4"
            >
              <div className="p-3 bg-pink-500/10 text-pink-400 rounded-xl text-xl shrink-0">
                🔑
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Login Kode Unik</h3>
                <p className="text-xs text-slate-400 mt-1">Masuk kuis dengan mudah & terverifikasi hanya menggunakan Kode Unik resmi dari Guru!</p>
              </div>
            </motion.div>
          </div>
        </div>
 
        {/* Right Side: Registration Form */}
        <div className="lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl relative neon-glow-cyan"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-extrabold text-white tracking-tight">Mulai Petualangan</h2>
              <span className="text-xs bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-cyan-400 font-mono font-bold">
                {getQuestionCountForCategory(selectedCategory)} SOAL SIAP
              </span>
            </div>
 
            <form onSubmit={handleSubmit} className="space-y-5">
                 {/* Input Kode Unik */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest">
                  Kode Unik Murid
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-4.5 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={uniqueCode}
                    onChange={(e) => {
                      setUniqueCode(e.target.value);
                      setError('');
                    }}
                    placeholder="Contoh: EQ-8F2K9L"
                    className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 text-lg font-mono font-bold rounded-2xl pl-12 pr-4 py-4 outline-none text-cyan-400 uppercase tracking-wider transition placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* Dynamic Student Info Verification Badge */}
              {foundStudent && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-cyan-500/10 border border-cyan-500/25 p-4 rounded-2xl space-y-2 font-sans shadow-inner"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest block">
                      ✓ Identitas Murid Terverifikasi
                    </span>
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-bold px-2 py-0.5 rounded-full font-mono">
                      {foundStudent.nis}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Nama Murid</span>
                      <span className="font-bold text-white text-sm">{foundStudent.student_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Kelas & Absen</span>
                      <span className="font-bold text-white text-sm">{foundStudent.class_name} (Absen {foundStudent.attendance_num})</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* CBT Class Assignment Active Status vs Manual Dropdown Fallback */}
              {quizCount > 0 && (() => {
                const targetClassName = foundStudent ? foundStudent.class_name : null;
                const hasAnyAssignments = assignments && assignments.length > 0;

                if (!foundStudent) {
                  return (
                    <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl text-center text-xs text-slate-400 font-medium">
                      🔑 Silakan masukkan <span className="text-cyan-400 font-bold">Kode Unik</span> yang diberikan Guru untuk masuk.
                    </div>
                  );
                }

                if (hasAnyAssignments && targetClassName) {
                  const activeAssignment = assignments.find(a => a.class_name.toLowerCase() === targetClassName.toLowerCase());
                  if (activeAssignment) {
                    return (
                      <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl flex items-center gap-3.5 shadow-inner">
                        <FolderOpen className="w-5 h-5 text-indigo-400 shrink-0 animate-pulse" />
                        <div>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block font-sans">
                            Kuis Terjadwal Aktif (CBT Mode)
                          </span>
                          <span className="text-sm font-extrabold text-white font-sans mt-0.5 block">
                            📁 {activeAssignment.category} ({getQuestionCountForCategory(activeAssignment.category)} Soal)
                          </span>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="bg-rose-500/10 border border-rose-500/25 p-4 rounded-2xl flex items-center gap-3.5 shadow-inner">
                        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                        <div>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block font-sans">
                            Status Ujian Kelas
                          </span>
                          <span className="text-sm font-bold text-rose-400 font-sans mt-0.5 block">
                            🔴 Belum ada ujian terposting untuk kelas {targetClassName}
                          </span>
                        </div>
                      </div>
                    );
                  }
                } else {
                  return (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest font-sans">
                        Pilih Folder / Paket Kuis
                      </label>
                      <div className="relative">
                        <FolderOpen className="absolute left-4 top-4.5 w-5 h-5 text-slate-400" />
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 text-base rounded-2xl pl-11 pr-2 py-4 outline-none text-white transition cursor-pointer appearance-none font-bold text-center text-cyan-400"
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

              {/* Warnings & Errors */}
              {error && (
                <div className="text-sm bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-2xl flex items-start gap-2.5 leading-relaxed font-semibold">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {quizCount === 0 && (
                <div className="text-sm bg-amber-500/10 border border-amber-500/30 text-amber-400 p-4 rounded-2xl flex items-start gap-2.5 leading-relaxed font-semibold">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
                  <span>Kuis kosong! Silakan minta Guru mengisi soal kuis di Panel Guru.</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={quizCount === 0 || !foundStudent}
                className="w-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-pink-500 hover:from-cyan-400 hover:to-pink-400 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-white font-black py-4.5 px-4 rounded-2xl shadow-xl shadow-cyan-500/10 transition duration-150 flex items-center justify-center gap-2 cursor-pointer mt-4 text-base uppercase tracking-widest"
              >
                <Play className="w-5 h-5 fill-white" /> Mulai Petualangan Kuis
              </button>
            </form>
 
            {/* Quick Link to Teacher Admin */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Khusus Pendidik:</span>
              <button
                onClick={() => { sound.playClick(); onGoToAdmin(); }}
                className="text-cyan-400 hover:text-cyan-300 font-extrabold flex items-center gap-1.5 transition cursor-pointer text-sm"
              >
                <Lock className="w-4 h-4" /> Panel Guru
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
