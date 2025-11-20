'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { Header } from '@/components/layout/Header';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { MessageSquarePlus, MoreVertical, List, Share2, Pencil, Folder, FolderOpen, Trash2, Settings } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Chat } from '@/lib/types';
import { AGENTS } from '@/lib/constants';
import { getAgents } from '@/lib/api';
import { Agent } from '@/lib/types';
import { Toast } from '@/components/ui/toast';

export default function FolderPage() {
  const params = useParams();
  const router = useRouter();
  const folderId = params.id as string;
  
  const { folders, chats, setCurrentChat, deleteChat, moveChatToFolder, updateFolder, deleteFolder, setSelectedFolder, updateChat } = useStore();
  const [availableAgents, setAvailableAgents] = useState<Agent[]>(AGENTS);
  const [menuOpenChatId, setMenuOpenChatId] = useState<string | null>(null);
  const [draggedChatId, setDraggedChatId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [renameChatId, setRenameChatId] = useState<string | null>(null);
  const [newChatTitle, setNewChatTitle] = useState<string>('');
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);

  const folder = folders.find(f => f.id === folderId);
  const folderChats = chats.filter(chat => chat.folderId === folderId);

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
        const allAgents = [...formattedAgents, ...AGENTS.filter(a =>
          !formattedAgents.some(fa => fa.name === a.name || fa.role === a.role)
        )];
        setAvailableAgents(allAgents);
      })
      .catch(() => {
        setAvailableAgents(AGENTS);
      });
  }, []);

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
    setCurrentChat(chatId);
    router.push('/');
  };

  const handleDeleteChat = (chatId: string) => {
    if (confirm('Tem certeza que deseja excluir este chat?')) {
      deleteChat(chatId);
      setMenuOpenChatId(null);
    }
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
    router.push('/');
  };

  const handleDeleteFolder = () => {
    if (folder) {
      const folderChats = chats.filter(chat => chat.folderId === folderId);
      if (confirm(`Tem certeza que deseja excluir a pasta "${folder.name}"? ${folderChats.length > 0 ? `Os ${folderChats.length} chat(s) serão movidos para o geral.` : ''}`)) {
        deleteFolder(folderId);
        setToastMessage(`Pasta "${folder.name}" excluída${folderChats.length > 0 ? `. ${folderChats.length} chat(s) movido(s) para o geral.` : ''}`);
        setSelectedFolder(null);
        router.push('/');
      }
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
      <div className="flex-1 flex flex-col ml-[280px] overflow-hidden relative z-10">
        <Header />
        <div className="flex-1 overflow-y-auto relative">
          <div className="min-h-full">
            {/* Header da Pasta */}
            <div className="flex items-center justify-between p-8 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#3B82F6] rounded-lg flex items-center justify-center">
                  <Folder className="w-6 h-6 text-white" />
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder();
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
            <div className="space-y-0">
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
                      className={`flex items-center justify-between px-6 py-4 hover:bg-black/40 transition-all duration-200 cursor-pointer mx-4 my-2 ${
                        index !== folderChats.length - 1 ? 'border-b border-white/20' : ''
                      } ${
                        draggedChatId === chat.id 
                          ? 'opacity-30 scale-95 blur-sm cursor-grabbing' 
                          : 'cursor-grab active:cursor-grabbing'
                      }`}
                      style={{
                        borderRadius: '50px'
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
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteChat(chat.id);
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
    </div>
  );
}

