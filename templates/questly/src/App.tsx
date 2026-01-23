import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import SplashScreen from './pages/SplashScreen';
import MainMenu from './pages/MainMenu';
import GameBuilder from './pages/GameBuilder';
import QuestTypeSelector from './pages/QuestTypeSelector';
import TemplateQuests from './pages/TemplateQuests';
import UserDashboard from './pages/UserDashboard';
import Navigation from './components/Navigation';
import { useAuthStore } from './lib/auth';

function App() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    // Initialize auth on app mount
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <div className="min-h-screen font-sans text-foreground selection:bg-primary/20">
        <Navigation />
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/menu" element={<MainMenu />} />
          <Route path="/builder" element={<GameBuilder />} />
          <Route path="/quest-type" element={<QuestTypeSelector />} />
          <Route path="/templates" element={<TemplateQuests />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
