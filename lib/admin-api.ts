import { AdminAgent } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface AgentCreateRequest {
  name: string;
  avatar: string;
  color: string;
  role: string;
  goal: string;
  backstory: string;
  llm_provider: string;
  llm_model: string;
  temperature: number;
  max_tokens: number;
  verbose?: boolean;
  allow_delegation?: boolean;
  status?: string;
  tags?: string[];
  description?: string;
}

export interface AgentUpdateRequest extends Partial<AgentCreateRequest> {}

export interface AgentKnowledge {
  id: string;
  agent_id: string;
  title: string;
  content: string;
  file_type: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export async function listAgents(params?: {
  search?: string;
  llm?: string;
  status?: string;
}): Promise<AdminAgent[]> {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.llm) queryParams.append('llm', params.llm);
  if (params?.status) queryParams.append('status', params.status);

  const response = await fetch(
    `${API_BASE_URL}/api/admin/agents?${queryParams.toString()}`
  );
  if (!response.ok) {
    throw new Error(`Erro ao listar agentes: ${response.statusText}`);
  }
  const data = await response.json();
  return data.agents;
}

export async function getAgent(agentId: string): Promise<AdminAgent> {
  const response = await fetch(`${API_BASE_URL}/api/admin/agents/${agentId}`);
  if (!response.ok) {
    throw new Error(`Erro ao buscar agente: ${response.statusText}`);
  }
  return response.json();
}

export async function createAgent(agentData: AgentCreateRequest): Promise<AdminAgent> {
  const response = await fetch(`${API_BASE_URL}/api/admin/agents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(agentData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao criar agente: ${errorText || response.statusText}`);
  }

  return response.json();
}

export async function updateAgent(
  agentId: string,
  agentData: AgentUpdateRequest
): Promise<AdminAgent> {
  const response = await fetch(`${API_BASE_URL}/api/admin/agents/${agentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(agentData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao atualizar agente: ${errorText || response.statusText}`);
  }

  return response.json();
}

export async function deleteAgent(agentId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/agents/${agentId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao deletar agente: ${errorText || response.statusText}`);
  }
}

export async function duplicateAgent(agentId: string): Promise<AdminAgent> {
  const response = await fetch(`${API_BASE_URL}/api/admin/agents/${agentId}/duplicate`, {
    method: 'POST',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao duplicar agente: ${errorText || response.statusText}`);
  }

  return response.json();
}

export async function testAgent(agentId: string, message: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/admin/agents/${agentId}/test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao testar agente: ${errorText || response.statusText}`);
  }

  const data = await response.json();
  return data.response;
}

export async function uploadAvatar(file: File): Promise<{ url: string; path: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/admin/upload-avatar`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao fazer upload: ${errorText || response.statusText}`);
  }

  return response.json();
}

// ========== RAG (Base de Conhecimento) ==========

export async function addAgentKnowledge(
  agentId: string,
  title: string,
  content: string,
  fileType: string = 'text'
): Promise<{ success: boolean; knowledge_id: string }> {
  const response = await fetch(`${API_BASE_URL}/api/admin/agents/${agentId}/knowledge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, content, file_type: fileType }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao adicionar conhecimento: ${errorText || response.statusText}`);
  }

  return response.json();
}

export async function listAgentKnowledge(agentId: string): Promise<AgentKnowledge[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/agents/${agentId}/knowledge`);

  if (!response.ok) {
    throw new Error(`Erro ao listar conhecimento: ${response.statusText}`);
  }

  const data = await response.json();
  return data.knowledge;
}

export async function deleteAgentKnowledge(
  agentId: string,
  knowledgeId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/agents/${agentId}/knowledge/${knowledgeId}`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao deletar conhecimento: ${errorText || response.statusText}`);
  }
}

// ========== Dashboard Statistics ==========

export interface DashboardStats {
  total_agents: number;
  agents_this_month: number;
  total_debates: number;
  debates_this_week: number;
  llms_count: number;
  llms_list: string[];
  api_usage_percent: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await fetch(`${API_BASE_URL}/api/admin/stats`);

  if (!response.ok) {
    throw new Error(`Erro ao buscar estatísticas: ${response.statusText}`);
  }

  return response.json();
}

export async function uploadAgentKnowledgeFile(
  agentId: string,
  file: File,
  title?: string
): Promise<{ success: boolean; knowledge_id: string; filename: string; text_length: number; title: string }> {
  const formData = new FormData();
  formData.append('file', file);
  if (title) {
    formData.append('title', title);
  }

  const response = await fetch(
    `${API_BASE_URL}/api/admin/agents/${agentId}/knowledge/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao fazer upload do arquivo: ${errorText || response.statusText}`);
  }

  return response.json();
}

// ========== LLM Providers ==========

export interface LLMProvider {
  provider: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected';
  api_key: string | null;
  models: {
    [key: string]: {
      name: string;
      cost: string;
      enabled: boolean;
      description?: string;
    };
  };
}

export interface LLMProviderUpdate {
  api_key?: string;
  status?: string;
  enabled_models?: string[];
}

export async function listLLMProviders(): Promise<LLMProvider[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/llms`);

  if (!response.ok) {
    throw new Error(`Erro ao listar provedores LLM: ${response.statusText}`);
  }

  const data = await response.json();
  return data.providers;
}

export async function getLLMProvider(provider: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/admin/llms/${provider}`);

  if (!response.ok) {
    throw new Error(`Erro ao buscar provedor: ${response.statusText}`);
  }

  return response.json();
}

export async function updateLLMProvider(
  provider: string,
  config: LLMProviderUpdate
): Promise<{ success: boolean; provider: string }> {
  const response = await fetch(`${API_BASE_URL}/api/admin/llms/${provider}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao atualizar provedor: ${errorText || response.statusText}`);
  }

  return response.json();
}

export async function testLLMConnection(
  provider: string
): Promise<{ connected: boolean; provider: string; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/admin/llms/${provider}/test`, {
    method: 'POST',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao testar conexão: ${errorText || response.statusText}`);
  }

  return response.json();
}

export async function updateLLMModel(
  provider: string,
  model: string,
  enabled: boolean
): Promise<{ success: boolean; provider: string; model: string; enabled: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/admin/llms/${provider}/models/${model}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ enabled }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao atualizar modelo: ${errorText || response.statusText}`);
  }

  return response.json();
}