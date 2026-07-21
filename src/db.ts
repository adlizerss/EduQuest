import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { QuizQuestion, StudentResult, StudentAccount, ClassAssignment } from './types';

// Pre-seeded high-quality general questions
const SEED_QUESTIONS: QuizQuestion[] = [
  {
    question: "Dalam metode ilmiah, setelah kita mengamati suatu fenomena atau masalah, langkah logis berikutnya yang paling tepat dilakukan adalah...",
    option_a: "Menarik kesimpulan final tanpa melakukan eksperimen atau pengumpulan data tambahan",
    option_b: "Menyusun hipotesis (dugaan sementara) yang masuk akal dan dapat diuji kebenarannya",
    option_c: "Menulis laporan ilmiah lengkap untuk langsung diterbitkan di jurnal pendidikan",
    option_d: "Mengabaikan fenomena tersebut jika hasilnya nanti diperkirakan tidak sesuai teori lama",
    correct_answer: "B",
    type: "cognitive",
    category: "Sains & Logika"
  },
  {
    question: "Saat bekerja dalam tim untuk membuat proyek pameran atau presentasi kelompok, peran apa yang paling nyaman Anda lakukan?",
    option_a: "Menjadi konseptor ide, menyusun rencana alur kerja, dan melakukan analisis awal (Planner)",
    option_b: "Menjadi praktisi teknis yang merakit alat, merapikan karya, atau memproses materi pengerjaan (Creator)",
    option_c: "Menjadi presenter utama yang menyampaikan gagasan di depan publik dengan percaya diri (Communicator)",
    option_d: "Menjadi koordinator kelompok yang memantau waktu, membagi tugas, dan menjaga disiplin tim (Coordinator)",
    correct_answer: "A",
    type: "interest",
    category: "Eksplorasi Karakter"
  },
  {
    question: "Berikut ini yang merupakan ciri utama dari sebuah argumen logis yang valid, kuat, dan tepercaya adalah...",
    option_a: "Menggunakan istilah ilmiah yang rumit dan panjang agar terlihat meyakinkan",
    option_b: "Didukung oleh fakta objektif, bukti data yang sahih, serta penalaran yang konsisten",
    option_c: "Berdasarkan kepada opini pribadi atau kepercayaan mayoritas semata tanpa bukti ilmiah",
    option_d: "Disampaikan dengan gaya bicara agresif agar lawan diskusi segera setuju",
    correct_answer: "B",
    type: "cognitive",
    category: "Sains & Logika"
  },
  {
    question: "Manakah di bawah ini yang merupakan contoh pemanfaatan sumber daya alam secara bijaksana dan berkelanjutan?",
    option_a: "Melakukan penebangan pohon di hutan lindung secara massal demi industri kayu lapis",
    option_b: "Menggunakan panel surya sebagai alternatif pembangkit energi ramah lingkungan",
    option_c: "Membuka lahan pertambangan mineral baru di dekat kawasan pemukiman warga",
    option_d: "Membakar sisa sampah rumah tangga secara terbuka di pekarangan pemukiman padat",
    correct_answer: "B",
    type: "cognitive",
    category: "Lingkungan & Alam"
  },
  {
    question: "Saat Anda diminta untuk melakukan presentasi di depan kelas, bagian manakah yang paling Anda sukai?",
    option_a: "Merancang kerangka materi, meriset data pendukung, dan membuat outline presentasi",
    option_b: "Membuat slide presentasi yang estetik, menambahkan gambar pendukung, dan merapikan visual",
    option_c: "Berdiri di depan berbicara langsung kepada audiens dan menjawab pertanyaan sulit mereka",
    option_d: "Mengatur pembagian giliran bicara anggota tim agar presentasi berjalan tepat waktu",
    correct_answer: "C",
    type: "interest",
    category: "Eksplorasi Karakter"
  },
  {
    question: "Jika dalam menyelesaikan sebuah soal kuis atau tugas kelompok Anda mengalami kegagalan, bagaimana cara Anda menyikapinya?",
    option_a: "Menganalisis kesalahan data kognitif, meriset strategi belajar baru, dan menyusun peta konsep (Strategic Planner)",
    option_b: "Segera mencoba memodifikasi hasil praktik, membongkar kesalahan teknis, dan memperbaiki alat (Creator / Maker)",
    option_c: "Melatih cara mengomunikasikan materi, berdiskusi dengan guru, dan memperbaiki teknik penjelasan (Communicator)",
    option_d: "Mengevaluasi pembagian peran tim agar kerja sama berikutnya menjadi lebih solid dan disiplin (Operations Coordinator)",
    correct_answer: "D",
    type: "interest",
    category: "Eksplorasi Karakter"
  }
];

