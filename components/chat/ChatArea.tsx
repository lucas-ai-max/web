'use client';

import { CSSProperties, useEffect, useMemo, useState } from 'react';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { ChevronDown, Mic, Plus, RefreshCw, Send } from 'lucide-react';
import { useStore } from '@/lib/store';
import { EmptyState } from './EmptyState';
import { AGENTS } from '@/lib/constants';
import { getAgents } from '@/lib/api';
import { Message } from '@/lib/types';

type MentorPosition = CSSProperties & { avatarSize: string };

const mentorPositions: Record<number, MentorPosition> = {
  1: { position: 'absolute', bottom: '28%', left: '6%', avatarSize: '80px' },
  2: { position: 'absolute', bottom: '22%', left: '28%', avatarSize: '80px' },
  3: { position: 'absolute', bottom: '20%', left: '50%', transform: 'translateX(-50%)', avatarSize: '90px' },
  4: { position: 'absolute', bottom: '22%', right: '28%', avatarSize: '80px' },
  5: { position: 'absolute', bottom: '28%', right: '6%', avatarSize: '80px' }
};

const speechBubblePositions: Record<number, CSSProperties> = {
  1: { bottom: '55%', left: '5%', maxWidth: '280px' },
  2: { top: '12%', left: '8%', maxWidth: '280px' },
  3: { top: '10%', left: '50%', transform: 'translateX(-50%)', maxWidth: '320px' },
  4: { top: '12%', right: '8%', maxWidth: '280px' },
  5: { bottom: '55%', right: '5%', maxWidth: '300px' }
};

const mentorList = [
  {
    id: 'mark',
    name: 'Mark Zuckerberg',
    avatar: 'https://upload.wikimedia.org/wikipedia/commons/0/04/Mark_Zuckerberg_F8_2019_Keynote_%28cropped%29.jpg'
  },
  {
    id: 'bill',
    name: 'Bill Gates',
    avatar: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Bill_Gates_%282019%29.jpg'
  },
  {
    id: 'jeff',
    name: 'Jeff Bezos',
    avatar: 'https://upload.wikimedia.org/wikipedia/commons/0/06/Jeff_Bezos_2017.jpg'
  },
  {
    id: 'elon',
    name: 'Elon Musk',
    avatar: 'https://upload.wikimedia.org/wikipedia/commons/e/ed/Elon_Musk_Royal_Society_%28crop1%29.jpg'
  },
  {
    id: 'tim',
    name: 'Tim Cook',
    avatar: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Tim_Cook%2C_2017.jpg'
  }
];

const bubbleOrientation: Record<number, 'top' | 'bottom'> = {
  1: 'bottom',
  2: 'top',
  3: 'top',
  4: 'top',
  5: 'bottom'
};

