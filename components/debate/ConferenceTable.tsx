'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function ConferenceTable() {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Animação sutil de entrada
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Superfície da mesa - Formato curvo */}
      <mesh 
        ref={meshRef}
        position={[0, 0.75, 0]} 
        receiveShadow
        castShadow
      >
        {/* Geometria da mesa - forma curva/semicircular */}
        <boxGeometry args={[8, 0.1, 3]} />
        <meshStandardMaterial 
          color="#3E2723"
          roughness={0.2}
          metalness={0.1}
          envMapIntensity={0.5}
          precision="highp"
        />
      </mesh>

      {/* Detalhes da mesa - bordas */}
      <mesh 
        position={[0, 0.7, 0]} 
        castShadow
      >
        <boxGeometry args={[8.2, 0.05, 3.2]} />
        <meshStandardMaterial 
          color="#2C1810"
          roughness={0.3}
        />
      </mesh>

      {/* Base da mesa - centro */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.4, 0.7, 32]} />
        <meshStandardMaterial 
          color="#2C1810" 
          roughness={0.3}
        />
      </mesh>

      {/* Pés da mesa - laterais */}
      {[-3.5, 3.5].map((x, i) => (
        <mesh key={i} position={[x, 0.4, 1]} castShadow>
          <cylinderGeometry args={[0.1, 0.15, 0.8, 16]} />
          <meshStandardMaterial 
            color="#1A0E08" 
            roughness={0.5}
          />
        </mesh>
      ))}

      {/* Reflexo sutil na superfície */}
      <mesh 
        position={[0, 0.755, 0]} 
      >
        <planeGeometry args={[8, 3]} />
        <meshStandardMaterial 
          color="#4A2C2A"
          transparent
          opacity={0.1}
          roughness={0.1}
        />
      </mesh>
    </group>
  );
}

