'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { MessageBubble } from './MessageBubble';
import { RoundIndicator } from './RoundIndicator';
import { EmptyState } from './EmptyState';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AGENTS } from '@/lib/constants';
import { getAgents } from '@/lib/api';

export function ChatArea() {
  const { getCurrentChat, isDebating, selectedAgents } = useStore();
  const chat = getCurrentChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [availableAgents, setAvailableAgents] = useState(AGENTS);
  
  // Usar agentes do chat atual se disponível, senão usar os selecionados globalmente
  const currentSelectedAgents = chat?.selectedAgents || selectedAgents;

  useEffect(() => {
    setMounted(true);
    
    // Carregar agentes da API
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
        // Combinar com lista hardcoded (prioridade para agentes da API)
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

  useEffect(() => {
    if (scrollRef.current && mounted) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat?.messages, mounted]);

  // Obter nomes dos agentes selecionados
  const getAgentNames = () => {
    if (!currentSelectedAgents || currentSelectedAgents.length === 0) {
      return 'Agentes';
    }
    
    const names = currentSelectedAgents
      .map(agentId => {
        const agent = availableAgents.find(a => a.id === agentId);
        return agent?.name || agentId;
      })
      .filter(Boolean);
    
    if (names.length === 0) {
      return 'Agentes';
    }
    
    if (names.length === 1) {
      return names[0];
    }
    
    if (names.length === 2) {
      return `${names[0]} e ${names[1]}`;
    }
    
    // Para 3 ou mais: "Nome1, Nome2 e Nome3"
    const last = names[names.length - 1];
    const others = names.slice(0, -1).join(', ');
    return `${others} e ${last}`;
  };

  if (!mounted) {
    return <div className="flex-1 h-full" />;
  }

  if (!chat || chat.messages.length === 0) {
    return <EmptyState />;
  }

  // Agrupar mensagens consecutivas do mesmo agente e intercalar visualmente
  const groupedMessages: any[] = [];
  
  for (let i = 0; i < chat.messages.length; i++) {
    const message = chat.messages[i];
    
    // Mensagens especiais não são agrupadas
    if (message.type === 'round' || message.type === 'sintese' || message.type === 'sintese_conteudo' || message.type === 'question') {
      groupedMessages.push(message);
      continue;
    }

    // Verificar se é do mesmo agente que a mensagem anterior
    const prevMessage = i > 0 ? chat.messages[i - 1] : null;
    const isSameAgent = prevMessage && 
      prevMessage.type === 'agent' && 
      message.type === 'agent' && 
      prevMessage.agentId === message.agentId;

    if (isSameAgent && groupedMessages.length > 0) {
      // Mesmo agente - adicionar ao último grupo
      const lastItem = groupedMessages[groupedMessages.length - 1];
      // Verificar se o último item é um grupo (tem propriedade messages)
      if (lastItem && lastItem.messages && Array.isArray(lastItem.messages)) {
        lastItem.messages.push(message);
        continue;
      }
    }

    // Novo agente ou tipo diferente - criar novo grupo
    groupedMessages.push({
      ...message,
      messages: [message]
    });
  }

  return (
    <ScrollArea className="flex-1 h-full">
      <div ref={scrollRef} className="flex flex-col gap-4 p-6 max-w-4xl mx-auto">
        {groupedMessages.map((item, index) => {
          if (item.type === 'round') {
            return (
              <RoundIndicator
                key={item.id}
                roundNumber={item.roundNumber || 1}
              />
            );
          }

          // Se é um grupo de mensagens do mesmo agente
          if (item.messages && item.messages.length > 1) {
            return (
              <div key={item.id} className="fade-in-up">
                {item.messages.map((msg: any, msgIndex: number) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    className={msgIndex === 0 ? "" : "mt-2"}
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
        {isDebating && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </span>
            <span>{getAgentNames()} está{currentSelectedAgents.length > 1 ? 'm' : ''} debatendo...</span>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

