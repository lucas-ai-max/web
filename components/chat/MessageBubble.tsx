'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Message } from '@/lib/types';
import { AGENTS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { SynthesisBubble } from './SynthesisBubble';

interface MessageBubbleProps {
  message: Message;
  className?: string;
  previousMessage?: Message | null;
  isGrouped?: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
}

export function MessageBubble({ 
  message, 
  className, 
  previousMessage,
  isGrouped = false,
  isFirstInGroup = true,
  isLastInGroup = true
}: MessageBubbleProps) {
  if (message.type === 'sintese') {
    return (
      <div className={cn("flex justify-center my-5", className)}>
        <div className="bg-primary/20 rounded-full px-4 py-2 border border-primary/30">
          <p className="text-sm font-semibold text-primary">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  if (message.type === 'sintese_conteudo') {
    return <SynthesisBubble content={message.content} className={className} />;
  }

  if (message.type === 'user') {
    return (
      <div className={cn("flex justify-end", className)}>
        <div className="bg-primary text-primary-foreground rounded-[18px] px-4 py-3 max-w-[70%]">
          <p className="text-[15px] leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  if (message.type === 'question') {
    return (
      <div className={cn("flex justify-center", className)}>
        <div className="bg-card border border-border rounded-[18px] px-4 py-3 max-w-[85%]">
          <p className="text-[15px] leading-relaxed text-foreground">
            <strong>🤔 PERGUNTA:</strong> {message.content}
          </p>
        </div>
      </div>
    );
  }

  if (message.type === 'agent') {
    // Tentar encontrar agente na lista hardcoded primeiro
    const agent = message.agentId ? AGENTS.find((a) => a.id === message.agentId) : null;
    
    // Se não encontrou, usar dados do message diretamente (para agentes dinâmicos)
    const agentName = agent?.name || message.agentName || 'Agente';
    const agentDescription = agent?.description || message.agentDescription || '';
    // Priorizar avatar da mensagem, depois do agente encontrado, depois fallback
    const agentAvatar = message.agentAvatar || agent?.avatar || agentName?.charAt(0) || '👤';
    const agentColor = message.agentColor || agent?.color || '#8b5cf6';

    // Validar se temos conteúdo para exibir
    if (!message.content) {
      return null;
    }

    // Verificar se o avatar é uma imagem (URL ou base64 ou caminho relativo)
    const isImage = agentAvatar?.startsWith('data:image') || 
                    agentAvatar?.startsWith('http://') || 
                    agentAvatar?.startsWith('https://') ||
                    agentAvatar?.startsWith('/');
    
    // Verificar se a mensagem anterior é do mesmo agente
    const isSameAgentAsPrevious = previousMessage?.type === 'agent' && 
      previousMessage.agentId === message.agentId;
    
    // Se for agrupada e não for a primeira, ocultar avatar e nome
    const showAvatar = !isGrouped || isFirstInGroup;
    const showName = !isGrouped || isFirstInGroup;
    
    return (
      <div className={cn("flex gap-3", className, !showAvatar && "ml-[52px]")}>
        {showAvatar && (
          <Avatar className="w-10 h-10 flex-shrink-0">
            {isImage ? (
              <AvatarImage
                src={agentAvatar}
                alt={agentName}
                className="object-cover"
              />
            ) : null}
            <AvatarFallback
              className="text-lg"
              style={{ backgroundColor: `${agentColor}20`, color: agentColor }}
            >
              {isImage ? agentName?.charAt(0)?.toUpperCase() || '👤' : agentAvatar}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="flex-1 max-w-[85%]">
          {showName && (
            <div className="mb-1">
              <p className="text-sm font-bold text-foreground">{agentName}</p>
              {agentDescription && (
                <p className="text-xs text-muted-foreground">{agentDescription}</p>
              )}
            </div>
          )}
          <div className={cn(
            "bg-card rounded-[18px] px-4 py-4",
            !showName && "mt-1"
          )}>
            <p className="text-[15px] leading-relaxed text-foreground">
              {message.content}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

