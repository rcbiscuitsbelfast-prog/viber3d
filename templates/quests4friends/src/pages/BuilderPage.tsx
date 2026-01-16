import { Link } from 'react-router-dom';

export function BuilderPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-black">
      <div className="container mx-auto px-6 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-6">Quest Builder</h1>
          <p className="text-xl text-gray-300 mb-8">
            Create your own interactive quest experience
          </p>
          <p className="text-lg text-gray-400 mb-12">
            (Quest builder is coming soon!)
          </p>
          
          <Link
            to="/"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-8 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
