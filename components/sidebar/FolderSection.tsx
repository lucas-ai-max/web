'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/lib/store';
import { listFolders, moveDebateToFolder } from '@/lib/folders-api';
import { CreateFolderDialog } from './CreateFolderDialog';
import { Folder } from '@/lib/types';

export function FolderSection() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [draggedOverFolderId, setDraggedOverFolderId] = useState<string | null>(null);
  const { folders, setFolders, selectedFolderId, setSelectedFolder, chats, moveChatToFolder } = useStore();
  
  // Recalcular contagem quando chats mudarem
  useEffect(() => {
    // Atualizar contagem das pastas baseado nos chats
    const updatedFolders = folders.map(folder => ({
      ...folder,
      count: chats.filter(chat => chat.folderId === folder.id).length
    }));
    setFolders(updatedFolders);
  }, [chats]);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      const response = await listFolders();
      const formattedFolders: Folder[] = response.folders.map((f: any) => ({
        id: f.id,
        name: f.name,
        count: f.count || 0,
        icon: f.icon,
      }));
      setFolders(formattedFolders);
    } catch (error) {
      console.error('Erro ao carregar pastas:', error);
    }
  };

  const handleFolderClick = (folderId: string | null) => {
    setSelectedFolder(folderId === selectedFolderId ? null : folderId);
  };

  const handleDragOver = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverFolderId(folderId);
  };

  const handleDragLeave = () => {
    setDraggedOverFolderId(null);
  };

  const handleDrop = async (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedOverFolderId(null);

    const chatId = e.dataTransfer.getData('text/plain');
    if (!chatId) return;

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

  return (
    <div className="ml-4 border-l border-white/10 pl-3 space-y-1">
      <Button
        variant="ghost"
        className="w-full justify-between text-foreground hover:bg-white/10 p-2 h-auto"
        onClick={() => setIsCreateDialogOpen(true)}
      >
        <span className="text-sm font-medium">Nova Pasta</span>
        <Plus className="w-4 h-4" />
      </Button>

      {isExpanded && folders.length > 0 && (
        <div className="space-y-1">
          <Button
            variant="ghost"
            className={`w-full justify-between text-foreground hover:bg-white/10 p-2 h-auto transition-all ${
              selectedFolderId === null ? 'bg-white/10' : ''
            }`}
            onClick={() => handleFolderClick(null)}
            onDragOver={(e) => handleDragOver(e, null)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, null)}
          >
            <span className="text-sm">Todos</span>
            <Badge variant="secondary" className="text-xs bg-gray-700">
              {folders.reduce((sum, f) => sum + f.count, 0)}
            </Badge>
          </Button>
          {folders.map((folder) => (
            <Button
              key={folder.id}
              variant="ghost"
              className={`w-full justify-between text-foreground hover:bg-white/10 p-2 h-auto transition-all ${
                selectedFolderId === folder.id ? 'bg-white/10' : ''
              }`}
              onClick={() => handleFolderClick(folder.id)}
              onDragOver={(e) => handleDragOver(e, folder.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, folder.id)}
            >
              <span className="text-sm">{folder.name}</span>
              <Badge variant="secondary" className="text-xs bg-gray-700">
                {chats.filter(chat => chat.folderId === folder.id).length}
              </Badge>
            </Button>
          ))}
        </div>
      )}

      <CreateFolderDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            loadFolders(); // Recarregar pastas após criar
          }
        }}
      />
    </div>
  );
}

