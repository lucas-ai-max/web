'use client';

import { useEffect, useState } from 'react';
import { StatsCard } from '@/components/admin/StatsCard';
import { Users, MessageSquare, Brain, Activity, RefreshCw } from 'lucide-react';
import { getDashboardStats, DashboardStats } from '@/lib/admin-api';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
    
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(() => {
      loadStats(true); // true = silent refresh (não mostra loading)
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadStats = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      
      const data = await getDashboardStats();
      setStats(data);
      console.log('Estatísticas carregadas:', data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      
      // Se for erro 404, o endpoint não existe - tentar novamente após delay
      if (error instanceof Error && error.message.includes('404')) {
        console.warn('Endpoint /stats não encontrado. Servidor pode precisar ser reiniciado.');
      }
      
      // Se for erro de conexão, manter os dados anteriores se existirem
      if (error instanceof Error && (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED'))) {
        console.warn('Erro de conexão com o servidor. Mantendo dados anteriores.');
        if (!stats) {
          // Só usar valores padrão se não houver dados anteriores
          setStats({
            total_agents: 0,
            agents_this_month: 0,
            total_debates: 0,
            debates_this_week: 0,
            llms_count: 0,
            llms_list: [],
            api_usage_percent: 0
          });
        }
      } else {
        // Para outros erros, usar valores padrão
        setStats({
          total_agents: 0,
          agents_this_month: 0,
          total_debates: 0,
          debates_this_week: 0,
          llms_count: 0,
          llms_list: [],
          api_usage_percent: 0
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
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
        change: stats.llms_count > 0 ? `${stats.llms_count} provedor${stats.llms_count > 1 ? 'es' : ''} configurado${stats.llms_count > 1 ? 's' : ''}` : 'Nenhum configurado',
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

      {refreshing && (
        <div className="mb-6 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />
          <p className="text-sm text-blue-200">
            Atualizando estatísticas...
          </p>
        </div>
      )}

      {stats && stats.total_agents === 0 && stats.total_debates === 0 && !loading && !refreshing && (
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
            {stats?.recent_activities && stats.recent_activities.length > 0 ? (
              stats.recent_activities.map((activity, index) => {
                const getColor = () => {
                  if (activity.type === 'agent') return 'bg-green-500';
                  if (activity.type === 'debate') return 'bg-blue-500';
                  return 'bg-purple-500';
                };
                
                const formatTimeAgo = (dateString: string) => {
                  if (!dateString) return 'Data desconhecida';
                  const date = new Date(dateString);
                  const now = new Date();
                  const diffMs = now.getTime() - date.getTime();
                  const diffMins = Math.floor(diffMs / 60000);
                  const diffHours = Math.floor(diffMs / 3600000);
                  const diffDays = Math.floor(diffMs / 86400000);
                  
                  if (diffMins < 1) return 'Agora mesmo';
                  if (diffMins < 60) return `Há ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
                  if (diffHours < 24) return `Há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
                  if (diffDays < 7) return `Há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
                  return date.toLocaleDateString('pt-BR');
                };
                
                return (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <div className={`w-2 h-2 rounded-full ${getColor()}`} />
                    <div className="flex-1">
                      <p className="font-medium">{activity.message}</p>
                      <p className="text-muted-foreground text-xs">{formatTimeAgo(activity.created_at)}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>
            )}
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

