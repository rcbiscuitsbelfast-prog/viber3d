import { useNavigate } from 'react-router-dom';
import { QuestPlayer } from '../components/game/QuestPlayer';

export function QuestPlayerPage() {
  const navigate = useNavigate();
  
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => navigate('/')}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          padding: '10px 20px',
          backgroundColor: '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold'
        }}
      >
        ← Back to Home
      </button>
      <QuestPlayer />
    </div>
  );
}
