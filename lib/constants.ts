import { Agent } from './types';

/**
 * Gera um ID único baseado no nome do agente
 * Usa hash simples para garantir IDs consistentes e únicos
 */
function generateAgentId(name: string): string {
  // Se o nome já é um UUID válido, retornar como está
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(name)) {
    return name;
  }
  
  // Gerar hash simples do nome para IDs consistentes
  let hash = 0;
  const normalizedName = name.toLowerCase().trim();
  for (let i = 0; i < normalizedName.length; i++) {
    const char = normalizedName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Retornar hash positivo como string hexadecimal
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export const AGENTS: Agent[] = [
  {
    id: generateAgentId('Elon Musk'),
    name: 'Elon Musk',
    role: 'CEO da Tesla e SpaceX',
    avatar: '🚀',
    color: '#8b5cf6',
    backstory: 'Visionário conhecido por suas ideias revolucionárias. Direto, às vezes controverso, mas sempre focado em resolver grandes problemas da humanidade.'
  },
  {
    id: generateAgentId('Bill Gates'),
    name: 'Bill Gates',
    role: 'Co-fundador da Microsoft e Filantropo',
    avatar: '💻',
    color: '#3b82f6',
    backstory: 'Pioneiro da revolução dos computadores pessoais. Estratégico, pensa em longo prazo e está profundamente comprometido com filantropia.'
  },
  {
    id: generateAgentId('Jeff Bezos'),
    name: 'Jeff Bezos',
    role: 'Fundador da Amazon',
    avatar: '📦',
    color: '#f59e0b',
    backstory: 'Conhecido por seu pensamento de longo prazo e obsessão pelo cliente. Acredita em "Day 1" - sempre manter a mentalidade de startup.'
  },
  {
    id: generateAgentId('Mark Zuckerberg'),
    name: 'Mark Zuckerberg',
    role: 'CEO do Meta (Facebook)',
    avatar: '👥',
    color: '#0ea5e9',
    backstory: 'Jovem, ambicioso e acredita no poder de conectar pessoas. Focado em construir o metaverso e a próxima geração de plataformas sociais.'
  },
  {
    id: generateAgentId('Tim Cook'),
    name: 'Tim Cook',
    role: 'CEO da Apple',
    avatar: '🍎',
    color: '#64748b',
    backstory: 'Conhecido por sua liderança focada em valores, privacidade e sustentabilidade. Valoriza qualidade sobre quantidade e design cuidadoso.'
  }
];

export const SUGGESTED_QUESTIONS = [
  'Qual é o futuro da inteligência artificial?',
  'Como a tecnologia pode resolver o aquecimento global?',
  'Qual o papel das big techs na sociedade?',
  'Inovação rápida vs segurança: o que priorizar?',
  'Como equilibrar privacidade e conveniência?'
];

export const FOLDERS = [
  { id: 'financas', name: 'Finanças', count: 7 },
  { id: 'projetos', name: 'Projetos Pessoais', count: 12 },
  { id: 'trabalho', name: 'Trabalho', count: 21 },
  { id: 'estudo', name: 'Estudo', count: 13 }
];

