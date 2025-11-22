'use client';

import { Button } from '@/components/ui/button';
import { Home, Search, User, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  
  const showBackButton = pathname !== '/' && !pathname.startsWith('/login') && !pathname.startsWith('/register');

  return (
    <header 
      className="fixed top-6 z-50 flex items-center justify-between border border-white/10 bg-black/20 backdrop-blur-xl shadow-2xl"
      style={{
        left: 'calc(280px + 24px)',
        right: '24px',
        paddingTop: '10px',
        paddingBottom: '10px',
        paddingLeft: '22px',
        paddingRight: '22px',
        borderRadius: '80px',
        gap: '24px'
      }}
    >
      {/* Navegação ou Voltar */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {showBackButton && (
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10 rounded-lg px-4 py-2"
            onClick={() => router.back()}
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Voltar
          </Button>
        )}
        <Button
          variant="ghost"
          className="text-white hover:bg-white/10 rounded-lg px-4 py-2"
          onClick={() => router.push('/')}
        >
          <Home className="w-5 h-5 mr-2" />
          Home
        </Button>
      </div>

      {/* Busca (centralizada) */}
      <div className="flex-1 max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Buscar chats"
            className="w-full bg-[#E5E5E5] py-2 pl-10 pr-4 text-black placeholder:text-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            style={{ borderRadius: '50px' }}
          />
        </div>
      </div>

      {/* Login */}
      <div className="flex-shrink-0">
        <Button
          variant="ghost"
          className="text-white hover:bg-white/10 rounded-lg px-4 py-2"
          onClick={() => router.push('/login')}
        >
          <User className="w-5 h-5 mr-2" />
          Login
        </Button>
      </div>
    </header>
  );
}

