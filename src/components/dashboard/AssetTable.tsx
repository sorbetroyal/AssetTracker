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
  const { assets, removeAsset } = useAssetStore();
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
    const isUpward = asset.targetPrice > (asset.entryPrice || asset.currentPrice || 0);
    
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

      <section className="flex flex-col gap-4 px-4">
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => {
              setEditingAsset(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 bg-blue-500/5 hover:bg-blue-500/15 border border-blue-500/30 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-2xl transition-all flex items-center gap-2 active:scale-95 group"
          >
            <Plus size={12} strokeWidth={3} className="text-blue-500 group-hover:text-blue-400 transition-colors" />
            <span className="text-xs font-black uppercase tracking-widest group-hover:text-blue-400 transition-colors">Ekle</span>
          </button>
          
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
        "bg-zinc-900/50 border border-zinc-800 p-4 md:p-8 rounded-[2.5rem] hover:border-zinc-500 transition-all group relative overflow-hidden pointer-events-none",
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
        <div className="flex flex-col sm:flex-row justify-between items-start mb-6 md:mb-8 md:pr-12 gap-4 md:gap-6">
        <div>
          <div className="flex gap-2 mb-3 md:mb-4">
            <span className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-800 px-2.5 py-1 md:py-1.5 rounded-lg border border-white/5">{asset.type}</span>
            <span className={cn("text-[8px] md:text-[9px] font-black uppercase tracking-widest px-2.5 py-1 md:py-1.5 rounded-lg border", isLossStrat ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30")}>{asset.strategy}</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <h3 className="text-xl md:text-3xl font-black text-zinc-100 tracking-tighter uppercase italic">
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
        
        <div className="text-left sm:text-right">
          <div className="text-xl md:text-2xl font-mono font-black text-zinc-100">{asset.currency}{asset.currentPrice?.toLocaleString()}</div>
          <div className={cn("text-xs md:text-sm font-mono font-black", asset.dailyChange >= 0 ? "text-emerald-400" : "text-red-400")}>
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
