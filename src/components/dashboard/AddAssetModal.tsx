'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Calendar, Landmark } from 'lucide-react';
import { useAssetStore, Asset, PortfolioItem } from '@/store/useAssetStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: PortfolioItem['assetType'];
  isPortfolio?: boolean;
}

export function AddAssetModal({ isOpen, onClose, initialType, isPortfolio = false }: AddAssetModalProps) {
  const { addAsset, addPortfolioItem } = useAssetStore();
  
  const [formData, setFormData] = useState({
    symbol: '',
    accountName: '',
    type: initialType || ('BIST' as any),
    strategy: 'Kar Al' as Asset['strategy'],
    targetPrice: '',
    purchasePrice: '',
    purchaseAt: new Date().toISOString().split('T')[0],
    currency: '₺',
    amount: '',
  });

  useEffect(() => {
    if (initialType) {
      setFormData(f => ({ ...f, type: initialType, symbol: '', accountName: '', amount: '', purchasePrice: '' }));
    }
  }, [initialType, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalSymbol = formData.symbol.toUpperCase().trim();
    if (formData.type === 'BIST' && !finalSymbol.endsWith('.IS') && formData.type !== 'BANK') {
      finalSymbol = finalSymbol.replace(/0/g, 'O') + '.IS';
    }
    if (formData.type === 'CRYPTO' && !finalSymbol.includes('-') && formData.type !== 'BANK') {
      finalSymbol += '-USD';
    }

    if (isPortfolio) {
      addPortfolioItem({
        accountName: formData.type === 'BANK' ? formData.accountName : (formData.accountName || 'Genel'),
        assetType: formData.type,
        symbol: formData.type === 'BANK' ? formData.accountName : finalSymbol,
        purchaseAt: formData.purchaseAt,
        purchasePrice: Number(formData.purchasePrice) || 0,
        amount: Number(formData.amount) || 0,
        currency: formData.currency,
      });
    } else {
      addAsset({
        symbol: finalSymbol,
        name: finalSymbol === 'GC=F' ? 'ALTIN (ONS)' : finalSymbol === 'SI=F' ? 'GÜMÜŞ (ONS)' : finalSymbol,
        type: formData.type,
        strategy: formData.strategy,
        entryPrice: 0,
        targetPrice: Number(formData.targetPrice) || 0,
        currency: formData.currency,
      });
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-zinc-100 uppercase tracking-tighter italic">
                {isPortfolio ? (formData.type === 'BANK' ? 'Yeni Hesap Ekle' : 'Portföye Varlık Ekle') : 'Takibi Başlat'}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                <X size={20} className="text-zinc-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Tip seçimi kaldırıldı, initialType kullanılıyor */}

              {/* Hesap Adı (Sadece Portföy ve BANK değilse yan alan olarak, BANK ise tek alan olarak) */}
              {isPortfolio && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1 flex items-center gap-2">
                    <Landmark size={10}/> {formData.type === 'BANK' ? 'Hesap / Banka Adı' : 'Kurum / Borsa Adı'}
                  </label>
                  <input
                    required
                    value={formData.accountName}
                    onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                    className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-zinc-100 font-bold text-sm focus:border-white outline-none transition-all"
                    placeholder="Örn: Akbank, Binance, İş Bankası..."
                  />
                </div>
              )}

              {/* Ortak Alan: Sembol (Hesap tipi ise gizli) */}
              {!isPortfolio || formData.type !== 'BANK' ? (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">
                    Sembol (Örn: THYAO, BTC)
                  </label>
                  <input
                    required
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-zinc-100 font-mono text-sm focus:border-white outline-none transition-all uppercase"
                    placeholder="Symbol..."
                  />
                </div>
              ) : null}

              {/* İşlem Detayları */}
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
                isPortfolio && formData.type !== 'BANK' && (
                  /* Diğer Varlıklar İçin Detaylı Form */
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1 flex items-center gap-2"><Calendar size={10}/> Alım Tarihi</label>
                        <input
                          type="date"
                          value={formData.purchaseAt}
                          onChange={(e) => setFormData({ ...formData, purchaseAt: e.target.value })}
                          className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-zinc-100 text-xs focus:border-white outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1 text-emerald-500">Maliyet (Birim)</label>
                        <input
                          required
                          type="number"
                          step="any"
                          value={formData.purchasePrice}
                          onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                          className="bg-zinc-950 border border-emerald-900/50 p-3 rounded-xl text-zinc-100 text-sm focus:border-emerald-500 font-mono"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1 text-blue-500">Miktar / Adet</label>
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
                  </>
                )
              )}

              <button
                type="submit"
                className="mt-4 flex items-center justify-center gap-2 bg-white text-black p-4 rounded-xl font-black text-xs transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-[0.2em]"
              >
                <Plus size={16} />
                {isPortfolio ? (formData.type === 'BANK' ? 'HESABI OLUŞTUR' : 'PORTFÖYE EKLE') : 'TAKİBİ BAŞLAT'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
