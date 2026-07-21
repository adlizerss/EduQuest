import React, { useState, useEffect } from 'react';
import { 
  Database, Trash2, PlusCircle, Copy, CheckCircle, ArrowLeft, 
  Lock, RotateCcw, FileSpreadsheet, Users, BookOpen, Settings, Sparkles, LogOut, Check,
  Upload, Download, AlertTriangle, Pencil, X, FolderOpen, School
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { QuizQuestion, StudentResult, StudentAccount, ClassAssignment } from '../types';
import { 
  addQuiz, deleteQuiz, fetchQuizzes, fetchStudentResults, 
  getSupabaseConfig, saveSupabaseConfig, clearSupabaseConfig, resetDatabaseToDefault,
  updateCategoryName, updateQuizCategory, fetchStudents, addStudent, deleteStudent,
  assignQuizToClass, removeClassAssignment
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
  const [pin, setPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  
  // Dashboard Tabs: 'tracker' | 'builder' | 'students'
  const [activeTab, setActiveTab] = useState<'tracker' | 'builder' | 'students'>('tracker');
  
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
  const [sqlCopied, setSqlCopied] = useState(false);

  // Import Excel/CSV State
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

  const [newClassNameInput, setNewClassNameInput] = useState('');
  const [addClassError, setAddClassError] = useState('');

  const handleAddClass = (e?: React.FormEvent) => {
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
    const updated = [...classList, trimmed];
    setClassList(updated);
    localStorage.setItem('eduquest_class_list', JSON.stringify(updated));
    setNewClassNameInput('');
    setAddClassError('');
    sound.playSpell();
  };

  const handleDeleteClass = (targetClass: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus kelas "${targetClass}"?`)) {
      const updated = classList.filter(c => c !== targetClass);
      setClassList(updated);
      localStorage.setItem('eduquest_class_list', JSON.stringify(updated));
      sound.playDamage();
    }
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

        for (const quiz of importedQuizzes) {
          await addQuiz(quiz);
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

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1919') {
      sound.playCorrect();
      setIsAuthenticated(true);
      localStorage.setItem('eduquest_admin_authenticated', 'true');
      setPinError('');
    } else {
      sound.playDamage();
      setPinError('PIN salah! Silakan coba lagi.');
      setPin('');
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
    if (confirm('Apakah Anda yakin ingin menghapus soal ini?')) {
      const success = await deleteQuiz(id);
      if (success) {
        sound.playDamage();
        onRefreshQuizzes();
      }
    }
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
    if (confirm(`Apakah Anda yakin ingin menghapus ${selectedQuizzes.size} soal terpilih?`)) {
      sound.playClick();
      let successCount = 0;
      for (const id of selectedQuizzes) {
        const success = await deleteQuiz(id);
        if (success) successCount++;
      }
      if (successCount > 0) {
        sound.playDamage();
        setSelectedQuizzes(new Set());
        onRefreshQuizzes();
        alert(`Berhasil menghapus ${successCount} soal kuis.`);
      }
    }
  };

  const handleResetToDefault = async () => {
    if (confirm('Apakah Anda yakin ingin mengatur ulang database ke data bawaan kuis PKWU? Semua hasil rekap siswa dan soal saat ini akan dihapus.')) {
      await resetDatabaseToDefault();
      sound.playCorrect();
      onRefreshQuizzes();
      loadTrackerResults();
      loadStudents();
      alert('Database berhasil diatur ulang ke kuis bawaan PKWU!');
    }
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
        for (const student of importedStudents) {
          await addStudent(student);
          successCount++;
        }

        sound.playSpell();
        setStudentImportSuccess(successCount);
        loadStudents();
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
    if (confirm('Apakah Anda yakin ingin menghapus akun murid ini?')) {
      const success = await deleteStudent(id);
      if (success) {
        sound.playDamage();
        loadStudents();
      }
    }
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
    if (confirm(`Apakah Anda yakin ingin menghapus ${selectedStudents.size} akun murid terpilih?`)) {
      sound.playClick();
      let successCount = 0;
      for (const id of selectedStudents) {
        const success = await deleteStudent(id);
        if (success) successCount++;
      }
      if (successCount > 0) {
        sound.playDamage();
        setSelectedStudents(new Set());
        loadStudents();
        alert(`Berhasil menghapus ${successCount} akun murid.`);
      }
    }
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

  const sqlSchema = `-- SKEMA SQL SUPABASE UNTUK EDUQUEST PKWU
-- Jalankan skrip ini di SQL Editor di dashboard Supabase Anda.

-- 1. Membuat tabel quizzes
CREATE TABLE IF NOT EXISTS quizzes (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  question text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_answer text NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  type text NOT NULL CHECK (type IN ('cognitive', 'interest')),
  category text DEFAULT 'Umum' NOT NULL
);

-- 2. Membuat tabel student_results
CREATE TABLE IF NOT EXISTS student_results (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  student_name text NOT NULL,
  class_name text NOT NULL,
  score integer NOT NULL,
  remaining_hp integer NOT NULL,
  role text NOT NULL,
  submit_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Mengizinkan Akses Publik (Nonaktifkan RLS atau Buat Kebijakan Akses)
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Akses Publik Baca Quizzes" ON quizzes FOR SELECT USING (true);
CREATE POLICY "Akses Publik Kelola Quizzes" ON quizzes FOR ALL USING (true);

CREATE POLICY "Akses Publik Tambah Student Results" ON student_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Akses Publik Baca Student Results" ON student_results FOR SELECT USING (true);
CREATE POLICY "Akses Publik Kelola Student Results" ON student_results FOR ALL USING (true);`;

  const copyToClipboard = (text: string, setCopiedState: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopiedState(true);
    sound.playClick();
    setTimeout(() => setCopiedState(false), 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0b0518] flex items-center justify-center p-4 sm:p-6 font-sans text-slate-100 relative overflow-hidden select-none">
        {/* Background decorative purple orbs */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-purple-600/20 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-[130px] -z-10" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="glass-panel-purple rounded-3xl p-6 sm:p-10 max-w-lg w-full shadow-2xl neon-glow-purple relative overflow-hidden"
        >
          {/* Top card gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500" />

          <div className="flex justify-between items-center mb-8 pt-1">
            <button 
              onClick={() => { sound.playClick(); onBack(); }}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition text-xs sm:text-sm font-extrabold cursor-pointer uppercase tracking-wider font-display"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" /> Kembali
            </button>
            <div className="bg-purple-500/15 text-purple-300 border border-purple-400/30 text-xs px-3.5 py-1.5 rounded-full font-black flex items-center gap-1.5 uppercase tracking-wider font-display">
              <Lock className="w-3.5 h-3.5 text-purple-400" /> Guru Panel
            </div>
          </div>

          <div className="text-center mb-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-purple-500/15 text-purple-300 border border-purple-400/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner neon-glow-purple">
              <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-purple-300" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-none uppercase font-display">Verifikasi Akses Guru</h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 font-medium">Masukkan PIN Guru untuk masuk ke dashboard manajemen EduQuest.</p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-6">
            <div>
              <label className="block text-[11px] font-black text-purple-300 uppercase tracking-widest mb-2 font-display text-center">
                PIN AKSES KEAMANAN
              </label>
              <input 
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="PIN"
                className="w-full text-center tracking-[0.8em] sm:tracking-[1em] text-2xl sm:text-4xl font-black bg-slate-950/90 border border-purple-500/30 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 rounded-2xl px-4 py-3.5 sm:py-4 outline-none text-purple-300 transition-all placeholder:text-slate-700 placeholder:tracking-normal font-mono shadow-inner"
                autoFocus
              />
              {pinError && (
                <p className="text-rose-400 text-xs sm:text-sm mt-3 font-bold flex items-center gap-1.5 bg-rose-500/15 border border-rose-500/30 p-3 rounded-xl">
                  ⚠ {pinError}
                </p>
              )}
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02, boxShadow: "0px 10px 25px rgba(147, 51, 234, 0.4)" }}
              whileTap={{ scale: 0.97 }}
              className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black py-4 px-6 rounded-2xl shadow-xl transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-widest text-xs sm:text-sm font-display"
            >
              Masuk Dashboard
            </motion.button>
          </form>

          <div className="mt-8 pt-6 border-t border-purple-500/20 text-center">
            <span className="text-xs text-slate-400 font-semibold">Petunjuk: Gunakan PIN <b className="text-purple-300 font-mono">1919</b> untuk masuk dashboard.</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0518] text-slate-100 font-sans flex flex-col relative overflow-x-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-[130px] -z-10" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-[140px] -z-10" />

      {/* Top Header Dashboard */}
      <header className="glass-panel-purple border-b border-purple-500/20 sticky top-0 z-20 px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/15 text-purple-300 border border-purple-400/30 rounded-xl shadow-sm">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-white font-display">EduQuest Guru Board</h1>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-400/30 font-bold px-2.5 py-0.5 rounded-full font-mono">
                {isSbConnected ? 'Supabase Connected' : 'Local Fallback'}
              </span>
            </div>
            <p className="text-xs text-slate-400">Interactive Quiz Platform • Panel Guru Terintegrasi</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => { sound.playClick(); onBack(); }}
            className="bg-slate-900/80 hover:bg-slate-850 text-slate-300 hover:text-white border border-purple-500/20 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Kembali ke layar utama tanpa melogout sesi admin"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
          <button 
            onClick={() => { 
              sound.playClick(); 
              localStorage.removeItem('eduquest_admin_authenticated');
              setIsAuthenticated(false);
              onBack(); 
            }}
            className="bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 hover:text-rose-200 border border-rose-900/40 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Keluar dan hapus sesi login admin"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Sidebar Nav with Fluid Tab Buttons */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-panel-purple rounded-2xl border border-purple-500/20 p-4 space-y-1.5 shadow-xl">
            <p className="text-[10px] font-black text-purple-300 uppercase tracking-widest px-3 mb-2 font-display">MENU DASHBOARD</p>
            
            <button
              onClick={() => { sound.playClick(); setActiveTab('tracker'); }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2.5 transition cursor-pointer font-sans ${
                activeTab === 'tracker' 
                  ? 'bg-gradient-to-r from-violet-600/30 to-purple-600/30 text-purple-200 border border-purple-400/40 shadow-inner' 
                  : 'text-slate-400 hover:bg-purple-950/40 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4 text-purple-400" />
              Live Student Tracker
            </button>

            <button
              onClick={() => { sound.playClick(); setActiveTab('builder'); }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2.5 transition cursor-pointer font-sans ${
                activeTab === 'builder' 
                  ? 'bg-gradient-to-r from-violet-600/30 to-purple-600/30 text-purple-200 border border-purple-400/40 shadow-inner' 
                  : 'text-slate-400 hover:bg-purple-950/40 hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
              Quiz Management
              <span className="ml-auto bg-purple-950 text-purple-300 border border-purple-500/30 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                {allQuizzes.length}
              </span>
            </button>

            <button
              onClick={() => { sound.playClick(); setActiveTab('students'); }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2.5 transition cursor-pointer font-sans ${
                activeTab === 'students' 
                  ? 'bg-gradient-to-r from-violet-600/30 to-purple-600/30 text-purple-200 border border-purple-400/40 shadow-inner' 
                  : 'text-slate-400 hover:bg-purple-950/40 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4 text-pink-400" />
              Akun Murid / Siswa
              <span className="ml-auto bg-purple-950 text-purple-300 border border-purple-500/30 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                {students.length}
              </span>
            </button>
          </div>

          {/* Database Health Card */}
          <div className="glass-panel rounded-2xl border border-slate-800 p-4 space-y-3 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">STATUS DATABASE</h3>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isSbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-xs font-semibold text-slate-200">
                {isSbConnected ? 'Terkoneksi ke Supabase' : 'Menggunakan Sandbox Lokal'}
              </span>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              {isSbConnected 
                ? 'Semua soal dan hasil ujian tersimpan secara langsung di tabel Cloud Supabase Anda.' 
                : 'Penyimpanan berjalan di Local Storage browser. Data dapat hilang jika Anda membersihkan cache.'
              }
            </p>

            <div className="pt-2 border-t border-slate-800/60 flex flex-col gap-1.5">
              <button 
                onClick={handleResetToDefault}
                className="w-full bg-slate-900 hover:bg-rose-950 hover:text-rose-400 border border-slate-800 text-slate-400 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Atur Ulang Database
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Panels */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            
            {/* TAB 1: LIVE STUDENT TRACKER */}
            {activeTab === 'tracker' && (
              <motion.div
                key="tracker"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="glass-panel rounded-2xl border border-slate-800 p-4 shadow-lg neon-glow-indigo">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">TOTAL SUBMISSION</p>
                    <div className="flex justify-between items-end mt-2">
                      <span className="text-3xl font-extrabold text-white font-display">{results.length}</span>
                      <span className="text-xs text-slate-400 mb-1">Siswa Terdaftar</span>
                    </div>
                  </div>
                  <div className="glass-panel rounded-2xl border border-slate-800 p-4 shadow-lg neon-glow-cyan">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">SKOR TERTINGGI</p>
                    <div className="flex justify-between items-end mt-2">
                      <span className="text-3xl font-extrabold text-indigo-400 font-display">
                        {results.length > 0 ? Math.max(...results.map(r => r.score)) : 0}
                      </span>
                      <span className="text-xs text-slate-400 mb-1">Poin Max</span>
                    </div>
                  </div>
                  <div className="glass-panel rounded-2xl border border-slate-800 p-4 shadow-lg neon-glow-emerald">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">RATA-RATA SKOR</p>
                    <div className="flex justify-between items-end mt-2">
                      <span className="text-3xl font-extrabold text-emerald-400 font-display">
                        {results.length > 0 
                          ? Math.round(results.reduce((acc, r) => acc + r.score, 0) / results.length) 
                          : 0
                        }
                      </span>
                      <span className="text-xs text-slate-400 mb-1">Rata-rata Kelas</span>
                    </div>
                  </div>
                </div>

                {/* CBT CLASS ASSIGNMENT MANAGER */}
                <div className="glass-panel rounded-2xl border border-slate-800 p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -z-10" />
                  
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                    <h3 className="text-md font-bold text-white font-display uppercase tracking-wider">
                      Posting Penugasan Kuis CBT (Ujian Online)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mb-6 font-sans">
                    Tentukan paket kuis yang aktif untuk setiap kelas. Murid di kelas tersebut hanya bisa mengerjakan paket kuis yang Anda posting di sini.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start font-sans">
                    {/* Form Input Penugasan */}
                    <div className="md:col-span-4 bg-slate-950/60 p-4 border border-slate-850 rounded-2xl space-y-4">
                      <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest border-b border-slate-850 pb-2">
                        Buat Penugasan Baru
                      </h4>
                      
                      {/* Pilihan Kelas */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                          Pilih Kelas Siswa
                        </label>
                        
                        <select
                          id="assign-class-select"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                        >
                          {Array.from(new Set([...classList, ...students.map(s => s.class_name)])).map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                          ))}
                        </select>
                      </div>

                      {/* Pilihan Paket */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                          Pilih Paket / Folder Kuis
                        </label>
                        <select
                          id="assign-package-select"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                        >
                          {allCategories.map(cat => (
                            <option key={cat} value={cat}>📁 {cat}</option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          const classSelect = document.getElementById("assign-class-select") as HTMLSelectElement | null;
                          const classInput = document.getElementById("assign-class-input") as HTMLInputElement | null;
                          const classNameStr = classSelect ? classSelect.value : (classInput ? classInput.value.trim() : '');
                          
                          const packageSelect = document.getElementById("assign-package-select") as HTMLSelectElement | null;
                          const packageStr = packageSelect ? packageSelect.value : '';

                          if (!classNameStr) {
                            alert("Masukkan atau pilih kelas terlebih dahulu!");
                            return;
                          }
                          if (!packageStr) {
                            alert("Pilih paket kuis yang ingin ditugaskan!");
                            return;
                          }

                          sound.playSpell();
                          const success = await assignQuizToClass(classNameStr, packageStr);
                          if (success) {
                            onRefreshAssignments();
                            alert(`Berhasil memposting kuis "${packageStr}" untuk kelas "${classNameStr}"!`);
                          }
                        }}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/10"
                      >
                        🚀 Posting Ujian Kelas
                      </button>
                    </div>

                    {/* Daftar Penugasan Saat Ini */}
                    <div className="md:col-span-8 space-y-3">
                      <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest border-b border-slate-850 pb-2">
                        Status Posting Ujian Kelas Aktif
                      </h4>

                      {assignments.length === 0 ? (
                        <div className="text-center py-6 text-slate-500 text-xs bg-slate-950/20 border border-slate-850/50 rounded-2xl border-dashed">
                          Belum ada ujian kelas yang diposting. Murid dapat login bebas (Guest Mode).
                        </div>
                      ) : (
                        <div className="max-h-56 overflow-y-auto space-y-2 pr-1.5">
                          {assignments.map((asg) => (
                            <div key={asg.class_name} className="flex justify-between items-center bg-slate-950 border border-slate-850 px-4 py-3 rounded-2xl text-xs">
                              <div>
                                <span className="text-white font-extrabold text-sm block">🏫 {asg.class_name}</span>
                                <span className="text-slate-400 mt-1 inline-flex items-center gap-1">
                                  📂 Paket Terposting: <strong className="text-cyan-400 font-bold">{asg.category}</strong>
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded-full text-[10px] animate-pulse">
                                  AKTIF
                                </span>
                                
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (confirm(`Apakah Anda yakin ingin menarik penugasan ujian kelas ${asg.class_name}? Murid kelas ini tidak akan bisa login lagi.`)) {
                                      sound.playDamage();
                                      const success = await removeClassAssignment(asg.class_name);
                                      if (success) {
                                        onRefreshAssignments();
                                      }
                                    }
                                  }}
                                  className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-lg transition cursor-pointer"
                                  title="Tarik Ujian (Unpublish)"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="glass-panel rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
                  <div className="p-5 border-b border-slate-800/80 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div>
                      <h2 className="text-lg font-bold text-white font-display">Live Student Tracker Dashboard</h2>
                      <p className="text-xs text-slate-400">Pantau perolehan nilai, sisa HP RPG, dan profil gaya belajar siswa secara real-time.</p>
                    </div>

                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                      <input 
                        type="text"
                        placeholder="Cari siswa atau peran..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-sm px-3 py-1.5 rounded-lg outline-none text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 flex-1 md:w-48 placeholder:text-slate-600"
                      />

                      <select
                        value={classFilter}
                        onChange={(e) => setClassFilter(e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-sm px-3 py-1.5 rounded-lg outline-none text-white cursor-pointer"
                      >
                        <option value="All">Semua Kelas</option>
                        {classes.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => { sound.playClick(); loadTrackerResults(); }}
                        className="bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/25 p-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer"
                        title="Segarkan Rekap Data"
                      >
                        🔄 Segarkan
                      </button>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    {filteredResults.length === 0 ? (
                      <div className="text-center py-12 px-4">
                        <Users className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
                        <h3 className="text-sm font-semibold text-slate-400">Belum Ada Rekap Siswa</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto font-sans leading-relaxed">
                          Siswa yang menyelesaikan kuis RPG EduQuest akan otomatis masuk ke daftar ini secara langsung.
                        </p>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-900/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="py-3.5 px-5">Nama Siswa</th>
                            <th className="py-3.5 px-4">Kelas & Absen</th>
                            <th className="py-3.5 px-4 text-center">Total Poin</th>
                            <th className="py-3.5 px-4 text-center">Status</th>
                            <th className="py-3.5 px-5">Waktu Submit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                          {filteredResults.map((result, idx) => (
                            <tr key={result.id || idx} className="hover:bg-slate-900/30 transition-colors">
                              <td className="py-3 px-5 font-semibold text-white">{result.student_name}</td>
                              <td className="py-3 px-4">
                                <span className="bg-slate-800 text-slate-300 font-medium px-2 py-0.5 rounded-md text-[11px] border border-slate-700/50">
                                  {result.class_name}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="text-base font-black text-amber-400 font-display">{result.score} Poin</span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                  ✓ Selesai
                                </span>
                              </td>
                              <td className="py-3 px-5 text-slate-400 font-mono">
                                {new Date(result.submit_at).toLocaleString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 2: QUIZ BUILDER */}
            {activeTab === 'builder' && (
              <motion.div
                key="builder"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Two Column Layout: Single Addition & Bulk Import */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  
                  {/* Left Column: Form Builder (7 cols) */}
                  <div className="lg:col-span-7 glass-panel rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-white font-display flex items-center gap-2 mb-1">
                        <PlusCircle className="w-5 h-5 text-indigo-400" />
                        Tambah Soal Kuis Baru Dinamis
                      </h2>
                      <p className="text-xs text-slate-400 mb-6 font-sans">
                        Soal yang ditambahkan akan langsung dimasukkan ke dalam daftar ujian siswa secara real-time.
                      </p>

                      <form onSubmit={handleAddQuestion} className="space-y-4">
                        {formError && (
                          <p className="text-rose-400 bg-rose-500/10 border border-rose-500/20 text-xs p-3 rounded-xl font-medium">
                            ⚠ {formError}
                          </p>
                        )}
                        {formSuccess && (
                          <p className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 text-xs p-3 rounded-xl font-semibold flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4" /> Soal berhasil ditambahkan ke database!
                          </p>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                          {/* Teks Soal */}
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                              Teks / Pertanyaan Kuis
                            </label>
                            <textarea
                              rows={3}
                              value={questionText}
                              onChange={(e) => setQuestionText(e.target.value)}
                              placeholder="Contoh: Manakah yang merupakan contoh pengolahan data yang valid?"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none text-white transition placeholder:text-slate-700 resize-none"
                            />
                          </div>

                          {/* Folder / Paket Kuis */}
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 flex justify-between items-center">
                              <span>📂 Pilih Paket Kuis</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newPkg = prompt("Masukkan nama paket/folder baru:");
                                  if (newPkg && newPkg.trim()) {
                                    const trimmed = newPkg.trim();
                                    if (customPackages.includes(trimmed)) {
                                      setQuestionCategory(trimmed);
                                      return;
                                    }
                                    sound.playCorrect();
                                    const updated = [...customPackages, trimmed];
                                    setCustomPackages(updated);
                                    localStorage.setItem('eduquest_custom_packages', JSON.stringify(updated));
                                    setQuestionCategory(trimmed);
                                  }
                                }}
                                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                ➕ Buat Paket Baru
                              </button>
                            </label>
                            <select
                              value={questionCategory}
                              onChange={(e) => setQuestionCategory(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none text-white transition cursor-pointer"
                            >
                              {allCategories.map(cat => (
                                <option key={cat} value={cat}>
                                  📁 {cat}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Opsi A */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                              Pilihan A (Perencana / Strategi)
                            </label>
                            <input
                              type="text"
                              value={optA}
                              onChange={(e) => setOptA(e.target.value)}
                              placeholder="Pilihan Jawaban A"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none text-white transition placeholder:text-slate-700"
                            />
                          </div>

                          {/* Opsi B */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                              Pilihan B (Kreator / Pelaksana)
                            </label>
                            <input
                              type="text"
                              value={optB}
                              onChange={(e) => setOptB(e.target.value)}
                              placeholder="Pilihan Jawaban B"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none text-white transition placeholder:text-slate-700"
                            />
                          </div>

                          {/* Opsi C */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                              Pilihan C (Komunikator / Presenter)
                            </label>
                            <input
                              type="text"
                              value={optC}
                              onChange={(e) => setOptC(e.target.value)}
                              placeholder="Pilihan Jawaban C"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none text-white transition placeholder:text-slate-700"
                            />
                          </div>

                          {/* Opsi D */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                              Pilihan D (Koordinator Tim)
                            </label>
                            <input
                              type="text"
                              value={optD}
                              onChange={(e) => setOptD(e.target.value)}
                              placeholder="Pilihan Jawaban D"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none text-white transition placeholder:text-slate-700"
                            />
                          </div>

                          {/* Dropdown Kunci Jawaban */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                              Kunci Jawaban Benar
                            </label>
                            <select
                              value={correctAnswer}
                              onChange={(e) => setCorrectAnswer(e.target.value as any)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none text-white transition cursor-pointer appearance-none text-center font-bold"
                            >
                              <option value="A" className="bg-slate-950">Pilihan A</option>
                              <option value="B" className="bg-slate-950">Pilihan B</option>
                              <option value="C" className="bg-slate-950">Pilihan C</option>
                              <option value="D" className="bg-slate-950">Pilihan D</option>
                            </select>
                          </div>

                          {/* Dropdown Tipe Soal */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                              Tipe / Jenis Soal
                            </label>
                            <select
                              value={questionType}
                              onChange={(e) => setQuestionType(e.target.value as any)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none text-white transition cursor-pointer appearance-none text-center font-semibold"
                            >
                              <option value="cognitive" className="bg-slate-950">Soal Utama (Kognitif / Ujian)</option>
                              <option value="interest" className="bg-slate-950">Eksplorasi (Menilai Profil Karakter)</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-end pt-3">
                          <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-semibold py-2.5 px-6 rounded-xl shadow-lg shadow-indigo-500/10 transition flex items-center gap-1.5 cursor-pointer text-sm"
                          >
                            <PlusCircle className="w-4 h-4" /> Simpan Soal Kuis
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Right Column: Bulk Import & Packages (5 cols) */}
                  <div className="lg:col-span-5 flex flex-col gap-6">
                    {/* Impor Massal Card */}
                    <div className="glass-panel rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-white font-display flex items-center gap-2 mb-1">
                          <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
                          Impor Massal (Excel / CSV)
                        </h2>
                        <p className="text-xs text-slate-400 mb-4 font-sans">
                          Unggah file Excel atau CSV berisi daftar soal untuk dimasukkan ke database kuis sekaligus.
                        </p>

                        {/* Target Package Selection Override */}
                        <div className="mb-4 font-sans">
                          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 flex justify-between items-center">
                            <span>🎯 Masukkan Ke Paket / Folder:</span>
                          </label>
                          <select
                            value={importTargetPackage}
                            onChange={(e) => setImportTargetPackage(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:border-cyan-500 outline-none text-white cursor-pointer transition"
                          >
                            <option value="excel" className="text-white bg-slate-950">📄 Gunakan Kategori di Kolom Excel (Default)</option>
                            {allCategories.map(cat => (
                              <option key={cat} value={cat} className="text-white bg-slate-950">
                                📁 Paksa Masuk Ke: {cat}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Drop Zone File Upload */}
                        <div className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center transition relative bg-slate-950/40">
                          <input
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            onChange={handleImportFile}
                            disabled={importLoading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:pointer-events-none"
                          />
                          <Upload className={`w-10 h-10 text-cyan-400 mb-3 ${importLoading ? 'animate-pulse' : ''}`} />
                          <span className="text-sm font-extrabold text-white">
                            {importLoading ? 'Membaca data file...' : 'Klik atau seret file ke sini'}
                          </span>
                          <span className="text-[10px] text-slate-500 mt-1">
                            Mendukung berkas berekstensi .xlsx, .xls, .csv
                          </span>
                        </div>

                        {/* Info / Warnings */}
                        {importSuccessCount !== null && (
                          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-2.5 text-xs text-emerald-400 mt-4 leading-relaxed font-sans font-medium">
                            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
                            <div>
                              <span className="font-extrabold block mb-0.5">Berhasil Mengimpor!</span>
                              Dimuat sebanyak <b>{importSuccessCount}</b> soal baru ke dalam kuis.
                            </div>
                          </div>
                        )}

                        {importError && (
                          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-start gap-2.5 text-xs text-rose-400 mt-4 leading-relaxed font-sans font-medium">
                            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
                            <div>
                              <span className="font-extrabold block mb-0.5">Gagal Mengimpor!</span>
                              {importError}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pt-6 border-t border-slate-800/60 mt-6 space-y-3.5">
                        <div className="flex items-start gap-2.5 text-xs text-slate-400 leading-relaxed font-sans">
                          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                          <span>
                            Gunakan tombol di bawah untuk mengunduh berkas template Excel yang sudah terstruktur agar proses impor berjalan lancar tanpa error.
                          </span>
                        </div>
                        
                        <button
                          type="button"
                          onClick={handleDownloadTemplate}
                          className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-850 active:scale-[0.98] border border-slate-800 text-slate-300 hover:text-white font-black rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
                        >
                          <Download className="w-4 h-4 text-cyan-400" />
                          Unduh Template Excel (.xlsx)
                        </button>
                      </div>
                    </div>

                    {/* Kelola Paket Kuis Card */}
                    <div className="glass-panel rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-white font-display flex items-center gap-2 mb-1">
                          <FolderOpen className="w-5 h-5 text-indigo-400" />
                          Kelola Paket Kuis
                        </h2>
                        <p className="text-xs text-slate-400 mb-4 font-sans">
                          Buat paket kuis terlebih dahulu untuk memisahkan mapel atau topik kuis sebelum menambahkan soal.
                        </p>

                        <div className="space-y-3 font-sans">
                          {/* Create Package Input */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Nama paket baru (misal: IPA Paket A)"
                              value={newPackageName}
                              onChange={(e) => setNewPackageName(e.target.value)}
                              className="bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white focus:border-indigo-500 outline-none flex-1 transition"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const name = newPackageName.trim();
                                if (!name) return;
                                if (customPackages.includes(name)) {
                                  alert("Paket dengan nama tersebut sudah ada!");
                                  return;
                                }
                                sound.playCorrect();
                                const updated = [...customPackages, name];
                                setCustomPackages(updated);
                                localStorage.setItem('eduquest_custom_packages', JSON.stringify(updated));
                                setNewPackageName('');
                              }}
                              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                            >
                              Buat Paket
                            </button>
                          </div>

                          {/* List of Custom Packages */}
                          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 border border-slate-900 rounded-xl p-2 bg-slate-950/40">
                            {customPackages.map((pkg, idx) => (
                              <div key={pkg || idx} className="flex justify-between items-center bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-900 text-xs">
                                <span className="text-slate-300 font-medium">📁 {pkg}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Apakah Anda yakin ingin menghapus paket "${pkg}"? Kuis yang berada dalam paket ini tidak akan terhapus, tetapi paket kosong ini akan dihapus dari daftar opsi.`)) {
                                      sound.playDamage();
                                      const updated = customPackages.filter(p => p !== pkg);
                                      setCustomPackages(updated);
                                      localStorage.setItem('eduquest_custom_packages', JSON.stringify(updated));
                                    }
                                  }}
                                  className="text-slate-500 hover:text-rose-400 transition"
                                  title="Hapus Paket"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Question List Table */}
                <div className="glass-panel rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
                  <div className="p-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-md font-bold text-white font-display">
                        Daftar Soal Kuis Saat Ini ({allQuizzes.length} Soal)
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 font-sans">
                        Siswa akan menjawab seluruh daftar kuis di bawah ini secara acak atau sesuai urutan ID.
                      </p>
                    </div>

                    {/* Folder Filter & Rename Option */}
                    {allQuizzes.length > 0 && (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        {selectedQuizzes.size > 0 && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleBulkDelete}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus ({selectedQuizzes.size})</span>
                            </button>

                            <select
                              defaultValue=""
                              onChange={async (e) => {
                                const targetCategory = e.target.value;
                                if (!targetCategory) return;
                                sound.playClick();
                                if (confirm(`Apakah Anda yakin ingin memindahkan ${selectedQuizzes.size} soal terpilih ke folder "${targetCategory}"?`)) {
                                  let successCount = 0;
                                  for (const id of selectedQuizzes) {
                                    const success = await updateQuizCategory(id, targetCategory);
                                    if (success) successCount++;
                                  }
                                  if (successCount > 0) {
                                    sound.playCorrect();
                                    setSelectedQuizzes(new Set());
                                    onRefreshQuizzes();
                                    alert(`Berhasil memindahkan ${successCount} soal ke folder "${targetCategory}".`);
                                  }
                                }
                                e.target.value = "";
                              }}
                              className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs rounded-xl px-2.5 py-1.5 text-indigo-400 font-bold transition cursor-pointer outline-none"
                            >
                              <option value="" disabled>📁 Pindahkan ke...</option>
                              {allCategories.map(cat => (
                                <option key={cat} value={cat} className="text-white bg-slate-950">
                                  📁 {cat}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-bold whitespace-nowrap">Filter Folder:</span>
                          <select
                            value={adminCategoryFilter}
                            onChange={(e) => {
                              setAdminCategoryFilter(e.target.value);
                              setIsRenamingFolder(false);
                            }}
                            className="bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-1.5 outline-none text-cyan-400 font-bold transition cursor-pointer appearance-none text-center"
                          >
                            <option value="Semua" className="bg-slate-950 text-white">📁 Semua Folder</option>
                            {allCategories.map(cat => (
                              <option key={cat} value={cat} className="bg-slate-950 text-white">
                                📁 {cat}
                              </option>
                            ))}
                          </select>
                        </div>

                        {adminCategoryFilter !== 'Semua' && (
                          <div className="flex items-center gap-2">
                            {!isRenamingFolder ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setNewFolderName(adminCategoryFilter);
                                  setIsRenamingFolder(true);
                                  setRenameError('');
                                  sound.playClick();
                                }}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/30 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap"
                                title="Edit nama folder ini"
                              >
                                <Pencil className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Ubah Nama Folder</span>
                              </button>
                            ) : (
                              <div className="flex flex-col gap-1 w-full sm:w-auto">
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    placeholder="Nama folder baru..."
                                    className="bg-slate-950 border border-slate-800 text-xs rounded-xl px-2.5 py-1.5 text-white focus:border-cyan-500 outline-none w-36 sm:w-48 transition"
                                  />
                                  <button
                                    type="button"
                                    onClick={handleRenameFolder}
                                    className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-lg transition cursor-pointer"
                                    title="Simpan"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsRenamingFolder(false);
                                      setRenameError('');
                                      sound.playClick();
                                    }}
                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                                    title="Batal"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                {renameError && (
                                  <span className="text-[10px] text-rose-400 font-bold font-sans">{renameError}</span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    {allQuizzes.length === 0 ? (
                      <div className="text-center py-10 font-sans">
                        <BookOpen className="w-12 h-12 text-slate-700 mx-auto mb-2 animate-bounce" />
                        <p className="text-sm font-semibold text-slate-400">Kuis Belum Siap / Kosong</p>
                        <p className="text-xs text-slate-500">Tambahkan soal baru melalui form di atas.</p>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-900/60 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="py-3 px-4 w-10 text-center">
                              <input
                                type="checkbox"
                                checked={
                                  allQuizzes.filter(q => adminCategoryFilter === 'Semua' || (q.category || 'Umum') === adminCategoryFilter).length > 0 &&
                                  allQuizzes.filter(q => adminCategoryFilter === 'Semua' || (q.category || 'Umum') === adminCategoryFilter).every(q => selectedQuizzes.has(q.id!))
                                }
                                onChange={handleSelectAllToggle}
                                className="w-3.5 h-3.5 rounded border-slate-800 bg-slate-950 focus:ring-1 focus:ring-indigo-500 text-indigo-500 cursor-pointer"
                              />
                            </th>
                            <th className="py-3 px-5 w-12 text-center">No</th>
                            <th className="py-3 px-4">Pertanyaan</th>
                            <th className="py-3 px-4 w-28">Tipe Soal</th>
                            <th className="py-3 px-4 w-28">Kunci Jawaban</th>
                            <th className="py-3 px-4 w-24 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                          {allQuizzes
                            .filter(q => adminCategoryFilter === 'Semua' || (q.category || 'Umum') === adminCategoryFilter)
                            .map((quiz, index) => (
                              <tr key={quiz.id ? `quiz-${quiz.id}` : `quiz-txt-${quiz.question}-${index}`} className="hover:bg-slate-900/30 transition">
                                <td className="py-3 px-4 text-center">
                                  <input
                                    type="checkbox"
                                    checked={selectedQuizzes.has(quiz.id!)}
                                    onChange={() => handleSelectQuizToggle(quiz.id!)}
                                    className="w-3.5 h-3.5 rounded border-slate-800 bg-slate-950 focus:ring-1 focus:ring-indigo-500 text-indigo-500 cursor-pointer"
                                  />
                                </td>
                                <td className="py-3 px-5 text-center font-bold text-slate-500">{index + 1}</td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <span className="bg-indigo-950 text-indigo-300 border border-indigo-900/40 px-2 py-0.5 rounded text-[10px] font-extrabold flex items-center gap-1 uppercase tracking-wider">
                                      📁 {quiz.category || 'Umum'}
                                    </span>
                                  </div>
                                  <p className="font-semibold text-white line-clamp-2">{quiz.question}</p>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1.5 text-[11px] text-slate-400 font-sans">
                                    <span><b>A:</b> {quiz.option_a}</span>
                                    <span><b>B:</b> {quiz.option_b}</span>
                                    <span><b>C:</b> {quiz.option_c}</span>
                                    <span><b>D:</b> {quiz.option_d}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    quiz.type === 'cognitive' 
                                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                                      : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                  }`}>
                                    {quiz.type === 'cognitive' ? 'Kognitif' : 'Minat'}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-extrabold px-2.5 py-0.5 rounded-md text-xs">
                                    Opsi {quiz.correct_answer}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <button
                                    onClick={() => handleDeleteQuestion(quiz.id!)}
                                    className="text-rose-400 hover:text-rose-300 p-2 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                                    title="Hapus Soal"
                                  >
                                    <Trash2 className="w-4.5 h-4.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 3: SISWA / AKUN SISWA */}
            {activeTab === 'students' && (
              <motion.div
                key="students"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Side: Student List Table (8 cols) */}
                  <div className="lg:col-span-8 flex flex-col gap-6">
                    <div className="glass-panel rounded-2xl border border-slate-800 shadow-xl overflow-hidden font-display">
                      <div className="p-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-md font-bold text-white">
                            Daftar Akun Murid Terdaftar ({students.length} Siswa)
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5 font-sans">
                            Hanya murid yang terdaftar di bawah ini yang dapat masuk ke petualangan kuis.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {selectedStudents.size > 0 && (
                            <button
                              type="button"
                              onClick={handleBulkDeleteStudents}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus ({selectedStudents.size})</span>
                            </button>
                          )}

                          <input
                            type="text"
                            placeholder="Cari nama / kelas..."
                            value={studentsSearch}
                            onChange={(e) => setStudentsSearch(e.target.value)}
                            className="bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-1.5 text-white outline-none w-40 placeholder:text-slate-600 focus:border-indigo-500 transition font-sans"
                          />

                          <select
                            value={studentsClassFilter}
                            onChange={(e) => setStudentsClassFilter(e.target.value)}
                            className="bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-1.5 outline-none text-cyan-400 font-bold cursor-pointer transition"
                          >
                            <option value="All">Semua Kelas</option>
                            {Array.from(new Set([...classList, ...students.map(s => s.class_name)])).map(cls => (
                              <option key={cls} value={cls}>{cls}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        {students.length === 0 ? (
                          <div className="text-center py-10 font-sans">
                            <Users className="w-12 h-12 text-slate-700 mx-auto mb-2 animate-pulse" />
                            <p className="text-sm font-semibold text-slate-400">Belum Ada Akun Murid</p>
                            <p className="text-xs text-slate-500 mt-1">Gunakan panel kanan untuk mengimpor daftar murid dari Excel.</p>
                          </div>
                        ) : (() => {
                          const visibleStudents = students.filter(s => {
                            const matchText = s.student_name.toLowerCase().includes(studentsSearch.toLowerCase()) ||
                              (s.nis && s.nis.toLowerCase().includes(studentsSearch.toLowerCase())) ||
                              s.class_name.toLowerCase().includes(studentsSearch.toLowerCase());
                            const matchClass = studentsClassFilter === 'All' || s.class_name === studentsClassFilter;
                            return matchText && matchClass;
                          });

                          return (
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-900/60 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  <th className="py-3 px-4 w-10 text-center">
                                    <input
                                      type="checkbox"
                                      checked={visibleStudents.length > 0 && visibleStudents.every(s => selectedStudents.has(s.id!))}
                                      onChange={() => handleSelectAllStudentsToggle(visibleStudents)}
                                      className="w-3.5 h-3.5 rounded border-slate-800 bg-slate-950 focus:ring-1 focus:ring-indigo-500 text-indigo-500 cursor-pointer"
                                    />
                                  </th>
                                  <th className="py-3 px-4 w-12 text-center">Absen</th>
                                  <th className="py-3 px-4">Nama Siswa</th>
                                  <th className="py-3 px-4 w-32">Kelas</th>
                                  <th className="py-3 px-4 w-36">Kode Unik / NIS</th>
                                  <th className="py-3 px-4 w-20 text-center">Aksi</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300 font-sans">
                                {visibleStudents.map((s, index) => (
                                  <tr key={s.id ? `student-${s.id}` : `student-idx-${index}`} className="hover:bg-slate-900/30 transition">
                                    <td className="py-2.5 px-4 text-center">
                                      <input
                                        type="checkbox"
                                        checked={selectedStudents.has(s.id!)}
                                        onChange={() => handleSelectStudentToggle(s.id!)}
                                        className="w-3.5 h-3.5 rounded border-slate-800 bg-slate-950 focus:ring-1 focus:ring-indigo-500 text-indigo-500 cursor-pointer"
                                      />
                                    </td>
                                    <td className="py-2.5 px-4 text-center font-bold text-slate-500">
                                      {s.attendance_num}
                                    </td>
                                    <td className="py-2.5 px-4 font-semibold text-white">
                                      {s.student_name}
                                    </td>
                                    <td className="py-2.5 px-4 font-semibold text-slate-300">
                                      {s.class_name}
                                    </td>
                                    <td className="py-2.5 px-4 font-mono font-bold text-cyan-400">
                                      <span className="bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded text-[11px]">
                                        {s.nis || '-'}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-4 text-center">
                                      <button
                                        onClick={() => handleDeleteStudent(s.id!)}
                                        className="text-rose-400 hover:text-rose-300 p-1.5 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                                        title="Hapus Murid"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Student Import Panel & Class Management (4 cols) */}
                  <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* Kelola Kelas Card (Tambah & Hapus Kelas) */}
                    <div className="glass-panel rounded-2xl border border-slate-800 p-6 shadow-xl font-sans">
                      <h2 className="text-lg font-bold text-white font-display flex items-center gap-2 mb-1">
                        <School className="w-5 h-5 text-pink-400" />
                        Manajemen Daftar Kelas ({classList.length})
                      </h2>
                      <p className="text-xs text-slate-400 mb-4">
                        Tambah kelas baru atau hapus kelas yang sudah tidak aktif dalam sistem.
                      </p>

                      {/* Form Tambah Kelas */}
                      <form onSubmit={handleAddClass} className="space-y-2 mb-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newClassNameInput}
                            onChange={(e) => {
                              setNewClassNameInput(e.target.value);
                              setAddClassError('');
                            }}
                            placeholder="Contoh: X MERDEKA 1"
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-pink-500 transition placeholder:text-slate-700 font-semibold"
                          />
                          <button
                            type="submit"
                            className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1 uppercase tracking-wider shrink-0 shadow-md"
                          >
                            <PlusCircle className="w-3.5 h-3.5" /> Tambah
                          </button>
                        </div>
                        {addClassError && (
                          <div className="text-[11px] text-rose-400 font-semibold">
                            ⚠️ {addClassError}
                          </div>
                        )}
                      </form>

                      {/* Daftar Badge Kelas Aktif dengan Tombol Hapus */}
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                          Daftar Kelas Aktif (Klik X untuk Hapus)
                        </span>
                        <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                          {classList.map(cls => (
                            <div key={cls} className="bg-slate-950/90 border border-slate-800 rounded-xl px-2.5 py-1 flex items-center gap-1.5 text-xs font-bold text-slate-200 hover:border-slate-700 transition">
                              <span>{cls}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteClass(cls)}
                                className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition cursor-pointer"
                                title={`Hapus kelas ${cls}`}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="glass-panel rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-white font-display flex items-center gap-2 mb-1">
                          <Upload className="w-5 h-5 text-cyan-400" />
                          Impor Akun Murid
                        </h2>
                        <p className="text-xs text-slate-400 mb-4 font-sans">
                          Unggah daftar nama murid Anda dari Excel agar murid terdaftar dan dapat login ke aplikasi.
                        </p>

                        {/* Target Class Selector */}
                        <div className="mb-4 space-y-1 font-sans">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Target Kelas (Jika di Excel Kosong)
                          </label>
                          <select
                            value={studentImportClass}
                            onChange={(e) => setStudentImportClass(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none cursor-pointer focus:border-cyan-500 transition text-xs font-semibold"
                          >
                            {classList.map(cls => (
                              <option key={cls} value={cls} className="bg-slate-950 text-white">{cls}</option>
                            ))}
                          </select>
                        </div>

                        <div className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition relative bg-slate-950/40">
                          <input
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            onChange={handleImportStudentsFile}
                            disabled={studentImportLoading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:pointer-events-none"
                          />
                          <Upload className={`w-8 h-8 text-cyan-400 mb-2 ${studentImportLoading ? 'animate-pulse' : ''}`} />
                          <span className="text-xs font-bold text-white">
                            {studentImportLoading ? 'Memproses data...' : 'Klik/seret Excel Siswa'}
                          </span>
                          <span className="text-[9px] text-slate-500 mt-1">
                            Format kolom: Nama Siswa, Kode Unik, Kelas, Nomor Absen
                          </span>
                        </div>

                        {studentImportSuccess !== null && (
                          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-sans font-semibold">
                            ✅ Berhasil mengimpor {studentImportSuccess} akun murid baru!
                          </div>
                        )}

                        {studentImportError && (
                          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-sans font-semibold">
                            ⚠️ {studentImportError}
                          </div>
                        )}
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-800/60">
                        <button
                          onClick={handleDownloadStudentsTemplate}
                          className="w-full bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                        >
                          <Copy className="w-3.5 h-3.5" /> Unduh Template Excel Siswa
                        </button>
                      </div>
                    </div>

                    {/* Tambah Murid Manual Card */}
                    <div className="glass-panel rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col justify-between font-sans">
                      <div>
                        <h2 className="text-lg font-bold text-white font-display flex items-center gap-2 mb-1">
                          <PlusCircle className="w-5 h-5 text-indigo-400" />
                          Tambah Murid Manual
                        </h2>
                        <p className="text-xs text-slate-400 mb-4">
                          Masukkan data murid secara individu untuk didaftarkan langsung ke database.
                        </p>

                        <form onSubmit={handleAddManualStudent} className="space-y-3.5 text-xs text-slate-300">
                          {/* Nama */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                              Nama Lengkap Murid
                            </label>
                            <input
                              type="text"
                              value={manualStudentName}
                              onChange={(e) => setManualStudentName(e.target.value)}
                              placeholder="Nama lengkap..."
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 transition placeholder:text-slate-800"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            {/* Kelas */}
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                Kelas
                              </label>
                              <select
                                value={manualStudentClass}
                                onChange={(e) => setManualStudentClass(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none cursor-pointer focus:border-indigo-500 transition"
                              >
                                {classList.map(cls => (
                                  <option key={cls} value={cls} className="bg-slate-950 text-white">{cls}</option>
                                ))}
                              </select>
                            </div>

                            {/* Nomor Absen */}
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                Nomor Absen
                              </label>
                              <input
                                type="text"
                                maxLength={2}
                                value={manualStudentAbsen}
                                onChange={(e) => setManualStudentAbsen(e.target.value.replace(/\D/g, ''))}
                                placeholder="01"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 transition text-center font-bold placeholder:text-slate-800"
                              />
                            </div>
                          </div>

                          {/* NIS / Kode Unik */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                              Kode Unik / NIS (Dibuat otomatis jika kosong)
                            </label>
                            <input
                              type="text"
                              value={manualStudentNis}
                              onChange={(e) => setManualStudentNis(e.target.value)}
                              placeholder="Contoh: EQ-8F2K9L atau 212210001"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 transition placeholder:text-slate-800 font-mono"
                            />
                          </div>

                          {/* Alerts */}
                          {manualStudentSuccess && (
                            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl font-bold">
                              ✓ Murid berhasil didaftarkan!
                            </div>
                          )}

                          {manualStudentError && (
                            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl font-bold">
                              ⚠️ {manualStudentError}
                            </div>
                          )}

                          <button
                            type="submit"
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/10 text-xs uppercase tracking-wider"
                          >
                            <PlusCircle className="w-4 h-4" /> Daftarkan Murid
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
