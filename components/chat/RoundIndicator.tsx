'use client';

interface RoundIndicatorProps {
  roundNumber: number;
}

export function RoundIndicator({ roundNumber }: RoundIndicatorProps) {
  return (
    <div className="flex justify-center my-5">
      <div className="bg-white/5 rounded-full px-4 py-2">
        <p className="text-xs text-muted-foreground">
          --- RODADA {roundNumber} ---
        </p>
      </div>
    </div>
  );
}

