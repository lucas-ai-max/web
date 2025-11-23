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
import { useToastStore } from '@/lib/toast-store';
import { ToastProvider } from '@/components/ui/ToastProvider';

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
    setSelectedAgents,
  } = useStore();
  const isDebating = useStore(state => state.isDebating);
  const { showToast } = useToastStore();
  
  // Estado para agentes dinâmicos do banco de dados
  const [availableAgents, setAvailableAgents] = useState<Agent[]>(AGENTS);
  
  // Log do estado inicial do selectedAgents e validar agentes
  useEffect(() => {
    console.log('🔍 [DEBUG] Componente montado. selectedAgents inicial:', selectedAgents);
    console.log('🔍 [DEBUG] Total de agentes selecionados:', selectedAgents.length);
    
    // Validar e limpar agentes inválidos/duplicados
    if (selectedAgents.length > 0) {
      const uniqueAgents = [...new Set(selectedAgents)];
      if (uniqueAgents.length !== selectedAgents.length) {
        console.log('⚠️ [DEBUG] Encontrados agentes duplicados. Limpando...');
        setSelectedAgents(uniqueAgents);
      }
    }
  }, []);
  
  // Log quando selectedAgents mudar
  useEffect(() => {
    console.log('🔍 [DEBUG] selectedAgents mudou:', selectedAgents);
    console.log('🔍 [DEBUG] Total:', selectedAgents.length);
  }, [selectedAgents]);
  
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

  // Carregar agentes da API ao montar o componente
  useEffect(() => {
    getAgents()
      .then(response => {
        const formattedAgents: Agent[] = response.agentes.map((agent: any) => ({
          id: generateAgentId(agent.name, agent.id), // Gerar ID único se necessário
          name: agent.name,
          role: agent.role,
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
        
        const finalAgents = Array.from(allAgentsMap.values());
        setAvailableAgents(finalAgents);
        
        // Normalizar IDs selecionados para os novos IDs gerados
        const storeState = useStore.getState();
        const selectedAgents = storeState.selectedAgents;
        if (selectedAgents.length > 0) {
          const normalizedIds = selectedAgents.map(selectedId => {
            // Se já é um UUID válido, verificar se existe nos agentes
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(selectedId)) {
              // Verificar se o UUID existe nos agentes carregados
              const agentById = finalAgents.find(a => a.id === selectedId);
              if (agentById) return selectedId;
            }
            
            // Tentar encontrar o agente por ID antigo ou nome
            const agent = finalAgents.find(a => 
              a.id === selectedId || 
              a.name.toLowerCase() === selectedId.toLowerCase() ||
              a.name.toLowerCase().replace(/\s+/g, '') === selectedId.toLowerCase()
            );
            
            return agent ? agent.id : selectedId;
          }).filter((id, index, arr) => {
            // Remover duplicatas e IDs inválidos (que não correspondem a nenhum agente)
            if (arr.indexOf(id) !== index) return false;
            const agentExists = finalAgents.some(a => a.id === id);
            if (!agentExists) {
              console.log(`🔍 [DEBUG] Removendo ID inválido: ${id}`);
            }
            return agentExists;
          });
          
          if (JSON.stringify(normalizedIds) !== JSON.stringify(selectedAgents)) {
            console.log('🔍 [DEBUG] Normalizando IDs selecionados:', selectedAgents, '→', normalizedIds);
            storeState.setSelectedAgents(normalizedIds);
          }
        }
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
      const debateId = response.debate_id; // Extrair para garantir tipagem dentro do callback
      updateChatDebateId(chatId, debateId);

      const currentChat = chats.find(c => c.id === chatId);
      const folderId = currentChat?.folderId;
      if (folderId) {
        import('@/lib/folders-api').then(({ moveDebateToFolder }) => {
          moveDebateToFolder(debateId, folderId).catch(error => {
            console.error('Erro ao sincronizar pasta no banco:', error);
          });
        });
      }
    }

    // Usar os agentes selecionados do chat atual, não do store global
    const currentChat = chats.find(c => c.id === chatId);
    const chatSelectedAgents = currentChat?.selectedAgents || selectedAgents;
    let sinteseJaAdicionada = false;

    // Controle para evitar duplicação de mensagens
    const mensagensAdicionadas = new Set<string>();
    
    // Quando o modo é 'sintese', verificar mensagens existentes no chat para evitar duplicação
    const existingMessages = currentChat?.messages || [];
    const existingMessageKeys = new Set<string>();
    if (mode === 'sintese') {
      existingMessages.forEach(msg => {
        if (msg.type === 'agent' && msg.agentName && msg.content) {
          const key = `${msg.agentName}-${msg.content.substring(0, 50)}`;
          existingMessageKeys.add(key);
        }
      });
    }
    
    for (const item of response.historico || []) {
      // Ignorar sintese e sintese_conteudo do histórico - serão processados separadamente
      if (item.tipo === 'sintese' || item.tipo === 'sintese_conteudo') {
        if (item.tipo === 'sintese_conteudo' && mode === 'sintese') {
          sinteseJaAdicionada = true;
          const sinteseConteudo: Message = {
            id: `sintese-content-${Date.now()}`,
            type: 'sintese_conteudo',
            content: item.conteudo,
            timestamp: new Date()
          };
          addMessage(chatId, sinteseConteudo);
        }
        continue;
      }
      
      // Ignorar mensagens tipo "pergunta" - o usuário já adicionou a pergunta
      if (item.tipo === 'pergunta') {
        continue;
      }
      
      if (item.tipo === 'resposta') {
        // Criar chave única para verificar duplicação
        const messageKey = `${item.agente}-${item.conteudo?.substring(0, 50)}`;
        
        // Se o modo é 'sintese', verificar se a mensagem já existe no chat
        if (mode === 'sintese' && existingMessageKeys.has(messageKey)) {
          console.log(`[DEBUG] Ignorando mensagem já existente no chat: ${item.agente}`);
          continue;
        }
        
        if (mensagensAdicionadas.has(messageKey)) {
          console.log(`[DEBUG] Ignorando mensagem duplicada do agente: ${item.agente}`);
          continue;
        }
        
        // Tentar encontrar o agente correspondente ao nome/role retornado pelo backend
        // Primeiro, encontrar o agente pelo nome/role (independente de estar selecionado)
        let agent = null;
        
        // PRIORIDADE 1: Match exato por nome (mais confiável)
        agent = availableAgents.find(a => item.agente === a.name);
        
        // PRIORIDADE 2: Match exato por role
        if (!agent) {
          agent = availableAgents.find(a => item.agente === a.role);
        }
        
        // PRIORIDADE 3: Match parcial - nome do agente está contido no item.agente
        if (!agent && item.agente) {
          agent = availableAgents.find(a => item.agente?.includes(a.name));
        }
        
        // PRIORIDADE 4: Match parcial - role do agente está contido no item.agente
        if (!agent && item.agente) {
          agent = availableAgents.find(a => item.agente?.includes(a.role));
        }
        
        // PRIORIDADE 5: Match parcial reverso - item.agente está contido no nome ou role
        if (!agent && item.agente) {
          const agenteLower = item.agente.toLowerCase();
          agent = availableAgents.find(a => 
            a.name.toLowerCase().includes(agenteLower) ||
            a.role.toLowerCase().includes(agenteLower)
          );
        }
        
        // Após encontrar o agente pelo nome/role, verificar se ele está selecionado
        // Também verificar por ID antigo (normalização de IDs)
        if (agent) {
          // Criar lista de IDs válidos para este agente (incluindo nomes antigos)
          const validIdsForAgent = [
            agent.id,
            agent.name.toLowerCase(),
            agent.name.toLowerCase().replace(/\s+/g, ''),
            generateAgentId(agent.name),
            generateAgentId(agent.name).replace('agent_', '')
          ];
          
          // Verificar se algum dos IDs válidos está na lista de selecionados
          const isSelected = chatSelectedAgents.some(selectedId => {
            // Match direto por ID
            if (selectedId === agent.id) return true;
            
            // Match por nome (para IDs antigos como "tim", "elon")
            if (selectedId.toLowerCase() === agent.name.toLowerCase()) return true;
            if (selectedId.toLowerCase() === agent.name.toLowerCase().replace(/\s+/g, '')) return true;
            
            // Match por IDs válidos gerados
            return validIdsForAgent.includes(selectedId);
          });
          
          if (!isSelected) {
            console.log(`[DEBUG] Ignorando resposta de agente não selecionado: ${item.agente} (ID: ${agent.id}, Nome: ${agent.name})`);
            console.log(`[DEBUG] Agentes selecionados:`, chatSelectedAgents);
            agent = null;
          }
        }

        // Se ainda não encontrou o agente ou ele não está selecionado, pular esta resposta
        if (!agent) {
          continue;
        }

        // Marcar mensagem como adicionada
        mensagensAdicionadas.add(messageKey);

        const agentMessage: Message = {
          id: `agent-${Date.now()}-${Math.random()}`,
          type: 'agent',
          agentId: agent.id,
          agentName: agent.name,
          agentRole: agent.role,
          agentAvatar: agent.avatar || '👤',
          agentColor: agent.color || '#8b5cf6',
          content: item.conteudo,
          timestamp: new Date()
        };
        addMessage(chatId, agentMessage);
      }
    }

    // Adicionar síntese apenas se não foi adicionada do histórico e se veio no response
    if (response.sintese && !sinteseJaAdicionada) {
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
    // isDebating já foi setado em handleQueueMessage para aparecer imediatamente
    // Mas garantimos que está true aqui também para casos onde sendDebateRequest é chamado diretamente
    if (!isDebating) {
      setIsDebating(true);
    }
    try {
      console.log('🔍 [DEBUG] Agentes selecionados no store:', selectedAgents);
      console.log('🔍 [DEBUG] Total de agentes selecionados:', selectedAgents.length);
      
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
    if (selectedAgents.length < 1) {
      showToast('Selecione pelo menos 1 agente para iniciar o debate', 'warning');
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
    
    // Ativar indicador de "digitando" imediatamente após adicionar a mensagem do usuário
    setIsDebating(true);

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

    if (selectedAgents.length < 1) {
      showToast('Selecione pelo menos 1 agente para iniciar o debate', 'warning');
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
      <ToastProvider />
    </div>
  );
}
