const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface StartDebateRequest {
  agentes: string[];
  pergunta: string;
  num_rodadas: number;
}

export interface DebateResponse {
  debate_id?: string;
  historico: Array<{
    tipo: string;
    conteudo: string;
    agente?: string;
    rodada?: number;
  }>;
  sintese?: string;
}

export async function startDebate(config: StartDebateRequest): Promise<DebateResponse> {
  const response = await fetch(`${API_BASE_URL}/api/debate/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    // Tentar extrair mensagem de erro detalhada do backend
    let errorMessage = response.statusText;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || response.statusText;
    } catch {
      // Se não conseguir parsear JSON, usar statusText
    }
    throw new Error(`Erro ao iniciar debate: ${errorMessage}`);
  }

  return response.json();
}

export interface AgentResponse {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  color?: string;
  backstory?: string;
}

export async function getAgents(): Promise<{ agentes: AgentResponse[] }> {
  const response = await fetch(`${API_BASE_URL}/api/agents`);
  if (!response.ok) {
    throw new Error('Erro ao buscar agentes');
  }
  return response.json();
}

