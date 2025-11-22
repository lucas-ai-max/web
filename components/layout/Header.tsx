'use client';

import { Button } from '@/components/ui/button';
import { Home, Search, User, ChevronLeft, MessageSquare, Folder } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';
import { useState, useEffect, useMemo, useRef } from 'react';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { searchQuery, setSearchQuery, setCurrentChat, setSelectedFolder, chats, folders } = useStore();
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const showBackButton = pathname !== '/' && !pathname.startsWith('/login') && !pathname.startsWith('/register');
  
  // Sincronizar busca local com o store
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);
  
  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Buscar resultados
  const searchResults = useMemo(() => {
    if (!localSearchQuery.trim()) return { chats: [], folders: [], chatsInFolders: [] };
    
    const query = localSearchQuery.toLowerCase().trim();
    const results = {
      chats: chats.filter(chat => !chat.folderId && chat.title.toLowerCase().includes(query)),
      folders: folders.filter(folder => folder.name.toLowerCase().includes(query)),
      chatsInFolders: chats.filter(chat => {
        if (!chat.folderId) return false;
        const folder = folders.find(f => f.id === chat.folderId);
        return chat.title.toLowerCase().includes(query) || (folder && folder.name.toLowerCase().includes(query));
      })
    };
    
    return results;
  }, [localSearchQuery, chats, folders]);
  
  const hasResults = searchResults.chats.length > 0 || searchResults.folders.length > 0 || searchResults.chatsInFolders.length > 0;
  
  // Atualizar busca no store quando o usuário digitar
  const handleSearchChange = (value: string) => {
    setLocalSearchQuery(value);
    setSearchQuery(value);
    setIsSearchFocused(true);
  };
  
  // Limpar busca e navegar para home
  const handleHomeClick = () => {
    setSearchQuery('');
    setCurrentChat(null);
    setSelectedFolder(null);
    router.push('/');
  };
  
  // Navegar para chat
  const handleChatClick = (chatId: string, folderId: string | null) => {
    setCurrentChat(chatId);
    if (folderId) {
      setSelectedFolder(folderId);
      router.push(`/folder/${folderId}`);
    } else {
      setSelectedFolder(null);
      router.push('/');
    }
    setSearchQuery('');
    setIsSearchFocused(false);
  };
  
  // Navegar para pasta
  const handleFolderClick = (folderId: string) => {
    setSelectedFolder(folderId);
    router.push(`/folder/${folderId}`);
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  return (
    <header 
      className="fixed top-6 z-50 flex items-center justify-between border border-white/10 bg-black/20 backdrop-blur-xl shadow-2xl"
      style={{
        left: 'calc(280px + 24px)',
        right: '24px',
        paddingTop: '10px',
        paddingBottom: '10px',
        paddingLeft: '22px',
        paddingRight: '22px',
        borderRadius: '80px',
        gap: '24px'
      }}
    >
      {/* Navegação ou Voltar */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {showBackButton && (
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10 rounded-lg px-4 py-2"
            onClick={() => router.back()}
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Voltar
          </Button>
        )}
        <Button
          variant="ghost"
          className="text-white hover:bg-white/10 rounded-lg px-4 py-2"
          onClick={handleHomeClick}
        >
          <Home className="w-5 h-5 mr-2" />
          Home
        </Button>
      </div>

      {/* Busca (centralizada) */}
      <div className="flex-1 max-w-md mx-auto relative" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF] z-10" />
          <input
            type="text"
            placeholder="Buscar chats e pastas"
            value={localSearchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            className="w-full bg-[#E5E5E5] py-2 pl-10 pr-4 text-black placeholder:text-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            style={{ borderRadius: '50px' }}
          />
        </div>
        
        {/* Dropdown de resultados */}
        {isSearchFocused && localSearchQuery.trim() && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#1F1F1F] border border-white/10 rounded-lg shadow-2xl max-h-96 overflow-y-auto z-50 custom-scrollbar">
            {hasResults ? (
              <div className="py-2">
                {/* Chats gerais */}
                {searchResults.chats.length > 0 && (
                  <>
                    <div className="px-4 py-2 text-xs font-semibold text-white/60 uppercase tracking-wider">
                      Chats
                    </div>
                    {searchResults.chats.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => handleChatClick(chat.id, null)}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/10 transition-colors text-left"
                      >
                        <MessageSquare className="w-4 h-4 text-white/60 flex-shrink-0" />
                        <span className="text-white text-sm truncate flex-1">{chat.title}</span>
                      </button>
                    ))}
                  </>
                )}
                
                {/* Pastas */}
                {searchResults.folders.length > 0 && (
                  <>
                    {searchResults.chats.length > 0 && <div className="border-t border-white/10 my-1" />}
                    <div className="px-4 py-2 text-xs font-semibold text-white/60 uppercase tracking-wider">
                      Pastas
                    </div>
                    {searchResults.folders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => handleFolderClick(folder.id)}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/10 transition-colors text-left"
                      >
                        <Folder className="w-4 h-4 text-white/60 flex-shrink-0" />
                        <span className="text-white text-sm truncate flex-1">{folder.name}</span>
                        <span className="text-xs text-white/40">{chats.filter(c => c.folderId === folder.id).length}</span>
                      </button>
                    ))}
                  </>
                )}
                
                {/* Chats em pastas */}
                {searchResults.chatsInFolders.length > 0 && (
                  <>
                    {(searchResults.chats.length > 0 || searchResults.folders.length > 0) && (
                      <div className="border-t border-white/10 my-1" />
                    )}
                    <div className="px-4 py-2 text-xs font-semibold text-white/60 uppercase tracking-wider">
                      Chats em Pastas
                    </div>
                    {searchResults.chatsInFolders.map((chat) => {
                      const folder = folders.find(f => f.id === chat.folderId);
                      return (
                        <button
                          key={chat.id}
                          onClick={() => handleChatClick(chat.id, chat.folderId)}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/10 transition-colors text-left"
                        >
                          <MessageSquare className="w-4 h-4 text-white/60 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-sm truncate">{chat.title}</div>
                            {folder && (
                              <div className="text-xs text-white/40 truncate">em {folder.name}</div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-white/60 text-sm">
                Nenhum resultado encontrado
              </div>
            )}
          </div>
        )}
      </div>

      {/* Login */}
      <div className="flex-shrink-0">
        <Button
          variant="ghost"
          className="text-white hover:bg-white/10 rounded-lg px-4 py-2"
          onClick={() => router.push('/login')}
        >
          <User className="w-5 h-5 mr-2" />
          Login
        </Button>
      </div>
    </header>
  );
}

