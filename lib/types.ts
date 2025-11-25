export interface Agent {
  id: string;
  name: string;
  role: string;
  description?: string;
  avatar: string;
  color: string;
  backstory: string;
}

export interface AdminAgent {
  id: string;
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
  verbose: boolean;
  allow_delegation: boolean;
  status: 'active' | 'inactive';
  tags: string[];
  description?: string;
  created_at: string;
  updated_at: string;
  total_debates: number;
  last_used?: string;
}

export interface Message {
  id: string;
  type: 'user' | 'agent' | 'round' | 'question' | 'sintese' | 'sintese_conteudo';
  agentId?: string;
  agentName?: string;
  agentRole?: string;
  agentDescription?: string;
  agentAvatar?: string;
  agentColor?: string;
  content: string;
  timestamp: Date;
  roundNumber?: number;
}

export interface Chat {
  id: string;
  debateId?: string; // UUID do debate no banco de dados
  title: string;
  messages: Message[];
  selectedAgents: string[];
  numRodadas: number;
  createdAt: Date;
  folderId?: string | null;
}

export interface DebateConfig {
  selectedAgents: string[];
  numRodadas: number;
  pergunta: string;
}

export interface Folder {
  id: string;
  name: string;
  count: number;
  icon?: string;
}
