'use client';

import { useEffect } from 'react';
import { AssetTable } from '@/components/dashboard/AssetTable';
import PortfolioOverview from '@/components/dashboard/PortfolioOverview';
import { usePriceData } from '@/hooks/usePriceData';
import { useAssetStore } from '@/store/useAssetStore';
import { useState } from 'react';
import { LayoutGrid, PieChart } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Home() {
  const { fetchAssets, fetchAccounts, fetchPortfolio, isUpdating, lastUpdated, syncFunds } = useAssetStore();
  const [activeTab, setActiveTab] = useState<'terminal' | 'portfolio'>('terminal');

  // Başlangıçta verileri Supabase'den çek
  useEffect(() => {
    fetchAssets();
    fetchAccounts();
    fetchPortfolio();
  }, [fetchAssets, fetchAccounts, fetchPortfolio]);

  // Canlı veri takibi başlatılıyor
  usePriceData();

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col pt-10">
      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full">
        {/* Üst Kısım: Güncelleme ve Sekmeler */}
        <div className="flex flex-col items-center gap-6 mb-10 px-4">
          {/* Güncelleme Çubuğu */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => syncFunds()}
              disabled={isUpdating}
              className={cn(
                "px-4 py-2 border border-white/10 rounded-full text-xs font-black text-zinc-300 hover:text-white transition-all uppercase tracking-widest flex items-center gap-2 active:scale-95 shadow-lg",
                isUpdating ? "bg-white/5 opacity-50 cursor-not-allowed" : "bg-zinc-900/50 hover:bg-zinc-800"
              )}
            >
              <svg className={cn("w-4 h-4", isUpdating && "animate-spin")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isUpdating ? 'GÜNCELLENİYOR...' : 'GÜNCELLE'}
            </button>
            {lastUpdated && <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">SON GÜNCELLEME: {lastUpdated}</span>}
          </div>

          {/* Navigasyon Barı */}
          <nav className="flex items-center justify-center">
            <div className="bg-zinc-900/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl flex gap-1 shadow-2xl">
              <button
                onClick={() => setActiveTab('terminal')}
                className={cn(
                  "flex items-center gap-3 px-6 py-2.5 rounded-[1.1rem] text-xs font-black tracking-widest transition-all",
                  activeTab === 'terminal' 
                    ? "bg-white text-black shadow-xl scale-105" 
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                )}
              >
                <LayoutGrid size={16} />
                Hedef Takibi
              </button>
              <button
                onClick={() => setActiveTab('portfolio')}
                className={cn(
                  "flex items-center gap-3 px-6 py-2.5 rounded-[1.1rem] text-xs font-black tracking-widest transition-all",
                  activeTab === 'portfolio' 
                    ? "bg-white text-black shadow-xl scale-105" 
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                )}
              >
                <PieChart size={16} />
                Varlık Takibi
              </button>
            </div>
          </nav>
        </div>

        {/* Ana İçerik */}
        {activeTab === 'terminal' ? <AssetTable /> : <PortfolioOverview />}
      </div>

      {/* Alt Bilgi Barı */}
      <footer className="h-8 border-t border-zinc-900 bg-zinc-950 px-4 flex items-center justify-between text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
        <div>Antigravity Asset Tracker v1.0</div>
        <div>Market Data: Yahoo Finance API Active</div>
      </footer>
    </main>
  );
}

