import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuizStore } from '../store/QuizContext';
import { useAuth } from '../store/AuthContext';
import { Button } from '../components/Button';
import { ChevronRight, ChevronLeft, CheckCircle, Loader2, X } from 'lucide-react';
import { QuizAttempt, Quiz } from '../types';

export const TakeQuiz: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getQuiz, fetchQuizById, getQuizByShortCode, addAttempt, importQuiz, isLoading: isStoreLoading } = useQuizStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  
  // Guest name state
  const [guestName, setGuestName] = useState('');
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [started, setStarted] = useState(false);
  const [isLoadingShared, setIsLoadingShared] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  // Try to get quiz from store
  const quiz = getQuiz(id || '');

  // Fetch quiz if not found locally
  useEffect(() => {
    if (id && !quiz && !isLoadingShared) {
      setIsLoadingShared(true);
      
      const loadQuiz = async () => {
        try {
          // 1. Try fetching by ID
          const foundById = await fetchQuizById(id);
          if (foundById) return;

          // 2. If not found by ID, try fetching by Short Code
          const foundByCode = await getQuizByShortCode(id);
          if (!foundByCode) {
            setFetchError(true);
          }
        } catch (error) {
          console.error("Error loading quiz:", error);
          setFetchError(true);
        } finally {
          setTimeout(() => setIsLoadingShared(false), 500);
        }
      };

      loadQuiz();
    }
  }, [id, quiz, fetchQuizById, getQuizByShortCode]);

  // Handle shared link import (Legacy support for data param)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sharedData = params.get('data');

    if (sharedData && !quiz && id) {
      setIsLoadingShared(true);
      try {
        const jsonString = decodeURIComponent(escape(atob(decodeURIComponent(sharedData))));
        const parsedQuiz: Quiz = JSON.parse(jsonString);
        
        if (parsedQuiz.id === id) {
           importQuiz(parsedQuiz);
        }
      } catch (err) {
        console.error("Failed to parse shared quiz", err);
      } finally {
        setIsLoadingShared(false);
      }
    }
  }, [id, location.search, quiz, importQuiz]);

  useEffect(() => {
    if (quiz) {
      if (!user) {
        setShowGuestPrompt(true);
      } else {
        setStarted(true);
      }
    }
  }, [quiz, user]);

  const handleStartGuest = () => {
    if (guestName.trim()) {
      setShowGuestPrompt(false);
      setStarted(true);
    }
  };

  if (isLoadingShared || (id && !quiz && !fetchError)) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
              <p className="text-slate-500">Đang tải đề thi...</p>
          </div>
      );
  }

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <div className="bg-red-50 p-4 rounded-full mb-4">
          <X className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Không tìm thấy bài trắc nghiệm</h2>
        <p className="text-slate-600 mb-6">Bài trắc nghiệm này có thể đã bị xóa hoặc liên kết không hợp lệ.</p>
        <Button onClick={() => navigate('/')}>
          Về trang chủ
        </Button>
      </div>
    );
  }

  // Guest Prompt UI
  if (showGuestPrompt) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-lg border border-slate-200 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Nhập tên của bạn</h2>
        <p className="text-slate-600 mb-6">Vui lòng nhập tên để giáo viên có thể nhận biết bài làm của bạn.</p>
        <input 
          type="text" 
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          className="w-full p-3 border border-slate-300 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 outline-none"
          placeholder="Tên của bạn..."
          autoFocus
        />
        <Button onClick={handleStartGuest} disabled={!guestName.trim()} className="w-full justify-center">
          Bắt đầu làm bài
        </Button>
      </div>
    );
  }

  if (!started) return null;

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const progress = ((Object.keys(answers).length) / totalQuestions) * 100;

  const handleSelectAnswer = (value: any) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    let correctCount = 0;
    let hasEssay = false;

    quiz.questions.forEach(q => {
      if (q.type === 'essay') {
        hasEssay = true;
      } else if (answers[q.id] === q.correctAnswerIndex) {
        correctCount++;
      }
    });

    const score = (correctCount / totalQuestions) * 100;

    const attempt: QuizAttempt = {
      id: `att-${Date.now()}`,
      quizId: quiz.id,
      userId: user?.id || `guest-${Date.now()}`,
      userName: user?.name || guestName || 'Khách',
      answers,
      score,
      timestamp: Date.now(),
      status: hasEssay ? 'pending-grading' : 'completed'
    };

    addAttempt(attempt);
    navigate(`/result/${quiz.id}`, { state: { attemptId: attempt.id } });
  };

  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const isComplete = Object.keys(answers).length === totalQuestions;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header / Progress */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
         <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{quiz.title}</h1>
              <p className="text-sm text-slate-500">Người làm: <span className="font-semibold text-indigo-600">{user?.name || guestName}</span></p>
            </div>
            <span className="text-sm font-medium text-slate-500">
              Câu {currentQuestionIndex + 1} / {totalQuestions}
            </span>
         </div>
         <div className="w-full bg-slate-100 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
         </div>
      </div>

      {/* Question Card */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm min-h-[400px] flex flex-col">
        <div className="mb-6">
           <span className="inline-block px-2 py-1 text-xs font-semibold tracking-wide uppercase text-indigo-600 bg-indigo-50 rounded mb-2">
             {currentQuestion.type === 'essay' ? 'Câu hỏi tự luận' : 'Câu hỏi trắc nghiệm'}
           </span>
           <h2 className="text-xl font-medium text-slate-900 leading-relaxed mb-4">
             {currentQuestion.text}
           </h2>
           {currentQuestion.imageUrl && (
             <div className="mb-6 rounded-xl overflow-hidden border border-slate-200">
               <img 
                 src={currentQuestion.imageUrl} 
                 alt="Minh họa câu hỏi" 
                 className="w-full max-h-80 object-contain bg-slate-50"
               />
             </div>
           )}
        </div>

        <div className="flex-grow">
          {currentQuestion.type === 'essay' ? (
            <textarea
              className="w-full h-48 p-4 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none text-slate-700 leading-relaxed"
              placeholder="Nhập câu trả lời của bạn tại đây..."
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleSelectAnswer(e.target.value)}
            />
          ) : (
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                 const isSelected = answers[currentQuestion.id] === index;
                 return (
                   <button
                     key={index}
                     onClick={() => handleSelectAnswer(index)}
                     className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center group
                       ${isSelected 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900' 
                          : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50 text-slate-700'
                       }`}
                   >
                     <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center flex-shrink-0 transition-colors
                       ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 group-hover:border-indigo-300'}`}>
                        {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                     </div>
                     <span className="font-medium">{option}</span>
                   </button>
                 );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-8 mt-4 border-t border-slate-100">
          <Button 
            variant="ghost" 
            onClick={handlePrev} 
            disabled={currentQuestionIndex === 0}
            className="text-slate-500"
          >
            <ChevronLeft className="h-5 w-5 mr-1" /> Trước
          </Button>

          {isLastQuestion ? (
            <Button 
              onClick={handleSubmit} 
              disabled={!isComplete}
              variant="primary"
              className="px-8"
            >
              Nộp bài <CheckCircle className="h-5 w-5 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleNext} 
              variant="outline"
              className="px-8"
            >
              Tiếp <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};