import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { QuestPlayerPage } from './pages/QuestPlayerPage';
import { BuilderPage } from './pages/BuilderPage';
import { LoginPage } from './pages/LoginPage';
import { AccountPage } from './pages/AccountPage';
import { ToonShooterPage } from './pages/ToonShooterPage';
import MinimalDemo from './pages/MinimalDemoPage';
import TileWorldDemoPage from './pages/TileWorldDemoPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/play/:questId" element={<QuestPlayerPage />} />
        <Route path="/builder" element={<BuilderPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/toonshooter" element={<ToonShooterPage />} />
        <Route path="/minimal-demo" element={<MinimalDemo />} />
        <Route path="/tile-world-demo" element={<TileWorldDemoPage />} />
      </Routes>
    </BrowserRouter>
  );
}
