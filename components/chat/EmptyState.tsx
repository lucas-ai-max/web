'use client';

import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import { AgentSelector } from '@/components/agents/AgentSelector';
import { useState } from 'react';

export function EmptyState() {
  const { selectedAgents } = useStore();
  const [agentSelectorOpen, setAgentSelectorOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col items-center justify-center h-full p-6">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Selecione os agentes e inicie o debate
          </h2>
          <p className="text-muted-foreground">
            Escolha pelo menos 1 bilionário para começar
          </p>
        </div>

        {selectedAgents.length < 1 && (
          <Button
            onClick={() => setAgentSelectorOpen(true)}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            Selecionar Agentes
          </Button>
        )}
      </div>

      <AgentSelector
        open={agentSelectorOpen}
        onOpenChange={setAgentSelectorOpen}
      />
    </>
  );
}

