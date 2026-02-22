import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuizStore } from '../store/QuizContext';
import { useAuth } from '../store/AuthContext';
import { generateQuizAI } from '../services/geminiService';
import { Button } from '../components/Button';
import { Question, Quiz } from '../types';
import { Sparkles, Plus, Trash2, CheckCircle2, AlignLeft, ListChecks, Minus, Image as ImageIcon, X, ArrowLeft } from 'lucide-react';

export const CreateQuiz: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // Check for Edit ID
  const { addQuiz, editQuiz, getQuiz } = useQuizStore();
  const { user } = useAuth();
  
  // Modes: 'setup' -> 'editor'
  const [mode, setMode] = useState<'setup' | 'editor'>('setup');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Setup State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(5);

  // Editor State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // Authentication Check
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Load existing quiz for editing
  useEffect(() => {
    if (id && user) {
      const existingQuiz = getQuiz(id);
      if (existingQuiz) {
        if (existingQuiz.authorId !== user.id) {
            alert("Bạn không có quyền chỉnh sửa bài này.");
            navigate('/');
            return;
        }
        setTitle(existingQuiz.title);
        setDescription(existingQuiz.description);
        setQuestions(existingQuiz.questions);
        setIsEditing(true);
        setMode('editor');
      }
    }
  }, [id, user, getQuiz, navigate]);

  const handleGenerateAI = async () => {
    if (!topic) return;
    setIsGenerating(true);
    setAiError(null);
    try {
      // Timeout protection for AI generation (30 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AI phản hồi quá lâu. Vui lòng thử lại.')), 30000);
      });

      const generated = await Promise.race([
        generateQuizAI(topic, difficulty, questionCount),
        timeoutPromise
      ]) as Quiz;

      setTitle(generated.title || title);
      setDescription(generated.description || description);
      if (generated.questions) {
        setQuestions(generated.questions);
      }
      setMode('editor');
    } catch (err: any) {
      console.error("AI Generation Error:", err);
      setAiError(err.message || "Không thể tạo bài trắc nghiệm. Vui lòng kiểm tra API key và thử lại.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualStart = () => {
    if (!title) {
      setAiError("Vui lòng nhập tiêu đề cho bài trắc nghiệm.");
      return;
    }
    setMode('editor');
  };

  const addEmptyQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: `q-${Date.now()}`,
        type: 'multiple-choice',
        text: '',
        options: ['', '', '', ''],
        correctAnswerIndex: 0,
        explanation: '',
        sampleAnswer: ''
      }
    ]);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, qIndex: number) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 500KB to prevent Firestore document size issues)
      if (file.size > 500 * 1024) {
        alert("Kích thước ảnh quá lớn. Vui lòng chọn ảnh dưới 500KB để đảm bảo bài thi được lưu thành công.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        updateQuestion(qIndex, 'imageUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (qIndex: number) => {
    updateQuestion(qIndex, 'imageUrl', undefined);
  };

  const [isSaving, setIsSaving] = useState(false);

  const saveQuiz = async () => {
    // Basic validation
    if (!title || questions.length === 0) return;
    
    setIsSaving(true);
    try {
      // Timeout protection for saving (15 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Lưu bài quá lâu. Vui lòng kiểm tra kết nối mạng.')), 15000);
      });

      if (isEditing && id) {
          const updatedQuiz: Quiz = {
              id: id,
              title,
              description,
              topic: topic || 'Chung',
              difficulty: difficulty as any,
              questions,
              createdAt: Date.now(), // Keep original date or update? Updating logic here...
              author: user?.name || 'Người dùng',
              authorId: user?.id
          };
          
          await Promise.race([
            editQuiz(updatedQuiz),
            timeoutPromise
          ]);
      } else {
          // Generate a shorter ID: base36 timestamp + random suffix
          const shortId = Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
          const newQuiz: Quiz = {
              id: shortId,
              title,
              description,
              topic: topic || 'Chung',
              difficulty: difficulty as any,
              questions,
              createdAt: Date.now(),
              author: user?.name || 'Người dùng'
          };
          
          await Promise.race([
            addQuiz(newQuiz),
            timeoutPromise
          ]);
      }
      navigate('/');
    } catch (error: any) {
      console.error("Failed to save quiz:", error);
      alert(`Có lỗi xảy ra: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const inputClasses = "w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-900 placeholder-slate-400 hover:border-indigo-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all duration-200 shadow-sm";

  if (!user) return null; // Or loading spinner

  if (mode === 'setup') {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">Tạo Bài Trắc Nghiệm Mới</h1>
          <p className="text-slate-600">Sử dụng Gemini AI để tạo câu hỏi ngay lập tức, hoặc tự xây dựng từ đầu.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-1 bg-slate-100 flex p-2 m-2 rounded-lg">
            <button className="flex-1 py-2 text-sm font-medium bg-white shadow-sm text-slate-900 rounded-md flex items-center justify-center border border-transparent transition-all duration-200">
              <Sparkles className="w-4 h-4 mr-2 text-indigo-600" />
              Tạo bằng AI
            </button>
            <button 
              className="flex-1 py-2 text-sm font-medium text-slate-900 rounded-md border border-transparent hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all duration-200" 
              onClick={() => {
                setTitle('Bài trắc nghiệm mới');
                setMode('editor');
              }}
            >
              Tạo thủ công
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Chủ đề</label>
              <input 
                type="text" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="ví dụ: Quang hợp, Chiến tranh lạnh, Đại số cơ bản"
                className={inputClasses}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Độ khó</label>
                <div className="relative">
                  <select 
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className={`${inputClasses} appearance-none`}
                  >
                    <option value="easy">Dễ</option>
                    <option value="medium">Trung bình</option>
                    <option value="hard">Khó</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Số lượng câu hỏi</label>
                <div className="flex flex-col gap-3">
                  {/* Main Counter Control */}
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-2 hover:border-indigo-300 transition-colors">
                    <button 
                      onClick={() => setQuestionCount(Math.max(1, questionCount - 1))}
                      className="w-12 h-12 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    
                    <div className="flex flex-col items-center flex-grow">
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={questionCount}
                        onChange={(e) => setQuestionCount(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
                        className="w-full text-center bg-transparent border-none text-3xl font-bold text-slate-900 focus:ring-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Câu hỏi</span>
                    </div>

                    <button 
                      onClick={() => setQuestionCount(Math.min(30, questionCount + 1))}
                      className="w-12 h-12 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Quick Presets */}
                  <div className="flex gap-2">
                    {[3, 5, 10, 15, 20].map(num => (
                      <button
                        key={num}
                        onClick={() => setQuestionCount(num)}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all border
                          ${questionCount === num
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'}
                        `}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {aiError && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                {aiError}
              </div>
            )}

            <Button 
              onClick={handleGenerateAI} 
              isLoading={isGenerating} 
              disabled={!topic}
              className="w-full justify-center"
              size="lg"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Tạo với Gemini
            </Button>
            
            <div className="text-center">
                 <button onClick={handleManualStart} className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline">
                    Bỏ qua AI và tạo thủ công
                 </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // EDITOR MODE
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-20 z-40 backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
             <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Chỉnh sửa bài thi' : 'Tạo bài thi mới'}
            </h2>
            <span className="text-sm text-slate-500">{questions.length} Câu hỏi</span>
          </div>
        </div>
        <div className="flex space-x-2">
           {!isEditing && <Button variant="outline" onClick={() => setMode('setup')}>Quay lại</Button>}
           <Button onClick={saveQuiz} disabled={questions.length === 0 || !title || isSaving} isLoading={isSaving}>
             {isEditing ? 'Cập nhật' : 'Đăng bài'}
           </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Tiêu đề</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`${inputClasses} font-bold text-lg`}
            placeholder="Nhập tiêu đề bài trắc nghiệm"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Mô tả</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputClasses} resize-none`}
            placeholder="Nhập mô tả ngắn gọn..."
            rows={2}
          />
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((q, qIndex) => (
          <div key={q.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative group hover:border-indigo-300 transition-all">
            
            {/* Question Type Toggle */}
            <div className="absolute top-6 left-6 flex bg-slate-100/80 p-1.5 rounded-xl z-10 backdrop-blur-sm border border-slate-200">
              <button 
                onClick={() => updateQuestion(qIndex, 'type', 'multiple-choice')}
                className={`flex items-center px-4 py-2 text-xs font-semibold rounded-lg transition-all ${q.type === 'multiple-choice' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-900 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 border border-transparent'}`}
              >
                <ListChecks className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                Trắc nghiệm
              </button>
              <button 
                onClick={() => updateQuestion(qIndex, 'type', 'essay')}
                className={`flex items-center px-4 py-2 text-xs font-semibold rounded-lg transition-all ${q.type === 'essay' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-900 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 border border-transparent'}`}
              >
                <AlignLeft className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                Tự luận
              </button>
            </div>

            <button 
              onClick={() => removeQuestion(qIndex)}
              className="absolute top-4 right-4 text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
              title="Xóa câu hỏi"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            
            <div className="space-y-6 mt-14">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-indigo-500 mb-2">Câu hỏi {qIndex + 1}</label>
                <input 
                  type="text"
                  value={q.text}
                  onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                  className={inputClasses}
                  placeholder="Nhập câu hỏi tại đây..."
                />
              </div>

              {/* Image Upload Section */}
              <div className="space-y-2">
                {q.imageUrl ? (
                  <div className="relative w-full max-w-sm rounded-lg border border-slate-200 bg-slate-50 p-2 overflow-hidden">
                    <img src={q.imageUrl} alt="Question" className="w-full h-auto rounded-md object-contain max-h-48" />
                    <button
                      onClick={() => removeImage(qIndex)}
                      className="absolute top-2 right-2 bg-white/90 text-red-600 p-1.5 rounded-full shadow-sm hover:bg-red-50 transition-colors"
                      title="Xóa ảnh"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      id={`file-upload-${q.id}`}
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, qIndex)}
                    />
                    <label
                      htmlFor={`file-upload-${q.id}`}
                      className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 cursor-pointer transition-colors shadow-sm"
                    >
                      <ImageIcon className="w-4 h-4 mr-2 text-indigo-600" />
                      Thêm hình ảnh minh họa
                    </label>
                  </div>
                )}
              </div>

              {q.type === 'multiple-choice' ? (
                <div className="space-y-3">
                   <label className="block text-xs font-bold uppercase tracking-wide text-indigo-500 mb-1">Các lựa chọn</label>
                   {q.options.map((opt, oIndex) => (
                     <div key={oIndex} className="flex items-center space-x-3">
                        <button 
                          onClick={() => updateQuestion(qIndex, 'correctAnswerIndex', oIndex)}
                          className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${q.correctAnswerIndex === oIndex ? 'bg-green-500 border-green-500 text-white shadow-sm scale-105' : 'border-slate-200 text-transparent hover:border-green-400'}`}
                          title="Đánh dấu là câu trả lời đúng"
                        >
                          <CheckCircle2 className="h-5 w-5" />
                        </button>
                        <input 
                          type="text"
                          value={opt}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                          className={`w-full rounded-xl border p-4 text-sm transition-all duration-200 shadow-sm outline-none ${q.correctAnswerIndex === oIndex ? 'border-green-300 bg-green-50 text-green-900 font-medium placeholder-green-700/50 focus:ring-2 focus:ring-green-200' : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 hover:border-indigo-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
                          placeholder={`Lựa chọn ${oIndex + 1}`}
                        />
                     </div>
                   ))}
                </div>
              ) : (
                <div className="space-y-3">
                   <label className="block text-xs font-bold uppercase tracking-wide text-indigo-500 mb-1">Câu trả lời mẫu (Tùy chọn)</label>
                   <textarea
                     value={q.sampleAnswer || ''}
                     onChange={(e) => updateQuestion(qIndex, 'sampleAnswer', e.target.value)}
                     className={inputClasses}
                     placeholder="Cung cấp câu trả lời mẫu giúp AI chấm điểm chính xác hơn..."
                     rows={3}
                   />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-indigo-500 mb-2">Giải thích (Tùy chọn)</label>
                <input 
                  type="text"
                  value={q.explanation || ''}
                  onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                  className={inputClasses}
                  placeholder="Giải thích đáp án (hiển thị cho học sinh sau khi nộp bài)..."
                />
              </div>
            </div>
          </div>
        ))}

        <Button variant="outline" onClick={addEmptyQuestion} className="w-full border-dashed border-2 py-6 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all rounded-xl">
          <Plus className="h-5 w-5 mr-2" />
          Thêm câu hỏi
        </Button>
      </div>
    </div>
  );
};