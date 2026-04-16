'use client';

import { useAssetStore } from '@/store/useAssetStore';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function HeaderIndexBar() {
  const { indices } = useAssetStore();

  return (
    <div className="w-full bg-zinc-950 border-b border-zinc-800 h-10 flex items-center overflow-hidden px-4 gap-8">
      <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap border-r border-zinc-800 pr-4">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        Live Markets
      </div>
      
      <div className="flex gap-8 overflow-x-auto no-scrollbar py-1">
        {Object.entries(indices).map(([name, value]) => (
          <motion.div 
            key={name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <span className="text-zinc-400 font-medium text-xs">{name}</span>
            <span className="text-zinc-100 font-mono text-xs">{value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            {Math.random() > 0.5 ? (
              <TrendingUp size={12} className="text-emerald-500" />
            ) : (
              <TrendingDown size={12} className="text-red-500" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
