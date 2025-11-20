'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AgentCard } from '@/components/admin/AgentCard';
import { listAgents } from '@/lib/admin-api';
import { AdminAgent } from '@/lib/types';

export default function AgentsPage() {
  const [search, setSearch] = useState('');
  const [agents, setAgents] = useState<AdminAgent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const data = await listAgents({ search });
      setAgents(data);
    } catch (error) {
      console.error('Erro ao carregar agentes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadAgents();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [search]);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Agentes</h1>
          <p className="text-muted-foreground">
            Gerencie os agentes do debate
          </p>
        </div>
        <Link href="/admin/agents/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Agente
          </Button>
        </Link>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar agentes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando agentes...</p>
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Nenhum agente encontrado</p>
          <Link href="/admin/agents/new">
            <Button>Criar Primeiro Agente</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={{
                id: agent.id,
                name: agent.name,
                role: agent.role,
                avatar: agent.avatar,
                color: agent.color,
                llm: agent.llm_model,
                status: agent.status as 'active' | 'inactive',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

