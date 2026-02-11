import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import CastleBuilder from './pages/CastleBuilder';
import CharacterSelectPage from './pages/CharacterSelectPage';
import FontsDemo from './pages/FontsDemo';
import HaveYourSay from './pages/HaveYourSay';
import Settings from './pages/Settings';
import Navigation from './components/Navigation';
import MenuOverlayController from './components/MenuOverlayController';
import { useAuthStore } from './lib/auth';
import { globalAudioManager } from './systems/audio';

// Component to conditionally render MenuOverlayController
function ConditionalMenuOverlay() {
  const location = useLocation();
  // Hide Dru on splash screen (splash has its own Dru)
  const hideDru = location.pathname === '/';

  if (hideDru) return null;
  return <MenuOverlayController />;
}

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

  // Initialize global audio manager once on app mount
  useEffect(() => {
    globalAudioManager.init().then(() => {
      console.log('[App] Audio manager initialized');
    }).catch((err) => {
      console.warn('[App] Failed to initialize audio manager:', err);
    });
  }, []);

  return (
    <HashRouter>
      <div className="min-h-screen font-sans text-foreground selection:bg-primary/20">
        <Navigation />
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/menu" element={<MainMenu />} />
          <Route path="/builder" element={<CastleBuilder />} />
          <Route path="/game-builder" element={<GameBuilder />} />
          <Route path="/quest-type" element={<QuestTypeSelector />} />
          <Route path="/templates" element={<TemplateQuests />} />
          <Route path="/character-select" element={<CharacterSelectPage />} />
          <Route path="/world-builder" element={<WorldBuilder />} />
          <Route path="/world-preview" element={<WorldPreview />} />
          <Route path="/quest-settings" element={<QuestSettings />} />
          <Route path="/quest-complete" element={<QuestComplete />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/test-world" element={<TestWorld />} />
          <Route path="/fonts-demo" element={<FontsDemo />} />
          <Route path="/have-your-say" element={<HaveYourSay />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Original Dru Helper - appears on all pages except splash */}
        <ConditionalMenuOverlay />
      </div>
    </HashRouter>
  );
}

export default App;
