import React from 'react';
import { useAuth } from './hooks/useAuth';
import AuthPage from './pages/AuthPage';
import MainApp from './MainApp';

const App: React.FC = () => {
  const { currentUser } = useAuth();
  return currentUser ? <MainApp /> : <AuthPage />;
};

export default App;
