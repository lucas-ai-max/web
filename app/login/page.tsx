'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Facebook, Apple, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex h-screen bg-black overflow-hidden relative">
      {/* Background Principal */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: `url('/BG%20PRINCIPAL.png')` }}
      />
      {/* Overlay escuro para melhorar legibilidade */}
      <div className="fixed inset-0 bg-black/50 z-10" />
      
      <div className="flex-1 flex items-center justify-center relative z-20">

        <div className="relative z-10 w-full max-w-md px-8">
          <div className="bg-black/60 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
                  {/* Título */}
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white mb-1.5">
                      Entre em sua conta
                    </h2>
                    <p className="text-white/70 text-xs">
                      Insira seu e-mail e senha para entrar.
                    </p>
                  </div>

                  {/* Formulário */}
                  <form className="space-y-4">
                    {/* Email */}
                    <div>
                      <Label htmlFor="email" className="block text-white mb-1.5 font-medium text-xs">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Digite seu e-mail"
                        className="w-full bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#3B82F6] focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Senha */}
                    <div>
                      <Label htmlFor="password" className="block text-white mb-1.5 font-medium text-xs">
                        Senha
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Digite sua senha"
                        className="w-full bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#3B82F6] focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Lembrar-me */}
                    <div className="flex items-center gap-2">
                      <Switch id="remember" className="scale-75" />
                      <Label htmlFor="remember" className="text-white text-xs cursor-pointer">
                        Lembrar-me
                      </Label>
                    </div>

                    {/* Botão */}
                    <Button
                      type="submit"
                      className="w-full bg-[#3B82F6] hover:bg-[#2563EB] rounded-xl py-2 text-white font-semibold text-base transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        router.push('/');
                      }}
                    >
                      SIGN IN
                    </Button>

                    {/* Link para registro */}
                    <p className="text-center text-white/70 text-xs">
                      Ainda não tem conta?{' '}
                      <button
                        onClick={() => router.push('/register')}
                        className="text-white font-semibold hover:underline"
                      >
                        Inscrever-se
                      </button>
                    </p>

                    {/* Login Social */}
                    <div className="pt-4 border-t border-white/20">
                      <div className="flex justify-center gap-3">
                        <button
                          type="button"
                          className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors"
                        >
                          <Facebook className="w-4 h-4 text-white" />
                        </button>
                        <button
                          type="button"
                          className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors"
                        >
                          <Apple className="w-4 h-4 text-white" />
                        </button>
                        <button
                          type="button"
                          className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors"
                        >
                          <Mail className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                  </form>
          </div>
        </div>
      </div>
    </div>
  );
}

