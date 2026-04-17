'use client';

import { useAssetStore } from '@/store/useAssetStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const INDEX_CONFIG = [
  { symbol: 'XU100.IS', label: 'BIST 100' },
  { symbol: 'XU030.IS', label: 'BIST 30' },
  { symbol: '^GSPC', label: 'S&P 500' },
  { symbol: '^IXIC', label: 'NASDAQ' }
];

export function MarketPulse() {
  const { indices } = useAssetStore();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
      {INDEX_CONFIG.map((cfg) => {
        const data = indices[cfg.symbol];
        if (!data) return null;

        return (
          <div 
            key={cfg.symbol}
            className="bg-zinc-900/40 border border-white/5 p-4 rounded-2xl flex flex-col gap-1 hover:border-zinc-700 transition-all group"
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{cfg.label}</span>
              <span className={cn(
                "text-[10px] font-black px-1.5 py-0.5 rounded",
                data.change >= 0 ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"
              )}>
                {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-mono font-black text-zinc-100 group-hover:text-emerald-400 transition-colors">
                {data.price?.toLocaleString()}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
