'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/admin/FormField';
import {
  listLLMProviders,
  updateLLMProvider,
  testLLMConnection,
  updateLLMModel,
  LLMProvider,
} from '@/lib/admin-api';
import { Loader2, Save, TestTube2, Trash2 } from 'lucide-react';
import { useToastStore } from '@/lib/toast-store';
import { useConfirm } from '@/lib/useConfirm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const PROVIDER_ICONS: { [key: string]: string } = {
  openai: '🤖',
  anthropic: '🧠',
  google: '💎',
};

const PROVIDER_COLORS: { [key: string]: string } = {
  openai: 'green',
  anthropic: 'purple',
  google: 'blue',
};

export default function LLMsPage() {
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState<{ [key: string]: boolean }>({});
  const [testing, setTesting] = useState<{ [key: string]: boolean }>({});
  const { showToast } = useToastStore();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const data = await listLLMProviders();
      setProviders(data);
      
      // Inicializar API keys com valores vazios
      const keys: { [key: string]: string } = {};
      data.forEach((provider) => {
        keys[provider.provider] = provider.api_key === '***' ? '' : (provider.api_key || '');
      });
      setApiKeys(keys);
    } catch (error) {
      console.error('Erro ao carregar provedores:', error);
      showToast(`Erro ao carregar provedores: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = async (provider: string) => {
    const apiKey = apiKeys[provider]?.trim();
    if (!apiKey) {
      showToast('Por favor, digite uma API key', 'warning');
      return;
    }

    try {
      setSaving((prev) => ({ ...prev, [provider]: true }));
      // Salvar API key sem marcar como connected - só após teste
      await updateLLMProvider(provider, {
        api_key: apiKey,
        // Não definir status aqui - só após teste bem-sucedido
      });
      
      // Recarregar provedores
      await loadProviders();
      showToast('API key salva com sucesso! Agora clique em "Testar" para verificar a conexão.', 'success');
    } catch (error) {
      console.error('Erro ao salvar API key:', error);
      showToast(`Erro ao salvar API key: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'error');
    } finally {
      setSaving((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const handleTestConnection = async (provider: string) => {
    try {
      setTesting((prev) => ({ ...prev, [provider]: true }));
      const result = await testLLMConnection(provider);
      
      if (result.connected) {
        showToast(result.message, 'success');
        // O backend já atualiza o status para "connected" quando o teste passa
        // Apenas recarregar os provedores para mostrar o status atualizado
        await loadProviders();
      } else {
        showToast('Conexão falhou', 'error');
      }
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      showToast(`Erro ao testar conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'error');
    } finally {
      setTesting((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const handleDeleteApiKey = async (provider: string) => {
    const confirmed = await confirm({
      title: 'Confirmar exclusão',
      message: 'Tem certeza que deseja deletar a API key? Isso desconectará o provedor.',
      variant: 'destructive',
    });
    
    if (!confirmed) return;

    try {
      setSaving((prev) => ({ ...prev, [provider]: true }));
      // Deletar a chave e marcar como desconectado
      await updateLLMProvider(provider, {
        api_key: '',  // String vazia para deletar
        status: 'disconnected',
      });
      
      // Limpar do estado local
      setApiKeys((prev) => ({
        ...prev,
        [provider]: '',
      }));
      
      // Recarregar provedores
      await loadProviders();
      showToast('API key deletada com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao deletar API key:', error);
      showToast(`Erro ao deletar API key: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'error');
    } finally {
      setSaving((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const handleToggleModel = async (provider: string, modelKey: string, enabled: boolean) => {
    try {
      await updateLLMModel(provider, modelKey, enabled);
      
      // Atualizar estado local
      setProviders((prev) =>
        prev.map((p) => {
          if (p.provider === provider) {
            return {
              ...p,
              models: {
                ...p.models,
                [modelKey]: {
                  ...p.models[modelKey],
                  enabled,
                },
              },
            };
          }
          return p;
        })
      );
    } catch (error) {
      console.error('Erro ao atualizar modelo:', error);
      showToast(`Erro ao atualizar modelo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'error');
      // Recarregar para reverter mudança
      await loadProviders();
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'connected') {
      return (
        <Badge variant="default" className="bg-green-500/20 text-green-500">
          Conectado
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        Desconectado
      </Badge>
    );
  };

  const getProviderColorClass = (provider: string) => {
    const providerLower = provider.toLowerCase();
    if (providerLower === 'openai') return 'bg-green-500/20';
    if (providerLower === 'anthropic') return 'bg-purple-500/20';
    if (providerLower === 'google') return 'bg-blue-500/20';
    return 'bg-gray-500/20';
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Configuração de LLMs</h1>
        <p className="text-muted-foreground">
          Gerencie provedores de IA e modelos disponíveis
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {providers.map((provider) => {
          const icon = PROVIDER_ICONS[provider.provider.toLowerCase()] || '🤖';
          const colorClass = getProviderColorClass(provider.provider);
          
          return (
            <Card key={provider.provider} className="bg-[#2d2d2d] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center`}>
                    <span className="text-xl">{icon}</span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{provider.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{provider.description}</p>
                  </div>
                </div>
                {getStatusBadge(provider.status)}
          </CardHeader>

          <CardContent className="space-y-4">
            <FormField label="API Key">
                  <Input
                    type={provider.status === 'connected' ? 'text' : 'password'}
                    placeholder={provider.provider === 'openai' ? 'sk-...' : provider.provider === 'anthropic' ? 'sk-ant-...' : 'AIza...'}
                    value={
                      provider.status === 'connected' && provider.api_key
                        ? provider.api_key  // Mostrar chave parcial quando conectada
                        : (apiKeys[provider.provider] || '')
                    }
                    onChange={(e) =>
                      setApiKeys((prev) => ({
                        ...prev,
                        [provider.provider]: e.target.value,
                      }))
                    }
                    className="bg-background"
                    disabled={provider.status === 'connected'} // Desabilitar quando conectada
                  />
                  {provider.status === 'connected' && provider.api_key && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Chave configurada e funcionando
                    </p>
                  )}
            </FormField>

                <div className="flex gap-2">
                  {provider.status !== 'connected' ? (
                    <>
                      <Button
                        type="button"
                        onClick={() => handleSaveApiKey(provider.provider)}
                        disabled={saving[provider.provider] || testing[provider.provider]}
                        className="flex-1"
                        variant="default"
                      >
                        {saving[provider.provider] ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Salvar
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleTestConnection(provider.provider)}
                        disabled={saving[provider.provider] || testing[provider.provider] || !apiKeys[provider.provider]?.trim()}
                        className="flex-1"
                        variant="outline"
                      >
                        {testing[provider.provider] ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Testando...
                          </>
                        ) : (
                          <>
                            <TestTube2 className="w-4 h-4 mr-2" />
                            Testar
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => handleDeleteApiKey(provider.provider)}
                      disabled={saving[provider.provider] || testing[provider.provider]}
                      className="w-full"
                      variant="destructive"
                    >
                      {saving[provider.provider] ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Deletando...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Deletar Chave
                        </>
                      )}
                    </Button>
                  )}
                </div>

            <div className="space-y-2">
              <Label>Modelos Disponíveis</Label>
              <div className="space-y-2">
                    {Object.entries(provider.models).map(([modelKey, model]) => (
                      <div
                        key={modelKey}
                        className="flex items-center justify-between p-2 rounded bg-white/5"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{model.name}</p>
                          <p className="text-xs text-muted-foreground">{model.cost}</p>
                          {model.description && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              {model.description}
                            </p>
                          )}
                  </div>
                        <Switch
                          checked={model.enabled}
                          onCheckedChange={(checked) =>
                            handleToggleModel(provider.provider, modelKey, checked)
                          }
                          disabled={provider.status !== 'connected'}
                        />
                </div>
                    ))}
              </div>
            </div>
          </CardContent>
        </Card>
          );
        })}
      </div>
    </div>
  );
}
