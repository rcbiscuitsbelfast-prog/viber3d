import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const navigate = useNavigate();
  
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
          Sign In
        </h1>
        <p className="text-gray-300 text-center mb-8">
          Sign in to start creating quests
        </p>
        <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all">
          Sign In with Google
        </button>
      </div>
    </div>
  );
}
