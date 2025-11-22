'use client';

import { useEffect, useRef } from 'react';
import { MoreVertical, Copy } from 'lucide-react';

import { useStore } from '@/lib/store';
import { Message } from '@/lib/types';

export function ChatArea() {
  const chat = useStore(state => state.getCurrentChat());
  const messages = chat?.messages ?? [];
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black/30">
        <p className="text-white/60">Selecione um chat ou inicie um debate para ver as mensagens aqui.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-black/30 min-h-0">
      <div
        className="flex-1 chat-scroll px-5 py-6 space-y-4"
        style={{ paddingTop: '8rem' }}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-white/50">Nenhuma mensagem ainda. Envie uma pergunta para começar o debate.</p>
          </div>
        ) : (
          <>
            {messages.map(message => (
              <MessageBubble key={message.id} message={message} onCopy={copyToClipboard} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      {scrollStyles}
    </div>
  );

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }
}

function MessageBubble({ message, onCopy }: { message: Message; onCopy: (text: string) => void }) {
  const isUserMessage = message.type === 'user' || message.type === 'question';

  if (isUserMessage) {
    return (
      <div className="flex justify-end items-start gap-2">
        <div className="flex flex-col items-end max-w-2xl text-right">
          <div className="bg-[#2563eb] rounded-2xl rounded-tr-sm px-4 py-3 shadow-lg border border-white/10">
            <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
          <span className="text-xs text-white/40 mt-1 px-1">
            {new Date(message.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 group">
      <div className="relative flex-shrink-0">
        {message.agentAvatar ? (
          <img
            src={message.agentAvatar}
            alt={message.agentName}
            className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <span className="text-xs text-white/70">{message.agentName?.[0]}</span>
          </div>
        )}
      </div>
      <div className="flex flex-col items-start max-w-2xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-white/90">{message.agentName}</span>
          <span className="text-xs text-white/50">{message.agentRole}</span>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-2xl rounded-tl-sm px-4 py-3 shadow-lg border border-white/10 relative">
          <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        <div className="flex items-center gap-3 mt-1 px-1">
          <span className="text-xs text-white/40">
            {new Date(message.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onCopy(message.content)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title="Copiar"
            >
              <Copy size={14} className="text-white/60" />
            </button>
            <button className="p-1 hover:bg-white/10 rounded transition-colors">
              <MoreVertical size={14} className="text-white/60" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const scrollStyles = (
  <style jsx global>{`
    .chat-scroll {
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
    }

    .chat-scroll::-webkit-scrollbar {
      width: 8px;
    }

    .chat-scroll::-webkit-scrollbar-track {
      background: transparent;
    }

    .chat-scroll::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
    }

    .chat-scroll::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.35);
    }
  `}</style>
);

