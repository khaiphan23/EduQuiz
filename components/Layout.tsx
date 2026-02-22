import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BrainCircuit, PlusCircle, LogIn, User as UserIcon, LogOut, Trash2, Library, Share2, Settings } from 'lucide-react';
import { useAuth } from '../store/AuthContext';
import { useQuizStore } from '../store/QuizContext';
import { useTranslation } from '../hooks/useTranslation';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { quizzes } = useQuizStore();
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;
  const deletedCount = quizzes.filter(q => q.deletedAt).length;

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <BrainCircuit className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">EduQuiz</span>
          </Link>
          
          <nav className="flex items-center space-x-1 sm:space-x-4">
            
            {user && (
              <div className="flex items-center space-x-1">
                <Link to="/create">
                  <span className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${isActive('/create') ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                    <PlusCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('nav.create')}</span>
                  </span>
                </Link>

                <Link to="/library">
                  <span className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${isActive('/library') ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                    <Library className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('nav.library')}</span>
                  </span>
                </Link>
                
                <Link to="/trash">
                  <span className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${isActive('/trash') ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10'}`}>
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('nav.trash')}</span>
                    {deletedCount > 0 && (
                      <span className="ml-1 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 text-xs font-bold px-1.5 py-0.5 rounded-full">
                        {deletedCount}
                      </span>
                    )}
                  </span>
                </Link>
              </div>
            )}
            
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2 hidden sm:block"></div>

            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 overflow-hidden border border-indigo-200 dark:border-indigo-700">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      <UserIcon className="h-4 w-4" />
                    )}
                  </div>
                  <span className="hidden sm:block">{user.name}</span>
                </button>

                {isMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-20 border border-slate-100 dark:border-slate-700">
                      <div className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700 mb-1">
                        {t('nav.loggedInAs')}<br/>
                        <span className="font-medium text-slate-900 dark:text-white truncate">{user.email}</span>
                      </div>
                      
                      <button
                        onClick={() => {
                          navigate('/settings');
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        {t('nav.settings')}
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-red-600 dark:hover:text-red-400 flex items-center"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        {t('nav.logout')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <span className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    {t('nav.login')}
                  </span>
                </Link>
                <Link to="/register">
                  <span className="px-3 py-2 rounded-md text-sm font-medium bg-slate-900 dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors shadow-sm">
                    {t('nav.register')}
                  </span>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-grow w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};