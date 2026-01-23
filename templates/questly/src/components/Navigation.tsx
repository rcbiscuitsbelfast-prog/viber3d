import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Settings, Music, LogIn, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/lib/auth';

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMusicOn, setIsMusicOn] = useState(true);
  
  const { isAuthenticated, user } = useAuthStore();

  // Don't show on splash screen
  if (location.pathname === '/') return null;

  const handleAuthClick = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      // Mock sign in for now
      useAuthStore.getState().signIn('demo@questly.com', 'password');
      navigate('/dashboard');
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 p-4 pointer-events-none">
      <div className="max-w-7xl mx-auto flex justify-between items-center pointer-events-auto">
        <Link to="/menu">
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="bg-primary p-3 rounded-lg shadow-lg border-b-4 border-primary/70 group-hover:-translate-y-1 transition-transform">
              <Home className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl text-primary font-bold hidden sm:block">
              Questly
            </span>
          </div>
        </Link>

        <div className="flex gap-3">
          {/* Auth Button - Sign In or Dashboard */}
          <button
            onClick={handleAuthClick}
            className="
              bg-primary px-4 py-3 rounded-lg shadow-lg border-b-4 border-primary/70
              transition-all hover:scale-105 active:translate-y-1 active:border-b-2
              flex items-center gap-2 font-bold text-primary-foreground
            "
          >
            {isAuthenticated ? (
              <>
                <LayoutDashboard className="w-5 h-5" />
                <span className="hidden sm:inline">Dashboard</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span className="hidden sm:inline">Sign In</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsMusicOn(!isMusicOn)}
            className={`
              bg-primary p-3 rounded-lg shadow-lg border-b-4 border-primary/70
              transition-all hover:scale-105 active:translate-y-1 active:border-b-2
              ${!isMusicOn && 'opacity-50'}
            `}
          >
            <Music className="w-5 h-5 text-primary-foreground" />
          </button>

          <button
            className="
              bg-primary p-3 rounded-lg shadow-lg border-b-4 border-primary/70
              transition-all hover:scale-105 active:translate-y-1 active:border-b-2
            "
          >
            <Settings className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
      </div>
    </nav>
  );
}
