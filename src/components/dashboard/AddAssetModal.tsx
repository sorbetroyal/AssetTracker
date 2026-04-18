'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Calendar, Landmark, RefreshCw, CircleDollarSign, Calculator, ChevronDown } from 'lucide-react';
import { useAssetStore, Asset, PortfolioItem } from '@/store/useAssetStore';
import { CustomCalendar } from '@/components/ui/CustomCalendar';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const typeLabels: Record<string, string> = {
  'BIST': 'BIST',
  'TEFAS': 'Yatırım Fonları',
  'BEFAS': 'BES Fonları',
  'US': 'ABD Borsası',
  'CRYPTO': 'Kripto',
  'COMMODITY': 'Emtia'
};

const typeColors: Record<string, string> = {
  'BIST': 'text-blue-500',
  'US': 'text-emerald-500',
  'TEFAS': 'text-amber-500',
  'BEFAS': 'text-indigo-500',
  'CRYPTO': 'text-orange-500',
  'COMMODITY': 'text-yellow-500',
  'BANK': 'text-zinc-400'
};

const typeBorderColors: Record<string, string> = {
  'BIST': 'border-blue-500/20',
  'US': 'border-emerald-500/20',
  'TEFAS': 'border-amber-500/20',
  'BEFAS': 'border-indigo-500/20',
  'CRYPTO': 'border-orange-500/20',
  'COMMODITY': 'border-yellow-500/20',
  'BANK': 'border-zinc-500/20'
};

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: PortfolioItem['assetType'] | 'BANK';
  isPortfolio?: boolean;
  editingAsset?: Asset | null;
}

