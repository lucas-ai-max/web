'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Agent } from '@/lib/types';
import { cn } from '@/lib/utils';

interface AgentItemProps {
  agent: Agent;
  selected: boolean;
  onToggle: () => void;
}

export function AgentItem({ agent, selected, onToggle }: AgentItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
        "hover:bg-white/5",
        selected && "bg-white/10"
      )}
      onClick={onToggle}
    >
      <Checkbox
        checked={selected}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-primary"
      />
      <Avatar className="w-8 h-8">
        {(agent.avatar?.startsWith('data:image') || agent.avatar?.startsWith('http')) ? (
          <AvatarImage
            src={agent.avatar}
            alt={agent.name}
            className="object-cover"
          />
        ) : null}
        <AvatarFallback
          className="text-lg"
          style={{ backgroundColor: `${agent.color}20`, color: agent.color }}
        >
          {(agent.avatar?.startsWith('data:image') || agent.avatar?.startsWith('http')) 
            ? agent.name?.charAt(0)?.toUpperCase() || '👤' 
            : agent.avatar}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{agent.name}</p>
          <Badge variant="secondary" className="text-xs bg-gray-700">
            Em destaque
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">{agent.description || agent.role || ''}</p>
      </div>
    </div>
  );
}

