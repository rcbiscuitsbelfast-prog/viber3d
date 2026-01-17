import { useNavigate } from 'react-router-dom';

export function AccountPage() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black text-white relative">
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 right-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-all z-10"
      >
        ← Back to Home
      </button>
      <div className="container mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold mb-8">Account</h1>
        <p className="text-xl text-gray-300">
          Manage your subscription and quest settings
        </p>
      </div>
    </div>
  );
}
