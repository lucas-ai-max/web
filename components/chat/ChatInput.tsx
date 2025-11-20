'use client';

import { useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Send, Mic } from 'lucide-react';
import { useStore } from '@/lib/store';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const { selectedAgents } = useStore();

  const handleSend = () => {
    if (input.trim() && !disabled && selectedAgents.length >= 2) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-6 border-t border-border">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 bg-card rounded-full border border-border px-5 h-14">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua pergunta para os bilionários..."
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground"
            disabled={disabled || selectedAgents.length < 2}
          />
          {input.trim() ? (
            <Button
              onClick={handleSend}
              disabled={disabled || selectedAgents.length < 2}
              size="icon"
              className="h-8 w-8 bg-primary hover:bg-primary/90"
            >
              <Send className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Mic className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

