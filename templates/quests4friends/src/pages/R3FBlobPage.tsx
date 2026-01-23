import { Blob } from '../components/r3f/Examples';
import { View, Common } from '../components/r3f/View';
import { R3FLayout } from '../components/r3f/R3FLayout';
import { useNavigate } from 'react-router-dom';

export function R3FBlobPage() {
  const navigate = useNavigate();

  return (
    <R3FLayout>
      <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        {/* Back Button */}
        <button
          onClick={() => navigate('/r3f-demo')}
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            zIndex: 100,
            padding: '10px 20px',
            background: '#333',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          ← Back
        </button>

        {/* Content */}
        <div style={{ 
          position: 'absolute',
          top: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          zIndex: 10,
          maxWidth: '600px',
          padding: '20px',
        }}>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: 'bold',
            marginBottom: '20px',
            color: '#1fb2f5',
          }}>
            Interactive Blob
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#666' }}>
            Drag to rotate, scroll to zoom. Click to go back to demo.
          </p>
        </div>

        {/* 3D View - Full Screen */}
        <View style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0,
          width: '100%',
          height: '100%',
        }}>
          <Blob route="/r3f-demo" />
          <Common />
        </View>
      </div>
    </R3FLayout>
  );
}