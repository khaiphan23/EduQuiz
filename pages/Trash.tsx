import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizStore } from '../store/QuizContext';
import { useAuth } from '../store/AuthContext';
import { Button } from '../components/Button';
import { Trash2, RefreshCw, AlertTriangle, ArrowLeft, Clock } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export const Trash: React.FC = () => {
  const { quizzes, restoreQuiz, permanentDeleteQuiz, isLoading } = useQuizStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizToDelete, setQuizToDelete] = React.useState<string | null>(null);

  // Filter deleted quizzes
  const deletedQuizzes = quizzes.filter(q => q.deletedAt);

  // Auto-cleanup check on mount
  useEffect(() => {
    const checkExpiredQuizzes = async () => {
      const now = new Date();
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

      for (const quiz of deletedQuizzes) {
        if (quiz.deletedAt) {
          const deletedDate = new Date(quiz.deletedAt);
          if (now.getTime() - deletedDate.getTime() > sevenDaysInMs) {
            console.log(`Auto-deleting expired quiz: ${quiz.title}`);
            await permanentDeleteQuiz(quiz.id);
          }
        }
      }
    };

    if (deletedQuizzes.length > 0) {
      checkExpiredQuizzes();
    }
  }, [deletedQuizzes, permanentDeleteQuiz]);

  const handleRestore = async (id: string) => {
    try {
      await restoreQuiz(id);
    } catch (error) {
      console.error("Failed to restore quiz:", error);
      alert("Lỗi khi khôi phục bài trắc nghiệm.");
    }
  };

  const handlePermanentDelete = async () => {
    if (!quizToDelete) return;
    try {
      await permanentDeleteQuiz(quizToDelete);
      setQuizToDelete(null);
    } catch (error) {
      console.error("Failed to delete quiz permanently:", error);
      alert("Lỗi khi xóa vĩnh viễn.");
    }
  };

  const getDaysRemaining = (deletedAt: string) => {
    const deletedDate = new Date(deletedAt);
    const expirationDate = new Date(deletedDate.getTime() + (7 * 24 * 60 * 60 * 1000));
    const now = new Date();
    const diffMs = expirationDate.getTime() - now.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  if (!user) {
    navigate('/');
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ConfirmModal
        isOpen={!!quizToDelete}
        onClose={() => setQuizToDelete(null)}
        onConfirm={handlePermanentDelete}
        title="Xóa vĩnh viễn?"
        message="Hành động này KHÔNG THỂ hoàn tác. Bài trắc nghiệm sẽ bị xóa hoàn toàn khỏi hệ thống."
        confirmText="Xóa vĩnh viễn"
        isDestructive={true}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/')} className="p-2">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Trash2 className="h-6 w-6 text-red-500" />
              Thùng rác
            </h1>
            <p className="text-slate-500 text-sm">
              Các bài đã xóa sẽ được lưu ở đây trong 7 ngày trước khi bị xóa vĩnh viễn.
            </p>
          </div>
        </div>
      </div>

      {deletedQuizzes.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
          <div className="mx-auto h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Trash2 className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900">Thùng rác trống</h3>
          <p className="text-slate-500 mt-1">Không có bài trắc nghiệm nào bị xóa gần đây.</p>
          <div className="mt-6">
            <Button onClick={() => navigate('/')}>Quay lại thư viện</Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {deletedQuizzes.map((quiz) => {
            const daysLeft = getDaysRemaining(quiz.deletedAt!);
            
            return (
              <div key={quiz.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900">{quiz.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      daysLeft <= 1 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      Tự động xóa sau {daysLeft} ngày
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-1">{quiz.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Đã xóa: {new Date(quiz.deletedAt!).toLocaleDateString('vi-VN')}
                    </span>
                    <span>{quiz.questions.length} câu hỏi</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <Button 
                    variant="outline" 
                    onClick={() => handleRestore(quiz.id)}
                    className="flex-1 md:flex-none text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Khôi phục
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setQuizToDelete(quiz.id)}
                    className="flex-1 md:flex-none text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa vĩnh viễn
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
