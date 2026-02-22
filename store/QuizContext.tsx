import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  setDoc, 
  doc, 
  updateDoc, 
  getDoc,
  getDocs,
  deleteDoc,
  deleteField
} from "firebase/firestore";
import { db } from '../services/firebase';
import { Quiz, QuizAttempt } from '../types';
import { useAuth } from './AuthContext';

interface QuizContextType {
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  addQuiz: (quiz: Quiz) => Promise<void>;
  editQuiz: (quiz: Quiz) => Promise<void>;
  deleteQuiz: (id: string) => Promise<void>; // Soft delete
  restoreQuiz: (id: string) => Promise<void>; // Restore
  permanentDeleteQuiz: (id: string) => Promise<void>; // Hard delete
  deleteAllQuizzesByAuthor: (authorId: string) => Promise<void>;
  togglePublishQuiz: (id: string, isPublic: boolean) => Promise<void>;
  getPublicQuizzes: () => Promise<Quiz[]>;
  importQuiz: (quiz: Quiz) => Promise<void>;
  updateAttempt: (id: string, updates: Partial<QuizAttempt>) => Promise<void>;
  addAttempt: (attempt: QuizAttempt) => Promise<void>;
  getQuiz: (id: string) => Quiz | undefined;
  getQuizByShortCode: (code: string) => Promise<Quiz | undefined>;
  fetchQuizById: (id: string) => Promise<boolean>;
  publishQuiz: (id: string) => Promise<void>;
  getAllAttemptsForQuiz: (quizId: string) => QuizAttempt[];
  fetchAttemptsForQuiz: (quizId: string) => Promise<QuizAttempt[]>;
  isLoading: boolean;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const QuizProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth();
  
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [publicQuizzes, setPublicQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load user's quizzes and attempts
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      setQuizzes([]);
      setAttempts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const q = query(collection(db, "quizzes"), where("authorId", "==", user.id));
    const unsubscribeQuizzes = onSnapshot(q, (snapshot) => {
      const loadedQuizzes: Quiz[] = [];
      snapshot.forEach((doc) => {
        loadedQuizzes.push(doc.data() as Quiz);
      });
      setQuizzes(loadedQuizzes);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching quizzes:", error);
      setIsLoading(false);
    });

    const qAttempts = query(collection(db, "attempts"), where("userId", "==", user.id));
    const unsubscribeAttempts = onSnapshot(qAttempts, (snapshot) => {
      const loadedAttempts: QuizAttempt[] = [];
      snapshot.forEach((doc) => {
        loadedAttempts.push(doc.data() as QuizAttempt);
      });
      setAttempts(loadedAttempts);
    }, (error) => {
      console.error("Error fetching attempts:", error);
    });

    return () => {
      unsubscribeQuizzes();
      unsubscribeAttempts();
    };
  }, [user, authLoading]);

  const addQuiz = async (quiz: Quiz) => {
    if (!user) return;
    const quizWithAuthor = {
      ...quiz,
      authorId: user.id,
      author: user.name
    };
    await setDoc(doc(db, "quizzes", quiz.id), quizWithAuthor);
  };

  const editQuiz = async (updatedQuiz: Quiz) => {
    if (!user) return;
    await setDoc(doc(db, "quizzes", updatedQuiz.id), updatedQuiz, { merge: true });
    
    setPublicQuizzes(prev => prev.map(q => q.id === updatedQuiz.id ? updatedQuiz : q));
  };

  const publishQuiz = async (id: string) => {
    await updateDoc(doc(db, "quizzes", id), { isPublic: true });
  };

  const togglePublishQuiz = async (id: string, isPublic: boolean) => {
    if (!user) return;
    await updateDoc(doc(db, "quizzes", id), { isPublic });
  };

  const getPublicQuizzes = async (): Promise<Quiz[]> => {
    try {
      const q = query(collection(db, "quizzes"), where("isPublic", "==", true));
      const snapshot = await getDocs(q);
      const results: Quiz[] = [];
      snapshot.forEach((doc) => {
        // Filter out soft-deleted quizzes
        const data = doc.data() as Quiz;
        if (!data.deletedAt) {
          results.push(data);
        }
      });
      return results.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error("Error fetching public quizzes:", error);
      return [];
    }
  };

  // Soft delete: Mark as deleted with timestamp
  const deleteQuiz = async (id: string) => {
    if (!user) return;
    await updateDoc(doc(db, "quizzes", id), { 
      deletedAt: new Date().toISOString() 
    });
  };

  // Restore: Remove deletedAt field
  const restoreQuiz = async (id: string) => {
    if (!user) return;
    await updateDoc(doc(db, "quizzes", id), { 
      deletedAt: deleteField() 
    });
  };

  // Hard delete: Actually remove from Firestore
  const permanentDeleteQuiz = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, "quizzes", id));
  };

  const deleteAllQuizzesByAuthor = async (authorId: string) => {
    try {
      // Query all quizzes by this author
      const q = query(collection(db, "quizzes"), where("authorId", "==", authorId));
      const snapshot = await getDocs(q);
      
      // Delete each quiz
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      // Also delete attempts by this user? Ideally yes, but let's focus on quizzes first as requested.
      // The request specifically mentioned "quizzes they posted to the community".
    } catch (error) {
      console.error("Error deleting user quizzes:", error);
      throw error;
    }
  };

  const importQuiz = async (quiz: Quiz) => {
    setPublicQuizzes(prev => {
        if (prev.some(q => q.id === quiz.id)) return prev;
        return [...prev, quiz];
    });
    
    try {
      const docRef = doc(db, "quizzes", quiz.id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
          const freshQuiz = docSnap.data() as Quiz;
          setPublicQuizzes(prev => {
              const idx = prev.findIndex(q => q.id === freshQuiz.id);
              if (idx >= 0) {
                  const newArr = [...prev];
                  newArr[idx] = freshQuiz;
                  return newArr;
              }
              return [...prev, freshQuiz];
          });
      }
    } catch (e) {
      console.error("Error importing quiz:", e);
    }
  };

  const addAttempt = async (attempt: QuizAttempt) => {
    await setDoc(doc(db, "attempts", attempt.id), attempt);
  };

  const updateAttempt = async (id: string, updates: Partial<QuizAttempt>) => {
    await updateDoc(doc(db, "attempts", id), updates);
  };

  const getQuiz = useCallback((id: string) => {
    return quizzes.find(q => q.id === id) || publicQuizzes.find(q => q.id === id);
  }, [quizzes, publicQuizzes]);

  const fetchQuizById = useCallback(async (id: string): Promise<boolean> => {
      // Check if we already have it to avoid unnecessary fetches
      if (getQuiz(id)) return true;

      try {
        const docRef = doc(db, "quizzes", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const quiz = docSnap.data() as Quiz;
            setPublicQuizzes(prev => {
                if (prev.some(q => q.id === quiz.id)) return prev;
                return [...prev, quiz];
            });
            return true;
        } else {
            console.log("Quiz not found in Firestore:", id);
            return false;
        }
      } catch (e) {
          console.error("Error fetching quiz:", e);
          return false;
      }
  }, [getQuiz]);

  const getQuizByShortCode = useCallback(async (code: string): Promise<Quiz | undefined> => {
    // Check local cache first
    const local = quizzes.find(q => q.shortCode === code) || publicQuizzes.find(q => q.shortCode === code);
    if (local) return local;

    try {
      const q = query(collection(db, "quizzes"), where("shortCode", "==", code));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const quiz = snapshot.docs[0].data() as Quiz;
        setPublicQuizzes(prev => {
            if (prev.some(q => q.id === quiz.id)) return prev;
            return [...prev, quiz];
        });
        return quiz;
      }
    } catch (e) {
      console.error("Error fetching quiz by short code:", e);
    }
    return undefined;
  }, [quizzes, publicQuizzes]);

  const getAllAttemptsForQuiz = (quizId: string) => {
    return [];
  };
  
  const fetchAttemptsForQuiz = async (quizId: string): Promise<QuizAttempt[]> => {
      const q = query(collection(db, "attempts"), where("quizId", "==", quizId));
      const snapshot = await getDocs(q);
      const results: QuizAttempt[] = [];
      snapshot.forEach(doc => results.push(doc.data() as QuizAttempt));
      return results.sort((a, b) => b.score - a.score);
  };

  return (
    <QuizContext.Provider value={{ 
        quizzes, 
        attempts, 
        addQuiz, 
        editQuiz, 
        deleteQuiz,
        restoreQuiz,
        permanentDeleteQuiz,
        deleteAllQuizzesByAuthor,
        togglePublishQuiz,
        getPublicQuizzes,
        importQuiz, 
        addAttempt, 
        updateAttempt, 
        getQuiz, 
        getQuizByShortCode,
        fetchQuizById,
        publishQuiz, 
        getAllAttemptsForQuiz,
        fetchAttemptsForQuiz,
        isLoading
    }}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuizStore = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuizStore must be used within a QuizProvider');
  }
  return context;
};