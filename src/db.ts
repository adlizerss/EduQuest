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

// Helper to get Supabase config from localStorage
export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = localStorage.getItem('eduquest_supabase_url') || (import.meta as any).env.VITE_SUPABASE_URL;
  const anonKey = localStorage.getItem('eduquest_supabase_anon_key') || (import.meta as any).env.VITE_SUPABASE_ANON_KEY;
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
  // If config changed or not cached, recreate client
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
}

initLocalStorageDB();

// Core DB operations: Abstracted for seamless fallback
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
        return (data as QuizQuestion[]).map(q => ({
          ...q,
          category: q.category || 'Umum'
        }));
      }
      // If table exists but empty, return empty array to prompt teacher to create
      return [];
    } catch (e) {
      console.warn("Supabase fetchQuizzes failed, falling back to Local Storage:", e);
    }
  }
  // Fallback
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
      console.warn("Supabase addQuiz failed, saving to Local Storage fallback:", e);
    }
  }
  // Fallback
  const localData = localStorage.getItem('eduquest_quizzes');
  const quizzes: QuizQuestion[] = localData ? JSON.parse(localData) : [];
  const newQuiz = { ...quiz, id: Date.now() };
  quizzes.push(newQuiz);
  localStorage.setItem('eduquest_quizzes', JSON.stringify(quizzes));
  return newQuiz;
}

export async function deleteQuiz(id: string | number): Promise<boolean> {
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
      console.warn("Supabase deleteQuiz failed, removing from Local Storage fallback:", e);
    }
  }
  // Fallback
  const localData = localStorage.getItem('eduquest_quizzes');
  if (localData) {
    const quizzes: QuizQuestion[] = JSON.parse(localData);
    const filtered = quizzes.filter(q => q.id !== id && String(q.id) !== String(id));
    localStorage.setItem('eduquest_quizzes', JSON.stringify(filtered));
    return true;
  }
  return false;
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
      return data as StudentResult[];
    } catch (e) {
      console.warn("Supabase fetchStudentResults failed, falling back to Local Storage:", e);
    }
  }
  // Fallback
  const localData = localStorage.getItem('eduquest_student_results');
  return localData ? JSON.parse(localData) : [];
}

export async function addStudentResult(result: StudentResult): Promise<StudentResult> {
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
      console.warn("Supabase addStudentResult failed, saving to Local Storage fallback:", e);
    }
  }
  // Fallback
  const localData = localStorage.getItem('eduquest_student_results');
  const results: StudentResult[] = localData ? JSON.parse(localData) : [];
  const newResult = { ...result, id: Date.now() };
  results.unshift(newResult); // Add to the top
  localStorage.setItem('eduquest_student_results', JSON.stringify(results));
  return newResult;
}

export async function updateCategoryName(oldName: string, newName: string): Promise<boolean> {
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
      console.warn("Supabase updateCategoryName failed, updating Local Storage fallback:", e);
    }
  }
  // Fallback
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
      return true;
    } catch (e) {
      console.error("Error parsing/updating local quizzes", e);
    }
  }
  return false;
}

export async function resetDatabaseToDefault() {
  localStorage.setItem('eduquest_quizzes', JSON.stringify(SEED_QUESTIONS));
  localStorage.setItem('eduquest_student_results', JSON.stringify([]));
  localStorage.setItem('eduquest_class_assignments', JSON.stringify([]));
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      // Clear quizzes in Supabase
      const { data: qData } = await supabase.from('quizzes').select('id');
      if (qData && qData.length > 0) {
        const { error } = await supabase.from('quizzes').delete().in('id', qData.map(d => d.id));
        if (error) throw error;
      }
      
      // Clear student results in Supabase
      const { data: rData } = await supabase.from('student_results').select('id');
      if (rData && rData.length > 0) {
        const { error } = await supabase.from('student_results').delete().in('id', rData.map(d => d.id));
        if (error) throw error;
      }

      // Clear class assignments in Supabase
      const { data: cData } = await supabase.from('class_assignments').select('id');
      if (cData && cData.length > 0) {
        const { error } = await supabase.from('class_assignments').delete().in('id', cData.map(d => d.id));
        if (error) throw error;
      }

      // Re-seed default questions in Supabase
      const { error: seedError } = await supabase.from('quizzes').insert(SEED_QUESTIONS);
      if (seedError) throw seedError;
    } catch (e) {
      console.warn("Gagal mereset database Supabase:", e);
      throw e;
    }
  }
}

