export type QuestionType = 'cognitive' | 'interest';

export interface QuizQuestion {
  id?: string | number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  type: QuestionType;
  category?: string;
}

export interface StudentResult {
  id?: string | number;
  student_name: string;
  class_name: string;
  score: number;
  remaining_hp: number;
  role: string; // The selected PKWU role/interest (e.g. 'Planner', 'Producer', 'Marketer')
  submit_at: string;
}

export interface RPGState {
  hp: number;
  mp: number;
  shieldActive: boolean;
  score: number;
  currentQuestionIndex: number;
  selectedAnswer: 'A' | 'B' | 'C' | 'D' | null;
  isAnswered: boolean;
  eliminatedOptions: ('A' | 'B' | 'C' | 'D')[];
}

export interface StudentAccount {
  id?: string | number;
  nis?: string;
  student_name: string;
  class_name: string;
  attendance_num: string;
}

export interface ClassAssignment {
  id?: string | number;
  class_name: string;
  category: string;
  assigned_at?: string;
}
