
import React, { useState, useMemo } from 'react';
import { LoginCard } from './components/LoginCard';
import { Dashboard } from './components/Dashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { loginUser } from './services/authService';
import { LoginRequest, Role } from './types';
import { ThemeLanguageProvider } from './contexts/ThemeLanguageContext';
import { Loader2, Sparkles } from 'lucide-react';

const AppContent: React.FC = () => {
  const [authData, setAuthData] = useState<{
    view: 'login' | 'dashboard' | 'admin';
    credentials: LoginRequest | null;
    userRole: Role | null;
    userName: string;
  }>(() => {
    try {
      const savedCreds = localStorage.getItem('vidyasetu_creds');
      const savedRole = localStorage.getItem('vidyasetu_role');
      const savedName = localStorage.getItem('vidyasetu_name');

      if (savedCreds && savedRole) {
        return {
          view: savedRole === 'admin' ? 'admin' : 'dashboard',
          credentials: JSON.parse(savedCreds),
          userRole: savedRole as Role,
          userName: savedName || ''
        };
      }
    } catch (e) {
      console.error("Auth init error:", e);
    }
    return { view: 'login', credentials: null, userRole: null, userName: '' };
  });

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async (creds: LoginRequest) => {
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const response = await loginUser(creds);
      
      if (response.status === 'success') {
          const role = response.user_role || response.role || 'teacher';
          const name = response.user_name || '';
          
          try {
            localStorage.setItem('vidyasetu_creds', JSON.stringify(creds));
            localStorage.setItem('vidyasetu_role', role);
            localStorage.setItem('vidyasetu_name', name);
          } catch(storageErr) {}
          
          setAuthData({
            view: role === 'admin' ? 'admin' : 'dashboard',
            credentials: creds,
            userRole: role,
            userName: name
          });
      } else {
          setLoginError(response.message || 'Invalid credentials');
      }
    } catch (error) {
      setLoginError('Cloud connection lost. Check internet.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    try {
        localStorage.clear();
        window.history.pushState(null, '', window.location.href);
    } catch (e) {}
    setAuthData({ view: 'login', credentials: null, userRole: null, userName: '' });
  };

  // Switch Case for immediate rendering based on initial synchronous state
  switch(authData.view) {
    case 'admin':
      return <AdminDashboard onLogout={handleLogout} userName={authData.userName} />;
    case 'dashboard':
      if (authData.credentials && authData.userRole) {
        return <Dashboard credentials={authData.credentials} role={authData.userRole} userName={authData.userName} onLogout={handleLogout} />;
      }
      return <LoginCard onSubmit={handleLogin} isLoading={isLoggingIn} error={loginError} />;
    default:
      return <LoginCard onSubmit={handleLogin} isLoading={isLoggingIn} error={loginError} />;
  }
};

const App: React.FC = () => (
  <ThemeLanguageProvider>
    <div className="fixed inset-0 bg-[#F8FAFC] dark:bg-dark-950 transition-colors">
      <AppContent />
    </div>
  </ThemeLanguageProvider>
);

export default App;
