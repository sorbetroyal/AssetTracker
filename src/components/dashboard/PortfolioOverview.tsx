'use client';

import { useAssetStore, PortfolioItem } from '@/store/useAssetStore';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, Activity, Landmark, Plus, Trash2, Calendar } from 'lucide-react';
import { AddAssetModal } from './AddAssetModal';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function PortfolioOverview() {
  const { portfolioHoldings, removePortfolioItem } = useAssetStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<PortfolioItem['assetType']>('BIST');

  // Hesaplamalar
  const totalStats = portfolioHoldings.reduce((acc, item) => {
    const currentPrice = item.currentPrice || item.purchasePrice || 0;
    const value = item.amount * currentPrice;
    const cost = item.amount * item.purchasePrice;
    const dailyChangeVal = item.dailyChange ? (value * item.dailyChange) / 100 : 0;
    
    return {
      totalValue: acc.totalValue + value,
      totalCost: acc.totalCost + cost,
      dailyGain: acc.dailyGain + dailyChangeVal,
    };
  }, { totalValue: 0, totalCost: 0, dailyGain: 0 });

  const totalPnl = totalStats.totalValue - totalStats.totalCost;
  const totalPnlPercent = totalStats.totalCost > 0 ? (totalPnl / totalStats.totalCost) * 100 : 0;
  const dailyPnlPercent = totalStats.totalValue > 0 ? (totalStats.dailyGain / totalStats.totalValue) * 100 : 0;

  const accounts = portfolioHoldings.filter(h => h.assetType === 'BANK');
  const investments = portfolioHoldings.filter(h => h.assetType !== 'BANK');

  return (
    <div className="flex-1 p-4 md:p-8 flex flex-col gap-10 max-w-7xl mx-auto w-full bg-black/20 rounded-[3rem]">
      <AddAssetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} initialType={modalType} isPortfolio={true} />

      {/* 1. ÖZET KARTLARI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="PORTFÖY DEĞERİ" value={`₺${totalStats.totalValue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={<Wallet size={14} className="text-emerald-500" />} />
        <SummaryCard label="TOPLAM K/Z" value={`₺${totalPnl.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} percent={`${totalPnlPercent.toFixed(2)}%`} isNegative={totalPnl < 0} icon={<TrendingUp size={14} className={totalPnl >= 0 ? "text-emerald-500" : "text-red-500"} />} />
        <SummaryCard label="GÜNLÜK DEĞİŞİM" value={`₺${totalStats.dailyGain.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} percent={`${dailyPnlPercent.toFixed(2)}%`} isNegative={totalStats.dailyGain < 0} icon={<Activity size={14} className={totalStats.dailyGain >= 0 ? "text-emerald-500" : "text-red-500"} />} />
        <SummaryCard label="TOPLAM MALİYET" value={`₺${totalStats.totalCost.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={<Landmark size={14} className="text-amber-500" />} />
      </div>

      <div className="flex flex-col gap-16">
        {/* HESAPLAR */}
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-end px-2">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
              <h2 className="text-3xl font-black text-white italic tracking-tighter">Hesaplar</h2>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setModalType('BIST'); setIsModalOpen(true); }} className="text-[10px] font-black text-blue-500 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-xl hover:bg-blue-500 hover:text-white transition-all flex items-center gap-2 tracking-widest uppercase">
                <Plus size={14} /> VARLIK EKLE
              </button>
              <button onClick={() => { setModalType('BANK'); setIsModalOpen(true); }} className="text-[10px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl hover:bg-amber-500 hover:text-black transition-all flex items-center gap-2 tracking-widest uppercase">
                <Plus size={14} /> HESAP EKLE
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {Object.entries(
              portfolioHoldings.reduce((acc: any, h) => {
                // Sadece BANK tipindeki hesap isimlerini baz alalım
                const accountNames = Array.from(new Set(portfolioHoldings.filter(x => x.assetType === 'BANK').map(x => x.accountName)));
                
                // Eğer hesap isimleri henüz yoksa veya yatırımın hesap adını bulmak istiyorsak
                const targetAccount = h.accountName;
                if (!acc[targetAccount]) {
                  acc[targetAccount] = {
                    id: targetAccount,
                    accountName: targetAccount,
                    symbol: 'ACC',
                    amount: 0,
                    purchasePrice: 0,
                    currentPrice: 0,
                    dailyChange: 0,
                    totalValue: 0,
                    totalCost: 0,
                    totalGain: 0,
                    dailyGain: 0
                  };
                }

                const currentPrice = h.currentPrice || h.purchasePrice || 0;
                const value = h.amount * currentPrice;
                const cost = h.amount * h.purchasePrice;
                const gain = (currentPrice - h.purchasePrice) * h.amount;
                const dChange = h.dailyChange ? (value * h.dailyChange) / 100 : 0;

                acc[targetAccount].amount += h.assetType !== 'BANK' ? 1 : 0; // Varlık adedi sayacı
                acc[targetAccount].totalValue += value;
                acc[targetAccount].totalCost += cost;
                acc[targetAccount].totalGain += gain;
                acc[targetAccount].dailyGain += dChange;
                
                return acc;
              }, {})
            )
            // Sadece gerçekten tanımlanmış (BANK tipiyle oluşturulmuş) hesapları göster
            .filter(([name]) => portfolioHoldings.some(h => h.assetType === 'BANK' && h.accountName === name))
            .map(([name, data]: any) => (
              <AccountSummaryItem key={name} data={data} onDelete={() => {
                const bankItem = portfolioHoldings.find(h => h.assetType === 'BANK' && h.accountName === name);
                if (bankItem) removePortfolioItem(bankItem.id);
              }} />
            ))}
            {portfolioHoldings.filter(h => h.assetType === 'BANK').length === 0 && <EmptyState text="Hesap Bulunmuyor" />}
          </div>
        </div>

        {/* VARLIK TİPLERİ */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-1.5 h-8 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
            <h2 className="text-3xl font-black text-white italic tracking-tighter">Varlık Tipleri</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {Object.entries(
              portfolioHoldings
                .filter(h => h.assetType !== 'BANK')
                .reduce((acc: any, h) => {
                  const type = h.assetType === 'BIST' ? 'BIST' : h.assetType === 'CRYPTO' ? 'KRİPTO' : h.assetType === 'US' ? 'US MARKET' : 'EMTİA';
                  
                  if (!acc[type]) {
                    acc[type] = { name: type, amount: 0, totalValue: 0, totalCost: 0, totalGain: 0, dailyGain: 0 };
                  }

                  const currentPrice = h.currentPrice || h.purchasePrice || 0;
                  const value = h.amount * currentPrice;
                  const cost = h.amount * h.purchasePrice;
                  const gain = (currentPrice - h.purchasePrice) * h.amount;
                  const dChange = h.dailyChange ? (value * h.dailyChange) / 100 : 0;

                  acc[type].amount += 1;
                  acc[type].totalValue += value;
                  acc[type].totalCost += cost;
                  acc[type].totalGain += gain;
                  acc[type].dailyGain += dChange;
                  
                  return acc;
                }, {})
            ).map(([type, data]: any) => {
              const pnlPercent = data.totalCost > 0 ? (data.totalGain / data.totalCost) * 100 : 0;
              const yesterdayValue = data.totalValue - data.dailyGain;
              const dailyPercent = yesterdayValue > 0 ? (data.dailyGain / yesterdayValue) * 100 : 0;

              return (
                <div key={type} className="bg-zinc-900/40 border border-white/5 p-5 rounded-[2rem] flex flex-col sm:flex-row sm:items-center justify-between hover:bg-zinc-900/80 transition-all group relative overflow-hidden gap-6 px-10">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-5">
                  <div className="text-xl md:text-3xl font-black text-white tracking-tighter flex items-center gap-3">
                    {type}
                    <span className="text-[9px] md:text-[10px] font-black text-blue-500/60 uppercase bg-blue-500/5 px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg border border-blue-500/10 tracking-widest">
                      {data.amount} VRLK
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:flex sm:flex-1 justify-between sm:justify-end items-center gap-4 sm:gap-8 md:gap-14">
                  <div className="text-left sm:text-right">
                    <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1 leading-none">Günlük (Net)</div>
                    <div className={cn("text-base md:text-xl font-black tracking-tighter leading-none flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4 font-mono", data.dailyGain >= 0 ? "text-emerald-500" : "text-red-500")}>
                      <span>{data.dailyGain >= 0 ? '+' : ''}₺{data.dailyGain.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span className="text-sm md:text-lg opacity-80 font-black">{`(${data.dailyGain >= 0 ? '+' : ''}${dailyPercent.toFixed(2)}%)`}</span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1 leading-none">Toplam K/Z</div>
                    <div className={cn("text-base md:text-xl font-black tracking-tighter leading-none flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4 font-mono", data.totalGain >= 0 ? "text-emerald-500" : "text-red-500")}>
                      <span>{data.totalGain >= 0 ? '+' : ''}₺{data.totalGain.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span className="text-sm md:text-lg opacity-80 font-black">{`(${data.totalGain >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%)`}</span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right col-span-2 sm:col-auto sm:min-w-[120px] pt-2 sm:pt-0 border-t border-white/5 sm:border-0 mt-2 sm:mt-0">
                    <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 leading-none opacity-40">Toplam Değer</div>
                    <div className="text-xl md:text-3xl font-black text-white tracking-tighter leading-none font-mono">₺{data.totalValue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* YATIRIMLAR */}
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-end px-2">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 md:w-1.5 md:h-8 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
              <h2 className="text-xl md:text-3xl font-black text-white tracking-tighter uppercase">Varlıklar</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {investments.map(item => (
              <PortfolioListItem key={item.id} item={item} onDelete={() => removePortfolioItem(item.id)} isInvestment />
            ))}
            {investments.length === 0 && <EmptyState text="Yatırım Pozisyonu Bulunmuyor" />}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, percent, icon, isNegative }: any) {
  return (
    <div className="bg-zinc-900/60 border border-white/5 p-6 rounded-[1.8rem] hover:bg-zinc-900 transition-all group overflow-hidden relative">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</span>
        {percent && <span className={cn("ml-auto text-xs font-black italic", isNegative ? "text-red-500" : "text-emerald-500")}>{isNegative ? '' : '+'}{percent}</span>}
      </div>
      <div className={cn("text-2xl md:text-3xl font-black tracking-tighter italic", isNegative ? "text-red-500" : "text-white")}>{value}</div>
    </div>
  );
}

function AccountSummaryItem({ data, onDelete }: { data: any, onDelete: () => void }) {
  const totalValue = data.totalValue;
  const totalGain = data.totalGain;
  const dailyGain = data.dailyGain;
  const assetCount = data.amount;
  const totalCost = data.totalCost;
  const pnlPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
  
  // Günlük yüzdeyi hesapla (Bugünkü kar / dünkü toplam değer)
  const yesterdayValue = totalValue - dailyGain;
  const dailyPercent = yesterdayValue > 0 ? (dailyGain / yesterdayValue) * 100 : 0;

  return (
    <div className="bg-zinc-900/40 border border-white/5 p-5 rounded-[2rem] flex flex-col sm:flex-row sm:items-center justify-between hover:bg-zinc-900/80 transition-all group relative overflow-hidden gap-6 sm:pr-24">
      <div className="flex items-center gap-5">
        <div>
          <div className="text-3xl font-black text-white italic tracking-tighter ml-4 flex items-center gap-4">
            {data.accountName}
            <span className="text-[10px] font-black text-blue-500/60 uppercase bg-blue-500/5 px-2.5 py-1 rounded-lg border border-blue-500/10 not-italic tracking-[0.2em]">
              {assetCount} VARLIK
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 justify-between sm:justify-end items-center gap-8 md:gap-14">
        <div className="text-left sm:text-right">
          <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1.5 leading-none">Günlük Getiri (Net)</div>
          <div className={cn("text-base md:text-xl font-black tracking-tighter leading-none flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4 font-mono", dailyGain >= 0 ? "text-emerald-500" : "text-red-500")}>
            <span>{dailyGain >= 0 ? '+' : ''}₺{dailyGain.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-sm md:text-lg opacity-80 font-black">
              {`(${dailyGain >= 0 ? '+' : ''}${dailyPercent.toFixed(2)}%)`}
            </span>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1.5 leading-none">Toplam Kar/Zarar</div>
          <div className={cn("text-base md:text-xl font-black tracking-tighter leading-none flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4 font-mono", totalGain >= 0 ? "text-emerald-500" : "text-red-500")}>
            <span>{totalGain >= 0 ? '+' : ''}₺{totalGain.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-sm md:text-lg opacity-80 font-black">
              {`(${totalGain >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%)`}
            </span>
          </div>
        </div>
        <div className="text-right min-w-[120px]">
          <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 leading-none opacity-40">Hesap Toplam Değeri</div>
          <div className="text-xl md:text-3xl font-black text-white tracking-tighter leading-none font-mono">₺{totalValue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
      </div>

      <button onClick={onDelete} className="absolute right-6 top-1/2 -translate-y-1/2 p-3 text-zinc-700 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm border border-white/5"><Trash2 size={18} /></button>
    </div>
  );
}

function PortfolioListItem({ item, onDelete, isInvestment }: { item: PortfolioItem, onDelete: () => void, isInvestment?: boolean }) {
  const currentPrice = item.currentPrice || item.purchasePrice || 0;
  const value = item.amount * currentPrice;
  const totalPnl = (currentPrice - item.purchasePrice) * item.amount;
  const totalPnlPercent = item.purchasePrice > 0 ? ((currentPrice - item.purchasePrice) / item.purchasePrice) * 100 : 0;
  
  // Günlük yüzdeyi hesapla
  const dailyGainVal = item.dailyChange ? (value * item.dailyChange) / 100 : 0;
  const yesterdayValue = value - dailyGainVal;
  const dailyPercent = yesterdayValue > 0 ? (dailyGainVal / yesterdayValue) * 100 : 0;

  return (
    <div className="bg-zinc-900/40 border border-white/5 p-5 rounded-[2rem] flex flex-col sm:flex-row sm:items-center justify-between hover:bg-zinc-900/80 transition-all group relative overflow-hidden gap-6 sm:pr-24">
      <div className="flex items-center gap-5">
        <div>
          <div className="text-xl md:text-3xl font-black text-white tracking-tighter ml-4 flex items-center gap-4 uppercase">
            {item.symbol.replace('.IS', '')}
            <span className="text-[9px] md:text-[10px] font-black text-blue-400/60 uppercase bg-blue-400/5 px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg border border-blue-400/10 tracking-widest leading-none">
              {item.amount.toLocaleString('tr-TR')} ADET
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:flex sm:flex-1 justify-between sm:justify-end items-center gap-4 sm:gap-8 md:gap-14">
        <div className="text-left sm:text-right">
          <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1 leading-none">Günlük Getiri</div>
          <div className={cn("text-base md:text-xl font-black tracking-tighter leading-none flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4 font-mono", dailyGainVal >= 0 ? "text-emerald-500" : "text-red-500")}>
            <span>{dailyGainVal >= 0 ? '+' : ''}₺{dailyGainVal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-sm md:text-lg opacity-80 font-black">{`(${dailyGainVal >= 0 ? '+' : ''}${dailyPercent.toFixed(2)}%)`}</span>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1 leading-none">Toplam K/Z</div>
          <div className={cn("text-base md:text-xl font-black tracking-tighter leading-none flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4 font-mono", totalPnl >= 0 ? "text-emerald-500" : "text-red-500")}>
            <span>{totalPnl >= 0 ? '+' : ''}₺{totalPnl.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-sm md:text-lg opacity-80 font-black">{`(${totalPnl >= 0 ? '+' : ''}${totalPnlPercent.toFixed(2)}%)`}</span>
          </div>
        </div>
        <div className="text-left sm:text-right col-span-2 sm:col-auto sm:min-w-[120px] pt-2 sm:pt-0 border-t border-white/5 sm:border-0 mt-2 sm:mt-0">
          <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 leading-none opacity-40 text-right">Toplam Değer</div>
          <div className="text-xl md:text-3xl font-black text-white tracking-tighter leading-none text-right font-mono">₺{value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
      </div>

      <button onClick={onDelete} className="absolute right-6 top-1/2 -translate-y-1/2 p-3 text-zinc-700 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm border border-white/5"><Trash2 size={18} /></button>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="p-10 border border-dashed border-zinc-800 rounded-[2rem] text-center text-zinc-600 font-bold uppercase text-[10px] tracking-[0.2em]">{text}</div>;
}

