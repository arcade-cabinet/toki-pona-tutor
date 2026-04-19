import { Heart } from 'lucide-react';

interface HeartDisplayProps {
  hearts: number;
  max: number;
}

export function HeartDisplay({ hearts, max }: HeartDisplayProps) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => {
        const alive = i < hearts;
        return (
          <Heart
            key={i}
            size={20}
            strokeWidth={2.5}
            className={`transition-all duration-300 ${
              alive
                ? 'text-red-500 fill-red-500 drop-shadow-sm'
                : 'text-slate-300 fill-slate-200 scale-90'
            }`}
          />
        );
      })}
    </div>
  );
}
