'use client';

import { RoundTableDebate } from './RoundTableDebate';
import { ChatArea } from '../chat/ChatArea';
import { ChatInput } from '../chat/ChatInput';
import { useStore } from '@/lib/store';
import { AGENTS } from '@/lib/constants';
import { getAgents } from '@/lib/api';
import { useEffect, useState } from 'react';
import { Agent } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { LayoutGrid, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DebateViewProps {
  onSendMessage?: (message: string) => void;
}

export function DebateView({ onSendMessage }: DebateViewProps) {
  const [viewMode, setViewMode] = useState<'chat' | 'table'>('chat');
  const [mounted, setMounted] = useState(false);
  const { getCurrentChat, selectedAgents } = useStore();
  const [availableAgents, setAvailableAgents] = useState<Agent[]>(AGENTS);
  const chat = getCurrentChat();

  // Garantir renderização apenas no cliente
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Carregar agentes da API
  useEffect(() => {
    getAgents()
      .then(response => {
        const formattedAgents = response.agentes.map((agent: any) => ({
          id: agent.id,
          name: agent.name,
          role: agent.role,
          avatar: agent.avatar || '👤',
          color: agent.color || '#8b5cf6',
          backstory: agent.backstory || ''
        }));
        const allAgents = [...formattedAgents, ...AGENTS.filter(a => 
          !formattedAgents.some(fa => fa.name === a.name || fa.role === a.role)
        )];
        setAvailableAgents(allAgents);
      })
      .catch(error => {
        console.error('Erro ao carregar agentes:', error);
        setAvailableAgents(AGENTS);
      });
  }, []);

  // Obter agentes selecionados para a mesa
  const getSelectedAgentsForTable = (): Agent[] => {
    const currentSelectedAgents = chat?.selectedAgents || selectedAgents;
    return currentSelectedAgents
      .map(agentId => availableAgents.find(a => a.id === agentId))
      .filter((agent): agent is Agent => agent !== undefined)
      .slice(0, 5); // Máximo 5 participantes na mesa
  };

  const handleParticipantClick = (participantId: string) => {
    // Aqui você pode adicionar lógica para destacar o participante ou mostrar informações
    console.log('Participante clicado:', participantId);
  };

  // Não renderizar no servidor
  if (!mounted) {
    return (
      <div className="flex-1 flex flex-col h-full relative flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full relative">
      {/* Botões de alternância de visualização - Posicionados abaixo do header */}
      <div className="absolute top-20 right-4 z-[100] flex gap-2">
        <Button
          variant={viewMode === 'table' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('table')}
          className={`${
            viewMode === 'table' 
              ? 'bg-cyan-500 hover:bg-cyan-600 text-white' 
              : 'bg-black/90 backdrop-blur-md border-cyan-400/50 text-white hover:bg-cyan-400/30'
          } shadow-xl border border-cyan-400/50`}
        >
          <LayoutGrid size={16} className="mr-2" />
          Mesa 3D
        </Button>
        <Button
          variant={viewMode === 'chat' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('chat')}
          className={`${
            viewMode === 'chat' 
              ? 'bg-cyan-500 hover:bg-cyan-600 text-white' 
              : 'bg-black/90 backdrop-blur-md border-cyan-400/50 text-white hover:bg-cyan-400/30'
          } shadow-xl border border-cyan-400/50`}
        >
          <MessageSquare size={16} className="mr-2" />
          Chat
        </Button>
      </div>

      {/* Conteúdo da visualização */}
      <AnimatePresence mode="wait">
        {viewMode === 'table' ? (
          <motion.div
            key="table"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="flex-1 w-full h-full"
          >
            <RoundTableDebate
              participants={getSelectedAgentsForTable()}
              messages={chat?.messages || []}
              onParticipantClick={handleParticipantClick}
              isActive={true}
            />
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col h-full"
          >
            <ChatArea />
            {onSendMessage && <ChatInput onSendMessage={onSendMessage} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

