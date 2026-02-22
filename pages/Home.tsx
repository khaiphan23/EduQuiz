import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizStore } from '../store/QuizContext';
import { useAuth } from '../store/AuthContext';
import { Button } from '../components/Button';
import { HelpCircle, Trophy, Sparkles, Share2, BarChart2, ArrowRight, UserCheck, Lock, Edit, Trash2, Globe, UploadCloud, CheckCircle } from 'lucide-react';
import { ShareModal } from '../components/ShareModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { Quiz } from '../types';

export const Home: React.FC = () => {
  const { quizzes, attempts, publishQuiz, deleteQuiz, togglePublishQuiz, editQuiz, isLoading } = useQuizStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Filter out deleted quizzes for the main view
  const activeQuizzes = quizzes.filter(q => !q.deletedAt);
  const deletedCount = quizzes.filter(q => q.deletedAt).length;

  // Debug: Check if deleteQuiz is available
  React.useEffect(() => {
    console.log("Home mounted. deleteQuiz available:", !!deleteQuiz);
  }, [deleteQuiz]);

  const [shareLink, setShareLink] = useState<string | null>(null);
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);
  const [quizToPublish, setQuizToPublish] = useState<Quiz | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const confirmDelete = async () => {
    if (!quizToDelete) return;
    
    try {
      await deleteQuiz(quizToDelete);
      setQuizToDelete(null);
    } catch (error: any) {
      console.error("Failed to delete quiz:", error);
      alert(`Lỗi khi xóa: ${error.message}`);
    }
  };

  const confirmPublish = async () => {
    if (!quizToPublish) return;
    setIsPublishing(true);
    
    try {
      const newStatus = !quizToPublish.isPublic;
      
      // Timeout protection
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Yêu cầu quá thời gian.')), 10000);
      });

      await Promise.race([
        togglePublishQuiz(quizToPublish.id, newStatus),
        timeoutPromise
      ]);

      setQuizToPublish(null);
    } catch (error) {
      console.error("Failed to toggle publish status:", error);
      alert("Lỗi khi cập nhật trạng thái công khai. Vui lòng thử lại.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, quizId: string) => {
    e.stopPropagation();
    setQuizToDelete(quizId);
  };

  const handlePublishClick = (e: React.MouseEvent, quiz: Quiz) => {
    e.stopPropagation();
    setQuizToPublish(quiz);
  };

  const handleShare = async (e: React.MouseEvent, quizId: string) => {
    e.stopPropagation();
    
    // 1. Get the quiz data
    const quizToShare = quizzes.find(q => q.id === quizId);
    if (!quizToShare) return;

    // 2. Create the portable link using ID or ShortCode
    // We now rely on the backend (Firestore) to serve the quiz data, including images.
    // This avoids the "URI Too Long" error and allows sharing rich content.
    
    let shareId = quizToShare.shortCode;

    // If no shortCode exists, generate one and save it
    if (!shareId) {
      try {
        // Generate a 6-char short code
        const newShortCode = Math.random().toString(36).substring(2, 8);
        
        // Update the quiz in Firestore
        await editQuiz({ ...quizToShare, shortCode: newShortCode });
        
        // Use the new code
        shareId = newShortCode;
      } catch (err) {
        console.error("Failed to generate short code:", err);
        // Fallback to long ID if generation fails
        shareId = quizId;
      }
    }

    const baseUrl = window.location.href.split('#')[0];
    // Use the shorter /q/ route with the short code
    const link = `${baseUrl}#/q/${shareId}`;
    
    setShareLink(link);
  };

  const handleEdit = (e: React.MouseEvent, quizId: string) => {
    e.stopPropagation();
    navigate(`/edit/${quizId}`);
  };

  // If not logged in, show Guest Landing Page
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-8">
        <div className="bg-indigo-100 p-6 rounded-full">
           <Sparkles className="h-16 w-16 text-indigo-600" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
          Nền Tảng Trắc Nghiệm Thông Minh
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Tạo đề thi nhanh chóng với AI, chia sẻ với học sinh chỉ bằng một liên kết. 
          Đăng nhập để bắt đầu tạo bộ câu hỏi của riêng bạn.
        </p>
        <div className="flex gap-4 mt-8">
          <Button size="lg" onClick={() => navigate('/login')}>
            Đăng nhập để tạo đề
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/register')}>
            Đăng ký tài khoản
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 text-left max-w-4xl w-full">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mb-4">
               <Sparkles className="h-6 w-6" />
             </div>
             <h3 className="text-lg font-bold text-slate-900 mb-2">Tạo bằng AI</h3>
             <p className="text-slate-600">Chỉ cần nhập chủ đề, AI sẽ tạo ra bộ câu hỏi trắc nghiệm hoàn chỉnh trong vài giây.</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600 mb-4">
               <Share2 className="h-6 w-6" />
             </div>
             <h3 className="text-lg font-bold text-slate-900 mb-2">Chia sẻ dễ dàng</h3>
             <p className="text-slate-600">Học sinh không cần tài khoản. Chỉ cần gửi liên kết và họ có thể làm bài ngay.</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 mb-4">
               <BarChart2 className="h-6 w-6" />
             </div>
             <h3 className="text-lg font-bold text-slate-900 mb-2">Thống kê chi tiết</h3>
             <p className="text-slate-600">Xem bảng xếp hạng, điểm số và phân tích kết quả của người làm bài.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Logged in User View
  return (
    <div className="space-y-8">
      <ShareModal 
        isOpen={!!shareLink} 
        onClose={() => setShareLink(null)} 
        link={shareLink || ''} 
      />

      <ConfirmModal
        isOpen={!!quizToDelete}
        onClose={() => setQuizToDelete(null)}
        onConfirm={confirmDelete}
        title="Chuyển vào thùng rác?"
        message="Bài trắc nghiệm này sẽ được chuyển vào thùng rác và sẽ bị xóa vĩnh viễn sau 7 ngày nếu không được khôi phục."
        confirmText="Xóa tạm thời"
        isDestructive={true}
      />

      <ConfirmModal
        isOpen={!!quizToPublish}
        onClose={() => !isPublishing && setQuizToPublish(null)}
        onConfirm={confirmPublish}
        title={quizToPublish?.isPublic ? "Hủy đăng bài?" : "Đăng lên Thư viện?"}
        message={quizToPublish?.isPublic 
          ? "Bài trắc nghiệm sẽ bị gỡ khỏi Thư viện cộng đồng. Người khác sẽ không còn tìm thấy nó nữa." 
          : "Bạn có chắc chắn muốn chia sẻ bài trắc nghiệm này với cộng đồng không? Mọi người sẽ có thể tìm kiếm và làm bài thi của bạn."}
        confirmText={isPublishing ? "Đang xử lý..." : (quizToPublish?.isPublic ? "Gỡ bài" : "Đăng ngay")}
        isDestructive={quizToPublish?.isPublic}
        isLoading={isPublishing}
        preventCloseOnConfirm={true}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-indigo-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-800 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>
        <div className="relative z-10 space-y-4 max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">Xin chào, {user.name}</h1>
          <p className="text-indigo-200 text-lg">Quản lý các bài trắc nghiệm của bạn hoặc tạo bài mới.</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/create')} 
              className="bg-white text-slate-900 border-2 border-transparent hover:border-indigo-500 hover:text-indigo-600 hover:bg-white shadow-md transition-all duration-300 transform hover:scale-105"
            >
              <Sparkles className="h-4 w-4 mr-2 text-indigo-600 group-hover:text-indigo-600" />
              Tạo bài mới
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-900">Thư viện của tôi</h2>
            <span className="text-sm text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded-full">{activeQuizzes.length} bài</span>
          </div>
        </div>

        {activeQuizzes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
            <p className="text-slate-500 mb-4">Bạn chưa tạo bài trắc nghiệm nào.</p>
            <Button onClick={() => navigate('/create')}>Bắt đầu ngay</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeQuizzes.map(quiz => {
              const quizAttempts = attempts.filter(a => a.quizId === quiz.id);
              
              // Only user's own quizzes are shown here based on QuizContext logic for 'quizzes'
              const isAuthor = true; 

              return (
                <div key={quiz.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col h-full relative group">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                      ${quiz.difficulty === 'hard' ? 'bg-red-100 text-red-800' : 
                        quiz.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'}`}>
                      {quiz.difficulty === 'hard' ? 'Khó' : quiz.difficulty === 'medium' ? 'Trung bình' : 'Dễ'}
                    </div>
                    
                    <div className="flex space-x-1 relative z-20 pointer-events-auto">
                      <button 
                        onClick={(e) => handleDeleteClick(e, quiz.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all cursor-pointer"
                        title="Xóa bài trắc nghiệm"
                        style={{ position: 'relative', zIndex: 50 }}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => handleEdit(e, quiz.id)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                        title="Chỉnh sửa bài"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => handlePublishClick(e, quiz)}
                        className={`p-2 rounded-full transition-all ${
                          quiz.isPublic 
                            ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                            : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                        }`}
                        title={quiz.isPublic ? "Đã đăng (Nhấn để gỡ)" : "Đăng lên thư viện"}
                      >
                        {quiz.isPublic ? <CheckCircle className="h-5 w-5" /> : <UploadCloud className="h-5 w-5" />}
                      </button>
                      <button 
                        onClick={(e) => handleShare(e, quiz.id)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
                        title="Chia sẻ bài trắc nghiệm"
                      >
                        <Share2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1">{quiz.title}</h3>
                  <p className="text-slate-600 text-sm mb-6 line-clamp-2 flex-grow">{quiz.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-slate-500 mb-6">
                    <div className="flex items-center">
                      <HelpCircle className="h-4 w-4 mr-1" />
                      {quiz.questions.length} Câu
                    </div>
                    
                    <div className="flex items-center text-indigo-600 font-medium">
                      <UserCheck className="h-4 w-4 mr-1" />
                      Tác giả
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => navigate(`/stats/${quiz.id}`)} 
                      className="flex-1 justify-between group bg-slate-800 hover:bg-slate-900 text-white border-transparent"
                    >
                      Xem kết quả
                      <BarChart2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};