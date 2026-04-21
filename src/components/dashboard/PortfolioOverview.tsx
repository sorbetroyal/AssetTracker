'use client';

import React, { useMemo, useState } from 'react';
import { useAssetStore } from '@/store/useAssetStore';
import { formatCurrency } from '@/lib/formatters';
import { ChevronRight, Eye, EyeOff, Trash2 } from 'lucide-react';
import { PortfolioStats } from './portfolio/PortfolioStats';
import { AssetDetailCard } from './portfolio/AssetDetailCard';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

const PortfolioOverview = () => {
  const { portfolioHoldings, accounts, removeAsset, rates, toggleAccountInclusion, removeAccount, removePortfolioItem } = useAssetStore();
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set(['BIST']));
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; type: 'account' | 'asset'; id: string; name: string }>({
    isOpen: false,
    type: 'account',
    id: '',
    name: ''
  });

  const toggleAccount = (accountId: string) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(accountId)) newExpanded.delete(accountId);
    else newExpanded.add(accountId);
    setExpandedAccounts(newExpanded);
  };

  const toggleType = (type: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(type)) newExpanded.delete(type);
    else newExpanded.add(type);
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
      <div className="space-y-6">
        <h2 className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] px-4">Hesaplar</h2>
        <div className="space-y-4">
          {[...accounts]
            .sort((a, b) => {
              const isIncA = a.isIncluded !== false;
              const isIncB = b.isIncluded !== false;
              if (isIncA && !isIncB) return -1;
              if (!isIncA && isIncB) return 1;
              return (stats.accountStats[b.id]?.balance || 0) - (stats.accountStats[a.id]?.balance || 0);
            })
            .map((acc, index) => {
            const s = stats.accountStats[acc.id];
            const isExp = expandedAccounts.has(acc.id);
            const isInc = acc.isIncluded !== false;
            const isAlternate = index % 2 === 1;
            return (
              <div key={acc.id} className={`${isAlternate ? 'bg-zinc-900/40' : 'bg-zinc-900'} border border-zinc-800 rounded-[2rem] overflow-hidden transition-all duration-300 ${!isInc ? 'opacity-40 grayscale' : ''}`}>
                <div className="w-full flex items-center p-7 gap-4">
                  {isExp && (
                    <div className="flex flex-col items-center gap-0.5 min-w-[32px] animate-in fade-in duration-300">
                      <button onClick={() => toggleAccountInclusion(acc.id, !isInc)} className={`p-1.5 transition-colors ${isInc ? 'text-zinc-500 hover:text-blue-500' : 'text-zinc-700 hover:text-zinc-400'}`}>
                        {isInc ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteModal({
                            isOpen: true,
                            type: 'account',
                            id: acc.id,
                            name: acc.name
                          });
                        }}
                        className="p-1.5 text-rose-500/30 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                  <button onClick={() => toggleAccount(acc.id)} className="flex-1 grid grid-cols-2 md:grid-cols-5 items-center text-left gap-4 hover:bg-zinc-800/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <ChevronRight size={18} className={`text-zinc-500 transition-transform ${isExp ? 'rotate-90' : ''}`} />
                      <span className="text-xl font-black text-white italic uppercase truncate">{acc.name}</span>
                    </div>
                    <div className="text-left md:text-center">
                      <span className="text-xl font-black text-blue-400 font-mono tracking-tighter">%{s.ratio.toFixed(1)}</span>
                    </div>
                    <div className="text-left md:text-center">
                      <span className={`text-xl font-black font-mono tracking-tighter ${s.dailyGain >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {formatCurrency(s.dailyGain)}
                        <span className="text-lg ml-2 opacity-80">
                          (%{(((s.dailyGain) / (s.balance - s.dailyGain || 1)) * 100).toFixed(1)})
                        </span>
                      </span>
                    </div>
                    <div className="text-left md:text-center">
                      <span className={`text-xl font-black font-mono tracking-tighter ${s.totalGain >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {formatCurrency(s.totalGain)}
                        <span className="text-lg ml-2 opacity-80">
                          (%{(((s.totalGain) / (s.balance - s.totalGain || 1)) * 100).toFixed(1)})
                        </span>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-white tracking-tighter">{formatCurrency(s.balance)}</span>
                    </div>
                  </button>
                </div>
                {isExp && (
                  <div className="px-8 pb-8 animate-in slide-in-from-top-4 duration-300">
                    <div className="pt-8 border-t border-zinc-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                            onRemove={(id) => setDeleteModal({
                              isOpen: true,
                              type: 'asset',
                              id,
                              name: asset.symbol.replace('.IS', '')
                            })} 
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

      {/* VARLIKLAR */}
      <div className="space-y-6">
        <h2 className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] px-4">Varlık Dağılımı</h2>
        <div className="space-y-4">
          {Object.entries(stats.typeStats)
            .sort(([, a], [, b]) => b.balance - a.balance)
            .map(([type, s], index) => {
            const isExp = expandedTypes.has(type);
            const isAlternate = index % 2 === 1;
            const trNames:any = { 'FOREIGN_CURRENCY':'DÖVİZ','CRYPTO':'KRİPTO','US':'ABD HİSSE','BIST':'BIST','FUND':'FON','COMMODITY':'EMTİA','BEFAS':'BEFAS' };
            return (
              <div key={type} className={`${isAlternate ? 'bg-zinc-900/40' : 'bg-zinc-900'} border border-zinc-800 rounded-[2rem] overflow-hidden transition-colors`}>
                <button onClick={() => toggleType(type)} className="w-full grid grid-cols-2 md:grid-cols-5 items-center p-7 text-left gap-4 hover:bg-zinc-800/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <ChevronRight size={18} className={`text-zinc-500 transition-transform ${isExp ? 'rotate-90' : ''}`} />
                    <span className="text-2xl font-black text-white italic uppercase truncate">{trNames[type] || type}</span>
                  </div>
                  <div className="text-left md:text-center">
                    <span className="text-xl font-black text-blue-400 font-mono tracking-tighter">%{s.ratio.toFixed(1)}</span>
                  </div>
                  <div className="text-left md:text-center">
                    <span className={`text-xl font-black font-mono tracking-tighter ${s.dailyGain >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {formatCurrency(s.dailyGain)}
                      <span className="text-[10px] ml-1 opacity-60">
                        (%{(((s.dailyGain) / (s.balance - s.dailyGain || 1)) * 100).toFixed(1)})
                      </span>
                    </span>
                  </div>
                  <div className="text-left md:text-center">
                    <span className={`text-xl font-black font-mono tracking-tighter ${s.totalGain >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {formatCurrency(s.totalGain)}
                      <span className="text-[10px] ml-1 opacity-60">
                        (%{(((s.totalGain) / (s.balance - s.totalGain || 1)) * 100).toFixed(1)})
                      </span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-white tracking-tighter">{formatCurrency(s.balance)}</span>
                  </div>
                </button>
                {isExp && (
                  <div className="px-8 pb-8 animate-in slide-in-from-top-4 duration-300">
                    <div className="pt-8 border-t border-zinc-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {s.items.map((asset:any, idx:number) => {
                        const groupRatio = s.balance > 0 ? (asset.cValTRY / s.balance) * 100 : 0;
                        return (
                          <AssetDetailCard 
                            key={asset.id} 
                            asset={asset} 
                            rates={rates} 
                            isAlternate={idx % 2 === 1}
                            groupRatio={groupRatio}
                            onRemove={(id) => setDeleteModal({
                              isOpen: true,
                              type: 'asset',
                              id,
                              name: asset.symbol.replace('.IS', '')
                            })} 
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
