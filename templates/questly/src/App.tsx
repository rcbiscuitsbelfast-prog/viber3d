import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import SplashScreen from './pages/SplashScreen';
import MainMenu from './pages/MainMenu';
import GameBuilder from './pages/GameBuilder';
import QuestTypeSelector from './pages/QuestTypeSelector';
import TemplateQuests from './pages/TemplateQuests';
import UserDashboard from './pages/UserDashboard';
import TestWorld from './pages/TestWorld';
import WorldBuilder from './pages/WorldBuilder';
import WorldPreview from './pages/WorldPreview';
import QuestSettings from './pages/QuestSettings';
import QuestComplete from './pages/QuestComplete';
import Navigation from './components/Navigation';
import { useAuthStore } from './lib/auth';

function App() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    // Initialize auth on app mount
    try {
      initialize();
    } catch (error) {
      console.warn('Auth initialization failed:', error);
    }
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
          <Route path="/world-builder" element={<WorldBuilder />} />
          <Route path="/world-preview" element={<WorldPreview />} />
          <Route path="/quest-settings" element={<QuestSettings />} />
          <Route path="/quest-complete" element={<QuestComplete />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/test-world" element={<TestWorld />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
