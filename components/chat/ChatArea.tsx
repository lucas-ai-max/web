'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MoreVertical, Copy } from 'lucide-react';

import { useStore } from '@/lib/store';
import { Message, Agent } from '@/lib/types';
import { AGENTS } from '@/lib/constants';

export function ChatArea() {
  const chat = useStore(state => state.getCurrentChat());
  const messages = chat?.messages ?? [];
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isDebating = useStore(state => state.isDebating);
  const globalSelectedAgents = useStore(state => state.selectedAgents);
  // Usar os agentes selecionados do chat atual, ou do store global como fallback
  const chatSelectedAgents = (chat?.selectedAgents && chat.selectedAgents.length > 0) ? chat.selectedAgents : globalSelectedAgents;
  const [availableAgents, setAvailableAgents] = useState(AGENTS);

  // Função para gerar ID único baseado no nome
  const generateAgentId = (name: string, existingId?: string): string => {
    // Se já tem ID e é UUID válido, usar esse
    if (existingId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(existingId)) {
        return existingId;
      }
    }
    
    // Gerar hash simples do nome para IDs consistentes
    let hash = 0;
    const normalizedName = name.toLowerCase().trim();
    for (let i = 0; i < normalizedName.length; i++) {
      const char = normalizedName.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Retornar hash positivo como string hexadecimal com prefixo
    return `agent_${Math.abs(hash).toString(16).padStart(8, '0')}`;
  };

  // Carregar agentes da API
  useEffect(() => {
    import('@/lib/api').then(({ getAgents }) => {
    getAgents()
      .then(response => {
        const formattedAgents: Agent[] = response.agentes.map((agent: any) => ({
            id: generateAgentId(agent.name, agent.id), // Gerar ID único se necessário
          name: agent.name,
          role: agent.role,
          description: agent.description,
          avatar: agent.avatar || '👤',
          color: agent.color || '#8b5cf6',
          backstory: agent.backstory || ''
        }));
          // Combinar com lista hardcoded (prioridade para agentes da API)
          // Remover duplicatas baseadas no nome (mesmo nome = mesmo agente)
          const allAgentsMap = new Map<string, Agent>();
          
          // Primeiro, adicionar agentes da API
          formattedAgents.forEach(agent => {
            allAgentsMap.set(agent.name.toLowerCase(), agent);
          });
          
          // Depois, adicionar agentes hardcoded que não existem na API
          AGENTS.forEach(agent => {
            const key = agent.name.toLowerCase();
            if (!allAgentsMap.has(key)) {
              allAgentsMap.set(key, agent);
            }
          });
          
          setAvailableAgents(Array.from(allAgentsMap.values()));
      })
        .catch(() => {
        setAvailableAgents(AGENTS);
      });
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Obter nomes apenas dos agentes selecionados para esta conversa específica
  const agentNames = useMemo(() => {
    if (!chatSelectedAgents || chatSelectedAgents.length === 0) {
      return [];
    }
    
    // Normalizar IDs selecionados para garantir match correto
    const normalizedSelectedIds = chatSelectedAgents.map(selectedId => {
      // Se já é um UUID válido, manter
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(selectedId)) {
        return selectedId;
      }

      // Tentar encontrar o agente por ID antigo ou nome
      const agent = availableAgents.find(a => 
        a.id === selectedId || 
        a.name.toLowerCase() === selectedId.toLowerCase() ||
        a.name.toLowerCase().replace(/\s+/g, '') === selectedId.toLowerCase()
      );
      
      return agent ? agent.id : selectedId;
    });
    
    return availableAgents
      .filter(agent => normalizedSelectedIds.includes(agent.id))
      .map(agent => agent.name);
  }, [chatSelectedAgents, availableAgents]);

  const [highlightedAgentIndex, setHighlightedAgentIndex] = useState(0);
  useEffect(() => {
    if (!isDebating || agentNames.length === 0) return;
    const timer = setInterval(() => {
      setHighlightedAgentIndex(prev => (prev + 1) % agentNames.length);
    }, 2000); // Aumentado de 900ms para 2000ms (2 segundos)
    return () => clearInterval(timer);
  }, [isDebating, agentNames.length]);

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black/30">
        <p className="text-white/60">Selecione um chat ou inicie um debate para ver as mensagens aqui.</p>
      </div>
    );
  }

  // Encontrar o agente que está "digitando" para mostrar o avatar
  const typingAgent = useMemo(() => {
    if (!isDebating || agentNames.length === 0) return null;
    const agentName = agentNames[highlightedAgentIndex];
    // Tentar encontrar o agente por nome exato
    let agent = availableAgents.find(a => a.name === agentName);
    
    // Se não encontrar, tentar busca mais flexível (case-insensitive, sem espaços extras)
    if (!agent) {
      agent = availableAgents.find(a => 
        a.name.toLowerCase().trim() === agentName.toLowerCase().trim() ||
        a.name.toLowerCase().replace(/\s+/g, '') === agentName.toLowerCase().replace(/\s+/g, '')
      );
    }
    
    // Se ainda não encontrar, retornar objeto com informações básicas mas manter o nome
    if (!agent) {
      // Tentar encontrar pelo ID selecionado
      const selectedId = chatSelectedAgents?.[highlightedAgentIndex];
      if (selectedId) {
        agent = availableAgents.find(a => a.id === selectedId);
      }
    }
    
    return agent || {
      id: 'unknown',
      name: agentName,
      role: 'Gerando resposta...',
      description: 'Gerando resposta...',
      avatar: '👤',
      color: '#8b5cf6'
    };
  }, [isDebating, agentNames, highlightedAgentIndex, availableAgents, chatSelectedAgents]);

    return (
    <div className="flex-1 flex flex-col bg-black/30 min-h-0 relative overflow-hidden">
      <div
        className="flex-1 chat-scroll px-5 py-6 space-y-4"
        style={{ paddingTop: '8rem' }}
      >
        {messages.length === 0 && !isDebating ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-white/50">Nenhuma mensagem ainda. Envie uma pergunta para começar o debate.</p>
          </div>
        ) : (
          <>
            {messages.map(message => (
              <MessageBubble key={message.id} message={message} onCopy={copyToClipboard} />
            ))}
            {isDebating && typingAgent && (
              <TypingIndicator agent={typingAgent} />
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      {scrollStyles}
    </div>
  );

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }
}

function TypingIndicator({ agent }: { agent: { id: string; name: string; role: string; description?: string; avatar?: string; color?: string } }) {
  const renderAvatar = () => {
    const avatar = agent.avatar || '👤';
    const isImageUrl = (url: string | undefined) => {
      if (!url) return false;
      return url.startsWith('http://') ||
             url.startsWith('https://') ||
             url.startsWith('data:image') ||
             url.startsWith('/') ||
             url.includes('.jpg') ||
             url.includes('.jpeg') ||
             url.includes('.png') ||
             url.includes('.gif') ||
             url.includes('.webp') ||
             url.includes('.svg');
    };
    
    if (agent.avatar && isImageUrl(agent.avatar)) {
      return (
        <img
          src={agent.avatar}
          alt={agent.name}
          className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
          onError={(e) => {
            // Se a imagem falhar ao carregar, mostrar fallback
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `<div class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/20"><span class="text-xs text-white/70">${agent.name?.[0] || '👤'}</span></div>`;
            }
          }}
        />
      );
    } else if (agent.avatar && agent.avatar.trim() !== '') {
      return (
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/20">
          <span className="text-lg">{avatar}</span>
        </div>
      );
    } else {
      return (
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/20">
          <span className="text-xs text-white/70">{agent.name?.[0]?.toUpperCase() || '👤'}</span>
        </div>
      );
    }
  };

  return (
    <div className="flex items-start gap-3 group">
      <div className="flex-shrink-0">
        {renderAvatar()}
      </div>
      <div className="flex flex-col items-start max-w-2xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-white/90">{agent.name}</span>
          <span className="text-xs text-white/50">{agent.description || ''}</span>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-2xl rounded-tl-sm px-4 py-3 shadow-lg border border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/60 italic">digitando</span>
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1.4s' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1.4s' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1.4s' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, onCopy }: { message: Message; onCopy: (text: string) => void }) {
  const isUserMessage = message.type === 'user' || message.type === 'question';

  if (message.type === 'sintese') {
    return (
      <div className="flex justify-center">
        <div className="rounded-full bg-white/10 px-6 py-2 text-xs uppercase tracking-[0.35em] text-white/80 shadow-inner border border-white/20">
          {message.content.replace(/[-]/g, '').trim()}
        </div>
      </div>
    );
  }

  if (message.type === 'sintese_conteudo') {
    return (
      <div className="flex justify-center">
        <div className="max-w-3xl text-center bg-gradient-to-br from-[#111827] to-[#1F2937] border border-[#3B82F6]/60 shadow-2xl rounded-3xl px-6 py-5 leading-relaxed text-white space-y-2">
          <p className="text-xs uppercase text-[#38BDF8] tracking-[0.35em]">Síntese Final</p>
          <p className="text-sm text-white/90 whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  if (isUserMessage) {
    return (
      <div className="flex justify-end items-start gap-2">
        <div className="flex flex-col items-end max-w-2xl text-right">
          <div className="bg-[#2563eb] rounded-2xl rounded-tr-sm px-4 py-3 shadow-lg border border-white/10">
            <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
          <span className="text-xs text-white/40 mt-1 px-1">
            {new Date(message.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
                  </div>
    );
  }

  return (
    <div className="flex items-start gap-3 group">
      <div className="relative flex-shrink-0">
        {(() => {
          // Função auxiliar para verificar se é uma URL válida de imagem
          const isImageUrl = (avatar: string | undefined) => {
            if (!avatar) return false;
            return avatar.startsWith('http://') || 
                   avatar.startsWith('https://') || 
                   avatar.startsWith('data:image') ||
                   avatar.startsWith('/');
          };
          
          // Se tiver avatar e for URL de imagem, renderizar como imagem
          if (message.agentAvatar && isImageUrl(message.agentAvatar)) {
            return (
              <>
                <img
                  src={message.agentAvatar}
                  alt={message.agentName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
                  onError={(e) => {
                    // Se a imagem falhar ao carregar, ocultar e mostrar fallback
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) {
                      fallback.style.display = 'flex';
                    }
                  }}
                />
                {/* Fallback caso a imagem falhe ao carregar */}
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/20" style={{ display: 'none' }}>
                  <span className="text-lg">{message.agentAvatar || message.agentName?.[0] || '👤'}</span>
                </div>
              </>
            );
          } else if (message.agentAvatar) {
            // É emoji/texto - renderizar como texto
            return (
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/20">
                <span className="text-lg">{message.agentAvatar}</span>
                  </div>
            );
          } else {
            // Sem avatar - mostrar inicial do nome
            return (
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/20">
                <span className="text-xs text-white/70">{message.agentName?.[0] || '👤'}</span>
              </div>
            );
          }
        })()}
      </div>
      <div className="flex flex-col items-start max-w-2xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-white/90">{message.agentName}</span>
          <span className="text-xs text-white/50">{message.agentDescription || ''}</span>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-2xl rounded-tl-sm px-4 py-3 shadow-lg border border-white/10 relative">
          <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        <div className="flex items-center gap-3 mt-1 px-1">
          <span className="text-xs text-white/40">
            {new Date(message.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onCopy(message.content)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title="Copiar"
            >
              <Copy size={14} className="text-white/60" />
            </button>
            <button className="p-1 hover:bg-white/10 rounded transition-colors">
              <MoreVertical size={14} className="text-white/60" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const scrollStyles = (
  <style jsx global>{`
    .chat-scroll {
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
    }

    .chat-scroll::-webkit-scrollbar {
      width: 8px;
    }

    .chat-scroll::-webkit-scrollbar-track {
      background: transparent;
    }

    .chat-scroll::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
    }

    .chat-scroll::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.35);
    }
  `}</style>
);

