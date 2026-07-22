import React, { useState, useEffect } from 'react';
import { fetchQuizzes, fetchStudents, fetchClassAssignments, syncLocalDataToSupabase } from './db';
import { QuizQuestion, StudentAccount, ClassAssignment } from './types';
import WelcomeScreen from './components/WelcomeScreen';
import QuizPlayground from './components/StudentRPG';
import AdminPanel from './components/AdminPanel';
import sound from './utils/audio';
// EduQuest main app root entry
export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'game' | 'admin'>('welcome');
  const [allQuizzes, setAllQuizzes] = useState<QuizQuestion[]>([]);
  const [students, setStudents] = useState<StudentAccount[]>([]);
  const [assignments, setAssignments] = useState<ClassAssignment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
}
