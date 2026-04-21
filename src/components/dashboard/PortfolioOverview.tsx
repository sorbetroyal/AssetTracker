'use client';

import React, { useMemo, useState } from 'react';
import { useAssetStore } from '@/store/useAssetStore';
import { formatCurrency } from '@/lib/formatters';
import { ChevronRight, Eye, EyeOff, Trash2, Plus } from 'lucide-react';
import { PortfolioStats } from './portfolio/PortfolioStats';
import { AssetDetailCard } from './portfolio/AssetDetailCard';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { AddAssetModal } from './AddAssetModal';

const PortfolioOverview = () => {
  const { portfolioHoldings, accounts, removeAsset, rates, toggleAccountInclusion, removeAccount, removePortfolioItem } = useAssetStore();
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  const [addModalConfig, setAddModalConfig] = useState<{ isOpen: boolean; type: string }>({ isOpen: false, type: 'BIST' });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; type: 'account' | 'asset'; id: string; name: string }>({
    isOpen: false,
    type: 'account',
    id: '',
    name: ''
  });

  const toggleAccount = (accountId: string) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.clear(); // Diğerlerini kapat
      newExpanded.add(accountId);
    }
    setExpandedAccounts(newExpanded);
  };

  const toggleType = (type: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.clear(); // Diğerlerini kapat
      newExpanded.add(type);
    }
    setExpandedTypes(newExpanded);
  };

  const stats = useMemo(() => {
    const isUSD = (currency: string) => currency.includes('$') || currency.toUpperCase() === 'USD';
    
    // Detaylı veri hazırlığı (TRY bazlı)
    // Detaylı veri hazırlığı (Hem orijinal hem TRY bazlı)
    const detailedAll = portfolioHoldings.map(h => {
      const price = h.currentPrice || h.purchasePrice;
      const isU = isUSD(h.currency);
      const rate = isU ? rates.USD : 1;
      
      const currentValue = h.amount * price;
      const purchaseValue = h.amount * h.purchasePrice;
      const totalGain = currentValue - purchaseValue;
      const dailyGain = currentValue * ((h.dailyChange || 0) / 100);
      
      const cValTRY = currentValue * rate;
      const pValTRY = purchaseValue * rate;
      const dGainTRY = dailyGain * rate;
      const totalGainTRY = cValTRY - pValTRY;

      return { 
        ...h, 
        currentValue,
        totalGain,
        dailyGain,
        cValTRY, 
        pValTRY, 
        dGainTRY, 
        totalGainTRY,
        totalGainPercent: pValTRY > 0 ? (totalGainTRY / pValTRY) * 100 : 0,
        dailyGainPercent: h.dailyChange || 0
      };
    });

    const activeItems = detailedAll.filter(h => {
      const acc = accounts.find(a => a.id === h.accountId);
      return acc?.isIncluded !== false;
    });

    const totalBalance = activeItems.reduce((s, h) => s + h.cValTRY, 0);
    const dailyGain = activeItems.reduce((s, h) => s + h.dGainTRY, 0);
    const totalGain = activeItems.reduce((s, h) => s + h.totalGainTRY, 0);

    const accountStats: Record<string, any> = {};
    accounts.forEach(acc => {
      const items = detailedAll.filter(h => h.accountId === acc.id);
      const bal = items.reduce((s, h) => s + h.cValTRY, 0);
      accountStats[acc.id] = {
        balance: bal,
        dailyGain: items.reduce((s, h) => s + h.dGainTRY, 0),
        totalGain: items.reduce((s, h) => s + h.totalGainTRY, 0),
        ratio: totalBalance > 0 ? (bal / totalBalance) * 100 : 0
      };
    });

    const typeStats: Record<string, any> = {};
    const grouped = detailedAll.filter(h => {
      const acc = accounts.find(a => a.id === h.accountId);
      return acc?.isIncluded !== false;
    }).reduce((acc, h) => {
      const effectiveType = h.symbol?.toUpperCase() === 'AVB' ? 'BEFAS' : h.assetType;
      if (!acc[effectiveType]) acc[effectiveType] = { items: [], balance: 0, dailyGain: 0, totalGain: 0 };
      
      // Konsolidasyon Mantığı
      const existing = acc[effectiveType].items.find((i: any) => i.symbol === h.symbol);
      if (existing) {
        existing.amount += h.amount;
        existing.currentValue += h.currentValue;
        existing.cValTRY += h.cValTRY;
        existing.dailyGain += h.dailyGain;
        existing.totalGain += h.totalGain;
        existing.dGainTRY += h.dGainTRY;
        existing.totalGainTRY += h.totalGainTRY;
        
        // Birleşik değerler üzerinden yüzdeleri tekrar hesapla
        const dBasis = existing.cValTRY - existing.dGainTRY;
        const tBasis = existing.cValTRY - existing.totalGainTRY;
        existing.dailyGainPercent = dBasis !== 0 ? (existing.dGainTRY / dBasis) * 100 : 0;
        existing.totalGainPercent = tBasis !== 0 ? (existing.totalGainTRY / tBasis) * 100 : 0;
      } else {
        acc[effectiveType].items.push({ ...h });
      }

      acc[effectiveType].balance += h.cValTRY;
      acc[effectiveType].dailyGain += h.dGainTRY;
      acc[effectiveType].totalGain += h.totalGainTRY;
      return acc;
    }, {} as Record<string, any>);

    Object.keys(grouped).forEach(t => {
      typeStats[t] = { 
        ...grouped[t], 
        ratio: totalBalance > 0 ? (grouped[t].balance / totalBalance) * 100 : 0 
      };
    });

    return { totalBalance, dailyGain, dailyGainPercent: totalBalance > 0 ? (dailyGain/totalBalance)*100 : 0, totalGain, totalGainPercent: (totalBalance-totalGain) > 0 ? (totalGain/(totalBalance-totalGain))*100 : 0, accountStats, typeStats, detailedAll };
  }, [portfolioHoldings, accounts, rates]);

  if (portfolioHoldings.length === 0) return <div className="text-center p-20 text-zinc-500">Portföy boş.</div>;

  return (
    <div className="max-w-[1600px] mx-auto pb-20 px-4 md:px-8 space-y-12">
      <PortfolioStats {...stats} />

      {/* HESAPLAR */}
      {expandedTypes.size === 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em]">Hesaplar</h2>
            <button 
              onClick={() => setAddModalConfig({ isOpen: true, type: 'BANK' })}
              className="flex items-center gap-2 px-5 py-2 bg-zinc-900/50 hover:bg-white text-zinc-400 hover:text-black border border-white/5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all active:scale-95"
            >
              <Plus size={14} />
              HESAP EKLE
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...accounts]
              .sort((a, b) => {
                const isIncA = a.isIncluded !== false;
                const isIncB = b.isIncluded !== false;
                if (isIncA && !isIncB) return -1;
                if (!isIncA && isIncB) return 1;
                return (stats.accountStats[b.id]?.balance || 0) - (stats.accountStats[a.id]?.balance || 0);
              })
              .filter(acc => expandedAccounts.size === 0 || expandedAccounts.has(acc.id))
              .map((acc, index) => {
                const s = stats.accountStats[acc.id];
                if (!s) return null;
                const isExp = expandedAccounts.has(acc.id);
                const isInc = acc.isIncluded !== false;
                const isAlternate = index % 2 === 1;

                return (
                  <div key={acc.id} className="contents">
                    {/* ... rest of account card ... */}
                <div className={`${isExp ? 'bg-zinc-900 border-2 border-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.3)] scale-[1.02]' : isAlternate ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-950 border-zinc-800'} border rounded-[2.5rem] p-6 transition-all duration-500 hover:border-zinc-700 group relative flex flex-col gap-5 ${!isInc ? 'opacity-40 grayscale' : ''}`}>
                      {/* HEADER */}
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-1.5">
                          <span className={`text-2xl font-black italic uppercase tracking-tighter leading-none truncate max-w-[150px] pr-2 transition-colors duration-300 ${isExp ? 'text-blue-400' : 'text-white'}`}>{acc.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/10 w-fit">
                              %{s.ratio.toFixed(1)}
                            </span>
                          </div>
                        </div>
                        {isExp && (
                          <div className="flex items-center gap-2 pointer-events-auto animate-in fade-in duration-300">
                            <button onClick={() => toggleAccountInclusion(acc.id, !isInc)} className="p-2 text-zinc-600 hover:text-blue-500 transition-colors">
                              {isInc ? <Eye size={18} /> : <EyeOff size={18} />}
                            </button>
                            <button 
                              onClick={() => setDeleteModal({ isOpen: true, type: 'account', id: acc.id, name: acc.name })}
                              className="p-2 text-rose-500/30 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* STATS */}
                      <div className="space-y-1.5 cursor-pointer flex-1" onClick={() => toggleAccount(acc.id)}>
                        <div className="flex items-center gap-2">
                          <span className={`text-xl font-black tracking-tighter ${s.dailyGain >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {formatCurrency(s.dailyGain)}
                          </span>
                          <span className={`text-sm font-black px-1.5 py-0.5 rounded ${s.dailyGain >= 0 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                            %{(((s.dailyGain) / (s.balance - s.dailyGain || 1)) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xl font-black tracking-tighter ${s.totalGain >= 0 ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
                            {formatCurrency(s.totalGain)}
                          </span>
                          <span className={`text-sm font-black px-1.5 py-0.5 rounded ${s.totalGain >= 0 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                            %{(((s.totalGain) / (s.balance - s.totalGain || 1)) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* BALANCE */}
                      <div className="pt-4 border-t border-zinc-900 cursor-pointer" onClick={() => toggleAccount(acc.id)}>
                        <span className="text-3xl font-black text-white tracking-tighter leading-none">{formatCurrency(s.balance)}</span>
                      </div>

                      <button onClick={() => toggleAccount(acc.id)} className="absolute bottom-5 right-6 text-zinc-800 hover:text-zinc-400">
                        <ChevronRight className={`transition-transform duration-300 ${isExp ? 'rotate-90' : ''}`} size={24} />
                      </button>
                    </div>

                    {isExp && (
                      <div className="col-span-full py-4 animate-in slide-in-from-top-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t border-zinc-900/30">
                          {stats.detailedAll.filter(h => h.accountId === acc.id).map((asset: any, idx: number) => {
                            const accStats = stats.accountStats[acc.id];
                            const groupRatio = accStats.balance > 0 ? (asset.cValTRY / accStats.balance) * 100 : 0;
                            return (
                              <AssetDetailCard 
                                key={asset.id} 
                                asset={asset} 
                                rates={rates} 
                                isAlternate={idx % 2 === 1}
                                groupRatio={groupRatio}
                                onRemove={(id) => setDeleteModal({ isOpen: true, type: 'asset', id, name: asset.symbol.replace('.IS', '') })} 
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* VARLIK DAĞILIMI */}
      {expandedAccounts.size === 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em]">Varlık Dağılımı</h2>
            <button 
              onClick={() => setAddModalConfig({ isOpen: true, type: 'BIST' })}
              className="flex items-center gap-2 px-5 py-2 bg-zinc-900/50 hover:bg-white text-zinc-400 hover:text-black border border-white/5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all active:scale-95"
            >
              <Plus size={14} />
              VARLIK EKLE
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(stats.typeStats)
              .sort(([, a], [, b]) => b.balance - a.balance)
              .filter(([type]) => expandedTypes.size === 0 || expandedTypes.has(type))
              .map(([type, s], index) => {
                const isExp = expandedTypes.has(type);
                const isAlternate = index % 2 === 1;
                const trNames:any = { 'FOREIGN_CURRENCY':'DÖVİZ','CRYPTO':'KRİPTO','US':'ABD HİSSE','BIST':'BIST','FUND':'FON','COMMODITY':'EMTİA','BEFAS':'BEFAS' };
                
                return (
                  <div key={type} className="contents">
                  <div className={`${isExp ? 'bg-zinc-900 border-2 border-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.3)] scale-[1.02]' : isAlternate ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-950 border-zinc-800'} border rounded-[2.5rem] p-6 transition-all duration-500 hover:border-zinc-700 group relative flex flex-col gap-5`}>
                      {/* HEADER */}
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-1.5">
                          <span className={`text-2xl font-black italic uppercase tracking-tighter leading-none pr-2 transition-colors duration-300 ${isExp ? 'text-blue-400' : 'text-white'}`}>{trNames[type] || type}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/10 w-fit">
                              %{s.ratio.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* STATS */}
                      <div className="space-y-1.5 cursor-pointer flex-1" onClick={() => toggleType(type)}>
                        <div className="flex items-center gap-2">
                          <span className={`text-xl font-black tracking-tighter ${s.dailyGain >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {formatCurrency(s.dailyGain)}
                          </span>
                          <span className={`text-sm font-black px-1.5 py-0.5 rounded ${s.dailyGain >= 0 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                            %{(((s.dailyGain) / (s.balance - s.dailyGain || 1)) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xl font-black tracking-tighter ${s.totalGain >= 0 ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
                            {formatCurrency(s.totalGain)}
                          </span>
                          <span className={`text-sm font-black px-1.5 py-0.5 rounded ${s.totalGain >= 0 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                            %{(((s.totalGain) / (s.balance - s.totalGain || 1)) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* BALANCE */}
                      <div className="pt-4 border-t border-zinc-900 cursor-pointer" onClick={() => toggleType(type)}>
                        <span className="text-3xl font-black text-white tracking-tighter leading-none">{formatCurrency(s.balance)}</span>
                      </div>

                      <button onClick={() => toggleType(type)} className="absolute bottom-5 right-6 text-zinc-800 hover:text-zinc-400">
                        <ChevronRight className={`transition-transform duration-300 ${isExp ? 'rotate-90' : ''}`} size={24} />
                      </button>
                    </div>

                    {isExp && (
                      <div className="col-span-full py-4 animate-in slide-in-from-top-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t border-zinc-900/30">
                          {s.items.map((asset:any, idx:number) => {
                            const groupRatio = s.balance > 0 ? (asset.cValTRY / s.balance) * 100 : 0;
                            return (
                              <AssetDetailCard 
                                key={asset.id} 
                                asset={asset} 
                                rates={rates} 
                                isAlternate={idx % 2 === 1}
                                groupRatio={groupRatio}
                                onRemove={(id) => setDeleteModal({ isOpen: true, type: 'asset', id, name: asset.symbol.replace('.IS', '') })} 
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      <AddAssetModal 
        isOpen={addModalConfig.isOpen} 
        onClose={() => setAddModalConfig({ ...addModalConfig, isOpen: false })} 
        initialType={addModalConfig.type as any}
        isPortfolio={true}
      />

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={() => {
          if (deleteModal.type === 'account') removeAccount(deleteModal.id);
          else removePortfolioItem(deleteModal.id);
        }}
        title={deleteModal.type === 'account' ? 'Hesabı Sil' : 'Varlığı Sil'}
        message={`${deleteModal.name} ${deleteModal.type === 'account' ? 'hesabını' : 'varlığını'} ve bağlı tüm verileri silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText={deleteModal.type === 'account' ? 'Hesabı Sil' : 'Varlığı Sil'}
        cancelText="Vazgeç"
      />
    </div>
  );
};

export default PortfolioOverview;
