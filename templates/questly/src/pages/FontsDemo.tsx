import { Canvas } from '@react-three/fiber';
import { Text, OrbitControls } from '@react-three/drei';

export default function FontsDemo() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#e0e0e0' }}>
      <Canvas camera={{ position: [0, 0, 8] }} shadows>
        <color attach="background" args={["#e0e0e0"]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.7} />
        <Text
          fontSize={2}
          color="#222"
          position={[0, 0, 0]}
          anchorX="center"
          anchorY="middle"
          maxWidth={20}
        >
          3D FONT DEMO
        </Text>
        <OrbitControls />
      </Canvas>
    </div>
  );
}
