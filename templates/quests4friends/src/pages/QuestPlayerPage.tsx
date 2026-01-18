import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QuestPlayer } from '../components/game/QuestPlayer';
import { getQuestById } from '../services/firestore/questService';
import { Quest as FirestoreQuest } from '../types/firestore.types';

export function QuestPlayerPage() {
  const navigate = useNavigate();
  const { questId } = useParams<{ questId: string }>();
  const [quest, setQuest] = useState<FirestoreQuest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!questId) {
      console.error('[QuestPlayerPage] No questId provided');
      setError('No quest ID provided');
      setLoading(false);
      return;
    }

    console.log('[QuestPlayerPage] Loading quest:', questId);

    getQuestById(questId)
      .then((fetchedQuest) => {
        if (fetchedQuest) {
          console.log('[QuestPlayerPage] Quest loaded:', fetchedQuest);
          setQuest(fetchedQuest);
        } else {
          console.error('[QuestPlayerPage] Quest not found:', questId);
          setError('Quest not found');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('[QuestPlayerPage] Failed to load quest:', err);
        setError('Failed to load quest');
        setLoading(false);
      });
  }, [questId]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(to bottom, #1a1a2e, #16213e, #0f3460)'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ 
            fontSize: '48px', 
            marginBottom: '20px',
            animation: 'spin 2s linear infinite'
          }}>⏳</div>
          <p style={{ fontSize: '18px' }}>Loading quest...</p>
        </div>
      </div>
    );
  }

  if (error || !quest) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(to bottom, #1a1a2e, #16213e, #0f3460)'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
          <p style={{ fontSize: '18px', marginBottom: '20px' }}>{error || 'Quest not found'}</p>
          <button
            onClick={() => navigate('/')}
            style={{
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
        </div>
      </div>
    );
  }
  
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
