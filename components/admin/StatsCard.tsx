'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

const colorClasses = {
  blue: {
    card: 'bg-blue-500/10 border-blue-500/20 hover:border-blue-500/50',
    icon: 'bg-blue-500/20 text-blue-500',
  },
  green: {
    card: 'bg-green-500/10 border-green-500/20 hover:border-green-500/50',
    icon: 'bg-green-500/20 text-green-500',
  },
  purple: {
    card: 'bg-purple-500/10 border-purple-500/20 hover:border-purple-500/50',
    icon: 'bg-purple-500/20 text-purple-500',
  },
  orange: {
    card: 'bg-orange-500/10 border-orange-500/20 hover:border-orange-500/50',
    icon: 'bg-orange-500/20 text-orange-500',
  },
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  change,
  color = 'blue',
}: StatsCardProps) {
  const colorClass = colorClasses[color];

  return (
    <div
      className={cn(
        'p-6 rounded-xl border transition-all duration-200 hover:scale-[1.02] hover:shadow-xl',
        colorClass.card
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className={cn(
            'w-12 h-12 rounded-lg flex items-center justify-center',
            colorClass.icon
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-3xl font-bold mb-1">{value}</p>
        {change && (
          <p className="text-xs text-muted-foreground">{change}</p>
        )}
      </div>
    </div>
  );
}

