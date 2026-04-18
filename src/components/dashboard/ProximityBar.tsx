'use client';

import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ProximityProps {
  current: number;
  last4hPrice?: number;
  target: number;
  currency: string;
  strategy: 'Zarar Kes' | 'Kar Al' | 'Dirençten Al' | 'Destekten Al';
}

export function ProximityBar({ current, last4hPrice, target, currency, strategy }: ProximityProps) {
  // Stratejiye göre dizilim kararı
  const isUpward = strategy === 'Kar Al' || strategy === 'Dirençten Al';
  
  // Hesaplamalarda 4 Saatlik kapanışı baz alıyoruz
  // Eğer 4s verisi yoksa veya tanımsızsa canlı fiyatı kullan
  const basePrice = (last4hPrice !== null && last4hPrice !== undefined) ? last4hPrice : current;
  const priceLabel = (last4hPrice !== null && last4hPrice !== undefined) ? '4S KAPANIŞ' : 'MEVCUT';

  // Sol ve Sağ etiketler
  const leftLabel = isUpward ? priceLabel : 'HEDEF';
  const rightLabel = isUpward ? 'HEDEF' : priceLabel;
  const leftValue = isUpward ? basePrice : target;
  const rightValue = isUpward ? target : basePrice;

  // Progres hesaplama (Sıcak Takip Modu: Son %20'lik Mesafe)
  const getProgress = () => {
    if (basePrice === 0) return 0;
    
    if (isUpward) {
      const startRange = target * 0.8;
      const totalMove = target * 0.2;
      return Math.min(Math.max(((basePrice - startRange) / totalMove) * 100, 0), 100);
    } else {
      const startRange = target * 1.2;
      const totalMove = target * 0.2;
      return Math.min(Math.max(((startRange - basePrice) / totalMove) * 100, 0), 100);
    }
  };

  const progress = getProgress();
  const diffPercent = ((basePrice - target) / target) * 100;
  const absDiffPercent = Math.abs(diffPercent).toFixed(1);

  return (
    <div className="mt-8 relative z-10">
      <div className="flex justify-between items-end mb-4 relative">
        <div className="flex flex-col">
          <span className="text-[8px] md:text-[10px] font-black text-zinc-600 tracking-[0.2em] mb-1">{leftLabel}</span>
          <span className={cn(
            "text-base md:text-xl font-mono font-black",
            isUpward ? "text-emerald-400" : "text-amber-500"
          )}>
            {currency}{leftValue.toLocaleString()}
          </span>
        </div>

        {/* Kalan Yüzde Badge (Ortada) */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-4 md:-top-2 scale-[0.8] md:scale-100">
          <div className="bg-zinc-800/80 border border-zinc-700 px-3 md:px-5 py-1 md:py-1.5 rounded-2xl flex items-center gap-2 md:gap-3 backdrop-blur-md shadow-xl">
            <span className="text-[8px] md:text-[10px] font-black text-zinc-400 tracking-tighter uppercase whitespace-nowrap">
              {basePrice >= target && isUpward ? 'HEDEF GEÇİLDİ' : 
               basePrice <= target && !isUpward ? 'HEDEFE GELDİ' : 'KALAN'}
            </span>
            <span className={cn(
              "text-xs md:text-sm font-mono font-black",
              basePrice >= target && isUpward ? "text-emerald-400" : "text-amber-500"
            )}>
               %{absDiffPercent}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[8px] md:text-[10px] font-black text-zinc-600 tracking-[0.2em] mb-1">{rightLabel}</span>
          <span className={cn(
             "text-base md:text-xl font-mono font-black",
             isUpward ? "text-amber-500" : "text-emerald-400"
          )}>
            {currency}{rightValue.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="h-4 w-full bg-zinc-800 rounded-full overflow-hidden border border-zinc-700/50 p-[3px] relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
        <motion.div
           initial={{ width: 0 }}
           animate={{ 
             width: `${progress}%`,
           }}
           className={cn(
             "absolute top-[3px] bottom-[3px] rounded-full",
             isUpward 
               ? "left-[3px] bg-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.5)]" 
               : "right-[3px] bg-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.5)]"
           )}
        />
      </div>
    </div>
  );
}
