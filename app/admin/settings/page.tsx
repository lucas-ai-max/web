'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/admin/FormField';
import { Progress } from '@/components/ui/progress';

export default function SettingsPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações gerais do sistema
        </p>
      </div>

      <div className="space-y-6 max-w-3xl">
        {/* Configurações de Debate */}
        <Card className="bg-[#2d2d2d] border-white/10">
          <CardHeader>
            <CardTitle>Configurações de Debate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Número máximo de rodadas">
              <Input type="number" min={1} max={10} defaultValue={5} />
            </FormField>

            <FormField label="Timeout por resposta (segundos)">
              <Input type="number" min={30} max={300} defaultValue={120} />
            </FormField>

            <FormField label="Permitir debates sem mínimo de agentes">
              <div className="flex items-center gap-2">
                <Switch />
                <Label>Permitir</Label>
              </div>
            </FormField>
          </CardContent>
        </Card>

        {/* Configurações de API */}
        <Card className="bg-[#2d2d2d] border-white/10">
          <CardHeader>
            <CardTitle>Limites de API</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Limite mensal de tokens">
              <Input type="number" defaultValue={1000000} />
              <Progress value={89} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                890,000 / 1,000,000 usados
              </p>
            </FormField>

            <FormField label="Alertar quando atingir (%)">
              <Input type="number" min={1} max={100} defaultValue={80} />
            </FormField>
          </CardContent>
        </Card>

        {/* Configurações de Segurança */}
        <Card className="bg-[#2d2d2d] border-white/10">
          <CardHeader>
            <CardTitle>Segurança</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Senha do Admin">
              <Input type="password" placeholder="Digite para alterar" />
            </FormField>

            <FormField label="Autenticação de dois fatores">
              <div className="flex items-center gap-2">
                <Switch />
                <Label>Habilitar 2FA</Label>
              </div>
            </FormField>

            <FormField label="Log de atividades">
              <div className="flex items-center gap-2">
                <Switch defaultChecked />
                <Label>Registrar todas as ações</Label>
              </div>
            </FormField>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button>Salvar Configurações</Button>
        </div>
      </div>
    </div>
  );
}

