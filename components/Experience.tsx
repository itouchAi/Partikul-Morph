import React, { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { MagicParticles } from './MagicParticles';
import * as THREE from 'three';

type PresetType = 'none' | 'electric' | 'fire' | 'water' | 'mercury';
type AudioMode = 'none' | 'file' | 'mic';

interface ExperienceProps {
  text: string;
  image: string | null;
  useImageColors: boolean;
  particleColor: string;
  disableInteraction: boolean;
  depthIntensity: number;
  repulsionStrength: number;
  repulsionRadius: number;
  particleCount: number;
  particleSpacing: number;
  activePreset: PresetType;
  audioMode: AudioMode;
  audioUrl: string | null;
}

export const Experience: React.FC<ExperienceProps> = ({ 
  text, 
  image, 
  useImageColors, 
  particleColor, 
  disableInteraction, 
  depthIntensity,
  repulsionStrength,
  repulsionRadius,
  particleCount,
  particleSpacing,
  activePreset,
  audioMode,
  audioUrl
}) => {
  const controlsRef = useRef<any>(null);
  
  const previousPositions = useRef<Float32Array | null>(null);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }, [text, image]);

  return (
    <Canvas
      camera={{ position: [0, 0, 15], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={['#000000']} />
      
      <OrbitControls 
        ref={controlsRef}
        enablePan={false} 
        enableDamping 
        dampingFactor={0.05} 
        minDistance={2} 
        maxDistance={50}
        rotateSpeed={0.5}
        mouseButtons={{
          LEFT: undefined as unknown as THREE.MOUSE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE
        }}
      />

      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />

      <MagicParticles 
        text={text} 
        image={image}
        useImageColors={useImageColors}
        color={particleColor} 
        disableMouseRepulsion={disableInteraction} 
        depthIntensity={depthIntensity}
        repulsionStrength={repulsionStrength}
        repulsionRadius={repulsionRadius}
        particleCount={particleCount}
        particleSpacing={particleSpacing}
        previousPositions={previousPositions}
        activePreset={activePreset}
        audioMode={audioMode}
        audioUrl={audioUrl}
      />
    </Canvas>
  );
};