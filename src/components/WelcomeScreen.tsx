import React, { useState } from 'react';
import { BookOpen, User, Hash, School, Play, Lock, AlertTriangle, Shield, Sparkles, FolderOpen } from 'lucide-react';
import { motion } from 'motion/react';
import sound from '../utils/audio';
import { QuizQuestion } from '../types';

interface WelcomeScreenProps {
  onStartGame: (name: string, attendanceNum: string, className: string, category: string) => void;
  onGoToAdmin: () => void;
  quizzes: QuizQuestion[];
}

export default function WelcomeScreen({ onStartGame, onGoToAdmin, quizzes }: WelcomeScreenProps) {
  const [name, setName] = useState('');
  const [attendanceNum, setAttendanceNum] = useState('');
  const [className, setClassName] = useState('X MIPA 1');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [error, setError] = useState('');

  const quizCount = quizzes.length;
  const categories = Array.from(new Set(quizzes.map(q => q.category || 'Umum')));

  const getQuestionCountForCategory = (cat: string) => {
    if (cat === 'Semua') return quizzes.length;
    return quizzes.filter(q => (q.category || 'Umum') === cat).length;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    if (!name.trim()) {
      setError('Nama lengkap tidak boleh kosong!');
      sound.playDamage();
      return;
    }
    if (!attendanceNum.trim()) {
      setError('Nomor absen tidak boleh kosong!');
      sound.playDamage();
      return;
    }
    if (getQuestionCountForCategory(selectedCategory) === 0) {
      setError('Folder / paket kuis terpilih tidak memiliki soal! Silakan pilih paket kuis lain.');
      sound.playDamage();
      return;
    }

    setError('');
    sound.playSpell();
    onStartGame(name, attendanceNum, className, selectedCategory);
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
              Jelajahi <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-400">EduQuest</span>
            </h1>
            <p className="text-slate-300 text-lg md:text-xl font-medium leading-relaxed">
              Platform kuis interaktif serbaguna. Jawab soal strategis dari Guru, gunakan jurus bertahan, lindungi HP karaktermu, dan temukan profil gaya belajarmu!
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
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl text-xl shrink-0">
                ❤️
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Sistem HP (Nyawa)</h3>
                <p className="text-xs text-slate-400 mt-1">Salah menjawab mengurangi -25 HP. Jaga agar tidak mencapai 0!</p>
              </div>
            </motion.div>
 
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-900/70 border border-slate-800/80 p-5 rounded-2xl flex items-center gap-4"
            >
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl text-xl shrink-0">
                ⚡
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Mana (MP)</h3>
                <p className="text-xs text-slate-400 mt-1">Jawaban benar memberi +20 Mana untuk mengeluarkan Jurus Sakti!</p>
              </div>
            </motion.div>
 
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-900/70 border border-slate-800/80 p-5 rounded-2xl flex items-center gap-4"
            >
              <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl text-xl shrink-0">
                🔮
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Jurus Sakti</h3>
                <p className="text-xs text-slate-400 mt-1">Gunakan "Bagi Dua" atau "Perisai Kognitif" agar kebal dari damage.</p>
              </div>
            </motion.div>
 
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-slate-900/70 border border-slate-800/80 p-5 rounded-2xl flex items-center gap-4"
            >
              <div className="p-3 bg-pink-500/10 text-pink-400 rounded-xl text-xl shrink-0">
                🏅
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Karakter & Peran</h3>
                <p className="text-xs text-slate-400 mt-1">Dapatkan hasil tipe personalitas & gaya kontribusimu di akhir kuis secara instan!</p>
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
              
              {/* Input Nama */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest">Nama Lengkap Siswa</label>
                <div className="relative">
                  <User className="absolute left-4 top-4.5 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Rian Anggoro"
                    className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 text-base font-semibold rounded-2xl pl-12 pr-4 py-4 outline-none text-white transition placeholder:text-slate-600"
                  />
                </div>
              </div>
 
              <div className="grid grid-cols-2 gap-4">
                {/* Input Absen */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest">Nomor Absen</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-4.5 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      maxLength={2}
                      value={attendanceNum}
                      onChange={(e) => setAttendanceNum(e.target.value.replace(/\D/g, ''))}
                      placeholder="01"
                      className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 text-lg rounded-2xl pl-11 pr-3 py-4 outline-none text-white transition text-center font-black"
                    />
                  </div>
                </div>
 
                {/* Dropdown Kelas */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest">Kelas</label>
                  <div className="relative">
                    <School className="absolute left-4 top-4.5 w-5 h-5 text-slate-400" />
                    <select
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 text-base rounded-2xl pl-11 pr-2 py-4 outline-none text-white transition cursor-pointer appearance-none font-bold text-center"
                    >
                      {commonClasses.map(c => (
                        <option key={c} value={c} className="bg-slate-950">{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Dropdown Folder / Paket Kuis */}
              {quizCount > 0 && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest">Pilih Folder / Paket Kuis</label>
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
              )}
 
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
                disabled={quizCount === 0}
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
