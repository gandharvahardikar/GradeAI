
export interface QuestionGrade {
  questionNumber: string;
  maxMarks: number;
  obtainedMarks: number;
  remarks: string;
}

export interface AssessmentResult {
  extractedText: string;
  similarityScore: number;
  mlScore: number;
  mlScoreDetails: {
    correctness: number;
    completeness: number;
    clarity: number;
  };
  questionGrades: QuestionGrade[];
  feedback: string;
  keyConceptsFound: string[];
  missedConcepts: string[];
}

export enum PipelineStep {
  UPLOAD = 'UPLOAD',
  PREPROCESSING = 'PREPROCESSING',
  OCR = 'OCR',
  TEXT_PROCESSING = 'TEXT_PROCESSING',
  SIMILARITY = 'SIMILARITY',
  ML_SCORING = 'ML_SCORING',
  REPORT = 'REPORT',
  ERROR = 'ERROR'
}

export interface PipelineLog {
  id: string;
  step: PipelineStep;
  message: string;
  status: 'pending' | 'active' | 'completed';
}

export type UserRole = 'teacher' | 'student';

export type Subject = string;

export interface Submission {
  id: string;
  studentName: string;
  subject: Subject;
  score: number;
  timestamp: Date;
  result: AssessmentResult;
}

export interface AttachedFile {
  id: string;
  name: string;
  mimeType: string;
  data?: string; // base64
  url?: string; // firebase storage url
}

export interface SubjectConfig {
  modelAnswerType: 'text' | 'file';
  modelAnswerText: string;
  modelAnswerFiles: AttachedFile[];
  questionPaperFiles: AttachedFile[];
}

export interface SubjectConfigs {
  [key: string]: SubjectConfig;
}

export interface StudentDashboardProps {
  currentSubject: Subject;
  onSubjectChange: (subject: Subject) => void;
  config: SubjectConfig;
  onSubmissionComplete: (submission: Submission) => void;
  onLogout: () => void;
  submissions: Submission[];
  studentName: string;
  availableSubjects: string[];
}