const DEFAULT_CLASSES = [
  'X MIPA 1', 'X MIPA 2', 'X IPS 1', 'X IPS 2',
  'XI MIPA 1', 'XI MIPA 2', 'XI IPS 1', 'XI IPS 2',
  'XII MIPA 1', 'XII MIPA 2', 'XII IPS 1', 'XII IPS 2',
];

const HARDCODED_SUPABASE_URL = "https://dvagyvlkshwpqvbcxwjx.supabase.co";
const HARDCODED_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2YWd5dmxrc2h3cHF2YmN4d2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NjcxMzMsImV4cCI6MjA5MzQ0MzEzM30.iuczKpFeYEW6uuzshXLzSm3VYEdr7P0kZHmZwdkvtFY";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = localStorage.getItem('eduquest_supabase_url') 
    || (import.meta as any).env.VITE_SUPABASE_URL 
    || (import.meta as any).env.SUPABASE_URL 
    || (import.meta as any).env.NEXT_PUBLIC_SUPABASE_URL 
    || HARDCODED_SUPABASE_URL;

  const anonKey = localStorage.getItem('eduquest_supabase_anon_key') 
    || (import.meta as any).env.VITE_SUPABASE_ANON_KEY 
    || (import.meta as any).env.SUPABASE_ANON_KEY 
    || (import.meta as any).env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
    || HARDCODED_SUPABASE_ANON_KEY;

  if (url && anonKey) {
    return { url, anonKey };
  }
  return null;
}

export function saveSupabaseConfig(url: string, anonKey: string) {
  localStorage.setItem('eduquest_supabase_url', url);
  localStorage.setItem('eduquest_supabase_anon_key', anonKey);
}

export function clearSupabaseConfig() {
  localStorage.removeItem('eduquest_supabase_url');
  localStorage.removeItem('eduquest_supabase_anon_key');
}

// Lazy-loaded Supabase Client
let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config) {
    cachedClient = null;
    return null;
  }
  if (!cachedClient) {
    try {
      cachedClient = createClient(config.url, config.anonKey);
    } catch (e) {
      console.error("Gagal menginisialisasi client Supabase:", e);
      return null;
    }
  }
  return cachedClient;
}

/**
 * Supabase Authentication for Teacher / Admin Login
 */
export async function signInTeacher(emailOrUsername: string, password: string): Promise<{
  success: boolean;
  error?: string;
  session?: any;
  user?: any;
}> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { 
      success: false, 
      error: 'Supabase client belum terhubung. Periksa konfigurasi URL & Anon Key.' 
    };
  }

  const rawInput = emailOrUsername.trim();
  const rawPass = password.trim();

  // Primary attempt: try entered string directly as email
  const attempts = [rawInput];

  // Secondary attempt: if no '@', try appending '@eduquest.com'
  if (!rawInput.includes('@')) {
    attempts.push(`${rawInput}@eduquest.com`);
  }

  let lastErrorMsg = '';

  for (const emailTarget of attempts) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailTarget,
        password: rawPass
      });

      if (!error && data.session) {
        localStorage.setItem('eduquest_admin_authenticated', 'true');
        return { success: true, session: data.session, user: data.user };
      }

      if (error) {
        lastErrorMsg = error.message;
      }
    } catch (e: any) {
      lastErrorMsg = e.message || 'Gagal terhubung ke Supabase Auth.';
    }
  }

  let userFriendlyError = lastErrorMsg;
  if (lastErrorMsg.includes('Invalid login credentials')) {
    userFriendlyError = 'Email / Username atau Password salah. Periksa kembali akun di Console Supabase Authentication.';
  } else if (lastErrorMsg.includes('Email not confirmed')) {
    userFriendlyError = 'Email belum dikonfirmasi. Buka Supabase Console ➔ Authentication ➔ Users ➔ klik user ➔ Confirm Email.';
  }

  return { success: false, error: userFriendlyError };
}

