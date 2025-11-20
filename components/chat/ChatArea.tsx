'use client';

import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import { MessageBubble } from './MessageBubble';
import { RoundIndicator } from './RoundIndicator';
import { EmptyState } from './EmptyState';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AGENTS } from '@/lib/constants';
import { getAgents } from '@/lib/api';
import { Message } from '@/lib/types';

const mentorPositions: Record<number, CSSProperties> = {
  1: { position: 'absolute', bottom: '25%', left: '8%' },
  2: { position: 'absolute', bottom: '20%', left: '26%' },
  3: { position: 'absolute', bottom: '18%', left: '50%', transform: 'translateX(-50%)' },
  4: { position: 'absolute', bottom: '20%', right: '26%' },
  5: { position: 'absolute', bottom: '25%', right: '8%' }
};

const speechBubblePositions: Record<number, CSSProperties> = {
  1: { bottom: '55%', left: '5%', maxWidth: '280px' },
  2: { bottom: '60%', left: '22%', maxWidth: '280px' },
  3: { bottom: '65%', left: '50%', transform: 'translateX(-50%)', maxWidth: '280px' },
  4: { bottom: '60%', right: '22%', maxWidth: '280px' },
  5: { bottom: '55%', right: '5%', maxWidth: '280px' }
};

const mentorOrder = [
  { id: 'mark', name: 'Mark Zuckerberg' },
  { id: 'bill', name: 'Bill Gates' },
  { id: 'jeff', name: 'Jeff Bezos' },
  { id: 'elon', name: 'Elon Musk' },
  { id: 'tim', name: 'Tim Cook' }
];

