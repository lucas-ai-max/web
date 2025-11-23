# Mesa de Debates - Interface Web Modern

Interface web moderna para debates entre bilionários de tecnologia usando Next.js 14+, TypeScript, Tailwind CSS e Shadcn/ui.

## 🚀 Iniciando o Projeto

### Instalação

```bash
npm install
```

### Executar em Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

### Build para Produção

```bash
npm run build
npm start
```

## 📁 Estrutura do Projeto

```
web/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Página principal
│   └── globals.css        # Estilos globais
├── components/
│   ├── sidebar/           # Componentes da sidebar
│   ├── chat/              # Componentes do chat
│   ├── agents/             # Componentes de seleção de agentes
│   └── ui/                 # Componentes Shadcn/ui
├── lib/
│   ├── types.ts           # Tipos TypeScript
│   ├── constants.ts       # Constantes e dados
│   ├── store.ts           # Store Zustand
│   └── api.ts             # Funções de API
└── public/                # Arquivos estáticos
```

## 🔌 Integração com Backend Python

A aplicação espera um servidor API Python rodando. Você precisa criar endpoints que correspondam à interface definida em `lib/api.ts`.

### Endpoint Necessário

**POST /api/debate/start**

```typescript
Request: {
  agentes: string[];      // IDs dos agentes selecionados
  pergunta: string;       // Pergunta do debate
  num_rodadas: number;    // Número de rodadas (1-5)
}

Response: {
  historico: Array<{
    tipo: 'pergunta' | 'rodada' | 'resposta' | 'erro';
    conteudo: string;
    agente?: string;       // Nome/role do agente
    rodada?: number;
  }>;
}
```

### Configuração da URL da API

Crie um arquivo `.env.local` na raiz do projeto `web/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Ou ajuste a URL em `lib/api.ts` se preferir.

## 🎨 Características

- ✅ Interface moderna e responsiva
- ✅ Dark mode nativo
- ✅ Seleção múltipla de agentes
- ✅ Histórico de debates persistente (localStorage)
- ✅ Animações suaves
- ✅ Estados de loading
- ✅ Validações de formulário
- ✅ Acessibilidade

## 🛠️ Tecnologias

- **Next.js 14+** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Shadcn/ui** - Componentes UI
- **Zustand** - Gerenciamento de estado
- **Lucide React** - Ícones
- **date-fns** - Manipulação de datas

## 📝 Próximos Passos

1. Criar servidor API Python (FastAPI ou Flask)
2. Implementar autenticação (opcional)
3. Adicionar mais funcionalidades (exportar debates, compartilhar, etc.)
4. Melhorar responsividade mobile
5. Adicionar testes
