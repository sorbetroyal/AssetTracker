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
    <div key={asset.id} className={`group ${isAlternate ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-950 border-zinc-900'} border rounded-[2rem] p-6 relative overflow-hidden transition-all duration-500 hover:border-zinc-500`}>
      <div className="relative z-10 flex flex-col gap-5">
        
        {/* HEADER: ISIM, ORAN & ADET */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <span className="text-xl font-black text-white italic uppercase tracking-tighter">
              {asset.symbol.replace('.IS', '')}
            </span>
            <div className="flex items-center gap-3">
              {groupRatio !== undefined && (
                <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  %{groupRatio.toFixed(1)}
                </span>
              )}
              <span className="text-sm font-black text-zinc-500 tracking-tighter">
                {asset.amount.toLocaleString('tr-TR')}
              </span>
            </div>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onRemove(asset.id);
            }}
            className="p-2.5 bg-zinc-800/40 hover:bg-rose-500/20 text-zinc-600 hover:text-rose-500 rounded-xl transition-all duration-300"
            title="Varlığı Sil"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* MID: KAZANÇLAR (GÜNLÜK & TOPLAM) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2 flex-nowrap whitespace-nowrap">
              <span className={`text-xl font-black tracking-tighter ${asset.dailyGain >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {asset.dailyGain >= 0 ? '+' : ''}{formatCurrency(asset.dailyGain, asset.currency)}
              </span>
              <span className={`text-sm font-black ${asset.dailyGain >= 0 ? 'text-emerald-500/60' : 'text-rose-500/60'}`}>
                ({asset.dailyGainPercent >= 0 ? '+' : ''}{asset.dailyGainPercent?.toFixed(1)}%)
              </span>
            </div>
            {isUSD && (
              <span className={`text-[10px] font-bold mt-0.5 ${asset.dailyGain >= 0 ? 'text-emerald-500/30' : 'text-rose-500/30'} whitespace-nowrap`}>
                ₺{(asset.dailyGain * rates.USD).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            )}
          </div>
          <div className="flex flex-col text-right items-end">
            <div className="flex items-baseline justify-end gap-2 flex-nowrap whitespace-nowrap">
              <span className={`text-sm font-black ${asset.totalGain >= 0 ? 'text-emerald-500/60' : 'text-rose-500/60'}`}>
                ({asset.totalGainPercent >= 0 ? '+' : ''}{asset.totalGainPercent?.toFixed(1)}%)
              </span>
              <span className={`text-xl font-black tracking-tighter ${asset.totalGain >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {asset.totalGain >= 0 ? '+' : ''}{formatCurrency(asset.totalGain, asset.currency)}
              </span>
            </div>
            {isUSD && (
              <span className={`text-[10px] font-bold mt-0.5 ${asset.totalGain >= 0 ? 'text-emerald-500/30' : 'text-rose-500/30'} whitespace-nowrap`}>
                ₺{(asset.totalGain * rates.USD).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            )}
          </div>
        </div>

        {/* BOTTOM: TOPLAM DEĞER (TL ÖNCELİKLİ) */}
        <div className="pt-4 border-t border-zinc-800/50 flex flex-col">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-white tracking-tighter leading-none">
              {isUSD 
                ? `₺${(asset.currentValue * rates.USD).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                : formatCurrency(asset.currentValue, asset.currency)}
            </span>
            {isUSD && (
              <span className="text-lg font-black text-emerald-500/60">
                {formatCurrency(asset.currentValue, asset.currency)}
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
