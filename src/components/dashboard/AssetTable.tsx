'use client';

import { useState } from 'react';
import { useAssetStore } from '@/store/useAssetStore';
import { ProximityBar } from './ProximityBar';
import { AddAssetModal } from './AddAssetModal';
import { MarketPulse } from './MarketPulse';
import { LayoutGrid, List, Plus, Trash2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function AssetTable() {
  const { assets, removeAsset, triggerRefresh, lastUpdated, isUpdating } = useAssetStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Varlıkları hedefe yakınlığa göre sıralayalım (4S Kapanışını önceliklendirerek)
  const getProximity = (asset: any) => {
    const reference = asset.last4hPrice || asset.currentPrice || asset.entryPrice || 0;
    if (reference === 0 || asset.targetPrice === 0) return Infinity;
    return Math.abs((reference - asset.targetPrice) / asset.targetPrice);
  };

  const sortedAssets = [...assets].sort((a, b) => getProximity(a) - getProximity(b));

  // Varlıkları iki gruba ayıralım: Hedefe Ulaşanlar ve Bekleyenler
  const reachedAssets = sortedAssets.filter(asset => {
    const isUpward = asset.strategy === 'Kar Al' || asset.strategy === 'Dirençten Al';
    const referencePrice = asset.last4hPrice || 0;
    
    if (referencePrice === 0) return false;
    
    return isUpward ? referencePrice >= asset.targetPrice : referencePrice <= asset.targetPrice;
  });

  const pendingAssets = sortedAssets.filter(asset => !reachedAssets.find(r => r.id === asset.id));

  return (
    <div className="flex-1 p-4 md:p-6 flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <AddAssetModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center bg-zinc-900/40 p-4 md:p-6 rounded-[2rem] border border-white/5 backdrop-blur-xl shadow-2xl gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-6">
            <h1 className="text-2xl md:text-3xl font-black text-zinc-100 tracking-tighter italic leading-none text-center sm:text-left">Hedef Takip</h1>
            
            <div className="flex flex-col items-center sm:items-start gap-1">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => triggerRefresh()}
                  disabled={isUpdating}
                  className={cn(
                    "px-3 py-1.5 md:px-4 md:py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-[10px] md:text-sm font-black text-zinc-300 hover:text-white transition-all uppercase tracking-widest flex items-center gap-2 active:scale-95 shadow-lg",
                    isUpdating && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <svg className={cn("w-3 h-3 md:w-4 md:h-4", isUpdating && "animate-spin")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {isUpdating ? 'GÜNCELLENİYOR...' : 'GÜNCELLE'}
                </button>
                {lastUpdated && (
                  <span className="hidden sm:inline text-xs font-black text-zinc-400 uppercase tracking-widest">
                    SON GÜNCELLEME: {lastUpdated}
                  </span>
                )}
              </div>
              {lastUpdated && (
                <span className="sm:hidden text-[9px] font-black text-zinc-500 uppercase tracking-widest text-center">
                  SON GÜNCELLEME: {lastUpdated}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-4 items-center justify-center w-full md:w-auto">
          {assets.length > 0 && (
            <div className="hidden lg:flex flex-col items-end mr-6 pr-6 border-r border-zinc-800">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Portföy Günlük</span>
              <div className={cn(
                "text-2xl font-black tracking-tighter",
                (assets.reduce((acc, a) => acc + (a.dailyChange || 0), 0) / assets.length) >= 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {(assets.reduce((acc, a) => acc + (a.dailyChange || 0), 0) / assets.length).toFixed(2)}%
              </div>
            </div>
          )}
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[1.2rem] font-black text-xs md:text-sm transition-all shadow-xl shadow-emerald-500/20 active:scale-95 group"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            YENİ EKLE
          </button>
        </div>
      </div>

      <MarketPulse />

      {/* Hedefe Ulaşanlar Bölümü */}
      {reachedAssets.length > 0 && (
        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-4 px-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
            <h2 className="text-xs font-black text-emerald-400 uppercase tracking-[0.4em] flex items-center gap-3 bg-emerald-400/5 px-6 py-2 rounded-full border border-emerald-400/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              HEDEFE ULAŞANLAR
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            {reachedAssets.map((asset) => (
              <AssetCard key={asset.id} asset={asset} removeAsset={removeAsset} isReached />
            ))}
          </div>
        </section>
      )}

      {/* Takip Listesi */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center gap-4 px-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-500/10 to-transparent" />
          <h2 className="text-xs font-black text-zinc-500 uppercase tracking-[0.4em] bg-zinc-900 px-6 py-2 rounded-full border border-zinc-800">
            TAKİP LİSTESİ ({pendingAssets.length})
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-500/10 to-transparent" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 opacity-90 transition-opacity">
          {pendingAssets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} removeAsset={removeAsset} />
          ))}
        </div>
      </section>
    </div>
  );
}

// Yardımcı Kart Bileşeni
function AssetCard({ asset, removeAsset, isReached = false }: any) {
  const reference = asset.last4hPrice || asset.currentPrice || asset.entryPrice || 0;
  const proximity = reference === 0 || asset.targetPrice === 0 ? Infinity : Math.abs((reference - asset.targetPrice) / asset.targetPrice);
  const isCritical = !isReached && proximity < 0.01; // %1'den yakın
  const isLossStrat = asset.strategy === 'Zarar Kes';

  return (
    <div 
      className={cn(
        "bg-zinc-900/50 border border-zinc-800 p-5 md:p-10 rounded-[1.5rem] md:rounded-[2.5rem] hover:border-zinc-500 transition-all group relative overflow-hidden shadow-2xl",
        isReached && "border-emerald-500/40 bg-emerald-500/[0.03] animate-pulse-subtle",
        isCritical && isLossStrat && "border-red-500/60 shadow-[0_0_50px_rgba(239,68,68,0.25)] animate-pulse duration-[2000ms] ring-1 ring-red-500/20",
        isCritical && !isLossStrat && "border-emerald-500/60 shadow-[0_0_50px_rgba(16,185,129,0.25)] animate-pulse duration-[2000ms] ring-1 ring-emerald-500/20"
      )}
    >
      {isReached && (
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-transparent to-emerald-500/10 animate-pulse duration-[3000ms] pointer-events-none" />
      )}
      
      {isCritical && !isReached && (
        <div className={cn(
          "absolute inset-0 opacity-10 pointer-events-none",
          isLossStrat ? "bg-gradient-to-tr from-red-500 via-transparent to-red-500" : "bg-gradient-to-tr from-emerald-500 via-transparent to-emerald-500"
        )} />
      )}

      {/* Glossy Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Delete Button */}
      <button 
        onClick={() => removeAsset(asset.id)}
        className="absolute top-4 right-4 md:top-6 md:right-6 p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all opacity-100 md:opacity-0 group-hover:opacity-100 backdrop-blur-md border border-white/5 z-20"
        title="Varlığı Sil"
      >
        <Trash2 size={18} />
      </button>

      <div className="flex flex-col sm:flex-row justify-between items-start mb-6 md:mb-10 pr-10 md:pr-12 relative z-10 gap-6">
        <div>
          <div className="flex flex-wrap gap-2 mb-3 md:mb-4 items-center">
            <span className="text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-800 px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-white/5">
              {asset.type}
            </span>
            <span className={cn(
               "text-[9px] md:text-[10px] font-black uppercase tracking-widest px-2 md:px-3 py-1 md:py-1.5 rounded-lg border",
               asset.strategy === 'Zarar Kes' ? "bg-red-500/20 text-red-400 border-red-500/30" :
               asset.strategy === 'Dirençten Al' ? "bg-purple-500/20 text-purple-400 border-purple-500/30" :
               asset.strategy === 'Destekten Al' ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
               "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
            )}>
              {asset.strategy}
            </span>
            {isCritical && !isReached && (
              <span className={cn(
                "text-[8px] md:text-[9px] font-[1000] px-2 py-1 md:px-3 md:py-1.5 rounded-lg animate-pulse tracking-tighter ring-1",
                isLossStrat ? "bg-red-500/40 text-white ring-red-400/50" : "bg-emerald-500/40 text-black ring-emerald-400/50"
              )}>
                ⚠️ KRİTİK
              </span>
            )}
            {isReached && (
              <span className="bg-gradient-to-r from-emerald-500 to-emerald-400 text-black text-[9px] md:text-[11px] font-[1000] px-3 md:px-4 py-1 md:py-1.5 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.7)] animate-bounce tracking-tighter ring-2 ring-emerald-300/20">
                🚀 HEDEF!
              </span>
            )}
          </div>
          <h3 className="text-2xl md:text-4xl font-black text-zinc-100 group-hover:text-zinc-50 transition-all tracking-tighter uppercase italic">
            {asset.symbol === 'GC=F' ? 'ALTIN' : 
             asset.symbol === 'SI=F' ? 'GÜMÜŞ' : 
             asset.symbol.replace('.IS', '').replace('-USD', '')}
          </h3>
          <p className="text-xs md:text-sm text-zinc-500 font-bold uppercase tracking-tight mt-1 truncate max-w-[200px] md:max-w-[300px]">
            {asset.name}
          </p>
        </div>
        
        <div className="text-left sm:text-right flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-3 bg-zinc-800/20 p-2 md:p-3 rounded-xl md:rounded-[1.5rem] border border-white/5 shadow-inner w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-lg md:text-2xl font-mono font-black text-zinc-100">
              {asset.currency}{asset.currentPrice?.toLocaleString()}
            </span>
            {asset.dailyChange !== undefined && (
              <span className={cn(
                "text-xs md:text-lg font-mono font-black px-2 py-1 rounded-lg md:rounded-xl flex items-center gap-1",
                asset.dailyChange >= 0 ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"
              )}>
                {asset.dailyChange >= 0 ? "+" : "-"}{Math.abs(asset.dailyChange).toFixed(2)}%
              </span>
            )}
          </div>
          {(isReached || isCritical) && (
             <div className="flex flex-col items-start sm:items-end px-1 md:px-2 opacity-90">
                <span className="text-[10px] md:text-xs font-black text-zinc-500 uppercase tracking-widest mb-0.5">
                  {isReached ? 'HEDEFLENEN' : 'KRİTİK HEDEF'}
                </span>
                <span className={cn(
                  "text-lg md:text-xl font-mono font-black tracking-tighter",
                  isLossStrat ? "text-red-400" : "text-emerald-400"
                )}>
                   {asset.currency}{asset.targetPrice.toLocaleString()}
                </span>
             </div>
          )}
        </div>
      </div>

      {!isReached && (
        <ProximityBar 
          current={asset.currentPrice || asset.entryPrice}
          last4hPrice={asset.last4hPrice}
          target={asset.targetPrice}
          currency={asset.currency}
          strategy={asset.strategy}
        />
      )}
    </div>
  );
}
