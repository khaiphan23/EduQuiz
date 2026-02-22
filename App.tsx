import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QuizProvider } from './store/QuizContext';
import { AuthProvider } from './store/AuthContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { CreateQuiz } from './pages/CreateQuiz';
import { TakeQuiz } from './pages/TakeQuiz';
import { QuizResult } from './pages/QuizResult';
import { QuizStats } from './pages/QuizStats';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Trash } from './pages/Trash';
import { LibraryPage } from './pages/Library';
import { Settings } from './pages/Settings';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <QuizProvider>
        <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/create" element={<CreateQuiz />} />
              <Route path="/edit/:id" element={<CreateQuiz />} />
              <Route path="/quiz/:id" element={<TakeQuiz />} />
              <Route path="/q/:id" element={<TakeQuiz />} />
              <Route path="/result/:id" element={<QuizResult />} />
              <Route path="/stats/:id" element={<QuizStats />} />
              <Route path="/trash" element={<Trash />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </HashRouter>
      </QuizProvider>
    </AuthProvider>
  );
};

export default App;