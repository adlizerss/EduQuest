import React, { useState, useEffect } from 'react';
import { fetchQuizzes } from './db';
import { QuizQuestion } from './types';
import WelcomeScreen from './components/WelcomeScreen';
import StudentRPG from './components/StudentRPG';
import AdminPanel from './components/AdminPanel';
import sound from './utils/audio';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'game' | 'admin'>('welcome');
  const [allQuizzes, setAllQuizzes] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Student registration details
  const [studentDetails, setStudentDetails] = useState<{
    name: string;
    attendanceNum: string;
    className: string;
  } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    setIsLoading(true);
    try {
      const questions = await fetchQuizzes();
      setAllQuizzes(questions);
    } catch (e) {
      console.error("Gagal memuat kuis:", e);
    } finally {
      setIsLoading(false);
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
    loadQuizzes(); // Refresh list
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

  const playableQuestions = selectedCategory === 'Semua' 
    ? allQuizzes 
    : allQuizzes.filter(q => (q.category || 'Umum') === selectedCategory);

  return (
    <>
      {currentScreen === 'welcome' && (
        <WelcomeScreen 
          onStartGame={handleStartGame}
          onGoToAdmin={() => setCurrentScreen('admin')}
          quizzes={allQuizzes}
        />
      )}

      {currentScreen === 'game' && studentDetails && (
        <StudentRPG
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
          onRefreshQuizzes={loadQuizzes}
        />
      )}
    </>
  );
}
