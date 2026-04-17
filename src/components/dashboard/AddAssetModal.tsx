'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import { useAssetStore, Asset } from '@/store/useAssetStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddAssetModal({ isOpen, onClose }: AddAssetModalProps) {
  const addAsset = useAssetStore((state) => state.addAsset);
  const [formData, setFormData] = useState({
    symbol: '',
    type: 'BIST' as Asset['type'],
    strategy: 'Kar Al' as Asset['strategy'],
    targetPrice: '',
    currency: '₺'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Akıllı Sembol Düzeltmesi
    let finalSymbol = formData.symbol.toUpperCase().trim();
    
    // BIST için yaygın hata düzeltmesi (0 yerine O harfi)
    if (formData.type === 'BIST') {
      finalSymbol = finalSymbol.replace(/0/g, 'O');
    }
    
    // BIST Düzeltmesi (.IS ekleme)
    if (formData.type === 'BIST' && !finalSymbol.endsWith('.IS')) {
      finalSymbol += '.IS';
    }

    // Kripto Düzeltmesi (-USD ekleme)
    if (formData.type === 'CRYPTO' && !finalSymbol.includes('-')) {
      finalSymbol += '-USD';
    }

    addAsset({
      symbol: finalSymbol,
      name: finalSymbol === 'GC=F' ? 'ALTIN (ONS)' : finalSymbol === 'SI=F' ? 'GÜMÜŞ (ONS)' : finalSymbol,
      type: formData.type,
      strategy: formData.strategy,
      entryPrice: 0,
      targetPrice: Number(formData.targetPrice),
      currency: formData.currency
    });
    setFormData({
      symbol: '',
      type: 'BIST',
      strategy: 'Kar Al',
      targetPrice: '',
      currency: '₺'
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl overflow-hidden"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-zinc-100 uppercase tracking-tighter">Yeni Varlık Ekle</h2>
              <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                <X size={20} className="text-zinc-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Hedef Stratejisi</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Zarar Kes', 'Kar Al', 'Dirençten Al', 'Destekten Al'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData({ ...formData, strategy: s as Asset['strategy'] })}
                      className={cn(
                        "px-3 py-2 rounded-xl text-[11px] font-bold transition-all border",
                        formData.strategy === s 
                          ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/20" 
                          : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Sembol (Örn: THYAO.IS, AAPL, BTC-USD)</label>
                <input
                  required
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-zinc-100 font-mono text-sm focus:border-emerald-500 outline-none transition-all"
                  placeholder="Symbol..."
                />
                <AnimatePresence>
                  {formData.type === 'COMMODITY' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex gap-2 mt-1 px-1 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, symbol: 'GC=F', currency: '$' })}
                        className="text-[10px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1.5 rounded-xl hover:bg-amber-500 hover:text-black transition-all"
                      >
                        ALTIN
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, symbol: 'SI=F', currency: '$' })}
                        className="text-[10px] font-black bg-zinc-400/10 text-zinc-400 border border-zinc-400/20 px-3 py-1.5 rounded-xl hover:bg-zinc-100 hover:text-black transition-all"
                      >
                        GÜMÜŞ
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Borsa Tipi</label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const newType = e.target.value as Asset['type'];
                      setFormData({ 
                        ...formData, 
                        type: newType,
                        currency: newType === 'BIST' ? '₺' : '$'
                      });
                    }}
                    className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-zinc-100 text-sm focus:border-emerald-500 outline-none transition-all"
                  >
                    <option value="BIST">BIST</option>
                    <option value="US">US Market</option>
                    <option value="CRYPTO">Crypto</option>
                    <option value="COMMODITY">Commodity</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Para Birimi</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-zinc-100 text-sm focus:border-emerald-500 outline-none transition-all"
                  >
                    <option value="₺">₺ (TRY)</option>
                    <option value="$">$ (USD)</option>
                    <option value="€">€ (EUR)</option>
                    <option value="g">gram (GOLD)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Satış Hedefi</label>
                <input
                  required
                  type="number"
                  step="any"
                  value={formData.targetPrice}
                  onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                  className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-zinc-100 text-sm focus:border-emerald-500 outline-none transition-all"
                  placeholder="0.00"
                />
              </div>

              <button
                type="submit"
                className="mt-4 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-xl font-black text-sm transition-all shadow-[0_4px_20px_rgba(16,185,129,0.4)]"
              >
                <Plus size={18} />
                LİSTEYE EKLE
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
