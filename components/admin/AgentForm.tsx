'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Check, Trash2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lightbulb, Info } from 'lucide-react';
import { FormField } from './FormField';
import { getAgent, createAgent, updateAgent, deleteAgent, uploadAvatar } from '@/lib/admin-api';

interface AgentFormProps {
  agentId?: string;
}

export function AgentForm({ agentId }: AgentFormProps) {
  const router = useRouter();
  const isEditing = !!agentId;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    avatar: '🚀',
    color: '#8b5cf6',
    status: 'active' as 'active' | 'inactive',
    llm_provider: 'openai',
    llm_model: 'gpt-4',
    temperature: [0.7],
    max_tokens: 1000,
    role: '',
    goal: '',
    backstory: '',
    verbose: true,
    allow_delegation: false,
    tags: [] as string[],
    description: '',
  });

  useEffect(() => {
    if (isEditing && agentId) {
      loadAgent();
    }
  }, [agentId, isEditing]);

  const loadAgent = async () => {
    if (!agentId) return;
    try {
      setLoading(true);
      const agent = await getAgent(agentId);
      
      // Garantir que temperature seja sempre um número
      const temperatureValue = typeof agent.temperature === 'number' 
        ? agent.temperature 
        : parseFloat(String(agent.temperature)) || 0.7;
      
      // Garantir que max_tokens seja sempre um número
      const maxTokensValue = typeof agent.max_tokens === 'number'
        ? agent.max_tokens
        : parseInt(String(agent.max_tokens)) || 1000;
      
      setFormData({
        name: agent.name,
        avatar: agent.avatar,
        color: agent.color,
        status: agent.status as 'active' | 'inactive',
        llm_provider: agent.llm_provider,
        llm_model: agent.llm_model,
        temperature: [temperatureValue],
        max_tokens: maxTokensValue,
        role: agent.role,
        goal: agent.goal,
        backstory: agent.backstory,
        verbose: agent.verbose ?? true,
        allow_delegation: agent.allow_delegation ?? false,
        tags: agent.tags || [],
        description: agent.description || '',
      });
    } catch (error) {
      console.error('Erro ao carregar agente:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Garantir que os valores numéricos sejam sempre números
      const temperatureValue = typeof formData.temperature[0] === 'number'
        ? formData.temperature[0]
        : parseFloat(String(formData.temperature[0])) || 0.7;
      
      const maxTokensValue = typeof formData.max_tokens === 'number'
        ? formData.max_tokens
        : parseInt(String(formData.max_tokens)) || 1000;
      
      const agentData = {
        name: formData.name,
        avatar: formData.avatar,
        color: formData.color,
        role: formData.role,
        goal: formData.goal,
        backstory: formData.backstory,
        llm_provider: formData.llm_provider,
        llm_model: formData.llm_model,
        temperature: temperatureValue,
        max_tokens: maxTokensValue,
        verbose: formData.verbose,
        allow_delegation: formData.allow_delegation,
        status: formData.status,
        tags: formData.tags,
        description: formData.description,
      };

      if (isEditing && agentId) {
        await updateAgent(agentId, agentData);
      } else {
        await createAgent(agentData);
      }

      router.push('/admin/agents');
    } catch (error) {
      console.error('Erro ao salvar agente:', error);
      alert('Erro ao salvar agente. Verifique o console para mais detalhes.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!agentId || !isEditing) return;
    
    if (!confirm('Tem certeza que deseja deletar este agente? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setLoading(true);
      await deleteAgent(agentId);
      router.push('/admin/agents');
    } catch (error) {
      console.error('Erro ao deletar agente:', error);
      alert('Erro ao deletar agente. Verifique o console para mais detalhes.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/agents">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-semibold">
            {isEditing ? 'Editar Agente' : 'Criar Novo Agente'}
          </h2>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Preview Card */}
        <div className="lg:col-span-1">
          <Card className="bg-[#2d2d2d] border-white/10 sticky top-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Preview</CardTitle>
                {isEditing && agentId && (
                  <Link href={`/admin/agents/${agentId}/knowledge`}>
                    <Button variant="outline" size="sm" className="text-xs">
                      Base de Conhecimento
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div
                  className="w-24 h-24 rounded-lg flex items-center justify-center text-5xl overflow-hidden relative bg-[#2d2d2d] cursor-pointer group"
                  style={{ backgroundColor: `${formData.color}20` }}
                  onClick={() => {
                    const input = document.getElementById('avatar-upload');
                    if (input) {
                      input.click();
                    }
                  }}
                >
                  {formData.avatar && (formData.avatar.startsWith('http') || formData.avatar.startsWith('data:image') || formData.avatar.startsWith('https://')) ? (
                    <img
                      src={formData.avatar}
                      alt={formData.name || 'Avatar'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback para emoji se a imagem falhar
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          // Limpar conteúdo e adicionar emoji
                          parent.innerHTML = '';
                          const fallback = document.createElement('span');
                          fallback.className = 'text-5xl';
                          // Verificar se avatar é emoji (não começa com http/https)
                          const isEmoji = formData.avatar && !formData.avatar.startsWith('http') && !formData.avatar.startsWith('data:');
                          fallback.textContent = isEmoji ? formData.avatar : '👤';
                          parent.appendChild(fallback);
                        }
                      }}
                      onLoad={() => {
                        // Garantir que a imagem seja exibida
                        console.log('Imagem carregada com sucesso:', formData.avatar);
                      }}
                    />
                  ) : (
                    <span className="text-5xl">{formData.avatar || '👤'}</span>
                  )}
                  {/* Overlay com ícone de upload ao passar o mouse */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-lg">
                    {formData.name || 'Nome do Agente'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {formData.role || 'Papel do agente'}
                  </p>
                </div>
                <div className="w-full space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">LLM:</span>
                    <span className="font-medium">{formData.llm_model}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Status:</span>
                    <span
                      className={`font-medium ${
                        formData.status === 'active'
                          ? 'text-green-500'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {formData.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="llm">LLM</TabsTrigger>
              <TabsTrigger value="prompts">Prompts</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-6">
              <FormField label="Nome do Agente" required>
                <Input
                  placeholder="Ex: Elon Musk"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </FormField>

              <FormField label="Avatar">
                <div className="space-y-3">
                  {/* Input file oculto - usado quando clica na imagem de preview */}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="avatar-upload"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Validar tamanho (máx 5MB)
                        if (file.size > 5 * 1024 * 1024) {
                          alert('A imagem deve ter no máximo 5MB');
                          return;
                        }
                        
                        // Validar tipo
                        if (!file.type.startsWith('image/')) {
                          alert('Por favor, selecione uma imagem válida');
                          return;
                        }
                        
                        try {
                          setLoading(true);
                          // Fazer upload para Supabase Storage
                          const result = await uploadAvatar(file);
                          // Salvar URL no formulário
                          setFormData({ ...formData, avatar: result.url });
                        } catch (error) {
                          console.error('Erro ao fazer upload:', error);
                          alert(`Erro ao fazer upload da imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
                        } finally {
                          setLoading(false);
                        }
                      }
                    }}
                  />
                  
                  <p className="text-xs text-muted-foreground">
                    Clique na imagem de preview para fazer upload de uma foto (máx 5MB)
                  </p>
                </div>
              </FormField>

              <FormField label="Cor do Agente">
                <div className="flex gap-4 items-center">
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="w-20 h-10"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    placeholder="#8b5cf6"
                    className="flex-1"
                  />
                </div>
              </FormField>

              <FormField label="Status">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.status === 'active'}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        status: checked ? 'active' : 'inactive',
                      })
                    }
                  />
                  <Label>Agente ativo</Label>
                </div>
              </FormField>


              <FormField label="Descrição (opcional)">
                <Textarea
                  placeholder="Descrição interna para referência..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </FormField>
            </TabsContent>

            <TabsContent value="llm" className="space-y-4 mt-6">
              <FormField label="Provedor de LLM" required>
                <Select
                  value={formData.llm_provider}
                  onValueChange={(value) =>
                    setFormData({ ...formData, llm_provider: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Modelo" required>
                <Select
                  value={formData.llm_model}
                  onValueChange={(value) =>
                    setFormData({ ...formData, llm_model: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.llm_provider === 'openai' && (
                      <>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                        <SelectItem value="gpt-4.1">GPT-4.1</SelectItem>
                        <SelectItem value="gpt-4.1-mini">GPT-4.1 Mini</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      </>
                    )}
                    {formData.llm_provider === 'anthropic' && (
                      <>
                        <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                        <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                        <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                      </>
                    )}
                    {formData.llm_provider === 'google' && (
                      <>
                        <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                        <SelectItem value="gemini-ultra">Gemini Ultra</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField
                label="Temperature"
                description="Controla a criatividade das respostas (0 = conservador, 2 = criativo)"
              >
                <div className="space-y-2">
                  <Slider
                    min={0}
                    max={2}
                    step={0.1}
                    value={formData.temperature}
                    onValueChange={(value) =>
                      setFormData({ ...formData, temperature: value })
                    }
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Conservador (0)</span>
                    <span>Balanceado (1)</span>
                    <span>Criativo (2)</span>
                  </div>
                  <p className="text-sm font-medium">
                    Valor: {formData.temperature[0]}
                  </p>
                </div>
              </FormField>

              <FormField
                label="Max Tokens"
                description="Máximo de tokens por resposta"
              >
                <Input
                  type="number"
                  min={100}
                  max={4096}
                  value={formData.max_tokens}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_tokens: parseInt(e.target.value) || 1000,
                    })
                  }
                />
              </FormField>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Custo estimado por debate: ~$0.15 com estas configurações
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="prompts" className="space-y-4 mt-6">
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  Estes prompts definem a personalidade e comportamento do agente.
                  Seja específico e detalhado.
                </AlertDescription>
              </Alert>

              <FormField
                label="Role (Papel)"
                required
                description="O papel/função do agente no debate"
              >
                <Textarea
                  placeholder="Ex: CEO da Tesla e SpaceX"
                  rows={2}
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.role.length}/200 caracteres
                </p>
              </FormField>

              <FormField
                label="Goal (Objetivo)"
                required
                description="O que o agente busca alcançar nas discussões"
              >
                <Textarea
                  placeholder="Ex: Promover inovação disruptiva, sustentabilidade e exploração espacial"
                  rows={3}
                  value={formData.goal}
                  onChange={(e) =>
                    setFormData({ ...formData, goal: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.goal.length}/500 caracteres
                </p>
              </FormField>

              <FormField
                label="Backstory (História/Personalidade)"
                required
                description="Contexto detalhado sobre o agente, sua personalidade e estilo"
              >
                <Textarea
                  placeholder="Ex: Você é Elon Musk, um visionário conhecido por suas ideias revolucionárias..."
                  rows={8}
                  className="font-mono text-sm"
                  value={formData.backstory}
                  onChange={(e) =>
                    setFormData({ ...formData, backstory: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.backstory.length}/2000 caracteres
                </p>
              </FormField>
            </TabsContent>

          </Tabs>

          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <Link href="/admin/agents">
              <Button variant="ghost" type="button">Cancelar</Button>
            </Link>

            <div className="flex gap-3">
              <Button variant="outline" type="button">
                <Save className="mr-2 h-4 w-4" />
                Salvar como rascunho
              </Button>

              {isEditing && (
                <Button
                  variant="destructive"
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Deletar Agente
                </Button>
              )}

              <Button type="submit" disabled={loading}>
                <Check className="mr-2 h-4 w-4" />
                {loading
                  ? 'Salvando...'
                  : isEditing
                  ? 'Atualizar Agente'
                  : 'Criar Agente'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

