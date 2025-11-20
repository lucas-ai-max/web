'use client';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Shuffle, Share2, Download } from 'lucide-react';
import { useStore } from '@/lib/store';
import { AGENTS } from '@/lib/constants';
import { AgentSelector } from './agents/AgentSelector';
import { useState } from 'react';

export function ChatHeader() {
  const { selectedAgents } = useStore();
  const [agentSelectorOpen, setAgentSelectorOpen] = useState(false);
  
  const selectedAgentsData = AGENTS.filter((a) => selectedAgents.includes(a.id));

  return (
    <>
      <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-background">
        <div className="flex items-center gap-3">
          {selectedAgents.length === 0 ? (
            <Button
              variant="outline"
              onClick={() => setAgentSelectorOpen(true)}
            >
              Selecionar Agentes
            </Button>
          ) : selectedAgents.length === 1 ? (
            <Button
              variant="ghost"
              onClick={() => setAgentSelectorOpen(true)}
              className="flex items-center gap-2"
            >
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-xs">
                  {selectedAgentsData[0]?.avatar}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{selectedAgentsData[0]?.name}</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setAgentSelectorOpen(true)}
              className="flex items-center gap-2"
            >
              <div className="flex -space-x-2">
                {selectedAgentsData.slice(0, 3).map((agent) => (
                  <Avatar key={agent.id} className="w-6 h-6 border-2 border-background">
                    <AvatarFallback className="text-xs">
                      {agent.avatar}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className="text-sm">
                {selectedAgents.length} agentes selecionados
              </span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Shuffle className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Share2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <AgentSelector
        open={agentSelectorOpen}
        onOpenChange={setAgentSelectorOpen}
      />
    </>
  );
}

