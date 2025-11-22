'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Brain,
  Settings,
  ArrowLeft,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { listAgents } from '@/lib/admin-api';

const menuItemsBase = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
  { icon: Users, label: 'Agentes', href: '/admin/agents' },
  { icon: Brain, label: 'LLMs', href: '/admin/llms' },
  { icon: Settings, label: 'Configurações', href: '/admin/settings' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [agentCount, setAgentCount] = useState<number | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    const loadAgentCount = async () => {
      try {
        // Buscar todos os agentes (sem filtro de status)
        const agents = await listAgents();
        // Contar apenas agentes ativos
        const activeCount = agents.filter(agent => agent.status === 'active').length;
        setAgentCount(activeCount);
      } catch (error) {
        console.error('Erro ao carregar contagem de agentes:', error);
        // Não definir null para evitar re-renders desnecessários
        // Manter o último valor ou 0
        setAgentCount(prev => prev === null ? 0 : prev);
      }
    };

    // Aguardar um pouco antes de carregar para evitar bloqueio na inicialização
    const timeoutId = setTimeout(() => {
      loadAgentCount();
      // Recarregar a cada 5 segundos para manter atualizado
      intervalId = setInterval(loadAgentCount, 5000);
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  const menuItems = menuItemsBase.map(item => {
    if (item.href === '/admin/agents' && agentCount !== null) {
      return { ...item, badge: agentCount.toString() };
    }
    return item;
  });

  return (
    <div className="w-[240px] h-screen bg-black/20 backdrop-blur-xl flex flex-col border-r border-white/10">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="text-white text-lg font-semibold">Mind Panel</h1>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm',
                  isActive
                    ? 'bg-gradient-to-r from-primary to-primary/80 text-white'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar ao Chat</span>
        </Link>
      </div>
    </div>
  );
}

