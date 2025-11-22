'use client';

import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Trash2, MoreVertical, FolderPlus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { moveDebateToFolder } from '@/lib/folders-api';
import { useState } from 'react';

export function ChatHistory() {
  const { 
    chats, 
    folders,
    currentChatId, 
    selectedFolderId,
    setCurrentChat, 
    deleteChat,
    moveChatToFolder 
  } = useStore();

  const [draggedChatId, setDraggedChatId] = useState<string | null>(null);

  // Filtrar chats por pasta selecionada
  const filteredChats = selectedFolderId === null
    ? chats
    : chats.filter(chat => chat.folderId === selectedFolderId);

  const handleMoveToFolder = async (chatId: string, folderId: string | null) => {
    try {
      const chat = chats.find(c => c.id === chatId);
      const folderName = folderId ? folders.find(f => f.id === folderId)?.name || 'pasta' : null;
      
      // Mover no frontend imediatamente (permite mover a qualquer momento)
      moveChatToFolder(chatId, folderId);
      
      // Mostrar notificação
      showNotification(
        folderId 
          ? `Chat movido para "${folderName}"` 
          : 'Chat removido da pasta',
        'success'
      );
      
      // Se o debate já foi salvo no banco, atualizar também lá
      if (chat?.debateId) {
        try {
          await moveDebateToFolder(chat.debateId, folderId);
        } catch (error) {
          console.error('Erro ao atualizar pasta no banco (mas o chat foi movido no frontend):', error);
          // Não mostrar erro ao usuário, pois o movimento no frontend já funcionou
        }
      }
      // Se não tiver debateId ainda, o movimento no frontend já foi feito
      // Quando o debate terminar e tiver debateId, será salvo automaticamente
    } catch (error) {
      console.error('Erro ao mover chat:', error);
      showNotification('Erro ao mover chat. Tente novamente.', 'error');
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    // Criar elemento de notificação com ID único
    const notificationId = `notification-${Date.now()}-${Math.random()}`;
    const notification = document.createElement('div');
    notification.id = notificationId;
    notification.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
      type === 'success' 
        ? 'bg-green-500 text-white' 
        : 'bg-red-500 text-white'
    }`;
    notification.textContent = message;
    
    // Verificar se o body ainda existe antes de adicionar
    if (document.body) {
      document.body.appendChild(notification);
    }

    // Remover após 3 segundos
    setTimeout(() => {
      const element = document.getElementById(notificationId);
      if (element) {
        element.style.opacity = '0';
        element.style.transform = 'translateX(100%)';
        setTimeout(() => {
          const elementToRemove = document.getElementById(notificationId);
          if (elementToRemove && elementToRemove.parentNode) {
            elementToRemove.parentNode.removeChild(elementToRemove);
          }
        }, 300);
      }
    }, 3000);
  };

  const handleDragStart = (e: React.DragEvent, chatId: string) => {
    setDraggedChatId(chatId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', chatId);
  };

  const handleDragEnd = () => {
    setDraggedChatId(null);
  };

  if (filteredChats.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        {selectedFolderId ? 'Nenhum debate nesta pasta' : 'Nenhum debate ainda'}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {filteredChats.map((chat) => (
        <div
          key={chat.id}
          draggable
          onDragStart={(e) => handleDragStart(e, chat.id)}
          onDragEnd={handleDragEnd}
          className={`group relative flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
            currentChatId === chat.id
              ? 'bg-white/10'
              : 'hover:bg-white/5'
          } ${
            draggedChatId === chat.id ? 'opacity-50' : ''
          }`}
          onClick={() => setCurrentChat(chat.id)}
        >
          <div className="flex-1 min-w-0 max-w-full">
            <p className="text-sm text-foreground truncate" title={chat.title}>
              {chat.title.length > 30 ? `${chat.title.substring(0, 30)}...` : chat.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(chat.createdAt), "d 'de' MMM", { locale: ptBR })}
            </p>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                >
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveToFolder(chat.id, null);
                  }}
                >
                  <FolderPlus className="w-4 h-4" />
                  Remover da pasta
                </DropdownMenuItem>
                {folders.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    {folders.map((folder) => (
                      <DropdownMenuItem
                        key={folder.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveToFolder(chat.id, folder.id);
                        }}
                      >
                        Mover para {folder.name}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(chat.id);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Deletar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  );
}

