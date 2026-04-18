'use client';

import { useEffect } from 'react';
import { AssetTable } from '@/components/dashboard/AssetTable';
import { PortfolioOverview } from '@/components/dashboard/PortfolioOverview';
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
  const { fetchAssets, fetchAccounts, fetchPortfolio } = useAssetStore();
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
        {/* Navigasyon Barı */}
        <nav className="flex items-center justify-center mb-10 px-4">
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