export async function signOutTeacher(): Promise<boolean> {
  localStorage.removeItem('eduquest_admin_authenticated');
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.auth.signOut();
      return true;
    } catch (e) {
      console.warn("Supabase signOut error:", e);
    }
  }
  return true;
}

export async function getCurrentTeacherSession() {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session;
    } catch (e) {
      console.warn("Failed to get teacher session:", e);
    }
  }
  return null;
}

// Ensure local storage tables are initialized
function initLocalStorageDB() {
  if (!localStorage.getItem('eduquest_quizzes')) {
    localStorage.setItem('eduquest_quizzes', JSON.stringify(SEED_QUESTIONS));
  }
  if (!localStorage.getItem('eduquest_student_results')) {
    localStorage.setItem('eduquest_student_results', JSON.stringify([]));
  }
  if (!localStorage.getItem('eduquest_students')) {
    localStorage.setItem('eduquest_students', JSON.stringify([]));
  }
  if (!localStorage.getItem('eduquest_class_assignments')) {
    localStorage.setItem('eduquest_class_assignments', JSON.stringify([]));
  }
  if (!localStorage.getItem('eduquest_class_list')) {
    localStorage.setItem('eduquest_class_list', JSON.stringify(DEFAULT_CLASSES));
  }
}

initLocalStorageDB();

/**
 * Bi-directional non-destructive data synchronization between Local Storage & Supabase.
 * Merges missing records across all 5 tables (Classes, Students, Quizzes, Results, Assignments).
 */
