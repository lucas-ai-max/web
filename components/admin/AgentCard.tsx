'use client';

import Link from 'next/link';
import { Edit, Copy, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToastStore } from '@/lib/toast-store';
import { useConfirm } from '@/lib/useConfirm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface AgentCardProps {
  agent: {
    id: string;
    name: string;
    role?: string;
    description?: string;
    avatar: string;
    color: string;
    llm: string;
    status: 'active' | 'inactive';
  };
}

export function AgentCard({ agent }: AgentCardProps) {
  const { showToast } = useToastStore();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  
  return (
    <div className="bg-[#2d2d2d] border border-white/10 rounded-xl p-5 hover:scale-[1.02] hover:shadow-xl transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl overflow-hidden relative bg-[#2d2d2d]"
            style={{ backgroundColor: `${agent.color}20` }}
          >
            {agent.avatar && (agent.avatar.startsWith('http') || agent.avatar.startsWith('https://') || agent.avatar.startsWith('data:image')) ? (
              <img
                src={agent.avatar}
                alt={agent.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    // Verificar se avatar é emoji (não começa com http/https/data:)
                    const isEmoji = agent.avatar && !agent.avatar.startsWith('http') && !agent.avatar.startsWith('data:');
                    parent.innerHTML = `<span class="text-3xl">${isEmoji ? agent.avatar : '👤'}</span>`;
                  }
                }}
              />
            ) : (
              <span className="text-3xl">{agent.avatar || '👤'}</span>
            )}
          </div>
          <div>
            <h3 className="font-bold text-lg">{agent.name}</h3>
            <p className="text-sm text-muted-foreground">{agent.description || ''}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/agents/${agent.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                try {
                  const { duplicateAgent } = await import('@/lib/admin-api');
                  await duplicateAgent(agent.id);
                  window.location.reload();
                } catch (error) {
                  console.error('Erro ao duplicar:', error);
                  showToast('Erro ao duplicar agente', 'error');
                }
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-500"
              onSelect={(e) => {
                e.preventDefault();
                // Usar setTimeout para garantir que o dropdown feche antes de abrir o diálogo
                setTimeout(async () => {
                  const confirmed = await confirm({
                    title: 'Confirmar exclusão',
                    message: `Tem certeza que deseja deletar ${agent.name}?`,
                    variant: 'destructive',
                  });
                  
                  if (!confirmed) return;
                  
                  try {
                    const { deleteAgent } = await import('@/lib/admin-api');
                    await deleteAgent(agent.id);
                    window.location.reload();
                  } catch (error) {
                    console.error('Erro ao deletar:', error);
                    showToast('Erro ao deletar agente', 'error');
                  }
                }, 0);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Deletar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          {agent.llm}
        </Badge>
        <Badge
          variant={agent.status === 'active' ? 'default' : 'secondary'}
          className={cn(
            'text-xs',
            agent.status === 'active' && 'bg-green-500/20 text-green-500'
          )}
        >
          {agent.status === 'active' ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.options?.title || 'Confirmar'}
        message={confirmState.options?.message || ''}
        confirmText={confirmState.options?.confirmText || 'Confirmar'}
        cancelText={confirmState.options?.cancelText || 'Cancelar'}
        variant={confirmState.options?.variant || 'default'}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}

