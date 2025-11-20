'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Search, X } from 'lucide-react';
import { AGENTS } from '@/lib/constants';
import { Agent } from '@/lib/types';
import { useStore } from '@/lib/store';
import { AgentItem } from './AgentItem';
import { getAgents } from '@/lib/api';

interface AgentSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentSelector({ open, onOpenChange }: AgentSelectorProps) {
  const { selectedAgents, numRodadas, setSelectedAgents, setNumRodadas } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [tempSelected, setTempSelected] = useState<string[]>(selectedAgents);
  const [tempRodadas, setTempRodadas] = useState(numRodadas);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Buscar agentes da API ao abrir o modal
    if (open) {
      loadAgents();
    }
  }, [open]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const response = await getAgents();
      // Converter agentes da API para o formato esperado
      const formattedAgents: Agent[] = response.agentes.map((agent) => ({
        id: agent.id,
        name: agent.name,
        role: agent.role,
        avatar: agent.avatar || '👤',
        color: agent.color || '#8b5cf6',
        backstory: agent.backstory || ''
      }));
      setAgents(formattedAgents);
    } catch (error) {
      console.error('Erro ao carregar agentes:', error);
      // Fallback para lista hardcoded em caso de erro
      setAgents(AGENTS);
    } finally {
      setLoading(false);
    }
  };

  const filteredAgents = agents.filter((agent) =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleAgent = (agentId: string) => {
    setTempSelected((prev) =>
      prev.includes(agentId)
        ? prev.filter((id) => id !== agentId)
        : [...prev, agentId]
    );
  };

  const handleConfirm = () => {
    if (tempSelected.length >= 2) {
      setSelectedAgents(tempSelected);
      setNumRodadas(tempRodadas);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setTempSelected(selectedAgents);
    setTempRodadas(numRodadas);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] bg-[#2d2d2d] border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Selecionar Agentes</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Escolha pelo menos 2 bilionários para participar do debate
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar agentes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#3a3a3a] border-border text-foreground"
          />
        </div>

        {/* Agents List */}
        <div className="max-h-[400px] overflow-y-auto space-y-2">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando agentes...
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum agente encontrado
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2 px-2">
                Agentes Disponíveis ({filteredAgents.length})
              </h3>
              <div className="space-y-1">
                {filteredAgents.map((agent) => (
                  <AgentItem
                    key={agent.id}
                    agent={agent}
                    selected={tempSelected.includes(agent.id)}
                    onToggle={() => handleToggleAgent(agent.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rodadas Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-foreground">Número de Rodadas</label>
            <span className="text-sm text-muted-foreground">{tempRodadas}</span>
          </div>
          <Slider
            value={[tempRodadas]}
            onValueChange={([value]) => setTempRodadas(value)}
            min={1}
            max={5}
            step={1}
            className="w-full"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            {tempSelected.length} agente{tempSelected.length !== 1 ? 's' : ''} selecionado{tempSelected.length !== 1 ? 's' : ''}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={tempSelected.length < 2}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

