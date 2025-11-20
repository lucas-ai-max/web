'use client';

import { AgentForm } from '@/components/admin/AgentForm';
import { use } from 'react';

export default function EditAgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Editar Agente</h1>
        <p className="text-muted-foreground">
          Atualize as configurações do agente
        </p>
      </div>
      <AgentForm agentId={id} />
    </div>
  );
}

