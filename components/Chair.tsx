'use client';

import { ReactNode } from 'react';
import * as THREE from 'three';

interface ChairProps {
  position: [number, number, number];
  rotation: [number, number, number];
}

export const Chair: React.FC<ChairProps> = ({ position, rotation }) => {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.6, 0.08, 0.6]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.9, -0.25]} castShadow>
        <boxGeometry args={[0.6, 0.8, 0.08]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.7} />
      </mesh>
      {[
        [-0.25, 0.25, -0.25],
        [0.25, 0.25, -0.25],
        [-0.25, 0.25, 0.25],
        [0.25, 0.25, 0.25],
      ].map((coord, i) => (
        <mesh key={i} position={coord as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.3, 0.05, 32]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.6} />
      </mesh>
    </group>
  );
};

