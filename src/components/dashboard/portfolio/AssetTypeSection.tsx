'use client';

import React from 'react';
import { ChevronRight, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { AssetDetailCard } from './AssetDetailCard';

interface AssetTypeSectionProps {
  groupedByAssetType: Record<string, { items: any[]; total: number }>;
  expandedTypes: Set<string>;
  toggleType: (type: string) => void;
  removeAsset: (id: string) => void;
  rates: { USD: number };
}

export const AssetTypeSection: React.FC<AssetTypeSectionProps> = ({
  groupedByAssetType,
  expandedTypes,
  toggleType,
  removeAsset,
  rates
}) => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 overflow-hidden">
      <div className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] mb-8 font-mono">Varlık Dağılımı</div>
      <div className="space-y-4">
        {Object.entries(groupedByAssetType).map(([type, data]) => {
          const isExpanded = expandedTypes.has(type);

          return (
            <div key={type} className="flex flex-col">
              <button 
                onClick={() => toggleType(type)}
                className={`flex items-center justify-between p-6 rounded-[1.5rem] transition-all duration-300 group ${
                  isExpanded ? 'bg-zinc-800 border-zinc-700' : 'bg-transparent border-transparent hover:bg-zinc-800/50'
                } border`}
              >
                <div className="flex items-center gap-4">
                  <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}>
                    <ChevronRight size={18} className="text-zinc-500" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-lg font-black text-white uppercase tracking-tighter italic">
                      {type}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                      {data.items.length} VARLIK
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-zinc-300 tracking-tighter">
                    {formatCurrency(data.total)}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 ml-6 pl-4 border-l-2 border-zinc-800 animate-in slide-in-from-top-4 duration-500">
                  {data.items.map(asset => (
                    <AssetDetailCard 
                      key={asset.id} 
                      asset={asset} 
                      rates={rates} 
                      onRemove={removeAsset} 
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
