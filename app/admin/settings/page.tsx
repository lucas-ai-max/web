'use client';

import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/admin/FormField';
import {
  SystemSettings,
  SystemSettingsUpdate,
  getSystemSettings,
  updateSystemSettings,
} from '@/lib/admin-api';

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [settingsWarning, setSettingsWarning] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      setLoading(true);
      try {
        const data = await getSystemSettings();
        if (isMounted) {
          setSettings(data.settings);
          setSettingsWarning(data.warning ?? null);
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Erro ao carregar configurações');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadSettings();
    return () => {
      isMounted = false;
    };
  }, []);


  const updateSecurity = (changes: Partial<SystemSettings['security']>) => {
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            security: {
              ...prev.security,
              ...changes,
            },
          }
        : prev
    );
  };

  const handleSave = async () => {
    if (!settings) {
      return;
    }

    setSaving(true);
    setStatusMessage(null);
    setErrorMessage(null);

    const securityPayload: SystemSettingsUpdate['security'] = {
      enable_2fa: settings.security.enable_2fa,
      log_activities: settings.security.log_activities,
    };

    if (adminPassword.trim()) {
      securityPayload.admin_password = adminPassword.trim();
    }

    const payload: SystemSettingsUpdate = {
      security: securityPayload,
    };

    try {
      const updated = await updateSystemSettings(payload);
      setSettings(updated.settings);
      setSettingsWarning(updated.warning ?? null);
      setAdminPassword('');
      setStatusMessage('Configurações salvas com sucesso');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações gerais do sistema
        </p>
      </div>

      {settingsWarning && (
        <p className="text-sm text-yellow-400 mb-2">⚠️ {settingsWarning}</p>
      )}
      {statusMessage && <p className="text-sm text-green-500 mb-2">{statusMessage}</p>}
      {errorMessage && <p className="text-sm text-destructive mb-2">{errorMessage}</p>}

      <div className="space-y-6 max-w-3xl">
        {/* Configurações de Segurança */}
        <Card className="bg-[#2d2d2d] border-white/10">
          <CardHeader>
            <CardTitle>Segurança</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              label="Senha do Admin"
              description="Mantenha em branco para não alterar. Use pelo menos 8 caracteres."
            >
              <Input
                type="password"
                placeholder="Digite para alterar"
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value)}
              />
            </FormField>

            <FormField label="Autenticação de dois fatores">
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.security.enable_2fa}
                  onCheckedChange={(value) => updateSecurity({ enable_2fa: Boolean(value) })}
                />
                <Label>Habilitar 2FA</Label>
              </div>
            </FormField>

            <FormField label="Log de atividades">
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.security.log_activities}
                  onCheckedChange={(value) => updateSecurity({ log_activities: Boolean(value) })}
                />
                <Label>Registrar todas as ações</Label>
              </div>
            </FormField>

            <p className="text-xs text-muted-foreground mt-1">
              Senha configurada:{' '}
              {settings.security.admin_password_set ? 'Sim (oculta)' : 'Não configurada'}
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            Atualizado em tempo real após salvar
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </div>
    </div>
  );
}
