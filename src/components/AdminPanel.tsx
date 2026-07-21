import React, { useState, useEffect } from 'react';
import { 
  Database, Trash2, PlusCircle, Copy, CheckCircle, ArrowLeft, 
  Lock, RotateCcw, FileSpreadsheet, Users, BookOpen, Settings, Sparkles, LogOut, Check,
  Upload, Download, AlertTriangle, Pencil, X, FolderOpen, School, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { QuizQuestion, StudentResult, StudentAccount, ClassAssignment } from '../types';
import { 
  addQuiz, deleteQuiz, fetchQuizzes, fetchStudentResults, 
  getSupabaseConfig, saveSupabaseConfig, clearSupabaseConfig, resetDatabaseToDefault,
  updateCategoryName, updateQuizCategory, fetchStudents, addStudent, deleteStudent,
  assignQuizToClass, removeClassAssignment, syncLocalDataToSupabase,
  signInTeacher, signOutTeacher, fetchClasses, addClassToDb, deleteClassFromDb,
  deleteStudentResult, deleteAllStudentResults, updateQuiz, updateClassName
} from '../db';
import sound from '../utils/audio';
import { generateUniqueCode } from '../utils/codeGenerator';

interface AdminPanelProps {
  onBack: () => void;
  allQuizzes: QuizQuestion[];
  onRefreshQuizzes: () => void;
  assignments: ClassAssignment[];
  onRefreshAssignments: () => void;
}

export default function AdminPanel({ onBack, allQuizzes, onRefreshQuizzes, assignments, onRefreshAssignments }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('eduquest_admin_authenticated') === 'true';
  });

  // Supabase Auth State
  const [adminUser, setAdminUser] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  // Dashboard Pages: 'tracker' | 'assignments' | 'bank' | 'builder' | 'students' | 'classes' | 'settings'
  const [activePage, setActivePage] = useState<'tracker' | 'assignments' | 'bank' | 'builder' | 'students' | 'classes' | 'settings'>('tracker');
  const [selectedFolderDetail, setSelectedFolderDetail] = useState<string | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<QuizQuestion | null>(null);
  const [editingClass, setEditingClass] = useState<{ oldName: string; newName: string } | null>(null);
  const [showEditClassModal, setShowEditClassModal] = useState<boolean>(false);
  
  // Quiz Form State
  const [questionText, setQuestionText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [questionType, setQuestionType] = useState<'cognitive' | 'interest'>('cognitive');
  const [questionCategory, setQuestionCategory] = useState('Umum');
  const [adminCategoryFilter, setAdminCategoryFilter] = useState('Semua');
  const [isRenamingFolder, setIsRenamingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameError, setRenameError] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  
  // Student Results Tracker State
  const [results, setResults] = useState<StudentResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  
  // Supabase Config State
  const [sbUrl, setSbUrl] = useState('');
  const [sbAnonKey, setSbAnonKey] = useState('');
  const [isSbConnected, setIsSbConnected] = useState(false);
  const [configCopied, setConfigCopied] = useState(false);
  // Import Excel/CSV State
  const [showGroupModal, setShowGroupModal] = useState<boolean>(false);
  const [groupCount, setGroupCount] = useState<number>(4);
  const [groupTargetClass, setGroupTargetClass] = useState<string>('All');
  const [generatedGroups, setGeneratedGroups] = useState<{ name: string; students: StudentResult[] }[]>([]);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  const showConfirm = (title: string, message: string, onConfirm: () => void | Promise<void>) => {
    sound.playClick();
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        sound.playSpell();
        await onConfirm();
        setConfirmConfig(null);
      }
    });
  };

  const [importLoading, setImportLoading] = useState(false);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);
  const [importError, setImportError] = useState<string>('');
  const [importTargetPackage, setImportTargetPackage] = useState<string>('excel');

  // Custom packages management
  const [customPackages, setCustomPackages] = useState<string[]>(() => {
    const stored = localStorage.getItem('eduquest_custom_packages');
    return stored ? JSON.parse(stored) : ['Umum', 'Sains & Logika', 'Lingkungan & Alam', 'Eksplorasi Karakter'];
  });
  const [newPackageName, setNewPackageName] = useState('');

  // Bulk delete selected quizzes
  const [selectedQuizzes, setSelectedQuizzes] = useState<Set<string | number>>(new Set());

  // Student Accounts state
  const [students, setStudents] = useState<StudentAccount[]>([]);
  const [studentsSearch, setStudentsSearch] = useState('');
  const [studentsClassFilter, setStudentsClassFilter] = useState('All');
  const [selectedStudents, setSelectedStudents] = useState<Set<string | number>>(new Set());
  
  // Student account import states
  const [studentImportLoading, setStudentImportLoading] = useState(false);
  const [studentImportSuccess, setStudentImportSuccess] = useState<number | null>(null);
  const [studentImportError, setStudentImportError] = useState('');
  const [studentImportClass, setStudentImportClass] = useState<string>('X MIPA 1');

  // Student manual account creation states
  const [manualStudentName, setManualStudentName] = useState('');
  const [manualStudentClass, setManualStudentClass] = useState('X MIPA 1');
  const [manualStudentAbsen, setManualStudentAbsen] = useState('');
  const [manualStudentNis, setManualStudentNis] = useState('');
  const [manualStudentSuccess, setManualStudentSuccess] = useState(false);
  const [manualStudentError, setManualStudentError] = useState('');

  // Dynamic Class List management state
  const DEFAULT_CLASSES = [
    'X MIPA 1', 'X MIPA 2', 'X IPS 1', 'X IPS 2',
    'XI MIPA 1', 'XI MIPA 2', 'XI IPS 1', 'XI IPS 2',
    'XII MIPA 1', 'XII MIPA 2', 'XII IPS 1', 'XII IPS 2',
  ];

  const [classList, setClassList] = useState<string[]>(() => {
    const saved = localStorage.getItem('eduquest_class_list');
    return saved ? JSON.parse(saved) : DEFAULT_CLASSES;
  });

  useEffect(() => {
    loadClassesData();
  }, []);

  const loadClassesData = async () => {
    try {
      const classes = await fetchClasses();
      setClassList(classes);
    } catch (e) {
      console.error("Gagal memuat daftar kelas:", e);
    }
  };

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const [newClassNameInput, setNewClassNameInput] = useState('');
  const [addClassError, setAddClassError] = useState('');

  const handleAddClass = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newClassNameInput.trim();
    if (!trimmed) {
      setAddClassError('Nama kelas tidak boleh kosong!');
      sound.playDamage();
      return;
    }
    if (classList.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      setAddClassError('Nama kelas sudah ada dalam daftar!');
      sound.playDamage();
      return;
    }
    await addClassToDb(trimmed);
    await loadClassesData();
    setNewClassNameInput('');
    setAddClassError('');
    sound.playSpell();
  };

  const handleDeleteClass = async (targetClass: string) => {
    showConfirm(
      "Hapus Kelas?",
      `Apakah Anda yakin ingin menghapus kelas "${targetClass}"? Seluruh data murid di kelas ini akan kehilangan kelas mereka.`,
      async () => {
        await deleteClassFromDb(targetClass);
        await loadClassesData();
      }
    );
  };

  const handleGenerateGroups = () => {
    sound.playSpell();
    
    const classResults = results.filter(r => {
      if (groupTargetClass === 'All') return true;
      return r.class_name.toLowerCase().startsWith(groupTargetClass.toLowerCase());
    });
    
    if (classResults.length === 0) {
      alert(`Tidak ada data hasil kuis untuk kelas ${groupTargetClass}!`);
      return;
    }
    
    const studentsWithProfile = classResults.map(r => {
      const parts = (r.role || "Active Learner").split(" | ");
      return {
        ...r,
        dominantRole: parts[0] || "Active Learner",
        cognitive: parts[1] || "Cukup"
      };
    });
    
    const high = studentsWithProfile.filter(s => s.cognitive === "Sangat Baik");
    const med = studentsWithProfile.filter(s => s.cognitive === "Cukup");
    const low = studentsWithProfile.filter(s => s.cognitive === "Perlu Bimbingan");
    
    const sortByScore = (arr: typeof studentsWithProfile) => [...arr].sort((a, b) => b.score - a.score);
    const sorted = [...sortByScore(high), ...sortByScore(med), ...sortByScore(low)];
    
    const groups = Array.from({ length: groupCount }, (_, idx) => ({
      name: `Kelompok ${idx + 1}`,
      students: [] as StudentResult[]
    }));
    
    let reverse = false;
    let gIdx = 0;
    
    sorted.forEach(student => {
      groups[gIdx].students.push(student);
      
      if (reverse) {
        gIdx--;
        if (gIdx < 0) {
          gIdx = 0;
          reverse = false;
        }
      } else {
        gIdx++;
        if (gIdx >= groupCount) {
          gIdx = groupCount - 1;
          reverse = true;
        }
      }
    });
    
    setGeneratedGroups(groups);
  };

  const handleExportGroupsToExcel = () => {
    if (generatedGroups.length === 0) return;
    sound.playClick();
    
    const rows = [
      ["Daftar Kelompok Belajar EduQuest"],
      [`Kelas: ${groupTargetClass}`],
      [],
      ["Kelompok", "Nama Siswa", "Minat (Role)", "Kemampuan Kognitif", "Skor Kuis"]
    ];
    
    generatedGroups.forEach(group => {
      group.students.forEach(s => {
        const parts = (s.role || "Active Learner").split(" | ");
        rows.push([
          group.name,
          s.student_name,
          parts[0] || "Active Learner",
          parts[1] || "Cukup",
          String(s.score)
        ]);
      });
      rows.push([]);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Kelompok Belajar");
    XLSX.writeFile(wb, `Kelompok_Belajar_${groupTargetClass}.xlsx`);
  };

  const handleCopyGroupsToClipboard = () => {
    sound.playClick();
    let text = `=== DAFTAR KELOMPOK BELAJAR ${groupTargetClass.toUpperCase()} ===\n\n`;
    generatedGroups.forEach(group => {
      text += `* ${group.name} *\n`;
      group.students.forEach((s, idx) => {
        const parts = (s.role || "Active Learner").split(" | ");
        text += `${idx + 1}. ${s.student_name} (${parts[0]} - Kognitif: ${parts[1]}) [Skor: ${s.score}]\n`;
      });
      text += `\n`;
    });
    navigator.clipboard.writeText(text);
    alert("Daftar kelompok berhasil disalin ke clipboard!");
  };

  const handleDownloadTemplate = () => {
    sound.playClick();
    const headers = [
      "Pertanyaan", 
      "Pilihan A", 
      "Pilihan B", 
      "Pilihan C", 
      "Pilihan D", 
      "Kunci Jawaban (A/B/C/D)", 
      "Tipe Soal (cognitive/interest)",
      "Folder / Paket Kuis (Opsional)"
    ];
    const sampleRow1 = [
      "Dalam metode ilmiah, setelah kita mengamati suatu fenomena atau masalah, langkah logis berikutnya yang paling tepat dilakukan adalah...", 
      "Menarik kesimpulan final tanpa melakukan eksperimen atau pengumpulan data tambahan", 
      "Menyusun hipotesis (dugaan sementara) yang masuk akal dan dapat diuji kebenarannya", 
      "Menulis laporan ilmiah lengkap untuk langsung diterbitkan di jurnal pendidikan", 
      "Mengabaikan fenomena tersebut jika hasilnya nanti diperkirakan tidak sesuai teori lama", 
      "B", 
      "cognitive",
      "Sains & Logika"
    ];
    const sampleRow2 = [
      "Saat bekerja kelompok, peran apa yang paling membuat Anda nyaman?", 
      "Menyusun strategi, analisis target, perencanaan taktis (Planner)", 
      "Mengembangkan produk fisik, eksperimen teknis, pengerjaan kriya (Creator)", 
      "Merancang promosi kreatif, presentasi meyakinkan, komunikasi publik (Communicator)", 
      "Mengatur alur kerja tim, mendelegasikan peran, menjaga standar (Coordinator)", 
      "A", 
      "interest",
      "Eksplorasi Karakter"
    ];
    
    const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow1, sampleRow2]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Kuis");
    XLSX.writeFile(wb, "Template_Kuis_EduQuest.xlsx");
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    sound.playClick();
    setImportLoading(true);
    setImportError('');
    setImportSuccessCount(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        if (rows.length <= 1) {
          throw new Error("File Excel kosong atau hanya berisi judul kolom.");
        }

        const importedQuizzes: QuizQuestion[] = [];

        // Dynamic Header Matching
        const headerRow = (rows[0] || []).map(h => String(h || '').toLowerCase().trim());
        
        let colQuestion = headerRow.findIndex(h => h.includes('pertanyaan') || h.includes('soal') || h.includes('question') || h.includes('tanya'));
        let colOptA = headerRow.findIndex(h => h.includes('pilihan a') || h.includes('opsi a') || h.includes('option a') || h === 'a');
        let colOptB = headerRow.findIndex(h => h.includes('pilihan b') || h.includes('opsi b') || h.includes('option b') || h === 'b');
        let colOptC = headerRow.findIndex(h => h.includes('pilihan c') || h.includes('opsi c') || h.includes('option c') || h === 'c');
        let colOptD = headerRow.findIndex(h => h.includes('pilihan d') || h.includes('opsi d') || h.includes('option d') || h === 'd');
        let colCorrect = headerRow.findIndex(h => h.includes('kunci') || h.includes('jawaban') || h.includes('correct') || h.includes('key'));
        let colType = headerRow.findIndex(h => h.includes('tipe') || h.includes('type') || h.includes('jenis'));
        let colCategory = headerRow.findIndex(h => h.includes('folder') || h.includes('paket') || h.includes('kategori') || h.includes('category'));

        // Fallbacks
        if (colQuestion === -1) colQuestion = 0;
        if (colOptA === -1) colOptA = 1;
        if (colOptB === -1) colOptB = 2;
        if (colOptC === -1) colOptC = 3;
        if (colOptD === -1) colOptD = 4;
        if (colCorrect === -1) colCorrect = 5;
        if (colType === -1) colType = 6;
        if (colCategory === -1) colCategory = 7;

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0 || !row[colQuestion]) continue;

          const question = String(row[colQuestion] || '').trim();
          const option_a = String(row[colOptA] || '').trim();
          const option_b = String(row[colOptB] || '').trim();
          const option_c = String(row[colOptC] || '').trim();
          const option_d = String(row[colOptD] || '').trim();
          
          let correct_answer = String(row[colCorrect] || 'A').toUpperCase().trim();
          if (!['A', 'B', 'C', 'D'].includes(correct_answer)) {
            correct_answer = 'A';
          }

          let typeStr = String(row[colType] || 'cognitive').toLowerCase().trim();
          const type: 'cognitive' | 'interest' = typeStr === 'interest' ? 'interest' : 'cognitive';

          // Override package name if user selected a target package
          let category = 'Umum';
          if (importTargetPackage !== 'excel') {
            category = importTargetPackage;
          } else {
            category = String(row[colCategory] || 'Umum').trim() || 'Umum';
          }

          if (question && option_a && option_b && option_c && option_d) {
            importedQuizzes.push({
              question,
              option_a,
              option_b,
              option_c,
              option_d,
              correct_answer: correct_answer as 'A' | 'B' | 'C' | 'D',
              type,
              category
            });
          }
        }

        if (importedQuizzes.length === 0) {
          throw new Error("Tidak ada baris data yang valid ditemukan. Periksa kembali format kolom.");
        }

        const newFoldersRegistered = new Set<string>();
        for (const quiz of importedQuizzes) {
          const cat = quiz.category?.trim();
          if (cat && !customPackages.some(p => p.toLowerCase() === cat.toLowerCase()) && !newFoldersRegistered.has(cat.toLowerCase())) {
            newFoldersRegistered.add(cat.toLowerCase());
          }
          await addQuiz(quiz);
        }

        if (newFoldersRegistered.size > 0) {
          const updatedPackages = [...customPackages];
          newFoldersRegistered.forEach(f => {
            const matchingQuiz = importedQuizzes.find(q => q.category?.toLowerCase().trim() === f);
            if (matchingQuiz && matchingQuiz.category) {
              updatedPackages.push(matchingQuiz.category.trim());
            }
          });
          setCustomPackages(updatedPackages);
          localStorage.setItem('eduquest_custom_packages', JSON.stringify(updatedPackages));
        }

        sound.playSpell();
        setImportSuccessCount(importedQuizzes.length);
        onRefreshQuizzes();
      } catch (err: any) {
        sound.playDamage();
        setImportError(err.message || "Gagal mengurai file Excel. Pastikan format kolom sesuai template.");
      } finally {
        setImportLoading(false);
        e.target.value = '';
      }
    };

    reader.onerror = () => {
      sound.playDamage();
      setImportError("Gagal membaca file.");
      setImportLoading(false);
    };

    reader.readAsBinaryString(file);
  };

  useEffect(() => {
    // Check current credentials
    const config = getSupabaseConfig();
    if (config) {
      setSbUrl(config.url);
      setSbAnonKey(config.anonKey);
      setIsSbConnected(true);
    }
    
    if (isAuthenticated) {
      loadTrackerResults();
      loadStudents();
    }
  }, [isAuthenticated]);

  const loadTrackerResults = async () => {
    const data = await fetchStudentResults();
    setResults(data);
  };

  const loadStudents = async () => {
    const data = await fetchStudents();
    setStudents(data);
  };

  const handleRenameFolder = async () => {
    if (!newFolderName.trim()) {
      setRenameError('Nama folder tidak boleh kosong.');
      sound.playDamage();
      return;
    }
    if (newFolderName.trim() === adminCategoryFilter) {
      setIsRenamingFolder(false);
      return;
    }
    try {
      const success = await updateCategoryName(adminCategoryFilter, newFolderName.trim());
      if (success) {
        sound.playSpell();
        const updatedName = newFolderName.trim();
        setAdminCategoryFilter(updatedName);
        setIsRenamingFolder(false);
        setRenameError('');
        onRefreshQuizzes();
      } else {
        setRenameError('Gagal memperbarui nama folder.');
        sound.playDamage();
      }
    } catch (e) {
      console.error(e);
      setRenameError('Terjadi kesalahan saat memperbarui nama folder.');
      sound.playDamage();
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sbUrl || !sbAnonKey) {
      alert("Mohon masukkan URL dan Anon Key yang valid!");
      return;
    }
    saveSupabaseConfig(sbUrl, sbAnonKey);
    setIsSbConnected(true);
    setConfigCopied(true);
    sound.playCorrect();
    onRefreshQuizzes();
    setTimeout(() => setConfigCopied(false), 2000);
  };

  const handleClearConfig = () => {
    clearSupabaseConfig();
    setSbUrl('');
    setSbAnonKey('');
    setIsSbConnected(false);
    sound.playDamage();
    onRefreshQuizzes();
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText || !optA || !optB || !optC || !optD) {
      setFormError('Semua kolom pertanyaan dan pilihan jawaban harus diisi!');
      return;
    }

    const newQuiz: QuizQuestion = {
      question: questionText,
      option_a: optA,
      option_b: optB,
      option_c: optC,
      option_d: optD,
      correct_answer: correctAnswer,
      type: questionType,
      category: questionCategory.trim() || 'Umum'
    };

    try {
      await addQuiz(newQuiz);
      sound.playCorrect();
      setFormSuccess(true);
      setFormError('');
      
      // Clear inputs
      setQuestionText('');
      setOptA('');
      setOptB('');
      setOptC('');
      setOptD('');
      setCorrectAnswer('A');
      setQuestionType('cognitive');
      
      onRefreshQuizzes();
      setTimeout(() => setFormSuccess(false), 3000);
    } catch (err) {
      setFormError('Gagal menambahkan soal kuis.');
    }
  };

  const handleDeleteQuestion = async (id: string | number) => {
    showConfirm(
      "Hapus Soal?",
      "Apakah Anda yakin ingin menghapus soal kuis ini dari database?",
      async () => {
        const success = await deleteQuiz(id);
        if (success) {
          onRefreshQuizzes();
        }
      }
    );
  };

  const handleSelectQuizToggle = (id: string | number) => {
    setSelectedQuizzes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAllToggle = () => {
    const visibleQuizzes = allQuizzes.filter(q => adminCategoryFilter === 'Semua' || (q.category || 'Umum') === adminCategoryFilter);
    const allVisibleSelected = visibleQuizzes.every(q => selectedQuizzes.has(q.id!));
    
    setSelectedQuizzes(prev => {
      const newSet = new Set(prev);
      if (allVisibleSelected) {
        visibleQuizzes.forEach(q => newSet.delete(q.id!));
      } else {
        visibleQuizzes.forEach(q => newSet.add(q.id!));
      }
      return newSet;
    });
  };

  const handleBulkDelete = async () => {
    showConfirm(
      "Hapus Soal Terpilih?",
      `Apakah Anda yakin ingin menghapus ${selectedQuizzes.size} soal terpilih secara permanen?`,
      async () => {
        let successCount = 0;
        for (const id of selectedQuizzes) {
          const success = await deleteQuiz(id);
          if (success) successCount++;
        }
        if (successCount > 0) {
          setSelectedQuizzes(new Set());
          onRefreshQuizzes();
          alert(`Berhasil menghapus ${successCount} soal kuis.`);
        }
      }
    );
  };

  const handleResetToDefault = async () => {
    showConfirm(
      "Kosongkan Seluruh Database?",
      "Apakah Anda yakin ingin menghapus seluruh data secara permanen? Semua soal kuis, rekap nilai siswa, daftar murid, kelas, dan folder kuis akan dikosongkan.",
      async () => {
        await resetDatabaseToDefault();
        setCustomPackages([]);
        onRefreshQuizzes();
        loadTrackerResults();
        loadStudents();
        alert('Database berhasil dikosongkan sepenuhnya!');
      }
    );
  };

  const handleImportStudentsFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    sound.playClick();
    setStudentImportLoading(true);
    setStudentImportError('');
    setStudentImportSuccess(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        if (rows.length <= 1) {
          throw new Error("File Excel kosong atau hanya berisi judul kolom.");
        }

        const importedStudents: StudentAccount[] = [];

        // Dynamic Header Matching
        const headerRow = (rows[0] || []).map(h => String(h || '').toLowerCase().trim());
        
        let colName = headerRow.findIndex(h => h.includes('nama') || h.includes('name') || h.includes('siswa') || h.includes('student'));
        let colNis = headerRow.findIndex(h => h.includes('kode') || h.includes('unik') || h.includes('nis') || h.includes('id') || h.includes('code'));
        let colClass = headerRow.findIndex(h => h.includes('kelas') || h.includes('class'));
        let colAbsen = headerRow.findIndex(h => h.includes('absen') || h.includes('attendance') || h.includes('no') || h.includes('nomor'));

        // Fallbacks if header matching missed
        if (colName === -1) colName = 0;

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0 || !row[colName]) continue;

          const student_name = String(row[colName] || '').trim();
          let nis = colNis !== -1 && row[colNis] ? String(row[colNis]).trim() : undefined;
          const class_name = String((colClass !== -1 && row[colClass]) ? row[colClass] : studentImportClass).trim();
          const attendance_num = String((colAbsen !== -1 && row[colAbsen]) ? row[colAbsen] : i).padStart(2, '0').trim();

          if (!nis) {
            nis = generateUniqueCode([...students, ...importedStudents]);
          }

          if (student_name) {
            importedStudents.push({
              student_name,
              class_name,
              attendance_num,
              nis
            });
          }
        }

        if (importedStudents.length === 0) {
          throw new Error("Tidak ada data murid yang valid ditemukan. Periksa kembali format kolom.");
        }

        let successCount = 0;
        const newClassesRegistered = new Set<string>();
        for (const student of importedStudents) {
          const cName = student.class_name.trim();
          if (cName && !classList.some(c => c.toLowerCase() === cName.toLowerCase()) && !newClassesRegistered.has(cName.toLowerCase())) {
            await addClassToDb(cName);
            newClassesRegistered.add(cName.toLowerCase());
          }
          await addStudent(student);
          successCount++;
        }

        sound.playSpell();
        setStudentImportSuccess(successCount);
        loadStudents();
        await loadClassesData();
      } catch (err: any) {
        sound.playDamage();
        setStudentImportError(err.message || "Gagal mengurai file Excel.");
      } finally {
        setStudentImportLoading(false);
        e.target.value = '';
      }
    };

    reader.onerror = () => {
      sound.playDamage();
      setStudentImportError("Gagal membaca file.");
      setStudentImportLoading(false);
    };

    reader.readAsBinaryString(file);
  };

  const handleDownloadStudentsTemplate = () => {
    sound.playClick();
    const headers = [
      "Nama Siswa", 
      "Kode Unik", 
      "Kelas", 
      "Nomor Absen"
    ];
    const sampleRow1 = [
      "Ahmad Fauzi",
      "EQ-8F2K9L",
      "X MIPA 1",
      "01"
    ];
    const sampleRow2 = [
      "Budi Santoso",
      "EQ-3M7P1W",
      "X MIPA 1",
      "02"
    ];
    
    const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow1, sampleRow2]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Murid");
    XLSX.writeFile(wb, "Template_Daftar_Siswa.xlsx");
  };

  const handleDeleteStudent = async (id: string | number) => {
    showConfirm(
      "Hapus Akun Murid?",
      "Apakah Anda yakin ingin menghapus akun murid ini? Murid tersebut tidak akan bisa masuk ke aplikasi lagi.",
      async () => {
        const success = await deleteStudent(id);
        if (success) {
          loadStudents();
        }
      }
    );
  };

  const handleAddManualStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualStudentSuccess(false);
    setManualStudentError('');

    if (!manualStudentName.trim()) {
      setManualStudentError('Nama siswa tidak boleh kosong.');
      sound.playDamage();
      return;
    }
    if (!manualStudentClass.trim()) {
      setManualStudentError('Kelas tidak boleh kosong.');
      sound.playDamage();
      return;
    }
    if (!manualStudentAbsen.trim()) {
      setManualStudentError('Nomor absen tidak boleh kosong.');
      sound.playDamage();
      return;
    }

    let nis = manualStudentNis.trim();
    if (!nis) {
      nis = generateUniqueCode(students);
    }

    const newStudent: StudentAccount = {
      student_name: manualStudentName.trim(),
      class_name: manualStudentClass.trim(),
      attendance_num: manualStudentAbsen.trim(),
      nis: nis
    };

    try {
      sound.playSpell();
      const cName = manualStudentClass.trim();
      if (cName && !classList.some(c => c.toLowerCase() === cName.toLowerCase())) {
        await addClassToDb(cName);
        await loadClassesData();
      }

      const success = await addStudent(newStudent);
      if (success) {
        setManualStudentSuccess(true);
        setManualStudentName('');
        setManualStudentAbsen('');
        setManualStudentNis('');
        loadStudents();
      } else {
        setManualStudentError('Gagal menambahkan akun murid ke database.');
        sound.playDamage();
      }
    } catch (err: any) {
      setManualStudentError(err.message || 'Terjadi kesalahan sistem.');
      sound.playDamage();
    }
  };

  const handleSelectStudentToggle = (id: string | number) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAllStudentsToggle = (visibleList: StudentAccount[]) => {
    const allVisibleSelected = visibleList.every(s => selectedStudents.has(s.id!));
    setSelectedStudents(prev => {
      const newSet = new Set(prev);
      if (allVisibleSelected) {
        visibleList.forEach(s => newSet.delete(s.id!));
      } else {
        visibleList.forEach(s => newSet.add(s.id!));
      }
      return newSet;
    });
  };

  const handleBulkDeleteStudents = async () => {
    showConfirm(
      "Hapus Murid Terpilih?",
      `Apakah Anda yakin ingin menghapus ${selectedStudents.size} akun murid terpilih secara permanen?`,
      async () => {
        let successCount = 0;
        for (const id of selectedStudents) {
          const success = await deleteStudent(id);
          if (success) successCount++;
        }
        if (successCount > 0) {
          setSelectedStudents(new Set());
          loadStudents();
          alert(`Berhasil menghapus ${successCount} akun murid.`);
        }
      }
    );
  };

  // Filter student results
  const filteredResults = results.filter(res => {
    const matchesSearch = res.student_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          res.class_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          res.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = classFilter === 'All' || res.class_name === classFilter;
    return matchesSearch && matchesClass;
  });

  // Unique classes for filtering
  const classes = Array.from(new Set(results.map(r => r.class_name)));

  // Combine custom packages and existing categories in allQuizzes
  const allCategories = Array.from(new Set([
    ...customPackages,
    ...allQuizzes.map(q => q.category || 'Umum')
  ])).filter(Boolean);

  const handleRenameCategory = async (oldCategory: string) => {
    const newName = prompt(`Ubah nama folder kuis "${oldCategory}" menjadi:`, oldCategory);
    if (newName && newName.trim() && newName.trim() !== oldCategory) {
      const trimmed = newName.trim();
      sound.playSpell();
      const success = await updateCategoryName(oldCategory, trimmed);
      if (success) {
        const updatedPkgs = customPackages.map(p => p === oldCategory ? trimmed : p);
        setCustomPackages(updatedPkgs);
        localStorage.setItem('eduquest_custom_packages', JSON.stringify(updatedPkgs));
        onRefreshQuizzes();
        onRefreshAssignments();
      }
    }
  };

  const handleDeleteCategory = async (categoryToDelete: string) => {
    const categoryQuizzes = allQuizzes.filter(q => (q.category || 'Umum') === categoryToDelete);
    showConfirm(
      "Hapus Folder Kuis?",
      `Apakah Anda yakin ingin menghapus folder paket "${categoryToDelete}" beserta seluruh ${categoryQuizzes.length} soal di dalamnya secara permanen?`,
      async () => {
        let deleteCount = 0;
        for (const q of categoryQuizzes) {
          if (q.id) {
            const success = await deleteQuiz(q.id);
            if (success) deleteCount++;
          }
        }
        const updatedPkgs = customPackages.filter(p => p !== categoryToDelete);
        setCustomPackages(updatedPkgs);
        localStorage.setItem('eduquest_custom_packages', JSON.stringify(updatedPkgs));
        onRefreshQuizzes();
        onRefreshAssignments();
      }
    );
  };

  const sqlSchema = `-- SKEMA LENGKAP 5 TABEL SUPABASE UNTUK EDUQUEST
-- Jalankan di SQL Editor pada Console Cloud Supabase Anda.

-- 1. Tabel Kelas (classes)
CREATE TABLE IF NOT EXISTS classes (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  class_name text UNIQUE NOT NULL
);

-- 2. Tabel Akun Murid (students)
CREATE TABLE IF NOT EXISTS students (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  nis text UNIQUE NOT NULL,
  student_name text NOT NULL,
  class_name text NOT NULL,
  attendance_num text NOT NULL
);

-- 3. Tabel Soal Kuis (quizzes)
CREATE TABLE IF NOT EXISTS quizzes (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  question text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_answer text NOT NULL,
  type text NOT NULL DEFAULT 'cognitive',
  category text NOT NULL DEFAULT 'Umum'
);

-- 4. Tabel Hasil Nilai Siswa (student_results)
CREATE TABLE IF NOT EXISTS student_results (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  student_name text NOT NULL,
  class_name text NOT NULL,
  score integer NOT NULL,
  remaining_hp integer NOT NULL DEFAULT 100,
  role text NOT NULL DEFAULT 'Siswa Active Learner',
  submit_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabel Penugasan Ujian Kelas (class_assignments)
CREATE TABLE IF NOT EXISTS class_assignments (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  class_name text UNIQUE NOT NULL,
  category text NOT NULL,
  assigned_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Kebijakan Akses Publik (RLS Policies)
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Akses Publik Classes" ON classes FOR ALL USING (true);
CREATE POLICY "Akses Publik Students" ON students FOR ALL USING (true);
CREATE POLICY "Akses Publik Quizzes" ON quizzes FOR ALL USING (true);
CREATE POLICY "Akses Publik Results" ON student_results FOR ALL USING (true);
CREATE POLICY "Akses Publik Assignments" ON class_assignments FOR ALL USING (true);`;

  const copyToClipboard = (text: string, setCopiedState: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopiedState(true);
    sound.playClick();
    setTimeout(() => setCopiedState(false), 2000);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();

    if (!adminUser.trim() || !adminPassword.trim()) {
      setAuthError('Username/Email dan Password wajib diisi!');
      sound.playDamage();
      return;
    }

    setIsLoggingIn(true);
    setAuthError('');

    try {
      const res = await signInTeacher(adminUser, adminPassword);
      if (res.success) {
        sound.playSpell();
        setIsAuthenticated(true);
      } else {
        sound.playDamage();
        setAuthError(res.error || 'Gagal login. Periksa kembali Username/Email dan Password Supabase Auth Anda.');
      }
    } catch (err: any) {
      sound.playDamage();
      setAuthError(err.message || 'Terjadi kesalahan sistem saat login.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0b0518] flex items-center justify-center p-4 sm:p-6 font-sans text-slate-100 relative overflow-hidden select-none">
        {/* Background decorative purple orbs */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-purple-600/30 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-violet-600/25 rounded-full blur-[130px] -z-10" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-gradient-to-br from-purple-700 via-violet-800 to-indigo-900 border-2 border-purple-400/50 rounded-3xl p-6 sm:p-10 max-w-lg w-full shadow-[0_15px_50px_rgba(147,51,234,0.5)] relative overflow-hidden backdrop-blur-2xl text-white"
        >
          {/* Top card gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-pink-400 via-amber-300 to-cyan-400" />

          <div className="flex justify-between items-center mb-6 pt-1">
            <button 
              onClick={() => { sound.playClick(); onBack(); }}
              className="flex items-center gap-2 text-purple-200 hover:text-white transition text-xs sm:text-sm font-extrabold cursor-pointer uppercase tracking-wider font-display"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" /> Kembali
            </button>
            <div className="bg-purple-950/80 text-amber-300 border border-purple-300/40 text-xs px-3.5 py-1.5 rounded-full font-black flex items-center gap-1.5 uppercase tracking-wider font-display shadow-inner">
              <Lock className="w-3.5 h-3.5 text-amber-300" /> Supabase Auth
            </div>
          </div>

          <div className="text-center mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-400/20 text-amber-300 border-2 border-amber-300/50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-amber-300" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none uppercase font-display">Supabase Admin Login</h1>
            <p className="text-purple-200 text-xs sm:text-sm mt-2 font-medium">Masuk menggunakan akun Supabase Authentication Guru.</p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-black text-purple-100 uppercase tracking-widest mb-1.5 font-display">
                Username / Email Guru
              </label>
              <input 
                type="text"
                value={adminUser}
                onChange={(e) => setAdminUser(e.target.value)}
                placeholder="Contoh: guru@eduquest.com atau admin"
                className="w-full bg-purple-950/80 border-2 border-purple-300/60 focus:border-amber-300 focus:ring-4 focus:ring-purple-400/40 rounded-2xl px-4 py-3 text-sm font-semibold outline-none text-white transition-all placeholder:text-purple-300/40 shadow-inner"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-purple-100 uppercase tracking-widest mb-1.5 font-display">
                Password Akses
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Masukkan password..."
                  className="w-full bg-purple-950/80 border-2 border-purple-300/60 focus:border-amber-300 focus:ring-4 focus:ring-purple-400/40 rounded-2xl pl-4 pr-20 py-3 text-sm font-semibold outline-none text-white transition-all placeholder:text-purple-300/40 shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-amber-300 font-extrabold hover:text-white transition cursor-pointer"
                >
                  {showPassword ? 'Sembunyi' : 'Lihat'}
                </button>
              </div>
            </div>

            {authError && (
              <p className="text-rose-200 text-xs mt-2 font-bold flex items-start gap-1.5 bg-rose-900/80 border-2 border-rose-400/60 p-3 rounded-xl leading-relaxed shadow-lg">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-300" />
                <span>{authError}</span>
              </p>
            )}

            <motion.button
              type="submit"
              disabled={isLoggingIn}
              whileHover={{ scale: 1.02, boxShadow: "0px 10px 25px rgba(245, 158, 11, 0.4)" }}
              whileTap={{ scale: 0.97 }}
              className="w-full bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 hover:from-amber-300 hover:to-pink-400 disabled:opacity-50 text-slate-950 font-black py-4 px-6 rounded-2xl shadow-[0_10px_25px_rgba(245,158,11,0.4)] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-widest text-xs sm:text-sm font-display mt-2"
            >
              {isLoggingIn ? 'Memproses Login...' : 'Masuk Dashboard Guru'}
            </motion.button>
          </form>

          <div className="mt-6 pt-5 border-t border-purple-300/30 text-center">
            <p className="text-xs text-purple-200 font-medium">
              💡 Akun admin/guru dapat dibuat di menu <b>Authentication → Users</b> pada console Cloud Supabase Anda.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#0b0518] text-slate-100 font-sans flex relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-[130px] -z-10" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-[140px] -z-10" />

      {/* FULL-HEIGHT LEFT SIDEBAR */}
      <aside className="w-64 sm:w-72 shrink-0 border-r-2 border-purple-400/40 bg-gradient-to-b from-purple-950 via-violet-950 to-slate-950 flex flex-col justify-between p-6 z-20 text-white shadow-2xl">
        <div className="space-y-6">
          {/* Logo & Header Info */}
          <div className="flex items-center gap-3 border-b border-purple-300/20 pb-4">
            <div className="p-2.5 bg-amber-400/20 text-amber-300 border border-amber-300/40 rounded-xl shadow-inner">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-md font-extrabold text-white font-display uppercase tracking-wider">EduQuest Board</h1>
              <span className="text-[9px] bg-purple-950/80 text-amber-300 border border-purple-300/40 font-bold px-2 py-0.5 rounded-full font-mono mt-1 inline-block">
                {isSbConnected ? 'Supabase Connected' : 'Local Fallback'}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-2 font-display">
            <p className="text-[9px] font-black text-amber-300/60 uppercase tracking-widest px-3 mb-2">Menu Dashboard</p>
            
            {/* 1. Live Tracker */}
            <button
              onClick={() => { sound.playClick(); setActivePage('tracker'); setSelectedFolderDetail(null); }}
              className={`w-full text-left px-4 py-3 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-3 transition cursor-pointer ${
                activePage === 'tracker' 
                  ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-slate-950 shadow-lg' 
                  : 'text-purple-200 hover:bg-purple-900/40 hover:text-white'
              }`}
            >
              <Users className={`w-4 h-4 ${activePage === 'tracker' ? 'text-slate-950' : 'text-amber-300'}`} />
              Rekap Skor
            </button>

            {/* 2. Posting Ujian */}
            <button
              onClick={() => { sound.playClick(); setActivePage('assignments'); setSelectedFolderDetail(null); }}
              className={`w-full text-left px-4 py-3 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-3 transition cursor-pointer ${
                activePage === 'assignments' 
                  ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-slate-950 shadow-lg' 
                  : 'text-purple-200 hover:bg-purple-900/40 hover:text-white'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${activePage === 'assignments' ? 'text-slate-950' : 'text-amber-300'}`} />
              Posting Ujian
            </button>

            {/* 3. Bank Kuis */}
            <button
              onClick={() => { sound.playClick(); setActivePage('bank'); setSelectedFolderDetail(null); }}
              className={`w-full text-left px-4 py-3 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-3 transition cursor-pointer ${
                activePage === 'bank' 
                  ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-slate-950 shadow-lg' 
                  : 'text-purple-200 hover:bg-purple-900/40 hover:text-white'
              }`}
            >
              <FolderOpen className={`w-4 h-4 ${activePage === 'bank' ? 'text-slate-950' : 'text-amber-300'}`} />
              Bank Kuis
              <span className={`ml-auto border text-[9px] px-2 py-0.5 rounded-full font-mono font-black ${
                activePage === 'bank' 
                  ? 'bg-slate-950 text-amber-300 border-slate-800' 
                  : 'bg-purple-950 text-amber-300 border-purple-300/40'
              }`}>
                {allQuizzes.length}
              </span>
            </button>

            {/* 4. Buat Kuis */}
            <button
              onClick={() => { sound.playClick(); setActivePage('builder'); setSelectedFolderDetail(null); }}
              className={`w-full text-left px-4 py-3 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-3 transition cursor-pointer ${
                activePage === 'builder' 
                  ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-slate-950 shadow-lg' 
                  : 'text-purple-200 hover:bg-purple-900/40 hover:text-white'
              }`}
            >
              <PlusCircle className={`w-4 h-4 ${activePage === 'builder' ? 'text-slate-950' : 'text-amber-300'}`} />
              Buat Kuis
            </button>

            {/* 5. Daftar Murid */}
            <button
              onClick={() => { sound.playClick(); setActivePage('students'); setSelectedFolderDetail(null); }}
              className={`w-full text-left px-4 py-3 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-3 transition cursor-pointer ${
                activePage === 'students' 
                  ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-slate-950 shadow-lg' 
                  : 'text-purple-200 hover:bg-purple-900/40 hover:text-white'
              }`}
            >
              <Users className={`w-4 h-4 ${activePage === 'students' ? 'text-slate-950' : 'text-amber-300'}`} />
              Daftar Murid
              <span className={`ml-auto border text-[9px] px-2 py-0.5 rounded-full font-mono font-black ${
                activePage === 'students' 
                  ? 'bg-slate-950 text-amber-300 border-slate-800' 
                  : 'bg-purple-950 text-amber-300 border-purple-300/40'
              }`}>
                {students.length}
              </span>
            </button>

            {/* 6. Kelola Kelas */}
            <button
              onClick={() => { sound.playClick(); setActivePage('classes'); setSelectedFolderDetail(null); }}
              className={`w-full text-left px-4 py-3 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-3 transition cursor-pointer ${
                activePage === 'classes' 
                  ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-slate-950 shadow-lg' 
                  : 'text-purple-200 hover:bg-purple-900/40 hover:text-white'
              }`}
            >
              <School className={`w-4 h-4 ${activePage === 'classes' ? 'text-slate-950' : 'text-amber-300'}`} />
              Kelola Kelas
              <span className={`ml-auto border text-[9px] px-2 py-0.5 rounded-full font-mono font-black ${
                activePage === 'classes' 
                  ? 'bg-slate-950 text-amber-300 border-slate-800' 
                  : 'bg-purple-950 text-amber-300 border-purple-300/40'
              }`}>
                {classList.length}
              </span>
            </button>

            {/* 7. Pengaturan Supabase */}
            <button
              onClick={() => { sound.playClick(); setActivePage('settings'); setSelectedFolderDetail(null); }}
              className={`w-full text-left px-4 py-3 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-3 transition cursor-pointer ${
                activePage === 'settings' 
                  ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-slate-950 shadow-lg' 
                  : 'text-purple-200 hover:bg-purple-900/40 hover:text-white'
              }`}
            >
              <Settings className={`w-4 h-4 ${activePage === 'settings' ? 'text-slate-950' : 'text-amber-300'}`} />
              Pengaturan DB
            </button>
          </div>
        </div>

        {/* Sidebar Footer Buttons */}
        <div className="space-y-2 font-display">
          <button 
            onClick={() => { sound.playClick(); onBack(); }}
            className="w-full bg-purple-900/40 hover:bg-purple-800 text-purple-200 hover:text-white border border-purple-300/30 py-2.5 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
          <button 
            onClick={() => { 
              showConfirm(
                "Keluar dari Sesi?",
                "Apakah Anda yakin ingin keluar (Log Out) dari dashboard admin?",
                async () => {
                  await signOutTeacher();
                  setIsAuthenticated(false);
                  onBack();
                }
              );
            }}
            className="w-full bg-rose-950/80 hover:bg-rose-900 text-rose-100 border border-rose-500/35 py-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT (RIGHT SIDE) */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto z-10">
        
        {/* Active Page Header bar */}
        <header className="bg-gradient-to-r from-purple-900/40 via-violet-950/40 to-slate-950/40 border-b border-purple-300/20 px-6 py-4 flex items-center justify-between shadow-md">
          <div>
            <h2 className="text-md font-extrabold text-white font-display uppercase tracking-widest">
              {activePage === 'tracker' && 'Live Student Tracker'}
              {activePage === 'assignments' && 'Posting Penugasan Ujian'}
              {activePage === 'bank' && (selectedFolderDetail ? `Bank Kuis > Folder: ${selectedFolderDetail}` : 'Bank Kuis')}
              {activePage === 'builder' && 'Buat Kuis Baru'}
              {activePage === 'students' && 'Manajemen Akun Murid'}
              {activePage === 'classes' && 'Manajemen Daftar Kelas'}
              {activePage === 'settings' && 'Pengaturan Supabase Cloud'}
            </h2>
            <p className="text-xs text-purple-300 font-sans mt-0.5">
              EduQuest • Panel Guru Terintegrasi
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isSbConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-[10px] text-purple-200 font-bold uppercase tracking-wider font-mono">
              {isSbConnected ? 'Supabase Sync Active' : 'Offline Sandbox'}
            </span>
          </div>
        </header>

        {/* Content Box */}
        <div className="p-6 max-w-7xl w-full mx-auto flex-1">
          <AnimatePresence mode="wait">
            
            {/* PAGE 1: REKAP SKOR / TRACKER */}
            {activePage === 'tracker' && (
              <motion.div
                key="page-tracker"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 border border-blue-300/40 rounded-3xl p-5 shadow-lg text-white">
                    <p className="text-xs font-black text-blue-100 uppercase tracking-wider font-display">TOTAL SUBMISSION</p>
                    <div className="flex justify-between items-end mt-2">
                      <span className="text-3xl font-black text-white font-display">{results.length}</span>
                      <span className="text-xs text-blue-100 font-semibold mb-1">Siswa Terdaftar</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-500 to-orange-600 border border-amber-300/40 rounded-3xl p-5 shadow-lg text-white">
                    <p className="text-xs font-black text-amber-100 uppercase tracking-wider font-display">SKOR TERTINGGI</p>
                    <div className="flex justify-between items-end mt-2">
                      <span className="text-3xl font-black text-white font-display">
                        {results.length > 0 ? Math.max(...results.map(r => r.score)) : 0}
                      </span>
                      <span className="text-xs text-amber-100 font-semibold mb-1">Poin Max</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-700 border border-emerald-300/40 rounded-3xl p-5 shadow-lg text-white">
                    <p className="text-xs font-black text-emerald-100 uppercase tracking-wider font-display">RATA-RATA SKOR</p>
                    <div className="flex justify-between items-end mt-2">
                      <span className="text-3xl font-black text-white font-display">
                        {results.length > 0 
                          ? Math.round(results.reduce((acc, r) => acc + r.score, 0) / results.length) 
                          : 0
                        }
                      </span>
                      <span className="text-xs text-emerald-100 font-semibold mb-1">Rata-rata Kelas</span>
                    </div>
                  </div>
                </div>

                {/* Table Live Student Tracker */}
                <div className="bg-gradient-to-br from-purple-900/90 via-violet-950/90 to-slate-950/90 border-2 border-purple-400/40 rounded-3xl shadow-2xl overflow-hidden text-white">
                  <div className="p-5 border-b border-purple-300/30 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div>
                      <h2 className="text-lg font-extrabold text-white font-display">Live Student Tracker Dashboard</h2>
                      <p className="text-xs text-purple-200">Pantau perolehan nilai, sisa HP RPG, dan profil gaya belajar siswa secara real-time.</p>
                      
                      <div className="flex gap-2 mt-4">
                        <input 
                          type="text"
                          placeholder="Cari siswa..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="bg-purple-950/90 border border-purple-300/50 text-sm px-3 py-1.5 rounded-xl outline-none text-white focus:border-amber-300 w-48 transition"
                        />
                        <select
                          value={classFilter}
                          onChange={(e) => setClassFilter(e.target.value)}
                          className="bg-purple-950/90 border border-purple-300/50 text-sm px-3 py-1.5 rounded-xl outline-none text-amber-300 font-bold cursor-pointer transition"
                        >
                          <option value="All" className="bg-purple-950 text-white">Semua Kelas</option>
                          {classes.map(cls => (
                            <option key={cls} value={cls} className="bg-purple-950 text-white">{cls}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          sound.playClick();
                          setGroupTargetClass(classFilter !== 'All' ? classFilter : (classList[0] || 'All'));
                          setGeneratedGroups([]);
                          setShowGroupModal(true);
                        }}
                        className="bg-gradient-to-r from-amber-400 to-pink-500 hover:from-amber-300 hover:to-pink-400 text-slate-950 font-black p-2 px-3 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-lg mr-2"
                      >
                        <Zap className="w-3.5 h-3.5 text-slate-950" />
                        Bagi Kelompok Seimbang
                      </button>
                      <button 
                        onClick={() => { sound.playClick(); loadTrackerResults(); }}
                        className="bg-purple-900/80 hover:bg-purple-800 text-amber-300 border border-purple-300/40 p-2 px-3 rounded-xl text-xs font-black transition cursor-pointer"
                      >
                        🔄 Segarkan
                      </button>
                      {results.length > 0 && (
                        <button 
                          onClick={() => {
                            showConfirm(
                              "Hapus Semua Nilai?",
                              "Apakah Anda yakin ingin menghapus SELURUH data rekap nilai siswa secara permanen? Tindakan ini tidak dapat dibatalkan.",
                              async () => {
                                await deleteAllStudentResults();
                                loadTrackerResults();
                              }
                            );
                          }}
                          className="bg-rose-900/80 text-rose-100 hover:bg-rose-800 border border-rose-400/50 p-2 px-3 rounded-xl text-xs font-black transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    {filteredResults.length === 0 ? (
                      <div className="text-center py-12 text-purple-300 italic">Belum ada data nilai murid.</div>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-purple-950/90 border-b border-purple-300/30 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                            <th className="py-3 px-5">Nama Murid</th>
                            <th className="py-3 px-4">Kelas</th>
                            <th className="py-3 px-4 text-center">Skor</th>
                            <th className="py-3 px-4 text-center">Minat (Role)</th>
                            <th className="py-3 px-4 text-center">Akurasi Kognitif</th>
                            <th className="py-3 px-5">Waktu Submit</th>
                            <th className="py-3 px-4 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-purple-300/20 text-xs">
                          {filteredResults.map((result, idx) => {
                            const roleParts = (result.role || "Active Learner").split(" | ");
                            const dominantRole = roleParts[0] || "Active Learner";
                            const cognitiveLevel = roleParts[1] || "Cukup";

                            return (
                              <tr key={result.id || idx} className="hover:bg-purple-900/40 transition">
                                <td className="py-3 px-5 font-bold text-white">{result.student_name}</td>
                                <td className="py-3 px-4"><span className="bg-purple-950 px-2 py-0.5 rounded border border-purple-300/30">{result.class_name}</span></td>
                                <td className="py-3 px-4 text-center font-black text-amber-300">{result.score}</td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                    dominantRole === 'Planner' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40' :
                                    dominantRole === 'Creator' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' :
                                    dominantRole === 'Communicator' ? 'bg-pink-500/20 text-pink-300 border-pink-400/40' :
                                    dominantRole === 'Coordinator' ? 'bg-amber-500/20 text-amber-300 border-amber-400/40' :
                                    'bg-purple-500/20 text-purple-300 border-purple-400/40'
                                  }`}>
                                    {dominantRole}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                    cognitiveLevel === 'Sangat Baik' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' :
                                    cognitiveLevel === 'Perlu Bimbingan' ? 'bg-rose-500/20 text-rose-300 border-rose-400/40' :
                                    'bg-amber-500/20 text-amber-300 border-amber-400/40'
                                  }`}>
                                    {cognitiveLevel}
                                  </span>
                                </td>
                                <td className="py-3 px-5 font-mono text-purple-200">{new Date(result.submit_at).toLocaleDateString()}</td>
                                <td className="py-3 px-4 text-center">
                                  <button
                                    onClick={() => {
                                      showConfirm(
                                        "Hapus Skor Murid?",
                                        `Apakah Anda yakin ingin menghapus skor milik ${result.student_name} secara permanen?`,
                                        async () => {
                                          await deleteStudentResult(result.id);
                                          loadTrackerResults();
                                        }
                                      );
                                    }}
                                    className="text-rose-300 hover:text-white"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* PAGE 2: POSTING UJIAN / ASSIGNMENTS */}
            {activePage === 'assignments' && (
              <motion.div
                key="page-assignments"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="bg-gradient-to-br from-purple-900/90 via-violet-950/90 to-slate-950/90 border-2 border-purple-400/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-white">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                    <h3 className="text-md font-extrabold text-white font-display uppercase tracking-wider">
                      Posting Penugasan Kuis CBT (Ujian Online)
                    </h3>
                  </div>
                  <p className="text-xs text-purple-200 mb-6 font-sans">
                    Tentukan paket kuis yang aktif untuk setiap kelas. Murid di kelas tersebut hanya bisa mengerjakan paket kuis yang Anda posting di sini.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start font-sans">
                    {/* Form Input Penugasan */}
                    <div className="md:col-span-4 bg-purple-950/80 p-4 border border-purple-300/40 rounded-2xl space-y-4">
                      <h4 className="text-xs font-black text-amber-300 uppercase tracking-widest border-b border-purple-300/30 pb-2">
                        Buat Penugasan Baru
                      </h4>
                      
                      {/* Pilihan Kelas */}
                      <div>
                        <label className="block text-[10px] font-bold text-purple-200 uppercase tracking-widest mb-1.5">
                          Pilih Kelas Siswa
                        </label>
                        <select
                          id="assign-class-select"
                          defaultValue=""
                          onChange={async (e) => {
                            const cls = e.target.value;
                            const folder = (document.getElementById('assign-folder-select') as HTMLSelectElement)?.value;
                            if (cls && folder) {
                              sound.playSpell();
                              await assignQuizToClass(cls, folder);
                              onRefreshAssignments();
                              e.target.value = "";
                              (document.getElementById('assign-folder-select') as HTMLSelectElement).value = "";
                            }
                          }}
                          className="w-full bg-purple-950 border-2 border-purple-300/50 text-xs rounded-xl px-3 py-2 text-white font-bold outline-none cursor-pointer"
                        >
                          <option value="" disabled>--- Pilih Kelas ---</option>
                          {classList.map(c => (
                            <option key={c} value={c} className="bg-purple-950 text-white">{c}</option>
                          ))}
                        </select>
                      </div>

                      {/* Pilihan Paket / Folder */}
                      <div>
                        <label className="block text-[10px] font-bold text-purple-200 uppercase tracking-widest mb-1.5">
                          Pilih Folder / Paket Kuis
                        </label>
                        <select
                          id="assign-folder-select"
                          defaultValue=""
                          onChange={async (e) => {
                            const folder = e.target.value;
                            const cls = (document.getElementById('assign-class-select') as HTMLSelectElement)?.value;
                            if (cls && folder) {
                              sound.playSpell();
                              await assignQuizToClass(cls, folder);
                              onRefreshAssignments();
                              e.target.value = "";
                              (document.getElementById('assign-class-select') as HTMLSelectElement).value = "";
                            }
                          }}
                          className="w-full bg-purple-950 border-2 border-purple-300/50 text-xs rounded-xl px-3 py-2 text-white font-bold outline-none cursor-pointer"
                        >
                          <option value="" disabled>--- Pilih Paket Kuis ---</option>
                          <option value="Semua" className="bg-purple-950 text-white">📁 Semua Soal Kuis (Acak)</option>
                          {allCategories.map(cat => (
                            <option key={cat} value={cat} className="bg-purple-950 text-white">📁 {cat}</option>
                          ))}
                        </select>
                      </div>
                      
                      <p className="text-[10px] text-purple-300 italic font-medium leading-relaxed">
                        * Pilihlah salah satu kelas terlebih dahulu, kemudian pilih paket kuis untuk langsung memposting penugasan.
                      </p>
                    </div>

                    {/* Daftar Penugasan Aktif */}
                    <div className="md:col-span-8 space-y-3">
                      <h4 className="text-xs font-black text-amber-300 uppercase tracking-widest mb-1">
                        Daftar Penugasan Aktif saat ini ({assignments.length})
                      </h4>
                      {assignments.length === 0 ? (
                        <div className="border border-dashed border-purple-300/30 rounded-2xl p-8 text-center text-purple-300 italic">
                          Belum ada ujian kuis yang diposting. Seluruh siswa dapat mengakses semua paket soal secara default.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {assignments.map(assign => (
                            <div key={assign.class_name} className="bg-purple-950/70 border border-purple-300/40 rounded-2xl p-4 flex items-center justify-between shadow-md">
                              <div>
                                <span className="block text-xs font-black text-amber-300 uppercase tracking-wider">{assign.class_name}</span>
                                <span className="text-[11px] text-purple-200 font-bold mt-1 inline-block bg-purple-900/60 px-2 py-0.5 rounded border border-purple-300/20">
                                  📁 Paket: {assign.category}
                                </span>
                              </div>
                              <button
                                onClick={async () => {
                                  if (confirm(`Hapus postingan kuis untuk kelas ${assign.class_name}?`)) {
                                    sound.playDamage();
                                    await removeClassAssignment(assign.class_name);
                                    onRefreshAssignments();
                                  }
                                }}
                                className="p-2 bg-rose-900/60 hover:bg-rose-800 border border-rose-400/50 text-rose-200 hover:text-white rounded-xl transition cursor-pointer"
                                title="Batalkan Postingan Kelas Ini"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activePage === 'bank' && (
              <motion.div
                key="page-bank"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {!selectedFolderDetail ? (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-extrabold text-white font-display">Folder Bank Kuis</h3>
                        <p className="text-xs text-purple-200">Klik pada folder kuis di bawah ini untuk melihat detail soal dan manajemen kuis di dalamnya.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newPkg = prompt("Masukkan nama folder kuis baru:");
                          if (newPkg && newPkg.trim()) {
                            const trimmed = newPkg.trim();
                            if (customPackages.includes(trimmed)) return;
                            sound.playCorrect();
                            const updated = [...customPackages, trimmed];
                            setCustomPackages(updated);
                            localStorage.setItem('eduquest_custom_packages', JSON.stringify(updated));
                          }
                        }}
                        className="bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 hover:from-amber-300 hover:to-pink-400 text-slate-950 font-black px-4 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 uppercase tracking-wider shrink-0 shadow-lg cursor-pointer whitespace-nowrap"
                      >
                        <PlusCircle className="w-4 h-4 text-slate-950" /> Buat Folder Baru
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {allCategories.map(cat => {
                        const count = allQuizzes.filter(q => (q.category || 'Umum') === cat).length;
                        return (
                          <div 
                            key={cat}
                            className="bg-gradient-to-br from-purple-900/90 via-violet-950/90 to-slate-950/90 border-2 border-purple-400/40 rounded-3xl p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between group hover:border-amber-400/60 transition duration-300 text-white"
                          >
                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500" />
                            <div>
                              <div className="flex items-start justify-between mb-3 mt-1">
                                <FolderOpen className="w-10 h-10 text-amber-300 group-hover:scale-110 transition duration-300" />
                                <span className="bg-purple-950 border border-purple-300/40 text-amber-300 font-mono text-[10px] font-black px-2.5 py-0.5 rounded-full">
                                  {count} Soal
                                </span>
                              </div>
                              <h4 className="text-sm font-extrabold text-white line-clamp-1">{cat}</h4>
                            </div>

                            <div className="mt-5 pt-3 border-t border-purple-300/20 flex gap-2">
                              <button
                                onClick={() => { sound.playClick(); setSelectedFolderDetail(cat); }}
                                className="flex-1 bg-purple-950/80 hover:bg-purple-900 text-amber-300 hover:text-white border border-purple-300/40 py-2 rounded-xl text-center text-xs font-black transition cursor-pointer"
                              >
                                Buka Folder
                              </button>
                              <button
                                onClick={() => handleRenameCategory(cat)}
                                className="p-2 bg-purple-900/40 hover:bg-purple-800 text-purple-200 hover:text-white rounded-xl transition cursor-pointer"
                                title="Ubah Nama Folder"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              {cat !== 'Umum' && (
                                <button
                                  onClick={() => handleDeleteCategory(cat)}
                                  className="p-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-white rounded-xl transition cursor-pointer"
                                  title="Hapus Folder & Soal"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => { sound.playClick(); setSelectedFolderDetail(null); }}
                          className="p-2 bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-300/40 rounded-xl transition cursor-pointer"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div>
                          <h3 className="text-lg font-extrabold text-white font-display">Folder: {selectedFolderDetail}</h3>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {selectedQuizzes.size > 0 && (
                          <button
                            onClick={handleBulkDelete}
                            className="bg-rose-900/60 hover:bg-rose-800 border border-rose-400/50 text-rose-200 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            Hapus Terpilih ({selectedQuizzes.size})
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-900/90 via-violet-950/90 to-slate-950/90 border-2 border-purple-400/40 rounded-3xl shadow-2xl overflow-hidden text-white">
                      <div className="overflow-x-auto">
                        {allQuizzes.filter(q => (q.category || 'Umum') === selectedFolderDetail).length === 0 ? (
                          <div className="text-center py-10">Folder ini kosong.</div>
                        ) : (
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-purple-950/90 border-b border-purple-300/30 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                                <th className="py-3 px-4 w-10 text-center">
                                  <input
                                    type="checkbox"
                                    checked={
                                      allQuizzes.filter(q => (q.category || 'Umum') === selectedFolderDetail).length > 0 &&
                                      allQuizzes.filter(q => (q.category || 'Umum') === selectedFolderDetail).every(q => selectedQuizzes.has(q.id!))
                                    }
                                    onChange={() => {
                                      const visibleQuizzes = allQuizzes.filter(q => (q.category || 'Umum') === selectedFolderDetail);
                                      const allSelected = visibleQuizzes.every(q => selectedQuizzes.has(q.id!));
                                      setSelectedQuizzes(prev => {
                                        const newSet = new Set(prev);
                                        visibleQuizzes.forEach(q => allSelected ? newSet.delete(q.id!) : newSet.add(q.id!));
                                        return newSet;
                                      });
                                    }}
                                    className="w-3.5 h-3.5 rounded border-purple-400 bg-purple-950 focus:ring-1 focus:ring-amber-300 text-amber-400 cursor-pointer"
                                  />
                                </th>
                                <th className="py-3 px-4">Pertanyaan</th>
                                <th className="py-3 px-4 w-28">Kunci</th>
                                <th className="py-3 px-4 w-28 text-center">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-purple-300/20 text-xs">
                              {allQuizzes
                                .filter(q => (q.category || 'Umum') === selectedFolderDetail)
                                .map((quiz, index) => (
                                  <tr key={quiz.id || index} className="hover:bg-purple-900/40 transition">
                                    <td className="py-3 px-4 text-center">
                                      <input
                                        type="checkbox"
                                        checked={selectedQuizzes.has(quiz.id!)}
                                        onChange={() => handleSelectQuizToggle(quiz.id!)}
                                        className="w-3.5 h-3.5 rounded border-purple-400 bg-purple-950 text-amber-400 cursor-pointer"
                                      />
                                    </td>
                                    <td className="py-3 px-4">
                                      <p className="font-bold text-white">{quiz.question}</p>
                                      <span className="text-[10px] text-purple-300">A: {quiz.option_a} | B: {quiz.option_b} | C: {quiz.option_c} | D: {quiz.option_d}</span>
                                    </td>
                                    <td className="py-3 px-4 font-bold text-emerald-400">{quiz.correct_answer}</td>
                                    <td className="py-3 px-4 text-center">
                                      <div className="flex justify-center gap-2">
                                        <button type="button" onClick={() => { sound.playClick(); setEditingQuiz(quiz); }} className="p-1.5 bg-purple-900/60 text-amber-300 rounded-lg">
                                          <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button type="button" onClick={() => handleDeleteQuestion(quiz.id!)} className="p-1.5 bg-rose-900/60 text-rose-300 rounded-lg">
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* PAGE 4: BUAT KUIS */}
            {activePage === 'builder' && (
              <motion.div
                key="page-builder"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6"
              >
                <div className="lg:col-span-7 bg-gradient-to-br from-purple-900/90 via-violet-950/90 to-slate-950/90 border-2 border-purple-400/40 rounded-3xl p-6 shadow-2xl text-white font-sans">
                  <h2 className="text-lg font-extrabold text-white font-display flex items-center gap-2 mb-4">
                    <PlusCircle className="w-5 h-5 text-amber-300" /> Buat Kuis Baru
                  </h2>
                  
                  <form onSubmit={handleAddQuestion} className="space-y-4">
                    {formError && <p className="text-rose-300 text-xs font-bold">⚠ {formError}</p>}
                    {formSuccess && <p className="text-emerald-300 text-xs font-bold">✓ Soal berhasil ditambahkan!</p>}

                    <div>
                      <label className="block text-xs font-bold text-purple-200 uppercase tracking-wide mb-1">Pertanyaan</label>
                      <textarea
                        rows={2}
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        className="w-full bg-purple-950 border border-purple-300/40 rounded-xl p-3 text-xs outline-none text-white focus:border-amber-300 transition"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-purple-200 uppercase mb-1">Pilihan A</label>
                        <input type="text" value={optA} onChange={(e) => setOptA(e.target.value)} className="w-full bg-purple-950 border border-purple-300/40 rounded-xl p-2 text-xs text-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-purple-200 uppercase mb-1">Pilihan B</label>
                        <input type="text" value={optB} onChange={(e) => setOptB(e.target.value)} className="w-full bg-purple-950 border border-purple-300/40 rounded-xl p-2 text-xs text-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-purple-200 uppercase mb-1">Pilihan C</label>
                        <input type="text" value={optC} onChange={(e) => setOptC(e.target.value)} className="w-full bg-purple-950 border border-purple-300/40 rounded-xl p-2 text-xs text-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-purple-200 uppercase mb-1">Pilihan D</label>
                        <input type="text" value={optD} onChange={(e) => setOptD(e.target.value)} className="w-full bg-purple-950 border border-purple-300/40 rounded-xl p-2 text-xs text-white" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-purple-200 uppercase mb-1">Kunci</label>
                        <select value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value as any)} className="w-full bg-purple-950 border border-purple-300/40 rounded-xl p-2 text-xs text-white">
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-purple-200 uppercase mb-1">Tipe</label>
                        <select value={questionType} onChange={(e) => setQuestionType(e.target.value as any)} className="w-full bg-purple-950 border border-purple-300/40 rounded-xl p-2 text-xs text-white">
                          <option value="cognitive">Kognitif</option>
                          <option value="interest">Minat</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-purple-200 uppercase mb-1">Folder</label>
                        <select value={questionCategory} onChange={(e) => setQuestionCategory(e.target.value)} className="w-full bg-purple-950 border border-purple-300/40 rounded-xl p-2 text-xs text-white">
                          {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>
                    </div>

                    <button type="submit" className="w-full bg-gradient-to-r from-amber-400 to-pink-500 text-slate-950 font-black py-2.5 rounded-xl text-xs uppercase tracking-wider">
                      Simpan Soal Kuis
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-gradient-to-br from-purple-900/90 via-violet-950/90 to-slate-950/90 border-2 border-purple-400/40 rounded-3xl p-6 shadow-2xl text-white">
                    <h3 className="text-md font-bold mb-3">Bulk Import Excel Kuis</h3>
                    <div className="border-2 border-dashed border-purple-300/40 rounded-xl p-6 flex flex-col items-center justify-center relative bg-purple-950/40 font-sans">
                      <input type="file" accept=".xlsx, .xls, .csv" onChange={handleImportFile} disabled={importLoading} className="absolute inset-0 opacity-0 cursor-pointer" />
                      <Upload className="w-8 h-8 text-amber-300 mb-2" />
                      <span className="text-xs font-bold">{importLoading ? 'Mengimpor...' : 'Klik/seret Excel Kuis'}</span>
                    </div>
                    {importSuccessCount !== null && <p className="text-emerald-400 text-xs font-bold mt-2 font-sans">✓ Berhasil impor {importSuccessCount} soal!</p>}
                    {importError && <p className="text-rose-300 text-xs font-bold mt-2 font-sans">⚠ {importError}</p>}
                    <button onClick={handleDownloadTemplate} className="w-full mt-4 bg-purple-950 text-amber-300 text-xs border border-purple-300/40 py-2 rounded-xl font-bold font-sans">
                      Unduh Template Excel Kuis
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* PAGE 5: DAFTAR MURID */}
            {activePage === 'students' && (
              <motion.div
                key="page-students"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6"
              >
                <div className="lg:col-span-8 bg-gradient-to-br from-purple-900/90 via-violet-950/90 to-slate-950/90 border-2 border-purple-400/40 rounded-3xl p-6 shadow-2xl text-white font-sans">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-md font-bold">Daftar Akun Murid Terdaftar ({students.length})</h3>
                    <div className="flex gap-2">
                      <input type="text" placeholder="Cari..." value={studentsSearch} onChange={(e) => setStudentsSearch(e.target.value)} className="bg-purple-950 border border-purple-300/40 text-xs px-2.5 py-1 rounded-xl text-white" />
                      {selectedStudents.size > 0 && (
                        <button onClick={handleBulkDeleteStudents} className="bg-rose-900 text-xs px-2.5 py-1 rounded-xl font-bold">Hapus ({selectedStudents.size})</button>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-purple-950 text-[10px] text-amber-300 uppercase">
                          <th className="py-2 px-3 text-center"><input type="checkbox" onChange={() => handleSelectAllStudentsToggle(students)} className="cursor-pointer" /></th>
                          <th className="py-2 px-3">Absen</th>
                          <th className="py-2 px-3">Nama</th>
                          <th className="py-2 px-3">Kelas</th>
                          <th className="py-2 px-3">Kode NIS</th>
                          <th className="py-2 px-3 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-300/20 text-xs">
                        {students.filter(s => s.student_name.toLowerCase().includes(studentsSearch.toLowerCase())).map((s, idx) => (
                          <tr key={s.id || idx}>
                            <td className="py-2 px-3 text-center"><input type="checkbox" checked={selectedStudents.has(s.id!)} onChange={() => handleSelectStudentToggle(s.id!)} className="cursor-pointer" /></td>
                            <td className="py-2 px-3">{s.attendance_num}</td>
                            <td className="py-2 px-3 font-bold text-white">{s.student_name}</td>
                            <td className="py-2 px-3">{s.class_name}</td>
                            <td className="py-2 px-3 text-amber-300 font-mono">{s.nis}</td>
                            <td className="py-2 px-3 text-center">
                              <button onClick={() => handleDeleteStudent(s.id!)} className="text-rose-300 hover:text-white p-1 hover:bg-rose-900/60 rounded transition"><Trash2 className="w-3.5 h-3.5" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-gradient-to-br from-purple-900/90 via-violet-950/90 to-slate-950/90 border-2 border-purple-400/40 rounded-3xl p-6 shadow-2xl text-white font-sans">
                    <h3 className="text-xs font-bold uppercase mb-3 text-amber-300">Impor Siswa Excel</h3>
                    <div className="border-2 border-dashed border-purple-300/40 rounded-xl p-6 flex flex-col items-center justify-center relative bg-purple-950/40">
                      <input type="file" accept=".xlsx, .xls, .csv" onChange={handleImportStudentsFile} disabled={studentImportLoading} className="absolute inset-0 opacity-0 cursor-pointer" />
                      <Upload className="w-8 h-8 text-amber-300 mb-2" />
                      <span className="text-xs font-bold">{studentImportLoading ? 'Mengimpor...' : 'Unggah Excel Siswa'}</span>
                    </div>
                    {studentImportSuccess !== null && <p className="text-emerald-400 text-xs font-bold mt-2">✓ Berhasil impor {studentImportSuccess} siswa!</p>}
                    <button onClick={handleDownloadStudentsTemplate} className="w-full mt-4 bg-purple-950 text-amber-300 text-xs border border-purple-300/40 py-2 rounded-xl font-bold">Template Excel</button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* PAGE 6: KELOLA KELAS */}
            {activePage === 'classes' && (
              <motion.div
                key="page-classes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6"
              >
                <div className="lg:col-span-8 bg-gradient-to-br from-purple-900/90 via-violet-950/90 to-slate-950/90 border-2 border-purple-400/40 rounded-3xl p-6 shadow-2xl text-white">
                  <h3 className="text-md font-bold mb-4 font-display">Kelola Kelas Terdaftar</h3>
                  <table className="w-full text-left font-sans">
                    <thead>
                      <tr className="bg-purple-950 text-[10px] text-amber-300 uppercase">
                        <th className="py-2.5 px-4 w-12 text-center">No</th>
                        <th className="py-2.5 px-4">Nama Kelas</th>
                        <th className="py-2.5 px-4 text-center">Jumlah Murid</th>
                        <th className="py-2.5 px-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-300/20 text-xs">
                      {classList.map((cls, idx) => (
                        <tr key={cls}>
                          <td className="py-2.5 px-4 text-center">{idx + 1}</td>
                          <td className="py-2.5 px-4 font-bold">{cls}</td>
                          <td className="py-2.5 px-4 text-center">{students.filter(s => s.class_name === cls).length} Murid</td>
                          <td className="py-2.5 px-4 text-center">
                            <div className="flex justify-center gap-2">
                              <button onClick={() => { sound.playClick(); setEditingClass({ oldName: cls, newName: cls }); setShowEditClassModal(true); }} className="text-amber-300 text-xs hover:underline font-bold">Rename</button>
                              <button onClick={() => handleDeleteClass(cls)} className="text-rose-300 hover:text-white p-1 hover:bg-rose-900/60 rounded transition"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="lg:col-span-4 bg-gradient-to-br from-purple-900/90 via-violet-950/90 to-slate-950/90 border-2 border-purple-400/40 rounded-3xl p-6 shadow-2xl text-white font-sans">
                  <h3 className="text-xs font-bold uppercase mb-3 text-amber-300">Tambah Kelas Baru</h3>
                  <form onSubmit={handleAddClass} className="space-y-3">
                    <input type="text" value={newClassNameInput} onChange={(e) => setNewClassNameInput(e.target.value)} placeholder="Contoh: XI MIPA 1" className="w-full bg-purple-950 border border-purple-300/40 rounded-xl p-2.5 text-xs text-white" />
                    <button type="submit" className="w-full bg-gradient-to-r from-amber-400 to-pink-500 text-slate-950 font-black py-2 rounded-xl text-xs uppercase">Tambah Kelas</button>
                  </form>
                </div>
              </motion.div>
            )}

            {/* PAGE 7: SETTINGS */}
            {activePage === 'settings' && (
              <motion.div
                key="page-settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6"
              >
                <div className="lg:col-span-7 bg-gradient-to-br from-purple-900/90 via-violet-950/90 to-slate-950/90 border-2 border-purple-400/40 rounded-3xl p-6 shadow-2xl text-white font-sans">
                  <h3 className="text-md font-bold mb-4 font-display">Pengaturan Supabase Cloud Database</h3>
                  <form onSubmit={handleSaveConfig} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-purple-200 mb-1">SUPABASE URL</label>
                      <input type="text" value={sbUrl} onChange={(e) => setSbUrl(e.target.value)} className="w-full bg-purple-950 border border-purple-300/40 rounded-xl p-2 text-xs text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-purple-200 mb-1">SUPABASE ANON KEY</label>
                      <textarea value={sbAnonKey} onChange={(e) => setSbAnonKey(e.target.value)} className="w-full bg-purple-950 border border-purple-300/40 rounded-xl p-2 text-[10px] text-white" rows={2} />
                    </div>
                    <button type="submit" className="w-full bg-gradient-to-r from-amber-400 to-pink-500 text-slate-950 font-black py-2 rounded-xl text-xs uppercase">Simpan & Hubungkan</button>
                  </form>

                  <div className="mt-6 pt-4 border-t border-purple-300/20 space-y-3">
                    <button onClick={async () => {
                      setIsSyncing(true);
                      const res = await syncLocalDataToSupabase();
                      setIsSyncing(false);
                      if (res.success) alert("Sinkronisasi berhasil!");
                    }} disabled={isSyncing} className="w-full bg-purple-950 text-amber-300 border border-purple-300/40 py-2.5 rounded-xl text-xs font-black transition cursor-pointer">
                      {isSyncing ? "Menyinkronkan..." : "⚡ SINKRONKAN DATA"}
                    </button>

                    <button 
                      onClick={() => {
                        localStorage.removeItem('eduquest_seeded');
                        localStorage.removeItem('eduquest_quizzes');
                        localStorage.removeItem('eduquest_class_list');
                        localStorage.removeItem('eduquest_class_assignments');
                        localStorage.removeItem('eduquest_custom_packages');
                        window.location.reload();
                      }}
                      className="w-full bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-black py-2.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer transition hover:from-emerald-300 hover:to-teal-400"
                    >
                      🌱 SEED DATA AWAL DIAGNOSTIK
                    </button>

                    <button 
                      onClick={handleResetToDefault}
                      className="w-full bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white border border-red-500/40 py-2.5 rounded-xl text-xs font-black transition cursor-pointer uppercase tracking-wider"
                    >
                      🚨 KOSONGKAN SELURUH DATA (RESET)
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-gradient-to-br from-purple-900/90 via-violet-950/90 to-slate-950/90 border-2 border-purple-400/40 rounded-3xl p-6 shadow-2xl text-white font-sans">
                  <h3 className="text-xs font-bold uppercase mb-2">Supabase SQL Schema</h3>
                  <pre className="bg-purple-950/80 rounded-xl p-3 text-[9px] font-mono overflow-auto h-60">{sqlSchema}</pre>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* MODAL 1: EDIT SOAL POPUP */}
      <AnimatePresence>
        {editingQuiz && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 text-white">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-gradient-to-br from-purple-900 via-violet-950 to-slate-950 border-2 border-purple-400 rounded-3xl p-6 w-full max-w-xl relative">
              <button onClick={() => setEditingQuiz(null)} className="absolute right-4 top-4 text-purple-200">X</button>
              <h3 className="text-base font-bold mb-4">Edit Soal Kuis</h3>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                await updateQuiz(editingQuiz);
                setEditingQuiz(null);
                onRefreshQuizzes();
              }} className="space-y-4">
                <textarea value={editingQuiz.question} onChange={(e) => setEditingQuiz({ ...editingQuiz, question: e.target.value })} className="w-full bg-purple-950 border rounded-xl p-2 text-xs" />
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <input type="text" value={editingQuiz.option_a} onChange={(e) => setEditingQuiz({ ...editingQuiz, option_a: e.target.value })} className="bg-purple-950 border rounded p-2" />
                  <input type="text" value={editingQuiz.option_b} onChange={(e) => setEditingQuiz({ ...editingQuiz, option_b: e.target.value })} className="bg-purple-950 border rounded p-2" />
                  <input type="text" value={editingQuiz.option_c} onChange={(e) => setEditingQuiz({ ...editingQuiz, option_c: e.target.value })} className="bg-purple-950 border rounded p-2" />
                  <input type="text" value={editingQuiz.option_d} onChange={(e) => setEditingQuiz({ ...editingQuiz, option_d: e.target.value })} className="bg-purple-950 border rounded p-2" />
                </div>
                <button type="submit" className="w-full bg-amber-400 text-slate-950 font-black py-2 rounded-xl text-xs uppercase">Simpan Perubahan</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: EDIT KELAS MODAL */}
      <AnimatePresence>
        {showEditClassModal && editingClass && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 text-white">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-gradient-to-br from-purple-900 via-violet-950 to-slate-950 border-2 border-purple-400 rounded-3xl p-6 w-full max-w-md relative">
              <button onClick={() => { setShowEditClassModal(false); setEditingClass(null); }} className="absolute right-4 top-4 text-purple-200">X</button>
              <h3 className="text-base font-bold mb-4">Ubah Nama Kelas</h3>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                await updateClassName(editingClass.oldName, editingClass.newName.trim());
                setShowEditClassModal(false);
                setEditingClass(null);
                await loadClassesData();
                loadStudents();
                loadTrackerResults();
              }} className="space-y-4">
                <input type="text" value={editingClass.newName} onChange={(e) => setEditingClass({ ...editingClass, newName: e.target.value })} className="w-full bg-purple-950 border rounded-xl p-2.5 text-xs text-white" />
                <button type="submit" className="w-full bg-amber-400 text-slate-950 font-black py-2 rounded-xl text-xs uppercase">Simpan Nama Baru</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: GROUP GENERATOR MODAL */}
      <AnimatePresence>
        {showGroupModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 text-white overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-gradient-to-br from-purple-900 via-violet-950 to-slate-950 border-2 border-purple-400 rounded-3xl p-6 w-full max-w-4xl relative my-8"
            >
              <button 
                onClick={() => { sound.playClick(); setShowGroupModal(false); }} 
                className="absolute right-4 top-4 text-purple-200 hover:text-white font-extrabold text-sm"
              >
                X
              </button>
              
              <div className="mb-6">
                <h3 className="text-lg font-black text-amber-300 font-display flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-300" /> Generator Kelompok Seimbang (Asesmen Diagnostik)
                </h3>
                <p className="text-xs text-purple-200 mt-1 font-sans">
                  Sistem akan membagi murid secara heterogen berdasarkan tingkat kemampuan kognitif dan keberagaman minat peran.
                </p>
              </div>

              {/* Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 font-sans text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-purple-200 uppercase tracking-wider mb-1">Target Kelas</label>
                  <select 
                    value={groupTargetClass} 
                    onChange={(e) => { sound.playClick(); setGroupTargetClass(e.target.value); }} 
                    className="w-full bg-purple-950 border border-purple-300/40 rounded-xl p-2.5 text-white outline-none"
                  >
                    <option value="All">Semua Kelas</option>
                    {classList.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-purple-200 uppercase tracking-wider mb-1">Jumlah Kelompok</label>
                  <input 
                    type="number" 
                    min={2} 
                    max={20} 
                    value={groupCount} 
                    onChange={(e) => setGroupCount(Math.max(2, parseInt(e.target.value) || 2))} 
                    className="w-full bg-purple-950 border border-purple-300/40 rounded-xl p-2 text-white outline-none text-center font-bold"
                  />
                </div>
                <div className="flex items-end">
                  <button 
                    onClick={handleGenerateGroups}
                    className="w-full bg-gradient-to-r from-amber-400 to-pink-500 text-slate-950 font-black py-2.5 rounded-xl uppercase tracking-wider shadow-lg hover:from-amber-300 hover:to-pink-400 transition cursor-pointer text-xs"
                  >
                    Mulai Bagi Kelompok
                  </button>
                </div>
              </div>

              {/* Results Preview */}
              {generatedGroups.length > 0 && (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 border-t border-purple-300/20 pt-4 font-sans">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Hasil Pembagian Kelompok:</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={handleCopyGroupsToClipboard}
                        className="bg-purple-950 border border-purple-300/40 hover:bg-purple-900 text-purple-200 text-xs px-3 py-1.5 rounded-xl font-bold transition cursor-pointer"
                      >
                        📋 Salin Daftar
                      </button>
                      <button 
                        onClick={handleExportGroupsToExcel}
                        className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100 text-xs px-3 py-1.5 rounded-xl font-bold transition cursor-pointer border border-emerald-400/40"
                      >
                        📄 Ekspor Excel
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {generatedGroups.map((group, gIdx) => {
                      const rolesInGroup = new Set();
                      group.students.forEach(s => {
                        const parts = (s.role || "Active Learner").split(" | ");
                        rolesInGroup.add(parts[0] || "Active Learner");
                      });
                      const diversityPct = Math.round((rolesInGroup.size / 4) * 100);

                      return (
                        <div key={gIdx} className="bg-purple-950/70 border border-purple-300/30 rounded-2xl p-4 shadow-md space-y-3">
                          <div className="flex justify-between items-center border-b border-purple-300/20 pb-2">
                            <span className="text-xs font-black text-amber-300 uppercase tracking-wider">{group.name}</span>
                            <span className="text-[10px] bg-purple-900 px-2 py-0.5 rounded-full border border-purple-300/30 text-purple-200 font-bold" title="Keragaman Peran/Minat Siswa">
                              Keragaman Peran: {rolesInGroup.size}/4 ({diversityPct}%)
                            </span>
                          </div>

                          <div className="space-y-2">
                            {group.students.map((student, sIdx) => {
                              const parts = (student.role || "Active Learner").split(" | ");
                              const sRole = parts[0] || "Active Learner";
                              const sLevel = parts[1] || "Cukup";

                              return (
                                <div key={sIdx} className="flex items-center justify-between bg-purple-950/40 p-2 rounded-xl text-xs border border-purple-300/10">
                                  <div>
                                    <span className="font-bold text-white block">{student.student_name}</span>
                                    <span className="text-[10px] text-purple-300 block font-medium">{student.class_name.split(" ")[0]}</span>
                                  </div>
                                  <div className="flex gap-1.5 items-center">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                      sRole === 'Planner' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40' :
                                      sRole === 'Creator' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' :
                                      sRole === 'Communicator' ? 'bg-pink-500/20 text-pink-300 border-pink-400/40' :
                                      sRole === 'Coordinator' ? 'bg-amber-500/20 text-amber-300 border-amber-400/40' :
                                      'bg-purple-500/20 text-purple-300 border-purple-400/40'
                                    }`}>
                                      {sRole}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                      sLevel === 'Sangat Baik' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' :
                                      sLevel === 'Perlu Bimbingan' ? 'bg-rose-500/20 text-rose-300 border-rose-400/40' :
                                      'bg-amber-500/20 text-amber-300 border-amber-400/40'
                                    }`}>
                                      {sLevel}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: CUSTOM FLUID CONFIRMATION POPUP */}
      <AnimatePresence>
        {confirmConfig && confirmConfig.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 text-white font-sans">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-gradient-to-br from-purple-900 via-violet-950 to-slate-950 border-2 border-rose-500/50 rounded-3xl p-6 w-full max-w-sm relative text-center shadow-[0_10px_50px_rgba(244,63,94,0.3)]"
            >
              <div className="w-14 h-14 bg-rose-500/20 text-rose-400 border-2 border-rose-500/40 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 animate-pulse">
                ⚠️
              </div>
              <h3 className="text-md font-black text-white uppercase tracking-wider mb-2 font-display">{confirmConfig.title}</h3>
              <p className="text-xs text-purple-200 mb-6 leading-relaxed font-medium">{confirmConfig.message}</p>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => { sound.playClick(); setConfirmConfig(null); }}
                  className="bg-purple-950/80 hover:bg-purple-900 border border-purple-300/30 text-purple-200 text-xs py-2.5 rounded-xl font-bold uppercase transition cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  onClick={async () => {
                    await confirmConfig.onConfirm();
                  }}
                  className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white text-xs py-2.5 rounded-xl font-black uppercase transition cursor-pointer shadow-md"
                >
                  Ya, Lanjutkan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