export async function syncLocalDataToSupabase(): Promise<{
  syncedClasses: number;
  syncedStudents: number;
  syncedQuizzes: number;
  syncedResults: number;
  syncedAssignments: number;
  success: boolean;
}> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { syncedClasses: 0, syncedStudents: 0, syncedQuizzes: 0, syncedResults: 0, syncedAssignments: 0, success: false };
  }

  let syncedClasses = 0;
  let syncedStudents = 0;
  let syncedQuizzes = 0;
  let syncedResults = 0;
  let syncedAssignments = 0;

  try {
    // 1. SYNC CLASSES
    try {
      const { data: sbClasses } = await supabase.from('classes').select('class_name');
      const localClassesRaw = localStorage.getItem('eduquest_class_list');
      const localClasses: string[] = localClassesRaw ? JSON.parse(localClassesRaw) : DEFAULT_CLASSES;

      const sbClassSet = new Set((sbClasses || []).map(c => c.class_name.toLowerCase().trim()));
      const newClassesToSb: any[] = [];

      localClasses.forEach(c => {
        const key = c.toLowerCase().trim();
        if (!sbClassSet.has(key)) {
          newClassesToSb.push({ class_name: c });
          sbClassSet.add(key);
        }
      });

      if (newClassesToSb.length > 0) {
        await supabase.from('classes').insert(newClassesToSb);
        syncedClasses = newClassesToSb.length;
      }

      const { data: updatedSbClasses } = await supabase.from('classes').select('class_name').order('class_name', { ascending: true });
      if (updatedSbClasses && updatedSbClasses.length > 0) {
        localStorage.setItem('eduquest_class_list', JSON.stringify(updatedSbClasses.map(c => c.class_name)));
      }
    } catch (e) {
      console.warn("Sync classes warning:", e);
    }

    // 2. SYNC STUDENTS
    const { data: sbStudents } = await supabase.from('students').select('*');
    const localStudentsRaw = localStorage.getItem('eduquest_students');
    const localStudents: StudentAccount[] = localStudentsRaw ? JSON.parse(localStudentsRaw) : [];
    
    const sbStudentMap = new Map<string, StudentAccount>();
    (sbStudents || []).forEach(s => {
      const key = (s.nis || `${s.student_name}_${s.class_name}`).toLowerCase().trim();
      sbStudentMap.set(key, s);
    });

    const newStudentsToSb: any[] = [];
    localStudents.forEach(ls => {
      const key = (ls.nis || `${ls.student_name}_${ls.class_name}`).toLowerCase().trim();
      if (!sbStudentMap.has(key)) {
        const { id, ...rest } = ls as any;
        newStudentsToSb.push(rest);
        sbStudentMap.set(key, ls);
      }
    });

    if (newStudentsToSb.length > 0) {
      const { error: insertErr } = await supabase.from('students').insert(newStudentsToSb);
      if (!insertErr) {
        syncedStudents = newStudentsToSb.length;
      }
    }

    const { data: updatedSbStudents } = await supabase.from('students').select('*').order('student_name', { ascending: true });
    if (updatedSbStudents && updatedSbStudents.length > 0) {
      localStorage.setItem('eduquest_students', JSON.stringify(updatedSbStudents));
    }

    // 3. SYNC QUIZZES
    const { data: sbQuizzes } = await supabase.from('quizzes').select('*');
    const localQuizzesRaw = localStorage.getItem('eduquest_quizzes');
    const localQuizzes: QuizQuestion[] = localQuizzesRaw ? JSON.parse(localQuizzesRaw) : [];

    const sbQuizSet = new Set((sbQuizzes || []).map(q => q.question.toLowerCase().trim()));
    const newQuizzesToSb: any[] = [];

    localQuizzes.forEach(lq => {
      const key = lq.question.toLowerCase().trim();
      if (!sbQuizSet.has(key)) {
        const { id, ...rest } = lq as any;
        newQuizzesToSb.push(rest);
        sbQuizSet.add(key);
      }
    });

    if (newQuizzesToSb.length > 0) {
      const { error: qInsertErr } = await supabase.from('quizzes').insert(newQuizzesToSb);
      if (!qInsertErr) {
        syncedQuizzes = newQuizzesToSb.length;
      }
    }

    const { data: updatedSbQuizzes } = await supabase.from('quizzes').select('*').order('id', { ascending: true });
    if (updatedSbQuizzes && updatedSbQuizzes.length > 0) {
      localStorage.setItem('eduquest_quizzes', JSON.stringify(updatedSbQuizzes));
    }

    // 4. SYNC STUDENT RESULTS
    const { data: sbResults } = await supabase.from('student_results').select('*');
    const localResultsRaw = localStorage.getItem('eduquest_student_results');
    const localResults: StudentResult[] = localResultsRaw ? JSON.parse(localResultsRaw) : [];

    const sbResultMap = new Map<string, StudentResult>();
    (sbResults || []).forEach(r => {
      const key = `${r.student_name}_${r.submit_at}`.toLowerCase().trim();
      sbResultMap.set(key, r);
    });

    const newResultsToSb: any[] = [];
    localResults.forEach(lr => {
      const key = `${lr.student_name}_${lr.submit_at}`.toLowerCase().trim();
      if (!sbResultMap.has(key)) {
        const { id, ...rest } = lr as any;
        newResultsToSb.push(rest);
        sbResultMap.set(key, lr);
      }
    });

    if (newResultsToSb.length > 0) {
      const { error: rInsertErr } = await supabase.from('student_results').insert(newResultsToSb);
      if (!rInsertErr) {
        syncedResults = newResultsToSb.length;
      }
    }

    const { data: updatedSbResults } = await supabase.from('student_results').select('*').order('id', { ascending: false });
    if (updatedSbResults && updatedSbResults.length > 0) {
      localStorage.setItem('eduquest_student_results', JSON.stringify(updatedSbResults));
    }

    // 5. SYNC CLASS ASSIGNMENTS
    const { data: sbAssignments } = await supabase.from('class_assignments').select('*');
    const localAssignmentsRaw = localStorage.getItem('eduquest_class_assignments');
    const localAssignments: ClassAssignment[] = localAssignmentsRaw ? JSON.parse(localAssignmentsRaw) : [];

    const sbAssignmentMap = new Map<string, ClassAssignment>();
    (sbAssignments || []).forEach(a => {
      sbAssignmentMap.set(a.class_name.toLowerCase().trim(), a);
    });

    const newAssignmentsToSb: any[] = [];
    localAssignments.forEach(la => {
      const key = la.class_name.toLowerCase().trim();
      if (!sbAssignmentMap.has(key)) {
        const { id, ...rest } = la as any;
        newAssignmentsToSb.push(rest);
        sbAssignmentMap.set(key, la);
      }
    });

    if (newAssignmentsToSb.length > 0) {
      await supabase.from('class_assignments').upsert(newAssignmentsToSb, { onConflict: 'class_name' });
      syncedAssignments = newAssignmentsToSb.length;
    }

    const { data: updatedSbAssignments } = await supabase.from('class_assignments').select('*');
    if (updatedSbAssignments && updatedSbAssignments.length > 0) {
      localStorage.setItem('eduquest_class_assignments', JSON.stringify(updatedSbAssignments));
    }

    return {
      syncedClasses,
      syncedStudents,
      syncedQuizzes,
      syncedResults,
      syncedAssignments,
      success: true
    };
  } catch (e) {
    console.error("Gagal melakukan sinkronisasi dua arah Supabase:", e);
    return { syncedClasses: 0, syncedStudents, syncedQuizzes, syncedResults, syncedAssignments, success: false };
  }
}

