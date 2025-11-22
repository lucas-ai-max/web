'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Plus, Mic, Send } from 'lucide-react';
import { useStore } from '@/lib/store';
import { AGENTS } from '@/lib/constants';
import { getAgents } from '@/lib/api';
import { useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';

export function HomeScreen({ onQueueMessage, folderName }: { onQueueMessage: (pergunta: string) => void; folderName?: string }) {
  const { selectedAgents, setSelectedAgents } = useStore();
  const [pergunta, setPergunta] = useState('');
  const [availableAgents, setAvailableAgents] = useState(AGENTS);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Carregar agentes da API
    getAgents()
      .then(response => {
        const formattedAgents = response.agentes.map((agent: any) => ({
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

  const selectedAgentsData = availableAgents.filter(a => selectedAgents.includes(a.id));

  const toggleAgent = (agentId: string) => {
    console.log('🔍 [DEBUG] toggleAgent chamado com agentId:', agentId);
    console.log('🔍 [DEBUG] selectedAgents atual:', selectedAgents);
    
    if (selectedAgents.includes(agentId)) {
      const newAgents = selectedAgents.filter(id => id !== agentId);
      console.log('🔍 [DEBUG] Removendo agente. Novos agentes:', newAgents);
      setSelectedAgents(newAgents);
    } else {
      const newAgents = [...selectedAgents, agentId];
      console.log('🔍 [DEBUG] Adicionando agente. Novos agentes:', newAgents);
      setSelectedAgents(newAgents);
    }
  };

  const handleSubmit = () => {
    if (pergunta.trim() && selectedAgents.length >= 1) {
      onQueueMessage(pergunta);
      setPergunta('');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center relative min-h-full overflow-y-auto">
      {/* Background Principal */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: `url('/BG%20PRINCIPAL.png')` }}
      />
      {/* Overlay escuro para melhorar legibilidade */}
      <div className="fixed inset-0 bg-black/50 z-10" />

      <div className="relative z-10 text-center max-w-3xl px-8 w-full py-8">
        {/* Logo Principal */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-2">
            <img 
              src="/LOGO%20TRIA%20AI.png" 
              alt="TRIA Ai" 
              className="h-24 w-auto object-contain"
            />
          </div>
          <p className="text-2xl text-white/90 mt-4">
            Pense grande. Decida maior.
          </p>
          {folderName && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <img 
                src="/folder-open.png" 
                alt="Pasta" 
                className="w-6 h-6 object-contain filter brightness-0 invert"
                style={{ filter: 'brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(211deg) brightness(100%) contrast(100%)' }}
              />
              <p className="text-white text-base font-medium">{folderName}</p>
            </div>
          )}
        </div>

        {/* Controles de Debate */}
        <div className="flex items-center justify-start gap-2 mb-4 flex-wrap">
          {/* Seletor de Mentores */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="flex items-center gap-1 bg-black/40 backdrop-blur-md border border-white/20 rounded-lg px-2 py-1.5 text-white hover:bg-black/60 text-sm">
                  <span>Selecionar Mentores</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-80 bg-[#2d2d2d] border-white/10 p-4 overflow-hidden">
                <div className="space-y-2 max-h-[304px] overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: '304px' }}>
                  {availableAgents.map((agent) => (
                    <div
                      key={agent.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer h-[70px] flex-shrink-0"
                      onClick={() => toggleAgent(agent.id)}
                    >
                      <Checkbox
                        id={agent.id}
                        checked={selectedAgents.includes(agent.id)}
                        onCheckedChange={() => toggleAgent(agent.id)}
                        className="border-white/20"
                      />
                      <Avatar className="w-10 h-10">
                        {agent.avatar && (agent.avatar.startsWith('http') || agent.avatar.startsWith('data:image') || agent.avatar.startsWith('https://')) ? (
                          <AvatarImage
                            src={agent.avatar}
                            alt={agent.name}
                            className="object-cover"
                          />
                        ) : null}
                        <AvatarFallback className="bg-[#3B82F6] text-white text-xs">
                          {agent.avatar && !agent.avatar.startsWith('http') && !agent.avatar.startsWith('data:image') ? agent.avatar : (agent.name?.charAt(0)?.toUpperCase() || '👤')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">{agent.name}</p>
                        <p className="text-white/60 text-xs">{agent.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Avatares sobrepostos à direita do botão */}
            {selectedAgentsData.length > 0 && (
              <div className="flex -space-x-1">
                {selectedAgentsData.slice(0, 5).map((agent) => (
                  <Avatar key={agent.id} className="w-6 h-6 border border-black">
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
              </div>
            )}
          </div>

        </div>

         {/* Input Principal */}
         <div className="relative">
           <input
             type="file"
             ref={fileInputRef}
             className="hidden"
             accept=".txt,.pdf,.doc,.docx"
             onChange={(e) => {
               const file = e.target.files?.[0];
               if (file) {
                 // Aqui você pode processar o arquivo ou apenas mostrar o nome
                 console.log('Arquivo selecionado:', file.name);
               }
             }}
           />
           <button
             type="button"
             onClick={() => fileInputRef.current?.click()}
             className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center hover:opacity-70 transition-opacity hidden"
           >
             <Plus 
               className="w-3 h-3 text-gray-600" 
               strokeWidth={1.5}
               fill="none"
             />
           </button>
           <input
             type="text"
             placeholder="Faça sua pergunta aqui"
             value={pergunta}
             onChange={(e) => setPergunta(e.target.value)}
             onKeyDown={(e) => {
               if (e.key === 'Enter' && !e.shiftKey) {
                 e.preventDefault();
                 handleSubmit();
               }
             }}
             className="w-full bg-white py-2 pl-3 pr-11 text-black placeholder:text-gray-400 text-sm shadow-2xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
             style={{ borderRadius: '6px' }}
           />
           <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 z-20">
             <Mic 
               className="w-3 h-3 text-gray-600 pointer-events-none hidden" 
               strokeWidth={1.5}
               fill="none"
             />
             <button
               type="button"
               onClick={(e) => {
                 e.preventDefault();
                 e.stopPropagation();
                 handleSubmit();
               }}
               disabled={!pergunta.trim() || selectedAgents.length < 1}
               className="disabled:opacity-30 disabled:cursor-not-allowed transition-opacity hover:opacity-70 cursor-pointer"
             >
               <Send 
                 className="w-3 h-3 text-gray-600" 
                 strokeWidth={1.5}
                 fill="none"
               />
             </button>
           </div>
         </div>

        {selectedAgents.length < 1 && (
          <p className="text-white/70 text-xs mt-2">
            Selecione pelo menos 1 mentor para iniciar o debate
          </p>
        )}
      </div>
    </div>
  );
}

