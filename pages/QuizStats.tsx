import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuizStore } from '../store/QuizContext';
import { useAuth } from '../store/AuthContext';
import { Button } from '../components/Button';
import { ChevronLeft, Users, Trophy, Target, Clock, BarChart2 } from 'lucide-react';
import { QuizAttempt } from '../types';

interface StudentStat {
  userId: string;
  userName: string;
  attempts: number;
  bestScore: number;
  lastAttemptTime: number;
}

export const QuizStats: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getQuiz, fetchAttemptsForQuiz } = useQuizStore();
  const { user } = useAuth();
  
  const quiz = getQuiz(id || '');
  const [stats, setStats] = useState<StudentStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!quiz) {
      // If quiz is not found immediately, it might be fetching.
      // But for stats, we usually navigate from a list where we have the quiz.
      // If refreshed, getQuiz triggers fetch.
      // We can wait a bit or just show loading.
      // For now, if no quiz after a short timeout, redirect.
      const timer = setTimeout(() => {
          if (!quiz) navigate('/');
      }, 2000);
      return () => clearTimeout(timer);
    }

    // Security check: Only author can view stats
    if (user && quiz.authorId && quiz.authorId !== user.id) {
        alert("Bạn không có quyền xem thống kê bài này.");
        navigate('/');
        return;
    }

    const loadStats = async () => {
        const attempts = await fetchAttemptsForQuiz(quiz.id);
        
        // Process stats
        const userMap = new Map<string, StudentStat>();

        attempts.forEach(att => {
            if (!att.userId) return;
            
            const existing = userMap.get(att.userId);
            if (existing) {
                existing.attempts += 1;
                existing.bestScore = Math.max(existing.bestScore, att.score);
                existing.lastAttemptTime = Math.max(existing.lastAttemptTime, att.timestamp);
            } else {
                userMap.set(att.userId, {
                    userId: att.userId,
                    userName: att.userName || 'Ẩn danh',
                    attempts: 1,
                    bestScore: att.score,
                    lastAttemptTime: att.timestamp
                });
            }
        });

        // Convert map to array and sort by best score
        const statsArray = Array.from(userMap.values()).sort((a, b) => b.bestScore - a.bestScore);
        setStats(statsArray);
        setLoading(false);
    };

    loadStats();

  }, [quiz, user, navigate, fetchAttemptsForQuiz]);

  if (!quiz) return <div className="p-8 text-center">Đang tải...</div>;

  const totalAttempts = stats.reduce((acc, curr) => acc + curr.attempts, 0);
  const averageScore = stats.length > 0 
    ? stats.reduce((acc, curr) => acc + curr.bestScore, 0) / stats.length 
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/')}>
          <ChevronLeft className="h-5 w-5 mr-1" /> Quay lại
        </Button>
        <h1 className="text-2xl font-bold text-slate-900">Thống kê: {quiz.title}</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                <Users className="h-6 w-6" />
            </div>
            <div>
                <p className="text-sm text-slate-500 font-medium">Tổng người làm</p>
                <p className="text-2xl font-bold text-slate-900">{stats.length}</p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-full">
                <Target className="h-6 w-6" />
            </div>
            <div>
                <p className="text-sm text-slate-500 font-medium">Tổng lượt thi</p>
                <p className="text-2xl font-bold text-slate-900">{totalAttempts}</p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                <BarChart2 className="h-6 w-6" />
            </div>
            <div>
                <p className="text-sm text-slate-500 font-medium">Điểm trung bình</p>
                <p className="text-2xl font-bold text-slate-900">{Math.round(averageScore)}%</p>
            </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                Bảng xếp hạng & Chi tiết
            </h2>
        </div>
        
        {stats.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
                Chưa có ai làm bài kiểm tra này.
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 font-semibold border-b border-slate-200">
                            <th className="p-4 w-16 text-center">#</th>
                            <th className="p-4">Học sinh</th>
                            <th className="p-4 text-center">Số lần làm</th>
                            <th className="p-4 text-center">Điểm cao nhất</th>
                            <th className="p-4 text-right">Lần cuối</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {stats.map((student, idx) => (
                            <tr key={student.userId} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 text-center font-medium text-slate-500">
                                    {idx < 3 ? (
                                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                                            idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                            idx === 1 ? 'bg-slate-200 text-slate-700' :
                                            'bg-orange-100 text-orange-700'
                                        }`}>
                                            {idx + 1}
                                        </span>
                                    ) : (
                                        idx + 1
                                    )}
                                </td>
                                <td className="p-4 font-medium text-slate-900">{student.userName}</td>
                                <td className="p-4 text-center text-slate-600">{student.attempts}</td>
                                <td className="p-4 text-center">
                                    <span className={`inline-block px-2 py-1 rounded text-sm font-bold ${
                                        student.bestScore >= 80 ? 'bg-green-100 text-green-700' :
                                        student.bestScore >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {Math.round(student.bestScore)}%
                                    </span>
                                </td>
                                <td className="p-4 text-right text-sm text-slate-500 flex items-center justify-end gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(student.lastAttemptTime).toLocaleDateString('vi-VN')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
};