export function ChatArea() {
  const { getCurrentChat, isDebating, selectedAgents, numRodadas, setNumRodadas } = useStore();
  const chat = getCurrentChat();
  const historyRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (historyRef.current && mounted) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [chat?.messages, mounted]);

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

  const groupedMessages: any[] = [];
  for (let i = 0; i < chat.messages.length; i++) {
    const message = chat.messages[i];

    if (message.type === 'round' || message.type === 'sintese' || message.type === 'sintese_conteudo' || message.type === 'question') {
      groupedMessages.push(message);
      continue;
    }

    const prevMessage = i > 0 ? chat.messages[i - 1] : null;
    const isSameAgent = prevMessage &&
      prevMessage.type === 'agent' &&
      message.type === 'agent' &&
      prevMessage.agentId === message.agentId;

    if (isSameAgent && groupedMessages.length > 0) {
      const lastItem = groupedMessages[groupedMessages.length - 1];
      if (lastItem && lastItem.messages && Array.isArray(lastItem.messages)) {
        lastItem.messages.push(message);
        continue;
      }
    }

    groupedMessages.push({
      ...message,
      messages: [message]
    });
  }

  const roundMessages = chat.messages.filter(message => message.type === 'round' && typeof message.roundNumber === 'number');
  const currentRoundNumber = roundMessages.length > 0 ? roundMessages[roundMessages.length - 1].roundNumber! : 1;
  const totalRounds = chat.numRodadas || numRodadas;

  const mentorCards = mentorOrder.map((mentorMeta, index) => {
    const agent = availableAgents.find(agent => agent.id === mentorMeta.id);
    const message = latestAgentMessages[mentorMeta.id];
    const isActive = activeMentorId === mentorMeta.id;
    const positionKey = index + 1;
    const bubbleStyle = isCompact
      ? { position: 'relative', transform: 'none', width: '90%', margin: '0 auto', bottom: 'auto', left: 'auto', right: 'auto' }
      : { ...speechBubblePositions[positionKey], position: 'absolute' };
    const mentorStyle = isCompact
      ? { position: 'relative', transform: 'none', margin: '0 auto 1.5rem' }
      : mentorPositions[positionKey];

    return {
      ...mentorMeta,
      agent,
      message,
      isActive,
      mentorStyle,
      bubbleStyle
    };
  });

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/BG%20PRINCIPAL.png')" }}
      />
      <div className="absolute inset-0 bg-black/70" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="relative flex-1">
          <div className="mentors-table absolute inset-0 pointer-events-none">
            <div className="absolute inset-x-16 bottom-6 h-40 rounded-[80px] bg-gradient-to-b from-white/10 to-black/80 blur-[60px] shadow-[0_40px_120px_rgba(0,0,0,0.7)]" />
            {mentorCards.map((mentor) => (
              <div
                key={mentor.id}
                className="mentor-wrapper"
                style={mentor.mentorStyle}
              >
                <div className={`mentor-avatar ${mentor.isActive ? 'shadow-[0_0_40px_rgba(59,130,246,0.6)] scale-105' : ''}`}>
                  <Avatar className="h-20 w-20 bg-black/20 text-white">
                    {mentor.agent?.avatar && mentor.agent.avatar.startsWith('http') ? (
                      <AvatarImage src={mentor.agent.avatar} alt={mentor.name} />
                    ) : (
                      <AvatarFallback className="text-3xl">
                        {mentor.agent?.avatar?.slice(0, 2).toUpperCase() || mentor.name.charAt(0)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>
                {(mentor.message || mentor.isActive) && (
                  <div
                    className={`speech-bubble ${mentor.isActive ? 'active' : ''}`}
                    style={mentor.bubbleStyle}
                  >
                    <p className="text-xs uppercase tracking-[0.4em] text-white/60">{mentor.name}</p>
                    <p className="text-sm text-white">{mentor.message?.content || 'Pensando em uma resposta...'}</p>
                    {mentor.isActive && isDebating && (
                      <span className="typing-indicator mt-2 text-white">
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

        <div className="mx-auto w-full max-w-5xl px-4 pb-4">
          <div className="history-panel mt-6 rounded-[28px] border border-white/10 bg-black/70 px-6 py-5 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-white/60">
              <span>Histórico</span>
              <span>Rodada atual</span>
            </div>
            <RoundIndicator roundNumber={currentRoundNumber} />
            <ScrollArea className="mt-3 h-44 custom-scrollbar">
              <div ref={historyRef} className="space-y-3 pb-2">
                {groupedMessages.map((item, index) => {
                  if (item.type === 'round') {
                    return (
                      <RoundIndicator
                        key={item.id}
                        roundNumber={item.roundNumber || 1}
                      />
                    );
                  }

                  if (item.messages && item.messages.length > 1) {
                    return (
                      <div key={item.id} className="fade-in-up">
                        {item.messages.map((msg: any, msgIndex: number) => (
                          <MessageBubble
                            key={msg.id}
                            message={msg}
                            className={msgIndex === 0 ? '' : 'mt-2'}
                            isGrouped={true}
                            isFirstInGroup={msgIndex === 0}
                            isLastInGroup={msgIndex === item.messages.length - 1}
                          />
                        ))}
                      </div>
                    );
                  }

                  return (
                    <MessageBubble
                      key={item.id}
                      message={item}
                      className="fade-in-up"
                      previousMessage={index > 0 ? groupedMessages[index - 1] : null}
                    />
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="flex items-center justify-between gap-6 px-[clamp(1rem,4vw,4rem)] pb-6 pt-2 text-sm text-white/70">
          <div>
            <span className="text-xs uppercase tracking-[0.4em] text-white/50">Mentor ativo</span>
            <p className="text-lg font-semibold text-white">
              {availableAgents.find(agent => agent.id === activeMentorId)?.name || 'Mentor'}
            </p>
          </div>
          <Button
            variant="outline"
            className="border-white/30 text-white hover:border-white"
            onClick={() => setNumRodadas(numRodadas + 1)}
          >
            Próxima Rodada
          </Button>
        </div>
      </div>
    </div>
  );
}

