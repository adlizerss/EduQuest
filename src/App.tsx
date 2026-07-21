import React, { useState, useEffect } from 'react';
import { fetchQuizzes, fetchStudents, fetchClassAssignments, syncLocalDataToSupabase } from './db';
import { QuizQuestion, StudentAccount, ClassAssignment } from './types';
import WelcomeScreen from './components/WelcomeScreen';
import QuizPlayground from './components/StudentRPG';
import AdminPanel from './components/AdminPanel';
import sound from './utils/audio';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'game' | 'admin'>('welcome');
  const [allQuizzes, setAllQuizzes] = useState<QuizQuestion[]>([]);
  const [students, setStudents] = useState<StudentAccount[]>([]);
  const [assignments, setAssignments] = useState<ClassAssignment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Student registration details
  const [studentDetails, setStudentDetails] = useState<{
    name: string;
    attendanceNum: string;
    className: string;
  } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Run bi-directional sync to push local records and pull Supabase records
      await syncLocalDataToSupabase();

      const [questions, registeredStudents, classAssignments] = await Promise.all([
        fetchQuizzes(),
        fetchStudents(),
        fetchClassAssignments()
      ]);
      setAllQuizzes(questions);
      setStudents(registeredStudents);
      setAssignments(classAssignments);
    } catch (e) {
      console.error("Gagal memuat data EduQuest:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshAssignments = async () => {
    try {
      const classAssignments = await fetchClassAssignments();
      setAssignments(classAssignments);
    } catch (e) {
      console.error("Gagal menyegarkan data penugasan kelas:", e);
    }
  };

  const handleStartGame = (name: string, attendanceNum: string, className: string, category: string) => {
    setStudentDetails({ name, attendanceNum, className });
    setSelectedCategory(category);
    setCurrentScreen('game');
  };

  const handleQuitGame = () => {
    setStudentDetails(null);
    setCurrentScreen('welcome');
    loadData(); // Refresh list
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-sm font-semibold tracking-wide text-cyan-400">MEMULAI PORTAL EDUQUEST...</h2>
        <p className="text-xs text-slate-500 mt-1">Sedang menghubungkan ke basis data kuis</p>
      </div>
    );
  }

  const [is16by9Mode, setIs16by9Mode] = useState<boolean>(true);

  const playableQuestions = selectedCategory === 'Semua' 
    ? allQuizzes 
    : allQuizzes.filter(q => (q.category || 'Umum') === selectedCategory);

  const renderScreenContent = () => (
    <>
      {currentScreen === 'welcome' && (
        <WelcomeScreen 
          onStartGame={handleStartGame}
          onGoToAdmin={() => setCurrentScreen('admin')}
          quizzes={allQuizzes}
          students={students}
          assignments={assignments}
        />
      )}

      {currentScreen === 'game' && studentDetails && (
        <QuizPlayground
          studentName={studentDetails.name}
          attendanceNum={studentDetails.attendanceNum}
          className={studentDetails.className}
          questions={playableQuestions}
          onQuit={handleQuitGame}
        />
      )}

      {currentScreen === 'admin' && (
        <AdminPanel
          onBack={() => setCurrentScreen('welcome')}
          allQuizzes={allQuizzes}
          onRefreshQuizzes={loadData}
          assignments={assignments}
          onRefreshAssignments={handleRefreshAssignments}
        />
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-[#070312] text-slate-100 flex flex-col justify-center items-center p-0 sm:p-4 md:p-6 font-sans relative overflow-x-hidden">
      
      {/* Background Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-[140px] -z-10" />
      <div className="absolute bottom-1/3 right-1/4 w-[32rem] h-[32rem] bg-violet-600/15 rounded-full blur-[150px] -z-10" />

      {/* Main Container: 16:9 Widescreen Web Browser Frame */}
      <div className={`w-full transition-all duration-300 ${
        is16by9Mode 
          ? 'max-w-[1440px] w-full aspect-auto lg:aspect-[16/9] glass-panel-purple border-2 border-purple-500/40 sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col neon-glow-purple my-auto min-h-[680px]' 
          : 'max-w-full w-full min-h-screen flex flex-col'
      }`}>

        {/* Simulated Modern Browser Bar */}
        <header className="bg-[#0f0724] border-b border-purple-500/30 px-4 py-3 flex items-center justify-between gap-4 select-none shrink-0 z-30 shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-rose-500/90 shadow-sm" />
            <div className="w-3.5 h-3.5 rounded-full bg-amber-500/90 shadow-sm" />
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/90 shadow-sm" />
          </div>

          {/* Simulated Web Address Bar */}
          <div className="flex-1 max-w-lg bg-slate-950/90 border border-purple-500/40 rounded-xl px-4 py-1.5 text-xs text-purple-300 font-mono flex items-center justify-center gap-2 shadow-inner">
            <span className="text-emerald-400 font-black text-[11px]">🔒 https://</span>
            <span className="font-extrabold text-white tracking-wider text-[12px]">eduquest.app/{currentScreen}</span>
          </div>

          {/* Mode Switch Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { sound.playClick(); setIs16by9Mode(!is16by9Mode); }}
              className="bg-purple-950/90 hover:bg-purple-900 text-purple-200 hover:text-white border border-purple-500/40 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 font-display shadow-md"
              title="Ganti antara tampilan Monitor 16:9 HD dan Full Screen"
            >
              {is16by9Mode ? '🖥️ Frame Web 16:9' : '📱 Full Screen'}
            </button>
          </div>
        </header>

        {/* Inner Screen Viewport with Custom Scrollbars */}
        <main className="flex-1 overflow-y-auto relative flex flex-col justify-start">
          {renderScreenContent()}
        </main>
      </div>
    </div>
  );
}
