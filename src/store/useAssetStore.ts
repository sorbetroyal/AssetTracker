import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: 'BIST' | 'US' | 'CRYPTO' | 'COMMODITY';
  strategy: 'Zarar Kes' | 'Kar Al' | 'Dirençten Al' | 'Destekten Al';
  entryPrice: number;
  targetPrice: number;
  currentPrice?: number;
  last4hPrice?: number;
  dailyChange?: number; // Günlük yüzde değişim
  currency: string;
  createdAt: number;
}

interface AssetStore {
  assets: Asset[];
  indices: Record<string, { price: number; change: number; name: string }>;
  indexTargets: Record<string, { targetPrice: number; strategy: string }>;
  isLoading: boolean;
  refreshCount: number;
  triggerRefresh: () => void;
  fetchAssets: () => Promise<void>;
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt'>) => Promise<void>;
  removeAsset: (id: string) => Promise<void>;
  updateAsset: (id: string, updates: Partial<Asset>) => Promise<void>;
  updateIndices: (symbol: string, data: { price: number; change: number; name: string }) => void;
  updateIndexTarget: (symbol: string, targetPrice: number, strategy: string) => void;
  setIndices: (indices: Record<string, any>) => void;
}

export const useAssetStore = create<AssetStore>()(
  persist(
    (set, get) => ({
      assets: [],
      indices: {},
      indexTargets: {},
      isLoading: false,
      refreshCount: 0,
      triggerRefresh: () => set((state) => ({ refreshCount: state.refreshCount + 1 })),
      updateIndices: (symbol, data) => set((state) => ({
        indices: { ...state.indices, [symbol]: data }
      })),
      updateIndexTarget: (symbol, targetPrice, strategy) => set((state) => ({
        indexTargets: { ...state.indexTargets, [symbol]: { targetPrice, strategy } }
      })),

      fetchAssets: async () => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase
            .from('assets')
            .select('*')
            .order('created_at', { ascending: true });

          if (error) throw error;

          if (data) {
            const mappedAssets: Asset[] = data.map((item: any) => ({
              id: item.id,
              symbol: item.symbol,
              name: item.name,
              type: item.type,
              strategy: item.strategy,
              entryPrice: item.entry_price,
              targetPrice: item.target_price,
              currency: item.currency,
              createdAt: new Date(item.created_at).getTime(),
            }));
            set({ assets: mappedAssets });
          }
        } catch (error) {
          console.error('Supabase fetch error:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      addAsset: async (asset) => {
        const { data, error } = await supabase
          .from('assets')
          .insert([{
            symbol: asset.symbol,
            name: asset.name,
            type: asset.type,
            strategy: asset.strategy,
            entry_price: asset.entryPrice,
            target_price: asset.targetPrice,
            currency: asset.currency,
          }])
          .select()
          .single();

        if (error) {
          console.error('Supabase add error:', error);
          // Fallback to local if needed, but for now we expect Supabase
          const id = crypto.randomUUID();
          set((state) => ({ 
            assets: [...state.assets, { ...asset, id, createdAt: Date.now() }] 
          }));
          return;
        }

        if (data) {
          const newAsset: Asset = {
            id: data.id,
            symbol: data.symbol,
            name: data.name,
            type: data.type,
            strategy: data.strategy,
            entryPrice: data.entry_price,
            targetPrice: data.target_price,
            currency: data.currency,
            createdAt: new Date(data.created_at).getTime(),
          };
          set((state) => ({ assets: [...state.assets, newAsset] }));
        }
      },

      removeAsset: async (id) => {
        const { error } = await supabase
          .from('assets')
          .delete()
          .eq('id', id);

        if (error) console.error('Supabase remove error:', error);
        
        set((state) => ({ 
          assets: state.assets.filter((a) => a.id !== id) 
        }));
      },

      updateAsset: async (id, updates) => {
        const supabaseUpdates: any = {};
        if (updates.symbol) supabaseUpdates.symbol = updates.symbol;
        if (updates.name) supabaseUpdates.name = updates.name;
        if (updates.type) supabaseUpdates.type = updates.type;
        if (updates.strategy) supabaseUpdates.strategy = updates.strategy;
        if (updates.entryPrice) supabaseUpdates.entry_price = updates.entryPrice;
        if (updates.targetPrice) supabaseUpdates.target_price = updates.targetPrice;
        if (updates.currency) supabaseUpdates.currency = updates.currency;

        if (Object.keys(supabaseUpdates).length > 0) {
          const { error } = await supabase
            .from('assets')
            .update(supabaseUpdates)
            .eq('id', id);
          
          if (error) console.error('Supabase update error:', error);
        }

        set((state) => ({
          assets: state.assets.map((a) => a.id === id ? { ...a, ...updates } : a)
        }));
      },

      setIndices: (indices) => set({ indices }),
    }),
    {
      name: 'asset-tracker-storage',
      partialize: (state) => ({ assets: state.assets }), // Only persist assets locally
    }
  )
);

