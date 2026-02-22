import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizStore } from '../store/QuizContext';
import { Button } from '../components/Button';
import { Search, Library, BookOpen, User, Clock, ArrowRight } from 'lucide-react';
import { Quiz } from '../types';

export const LibraryPage: React.FC = () => {
  const { getPublicQuizzes } = useQuizStore();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      const data = await getPublicQuizzes();
      setQuizzes(data);
      setLoading(false);
    };
    fetchQuizzes();
  }, [getPublicQuizzes]);

  const filteredQuizzes = quizzes.filter(quiz => {
    const term = searchTerm.toLowerCase();
    return (
      quiz.title.toLowerCase().includes(term) ||
      quiz.description.toLowerCase().includes(term) ||
      (quiz.topic && quiz.topic.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-4">
            <Library className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Thư Viện Cộng Đồng</h1>
          <p className="text-slate-600 text-lg">
            Khám phá hàng ngàn bài trắc nghiệm được chia sẻ bởi cộng đồng giáo viên và người học.
          </p>
          
          <div className="pt-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none pt-4">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-4 border border-slate-300 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
              placeholder="Tìm kiếm theo chủ đề, tên bài thi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Quiz Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
          <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">Không tìm thấy bài trắc nghiệm nào</h3>
          <p className="text-slate-500">Hãy thử tìm kiếm với từ khóa khác hoặc quay lại sau.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <div key={quiz.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 flex flex-col h-full group">
              <div className="p-6 flex-grow">
                <div className="flex items-start justify-between mb-4">
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                    ${quiz.difficulty === 'hard' ? 'bg-red-100 text-red-800' : 
                      quiz.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-green-100 text-green-800'}`}>
                    {quiz.difficulty === 'hard' ? 'Khó' : quiz.difficulty === 'medium' ? 'Trung bình' : 'Dễ'}
                  </div>
                  <span className="text-xs text-slate-400 flex items-center bg-slate-50 px-2 py-1 rounded-md">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(quiz.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                  {quiz.title}
                </h3>
                <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                  {quiz.description}
                </p>
                
                <div className="flex items-center text-xs text-slate-500 mt-auto pt-4 border-t border-slate-100">
                  <User className="h-3 w-3 mr-1" />
                  <span className="truncate max-w-[150px]">{quiz.author || 'Ẩn danh'}</span>
                  <span className="mx-2">•</span>
                  <span>{quiz.questions.length} câu hỏi</span>
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-b-xl border-t border-slate-100">
                <Button 
                  className="w-full justify-between"
                  onClick={() => navigate(`/quiz/${quiz.id}`)}
                >
                  Làm bài ngay
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
