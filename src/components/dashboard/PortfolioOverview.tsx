'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  Eye,
  EyeOff,
  Trash2,
  AlertCircle,
  Plus,
  Search,
  Filter,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  RefreshCcw,
  Clock
} from 'lucide-react';
import { useAssetStore, Account, Asset } from '@/store/useAssetStore';
import { formatCurrency, formatPercent } from '../../lib/formatters';

export default function PortfolioOverview() {
  const { 
    accounts, 
    assets, 
    portfolioHoldings,
    toggleAccountInclusion, 
    removeAccount, 
    removeAsset,
    triggerRefresh,
    syncFunds,
    isLoading 
  } = useAssetStore();
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>({});
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    // Simüle edilmiş son güncelleme zamanı
    setLastUpdated(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
  }, [assets]);

  const toggleAccount = (accountId: string) => {
    setExpandedAccounts(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }));
  };

  const handleManualSync = async () => {
    setIsUpdating(true);
    try {
      await syncFunds();
      setLastUpdated(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Portfolio aggregates
  const stats = useMemo(() => {
    const visibleAccounts = accounts.filter(acc => acc.isIncluded);
    
    // Her hesap için ayrı istatistik hesapla
    const accountStats = accounts.reduce((acc, account) => {
      const holdings = portfolioHoldings.filter(h => h.accountId === account.id);
      const balance = holdings.reduce((sum, h) => sum + (h.amount * (h.currentPrice || h.purchasePrice)), 0);
      const purchaseValue = holdings.reduce((sum, h) => sum + (h.amount * h.purchasePrice), 0);
      const totalGain = balance - purchaseValue;
      const dailyGain = holdings.reduce((sum, h) => {
        const price = h.currentPrice || h.purchasePrice;
        const change = h.dailyChange || 0;
        return sum + (h.amount * price * (change / 100));
      }, 0);

      acc[account.id] = {
        balance,
        dailyGain,
        dailyGainPercent: balance > 0 ? (dailyGain / balance) * 100 : 0,
        totalGain,
        totalGainPercent: purchaseValue > 0 ? (totalGain / purchaseValue) * 100 : 0,
        assetCount: holdings.length
      };
      return acc;
    }, {} as Record<string, any>);

    const totalBalance = visibleAccounts.reduce((sum, acc) => sum + (accountStats[acc.id]?.balance || 0), 0);
    const dailyGain = visibleAccounts.reduce((sum, acc) => sum + (accountStats[acc.id]?.dailyGain || 0), 0);
    const totalGain = visibleAccounts.reduce((sum, acc) => sum + (accountStats[acc.id]?.totalGain || 0), 0);
    
    const dailyGainPercent = totalBalance > 0 ? (dailyGain / totalBalance) * 100 : 0;
    const totalGainPercent = (totalBalance - totalGain) > 0 ? (totalGain / (totalBalance - totalGain)) * 100 : 0;

    return {
      accountStats,
      totalBalance,
      dailyGain,
      dailyGainPercent,
      totalGain,
      totalGainPercent,
      assetCount: portfolioHoldings.length,
      accountCount: visibleAccounts.length
    };
  }, [accounts, portfolioHoldings]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Summary Card */}
      <div className="relative overflow-hidden bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 shadow-2xl">
        {/* Abstract background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full -mr-20 -mt-20"></div>
        
        <div className="relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-zinc-500 text-sm font-medium tracking-widest uppercase">
                <Wallet size={16} className="text-emerald-500" />
                PORTFÖY DEĞERİ
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tighter">
                {formatCurrency(stats.totalBalance)}
              </h1>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <div className="bg-zinc-800/50 backdrop-blur-md border border-zinc-700/50 rounded-2xl px-5 py-3">
                <div className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase mb-1">VARLIK</div>
                <div className="text-white font-bold">{stats.assetCount}</div>
              </div>
              <div className="bg-zinc-800/50 backdrop-blur-md border border-zinc-700/50 rounded-2xl px-5 py-3">
                <div className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase mb-1">HESAP</div>
                <div className="text-white font-bold">{stats.accountCount}</div>
              </div>
              <button 
                onClick={handleManualSync}
                disabled={isUpdating}
                className="group flex flex-col items-center justify-center bg-emerald-500 hover:bg-emerald-400 text-black rounded-2xl px-5 py-3 transition-all duration-300 disabled:opacity-50"
              >
                <div className="text-[10px] font-black tracking-widest uppercase mb-0.5">YENİLE</div>
                <RefreshCcw size={16} className={`${isUpdating ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-6 rounded-3xl border transition-all duration-300 ${
              stats.dailyGain >= 0 
                ? 'bg-emerald-500/5 border-emerald-500/10 hover:bg-emerald-500/10' 
                : 'bg-rose-500/5 border-rose-500/10 hover:bg-rose-500/10'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-zinc-500 text-xs font-bold tracking-widest uppercase">GÜNLÜK KALIM</span>
                {stats.dailyGain >= 0 ? <TrendingUp size={20} className="text-emerald-500" /> : <TrendingDown size={20} className="text-rose-500" />}
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${stats.dailyGain >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {stats.dailyGain >= 0 ? '+' : ''}{formatCurrency(stats.dailyGain)}
                </span>
                <span className={`text-base font-medium ${stats.dailyGain >= 0 ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
                  {stats.dailyGain >= 0 ? '+' : ''}{stats.dailyGainPercent.toFixed(2)}%
                </span>
              </div>
            </div>

            <div className={`p-6 rounded-3xl border transition-all duration-300 ${
              stats.totalGain >= 0 
                ? 'bg-emerald-500/5 border-emerald-500/10 hover:bg-emerald-500/10' 
                : 'bg-rose-500/5 border-rose-500/10 hover:bg-rose-500/10'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-zinc-500 text-xs font-bold tracking-widest uppercase">TOPLAM KAZANÇ</span>
                {stats.totalGain >= 0 ? <TrendingUp size={20} className="text-emerald-500" /> : <TrendingDown size={20} className="text-rose-500" />}
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${stats.totalGain >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {stats.totalGain >= 0 ? '+' : ''}{formatCurrency(stats.totalGain)}
                </span>
                <span className={`text-base font-medium ${stats.totalGain >= 0 ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
                  {stats.totalGain >= 0 ? '+' : ''}{stats.totalGainPercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Accounts List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Plus size={20} className="text-emerald-500" />
              Hesaplar
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-zinc-500 text-xs font-medium uppercase tracking-widest">
                TEMİZLE
              </span>
            </div>
          </div>

          <div className="grid gap-4">
            {accounts.map(account => {
              const accountStat = stats.accountStats[account.id];
              return (
                <div 
                  key={account.id}
                  className={`group relative bg-zinc-900 border transition-all duration-500 rounded-[2rem] overflow-hidden ${
                    account.isIncluded ? 'border-zinc-800' : 'border-zinc-900 opacity-60'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-2xl font-bold text-white tracking-tight uppercase group-hover:text-emerald-500 transition-colors">
                            {account.name}
                          </h3>
                          <div className="flex gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                              {accountStat?.assetCount || 0} VRLK
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                              %{stats.totalBalance > 0 ? (((accountStat?.balance || 0) / stats.totalBalance) * 100).toFixed(1) : '0.0'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleAccount(account.id)}
                        className="p-2 hover:bg-zinc-800 rounded-xl transition-colors text-zinc-500"
                      >
                        {expandedAccounts[account.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>

                    <div className="flex justify-between items-center mb-6">
                      <div className="flex flex-col">
                        <span className="text-zinc-500 text-xs font-medium mb-1 tracking-wider uppercase">GÜNLÜK</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-bold ${(accountStat?.dailyGain || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {(accountStat?.dailyGain || 0) >= 0 ? '+' : ''}{formatCurrency(accountStat?.dailyGain || 0)}
                          </span>
                          <span className={`text-xs ${(accountStat?.dailyGain || 0) >= 0 ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                            ({(accountStat?.dailyGainPercent || 0) >= 0 ? '+' : ''}{(accountStat?.dailyGainPercent || 0).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-zinc-500 text-xs font-medium mb-1 tracking-wider uppercase">TOPLAM KAZANÇ</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-bold ${(accountStat?.totalGain || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {(accountStat?.totalGain || 0) >= 0 ? '+' : ''}{formatCurrency(accountStat?.totalGain || 0)}
                          </span>
                          <span className={`text-xs ${(accountStat?.totalGain || 0) >= 0 ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                            ({(accountStat?.totalGainPercent || 0) >= 0 ? '+' : ''}{(accountStat?.totalGainPercent || 0).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-end mt-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleAccountInclusion(account.id, !account.isIncluded)}
                          className={`p-2 rounded-xl transition-all duration-300 ${
                            account.isIncluded 
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                              : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                          }`}
                        >
                          {account.isIncluded ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                        <button
                          onClick={() => removeAccount(account.id)}
                          className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 transition-all duration-300 hover:bg-rose-500/20"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <div className="text-3xl font-bold text-white tracking-tighter">
                        {formatCurrency(accountStat?.balance || 0)}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Assets */}
                  {expandedAccounts[account.id] && (
                    <div className="border-t border-zinc-800/50 bg-zinc-900/50 p-4 space-y-3">
                      {portfolioHoldings.filter(h => h.accountId === account.id).map(asset => {
                        const currentValue = asset.amount * (asset.currentPrice || asset.purchasePrice);
                        const purchaseValue = asset.amount * asset.purchasePrice;
                        const totalGain = currentValue - purchaseValue;
                        const totalGainPercent = purchaseValue > 0 ? (totalGain / purchaseValue) * 100 : 0;

                        return (
                          <div key={asset.id} className="bg-zinc-800/30 rounded-2xl p-4 border border-zinc-800/50 hover:bg-zinc-800/50 transition-colors">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="bg-zinc-800 rounded-lg p-2 text-xs font-black text-white px-3">
                                  {asset.symbol}
                                </div>
                                <div className="text-xs text-zinc-400 font-medium">
                                  {asset.amount.toLocaleString('tr-TR')} ADET
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
                                <div className="text-xl font-bold text-white tracking-tight">
                                  {formatCurrency(currentValue)}
                                </div>
                              </div>
                              <div className="flex flex-col items-end">
                                <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">DEĞİŞİM</div>
                                <div className={`text-sm font-bold ${totalGain >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  {totalGain >= 0 ? '+' : ''}{formatPercent(totalGainPercent)}
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

        {/* Portfolio Insights / Performance Chart Placeholder */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 px-2">
            <TrendingUp size={20} className="text-emerald-500" />
            Varlık Detayları
          </h2>

          <div className="grid gap-4">
            {portfolioHoldings.filter(asset => {
              const account = accounts.find(acc => acc.id === asset.accountId);
              return account?.isIncluded;
            }).map((asset) => {
              const currentValue = asset.amount * (asset.currentPrice || asset.purchasePrice);
              const purchaseValue = asset.amount * asset.purchasePrice;
              const totalGain = currentValue - purchaseValue;
              const totalGainPercent = purchaseValue > 0 ? (totalGain / purchaseValue) * 100 : 0;
              const dailyGain = asset.amount * (asset.currentPrice || asset.purchasePrice) * ((asset.dailyChange || 0) / 100);

              return (
                <div 
                  key={asset.id}
                  className="group bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 hover:border-emerald-500/20 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black text-white tracking-widest uppercase">
                        {asset.symbol}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                        {asset.amount.toLocaleString('tr-TR')} ADET
                      </span>
                      {totalGainPercent !== 0 && (
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${totalGainPercent > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          %{totalGainPercent.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-xl font-medium text-white">
                          {formatCurrency(asset.currentPrice || asset.purchasePrice)}
                        </span>
                        <div className="flex flex-col">
                          <span className={`text-sm font-bold flex items-center ${dailyGain >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {dailyGain >= 0 ? '+' : ''}{formatCurrency(dailyGain)}
                          </span>
                          <span className={`text-[10px] ${dailyGain >= 0 ? 'text-emerald-500/60' : 'text-rose-500/60'}`}>
                            ({(asset.dailyChange || 0) >= 0 ? '+' : ''}{(asset.dailyChange || 0).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-baseline gap-2">
                         <span className={`text-xl font-bold ${totalGain >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain)}
                        </span>
                      </div>
                      <span className={`text-[10px] ${totalGain >= 0 ? 'text-emerald-500/60' : 'text-rose-500/60'}`}>
                        ({totalGainPercent >= 0 ? '+' : ''}{totalGainPercent.toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  {/* Main Total Row: Right Aligned */}
                  <div className="flex justify-end items-end pt-4 border-t border-zinc-800/50">
                    <div className="text-3xl font-bold text-white tracking-tighter">
                      {formatCurrency(currentValue)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
