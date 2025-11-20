'use client';

import { AgentForm } from '@/components/admin/AgentForm';

export default function NewAgentPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Criar Novo Agente</h1>
        <p className="text-muted-foreground">
          Configure um novo agente para participar dos debates
        </p>
      </div>
      <AgentForm />
    </div>
  );
}

