'use client';

import { useAssetStore, PortfolioItem } from '@/store/useAssetStore';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, TrendingUp, Activity, Landmark, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { AddAssetModal } from './AddAssetModal';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const assetTypeOrder = ['BIST', 'TEFAS', 'BEFAS', 'US', 'CRYPTO', 'FOREIGN_CURRENCY', 'COMMODITY'];

const assetTypeLabels: Record<string, string> = {
  'BIST': 'BIST',
  'TEFAS': 'Yatırım Fonları',
  'BEFAS': 'BES Fonları',
  'US': 'ABD Borsası',
  'CRYPTO': 'Kripto',
  'FOREIGN_CURRENCY': 'Döviz',
  'COMMODITY': 'Emtia'
};

export function PortfolioOverview() {
  const { portfolioHoldings, removePortfolioItem, accounts, removeAccount, toggleAccountInclusion, rates } = useAssetStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<PortfolioItem['assetType'] | 'BANK'>('BIST');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedAssetType, setSelectedAssetType] = useState<string | null>(null);

  const usdRate = rates?.USD || 34.5;
  const activeAccountIds = accounts.filter(a => a.isIncluded).map(a => a.id);
  const filteredAccountIds = new Set(selectedAccountId ? [selectedAccountId] : activeAccountIds);

  const totalStats = portfolioHoldings.reduce((acc, item) => {
    if (!activeAccountIds.includes(item.accountId)) return acc;
    const currentPrice = item.currentPrice || item.purchasePrice || 0;
    const isUSD = item.currency === '$';
    const value = (item.amount * currentPrice) * (isUSD ? usdRate : 1);
    const cost = (item.amount * item.purchasePrice) * (isUSD ? usdRate : 1);
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

  const rawStats = portfolioHoldings
    .filter(h => filteredAccountIds.has(h.accountId))
    .reduce((acc: any, h) => {
      const typeLabel = assetTypeLabels[h.assetType] || h.assetType;
      const rawType = h.assetType;
      const isUSD = h.currency === '$';
      if (!acc[rawType]) {
        acc[rawType] = { name: typeLabel, rawType, totalValue: 0, totalCost: 0, totalGain: 0, dailyGain: 0, symbols: new Set() };
      }
      const currentPrice = h.currentPrice || h.purchasePrice || 0;
      const value = (h.amount * currentPrice) * (isUSD ? usdRate : 1);
      const cost = (h.amount * h.purchasePrice) * (isUSD ? usdRate : 1);
      const gain = value - cost;
      const dChange = h.dailyChange ? (value * h.dailyChange) / 100 : 0;
      
      acc[rawType].symbols.add(h.symbol);
      acc[rawType].amount = acc[rawType].symbols.size;
      acc[rawType].totalValue += value;
      acc[rawType].totalCost += cost;
      acc[rawType].totalGain += gain;
      acc[rawType].dailyGain += dChange;
      return acc;
    }, {});

  const assetTypeStats = assetTypeOrder
    .filter(type => rawStats[type])
    .map(type => rawStats[type]);

  // Dinamik oran hesaplama için payda (Seçili hesap varsa onun toplamı, yoksa genel toplam)
  const displayTotal = selectedAccountId 
    ? Object.values(rawStats).reduce((sum: number, s: any) => sum + s.totalValue, 0)
    : totalStats.totalValue;

  return (
    <div className="flex-1 p-3 md:p-8 flex flex-col gap-6 md:gap-10 max-w-7xl mx-auto w-full bg-black/20 rounded-2xl md:rounded-[3rem]">
      <AddAssetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} initialType={modalType as any} isPortfolio={true} />

      {/* AKSİYON BUTONLARI */}
      <div className="flex gap-3 px-1">
        <PlusButton label="Varlık Ekle" color="blue" onClick={() => { setSelectedAccountId(null); setSelectedAssetType(null); setModalType('BIST'); setIsModalOpen(true); }} />
        <PlusButton label="Hesap Ekle" color="amber" onClick={() => { setModalType('BANK'); setIsModalOpen(true); }} />
      </div>

      {/* ÖZET KARTLAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Portföy Değeri" value={`₺${totalStats.totalValue.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} icon={<Wallet size={14} className="text-emerald-500" />} />
        <SummaryCard label="Günlük Değişim" value={`₺${totalStats.dailyGain.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} percent={`${dailyPnlPercent.toFixed(2)}%`} isNegative={totalStats.dailyGain < 0} icon={<Activity size={14} className={totalStats.dailyGain >= 0 ? "text-emerald-500" : "text-red-500"} />} />
        <SummaryCard label="Toplam K/Z" value={`₺${totalPnl.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} percent={`${totalPnlPercent.toFixed(2)}%`} isNegative={totalPnl < 0} icon={<TrendingUp size={14} className={totalPnl >= 0 ? "text-emerald-500" : "text-red-500"} />} />
        <SummaryCard label="Toplam Maliyet" value={`₺${totalStats.totalCost.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} icon={<Landmark size={14} className="text-amber-500" />} />
      </div>

      {/* SENKRONİZASYON BİLGİSİ */}
      <div className="flex items-center gap-4 px-1 -mt-2">
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black tracking-widest text-emerald-500 uppercase">
            Veritabanı Yayında
          </span>
        </div>
        <div className="flex-1 h-[1px] bg-white/5" />
        <div className="text-[10px] font-bold text-zinc-500 flex items-center gap-2 tracking-wider">
          Fiyatlar en son {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} itibarıyla güncel
        </div>
      </div>

      <div className="flex flex-col gap-12">
        {/* HESAPLAR */}
        <SectionWrapper 
          title="Hesaplar" 
          colorClass="bg-amber-500 shadow-amber-500/50" 
          textColor="text-amber-500" 
          onClick={() => setSelectedAccountId(null)}
        />
        
        <div className="flex flex-col gap-1">
          {accounts.filter(acc => {
              // 1. Hesap bazlı seçim varsa sadece o hesabı göster
              if (selectedAccountId && acc.id !== selectedAccountId) return false;
              
              // 2. Varlık tipi seçiliyse, sadece o tipi içeren hesapları göster
              if (selectedAssetType) {
                return portfolioHoldings.some(h => h.accountId === acc.id && h.assetType === selectedAssetType);
              }
              
              return true;
          }).map(account => {
              const accountHoldings = portfolioHoldings.filter(h => h.accountId === account.id);
              const isSelected = selectedAccountId === account.id;
              const data = accountHoldings.reduce((acc, h) => {
                const currentPrice = h.currentPrice || h.purchasePrice || 0;
                const isUSD = h.currency === '$';
                const value = (h.amount * currentPrice) * (isUSD ? usdRate : 1);
                const cost = (h.amount * h.purchasePrice) * (isUSD ? usdRate : 1);
                const gain = value - cost;
                const dChange = h.dailyChange ? (value * h.dailyChange) / 100 : 0;
                
                acc.symbols.add(h.symbol);
                acc.amount = acc.symbols.size;
                acc.totalValue += value; acc.totalCost += cost; acc.totalGain += gain; acc.dailyGain += dChange;
                return acc;
              }, { accountName: account.name, amount: 0, totalValue: 0, totalCost: 0, totalGain: 0, dailyGain: 0, symbols: new Set<string>() });
              return (
                <AccountSummaryItem 
                  key={account.id} 
                  data={data} 
                  isIncluded={account.isIncluded} 
                  isSelected={isSelected} 
                  weight={(data.totalValue / (totalStats.totalValue || 1)) * 100}
                  onSelect={() => setSelectedAccountId(isSelected ? null : account.id)} 
                  onToggle={(e: any) => { e.stopPropagation(); toggleAccountInclusion(account.id, !account.isIncluded)} } 
                  onDelete={(e: any) => { 
                    e.stopPropagation(); 
                    removeAccount(account.id);
                  }} 
                />
              );
          })}
        </div>

        {/* VARLIK TİPLERİ */}
        <SectionWrapper 
          title="Varlık Tipleri" 
          colorClass="bg-emerald-500 shadow-emerald-500/50" 
          textColor="text-emerald-400" 
          onClick={() => setSelectedAssetType(null)}
        />
        
        <div className="flex flex-col gap-1">
          {assetTypeStats.filter((data: any) => !selectedAssetType || data.rawType === selectedAssetType).map((data: any) => {
              const weight = (data.totalValue / (displayTotal || 1)) * 100;
              const pnlPercent = data.totalCost > 0 ? (data.totalGain / data.totalCost) * 100 : 0;
              const yesterdayValue = data.totalValue - data.dailyGain;
              const dailyPercent = yesterdayValue > 0 ? (data.dailyGain / yesterdayValue) * 100 : 0;
              const isSelected = selectedAssetType === data.rawType;
              return (
                <RowWrapper key={data.rawType} isSelected={isSelected} onClick={() => setSelectedAssetType(isSelected ? null : data.rawType)} activeColor="emerald">
                  <div className="flex flex-row items-center gap-2 md:contents w-full md:w-auto">
                    <div className="w-auto md:w-[140px] shrink-0 overflow-hidden">
                      <span className={cn("text-lg md:text-2xl font-bold tracking-tighter truncate block", isSelected ? "text-emerald-400" : "text-white")}>
                        {data.name}
                      </span>
                    </div>
                    <div className="w-auto md:w-[110px] shrink-0">
                      <div className={cn("text-[10px] md:text-xs font-black uppercase px-2 py-0.5 rounded border tracking-tighter text-center truncate", isSelected ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-white/5 border-white/10 text-white/50")}>
                        {data.amount.toLocaleString('tr-TR')} {data.amount === 1 ? 'VRLK' : 'VRLK'}
                      </div>
                    </div>
                    <div className="w-auto md:w-[65px] shrink-0">
                      <div className={cn("text-[10px] md:text-xs font-black px-2 py-0.5 rounded border text-center", isSelected ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-emerald-500/5 border-emerald-500/10 text-emerald-500/60")}>
                        %{weight.toFixed(1)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row items-center w-full md:flex-1 overflow-hidden">
                    {/* BOŞLUK (Masaüstünde Verileri Sağa İtmek İçin) */}
                    <div className="hidden md:block flex-1" />

                    {/* FİYAT REZERVASYONU (Masaüstü Hizalama İçin) */}
                    <div className="hidden md:block md:w-[140px] shrink-0" />
                    
                    {/* KAR / ZARAR GRUBU */}
                    <div className="flex flex-row w-full md:w-auto justify-between md:justify-end gap-x-4 md:gap-x-8 md:mr-8">
                      <div className="w-auto md:w-[150px] shrink-0 text-right">
                        <ValueColumn value={data.dailyGain} percent={dailyPercent} />
                      </div>
                      <div className="w-auto md:w-[150px] shrink-0 text-right">
                        <ValueColumn value={data.totalGain} percent={pnlPercent} />
                      </div>
                    </div>
                  </div>
                  <div className="w-full md:w-[160px] flex shrink-0 justify-end text-lg md:text-2xl font-mono font-bold tracking-tighter text-white mt-2 md:mt-0">
                    ₺{data.totalValue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                  </div>
                </RowWrapper>
              );
          })}
        </div>

        {/* VARLIKLAR LISTESI */}
        <SectionWrapper 
          title="Varlıklar" 
          colorClass="bg-blue-500 shadow-blue-500/50" 
          textColor="text-blue-500" 
          onClick={() => {
            setSelectedAccountId(null);
            setSelectedAssetType(null);
          }}
        />
        <div className="flex flex-col gap-1">
          {Object.values(
            portfolioHoldings
              .filter(h => filteredAccountIds.has(h.accountId) && (!selectedAssetType || h.assetType === selectedAssetType))
              .reduce((acc: any, h) => {
                if (!acc[h.symbol]) {
                  acc[h.symbol] = { ...h, totalCostBasis: 0, totalAmount: 0 };
                }
                acc[h.symbol].totalAmount += h.amount;
                acc[h.symbol].totalCostBasis += (h.amount * h.purchasePrice);
                return acc;
              }, {})
          ).map((item: any) => {
              const currentPrice = item.currentPrice || (item.totalCostBasis / item.totalAmount) || 0;
              const isUSD = item.currency === '$';
              const avgPurchasePrice = item.totalCostBasis / item.totalAmount;
              
              const value = (item.totalAmount * currentPrice) * (isUSD ? usdRate : 1);
              const cost = (item.totalCostBasis) * (isUSD ? usdRate : 1);
              
              const dailyGainVal = item.dailyChange ? (value * item.dailyChange) / 100 : 0;
              
              // VARLIKLAR İÇİN DİNAMİK ORAN (Varlık tipi seçiliyse o tipe göre, değilse genel/hesap bazlı)
              const assetWeightTotal = selectedAssetType && rawStats[selectedAssetType]
                ? rawStats[selectedAssetType].totalValue
                : displayTotal;
              
              const weight = (value / (assetWeightTotal || 1)) * 100;

              return (
                <RowWrapper 
                  key={item.symbol} 
                  onClick={() => {}} 
                  className="cursor-default hover:bg-zinc-900/60"
                  showToggle={!!selectedAccountId}
                  isIncluded={true} // Varlık bazlı eye on/off şimdilik devre dışı, hesap üzerinden yönetiliyor
                  onToggle={(e: any) => { 
                    // ... varlık bazlı toggle gerekirse buraya ...
                  }}
                  showDelete={!!selectedAccountId}
                  onDelete={() => {
                    const targetIds = portfolioHoldings
                      .filter(h => h.accountId === selectedAccountId && h.symbol === item.symbol)
                      .map(h => h.id);

                    if (targetIds.length > 0) {
                      targetIds.forEach(id => removePortfolioItem(id));
                    }
                  }}
                >
                  <div className="flex flex-row items-center gap-2 md:contents w-full md:w-auto">
                    <div className="w-auto md:w-[140px] shrink-0 overflow-hidden">
                      <span className="text-lg md:text-2xl font-bold tracking-tighter text-white truncate block">
                        {item.symbol === 'GC=F' ? 'Altın' : 
                         item.symbol === 'SI=F' ? 'Gümüş' : 
                         item.symbol === 'USDTRY=X' ? 'Amerikan Doları' :
                         item.symbol === 'EURTRY=X' ? 'Euro' :
                         item.symbol.replace('.IS', '').replace('-USD', '')}
                      </span>
                    </div>
                    <div className="w-auto md:w-[110px] shrink-0">
                      <div className="text-[10px] md:text-xs font-black uppercase px-2 py-0.5 rounded border tracking-tighter text-center truncate bg-blue-500/10 border-blue-500/20 text-blue-400">
                        {item.totalAmount.toLocaleString('tr-TR')} ADET
                      </div>
                    </div>
                    <div className="w-auto md:w-[65px] shrink-0">
                      <div className="text-[10px] md:text-xs font-black px-2 py-0.5 rounded border text-center bg-emerald-500/5 border-emerald-500/10 text-emerald-500/60">
                        %{weight.toFixed(1)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row items-center w-full md:flex-1 overflow-hidden">
                    {/* BOŞLUK (Masaüstünde Verileri Sağa İtmek İçin) */}
                    <div className="hidden md:block flex-1" />

                    {/* FİYAT SÜTUNU */}
                    <div className="w-auto md:w-[140px] flex shrink-0 flex-col justify-center text-right mr-4 md:mr-0">
                      <span className="text-sm md:text-xl font-mono font-bold text-white whitespace-nowrap">
                        {item.currency === 'USD' ? '$' : '₺'}{currentPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* KAR / ZARAR GRUBU */}
                    <div className="flex flex-row w-full md:w-auto justify-between md:justify-end gap-x-4 md:gap-x-8 md:mr-8">
                      <div className="w-auto md:w-[150px] shrink-0 text-right">
                        <ValueColumn value={dailyGainVal} percent={item.dailyChange || 0} />
                      </div>
                      <div className="w-auto md:w-[150px] shrink-0 text-right">
                        <ValueColumn value={value - cost} percent={avgPurchasePrice > 0 ? ((currentPrice - avgPurchasePrice)/avgPurchasePrice)*100 : 0} />
                      </div>
                    </div>
                  </div>
                  <div className="w-[90px] md:w-[160px] flex shrink-0 justify-end text-lg md:text-2xl font-mono font-bold tracking-tighter text-white">
                    ₺{value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                  </div>
                </RowWrapper>
              );
          })}
        </div>
      </div>
    </div>
  );
}

// ALT BILESENLER (Duzenli Hizalama Icin)
function SectionWrapper({ title, colorClass, textColor, children, onClick }: any) {
  return (
    <div 
      className={cn("flex justify-between items-center px-2 mb-4 mt-8 first:mt-0 cursor-pointer group/title select-none")}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className={cn("w-1.5 h-8 rounded-full transition-transform group-hover/title:scale-y-110", colorClass)} />
        <h2 className={cn("text-3xl font-black tracking-tighter transition-opacity group-hover/title:opacity-80", textColor || "text-white")}>
          {title}
        </h2>
      </div>
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function RowWrapper({ children, isSelected, onClick, activeColor, className, showDelete, onDelete, showToggle, onToggle, isIncluded = true }: any) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const colorMap: any = { 
    amber: "border-amber-500 shadow-amber-500/10", 
    emerald: "border-emerald-500 shadow-emerald-500/10", 
    blue: "border-blue-500 shadow-blue-500/10" 
  };

  // 3 saniye sonra onayı otomatik iptal et
  useEffect(() => {
    if (confirmDelete) {
      const timer = setTimeout(() => setConfirmDelete(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmDelete]);

  return (
    <motion.div 
      layout 
      onClick={confirmDelete ? undefined : onClick}
      className={cn(
      "group relative flex flex-col md:flex-row md:items-center gap-1.5 md:gap-4 p-3 md:pl-8 md:pr-32 md:py-4 rounded-xl md:rounded-2xl border transition-all overflow-hidden",
      !isIncluded ? "opacity-30 grayscale border-white/5 bg-transparent" : isSelected ? cn("bg-zinc-800/80 scale-[1.005] z-10", colorMap[activeColor]) : "even:bg-zinc-900/40 odd:bg-transparent border-white/5 hover:bg-zinc-800 hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.03)]",
      className
    )}>
      {children}
      <div className="md:absolute md:right-4 flex items-center justify-end gap-2 mt-1 md:mt-0 z-50">
        {showToggle && (
          <button 
            onClick={(e) => { e.stopPropagation(); onToggle && onToggle(e); }}
            className={cn(
              "p-2 md:p-3 rounded-xl transition-all border border-white/10 bg-black/60 backdrop-blur-md",
              isIncluded ? "text-emerald-500 hover:bg-emerald-500/20" : "text-zinc-500 hover:bg-white/10"
            )}
          >
            {isIncluded ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        )}
        {showDelete && (
          <button 
            type="button"
            onClick={(e) => { 
              e.stopPropagation(); 
              if (!confirmDelete) {
                setConfirmDelete(true);
              } else {
                onDelete && onDelete(e); 
                setConfirmDelete(false);
              }
            }}
            className={cn(
              "p-2 md:p-3 rounded-xl transition-all flex items-center gap-2 font-black text-[10px] tracking-widest",
              confirmDelete 
                ? "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]" 
                : "text-red-500 hover:text-white hover:bg-red-500/40 border border-red-500/20 bg-black/60 backdrop-blur-md"
            )}
          >
            {confirmDelete ? "SİL?" : <Trash2 size={16} />}
          </button>
        )}
      </div>
    </motion.div>
  );
}

function ValueColumn({ value, percent }: any) {
  const isPositive = value >= 0;
  return (
    <div className={cn(
      "whitespace-nowrap text-base md:text-xl font-bold font-mono tracking-tighter text-right flex flex-col items-end leading-none", 
      isPositive ? "text-emerald-500" : "text-red-500"
    )}>
      <span className="whitespace-nowrap">
        {isPositive ? '+' : ''}₺{Math.abs(value).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
      </span>
      <div className="text-[10px] md:text-xs font-black opacity-70 mt-0.5">
        ({isPositive ? '+' : ''}{percent.toFixed(1)}%)
      </div>
    </div>
  );
}

function BadgeGroup({ amount, weight, isSelected, color, isAsset }: any) {
  const baseClass = "text-xs font-black uppercase px-2.5 py-1 rounded-lg border tracking-widest whitespace-nowrap";
  const colors: any = {
    amber: isSelected ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-blue-500/5 border-blue-500/10 text-blue-500/60",
    emerald: isSelected ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-blue-500/5 border-blue-500/10 text-blue-500/60",
    blue: "bg-blue-500/5 border-blue-500/10 text-blue-500/60"
  };
  return (
    <div className="flex items-center gap-2">
      <span className={cn(baseClass, colors[color || 'blue'])}>{amount.toLocaleString('tr-TR')} {isAsset ? 'ADET' : 'VRLK'}</span>
      <span className={cn(baseClass, "bg-emerald-500/5 border-emerald-500/10 text-emerald-500/70")}>%{weight.toFixed(1)}</span>
    </div>
  );
}

function SummaryCard({ label, value, percent, icon, isNegative }: any) {
  return (
    <div className="bg-zinc-900/60 border border-white/5 p-4 md:p-6 rounded-2xl md:rounded-[1.8rem] hover:bg-zinc-900 transition-all group overflow-hidden relative">
      <div className="flex items-center gap-2 mb-2 md:mb-4">
        {icon}
        <span className="text-[10px] md:text-xs font-black text-zinc-500 tracking-widest leading-none capitalize">{label.toLowerCase()}</span>
        {percent && <span className={cn("ml-auto text-xs md:text-sm font-black", isNegative ? "text-red-500" : "text-emerald-500")}>{isNegative ? '' : '+'}{percent}</span>}
      </div>
      <div className={cn("text-2xl md:text-4xl font-black tracking-tighter font-mono leading-none", isNegative ? "text-red-500" : "text-white")}>{value}</div>
    </div>
  );
}

function PlusButton({ label, onClick, color }: any) {
  const colors: any = { blue: "text-blue-500 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500", amber: "text-amber-500 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500 hover:text-black" };
  return (
    <button onClick={onClick} className={cn("text-xs font-black px-4 py-2 rounded-xl border transition-all flex items-center gap-2 tracking-[0.15em]", colors[color])}>
      <Plus size={14} /> {label}
    </button>
  );
}

function AccountSummaryItem({ data, isIncluded, isSelected, weight, onSelect, onToggle, onDelete }: any) {
  const yesterdayValue = data.totalValue - data.dailyGain;
  const dailyPercent = yesterdayValue > 0 ? (data.dailyGain / yesterdayValue) * 100 : 0;
  const pnlPercent = data.totalCost > 0 ? (data.totalGain / data.totalCost) * 100 : 0;

  return (
    <RowWrapper isSelected={isSelected} onClick={onSelect} activeColor="amber" isIncluded={isIncluded} showToggle onToggle={onToggle} showDelete onDelete={onDelete}>
      <div className="flex flex-row items-center gap-2 md:contents w-full md:w-auto">
        <div className="w-auto md:w-[140px] shrink-0 overflow-hidden">
          <span className={cn("text-lg md:text-2xl font-bold tracking-tighter truncate block", isSelected ? "text-amber-500" : "text-white")}>
            {data.accountName}
          </span>
        </div>
        <div className="w-auto md:w-[110px] shrink-0">
          <div className={cn("text-[10px] md:text-xs font-black uppercase px-2 py-0.5 rounded border tracking-tighter text-center truncate", isSelected ? "bg-amber-500/20 border-amber-500/30 text-amber-500" : "bg-white/5 border-white/10 text-white/50")}>
            {data.amount.toLocaleString('tr-TR')} {data.amount === 1 ? 'VRLK' : 'VRLK'}
          </div>
        </div>
        <div className="w-auto md:w-[65px] shrink-0">
          <div className={cn("text-[10px] md:text-xs font-black px-2 py-0.5 rounded border text-center", isSelected ? "bg-amber-500/20 border-amber-500/30 text-amber-500" : "bg-amber-500/5 border-amber-500/10 text-amber-500/60")}>
            %{weight.toFixed(1)}
          </div>
        </div>
      </div>

      <div className="flex flex-row items-center flex-1 overflow-hidden">
        {/* BOŞLUK (Masaüstünde Verileri Sağa İtmek İçin) */}
        <div className="hidden md:block flex-1" />

        {/* FİYAT REZERVASYONU (Masaüstü Hizalama İçin) */}
        <div className="hidden md:block md:w-[140px] shrink-0" />
        
        {/* KAR / ZARAR GRUBU */}
        <div className="flex flex-row w-full md:w-auto justify-between md:justify-end gap-x-4 md:gap-x-8 md:mr-8">
          <div className="w-auto md:w-[150px] shrink-0 text-right">
            <ValueColumn value={data.dailyGain} percent={dailyPercent} />
          </div>
          <div className="w-auto md:w-[150px] shrink-0 text-right">
            <ValueColumn value={data.totalGain} percent={pnlPercent} />
          </div>
        </div>
      </div>
      <div className="w-[90px] md:w-[160px] flex shrink-0 justify-end text-lg md:text-2xl font-mono font-bold tracking-tighter text-white">
        ₺{data.totalValue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
      </div>
    </RowWrapper>
  );
}
