'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Html, useProgress } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { motion, AnimatePresence } from 'framer-motion';
import { Agent, Message } from '@/lib/types';
import { ConferenceTable } from './ConferenceTable';
import { Participant3D } from './Participant3D';
import { RealisticLighting } from './RealisticLighting';
import { SpeechBubble } from './SpeechBubble';
import { ZoomIn, ZoomOut, RefreshCw, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar3D } from '@/components/Avatar3D';
import { Chair } from '@/components/Chair';

interface RoundTableDebateProps {
  participants: Agent[];
  messages?: Message[];
  onParticipantClick?: (participantId: string) => void;
  isActive?: boolean;
}

const readyPlayerParticipants = [
  { id: 1, name: 'Mark Zuckerberg', role: 'CEO - Meta', modelUrl: 'https://models.readyplayer.me/691f746e7b7a88e1f65712b0.glb' },
  { id: 2, name: 'Bill Gates', role: 'Co-founder - Microsoft', modelUrl: 'https://models.readyplayer.me/691f7899786317131cdbf9b6.glb' },
  { id: 3, name: 'Jeff Bezos', role: 'Founder - Amazon', modelUrl: 'https://models.readyplayer.me/691f7899786317131cdbf9b6.glb' },
  { id: 4, name: 'Elon Musk', role: 'CEO - Tesla & SpaceX', modelUrl: 'https://models.readyplayer.me/691f7948fb99478e412e3ced.glb' },
  { id: 5, name: 'Tim Cook', role: 'CEO - Apple', modelUrl: 'https://models.readyplayer.me/691f780d5f9f523e5093bd3d.glb' }
];

const avatarPositions: Record<number, [number, number, number]> = {
  1: [-3.5, 0.6, 2.8],
  2: [-1.8, 0.6, 2.2],
  3: [0, 0.6, 1.8],
  4: [1.8, 0.6, 2.2],
  5: [3.5, 0.6, 2.8]
};

const avatarRotations: Record<number, [number, number, number]> = {
  1: [0, 0.5, 0],
  2: [0, 0.25, 0],
  3: [0, 0, 0],
  4: [0, -0.25, 0],
  5: [0, -0.5, 0]
};

const chairPositions: Record<number, [number, number, number]> = {
  1: [-3.5, 0, 2.8],
  2: [-1.8, 0, 2.2],
  3: [0, 0, 1.8],
  4: [1.8, 0, 2.2],
  5: [3.5, 0, 2.8]
};

// Loader para uso dentro do Canvas (com hooks do R3F)
function CanvasLoader() {
  const { progress } = useProgress();
  
  return (
    <Html center>
      <div className="text-white text-center">
        <div className="text-2xl mb-2">Carregando cena...</div>
        <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-sm mt-2">{Math.round(progress)}%</div>
      </div>
    </Html>
  );
}

// Loader externo (sem hooks do R3F) para uso fora do Canvas
function ExternalLoader() {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="text-white text-center">
        <div className="text-2xl mb-4">Carregando cena 3D...</div>
        <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden mx-auto">
          <motion.div
            className="h-full bg-cyan-400"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
          />
        </div>
      </div>
    </div>
  );
}

// Coordenadas 3D baseadas na posição da mesa
const getPositionCoordinates = (position: number): [number, number, number] => {
  const positions: Record<number, [number, number, number]> = {
    0: [-3.5, 1.2, 2],    // Esquerda
    1: [-1.8, 1.2, 1.5],  // Centro-esquerda
    2: [0, 1.2, 1],       // Centro (mais próximo)
    3: [1.8, 1.2, 1.5],   // Centro-direita
    4: [3.5, 1.2, 2],     // Direita
  };
  
  return positions[position] || [0, 1.2, 1];
};

