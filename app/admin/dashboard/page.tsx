'use client';

import { useEffect, useState } from 'react';
import { StatsCard } from '@/components/admin/StatsCard';
import { Users, MessageSquare, Brain, Activity } from 'lucide-react';
import { getDashboardStats, DashboardStats } from '@/lib/admin-api';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats();
      setStats(data);
      console.log('Estatísticas carregadas:', data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      // Se for erro 404, o endpoint não existe - tentar novamente após delay
      if (error instanceof Error && error.message.includes('404')) {
        console.warn('Endpoint /stats não encontrado. Servidor pode precisar ser reiniciado.');
      }
      // Usar valores padrão em caso de erro
      setStats({
        total_agents: 0,
        agents_this_month: 0,
        total_debates: 0,
        debates_this_week: 0,
        llms_count: 0,
        llms_list: [],
        api_usage_percent: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const formatStats = () => {
    if (!stats) {
      return [
        {
          title: 'Total de Agentes',
          value: '-',
          icon: Users,
          change: 'Carregando...',
          color: 'blue' as const,
        },
        {
          title: 'Debates Realizados',
          value: '-',
          icon: MessageSquare,
          change: 'Carregando...',
          color: 'green' as const,
        },
        {
          title: 'LLMs Configurados',
          value: '-',
          icon: Brain,
          change: 'Carregando...',
          color: 'purple' as const,
        },
        {
          title: 'Uso de API',
          value: '-',
          icon: Activity,
          change: 'Carregando...',
          color: 'orange' as const,
        },
      ];
    }

    return [
      {
        title: 'Total de Agentes',
        value: stats.total_agents.toString(),
        icon: Users,
        change: stats.agents_this_month > 0 ? `+${stats.agents_this_month} este mês` : 'Sem novos este mês',
        color: 'blue' as const,
      },
      {
        title: 'Debates Realizados',
        value: stats.total_debates.toString(),
        icon: MessageSquare,
        change: stats.debates_this_week > 0 ? `+${stats.debates_this_week} esta semana` : 'Sem debates esta semana',
        color: 'green' as const,
      },
      {
        title: 'LLMs Configurados',
        value: stats.llms_count.toString(),
        icon: Brain,
        change: stats.llms_list.length > 0 ? stats.llms_list.join(', ') : 'Nenhum configurado',
        color: 'purple' as const,
      },
      {
        title: 'Uso de API',
        value: `${stats.api_usage_percent}%`,
        icon: Activity,
        change: 'do limite mensal',
        color: 'orange' as const,
      },
    ];
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema de debates
        </p>
      </div>

      {stats && stats.total_agents === 0 && stats.total_debates === 0 && !loading && (
        <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
          <p className="text-sm text-yellow-200">
            ℹ️ O dashboard está vazio porque não há dados no banco ainda. Crie alguns agentes ou realize debates para ver estatísticas.
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {formatStats().map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-[#2d2d2d] border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Atividade Recente</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <div className="flex-1">
                <p className="font-medium">Novo agente criado</p>
                <p className="text-muted-foreground text-xs">Há 2 horas</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <div className="flex-1">
                <p className="font-medium">Debate iniciado</p>
                <p className="text-muted-foreground text-xs">Há 5 horas</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <div className="flex-1">
                <p className="font-medium">LLM configurado</p>
                <p className="text-muted-foreground text-xs">Há 1 dia</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#2d2d2d] border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Ações Rápidas</h2>
          <div className="space-y-3">
            <a
              href="/admin/agents/new"
              className="block p-3 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
            >
              <p className="font-medium">Criar Novo Agente</p>
              <p className="text-xs text-muted-foreground">
                Adicione um novo agente ao sistema
              </p>
            </a>
            <a
              href="/admin/llms"
              className="block p-3 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
            >
              <p className="font-medium">Configurar LLMs</p>
              <p className="text-xs text-muted-foreground">
                Gerencie provedores de IA
              </p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