// Dynamic Classes Supabase CRUD
export async function fetchClasses(): Promise<string[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('class_name')
        .order('class_name', { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) {
        const classNames = data.map(c => c.class_name);
        localStorage.setItem('eduquest_class_list', JSON.stringify(classNames));
        return classNames;
      }
    } catch (e) {
      console.warn("Supabase fetchClasses failed, falling back to Local Storage:", e);
    }
  }
  const localData = localStorage.getItem('eduquest_class_list');
  return localData ? JSON.parse(localData) : DEFAULT_CLASSES;
}

export async function addClassToDb(className: string): Promise<boolean> {
  const trimmed = className.trim();
  if (!trimmed) return false;

  const localData = localStorage.getItem('eduquest_class_list');
  const currentList: string[] = localData ? JSON.parse(localData) : DEFAULT_CLASSES;
  if (!currentList.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
    currentList.push(trimmed);
    localStorage.setItem('eduquest_class_list', JSON.stringify(currentList));
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('classes')
        .insert([{ class_name: trimmed }]);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn("Supabase addClassToDb failed, saved to Local Storage fallback:", e);
    }
  }
  return true;
}

export async function deleteClassFromDb(className: string): Promise<boolean> {
  const localData = localStorage.getItem('eduquest_class_list');
  if (localData) {
    const currentList: string[] = JSON.parse(localData);
    const filtered = currentList.filter(c => c.toLowerCase() !== className.toLowerCase());
    localStorage.setItem('eduquest_class_list', JSON.stringify(filtered));
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('class_name', className);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn("Supabase deleteClassFromDb failed:", e);
    }
  }
  return true;
}

// Core DB operations: Dual-Write Strategy
export async function fetchQuizzes(): Promise<QuizQuestion[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('id', { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) {
        const quizzes = (data as QuizQuestion[]).map(q => ({
          ...q,
          category: q.category || 'Umum'
        }));
        localStorage.setItem('eduquest_quizzes', JSON.stringify(quizzes));
        return quizzes;
      }
    } catch (e) {
      console.warn("Supabase fetchQuizzes failed, falling back to Local Storage:", e);
    }
  }
  const localData = localStorage.getItem('eduquest_quizzes');
  if (localData) {
    try {
      const parsed = JSON.parse(localData) as QuizQuestion[];
      return parsed.map(q => ({
        ...q,
        category: q.category || 'Umum'
      }));
    } catch (e) {
      console.error("Error parsing local quizzes", e);
    }
  }
  return [];
}

export async function addQuiz(quiz: QuizQuestion): Promise<QuizQuestion> {
  const localData = localStorage.getItem('eduquest_quizzes');
  const quizzes: QuizQuestion[] = localData ? JSON.parse(localData) : [];
  const newQuiz = { ...quiz, id: Date.now() };
  quizzes.push(newQuiz);
  localStorage.setItem('eduquest_quizzes', JSON.stringify(quizzes));

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .insert([quiz])
        .select()
        .single();
      if (error) throw error;
      return data as QuizQuestion;
    } catch (e) {
      console.warn("Supabase addQuiz failed, saved to Local Storage fallback:", e);
    }
  }
  return newQuiz;
}

export async function deleteQuiz(id: string | number): Promise<boolean> {
  const localData = localStorage.getItem('eduquest_quizzes');
  if (localData) {
    const quizzes: QuizQuestion[] = JSON.parse(localData);
    const filtered = quizzes.filter(q => q.id !== id && String(q.id) !== String(id));
    localStorage.setItem('eduquest_quizzes', JSON.stringify(filtered));
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn("Supabase deleteQuiz failed:", e);
    }
  }
  return true;
}

