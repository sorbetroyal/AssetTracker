'use client';

import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/formatters';

interface PortfolioStatsProps {
  totalBalance: number;
  dailyGain: number;
  dailyGainPercent: number;
  totalGain: number;
  totalGainPercent: number;
}

export const PortfolioStats: React.FC<PortfolioStatsProps> = ({
  totalBalance,
  dailyGain,
  dailyGainPercent,
  totalGain,
  totalGainPercent
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden group hover:border-zinc-700 transition-all duration-300">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <Wallet size={80} />
        </div>
        <div className="relative z-10">
          <div className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 font-mono">Toplam Varlık</div>
          <div className="text-3xl font-black text-white tracking-tighter">
            {formatCurrency(totalBalance)}
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden group hover:border-zinc-700 transition-all duration-300">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <TrendingUp size={80} />
        </div>
        <div className="relative z-10">
          <div className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 font-mono">Günlük Kazanç</div>
          <div className={`text-3xl font-black tracking-tighter ${dailyGain >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {dailyGain >= 0 ? '+' : ''}{formatCurrency(dailyGain)}
          </div>
          <div className={`text-sm font-bold mt-1 ${dailyGain >= 0 ? 'text-emerald-500/60' : 'text-rose-500/60'}`}>
            {dailyGainPercent >= 0 ? '+' : ''}{formatPercent(dailyGainPercent)}
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden group hover:border-zinc-700 transition-all duration-300">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <DollarSign size={80} />
        </div>
        <div className="relative z-10">
          <div className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 font-mono">Toplam Kazanç</div>
          <div className={`text-3xl font-black tracking-tighter ${totalGain >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain)}
          </div>
          <div className={`text-sm font-bold mt-1 ${totalGain >= 0 ? 'text-emerald-500/60' : 'text-rose-500/60'}`}>
            {totalGainPercent >= 0 ? '+' : ''}{formatPercent(totalGainPercent)}
          </div>
        </div>
      </div>
    </div>
  );
};