export function RoundTableDebate({ 
  participants, 
  messages = [],
  onParticipantClick,
  isActive = true 
}: RoundTableDebateProps) {
  const [cameraDistance, setCameraDistance] = useState(8);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [selectedRound, setSelectedRound] = useState<number | 'all' | 'sintese'>('all');
  const [activeAvatarId, setActiveAvatarId] = useState<number>(3);
  const [speakingAvatarId, setSpeakingAvatarId] = useState<number | null>(3);
  
  // Obter rodadas disponíveis
  const availableRounds = useMemo(() => {
    const rounds = new Set<number>();
    messages.forEach(msg => {
      if (msg.roundNumber) {
        rounds.add(msg.roundNumber);
      }
    });
    return Array.from(rounds).sort((a, b) => a - b);
  }, [messages]);

  // Obter síntese final
  const sinteseFinal = useMemo(() => {
    return messages.find(msg => msg.type === 'sintese_conteudo')?.content || null;
  }, [messages]);

  useEffect(() => {
    if (selectedRound === 'sintese') {
      setSpeakingAvatarId(null);
      return;
    }
    const targetRound = selectedRound === 'all'
      ? (availableRounds[availableRounds.length - 1] ?? null)
      : selectedRound;
    if (typeof targetRound === 'number') {
      const id = ((targetRound - 1) % readyPlayerParticipants.length) + 1;
      setSpeakingAvatarId(id);
    } else {
      setSpeakingAvatarId(null);
    }
  }, [selectedRound, availableRounds]);

  // Filtrar mensagens por rodada selecionada
  const filteredMessages = useMemo(() => {
    if (selectedRound === 'all') {
      const lastRound = availableRounds.length > 0 ? availableRounds[availableRounds.length - 1] : null;
      if (lastRound) {
        return messages.filter(msg => msg.roundNumber === lastRound && msg.type === 'agent');
      }
      return messages.filter(msg => msg.type === 'agent');
    } else if (selectedRound === 'sintese') {
      return [];
    }
    return messages.filter(msg => msg.roundNumber === selectedRound && msg.type === 'agent');
  }, [messages, selectedRound, availableRounds]);

  const participantMessages = useMemo(() => {
    const map = new Map<string, Message>();
    filteredMessages.forEach(msg => {
      if (msg.agentId && !map.has(msg.agentId)) {
        map.set(msg.agentId, msg);
      } else if (msg.agentName && !map.has(msg.agentName)) {
        map.set(msg.agentName, msg);
      } else if (msg.agentRole && !map.has(msg.agentRole)) {
        map.set(msg.agentRole, msg);
      }
    });
    return map;
  }, [filteredMessages]);

  const getParticipantMessage = (participant: Agent): Message | undefined => {
    if (participantMessages.has(participant.id)) {
      return participantMessages.get(participant.id);
    }
    if (participantMessages.has(participant.name)) {
      return participantMessages.get(participant.name);
    }
    if (participantMessages.has(participant.role)) {
      return participantMessages.get(participant.role);
    }
    return filteredMessages.find(msg => 
      msg.agentId === participant.id ||
      msg.agentName === participant.name ||
      msg.agentRole === participant.role
    );
  };

  // Garantir renderização apenas no cliente
  useEffect(() => {
    setMounted(true);
    
    // Suprimir avisos de precisão do WebGL (não críticos)
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => {
      const message = args[0]?.toString() || '';
      // Ignorar avisos de precisão numérica do WebGL/Three.js
      if (
        message.includes('X4122') || 
        message.includes('X4008') || 
        message.includes('cannot be represented accurately') ||
        message.includes('floating point division by zero') ||
        message.includes('THREE.WebGLProgram')
      ) {
        return; // Suprimir esses avisos específicos
      }
      originalWarn.apply(console, args);
    };
    
    return () => {
      console.warn = originalWarn; // Restaurar console.warn ao desmontar
    };
  }, []);

  // Limitar a 5 participantes máximo
  const displayedParticipants = participants.slice(0, 5);

  const handleParticipantClick = (participantId: string) => {
    if (onParticipantClick) {
      onParticipantClick(participantId);
    }
  };

  const handleZoomIn = () => {
    setCameraDistance(prev => Math.max(prev - 1, 5));
  };

  const handleZoomOut = () => {
    setCameraDistance(prev => Math.min(prev + 1, 15));
  };

  const handleReset = () => {
    setCameraDistance(8);
  };

  // Não renderizar no servidor
  if (!mounted) {
    return (
      <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Background - Cidade Noturna */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/BG%20PRINCIPAL.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(3px) brightness(0.4)',
        }}
      />

      {/* Overlay escuro gradiente */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80 z-1" />

      {/* Scene 3D */}
      <div className="absolute inset-0 z-10">
        <Canvas
          shadows
          camera={{ position: [0, 1.5, cameraDistance], fov: 50 }}
          gl={{ 
            antialias: true, 
            alpha: true,
            powerPreference: "high-performance",
            precision: "highp",
            logarithmicDepthBuffer: false
          }}
          onCreated={() => {
            setIsLoading(false);
          }}
        >
          <Suspense fallback={<CanvasLoader />}>
            {/* Iluminação Realista */}
            <RealisticLighting />

            {/* Mesa */}
            <ConferenceTable />

            {/* Cadeiras */}
            {readyPlayerParticipants.map((avatar) => (
              <Chair
                key={`chair-${avatar.id}`}
                position={chairPositions[avatar.id]}
                rotation={avatarRotations[avatar.id]}
              />
            ))}

            {/* Avatares Ready Player Me */}
            <Suspense fallback={null}>
              {readyPlayerParticipants
                .filter((avatar) =>
                  participants.some((p) => {
                    const normalizedName = p.name.toLowerCase();
                    return (
                      avatar.name.toLowerCase().includes(normalizedName) ||
                      avatar.role.toLowerCase().includes(normalizedName) ||
                      normalizedName.includes(avatar.name.toLowerCase()) ||
                      normalizedName.includes(avatar.role.toLowerCase())
                    );
                  })
                )
                .map((avatar) => (
                  <Avatar3D
                    key={avatar.id}
                    id={avatar.id}
                    name={avatar.name}
                    role={avatar.role}
                    modelUrl={avatar.modelUrl}
                    position={avatarPositions[avatar.id]}
                    rotation={avatarRotations[avatar.id]}
                    scale={0.85}
                    isActive={activeAvatarId === avatar.id}
                    isSpeaking={speakingAvatarId === avatar.id}
                    sitting
                    speechText={
                      filteredMessages.find(
                        (msg) =>
                          msg.agentId === avatar.id ||
                          msg.agentName?.toLowerCase() === avatar.name.toLowerCase() ||
                          msg.agentRole?.toLowerCase() === avatar.role.toLowerCase()
                      )?.content || ''
                    }
                    showSpeech={speakingAvatarId === avatar.id}
                    onClick={() => {
                      setActiveAvatarId(avatar.id);
                      setSpeakingAvatarId(avatar.id);
                    }}
                  />
                ))}
            </Suspense>

            {/* Participantes */}
            {displayedParticipants.map((participant, index) => {
              const participantMessage = getParticipantMessage(participant);
              const position = getPositionCoordinates(index);
              
              return (
                <group key={participant.id}>
                  <Participant3D
                    participant={participant}
                    position={position}
                    onClick={() => handleParticipantClick(participant.id)}
                  />
                  {/* Speech Bubble acima do participante */}
                  {participantMessage && selectedRound !== 'sintese' && (
                    <SpeechBubble
                      message={participantMessage}
                      position={[position[0], position[1] + 2.5, position[2]]}
                      isVisible={true}
                    />
                  )}
                </group>
              );
            })}

            {/* Chão para sombras */}
            <mesh 
              rotation={[-Math.PI / 2, 0, 0]} 
              position={[0, 0, 0]}
              receiveShadow
            >
              <planeGeometry args={[20, 20]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
            </mesh>

            {/* Controles de câmera */}
            <OrbitControls 
              enableZoom={true}
              enablePan={false}
              maxPolarAngle={Math.PI / 2.5}
              minPolarAngle={Math.PI / 6}
              minAzimuthAngle={-Math.PI / 2}
              maxAzimuthAngle={Math.PI / 2}
              minDistance={5}
              maxDistance={15}
              enableDamping
              dampingFactor={0.05}
            />

            {/* Environment map para reflexos */}
            <Environment preset="city" />

            {/* Post-processing Effects */}
            <EffectComposer>
              <Bloom 
                intensity={0.3} 
                luminanceThreshold={0.9} 
                luminanceSmoothing={0.9}
              />
              <Vignette 
                offset={0.3} 
                darkness={0.5} 
              />
            </EffectComposer>
          </Suspense>
        </Canvas>
      </div>

      {/* Controles de Rodada - Acima dos controles de zoom */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="bg-gray-900/90 backdrop-blur-md px-4 py-2 rounded-lg border border-cyan-400/30 shadow-2xl flex items-center gap-4"
        >
          <span className="text-white text-sm font-medium">Rodada:</span>
          <Select
            value={selectedRound === 'all' ? 'all' : selectedRound === 'sintese' ? 'sintese' : selectedRound.toString()}
            onValueChange={(value) => {
              if (value === 'all') {
                setSelectedRound('all');
              } else if (value === 'sintese') {
                setSelectedRound('sintese');
              } else {
                setSelectedRound(parseInt(value));
              }
            }}
          >
            <SelectTrigger className="w-36 bg-black/60 border-cyan-400/50 text-white hover:bg-black/80">
              <SelectValue>
                {selectedRound === 'all' 
                  ? availableRounds.length > 0 
                    ? `Rodada ${availableRounds[availableRounds.length - 1]}` 
                    : 'Todas'
                  : selectedRound === 'sintese'
                  ? 'Consenso'
                  : `Rodada ${selectedRound}`}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-cyan-400/50">
              {availableRounds.map(round => (
                <SelectItem 
                  key={round} 
                  value={round.toString()} 
                  className="text-white hover:bg-cyan-400/20 cursor-pointer"
                >
                  Rodada {round}
                </SelectItem>
              ))}
              {availableRounds.length > 0 && (
                <>
                  <SelectItem 
                    value="all" 
                    className="text-white hover:bg-cyan-400/20 cursor-pointer"
                  >
                    Todas (Última)
                  </SelectItem>
                  {sinteseFinal && (
                    <SelectItem 
                      value="sintese" 
                      className="text-white hover:bg-cyan-400/20 cursor-pointer"
                    >
                      Consenso Geral
                    </SelectItem>
                  )}
                </>
              )}
            </SelectContent>
          </Select>
        </motion.div>
      </div>

      {/* Painel de Consenso Geral - Abaixo da mesa */}
      {selectedRound === 'sintese' && sinteseFinal && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900/95 backdrop-blur-md rounded-lg border border-cyan-400/50 shadow-2xl p-6"
          >
            <h3 className="text-white text-xl font-bold mb-4">CONCENSSO GERAL SOBRE O ASSUNTO:</h3>
            <div className="text-white/90 text-sm leading-relaxed max-h-96 overflow-y-auto">
              <p className="whitespace-pre-wrap">{sinteseFinal}</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* UI Overlay - Controles */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="bg-gray-900/90 backdrop-blur-md px-6 py-3 rounded-full border border-cyan-400/30 shadow-2xl flex items-center gap-6"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            className="text-white hover:text-cyan-400 transition-colors"
          >
            <ZoomIn size={20} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            className="text-white hover:text-cyan-400 transition-colors"
          >
            <ZoomOut size={20} />
          </Button>
          <div className="w-px h-6 bg-cyan-400/30" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-white hover:text-cyan-400 transition-colors"
          >
            <RefreshCw size={20} />
          </Button>
        </motion.div>
      </div>

      {/* Loading Overlay - Use o componente externo ao invés do Loader */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ExternalLoader />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