export async function fetchStudentResults(): Promise<StudentResult[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('student_results')
        .select('*')
        .order('id', { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) {
        localStorage.setItem('eduquest_student_results', JSON.stringify(data));
        return data as StudentResult[];
      }
    } catch (e) {
      console.warn("Supabase fetchStudentResults failed, falling back to Local Storage:", e);
    }
  }
  const localData = localStorage.getItem('eduquest_student_results');
  return localData ? JSON.parse(localData) : [];
}

export async function addStudentResult(result: StudentResult): Promise<StudentResult> {
  const localData = localStorage.getItem('eduquest_student_results');
  const results: StudentResult[] = localData ? JSON.parse(localData) : [];
  const newResult = { ...result, id: Date.now() };
  results.unshift(newResult);
  localStorage.setItem('eduquest_student_results', JSON.stringify(results));

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('student_results')
        .insert([result])
        .select()
        .single();
      if (error) throw error;
      return data as StudentResult;
    } catch (e) {
      console.warn("Supabase addStudentResult failed, saved to Local Storage fallback:", e);
    }
  }
  return newResult;
}

export async function deleteStudentResult(id: string | number): Promise<boolean> {
  const localData = localStorage.getItem('eduquest_student_results');
  if (localData) {
    const results: StudentResult[] = JSON.parse(localData);
    const filtered = results.filter(r => r.id !== id && String(r.id) !== String(id));
    localStorage.setItem('eduquest_student_results', JSON.stringify(filtered));
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('student_results')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn("Supabase deleteStudentResult failed:", e);
    }
  }
  return true;
}

export async function deleteAllStudentResults(): Promise<boolean> {
  localStorage.setItem('eduquest_student_results', JSON.stringify([]));

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data } = await supabase.from('student_results').select('id');
      if (data && data.length > 0) {
        await supabase.from('student_results').delete().in('id', data.map(d => d.id));
      }
      return true;
    } catch (e) {
      console.warn("Supabase deleteAllStudentResults failed:", e);
    }
  }
  return true;
}

export async function updateCategoryName(oldName: string, newName: string): Promise<boolean> {
  const localData = localStorage.getItem('eduquest_quizzes');
  if (localData) {
    try {
      const quizzes: QuizQuestion[] = JSON.parse(localData);
      const updated = quizzes.map(q => {
        if ((q.category || 'Umum') === oldName) {
          return { ...q, category: newName };
        }
        return q;
      });
      localStorage.setItem('eduquest_quizzes', JSON.stringify(updated));
    } catch (e) {
      console.error("Error parsing/updating local quizzes", e);
    }
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('quizzes')
        .update({ category: newName })
        .eq('category', oldName);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn("Supabase updateCategoryName failed:", e);
    }
  }
  return true;
}

export async function resetDatabaseToDefault() {
  localStorage.setItem('eduquest_quizzes', JSON.stringify(SEED_QUESTIONS));
  localStorage.setItem('eduquest_student_results', JSON.stringify([]));
  localStorage.setItem('eduquest_class_assignments', JSON.stringify([]));
  localStorage.setItem('eduquest_class_list', JSON.stringify(DEFAULT_CLASSES));
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: cData } = await supabase.from('classes').select('id');
      if (cData && cData.length > 0) {
        await supabase.from('classes').delete().in('id', cData.map(d => d.id));
      }

      const { data: qData } = await supabase.from('quizzes').select('id');
      if (qData && qData.length > 0) {
        await supabase.from('quizzes').delete().in('id', qData.map(d => d.id));
      }
      
      const { data: rData } = await supabase.from('student_results').select('id');
      if (rData && rData.length > 0) {
        await supabase.from('student_results').delete().in('id', rData.map(d => d.id));
      }

      const { data: caData } = await supabase.from('class_assignments').select('id');
      if (caData && caData.length > 0) {
        await supabase.from('class_assignments').delete().in('id', caData.map(d => d.id));
      }

      await supabase.from('quizzes').insert(SEED_QUESTIONS);
      await supabase.from('classes').insert(DEFAULT_CLASSES.map(c => ({ class_name: c })));
    } catch (e) {
      console.warn("Gagal mereset database Supabase:", e);
      throw e;
    }
  }
}