export async function updateQuizCategory(id: string | number, newCategory: string): Promise<boolean> {
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
      console.warn("Supabase updateQuizCategory failed, falling back to Local Storage:", e);
    }
  }
  // Fallback
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
      return true;
    } catch (e) {
      console.error("Error parsing local quizzes", e);
    }
  }
  return false;
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
      return data as StudentAccount[];
    } catch (e) {
      console.warn("Supabase fetchStudents failed, falling back to Local Storage:", e);
    }
  }
  const localData = localStorage.getItem('eduquest_students');
  return localData ? JSON.parse(localData) : [];
}

export async function addStudent(student: StudentAccount): Promise<StudentAccount> {
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
      console.warn("Supabase addStudent failed, saving to Local Storage fallback:", e);
    }
  }
  const localData = localStorage.getItem('eduquest_students');
  const students: StudentAccount[] = localData ? JSON.parse(localData) : [];
  const newStudent = { ...student, id: Date.now() };
  students.push(newStudent);
  localStorage.setItem('eduquest_students', JSON.stringify(students));
  return newStudent;
}

export async function deleteStudent(id: string | number): Promise<boolean> {
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
      console.warn("Supabase deleteStudent failed, removing from Local Storage fallback:", e);
    }
  }
  const localData = localStorage.getItem('eduquest_students');
  if (localData) {
    const students: StudentAccount[] = JSON.parse(localData);
    const filtered = students.filter(s => s.id !== id && String(s.id) !== String(id));
    localStorage.setItem('eduquest_students', JSON.stringify(filtered));
    return true;
  }
  return false;
}

export async function fetchClassAssignments(): Promise<ClassAssignment[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('class_assignments')
        .select('*');
      if (error) throw error;
      return data as ClassAssignment[];
    } catch (e) {
      console.warn("Supabase fetchClassAssignments failed, falling back to Local Storage:", e);
    }
  }
  const localData = localStorage.getItem('eduquest_class_assignments');
  return localData ? JSON.parse(localData) : [];
}

export async function assignQuizToClass(className: string, category: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const assignment: ClassAssignment = {
    class_name: className,
    category: category,
    assigned_at: new Date().toISOString()
  };

  if (supabase) {
    try {
      const { error } = await supabase
        .from('class_assignments')
        .upsert([assignment], { onConflict: 'class_name' });
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn("Supabase assignQuizToClass failed, saving to Local Storage fallback:", e);
    }
  }

  // Local Storage fallback
  const localData = localStorage.getItem('eduquest_class_assignments');
  let assignments: ClassAssignment[] = localData ? JSON.parse(localData) : [];
  const idx = assignments.findIndex(a => a.class_name.toLowerCase() === className.toLowerCase());
  if (idx !== -1) {
    assignments[idx] = { ...assignments[idx], category, assigned_at: new Date().toISOString() };
  } else {
    assignments.push({ ...assignment, id: Date.now() });
  }
  localStorage.setItem('eduquest_class_assignments', JSON.stringify(assignments));
  return true;
}

export async function removeClassAssignment(className: string): Promise<boolean> {
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
      console.warn("Supabase removeClassAssignment failed, removing from Local Storage fallback:", e);
    }
  }

  // Local Storage fallback
  const localData = localStorage.getItem('eduquest_class_assignments');
  if (localData) {
    const assignments: ClassAssignment[] = JSON.parse(localData);
    const filtered = assignments.filter(a => a.class_name.toLowerCase() !== className.toLowerCase());
    localStorage.setItem('eduquest_class_assignments', JSON.stringify(filtered));
    return true;
  }
  return false;
}
