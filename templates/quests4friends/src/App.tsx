import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { HomePage } from './pages/HomePage';
import { SplashScreen } from './pages/SplashScreen';
import { MainMenuPage } from './pages/MainMenuPage';
import { ComingSoonPage } from './pages/ComingSoonPage';
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
import { KennyBlocks } from './pages/KennyBlocksPage';
import { KennyWorld } from './pages/KennyWorldPage';
import { KennyDemo } from './pages/KennyDemoPage';
import { TestAssetPage } from './pages/TestAssetPage';
import { R3FDemoPage } from './pages/R3FDemoPage';
import { R3FBlobPage } from './pages/R3FBlobPage';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/splash" element={<SplashScreen />} />
          <Route path="/menu" element={<MainMenuPage />} />
          <Route path="/coming-soon" element={<ComingSoonPage />} />
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
          <Route path="/kenny-blocks" element={<KennyBlocks />} />
          <Route path="/kenny-world" element={<KennyWorld />} />
          <Route path="/kenny-demo" element={<KennyDemo />} />
          <Route path="/test-asset" element={<TestAssetPage />} />
          <Route path="/r3f-demo" element={<R3FDemoPage />} />
          <Route path="/r3f-blob" element={<R3FBlobPage />} />
          <Route path="/tile-editor" element={<TileEditorPage />} />
          <Route path="/world-builder" element={<WorldBuilderPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
