'use client';

import React from 'react';
import { useGLTF, useAnimations, Html } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SpeechBubble } from '@/components/debate/SpeechBubble';

interface Avatar3DProps {
  id: number;
  name: string;
  role: string;
  modelUrl: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  isActive?: boolean;
  isSpeaking?: boolean;
  onClick?: () => void;
  sitting?: boolean;
  speechText?: string;
  showSpeech?: boolean;
}

export const Avatar3D: React.FC<Avatar3DProps> = ({
  id,
  name,
  role,
  modelUrl,
  position,
  rotation = [0, 0, 0],
  scale = 1,
  isActive = false,
  isSpeaking = false,
  onClick,
  sitting = true,
  speechText = '',
  showSpeech = false,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [loading, setLoading] = useState(true);

  const { scene, animations } = useGLTF(modelUrl);
  const { actions, mixer } = useAnimations(animations, groupRef);

  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          if (mesh.material) {
            const material = mesh.material as THREE.MeshStandardMaterial;
            material.needsUpdate = true;
            if (material.roughness !== undefined) {
              material.roughness = Math.max(0.3, material.roughness);
            }
          }
        }
      });
      setLoading(false);
    }
  }, [scene]);

  useEffect(() => {
    if (actions) {
      const idleAction = actions['idle'] || actions['Idle'] || Object.values(actions)[0];
      if (idleAction) {
        idleAction.reset().fadeIn(0.5).play();
      }
    }
    return () => {
      if (mixer) {
        mixer.stopAllAction();
      }
    };
  }, [actions, mixer]);

  useFrame((state) => {
    if (groupRef.current) {
      const targetScale = hovered ? scale * 1.05 : scale;
      groupRef.current.scale.setScalar(targetScale);
      const idleOffset = Math.sin(state.clock.elapsedTime * (isSpeaking ? 6 : 2)) * (isSpeaking ? 0.03 : 0.015);
      groupRef.current.position.y = position[1] + idleOffset;
    }
  });

  const glowColor = isSpeaking
    ? '#22c55e'
    : isActive
    ? '#06b6d4'
    : '#6b7280';

  const glowIntensity = isSpeaking ? 2 : isActive ? 1.5 : 0.8;

  return (
      <group position={position} rotation={rotation}>
        <group
        ref={groupRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        <primitive
          object={scene}
          scale={sitting ? 0.9 * scale : scale}
          position={sitting ? [0, -0.35, 0] : [0, 0, 0]}
        />
      </group>

      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.45, 32]} />
        <meshStandardMaterial
          color={glowColor}
          transparent
          opacity={hovered || isActive ? 0.5 : 0.25}
          emissive={glowColor}
          emissiveIntensity={hovered || isActive ? 1 : 0.4}
        />
      </mesh>

      {(hovered || isActive || isSpeaking) && (
        <>
          <pointLight
            position={[0, 1.5, 0.4]}
            intensity={glowIntensity}
            color={glowColor}
            distance={3}
            decay={2}
            castShadow
          />
          <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.48, 0.52, 32]} />
            <meshBasicMaterial
              color={glowColor}
              transparent
              opacity={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>
        </>
      )}

      {isSpeaking && (
        <mesh position={[0.6, 1.9, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial
            color="#22c55e"
            emissive="#22c55e"
            emissiveIntensity={2}
            transparent
          />
        </mesh>
      )}

      {isActive && (
        <spotLight
          position={[0, 4, 2]}
          angle={0.4}
          penumbra={1}
          intensity={1.5}
          color={glowColor}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-far={20}
          shadow-camera-left={-5}
          shadow-camera-right={5}
          shadow-camera-top={5}
          shadow-camera-bottom={-5}
        />
      )}

      {showSpeech && speechText && (
        <SpeechBubble text={speechText} position={[0, 2.5, 0]} visible={showSpeech} />
      )}

      {hovered && (
        <Html
          position={[0, 2.2, 0]}
          center
          distanceFactor={8}
          style={{
            pointerEvents: 'none',
            userSelect: 'none'
          }}
        >
          <div className="bg-gray-900/95 backdrop-blur-sm px-4 py-2 rounded-lg border border-cyan-400/50 shadow-2xl animate-fadeIn">
            <p className="text-white font-semibold text-sm whitespace-nowrap">{name}</p>
            <p className="text-gray-400 text-xs whitespace-nowrap">{role}</p>
          </div>
        </Html>
      )}

      {loading && (
        <mesh position={[0, 1, 0]}>
          <capsuleGeometry args={[0.3, 1, 4, 8]} />
          <meshStandardMaterial color="#666666" wireframe transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
};

useGLTF.preload('https://models.readyplayer.me/6419df1b40ff3b44bfc05b04.glb');
useGLTF.preload('https://models.readyplayer.me/6419df1b40ff3b44bfc05b05.glb');
useGLTF.preload('https://models.readyplayer.me/6419df1b40ff3b44bfc05b06.glb');
useGLTF.preload('https://models.readyplayer.me/6419df1b40ff3b44bfc05b07.glb');
useGLTF.preload('https://models.readyplayer.me/6419df1b40ff3b44bfc05b08.glb');

export default Avatar3D;

