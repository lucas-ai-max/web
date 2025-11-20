'use client';

import { cn } from '@/lib/utils';

interface SynthesisBubbleProps {
  content: string;
  className?: string;
}

export function SynthesisBubble({ content, className }: SynthesisBubbleProps) {
  return (
    <div className={cn("my-8 p-6 bg-gradient-to-r from-primary/20 to-primary/10 border-2 border-primary/30 rounded-2xl fade-in-up", className)}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">📊</span>
        <h3 className="text-lg font-bold text-foreground">Síntese Final do Debate</h3>
      </div>
      <div className="prose prose-invert max-w-none">
        <p className="text-foreground leading-relaxed whitespace-pre-line">
          {content}
        </p>
      </div>
    </div>
  );
}

