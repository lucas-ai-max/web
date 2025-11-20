import { Agent } from './types';

export const AGENTS: Agent[] = [
  {
    id: 'elon',
    name: 'Elon Musk',
    role: 'CEO da Tesla e SpaceX',
    avatar: '🚀',
    color: '#8b5cf6',
    backstory: 'Visionário conhecido por suas ideias revolucionárias. Direto, às vezes controverso, mas sempre focado em resolver grandes problemas da humanidade.'
  },
  {
    id: 'bill',
    name: 'Bill Gates',
    role: 'Co-fundador da Microsoft e Filantropo',
    avatar: '💻',
    color: '#3b82f6',
    backstory: 'Pioneiro da revolução dos computadores pessoais. Estratégico, pensa em longo prazo e está profundamente comprometido com filantropia.'
  },
  {
    id: 'jeff',
    name: 'Jeff Bezos',
    role: 'Fundador da Amazon',
    avatar: '📦',
    color: '#f59e0b',
    backstory: 'Conhecido por seu pensamento de longo prazo e obsessão pelo cliente. Acredita em "Day 1" - sempre manter a mentalidade de startup.'
  },
  {
    id: 'mark',
    name: 'Mark Zuckerberg',
    role: 'CEO do Meta (Facebook)',
    avatar: '👥',
    color: '#0ea5e9',
    backstory: 'Jovem, ambicioso e acredita no poder de conectar pessoas. Focado em construir o metaverso e a próxima geração de plataformas sociais.'
  },
  {
    id: 'tim',
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