export function ChatArea() {
  const { getCurrentChat, isDebating, selectedAgents, numRodadas, setNumRodadas } = useStore();
  const chat = getCurrentChat();
  const [mounted, setMounted] = useState(false);
  const [availableAgents, setAvailableAgents] = useState(AGENTS);
  const [isCompact, setIsCompact] = useState(false);

  const currentSelectedAgents = chat?.selectedAgents || selectedAgents;

  useEffect(() => {
    setMounted(true);

    const handleResize = () => {
      setIsCompact(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

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

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const latestAgentMessages = useMemo(() => {
    const map: Record<string, Message> = {};
    chat?.messages.forEach(message => {
      if (message.type === 'agent' && message.agentId) {
        map[message.agentId] = message;
      }
    });
    return map;
  }, [chat?.messages]);

  const lastAgentMessage = useMemo(() => {
    return chat?.messages
      .filter(message => message.type === 'agent' && !!message.agentId)
      .pop();
  }, [chat?.messages]);

  const activeMentorId = lastAgentMessage?.agentId || currentSelectedAgents[0] || 'mark';

  if (!mounted) {
    return <div className="flex-1 h-full" />;
  }

  if (!chat || chat.messages.length === 0) {
    return <EmptyState />;
  }

  const consensusText =
    [...chat.messages]
      .reverse()
      .find(message => message.type === 'sintese_conteudo' || message.type === 'sintese')?.content ||
    chat.messages.find(message => message.type === 'agent')?.content ||
    'Aguardando os mentores terminarem o raciocínio...';

  const mentorCards = mentorList.map((mentorMeta, index) => {
    const agent = availableAgents.find(agent => agent.id === mentorMeta.id);
    const message = latestAgentMessages[mentorMeta.id];
    const isActive = activeMentorId === mentorMeta.id;
    const positionKey = index + 1;
    const bubbleStyle = isCompact
      ? { position: 'relative', transform: 'none', width: '90%', margin: '0 auto', bottom: 'auto', left: 'auto', right: 'auto' }
      : { ...speechBubblePositions[positionKey], position: 'absolute' };
    const { avatarSize, ...positionStyle } = mentorPositions[positionKey];
    const mentorStyle = isCompact
      ? { position: 'relative', transform: 'none', margin: '0 auto 1.5rem' }
      : positionStyle;
    const avatarSizeValue = isCompact ? '70px' : avatarSize || '80px';

    return {
      ...mentorMeta,
      agent,
      message,
      isActive,
      mentorStyle,
      bubbleStyle,
      avatarSize: avatarSizeValue
    };
  });

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/mesa-experts%201.png')" }}
      />
      <div className="absolute inset-0 background-overlay" />

      <div className="relative z-10 flex h-full flex-col">

        <div className="relative flex-1">
          <div className="mentors-table absolute inset-0 pointer-events-none">
            <div className="absolute inset-x-16 bottom-6 h-40 rounded-[80px] bg-gradient-to-b from-white/10 to-black/80 blur-[60px] shadow-[0_40px_120px_rgba(0,0,0,0.7)]" />
            {mentorCards.map((mentor, index) => (
              <div
                key={mentor.id}
                className={`mentor-wrapper ${mentor.isActive ? 'active' : 'inactive'}`}
                style={mentor.mentorStyle}
              >
                <div className="relative">
                  <div className={`mentor-avatar ${mentor.isActive ? 'active' : ''}`} style={{ width: mentor.avatarSize, height: mentor.avatarSize }}>
                    <Avatar className="h-full w-full bg-black/20 text-white">
                      <AvatarImage src={mentor.avatar} alt={mentor.name} />
                    </Avatar>
                  </div>
                  <div className="refresh-icon">
                    <RefreshCw className="w-4 h-4 text-white" />
                  </div>
                </div>
                {(mentor.message || mentor.isActive) && (
                  <div
                    className={`speech-bubble ${mentor.isActive ? 'active' : ''} ${bubbleOrientation[index + 1]}`}
                    style={mentor.bubbleStyle}
                  >
                    <p className="text-[10px] uppercase tracking-[0.6em] text-white/60">{mentor.name}</p>
                    <p className="mt-1 text-sm text-white leading-relaxed">
                      {mentor.message?.content || 'Pensando em uma resposta...'}
                    </p>
                    {mentor.isActive && isDebating && (
                      <span className="typing-indicator mt-3 text-white">
                        <span></span>
                        <span></span>
                        <span></span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="fixed bottom-24 left-1/2 z-40 w-full max-w-4xl -translate-x-1/2 px-4 md:px-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 mb-4 shadow-lg">
            <input
              type="text"
              value="printer took a galley of type and scrambled it to make a *"
              className="w-full bg-transparent text-gray-700 text-sm outline-none"
              disabled
            />
          </div>

          <div className="bg-gray-900/95 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/10 text-white">
            <h3 className="text-center text-sm font-semibold tracking-[0.3em] uppercase text-white/80 mb-3">
              CONSENSO GERAL SOBRE O ASSUNTO:
            </h3>
            <div className="text-gray-300 text-sm leading-relaxed text-justify max-h-64 overflow-y-auto custom-scrollbar">
              {consensusText}
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-lg border-t border-white/10 p-4 z-50">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
              <div className="flex gap-2 flex-wrap">
                <button className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                  Perguntar para: Todos
                  <ChevronDown className="w-3 h-3" />
                </button>
                <button
                  className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                  onClick={() => setNumRodadas(numRodadas + 1)}
                >
                  Rodada {numRodadas}
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors">
                Solicitar conclusão
              </button>
            </div>

            <div className="bg-white rounded-full p-2 flex items-center gap-2 shadow-lg">
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Plus size={20} className="text-gray-600" />
              </button>
              <input
                type="text"
                placeholder="Faça sua pergunta"
                className="flex-1 outline-none text-sm px-2"
              />
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Mic size={18} className="text-gray-600" />
              </button>
              <button className="p-2 hover:bg-blue-100 rounded-full transition-colors">
                <Send size={18} className="text-blue-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

