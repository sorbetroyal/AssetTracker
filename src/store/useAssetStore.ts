import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

// 1. Terminal (Takip Listesi) Varlık Tipi
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
  dailyChange?: number;
  currency: string;
  createdAt: number;
}

// 2. Portföy (Gerçek Varlık) Tipi
export interface PortfolioItem {
  id: string;
  accountName: string;
  assetType: 'BIST' | 'US' | 'CRYPTO' | 'COMMODITY' | 'BANK';
  symbol: string;
  purchaseAt: string; // ISO Date String
  purchasePrice: number;
  amount: number;
  currency: string;
  currentPrice?: number;
  dailyChange?: number;
  createdAt: number;
}

interface AssetStore {
  // States
  assets: Asset[];
  portfolioHoldings: PortfolioItem[];
  indices: Record<string, { price: number; change: number; name: string }>;
  indexTargets: Record<string, { targetPrice: number; strategy: string }>;
  isLoading: boolean;
  refreshCount: number;
  lastUpdated: string | null;
  isUpdating: boolean;

  // Actions - General
  triggerRefresh: () => void;
  setLastUpdated: (time: string) => void;
  setIsUpdating: (val: boolean) => void;
  setIndices: (indices: Record<string, any>) => void;
  updateIndices: (symbol: string, data: { price: number; change: number; name: string }) => void;
  updateIndexTarget: (symbol: string, targetPrice: number, strategy: string) => void;

  // Actions - Terminal (assets table)
  fetchAssets: () => Promise<void>;
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt'>) => Promise<void>;
  removeAsset: (id: string) => Promise<void>;
  updateAsset: (id: string, updates: Partial<Asset>) => Promise<void>;
  updateAssetPrice: (id: string, data: Partial<Asset>) => void; // Yeni

  // Actions - Portfolio (portfolio table)
  fetchPortfolio: () => Promise<void>;
  addPortfolioItem: (item: Omit<PortfolioItem, 'id' | 'createdAt'>) => Promise<void>;
  removePortfolioItem: (id: string) => Promise<void>;
  updatePortfolioItem: (id: string, updates: Partial<PortfolioItem>) => Promise<void>;
  updatePortfolioPrice: (id: string, data: Partial<PortfolioItem>) => void; // Yeni
}

