'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquarePlus, FolderOpen, Folder, MessageCircle, MessageSquare, Plus, ChevronDown, ChevronRight, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatHistory } from './ChatHistory';
import { FolderSection } from './FolderSection';
import { useStore } from '@/lib/store';
import { CreateFolderDialog } from './CreateFolderDialog';
import { Toast } from '@/components/ui/toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function Sidebar() {
  const router = useRouter();
  const {
    chats,
    createChat,
    setCurrentChat,
    folders,
    selectedFolderId,
    setSelectedFolder,
    moveChatToFolder,
    deleteFolder,
    deleteChat,
    currentChatId
  } = useStore();
  const [isFoldersExpanded, setIsFoldersExpanded] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [draggedChatId, setDraggedChatId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [menuOpenFolderId, setMenuOpenFolderId] = useState<string | null>(null);
  const [menuOpenChatId, setMenuOpenChatId] = useState<string | null>(null);

  const handleNewChat = () => {
    setCurrentChat(null);
    router.push('/');
  };

  const toggleFolders = () => {
    setIsFoldersExpanded(!isFoldersExpanded);
  };

  const handleFolderClick = (folderId: string) => {
    setSelectedFolder(folderId);
    router.push(`/folder/${folderId}`);
  };

  const handleDeleteChat = (chatId: string) => {
    if (confirm('Deseja excluir este chat?')) {
      deleteChat(chatId);
    }
    setMenuOpenChatId(null);
  };

  const handleDeleteFolder = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (folder) {
      const folderChats = chats.filter(chat => chat.folderId === folderId);
      if (confirm(`Tem certeza que deseja excluir a pasta "${folder.name}"? ${folderChats.length > 0 ? `Os ${folderChats.length} chat(s) serão movidos para o geral.` : ''}`)) {
        deleteFolder(folderId);
        setToastMessage(`Pasta "${folder.name}" excluída${folderChats.length > 0 ? `. ${folderChats.length} chat(s) movido(s) para o geral.` : ''}`);
        setMenuOpenFolderId(null);
        // Se a pasta excluída estava selecionada, voltar para a home
        if (selectedFolderId === folderId) {
          setSelectedFolder(null);
          router.push('/');
        }
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

  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolderId(folderId);
  };

  const handleDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleDrop = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const chatId = e.dataTransfer.getData('text/plain');
    if (chatId) {
      const chat = chats.find(c => c.id === chatId);
      const folder = folders.find(f => f.id === folderId);
      if (chat && folder) {
        moveChatToFolder(chatId, folderId);
        setToastMessage(`Chat "${chat.title}" movido para a pasta "${folder.name}"`);
      }
    }
    setDraggedChatId(null);
    setDragOverFolderId(null);
  };

  const handleDragEnd = () => {
    setDraggedChatId(null);
    setDragOverFolderId(null);
  };

  return (
    <div className="w-[280px] h-screen bg-black/10 backdrop-blur-[30px] border-r border-white/10 flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 flex flex-col gap-4 overflow-y-auto">
        {/* Botão Iniciar nova conversa */}
        <Button
          className="w-full bg-[#3B82F6] hover:bg-[#2563EB] rounded-lg py-3 px-4 text-white font-medium mb-6"
          onClick={handleNewChat}
        >
          <MessageSquarePlus className="w-5 h-5 mr-2" />
          Iniciar nova conversa
        </Button>

        {/* Seção Pastas */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <img src="/pasta-menu.png" alt="Pastas" className="w-5 h-5" />
            <span className="font-semibold text-white">Pastas</span>
            <button
              onClick={() => setIsCreateDialogOpen(true)}
              className="ml-auto text-[#3B82F6] hover:text-[#2563EB] transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Lista de pastas */}
          {isFoldersExpanded && (
            <div className="space-y-1">
              {folders.map((folder) => {
                const folderChatsCount = chats.filter(chat => chat.folderId === folder.id).length;
                return (
                  <div key={folder.id} className="group">
                    <div
                      onDragOver={(e) => handleDragOver(e, folder.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, folder.id)}
                      className={`flex items-center gap-1 ${dragOverFolderId === folder.id ? 'bg-[rgba(59,130,246,0.2)] rounded-lg' : ''}`}
                    >
                      <button
                        className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[rgba(59,130,246,0.1)] transition-all duration-200 ${
                          selectedFolderId === folder.id
                            ? 'text-[#3B82F6] bg-[rgba(59,130,246,0.1)]'
                            : dragOverFolderId === folder.id && draggedChatId
                            ? 'bg-[rgba(59,130,246,0.3)] text-[#3B82F6] scale-105 shadow-lg'
                            : 'text-[#9CA3AF] hover:text-white'
                        }`}
                        onClick={() => handleFolderClick(folder.id)}
                      >
                        <img src="/pasta-criada.png" alt={folder.name} className="w-4 h-4" />
                        <span className="text-sm flex-1 text-left">{folder.name}</span>
                        <span className="text-xs text-white/40">{folderChatsCount}</span>
                      </button>
                      <DropdownMenu open={menuOpenFolderId === folder.id} onOpenChange={(open) => setMenuOpenFolderId(open ? folder.id : null)}>
                        <DropdownMenuTrigger asChild>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenFolderId(menuOpenFolderId === folder.id ? null : folder.id);
                            }}
                            className="text-white/60 hover:text-white p-1.5 rounded hover:bg-white/10 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#2d2d2d] border-white/10 w-40">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFolder(folder.id);
                            }}
                            className="text-red-500 hover:bg-red-500/20 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir pasta
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Seção Chats */}
        <div className="flex-1 min-h-0">
          <div className="flex items-center gap-2 mb-3">
            <img src="/chat-menu.png" alt="Chats" className="w-5 h-5" />
            <span className="font-semibold text-white">Chats</span>
          </div>

          <div className="space-y-1">
            {chats.filter(chat => !chat.folderId).length > 0 ? (
              chats
                .filter(chat => !chat.folderId)
              .map((chat) => {
                const isActive = currentChatId === chat.id;
                return (
                  <div
                    key={chat.id}
                    className="flex items-center gap-2"
                  >
                    <button
                      draggable
                      onDragStart={(e) => handleDragStart(e, chat.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => {
                        setCurrentChat(chat.id);
                        router.push('/');
                      }}
                      className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-white/10 text-white ring-1 ring-white/30 shadow-lg'
                          : 'text-[#9CA3AF] hover:text-white hover:bg-[rgba(59,130,246,0.1)]'
                      } ${
                        draggedChatId === chat.id
                          ? 'opacity-30 scale-95 blur-sm'
                          : ''
                      }`}
                    >
                      <img src="/chat-criado.png" alt={chat.title} className="w-3 h-3" />
                      <span className="truncate">{chat.title}</span>
                    </button>
                    <DropdownMenu
                      open={menuOpenChatId === chat.id}
                      onOpenChange={(open) => setMenuOpenChatId(open ? chat.id : null)}
                    >
                      <DropdownMenuTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[#2d2d2d] border-white/10 w-40">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChat(chat.id);
                          }}
                          className="text-red-500 hover:bg-red-500/20 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir conversa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-2 text-xs text-[#9CA3AF]/60">
                Nenhum chat ainda
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateFolderDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
        }}
      />

      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}
