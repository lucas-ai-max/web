'use client';

import { Sidebar } from '@/components/sidebar/Sidebar';
import { Header } from '@/components/layout/Header';
import { ChatArea } from '@/components/chat/ChatArea';
import { ChatInput } from '@/components/chat/ChatInput';
import { HomeScreen } from '@/components/home/HomeScreen';
import { useStore } from '@/lib/store';
import { Message, Agent } from '@/lib/types';
import { startDebate, getAgents } from '@/lib/api';
import { AGENTS } from '@/lib/constants';
import { useState, useEffect, useMemo } from 'react';

export default function Home() {
  const {
    chats,
    createChat,
    addMessage,
    selectedAgents,
    numRodadas,
    setIsDebating,
    updateChatDebateId,
    setCurrentChat,
  } = useStore();
  const isDebating = useStore(state => state.isDebating);
  
  // Estado para agentes dinâmicos do banco de dados
  const [availableAgents, setAvailableAgents] = useState<Agent[]>(AGENTS);
  
  // Carregar agentes da API ao montar o componente
  useEffect(() => {
    getAgents()
      .then(response => {
        const formattedAgents: Agent[] = response.agentes.map((agent: any) => ({
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
        // Manter lista hardcoded em caso de erro
        setAvailableAgents(AGENTS);
      });
  }, []);

  const [messageQueueByChat, setMessageQueueByChat] = useState<Record<string, string[]>>({});
  const chat = useStore(state => state.getCurrentChat());
  const currentChatId = useStore(state => state.currentChatId);
  const activeChatId = currentChatId ?? chat?.id ?? null;
  const queuedMessages = useMemo(() => {
    if (!activeChatId) return [];
    return messageQueueByChat[activeChatId] ?? [];
  }, [messageQueueByChat, activeChatId]);

  const appendMessageToQueue = (chatId: string, message: string) => {
    let nextQueue: string[] = [];
    setMessageQueueByChat(prev => {
      const current = prev[chatId] ?? [];
      nextQueue = [...current, message];
      return {
        ...prev,
        [chatId]: nextQueue
      };
    });
    return nextQueue;
  };

  const buildSummaryContext = () => {
    const currentChat = chats.find(c => c.id === activeChatId);
    if (!currentChat) return [];
    return currentChat.messages.map(message => {
      if (message.type === 'agent') {
        return `${message.agentName || message.agentRole || 'Mentor'}: ${message.content}`;
      }
      return `Você: ${message.content}`;
    });
  };

  const processDebateResponse = (chatId: string, response: Awaited<ReturnType<typeof startDebate>>, mode: 'debate' | 'sintese') => {
    if (response.debate_id) {
      updateChatDebateId(chatId, response.debate_id);

      const currentChat = chats.find(c => c.id === chatId);
      if (currentChat?.folderId) {
        import('@/lib/folders-api').then(({ moveDebateToFolder }) => {
          moveDebateToFolder(response.debate_id, currentChat.folderId).catch(error => {
            console.error('Erro ao sincronizar pasta no banco:', error);
          });
        });
      }
    }

    let currentRound = 0;
    for (const item of response.historico || []) {
      if (item.tipo === 'rodada') {
        currentRound++;
        const roundMessage: Message = {
          id: `round-${currentRound}-${Date.now()}`,
          type: 'rodada',
          content: item.conteudo,
          roundNumber: currentRound,
          timestamp: new Date()
        };
        addMessage(chatId, roundMessage);
      } else if (item.tipo === 'resposta') {
        let agent = availableAgents.find(a => 
          item.agente?.includes(a.name) || 
          item.agente === a.role ||
          item.agente === a.name ||
          (selectedAgents.includes(a.id) && item.agente?.includes(a.role))
        );

        if (!agent) {
          agent = availableAgents.find(a => selectedAgents.includes(a.id));
        }

        const agentMessage: Message = {
          id: `agent-${Date.now()}-${Math.random()}`,
          type: 'agent',
          agentId: agent?.id || item.agente || 'unknown',
          agentName: agent?.name || item.agente || 'Agente',
          agentRole: agent?.role || item.agente || '',
          agentAvatar: agent?.avatar || '👤',
          agentColor: agent?.color || '#8b5cf6',
          content: item.conteudo,
          timestamp: new Date(),
          roundNumber: currentRound
        };
        addMessage(chatId, agentMessage);
      } else if (item.tipo === 'sintese') {
        const sinteseMessage: Message = {
          id: `sintese-${Date.now()}`,
          type: 'sintese',
          content: item.conteudo,
          timestamp: new Date()
        };
        addMessage(chatId, sinteseMessage);
      }
    }

    if (response.sintese) {
      const sinteseConteudo: Message = {
        id: `sintese-content-${Date.now()}`,
        type: 'sintese_conteudo',
        content: response.sintese,
        timestamp: new Date()
      };
      addMessage(chatId, sinteseConteudo);
    }

  };

  const sendDebateRequest = async ({
    chatId,
    prompt,
    context,
    mode,
    salvar
  }: {
    chatId: string;
    prompt: string;
    context: string[];
    mode: 'debate' | 'sintese';
    salvar: boolean;
  }) => {
    setIsDebating(true);
    try {
      const response = await startDebate({
        agentes: selectedAgents,
        pergunta: prompt,
        num_rodadas: numRodadas,
        contexto: context,
        modo: mode,
        salvar
      });
      processDebateResponse(chatId, response, mode);
    } catch (error) {
      console.error('Erro ao iniciar debate:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: 'user',
        content: `Erro ao executar debate: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        timestamp: new Date()
      };
      addMessage(chatId, errorMessage);
    } finally {
      setIsDebating(false);
    }
  };

  const handleQueueMessage = (message: string) => {
    if (selectedAgents.length < 2) {
      alert('Selecione pelo menos 2 agentes para iniciar o debate');
      return;
    }

    let chatId = activeChatId;
    if (!chatId) {
      chatId = createChat({
        selectedAgents,
        numRodadas,
        pergunta: message
      });
      setCurrentChat(chatId);
    }

    const nextQueue = appendMessageToQueue(chatId, message);

    const questionMessage: Message = {
      id: Date.now().toString(),
      type: 'question',
      content: message,
      timestamp: new Date()
    };
    addMessage(chatId, questionMessage);

    void sendDebateRequest({
      chatId,
      prompt: message,
      context: nextQueue,
      mode: 'debate',
      salvar: false
    });
  };

  const handleGenerateConclusion = () => {
    const chatId = activeChatId;
    if (!chatId) return;

    if (selectedAgents.length < 2) {
      alert('Selecione pelo menos 2 agentes para iniciar o debate');
      return;
    }

    const summaryContext = buildSummaryContext();
    if (summaryContext.length === 0) return;

    void sendDebateRequest({
      chatId,
      prompt: summaryContext[summaryContext.length - 1],
      context: summaryContext,
      mode: 'sintese',
      salvar: true
    });
  };


  return (
    <div className="flex h-screen bg-black overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[280px] overflow-hidden relative">
        <Header />
        {!chat || !currentChatId ? (
          <HomeScreen onQueueMessage={handleQueueMessage} />
        ) : (
          <>
            <ChatArea />
            <ChatInput
              onQueueMessage={handleQueueMessage}
              onGenerateConclusion={handleGenerateConclusion}
              queueSize={queuedMessages.length}
              disabled={isDebating}
            />
          </>
        )}
      </div>
    </div>
  );
}
