'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { Header } from '@/components/layout/Header';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { MessageSquarePlus, MoreVertical, List, Share2, Pencil, FolderOpen, Trash2, Settings } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Chat, Message } from '@/lib/types';
import { AGENTS } from '@/lib/constants';
import { getAgents, startDebate } from '@/lib/api';
import { Agent } from '@/lib/types';
import { Toast } from '@/components/ui/toast';
import { HomeScreen } from '@/components/home/HomeScreen';
import { ChatArea } from '@/components/chat/ChatArea';
import { ChatInput } from '@/components/chat/ChatInput';
import { useToastStore } from '@/lib/toast-store';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { useConfirm } from '@/lib/useConfirm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function FolderPage() {
  const params = useParams();
  const router = useRouter();
  const folderId = params.id as string;
  
  const { folders, chats, setCurrentChat, deleteChat, moveChatToFolder, updateFolder, deleteFolder, setSelectedFolder, updateChat, createChat, addMessage, setIsDebating, updateChatDebateId, selectedAgents, numRodadas, currentChatId: storeCurrentChatId, setCurrentChat: setStoreCurrentChat } = useStore();
  const isDebating = useStore(state => state.isDebating);
  const { showToast } = useToastStore();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const [availableAgents, setAvailableAgents] = useState<Agent[]>(AGENTS);
  const [menuOpenChatId, setMenuOpenChatId] = useState<string | null>(null);
  const [draggedChatId, setDraggedChatId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [renameChatId, setRenameChatId] = useState<string | null>(null);
  const [newChatTitle, setNewChatTitle] = useState<string>('');
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  
  // Usar o currentChatId do store, mas apenas quando estiver nessa pasta
  const currentChatId = storeCurrentChatId && chats.find(c => c.id === storeCurrentChatId)?.folderId === folderId ? storeCurrentChatId : null;

  const folder = folders.find(f => f.id === folderId);
  const folderChats = chats.filter(chat => chat.folderId === folderId);

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
      .catch(() => {
        setAvailableAgents(AGENTS);
      });
  }, []);

  const [messageQueueByChat, setMessageQueueByChat] = useState<Record<string, string[]>>({});
  const queuedMessages = useMemo(() => {
    if (!currentChatId) return [];
    return messageQueueByChat[currentChatId] ?? [];
  }, [messageQueueByChat, currentChatId]);

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
    if (!currentChatId) return [];
    const currentChat = chats.find(c => c.id === currentChatId);
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
        let agent: Agent | undefined = undefined;
        
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
          const currentAgent = agent; // Garantir que TypeScript entenda que não é undefined
          const validIdsForAgent = [
            currentAgent.id,
            currentAgent.name.toLowerCase(),
            currentAgent.name.toLowerCase().replace(/\s+/g, ''),
            generateAgentId(currentAgent.name),
            generateAgentId(currentAgent.name).replace('agent_', '')
          ];
          
          // Verificar se algum dos IDs válidos está na lista de selecionados
          const isSelected = chatSelectedAgents.some(selectedId => {
            // Match direto por ID
            if (selectedId === currentAgent.id) return true;
            
            // Match por nome (para IDs antigos como "tim", "elon")
            if (selectedId.toLowerCase() === currentAgent.name.toLowerCase()) return true;
            if (selectedId.toLowerCase() === currentAgent.name.toLowerCase().replace(/\s+/g, '')) return true;
            
            // Match por IDs válidos gerados
            return validIdsForAgent.includes(selectedId);
          });
          
          if (!isSelected) {
            console.log(`[DEBUG] Ignorando resposta de agente não selecionado: ${item.agente} (ID: ${currentAgent.id}, Nome: ${currentAgent.name})`);
            console.log(`[DEBUG] Agentes selecionados:`, chatSelectedAgents);
            agent = undefined;
          }
        }

        // Se ainda não encontrou o agente ou ele não está selecionado, pular esta resposta
        if (!agent) {
          continue;
        }

        // Marcar mensagem como adicionada
        mensagensAdicionadas.add(messageKey);

        // TypeScript: garantir que agent não é undefined
        const finalAgent = agent;
        const agentMessage: Message = {
          id: `agent-${Date.now()}-${Math.random()}`,
          type: 'agent',
          agentId: finalAgent.id,
          agentName: finalAgent.name,
          agentRole: finalAgent.role,
          agentAvatar: finalAgent.avatar || '👤',
          agentColor: finalAgent.color || '#8b5cf6',
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

    if (mode === 'sintese' && response.debate_id) {
      const currentChat = chats.find(c => c.id === chatId);
      const folderId = currentChat?.folderId;
      if (folderId) {
        import('@/lib/folders-api').then(({ moveDebateToFolder }) => {
          moveDebateToFolder(response.debate_id, folderId).catch(error => {
            console.error('Erro ao sincronizar pasta no banco:', error);
          });
        });
      }
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

  if (!folder) {
    return (
      <div className="flex h-screen bg-black overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col ml-[280px] overflow-hidden relative">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <p className="text-white/70">Pasta não encontrada</p>
          </div>
        </div>
      </div>
    );
  }

  const handleChatClick = (chatId: string) => {
    setStoreCurrentChat(chatId);
    setShowNewConversation(false);
  };

  const handleDeleteChat = async (chatId: string) => {
    const confirmed = await confirm({
      title: 'Confirmar exclusão',
      message: 'Tem certeza que deseja excluir este chat?',
      variant: 'destructive',
    });
    
    if (!confirmed) return;
    
    deleteChat(chatId);
    setMenuOpenChatId(null);
  };

  const handleRemoveFromFolder = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      moveChatToFolder(chatId, null);
      setToastMessage(`Chat "${chat.title}" removido da pasta`);
    }
    setMenuOpenChatId(null);
  };

  const handleShare = async (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      const chatUrl = `${window.location.origin}/?chat=${chatId}`;
      
      // Tentar usar Web Share API se disponível
      if (navigator.share) {
        try {
          await navigator.share({
            title: chat.title,
            text: `Veja este chat: ${chat.title}`,
            url: chatUrl
          });
          setToastMessage('Chat compartilhado com sucesso!');
        } catch (error) {
          // Usuário cancelou ou ocorreu erro, usar fallback
          await handleCopyLink(chatUrl);
        }
      } else {
        // Fallback: copiar link para área de transferência
        await handleCopyLink(chatUrl);
      }
    }
    setMenuOpenChatId(null);
  };

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setToastMessage('Link copiado para a área de transferência!');
    } catch (error) {
      console.error('Erro ao copiar link:', error);
      setToastMessage('Erro ao copiar link');
    }
  };

  const handleRename = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setRenameChatId(chatId);
      setNewChatTitle(chat.title);
      setIsRenameDialogOpen(true);
    }
    setMenuOpenChatId(null);
  };

  const handleSaveRename = () => {
    if (renameChatId && newChatTitle.trim()) {
      updateChat(renameChatId, { title: newChatTitle.trim() });
      setToastMessage('Chat renomeado com sucesso!');
      setIsRenameDialogOpen(false);
      setRenameChatId(null);
      setNewChatTitle('');
    }
  };

  const getChatDescription = (chat: Chat): string => {
    const firstMessage = chat.messages.find(m => m.type === 'question' || m.type === 'user');
    if (firstMessage) {
      return firstMessage.content.length > 80 
        ? firstMessage.content.substring(0, 80) + '...' 
        : firstMessage.content;
    }
    return 'Nenhuma mensagem ainda';
  };

  const getChatAgents = (chat: Chat) => {
    return availableAgents.filter(agent => chat.selectedAgents.includes(agent.id));
  };

  const handleNewChat = () => {
    setShowNewConversation(true);
    setStoreCurrentChat(null);
  };

  const handleQueueMessage = (message: string) => {
    if (selectedAgents.length < 1) {
      showToast('Selecione pelo menos 1 agente para iniciar o debate', 'warning');
      return;
    }

    let chatId = currentChatId;
    const isNewChat = !chatId;
    if (!chatId) {
      chatId = createChat({
      selectedAgents,
      numRodadas,
        pergunta: message
    });
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

    if (isNewChat) {
      moveChatToFolder(chatId, folderId);
    setStoreCurrentChat(chatId);
    setShowNewConversation(false);
    }

    void sendDebateRequest({
      chatId,
      prompt: message,
      context: nextQueue,
      mode: 'debate',
      salvar: false
    });
  };

  const handleGenerateConclusion = () => {
    const chatId = currentChatId;
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

  const handleBackToList = () => {
    setShowNewConversation(false);
    setStoreCurrentChat(null);
  };

  const handleDeleteFolder = async () => {
    if (folder) {
      const folderChats = chats.filter(chat => chat.folderId === folderId);
      const confirmed = await confirm({
        title: 'Confirmar exclusão',
        message: `Tem certeza que deseja excluir a pasta "${folder.name}"? ${folderChats.length > 0 ? `Os ${folderChats.length} chat(s) serão movidos para o geral.` : ''}`,
        variant: 'destructive',
      });
      
      if (!confirmed) return;
      
      deleteFolder(folderId);
      setToastMessage(`Pasta "${folder.name}" excluída${folderChats.length > 0 ? `. ${folderChats.length} chat(s) movido(s) para o geral.` : ''}`);
      setSelectedFolder(null);
      router.push('/');
    }
  };

  const handleDragStart = (e: React.DragEvent, chatId: string) => {
    setDraggedChatId(chatId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', chatId);
    // Usar offset pequeno para ficar próximo do cursor
    const dragElement = e.currentTarget as HTMLElement;
    const rect = dragElement.getBoundingClientRect();
    const ghost = dragElement.cloneNode(true) as HTMLElement;
    ghost.style.position = 'absolute';
    ghost.style.top = '-1000px';
    ghost.style.left = '-1000px';
    ghost.style.opacity = '0.9';
    ghost.style.transform = 'rotate(2deg)';
    ghost.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.6)';
    ghost.style.pointerEvents = 'none';
    ghost.style.width = `${rect.width}px`;
    document.body.appendChild(ghost);
    // Offset pequeno para ficar próximo do cursor
    const offsetX = 5;
    const offsetY = 5;
    e.dataTransfer.setDragImage(ghost, offsetX, offsetY);
    setTimeout(() => {
      if (document.body.contains(ghost)) {
        document.body.removeChild(ghost);
      }
    }, 0);
  };

  const handleDragEnd = () => {
    setDraggedChatId(null);
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden relative">
      {/* Background Principal */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: `url('/BG%20PRINCIPAL.png')` }}
      />
      {/* Overlay escuro para melhorar legibilidade */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-0" />
      
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[280px] overflow-hidden relative z-10 pt-24">
        <Header />
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative custom-scrollbar">
          {showNewConversation ? (
            <div className="h-full">
              <HomeScreen onQueueMessage={handleQueueMessage} folderName={folder?.name} />
            </div>
          ) : currentChatId ? (
            <div className="flex-1 flex flex-col h-full">
              <ChatArea />
              <ChatInput
                onQueueMessage={handleQueueMessage}
                onGenerateConclusion={handleGenerateConclusion}
                queueSize={queuedMessages.length}
                disabled={isDebating}
              />
            </div>
          ) : (
          <div className="min-h-full max-w-5xl mx-auto px-12 pb-8">
            {/* Header da Pasta */}
            <div className="flex items-center justify-between pt-8 pb-6 mx-2">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 flex items-center justify-center">
                  <img src="/folder-open.png" alt={folder.name} className="w-10 h-10 object-contain" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{folder.name}</h1>
                  <p className="text-white/60 text-sm">{folderChats.length} {folderChats.length === 1 ? 'chat' : 'chats'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="text-white/60 hover:text-white hover:bg-white/10 rounded-lg px-3 py-2"
                    >
                      <Settings className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#2d2d2d] border-white/10 w-48">
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setTimeout(() => {
                          handleDeleteFolder();
                        }, 0);
                      }}
                      className="text-red-500 hover:bg-red-500/20 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir pasta
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  className="bg-[#3B82F6] hover:bg-[#2563EB] rounded-lg px-4 py-2 text-white font-medium flex items-center gap-2"
                  onClick={handleNewChat}
                >
                  <MessageSquarePlus className="w-5 h-5" />
                  Iniciar nova conversa
                </Button>
              </div>
            </div>

            {/* Lista de Chats */}
            <div className="space-y-0 pb-8">
              {folderChats.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/60">Nenhum chat nesta pasta ainda</p>
                </div>
              ) : (
                folderChats.map((chat, index) => {
                  const chatAgents = getChatAgents(chat);
                  return (
                    <div
                      key={chat.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, chat.id)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center justify-between px-8 py-5 hover:bg-black/40 transition-all duration-200 cursor-pointer mx-2 my-2 ${
                        index !== folderChats.length - 1 ? 'border-b border-white/20' : ''
                      } ${
                        draggedChatId === chat.id 
                          ? 'opacity-30 scale-95 blur-sm cursor-grabbing' 
                          : 'cursor-grab active:cursor-grabbing'
                      }`}
                      style={{
                        borderRadius: '30px'
                      }}
                      onClick={() => handleChatClick(chat.id)}
                    >
                      {/* Título e Descrição */}
                      <div className="flex-1 min-w-0 mr-4">
                        <h3 className="text-white font-semibold text-base mb-1">{chat.title}</h3>
                        <p className="text-white/60 text-sm">{getChatDescription(chat)}</p>
                      </div>

                      {/* Avatares e Menu */}
                      <div className="flex items-center gap-4 flex-shrink-0">
                        {chatAgents.length > 0 && (
                          <div className="flex -space-x-2">
                            {chatAgents.slice(0, 5).map((agent) => (
                              <Avatar key={agent.id} className="w-8 h-8 border-2 border-black">
                                {agent.avatar && (agent.avatar.startsWith('http') || agent.avatar.startsWith('data:image') || agent.avatar.startsWith('https://')) ? (
                                  <AvatarImage
                                    src={agent.avatar}
                                    alt={agent.name}
                                    className="object-cover"
                                  />
                                ) : null}
                                <AvatarFallback className="text-xs bg-[#3B82F6] text-white">
                                  {agent.avatar && !agent.avatar.startsWith('http') && !agent.avatar.startsWith('data:image') ? agent.avatar : (agent.name?.charAt(0)?.toUpperCase() || '👤')}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {chatAgents.length > 5 && (
                              <div className="w-8 h-8 rounded-full bg-[#3B82F6] border-2 border-black flex items-center justify-center">
                                <span className="text-xs text-white">+{chatAgents.length - 5}</span>
                              </div>
                            )}
                          </div>
                        )}
                        <DropdownMenu open={menuOpenChatId === chat.id} onOpenChange={(open) => setMenuOpenChatId(open ? chat.id : null)}>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenChatId(menuOpenChatId === chat.id ? null : chat.id);
                              }}
                              className="text-white/60 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#2d2d2d] border-white/10 w-48">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleChatClick(chat.id);
                                setMenuOpenChatId(null);
                              }}
                              className="text-white hover:bg-white/10 cursor-pointer"
                            >
                              <List className="w-4 h-4 mr-2" />
                              Ver Mensagens
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShare(chat.id);
                              }}
                              className="text-white hover:bg-white/10 cursor-pointer"
                            >
                              <Share2 className="w-4 h-4 mr-2" />
                              Compartilhar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRename(chat.id);
                              }}
                              className="text-white hover:bg-white/10 cursor-pointer"
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Renomear
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFromFolder(chat.id);
                              }}
                              className="text-white hover:bg-white/10 cursor-pointer"
                            >
                              <FolderOpen className="w-4 h-4 mr-2" />
                              Remover da pasta
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                setTimeout(() => {
                                  handleDeleteChat(chat.id);
                                }, 0);
                              }}
                              className="text-red-500 hover:bg-red-500/20 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          )}
        </div>
      </div>

      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Dialog de Renomear */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="bg-[#2d2d2d] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Renomear Chat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="chat-title" className="text-white mb-2 block">
                Novo nome do chat
              </Label>
              <Input
                id="chat-title"
                value={newChatTitle}
                onChange={(e) => setNewChatTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveRename();
                  }
                }}
                className="bg-black/40 border-white/20 text-white placeholder:text-white/40"
                placeholder="Digite o novo nome"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setIsRenameDialogOpen(false);
                setRenameChatId(null);
                setNewChatTitle('');
              }}
              className="text-white hover:bg-white/10"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveRename}
              disabled={!newChatTitle.trim()}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ToastProvider />
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.options?.title || 'Confirmar'}
        message={confirmState.options?.message || ''}
        confirmText={confirmState.options?.confirmText || 'Confirmar'}
        cancelText={confirmState.options?.cancelText || 'Cancelar'}
        variant={confirmState.options?.variant || 'default'}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}

