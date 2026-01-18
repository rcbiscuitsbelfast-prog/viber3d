import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUpEmail, signInEmail, signOut, onAuthStateChange, getCurrentUser } from '../services/auth/authService';
import type { User } from 'firebase/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    
    const unsubscribe = onAuthStateChange((user) => {
      setCurrentUser(user);
    });
    
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        await signUpEmail(email, password);
      } else {
        await signInEmail(email, password);
      }
      navigate('/builder');
    } catch (err) {
      console.error('[LoginPage] Auth error:', err);
      setError((err as Error).message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('[LoginPage] Sign out error:', err);
      setError((err as Error).message || 'Sign out failed');
    }
  };

  if (currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black flex items-center justify-center relative">
        <button
          onClick={() => navigate('/')}
          className="absolute top-6 right-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-all"
        >
          ← Back to Home
        </button>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-md w-full border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">
            You're Signed In
          </h1>
          <p className="text-gray-300 text-center mb-4">
            Email: {currentUser.email}
          </p>
          <p className="text-gray-400 text-xs text-center mb-8">
            UID: {currentUser.uid}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/builder')}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:from-green-700 hover:to-blue-700 transition-all"
            >
              Go to Builder
            </button>
            <button
              onClick={handleSignOut}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black flex items-center justify-center relative">
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 right-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-all"
      >
        ← Back to Home
      </button>
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-md w-full border border-white/20">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </h1>
        <p className="text-gray-300 text-center mb-8">
          {isSignUp ? 'Create an account to start creating quests' : 'Sign in to start creating quests'}
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white mb-2 text-sm">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your@email.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-white mb-2 text-sm">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}