export function AddAssetModal({ isOpen, onClose, initialType, isPortfolio = false, editingAsset }: AddAssetModalProps) {
  const { 
    addAsset, 
    addPortfolioItem, 
    updateAsset,
    accounts, 
    addAccount, 
    fetchAccounts, 
    fetchPortfolio, 
    triggerRefresh 
  } = useAssetStore();
  
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTypeSelectorOpen, setIsTypeSelectorOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    symbol: '',
    accountName: '',
    accountId: '',
    type: (initialType || 'BIST') as any,
    strategy: 'Kar Al' as Asset['strategy'],
    targetPrice: '',
    purchasePrice: '',
    purchaseAt: new Date().toISOString().split('T')[0],
    currency: '₺',
    amount: '',
  });

  const lastLookupRef = useRef('');
  const totalCost = Number(formData.purchasePrice) * Number(formData.amount);

  // Tarih formatlama (DD.MM.YYYY)
  const formattedDate = formData.purchaseAt.split('-').reverse().join('.');

  useEffect(() => {
    if (editingAsset) {
      setFormData({
        symbol: editingAsset.symbol,
        accountName: '',
        accountId: '',
        type: editingAsset.type,
        strategy: editingAsset.strategy,
        targetPrice: editingAsset.targetPrice.toString(),
        purchasePrice: editingAsset.entryPrice.toString(),
        purchaseAt: new Date().toISOString().split('T')[0],
        currency: editingAsset.currency,
        amount: '',
      });
    } else if (initialType) {
      setFormData(f => ({ 
        ...f, 
        type: initialType, 
        symbol: '', 
        accountName: '', 
        accountId: accounts.length > 0 ? accounts[0].id : '', 
        amount: '', 
        purchasePrice: '',
        currency: (initialType === 'US' || initialType === 'CRYPTO') ? '$' : '₺'
      }));
    }
  }, [initialType, isOpen, accounts.length, editingAsset]);

  useEffect(() => {
    if (!isPortfolio || formData.type === 'BANK' || !formData.symbol || formData.symbol.length < 2) return;
    
    // Fiyat çekilebilir tipler
    const autoFetchTypes = ['BIST', 'CRYPTO', 'US', 'TEFAS', 'BEFAS', 'COMMODITY'];
    if (!autoFetchTypes.includes(formData.type)) return;

    const fetchPrice = async () => {
      let lookupSymbol = formData.symbol.toUpperCase().trim();
      
      // Akıllı Sembol Eşleme
      if (lookupSymbol === 'ALTIN' || lookupSymbol === 'GOLD') lookupSymbol = 'GC=F';
      if (lookupSymbol === 'GÜMÜŞ' || lookupSymbol === 'SILVER') lookupSymbol = 'SI=F';

      if (formData.type === 'BIST' && !lookupSymbol.endsWith('.IS') && lookupSymbol.length >= 3) {
        lookupSymbol = lookupSymbol.replace(/0/g, 'O') + '.IS';
      }
      if (formData.type === 'CRYPTO' && !lookupSymbol.includes('-')) {
        lookupSymbol += '-USD';
      }

      const cacheKey = `${lookupSymbol}-${formData.purchaseAt}`;
      if (lastLookupRef.current === cacheKey) return;
      lastLookupRef.current = cacheKey;

      setIsPriceLoading(true);
      try {
        const res = await fetch(`/api/prices/history?symbol=${lookupSymbol}&date=${formData.purchaseAt}&type=${formData.type}`);
        const data = await res.json();
        
        if (data.price) {
          setFormData(prev => ({ ...prev, purchasePrice: Number(data.price).toFixed(2) }));
        }
      } catch (error) {
        console.error('Fiyat getirme hatası:', error);
      } finally {
        setIsPriceLoading(false);
      }
    };

    const timer = setTimeout(fetchPrice, 800);
    return () => clearTimeout(timer);
  }, [formData.symbol, formData.purchaseAt, formData.type, isPortfolio]);

  const handleTypeChange = (newType: string) => {
    setFormData(prev => ({ 
      ...prev, 
      type: newType,
      currency: (newType === 'US' || newType === 'CRYPTO' || newType === 'COMMODITY') ? '$' : '₺',
      symbol: '' 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.type === 'BANK') {
      await addAccount(formData.accountName);
      await fetchAccounts();
      onClose();
      return;
    }

    let finalSymbol = formData.symbol.toUpperCase().trim();
    
    // Alırken de mapping uygula
    if (finalSymbol === 'ALTIN' || finalSymbol === 'GOLD') finalSymbol = 'GC=F';
    if (finalSymbol === 'GÜMÜŞ' || finalSymbol === 'SILVER') finalSymbol = 'SI=F';

    if (formData.type === 'BIST' && !finalSymbol.endsWith('.IS')) {
      finalSymbol = finalSymbol.replace(/0/g, 'O') + '.IS';
    }
    if (formData.type === 'CRYPTO' && !finalSymbol.includes('-')) {
      finalSymbol += '-USD';
    }

    if (isPortfolio) {
      if (!formData.accountId) {
        alert("Lütfen önce bir hesap ekleyin.");
        return;
      }

      await addPortfolioItem({
        accountId: formData.accountId,
        assetType: formData.type,
        symbol: finalSymbol,
        purchaseAt: formData.purchaseAt,
        purchasePrice: Number(formData.purchasePrice) || 0,
        amount: Number(formData.amount) || 0,
        currency: formData.currency,
      });

      await fetchPortfolio();
      await fetchAccounts();
      triggerRefresh();
    } else {
      if (editingAsset) {
        await updateAsset(editingAsset.id, {
          strategy: formData.strategy,
          targetPrice: Number(formData.targetPrice) || 0,
          currency: formData.currency,
        });
      } else {
        await addAsset({
          symbol: finalSymbol,
          name: finalSymbol === 'GC=F' ? 'ALTIN (ONS)' : finalSymbol === 'SI=F' ? 'GÜMÜŞ (ONS)' : finalSymbol,
          type: formData.type,
          strategy: formData.strategy,
          entryPrice: 0,
          targetPrice: Number(formData.targetPrice) || 0,
          currency: formData.currency,
        });
      }
    }

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl overflow-hidden"
          >
            {/* Üst Başlık ve Kapatma */}
            <div className="flex justify-between items-center mb-6">
              <h2 className={cn(
                "text-xl font-black uppercase tracking-tighter italic transition-colors",
                typeColors[formData.type as keyof typeof typeColors] || 'text-white'
              )}>
                {formData.type === 'BANK' ? 'Yeni Hesap Ekle' : (editingAsset ? 'Hedef Güncelle' : 'Varlık Ekle')}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                <X size={20} className="text-zinc-500" />
              </button>
            </div>

            {/* VARLIK TİPİ SEÇİCİ (Dropdown) */}
            {formData.type !== 'BANK' && (
              <div className="relative mb-6">
                <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1 mb-1.5 block tracking-widest leading-none">Varlık Kategorisi</label>
                <div className="relative group/type">
                  <button
                    type="button"
                    onClick={() => setIsTypeSelectorOpen(!isTypeSelectorOpen)}
                    className={cn(
                      "w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl text-left flex justify-between items-center transition-all hover:bg-zinc-900 group-focus-within/type:border-white",
                      typeColors[formData.type as keyof typeof typeColors] || 'text-white'
                    )}
                  >
                    <span className="text-sm font-black uppercase tracking-widest tracking-tighter italic">
                      {typeLabels[formData.type as keyof typeof typeLabels]}
                    </span>
                    <ChevronDown size={16} className={cn("text-zinc-500 transition-transform", isTypeSelectorOpen && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {isTypeSelectorOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsTypeSelectorOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden z-[51] shadow-2xl"
                        >
                          {Object.entries(typeLabels).map(([key, label]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                handleTypeChange(key);
                                setIsTypeSelectorOpen(false);
                              }}
                              className={cn(
                                "w-full p-4 text-left text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-900 transition-colors border-b border-white/5 last:border-0",
                                formData.type === key ? "text-white bg-white/5" : "text-zinc-500"
                              )}
                            >
                              {label}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              {formData.type === 'BANK' ? (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1 flex items-center gap-2">
                    <Landmark size={10}/> Hesap / Banka Adı
                  </label>
                  <input
                    required
                    autoFocus
                    value={formData.accountName}
                    onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                    className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-zinc-100 font-bold text-sm focus:border-white outline-none transition-all"
                    placeholder="Örn: Akbank, İş Portföy, Binance..."
                  />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    {isPortfolio && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1 flex items-center gap-2">
                          <Landmark size={10}/> Yatırım Hesabı
                        </label>
                        {accounts.length > 0 ? (
                          <div className="relative">
                            <select
                              required
                              value={formData.accountId}
                              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                              className="w-full bg-zinc-950 border border-zinc-800 p-3 pr-10 rounded-xl text-zinc-100 font-bold text-sm focus:border-white outline-none appearance-none transition-all"
                            >
                              <option value="" disabled>Hesap Seçin</option>
                              {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                              ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                          </div>
                        ) : (
                          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-bold text-red-500 uppercase tracking-widest text-center">
                            Hesap yok!
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1 flex items-center gap-2">
                        <CircleDollarSign size={10}/> Para Birimi
                      </label>
                      <div className="relative">
                        <select
                          value={formData.currency}
                          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 p-3 pr-10 rounded-xl text-zinc-100 font-bold text-sm focus:border-white outline-none appearance-none transition-all"
                        >
                          <option value="₺">Türk Lirası (₺)</option>
                          <option value="$">Amerikan Doları ($)</option>
                          <option value="€">Euro (€)</option>
                          <option value="₿">Bitcoin (₿)</option>
                          <option value="G">Altın/Gram (G)</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">
                      {formData.type === 'TEFAS' || formData.type === 'BEFAS' ? 'FON KODU (Örn: MAC, TI2)' : 'Sembol (Örn: THYAO, BTC)'}
                    </label>
                    <input
                      required
                      value={formData.symbol}
                      onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                      className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-zinc-100 font-mono text-sm focus:border-white outline-none transition-all uppercase"
                      placeholder={formData.type === 'TEFAS' ? 'Örn: AAK' : 'Symbol...'}
                    />
                  </div>

                  {!isPortfolio ? (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Strateji</label>
                        <select
                          value={formData.strategy}
                          onChange={(e) => setFormData({ ...formData, strategy: e.target.value as any })}
                          className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-zinc-100 text-sm focus:border-white outline-none"
                        >
                          <option value="Kar Al">Kar Al</option>
                          <option value="Zarar Kes">Zarar Kes</option>
                          <option value="Dirençten Al">Dirençten Al</option>
                          <option value="Destekten Al">Destekten Al</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Hedef Fiyat</label>
                        <input
                          required
                          type="number"
                          step="any"
                          value={formData.targetPrice}
                          onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                          className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-zinc-100 text-sm focus:border-white font-mono"
                          placeholder="0.00"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5 relative">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1 flex items-center gap-2 relative">
                            <Calendar size={10}/> Alım Tarihi
                          </label>
                          <button
                            type="button"
                            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                            className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-zinc-100 text-sm focus:border-white outline-none text-left flex justify-between items-center"
                          >
                            <span className="font-mono">{formattedDate}</span>
                            <Calendar size={12} className="text-zinc-500" />
                          </button>
                          
                          <AnimatePresence>
                            {isCalendarOpen && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsCalendarOpen(false)} />
                                <CustomCalendar 
                                  selectedDate={formData.purchaseAt}
                                  onSelect={(date) => setFormData({ ...formData, purchaseAt: date })}
                                  onClose={() => setIsCalendarOpen(false)}
                                />
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                        <div className="flex flex-col gap-1.5 relative">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1 text-emerald-400 flex items-center gap-2">
                            Birim Maliyet {isPriceLoading && <RefreshCw size={8} className="animate-spin" />}
                          </label>
                          <input
                            required
                            type="number"
                            step="any"
                            value={formData.purchasePrice}
                            onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                            className={cn(
                              "bg-zinc-950 border border-emerald-900/50 p-3 rounded-xl text-zinc-100 text-sm focus:border-emerald-500 font-mono transition-all",
                              isPriceLoading && "opacity-50"
                            )}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1 text-blue-400">Miktar / Adet</label>
                        <input
                          required
                          type="number"
                          step="any"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          className="bg-zinc-950 border border-blue-900/50 p-3 rounded-xl text-zinc-100 text-sm focus:border-blue-500 font-mono"
                          placeholder="0.00"
                        />
                      </div>

                      {totalCost > 0 && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-[0_0_20px_rgba(16,185,129,0.05)]"
                        >
                          <span className="text-[9px] font-black text-emerald-500/60 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Calculator size={10} /> TOPLAM İŞLEM HACMİ
                          </span>
                          <span className="text-2xl font-black text-emerald-500 tracking-tighter italic">
                            {formData.currency}{totalCost.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </motion.div>
                      )}
                    </>
                  )}
                </>
              )}

              <button
                type="submit"
                disabled={(formData.type !== 'BANK' && isPortfolio && accounts.length === 0) || isPriceLoading}
                className="mt-4 flex items-center justify-center gap-2 bg-white text-black p-4 rounded-xl font-black text-xs transition-all hover:scale-[1.01] active:scale-[0.99] uppercase tracking-[0.2em] disabled:opacity-50 disabled:hover:scale-100"
              >
                {!editingAsset && <Plus size={16} />}
                {formData.type === 'BANK' ? 'HESABI OLUŞTUR' : (isPortfolio ? 'PORTFÖYE EKLE' : (editingAsset ? 'STRATEJİYİ GÜNCELLE' : 'TAKİBİ BAŞLAT'))}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
