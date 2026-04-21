'use client';

import React from 'react';
import { ChevronDown, ChevronRight, Trash2, Eye, EyeOff } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/formatters';

interface AccountSectionProps {
  accounts: any[];
  portfolioHoldings: any[];
  accountStats: Record<string, any>;
  expandedAccounts: Set<string>;
  toggleAccount: (id: string) => void;
  toggleAccountInclusion: (id: string, isIncluded: boolean) => void;
  removeAsset: (id: string) => void;
  rates: { USD: number };
}

export const AccountSection: React.FC<AccountSectionProps> = ({
  accounts,
  portfolioHoldings,
  accountStats,
  expandedAccounts,
  toggleAccount,
  toggleAccountInclusion,
  removeAsset,
  rates
}) => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 overflow-hidden">
      <div className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] mb-8 font-mono">Hesaplar</div>
      <div className="space-y-4">
        {accounts.map(account => {
          const accountStat = accountStats[account.id];
          const isExpanded = expandedAccounts.has(account.id);
          const isIncluded = account.isIncluded;

          return (
            <div key={account.id} className="flex flex-col group/item relative">
              <div className="absolute left-[-45px] top-[26px] opacity-0 group-hover/item:opacity-100 transition-opacity">
                 <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAccountInclusion(account.id, !isIncluded);
                  }}
                  className={`p-2 rounded-full transition-all duration-300 ${isIncluded ? 'text-blue-500 bg-blue-500/10' : 'text-zinc-600 bg-zinc-800'}`}
                >
                  {isIncluded ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              </div>
              
              <button 
                onClick={() => toggleAccount(account.id)}
                className={`flex items-center justify-between p-5 rounded-[1.5rem] transition-all duration-300 group ${
                  isExpanded ? 'bg-zinc-800 border-zinc-700' : 'bg-transparent border-transparent hover:bg-zinc-800/50'
                } border ${!isIncluded ? 'opacity-40 grayscale hover:grayscale-0 hover:opacity-100' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}>
                    <ChevronRight size={16} className="text-zinc-500" />
                  </div>
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-zinc-200 uppercase tracking-tight group-hover:text-white transition-colors">
                        {account.name}
                      </span>
                      {!isIncluded && (
                        <span className="text-[8px] font-black bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-700">PASİF</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold ${
                        (accountStat?.totalGain || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'
                      }`}>
                        {formatCurrency(accountStat?.totalGain || 0)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-white tracking-tighter">
                    {formatCurrency(accountStat?.balance || 0)}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="mt-3 ml-6 space-y-3 pl-4 border-l-2 border-zinc-800 animate-in slide-in-from-top-4 duration-300">
                  {portfolioHoldings.filter(h => h.accountId === account.id).map(asset => {
                    const price = asset.currentPrice || asset.purchasePrice;
                    const currentValue = asset.amount * price;
                    const purchaseValue = asset.amount * asset.purchasePrice;
                    const totalGain = currentValue - purchaseValue;
                    const totalGainPercent = purchaseValue > 0 ? (totalGain / purchaseValue) * 100 : 0;
                    const isUSD = asset.currency.includes('$') || asset.currency.toUpperCase() === 'USD';

                    return (
                      <div key={asset.id} className="bg-zinc-800/30 rounded-2xl p-4 border border-zinc-800/50 hover:bg-zinc-800/50 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-zinc-800 rounded-lg p-2 text-xs font-black text-white px-3">
                              {asset.symbol}
                            </div>
                            <div className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                              {asset.assetType}
                            </div>
                            <div className="text-xs text-zinc-400 font-medium">
                              {asset.amount.toLocaleString('tr-TR')} ADET
                              {isUSD && (
                                <span className="ml-2 text-emerald-500/50">
                                  (@ {formatCurrency(rates.USD)})
                                </span>
                              )}
                            </div>
                          </div>
                          <button 
                            onClick={() => removeAsset(asset.id)}
                            className="p-1.5 text-zinc-600 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="flex justify-between items-end">
                          <div className="flex flex-col">
                            <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">DEĞER</div>
                            <div className="text-xl font-bold text-white tracking-tight flex flex-col">
                              {formatCurrency(currentValue, asset.currency)}
                              {isUSD && (
                                <span className="text-[10px] text-emerald-500 font-medium mt-0.5">
                                  ≈ {formatCurrency(currentValue * rates.USD, 'TRY')}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex flex-col items-end">
                              <div className="text-[8px] text-zinc-600 uppercase tracking-widest font-bold">TOPLAM</div>
                              <div className={`text-sm font-bold ${totalGain >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {totalGain >= 0 ? '+' : ''}{formatPercent(totalGainPercent)}
                              </div>
                            </div>
                            <div className="flex flex-col items-end border-t border-zinc-800/50 pt-1">
                              <div className="text-[8px] text-zinc-600 uppercase tracking-widest font-bold">GÜNLÜK</div>
                              <div className={`text-[10px] font-bold ${(asset.dailyChange || 0) >= 0 ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                                {(asset.dailyChange || 0) >= 0 ? '+' : ''}{(asset.dailyChange || 0).toFixed(2)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
