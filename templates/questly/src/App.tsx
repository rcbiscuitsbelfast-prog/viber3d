import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SplashScreen from './pages/SplashScreen';
import MainMenu from './pages/MainMenu';
import GameBuilder from './pages/GameBuilder';
import Navigation from './components/Navigation';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen font-sans text-foreground selection:bg-primary/20">
        <Navigation />
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/menu" element={<MainMenu />} />
          <Route path="/builder" element={<GameBuilder />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
