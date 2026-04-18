'use client';

import { useState } from 'react';
import { useAssetStore } from '@/store/useAssetStore';
import { ProximityBar } from './ProximityBar';
import { AddAssetModal } from './AddAssetModal';
import { MarketPulse } from './MarketPulse';
import { LayoutGrid, List, Plus, Trash2, Briefcase, TrendingUp } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function AssetTable() {
  const { assets, removeAsset, triggerRefresh, lastUpdated, isUpdating } = useAssetStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);

  // Varlıkları hedefe yakınlığa göre sıralayalım
  const getProximity = (asset: any) => {
    const reference = asset.last4hPrice || asset.currentPrice || asset.entryPrice || 0;
    if (reference === 0 || asset.targetPrice === 0) return Infinity;
    return Math.abs((reference - asset.targetPrice) / asset.targetPrice);
  };

  const sortedAssets = [...assets].sort((a, b) => getProximity(a) - getProximity(b));

  const reachedAssets = sortedAssets.filter(asset => {
    if (asset.targetPrice === 0) return false;
    
    const referencePrice = asset.last4hPrice || asset.currentPrice || 0;
    if (referencePrice === 0) return false;

    // Akıllı Yön Belirleme: 
    // Eğer hedef fiyat, giriş fiyatından (veya mevcut fiyattan) yüksekse yukarıyı hedefliyoruzdur.
    const isUpward = asset.targetPrice > (asset.entryPrice || asset.currentPrice);
    
    if (isUpward) {
      return referencePrice >= asset.targetPrice;
    } else {
      return referencePrice <= asset.targetPrice;
    }
  });

  const myAssets = sortedAssets.filter(asset => asset.targetPrice === 0);
  const pendingAssets = sortedAssets.filter(asset => asset.targetPrice > 0 && !reachedAssets.find(r => r.id === asset.id));

  return (
    <div className="flex-1 p-4 md:p-6 flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <AddAssetModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingAsset(null);
        }} 
        isPortfolio={false} 
        editingAsset={editingAsset}
      />

      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center bg-zinc-900/40 p-4 md:p-6 rounded-[2rem] border border-white/5 backdrop-blur-xl shadow-2xl gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-6">
            <h1 className="text-2xl md:text-3xl font-black text-zinc-100 tracking-tighter italic leading-none">Hedef Takip</h1>
            
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
                {lastUpdated && <span className="hidden sm:inline text-xs font-black text-zinc-400 uppercase tracking-widest">SON GÜNCELLEME: {lastUpdated}</span>}
              </div>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-3 px-8 py-4 bg-white text-black rounded-2xl font-black text-xs md:text-sm transition-all hover:scale-[1.05] active:scale-95 group uppercase tracking-widest"
        >
          <Plus size={18} />
          TAKİP LİSTESİNE EKLE
        </button>
      </div>

      <MarketPulse />

      {reachedAssets.length > 0 && (
        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-4 px-4">
            <h2 className="text-xs font-black text-emerald-400 uppercase tracking-[0.4em] flex items-center gap-3 bg-emerald-400/5 px-6 py-2 rounded-full border border-emerald-400/20">
              HEDEFE ULAŞANLAR
            </h2>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            {reachedAssets.map((asset) => (
              <AssetCard 
                key={asset.id} 
                asset={asset} 
                removeAsset={removeAsset} 
                isReached 
                onEdit={() => {
                  setEditingAsset(asset);
                  setIsModalOpen(true);
                }}
              />
            ))}
          </div>
        </section>
      )}

      {myAssets.length > 0 && (
        <section className="flex flex-col gap-4 px-4">
          <div className="flex flex-wrap gap-3">
            {myAssets.map((asset) => (
              <button 
                key={asset.id} 
                onClick={() => {
                  setEditingAsset(asset);
                  setIsModalOpen(true);
                }}
                className="px-4 py-2.5 bg-zinc-900/60 border border-white/5 rounded-2xl hover:border-amber-500/40 hover:bg-amber-500/5 transition-all flex items-center gap-2 shadow-xl group"
              >
                <Plus size={12} className="text-amber-500/50 group-hover:text-amber-500 transition-colors" />
                <span className="text-xs font-black text-zinc-400 group-hover:text-zinc-100 uppercase tracking-tighter italic">
                  {asset.symbol.replace('.IS', '').replace('-USD', '')}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-6">
        {assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/40 border border-dashed border-zinc-800 rounded-[3rem] gap-6 text-center">
            <div className="w-20 h-20 bg-zinc-950 rounded-full flex items-center justify-center border border-white/5">
              <Briefcase size={32} className="text-zinc-500" />
            </div>
            <div className="max-w-xs">
              <h3 className="text-xl font-black text-zinc-100 italic tracking-tighter mb-2 uppercase">Takip Listesi Boş</h3>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-tight leading-relaxed">
                Portföyündeki varlıkları otomatik olarak buraya aktarıp kar-zarar hedefleri koymaya başlayabilirsin.
              </p>
            </div>
            <button 
              onClick={() => {
                const { syncPortfolioToAssets } = useAssetStore.getState();
                syncPortfolioToAssets();
              }}
              className="px-8 py-4 bg-amber-500 text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(245,158,11,0.2)]"
            >
              PORTFÖYDEN AKTAR
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            {pendingAssets.map((asset) => (
              <AssetCard 
                key={asset.id} 
                asset={asset} 
                removeAsset={removeAsset} 
                onEdit={() => {
                  setEditingAsset(asset);
                  setIsModalOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


function AssetCard({ asset, removeAsset, onEdit, isReached = false }: any) {
  const { portfolioHoldings } = useAssetStore();
  const reference = asset.last4hPrice || asset.currentPrice || asset.entryPrice || 0;
  
  // Portföyde mi kontrolü (Sembol veya suffixsiz haliyle)
  const isInPortfolio = portfolioHoldings.some(h => 
    h.symbol === asset.symbol || 
    h.symbol.replace('.IS', '') === asset.symbol.replace('.IS', '')
  );

  const proximity = reference === 0 || asset.targetPrice === 0 ? Infinity : Math.abs((reference - asset.targetPrice) / asset.targetPrice);
  const isCritical = !isReached && proximity < 0.01;
  const isLossStrat = asset.strategy === 'Zarar Kes';

  return (
    <div 
      className={cn(
        "bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2.5rem] hover:border-zinc-500 transition-all group relative overflow-hidden pointer-events-none",
        isReached && "border-emerald-500/40 bg-emerald-500/[0.03]",
        isCritical && "border-red-500/60 animate-pulse duration-[2000ms]"
      )}
    >
      <div className="absolute top-6 right-6 flex items-center gap-2 z-[100] pointer-events-auto opacity-40 group-hover:opacity-100 transition-all">
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit();
          }}
          className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-all border border-white/5 backdrop-blur-md cursor-pointer"
        >
          <TrendingUp size={16} className="rotate-45" />
        </button>
        <button 
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await removeAsset(asset.id);
          }}
          className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/20 rounded-full transition-all border border-white/5 backdrop-blur-md cursor-pointer"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="relative z-10"> {/* İçerik katmanı */}
        <div className="flex flex-col sm:flex-row justify-between items-start mb-8 pr-12 gap-6">
        <div>
          <div className="flex gap-2 mb-4">
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-800 px-3 py-1.5 rounded-lg border border-white/5">{asset.type}</span>
            <span className={cn("text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border", isLossStrat ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30")}>{asset.strategy}</span>
          </div>
          <div className="flex items-center gap-3">
            <h3 className="text-3xl font-black text-zinc-100 tracking-tighter uppercase italic">
              {asset.symbol.replace('.IS', '').replace('-USD', '')}
            </h3>
            {isInPortfolio && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 animate-pulse-slow">
                <Briefcase size={10} strokeWidth={3} />
                <span className="text-[9px] font-black uppercase tracking-widest">Portföy</span>
              </div>
            )}
          </div>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-tight mt-1">{asset.name}</p>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-mono font-black text-zinc-100">{asset.currency}{asset.currentPrice?.toLocaleString()}</div>
          <div className={cn("text-sm font-mono font-black", asset.dailyChange >= 0 ? "text-emerald-400" : "text-red-400")}>
            {asset.dailyChange >= 0 ? "+" : ""}{asset.dailyChange?.toFixed(2)}%
          </div>
        </div>
      </div>

      {!isReached && (
        <ProximityBar current={asset.currentPrice || asset.entryPrice} last4hPrice={asset.last4hPrice} target={asset.targetPrice} currency={asset.currency} strategy={asset.strategy} />
      )}
      
      {isReached && <div className="mt-4 text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] animate-bounce">🚀 Hedef Fiyat Görüldü: {asset.currency}{asset.targetPrice.toLocaleString()}</div>}
      </div>
    </div>
  );
}
