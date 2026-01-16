import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { QuestPlayerPage } from './pages/QuestPlayerPage';
import { BuilderPage } from './pages/BuilderPage';
import { LoginPage } from './pages/LoginPage';
import { AccountPage } from './pages/AccountPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/play/:questId" element={<QuestPlayerPage />} />
        <Route path="/builder" element={<BuilderPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/account" element={<AccountPage />} />
      </Routes>
    </BrowserRouter>
  );
}
