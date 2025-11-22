'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, ArrowLeft, Upload, FileText } from 'lucide-react';
import { addAgentKnowledge, listAgentKnowledge, deleteAgentKnowledge, uploadAgentKnowledgeFile } from '@/lib/admin-api';
import { AgentKnowledge } from '@/lib/admin-api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useConfirm } from '@/lib/useConfirm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToastStore } from '@/lib/toast-store';

export default function AgentKnowledgePage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;
  const [knowledge, setKnowledge] = useState<AgentKnowledge[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const { showToast } = useToastStore();

  useEffect(() => {
    loadKnowledge();
  }, [agentId]);

  const loadKnowledge = async () => {
    try {
      setLoadingList(true);
      const data = await listAgentKnowledge(agentId);
      setKnowledge(data);
    } catch (error) {
      console.error('Erro ao carregar conhecimento:', error);
    } finally {
      setLoadingList(false);
    }
  };

  const handleAdd = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Por favor, preencha título e conteúdo');
      return;
    }

    setLoading(true);
    try {
      await addAgentKnowledge(agentId, title, content, 'text');
      setTitle('');
      setContent('');
      loadKnowledge();
    } catch (error) {
      console.error('Erro ao adicionar conhecimento:', error);
      alert(`Erro ao adicionar conhecimento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (knowledgeId: string) => {
    const confirmed = await confirm({
      title: 'Confirmar exclusão',
      message: 'Tem certeza que deseja deletar este documento?',
      variant: 'destructive',
    });
    
    if (!confirmed) return;

    try {
      await deleteAgentKnowledge(agentId, knowledgeId);
      loadKnowledge();
    } catch (error) {
      console.error('Erro ao deletar:', error);
      showToast(`Erro ao deletar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'error');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      const allowedTypes = ['.txt', '.pdf', '.docx'];
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!allowedTypes.includes(fileExt)) {
        alert(`Formato de arquivo não suportado. Formatos permitidos: ${allowedTypes.join(', ')}`);
        e.target.value = '';
        return;
      }
      
      // Validar tamanho (máximo 100MB)
      if (file.size > 100 * 1024 * 1024) {
        alert('Arquivo muito grande. Tamanho máximo: 100MB');
        e.target.value = '';
        return;
      }
      
      setSelectedFile(file);
      if (!fileTitle.trim()) {
        // Usar nome do arquivo como título se não foi definido
        setFileTitle(file.name.replace(/\.[^/.]+$/, '')); // Remove extensão
      }
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) {
      alert('Por favor, selecione um arquivo');
      return;
    }

    setLoadingFile(true);
    try {
      await uploadAgentKnowledgeFile(agentId, selectedFile, fileTitle || undefined);
      setSelectedFile(null);
      setFileTitle('');
      // Limpar input de arquivo
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      loadKnowledge();
      alert('Arquivo enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert(`Erro ao fazer upload: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoadingFile(false);
    }
  };

  return (
    <div className="p-8 relative">
      {/* Overlay de carregamento durante upload */}
      {loadingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl">
          <div className="bg-[#1F1F1F] border border-white/10 rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Processando Arquivo</h3>
                <p className="text-white/60 text-sm">
                  {selectedFile && (
                    <>
                      Enviando <strong>{selectedFile.name}</strong>...
                    </>
                  )}
                </p>
                <p className="text-white/40 text-xs mt-2">
                  {selectedFile && `Tamanho: ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`}
                </p>
                <p className="text-white/40 text-xs mt-4">
                  Aguarde enquanto o arquivo é processado e adicionado à base de conhecimento do agente.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-white/60 text-sm">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#3B82F6] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#3B82F6] animate-bounce" style={{ animationDelay: '200ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#3B82F6] animate-bounce" style={{ animationDelay: '400ms' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <Link href="/admin/agents">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Agentes
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">Base de Conhecimento do Agente</h1>
        <p className="text-muted-foreground">
          Adicione documentos e informações que este agente usará durante os debates
        </p>
      </div>

      <Card className="mb-6 bg-[#2d2d2d] border-white/10">
        <CardHeader>
          <CardTitle>Adicionar Novo Documento</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text">
                <FileText className="mr-2 h-4 w-4" />
                Texto
              </TabsTrigger>
              <TabsTrigger value="file">
                <Upload className="mr-2 h-4 w-4" />
                Arquivo
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="text" className="space-y-4 mt-4">
              <Input
                placeholder="Título do documento (ex: 'História da Empresa', 'Princípios Fundamentais')"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-background"
              />
              <Textarea
                placeholder="Conteúdo do documento... Você pode colar textos, artigos, informações relevantes que o agente deve conhecer."
                rows={10}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="bg-background"
              />
              <Button type="button" onClick={handleAdd} disabled={loading || !title.trim() || !content.trim()}>
                <Plus className="mr-2 h-4 w-4" />
                {loading ? 'Adicionando...' : 'Adicionar Documento'}
              </Button>
            </TabsContent>
            
            <TabsContent value="file" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label htmlFor="file-upload" className="text-sm font-medium">
                  Selecionar Arquivo
                </label>
                <div className="flex items-center gap-4">
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".txt,.pdf,.docx"
                    onChange={handleFileSelect}
                    className="bg-background cursor-pointer"
                  />
                  {selectedFile && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>{selectedFile.name}</span>
                      <span className="text-xs">
                        ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Formatos suportados: TXT, PDF, DOCX (máximo 100MB)
                </p>
              </div>
              
              <Separator />
              
              <Input
                placeholder="Título do documento (opcional - usará nome do arquivo se não preenchido)"
                value={fileTitle}
                onChange={(e) => setFileTitle(e.target.value)}
                className="bg-background"
              />
              
              <Button 
                type="button"
                onClick={handleUploadFile} 
                disabled={loadingFile || !selectedFile}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                {loadingFile ? 'Enviando...' : 'Enviar Arquivo'}
              </Button>
              
              {selectedFile && (
                <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-md text-sm text-blue-200">
                  <p className="font-medium mb-1">Arquivo selecionado:</p>
                  <p className="text-xs">{selectedFile.name}</p>
                  <p className="text-xs mt-1">
                    O texto será extraído automaticamente do arquivo e adicionado à base de conhecimento.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {loadingList ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando documentos...</p>
        </div>
      ) : knowledge.length === 0 ? (
        <Card className="bg-[#2d2d2d] border-white/10">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Nenhum documento adicionado ainda</p>
            <p className="text-sm text-muted-foreground">
              Adicione documentos acima para enriquecer a base de conhecimento deste agente
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">
            Documentos ({knowledge.length})
          </h2>
          {knowledge.map((doc) => (
            <Card key={doc.id} className="bg-[#2d2d2d] border-white/10">
              <CardHeader className="flex flex-row justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{doc.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Adicionado em {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  type="button"
                  onClick={() => handleDelete(doc.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.options?.title || 'Confirmar'}
        message={confirmState.options?.message || ''}
        confirmText={confirmState.options?.confirmText || 'Confirmar'}
        cancelText={confirmState.options?.cancelText || 'Cancelar'}
        variant={confirmState.options?.variant || 'default'}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}

