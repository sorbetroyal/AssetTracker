'use client';

import { useEffect } from 'react';
import { AssetTable } from '@/components/dashboard/AssetTable';
import { usePriceData } from '@/hooks/usePriceData';
import { useAssetStore } from '@/store/useAssetStore';

export default function Home() {
  const fetchAssets = useAssetStore((state) => state.fetchAssets);

  // Başlangıçta verileri Supabase'den çek
  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Canlı veri takibi başlatılıyor
  usePriceData();

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col pt-10">
      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full">
        {/* Ana İçerik */}
        <AssetTable />
      </div>

      {/* Alt Bilgi Barı */}
      <footer className="h-8 border-t border-zinc-900 bg-zinc-950 px-4 flex items-center justify-between text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
        <div>Antigravity Asset Tracker v1.0</div>
        <div>Market Data: Yahoo Finance API Active</div>
      </footer>
    </main>
  );
}

