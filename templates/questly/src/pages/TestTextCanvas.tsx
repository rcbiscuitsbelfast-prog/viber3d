import { Canvas } from '@react-three/fiber';
import { Text } from '@react-three/drei';

export default function TestTextCanvas() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#e0e0e0' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <color attach="background" args={["#e0e0e0"]} />
        <Text
          fontSize={1}
          color="black"
          position={[0, 0, 0.5]}
          anchorX="center"
          anchorY="middle"
          maxWidth={10}
        >
          Questerly
        </Text>
      </Canvas>
    </div>
  );
}
