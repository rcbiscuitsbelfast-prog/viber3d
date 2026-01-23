import { Suspense } from 'react';
import { Logo } from '../components/r3f/Examples';
import { View, Common } from '../components/r3f/View';
import { R3FLayout } from '../components/r3f/R3FLayout';
import { useNavigate } from 'react-router-dom';

export function R3FDemoPage() {
  const navigate = useNavigate();

  return (
    <R3FLayout>
      <div style={{ width: '100vw', minHeight: '100vh', position: 'relative' }}>
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
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

        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '80px 20px 20px 20px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          {/* Header */}
          <div style={{ 
            width: '100%',
            textAlign: 'center',
            marginBottom: '40px',
          }}>
            <h1 style={{ 
              fontSize: '3rem', 
              fontWeight: 'bold',
              background: 'linear-gradient(to right, #1fb2f5, hotpink)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '20px',
            }}>
              React Three Fiber Demo
            </h1>
            <p style={{ fontSize: '1.2rem', color: '#666' }}>
              Interactive 3D graphics powered by React Three Fiber
            </p>
          </div>

          {/* Main 3D View */}
          <div style={{ 
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '40px',
          }}>
            <div style={{ 
              width: '100%', 
              display: 'flex',
              flexDirection: window.innerWidth < 768 ? 'column' : 'row',
              gap: '20px',
            }}>
              <div style={{ flex: 1, padding: '20px' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Interactive Logo</h2>
                <p style={{ color: '#666', marginBottom: '20px' }}>
                  Click to navigate, drag to rotate
                </p>
              </div>
              
              <div style={{ flex: 1 }}>
                <View className='h-96 w-full'>
                  <Suspense fallback={null}>
                    <Logo route='/r3f-blob' scale={0.6} position={[0, 0, 0]} />
                    <Common />
                  </Suspense>
                </View>
              </div>
            </div>

            {/* Second Row */}
            <div style={{ 
              width: '100%',
              padding: '40px 20px',
              background: 'rgba(0,0,0,0.02)',
              borderRadius: '10px',
            }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', textAlign: 'center' }}>
                Features
              </h2>
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(3, 1fr)',
                gap: '20px',
              }}>
                <div style={{ padding: '20px', background: 'white', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⚡</div>
                  <h3 style={{ fontWeight: 'bold', marginBottom: '10px' }}>Fast</h3>
                  <p style={{ color: '#666', fontSize: '0.9rem' }}>Optimized rendering with no canvas unmounting</p>
                </div>
                <div style={{ padding: '20px', background: 'white', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🎨</div>
                  <h3 style={{ fontWeight: 'bold', marginBottom: '10px' }}>Flexible</h3>
                  <p style={{ color: '#666', fontSize: '0.9rem' }}>Use 3D components anywhere in your DOM</p>
                </div>
                <div style={{ padding: '20px', background: 'white', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🚀</div>
                  <h3 style={{ fontWeight: 'bold', marginBottom: '10px' }}>Modern</h3>
                  <p style={{ color: '#666', fontSize: '0.9rem' }}>Built on Next.js and React Three Fiber</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </R3FLayout>
  );
}