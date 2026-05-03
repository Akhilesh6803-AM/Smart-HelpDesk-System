import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import ChatbotWidget from './components/ChatbotWidget';
import Spinner from './components/Spinner';

import { Suspense, lazy } from 'react';

// Pages
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import TicketsPage from './pages/TicketsPage';
import AdminPage from './pages/AdminPage';
import NoticesPage from './pages/NoticesPage';
import FAQsPage from './pages/FAQsPage';
import ProfilePage from './pages/ProfilePage';

const HomePage = lazy(() => import('./pages/HomePage'));

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  if (!user) return <Navigate to="/auth" />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  if (!user || user.role !== 'admin') return <Navigate to="/dashboard" />;
  return children;
};

const PublicLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col relative overflow-hidden">
    {/* Unified Global Background */}
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div className="absolute inset-0 dot-pattern"></div>
      <div className="mesh-blob bg-blue-600/10 w-[500px] h-[500px] top-[-100px] left-[-100px]" style={{ animationDelay: '0s' }}></div>
      <div className="mesh-blob bg-purple-600/10 w-[600px] h-[600px] top-[40%] right-[-200px]" style={{ animationDelay: '-4s' }}></div>
      <div className="mesh-blob bg-orange-500/5 w-[400px] h-[400px] bottom-[-100px] left-[20%]" style={{ animationDelay: '-8s' }}></div>
    </div>
    
    <div className="relative z-10 flex flex-col flex-1">
      <Navbar />
      <main className="flex-1">{children}</main>
      <ChatbotWidget />
    </div>
  </div>
);

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  }

  return (
    <Routes>
      <Route path="/" element={
        <PublicLayout>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>}>
            <HomePage />
          </Suspense>
        </PublicLayout>
      } />
      <Route path="/auth" element={user ? <Navigate to="/" /> : <AuthPage />} />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><PublicLayout><Dashboard /></PublicLayout></ProtectedRoute>} />
      <Route path="/tickets" element={<ProtectedRoute><PublicLayout><TicketsPage /></PublicLayout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><PublicLayout><ProfilePage /></PublicLayout></ProtectedRoute>} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<AdminRoute><PublicLayout><AdminPage /></PublicLayout></AdminRoute>} />
      
      {/* Public Routes */}
      <Route path="/notices" element={<PublicLayout><NoticesPage /></PublicLayout>} />
      <Route path="/faqs" element={<PublicLayout><FAQsPage /></PublicLayout>} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <AppRoutes />
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