export const useAssetStore = create<AssetStore>()(
  persist(
    (set, get) => ({
      assets: [],
      portfolioHoldings: [],
      indices: {},
      indexTargets: {},
      isLoading: false,
      refreshCount: 0,
      lastUpdated: null,
      isUpdating: false,

      triggerRefresh: () => set((state) => ({ refreshCount: state.refreshCount + 1 })),
      setLastUpdated: (time) => set({ lastUpdated: time }),
      setIsUpdating: (val) => set({ isUpdating: val }),
      setIndices: (indices) => set({ indices }),
      
      updateIndices: (symbol, data) => set((state) => ({
        indices: { ...state.indices, [symbol]: data }
      })),
      
      updateIndexTarget: (symbol, targetPrice, strategy) => set((state) => ({
        indexTargets: { ...state.indexTargets, [symbol]: { targetPrice, strategy } }
      })),

      // TERMINAL METHODS
      fetchAssets: async () => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase
            .from('assets')
            .select('*')
            .order('created_at', { ascending: true });

          if (error) throw error;
          if (data) {
            set({ assets: data.map((item: any) => ({
              id: item.id,
              symbol: item.symbol,
              name: item.name,
              type: item.type,
              strategy: item.strategy,
              entryPrice: item.entry_price,
              targetPrice: item.target_price,
              currency: item.currency,
              createdAt: new Date(item.created_at).getTime(),
            }))});
          }
        } catch (error) { console.error('Assets fetch error:', error); }
        finally { set({ isLoading: false }); }
      },

      addAsset: async (asset) => {
        const { data, error } = await supabase.from('assets').insert([{
          symbol: asset.symbol,
          name: asset.name,
          type: asset.type,
          strategy: asset.strategy,
          entry_price: asset.entryPrice,
          target_price: asset.targetPrice,
          currency: asset.currency,
        }]).select().single();

        if (error) { console.error('Add asset error:', error); return; }
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
        const { error } = await supabase.from('assets').delete().eq('id', id);
        if (!error) set((state) => ({ assets: state.assets.filter((a) => a.id !== id) }));
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

        await supabase.from('assets').update(supabaseUpdates).eq('id', id);
        set((state) => ({ assets: state.assets.map((a) => (a.id === id ? { ...a, ...updates } : a)) }));
      },

      updateAssetPrice: (id, data) => set((state) => ({
        assets: state.assets.map((a) => (a.id === id ? { ...a, ...data } : a))
      })),

      // PORTFOLIO METHODS
      fetchPortfolio: async () => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase
            .from('portfolio')
            .select('*')
            .order('created_at', { ascending: true });

          if (error) throw error;
          if (data) {
            set({ portfolioHoldings: data.map((item: any) => ({
              id: item.id,
              accountName: item.account_name,
              assetType: item.asset_type,
              symbol: item.symbol,
              purchaseAt: item.purchase_at,
              purchasePrice: item.purchase_price,
              amount: item.amount,
              currency: item.currency,
              createdAt: new Date(item.created_at).getTime(),
            }))});
          }
        } catch (error) { console.error('Portfolio fetch error:', error); }
        finally { set({ isLoading: false }); }
      },

      addPortfolioItem: async (item) => {
        const { data, error } = await supabase.from('portfolio').insert([{
          account_name: item.accountName,
          asset_type: item.assetType,
          symbol: item.symbol,
          purchase_at: item.purchaseAt,
          purchase_price: item.purchasePrice,
          amount: item.amount,
          currency: item.currency,
        }]).select().single();

        if (error) { console.error('Add portfolio item error:', error); return; }
        if (data) {
          const newItem: PortfolioItem = {
            id: data.id,
            accountName: data.account_name,
            assetType: data.asset_type,
            symbol: data.symbol,
            purchaseAt: data.purchase_at,
            purchasePrice: data.purchase_price,
            amount: data.amount,
            currency: data.currency,
            createdAt: new Date(data.created_at).getTime(),
          };
          set((state) => ({ portfolioHoldings: [...state.portfolioHoldings, newItem] }));
        }
      },

      removePortfolioItem: async (id) => {
        const { error } = await supabase.from('portfolio').delete().eq('id', id);
        if (!error) set((state) => ({ portfolioHoldings: state.portfolioHoldings.filter((a) => a.id !== id) }));
      },

      updatePortfolioItem: async (id, updates) => {
        const supabaseUpdates: any = {};
        if (updates.accountName) supabaseUpdates.account_name = updates.accountName;
        if (updates.assetType) supabaseUpdates.asset_type = updates.assetType;
        if (updates.symbol) supabaseUpdates.symbol = updates.symbol;
        if (updates.purchaseAt) supabaseUpdates.purchase_at = updates.purchaseAt;
        if (updates.purchasePrice) supabaseUpdates.purchase_price = updates.purchasePrice;
        if (updates.amount) supabaseUpdates.amount = updates.amount;
        if (updates.currency) supabaseUpdates.currency = updates.currency;

        await supabase.from('portfolio').update(supabaseUpdates).eq('id', id);
        set((state) => ({ portfolioHoldings: state.portfolioHoldings.map((a) => (a.id === id ? { ...a, ...updates } : a)) }));
      },

      updatePortfolioPrice: (id, data) => set((state) => ({
        portfolioHoldings: state.portfolioHoldings.map((a) => (a.id === id ? { ...a, ...data } : a))
      })),

    }),
    {
      name: 'asset-tracker-storage-v2',
      partialize: (state) => ({ assets: state.assets, portfolioHoldings: state.portfolioHoldings }),
    }
  )
);
