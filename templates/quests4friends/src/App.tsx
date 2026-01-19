import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { HomePage } from './pages/HomePage';
import { QuestPlayerPage } from './pages/QuestPlayerPage';
import { BuilderPage } from './pages/BuilderPage';
import { LoginPage } from './pages/LoginPage';
import { AccountPage } from './pages/AccountPage';
import { ToonShooterPage } from './pages/ToonShooterPage';
import { MinimalDemo } from './pages/MinimalDemoPage';
import TileWorldDemoPage from './pages/TileWorldDemoPage';
import { WorldCanvasBuilderPage } from './pages/WorldCanvasBuilderPage';
import { TileCreation } from './pages/TileCreationPage';
import TileEditorPage from './pages/TileEditorPage';
import WorldBuilderPage from './pages/WorldBuilderPage';
import WorldFromTilesPage from './pages/WorldFromTilesPage';

export default function App() {
  return (
    <ThemeProvider>
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
          <Route path="/world-canvas-builder" element={<WorldCanvasBuilderPage />} />
          <Route path="/tile-creation" element={<TileCreation />} />
          <Route path="/world-from-tiles" element={<WorldFromTilesPage />} />
          <Route path="/tile-editor" element={<TileEditorPage />} />
          <Route path="/world-builder" element={<WorldBuilderPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
