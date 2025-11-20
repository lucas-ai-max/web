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
import { useState, useEffect } from 'react';

export default function Home() {
  const {
    chats,
    createChat,
    addMessage,
    selectedAgents,
    numRodadas,
    setIsDebating,
    updateChatDebateId,
  } = useStore();
  
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

  const handleSendMessage = async (pergunta: string) => {
    if (selectedAgents.length < 2) {
      alert('Selecione pelo menos 2 agentes para iniciar o debate');
      return;
    }

    const chatId = createChat({
      selectedAgents,
      numRodadas,
      pergunta
    });

    // Adicionar mensagem de pergunta
    const questionMessage: Message = {
      id: Date.now().toString(),
      type: 'question',
      content: pergunta,
      timestamp: new Date()
    };
    addMessage(chatId, questionMessage);

    setIsDebating(true);

    try {
      const response = await startDebate({
        agentes: selectedAgents,
        pergunta,
        num_rodadas: numRodadas
      });

      // Atualizar chat com debate_id do banco (se retornado)
      if (response.debate_id) {
        updateChatDebateId(chatId, response.debate_id);
        
        // Se o chat já estava em uma pasta, atualizar no banco também
        const currentChat = chats.find(c => c.id === chatId);
        if (currentChat?.folderId) {
          // Importar a função de mover para pasta
          import('@/lib/folders-api').then(({ moveDebateToFolder }) => {
            moveDebateToFolder(response.debate_id, currentChat.folderId).catch(error => {
              console.error('Erro ao sincronizar pasta no banco:', error);
            });
          });
        }
      }

      // Processar resposta e adicionar mensagens
      let currentRound = 0;
      for (const item of response.historico || []) {
        if (item.tipo === 'rodada') {
          currentRound++;
          const roundMessage: Message = {
            id: `round-${currentRound}-${Date.now()}`,
            type: 'round',
            content: item.conteudo,
            roundNumber: currentRound,
            timestamp: new Date()
          };
          addMessage(chatId, roundMessage);
        } else if (item.tipo === 'resposta') {
          // Encontrar agente pelo nome/role - usar lista dinâmica
          let agent = availableAgents.find(a => 
            item.agente?.includes(a.name) || 
            item.agente === a.role ||
            item.agente === a.name ||
            (selectedAgents.includes(a.id) && item.agente?.includes(a.role))
          );
          
          // Se não encontrou, tentar buscar pelo ID selecionado
          if (!agent) {
            agent = availableAgents.find(a => selectedAgents.includes(a.id));
          }
          
          // Se ainda não encontrou, criar um agente temporário com dados do backend
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

      // Adicionar síntese final se disponível
      console.log('Response completa:', response);
      console.log('Síntese recebida:', response.sintese);
      
      if (response.sintese) {
        console.log('Adicionando síntese ao chat...');
        const sinteseConteudo: Message = {
          id: `sintese-content-${Date.now()}`,
          type: 'sintese_conteudo',
          content: response.sintese,
          timestamp: new Date()
        };
        addMessage(chatId, sinteseConteudo);
        console.log('Síntese adicionada:', sinteseConteudo);
      } else {
        console.log('⚠️ Nenhuma síntese na resposta');
      }
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

  const chat = useStore(state => state.getCurrentChat());
  const currentChatId = useStore(state => state.currentChatId);

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[280px] overflow-hidden relative">
        <Header />
        {!chat || !currentChatId ? (
          <HomeScreen onStartDebate={handleSendMessage} />
        ) : (
          <>
            <ChatArea />
            <ChatInput onSendMessage={handleSendMessage} />
          </>
        )}
      </div>
    </div>
  );
}
