export type QuestionType = 'multiple-choice' | 'essay';

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options: string[]; // Kept as required array for simplicity, ignored for essays
  correctAnswerIndex: number; // Ignored for essays
  explanation?: string;
  sampleAnswer?: string; // New: Helps AI grade the essay
  imageUrl?: string; // New: Optional image for the question
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  questions: Question[];
  createdAt: number;
  author: string; // User Name or ID
  authorId?: string; // Explicit User ID
  deletedAt?: string; // ISO date string for soft delete
  isPublic?: boolean; // If true, visible in public library
  shortCode?: string; // Short unique code for sharing
}

export interface EssayGrade {
  score: number; // 0 to 100
  feedback: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId?: string; // New: ID of the taker
  userName?: string; // New: Name of the taker
  answers: Record<string, any>; // questionId -> optionIndex (number) or text (string)
  score: number; // 0-100
  essayGrades?: Record<string, EssayGrade>;
  timestamp: number;
  status: 'completed' | 'pending-grading';
}

export interface User {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  bio?: string;
  notifications?: {
    email: boolean;
    push: boolean;
    activitySummary: boolean;
  };
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    language: 'vi' | 'en';
  };
}

export enum ViewState {
  HOME = 'HOME',
  CREATE = 'CREATE',
  TAKE = 'TAKE',
  RESULT = 'RESULT'
}