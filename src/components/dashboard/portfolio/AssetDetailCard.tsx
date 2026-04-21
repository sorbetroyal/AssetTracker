'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface AssetDetailCardProps {
  asset: any;
  rates: { USD: number };
  onRemove: (id: string) => void;
  isAlternate?: boolean;
  groupRatio?: number;
}

export const AssetDetailCard: React.FC<AssetDetailCardProps> = ({ asset, rates, onRemove, isAlternate, groupRatio }) => {
  const isUSD = asset.currency.includes('$') || asset.currency.toUpperCase() === 'USD';

  return (
    <div key={asset.id} className={`${isAlternate ? 'bg-zinc-900/50' : 'bg-zinc-950'} border border-zinc-900 rounded-[2rem] p-5 transition-all duration-500 hover:border-zinc-700 group relative`}>
      <div className="flex flex-col gap-4">
        
        {/* ROW 1: VARLIK ADI, ORAN, ADET, SILME */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">
              {asset.symbol.replace('.IS', '')}
            </span>
            {groupRatio !== undefined && (
              <span className="text-sm font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/10">
                %{groupRatio.toFixed(1)}
              </span>
            )}
            <span className="text-sm font-black text-zinc-500 tracking-tighter">
              {asset.amount.toLocaleString('tr-TR')}
            </span>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onRemove(asset.id);
            }}
            className="w-10 h-10 flex items-center justify-center bg-zinc-900/50 hover:bg-rose-500/10 text-zinc-700 hover:text-rose-500 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* ROW 2 & 3: KAR ZARAR SATIRLARI */}
        <div className="space-y-1">
          {/* GUNLUK */}
          <div className="flex items-center gap-2">
            <span className={`text-xl font-black tracking-tighter ${asset.dailyGain >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {isUSD 
                ? `₺${(asset.dailyGain * rates.USD).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                : formatCurrency(asset.dailyGain, asset.currency)}
            </span>
            <span className={`text-sm font-black px-1.5 py-0.5 rounded ${asset.dailyGain >= 0 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
              %{asset.dailyGainPercent?.toFixed(1)}%
            </span>
          </div>

          {/* TOPLAM */}
          <div className="flex items-center gap-2">
            <span className={`text-xl font-black tracking-tighter ${asset.totalGain >= 0 ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
              {isUSD 
                ? `₺${(asset.totalGain * rates.USD).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                : formatCurrency(asset.totalGain, asset.currency)}
            </span>
            <span className={`text-sm font-black px-1.5 py-0.5 rounded ${asset.totalGain >= 0 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
              %{asset.totalGainPercent?.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* ROW 4: TOPLAM DEĞER */}
        <div className="pt-3 border-t border-zinc-900 flex items-baseline gap-3">
          <span className="text-3xl font-black text-white tracking-tighter leading-none">
            {isUSD 
              ? `₺${(asset.currentValue * rates.USD).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
              : formatCurrency(asset.currentValue, asset.currency)}
          </span>
          {isUSD && (
            <span className="text-lg font-black text-emerald-500/50">
              {formatCurrency(asset.currentValue, asset.currency)}
            </span>
          )}
        </div>

      </div>
    </div>
  );
};
