'use client';

import { useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { Agent } from '@/lib/types';

interface Participant3DProps {
  participant: Agent;
  position: [number, number, number];
  onClick: () => void;
}

export function Participant3D({ participant, position, onClick }: Participant3DProps) {
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Carregar textura se houver URL de avatar
  useEffect(() => {
    const avatarUrl = participant.avatar || '';
    const isEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(avatarUrl);
    const isUrl = avatarUrl.startsWith('http') || avatarUrl.startsWith('/');

    if (isUrl && !isEmoji) {
      const loader = new THREE.TextureLoader();
      loader.load(
        avatarUrl,
        (loadedTexture) => {
          setTexture(loadedTexture);
        },
        undefined,
        (error) => {
          console.error('Erro ao carregar textura:', error);
          setTexture(null);
        }
      );
    } else {
      setTexture(null);
    }
  }, [participant.avatar]);

  // Animações sutis de idle
  useFrame((state) => {
    if (groupRef.current && !hovered && !clicked) {
      // Breathing effect sutil
      const breathing = Math.sin(state.clock.elapsedTime * 0.8) * 0.02;
      groupRef.current.position.y = position[1] + breathing;
    }
  });

  // Usar avatar do participante ou fallback
  const avatarUrl = participant.avatar || '';
  const isEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(avatarUrl);

  return (
    <group 
      ref={groupRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={() => {
        setClicked(true);
        onClick();
        setTimeout(() => setClicked(false), 300);
      }}
    >
      {/* Container principal do participante */}
      <motion.group
        animate={{
          scale: hovered ? 1.1 : clicked ? 0.95 : 1,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Avatar - Plano com imagem ou emoji */}
        <mesh
          ref={meshRef}
          castShadow
          receiveShadow
        >
          <planeGeometry args={[1.2, 1.5]} />
          {isEmoji || !texture ? (
            <meshStandardMaterial 
              color={participant.color || "#3B82F6"}
              emissive={hovered ? new THREE.Color(0x06b6d4) : new THREE.Color(participant.color || 0x1e3a8a)}
              emissiveIntensity={hovered ? 0.5 : 0.2}
            />
          ) : (
            <meshStandardMaterial 
              map={texture}
              transparent
              side={THREE.DoubleSide}
            />
          )}
        </mesh>

        {/* Glow effect quando hover */}
        {hovered && (
          <pointLight 
            position={[0, 0, 0.5]} 
            intensity={1} 
            color="#06B6D4" 
            distance={3}
          />
        )}
      </motion.group>

      {/* Tooltip com nome e cargo */}
      {hovered && (
        <Html position={[0, -1.2, 0]} center>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gray-900/95 backdrop-blur-sm px-4 py-2 rounded-lg border border-cyan-400/50 shadow-2xl pointer-events-none"
          >
            <p className="text-white font-semibold text-sm whitespace-nowrap">
              {participant.name}
            </p>
            <p className="text-gray-400 text-xs whitespace-nowrap">
              {participant.role}
            </p>
          </motion.div>
        </Html>
      )}

      {/* Indicador visual de emoji se não houver imagem */}
      {isEmoji && (
        <Html position={[0, 0, 0.1]} center>
          <div className="text-6xl pointer-events-none">
            {participant.avatar}
          </div>
        </Html>
      )}

      {/* Sombra projetada */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
        receiveShadow
      >
        <circleGeometry args={[0.8, 32]} />
        <meshStandardMaterial 
          color="#000000"
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
}
