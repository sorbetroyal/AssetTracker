import { useState } from 'react';
import { useAssetStore } from '@/store/useAssetStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Check, X } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const INDEX_CONFIG = [
  { symbol: 'XU100.IS', label: 'BIST 100', currency: '₺' },
  { symbol: 'XU030.IS', label: 'BIST 30', currency: '₺' },
  { symbol: 'USDTRY=X', label: 'DOLAR/TL', currency: '₺' },
  { symbol: '^GSPC', label: 'S&P 500', currency: '$' },
  { symbol: '^IXIC', label: 'NASDAQ', currency: '$' }
];

export function MarketPulse() {
  const { indices, indexTargets, updateIndexTarget } = useAssetStore();
  const [editingSymbol, setEditingSymbol] = useState<string | null>(null);
  const [tempTarget, setTempTarget] = useState('');
  const [tempStrategy, setTempStrategy] = useState('Kar Al');

  const handleSave = (symbol: string) => {
    updateIndexTarget(symbol, Number(tempTarget), tempStrategy);
    setEditingSymbol(null);
  };

  const startEditing = (symbol: string) => {
    const current = indexTargets[symbol];
    setEditingSymbol(symbol);
    setTempTarget(current?.targetPrice.toString() || '');
    setTempStrategy(current?.strategy || 'Kar Al');
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
      {INDEX_CONFIG.map((cfg) => {
        const data = indices[cfg.symbol];
        const targetData = indexTargets[cfg.symbol];
        if (!data) return null;

        const hasTarget = targetData && targetData.targetPrice > 0;
        
        // Mini Progress Calculation
        let progress = 0;
        if (hasTarget) {
          const isUpward = targetData.strategy === 'Kar Al';
          const target = targetData.targetPrice;
          const current = data.price;
          if (isUpward) {
            const startRange = target * 0.8;
            progress = Math.min(Math.max(((current - startRange) / (target * 0.2)) * 100, 0), 100);
          } else {
            const startRange = target * 1.2;
            progress = Math.min(Math.max(((startRange - current) / (target * 0.2)) * 100, 0), 100);
          }
        }

        return (
          <div 
            key={cfg.symbol}
            className={cn(
              "bg-zinc-900/40 border border-white/5 p-3 md:p-4 rounded-2xl flex flex-col gap-2 hover:border-zinc-500 transition-all group relative overflow-hidden",
              editingSymbol === cfg.symbol && "ring-2 ring-emerald-500/50 border-emerald-500/50 bg-zinc-900"
            )}
          >
            <div className="flex justify-between items-center relative z-10">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{cfg.label}</span>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[10px] md:text-lg font-mono font-black px-2 md:px-3 py-1 rounded-xl tracking-tighter",
                  data.change >= 0 ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"
                )}>
                  {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)}%
                </span>
                <button 
                  onClick={() => startEditing(cfg.symbol)}
                  className="p-1 hover:bg-white/10 rounded-md text-zinc-600 hover:text-emerald-400 transition-colors"
                >
                  <Target size={12} />
                </button>
              </div>
            </div>

            <div className="flex justify-between items-baseline relative z-10">
              <span className="text-base md:text-xl font-mono font-black text-zinc-100">
                {cfg.currency}{data.price?.toLocaleString()}
              </span>
              {hasTarget && (
                <span className="text-[10px] font-black text-amber-500 tracking-tighter">
                  HEDEF: {cfg.currency}{targetData.targetPrice.toLocaleString()}
                </span>
              )}
            </div>

            {/* Editing UI */}
            <AnimatePresence>
              {editingSymbol === cfg.symbol && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute inset-0 bg-zinc-950/95 z-20 p-3 flex flex-col gap-2 justify-center"
                >
                  <div className="flex gap-1">
                    <input 
                      autoFocus
                      type="number"
                      value={tempTarget}
                      onChange={(e) => setTempTarget(e.target.value)}
                      placeholder="Hedef Fiyat"
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white w-full outline-none focus:border-emerald-500"
                    />
                    <select 
                      value={tempStrategy}
                      onChange={(e) => setTempStrategy(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-[10px] text-zinc-400 outline-none"
                    >
                      <option>Kar Al</option>
                      <option>Zarar Kes</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleSave(cfg.symbol)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-1 rounded-lg text-[10px] font-black flex items-center justify-center gap-1"
                    >
                      <Check size={12} /> KAYDET
                    </button>
                    <button 
                      onClick={() => setEditingSymbol(null)}
                      className="p-1 px-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg text-[10px] font-black"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mini Progress Bar */}
            {hasTarget && (
              <div className="h-1 w-full bg-zinc-800 rounded-full mt-1 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className={cn(
                    "h-full rounded-full",
                    targetData.strategy === 'Kar Al' ? "bg-emerald-500" : "bg-amber-500"
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
