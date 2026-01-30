import { Link, useNavigate } from 'react-router-dom';
import { Home, Settings, Music, LogIn, LayoutDashboard, X } from 'lucide-react';
import { useAuthStore } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface SidebarMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SidebarMenu({ isOpen, onClose }: SidebarMenuProps) {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [isMusicOn, setIsMusicOn] = useState(true);

  const handleAuthClick = () => {
    onClose();
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      // Mock sign in for now
      useAuthStore.getState().signIn('demo@questly.com', 'password');
      navigate('/dashboard');
    }
  };

  const menuItems = [
    { label: 'Main Menu', icon: Home, href: '/menu' },
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', requireAuth: true },
  ];

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-72 bg-slate-900/98 backdrop-blur-lg border-r-2 border-slate-700 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b-2 border-slate-700 bg-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="bg-primary p-2 rounded-lg">
                  <Home className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-display text-xl text-primary font-bold">Questly</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-slate-300" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {menuItems.map((item) => {
                if (item.requireAuth && !isAuthenticated) return null;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={onClose}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-300 hover:text-white"
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t-2 border-slate-700 space-y-2">
              {/* Auth Button */}
              <button
                onClick={handleAuthClick}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-primary hover:bg-primary/90 transition-colors font-bold text-primary-foreground"
              >
                {isAuthenticated ? (
                  <>
                    <LayoutDashboard className="w-5 h-5" />
                    <span>Dashboard</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>Sign In</span>
                  </>
                )}
              </button>

              {/* Music Toggle */}
              <button
                onClick={() => setIsMusicOn(!isMusicOn)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isMusicOn
                    ? 'bg-slate-800 hover:bg-slate-700 text-white'
                    : 'bg-slate-800/50 hover:bg-slate-800 text-slate-400'
                }`}
              >
                <Music className="w-5 h-5" />
                <span className="font-medium">{isMusicOn ? 'Music On' : 'Music Off'}</span>
              </button>

              {/* Settings - Coming Soon */}
              <button
                disabled
                className="flex items-center gap-3 p-3 rounded-lg opacity-50 cursor-not-allowed text-slate-500"
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">Settings (Soon)</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