export async function updateQuizCategory(id: string | number, newCategory: string): Promise<boolean> {
  const localData = localStorage.getItem('eduquest_quizzes');
  if (localData) {
    try {
      const quizzes: QuizQuestion[] = JSON.parse(localData);
      const updated = quizzes.map(q => {
        if (q.id === id || String(q.id) === String(id)) {
          return { ...q, category: newCategory };
        }
        return q;
      });
      localStorage.setItem('eduquest_quizzes', JSON.stringify(updated));
    } catch (e) {
      console.error("Error parsing local quizzes", e);
    }
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('quizzes')
        .update({ category: newCategory })
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn("Supabase updateQuizCategory failed:", e);
    }
  }
  return true;
}

export async function fetchStudents(): Promise<StudentAccount[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('student_name', { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) {
        localStorage.setItem('eduquest_students', JSON.stringify(data));
        return data as StudentAccount[];
      }
    } catch (e) {
      console.warn("Supabase fetchStudents failed, falling back to Local Storage:", e);
    }
  }
  const localData = localStorage.getItem('eduquest_students');
  return localData ? JSON.parse(localData) : [];
}

export async function addStudent(student: StudentAccount): Promise<StudentAccount> {
  const localData = localStorage.getItem('eduquest_students');
  const students: StudentAccount[] = localData ? JSON.parse(localData) : [];
  const newStudent = { ...student, id: Date.now() };
  students.push(newStudent);
  localStorage.setItem('eduquest_students', JSON.stringify(students));

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('students')
        .insert([student])
        .select()
        .single();
      if (error) throw error;
      return data as StudentAccount;
    } catch (e) {
      console.warn("Supabase addStudent failed, saved to Local Storage fallback:", e);
    }
  }
  return newStudent;
}

export async function deleteStudent(id: string | number): Promise<boolean> {
  const localData = localStorage.getItem('eduquest_students');
  if (localData) {
    const students: StudentAccount[] = JSON.parse(localData);
    const filtered = students.filter(s => s.id !== id && String(s.id) !== String(id));
    localStorage.setItem('eduquest_students', JSON.stringify(filtered));
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn("Supabase deleteStudent failed:", e);
    }
  }
  return true;
}

export async function fetchClassAssignments(): Promise<ClassAssignment[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('class_assignments')
        .select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        localStorage.setItem('eduquest_class_assignments', JSON.stringify(data));
        return data as ClassAssignment[];
      }
    } catch (e) {
      console.warn("Supabase fetchClassAssignments failed, falling back to Local Storage:", e);
    }
  }
  const localData = localStorage.getItem('eduquest_class_assignments');
  return localData ? JSON.parse(localData) : [];
}

export async function assignQuizToClass(className: string, category: string): Promise<boolean> {
  const assignment: ClassAssignment = {
    class_name: className,
    category: category,
    assigned_at: new Date().toISOString()
  };

  const localData = localStorage.getItem('eduquest_class_assignments');
  let assignments: ClassAssignment[] = localData ? JSON.parse(localData) : [];
  const idx = assignments.findIndex(a => a.class_name.toLowerCase() === className.toLowerCase());
  if (idx !== -1) {
    assignments[idx] = { ...assignments[idx], category, assigned_at: new Date().toISOString() };
  } else {
    assignments.push({ ...assignment, id: Date.now() });
  }
  localStorage.setItem('eduquest_class_assignments', JSON.stringify(assignments));

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('class_assignments')
        .upsert([assignment], { onConflict: 'class_name' });
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn("Supabase assignQuizToClass failed, saved to Local Storage fallback:", e);
    }
  }

  return true;
}

export async function removeClassAssignment(className: string): Promise<boolean> {
  const localData = localStorage.getItem('eduquest_class_assignments');
  if (localData) {
    const assignments: ClassAssignment[] = JSON.parse(localData);
    const filtered = assignments.filter(a => a.class_name.toLowerCase() !== className.toLowerCase());
    localStorage.setItem('eduquest_class_assignments', JSON.stringify(filtered));
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('class_assignments')
        .delete()
        .eq('class_name', className);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn("Supabase removeClassAssignment failed:", e);
    }
  }

  return true;
}
