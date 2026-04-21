import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

// 1. Terminal (Takip Listesi) Varlık Tipi
export interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: 'BIST' | 'US' | 'CRYPTO' | 'COMMODITY' | 'TEFAS' | 'BEFAS';
  strategy: 'Zarar Kes' | 'Kar Al' | 'Dirençten Al' | 'Destekten Al';
  entryPrice: number;
  targetPrice: number;
  currentPrice?: number;
  last4hPrice?: number;
  dailyChange?: number;
  currency: string;
  createdAt: number;
}

// 2. Hesap Tipi
export interface Account {
  id: string;
  name: string;
  isIncluded: boolean;
  createdAt: number;
}

// 3. Portföy (Gerçek Varlık) Tipi
export interface PortfolioItem {
  id: string;
  accountId: string;
  accountName?: string;
  assetType: 'BIST' | 'US' | 'CRYPTO' | 'COMMODITY' | 'TEFAS' | 'BEFAS';
  symbol: string;
  purchaseAt: string;
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
  accounts: Account[];
  portfolioHoldings: PortfolioItem[];
  indices: Record<string, { price: number; change: number; name: string }>;
  indexTargets: Record<string, { targetPrice: number; strategy: string }>;
  rates: { USD: number };
  isLoading: boolean;
  refreshCount: number;
  lastUpdated: string | null;
  isUpdating: boolean;

  // Actions - General
  triggerRefresh: () => void;
  setLastUpdated: (time: string) => void;
  setIsUpdating: (val: boolean) => void;
  syncFunds: () => Promise<void>;
  setIndices: (indices: Record<string, any>) => void;
  updateRates: (rates: { USD: number }) => void;
  updateIndices: (symbol: string, data: { price: number; change: number; name: string }) => void;
  updateIndexTarget: (symbol: string, targetPrice: number, strategy: string) => void;

  // Actions - Terminal
  fetchAssets: () => Promise<void>;
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt'>) => Promise<void>;
  removeAsset: (id: string) => Promise<void>;
  updateAsset: (id: string, updates: Partial<Asset>) => Promise<void>;
  updateAssetPrice: (id: string, data: Partial<Asset>) => void;

  // Actions - Accounts
  fetchAccounts: () => Promise<void>;
  addAccount: (name: string) => Promise<string | null>;
  removeAccount: (id: string) => Promise<void>;
  toggleAccountInclusion: (id: string, isIncluded: boolean) => Promise<void>;

  // Actions - Portfolio
  fetchPortfolio: () => Promise<void>;
  addPortfolioItem: (item: Omit<PortfolioItem, 'id' | 'createdAt' | 'accountName'>) => Promise<void>;
  removePortfolioItem: (id: string) => Promise<void>;
  updatePortfolioItem: (id: string, updates: Partial<PortfolioItem>) => Promise<void>;
  updatePortfolioPrice: (id: string, data: Partial<PortfolioItem>) => void;
  syncPortfolioToAssets: () => Promise<void>;
}

export const useAssetStore = create<AssetStore>()(
  persist(
    (set, get) => ({
      assets: [],
      accounts: [],
      portfolioHoldings: [],
      indices: {},
      indexTargets: {},
      rates: { USD: 0 },
      isLoading: false,
      refreshCount: 0,
      lastUpdated: null,
      isUpdating: false,

      triggerRefresh: () => set((state) => ({ refreshCount: state.refreshCount + 1 })),
      setLastUpdated: (time) => set({ lastUpdated: time }),
      setIsUpdating: (val) => set({ isUpdating: val }),
      syncFunds: async () => {
        set({ isUpdating: true });
        try {
          const res = await fetch('/api/sync', { method: 'POST' });
          if (!res.ok) throw new Error('Sync failed');
          const data = await res.json();
          console.log('[Store] Sync Success:', data);
          get().triggerRefresh(); // Veritabanı güncellendi, şimdi frontend yenilesin
        } catch (err) {
          console.error('[Store] Sync Error:', err);
        } finally {
          set({ isUpdating: false });
        }
      },
      setIndices: (indices) => set({ indices }),
      updateRates: (rates) => set({ rates }),
      
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
        const { assets, updateAsset } = get();
        const existingPending = assets.find(a => 
          a.targetPrice === 0 && 
          (a.symbol === asset.symbol || a.symbol.replace('.IS', '') === asset.symbol.replace('.IS', ''))
        );

        if (existingPending) {
          await updateAsset(existingPending.id, asset);
        } else {
          const { data, error } = await supabase.from('assets').insert([{
            symbol: asset.symbol,
            name: asset.name,
            type: asset.type,
            strategy: asset.strategy,
            entry_price: asset.entryPrice,
            target_price: asset.targetPrice,
            currency: asset.currency,
          }]).select().single();

          if (error) { 
            console.error('Add asset error:', error); 
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
        }
      },

      removeAsset: async (id) => {
        const { assets, portfolioHoldings, updateAsset } = get();
        const assetToRemove = assets.find(a => a.id === id);
        if (!assetToRemove) return;
        
        // Portföyde mi kontrolü
        const isInPortfolio = portfolioHoldings.some(h => 
          h.symbol === assetToRemove.symbol || 
          h.symbol.replace('.IS', '') === assetToRemove.symbol.replace('.IS', '')
        );

        // Zaten hedefi olmayan (chip) bir başka kopyası var mı?
        const alreadyHasPending = assets.some(a => 
          a.id !== id && 
          a.targetPrice === 0 && 
          (a.symbol === assetToRemove.symbol || a.symbol.replace('.IS', '') === assetToRemove.symbol.replace('.IS', ''))
        );

        // Hala hedefi olan BAŞKA bir kopyası var mı?
        const hasOtherActiveTargets = assets.some(a => 
          a.id !== id && 
          a.targetPrice > 0 && 
          (a.symbol === assetToRemove.symbol || a.symbol.replace('.IS', '') === assetToRemove.symbol.replace('.IS', ''))
        );

        // Bu bir "chip" mi?
        const isChip = assetToRemove.targetPrice === 0;

        if (isInPortfolio && !isChip && !alreadyHasPending && !hasOtherActiveTargets) {
          // Portföyde var VE bu son aktif hedefiyse VE henüz chip kopyası yoksa: Chip'e döndür
          await updateAsset(id, { targetPrice: 0 });
        } else {
          // Aktif başka hedefi varsa VEYA portföyde yoksa VEYA zaten bir chip kopyası varsa: DB'den tamamen sil
          await supabase.from('assets').delete().eq('id', id);
          set((state) => ({ assets: state.assets.filter((a) => a.id !== id) }));
        }
      },

      updateAsset: async (id, updates) => {
        const supabaseUpdates: any = {};
        if (updates.symbol !== undefined) supabaseUpdates.symbol = updates.symbol;
        if (updates.name !== undefined) supabaseUpdates.name = updates.name;
        if (updates.type !== undefined) supabaseUpdates.type = updates.type;
        if (updates.strategy !== undefined) supabaseUpdates.strategy = updates.strategy;
        if (updates.entryPrice !== undefined) supabaseUpdates.entry_price = updates.entryPrice;
        if (updates.targetPrice !== undefined) supabaseUpdates.target_price = updates.targetPrice;
        if (updates.currency !== undefined) supabaseUpdates.currency = updates.currency;

        await supabase.from('assets').update(supabaseUpdates).eq('id', id);
        set((state) => ({ assets: state.assets.map((a) => (a.id === id ? { ...a, ...updates } : a)) }));
      },

      updateAssetPrice: (id, data) => set((state) => ({
        assets: state.assets.map((a) => (a.id === id ? { ...a, ...data } : a))
      })),

      // ACCOUNTS METHODS
      fetchAccounts: async () => {
        const { data, error } = await supabase.from('accounts').select('*').order('name');
        if (!error && data) {
          set({ accounts: data.map(a => ({ 
            id: a.id, 
            name: a.name, 
            isIncluded: a.is_included,
            createdAt: new Date(a.created_at).getTime() 
          })) });
        }
      },

      addAccount: async (name) => {
        const { data, error } = await supabase.from('accounts').insert([{ name }]).select().single();
        if (error) { console.error('Add account error:', error); return null; }
        if (data) {
          const newAcc = { 
            id: data.id, 
            name: data.name, 
            isIncluded: data.is_included,
            createdAt: new Date(data.created_at).getTime() 
          };
          set(state => ({ accounts: [...state.accounts, newAcc] }));
          return data.id;
        }
        return null;
      },

      removeAccount: async (id) => {
        const { error } = await supabase.from('accounts').delete().eq('id', id);
        if (!error) {
          set(state => ({
            accounts: state.accounts.filter(a => a.id !== id),
            portfolioHoldings: state.portfolioHoldings.filter(h => h.accountId !== id)
          }));

          // HESAP SİLİNDİĞİNDE YETİM "CHIP"LERİ (HEDEFİ OLMAYAN VARLIKLAR) TEMİZLE
          const { assets, portfolioHoldings } = get();
          const orphanedChips = assets.filter(a => 
            a.targetPrice === 0 && 
            !portfolioHoldings.some(h => 
              h.symbol === a.symbol || 
              h.symbol.replace('.IS', '') === a.symbol.replace('.IS', '')
            )
          );

          for (const chip of orphanedChips) {
            await supabase.from('assets').delete().eq('id', chip.id);
            set(state => ({ assets: state.assets.filter(a => a.id !== chip.id) }));
          }
        }
      },

      toggleAccountInclusion: async (id, isIncluded) => {
        const { error } = await supabase.from('accounts').update({ is_included: isIncluded }).eq('id', id);
        if (!error) {
          set(state => ({
            accounts: state.accounts.map(a => a.id === id ? { ...a, isIncluded } : a)
          }));
        }
      },

      // PORTFOLIO METHODS
      fetchPortfolio: async () => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase
            .from('portfolio')
            .select('*, accounts(name)')
            .order('created_at', { ascending: true });

          if (error) throw error;
          if (data) {
            const holdings = data.map((item: any) => ({
              id: item.id,
              accountId: item.account_id,
              accountName: item.accounts?.name || 'Bilinmeyen Hesap',
              assetType: item.asset_type,
              symbol: item.symbol,
              purchaseAt: item.purchase_at,
              purchasePrice: item.purchase_price,
              amount: item.amount,
              currency: item.currency,
              createdAt: new Date(item.created_at).getTime(),
            }));
            set({ portfolioHoldings: holdings });

            // OTOMATİK YETİM CHIP TEMİZLİĞİ (SAYFA YÜKLENDİĞİNDE)
            const currentAssets = get().assets;
            const orphanedChips = currentAssets.filter(a => 
              a.targetPrice === 0 && 
              !holdings.some(h => 
                h.symbol === a.symbol || 
                h.symbol.replace('.IS', '') === a.symbol.replace('.IS', '')
              )
            );

            if (orphanedChips.length > 0) {
              for (const chip of orphanedChips) {
                await supabase.from('assets').delete().eq('id', chip.id);
              }
              set(state => ({
                assets: state.assets.filter(a => !orphanedChips.some(oc => oc.id === a.id))
              }));
            }
          }
        } catch (error) { console.error('Portfolio fetch error:', error); }
        finally { set({ isLoading: false }); }
      },

      addPortfolioItem: async (item) => {
        const { data, error } = await supabase.from('portfolio').insert([{
          account_id: item.accountId,
          asset_type: item.assetType,
          symbol: item.symbol,
          purchase_at: item.purchaseAt,
          purchase_price: item.purchasePrice,
          amount: item.amount,
          currency: item.currency,
        }]).select('*, accounts(name)').single();

        if (error) { console.error('Add portfolio item error:', error); return; }
        if (data) {
          const newItem: PortfolioItem = {
            id: data.id,
            accountId: data.account_id,
            accountName: data.accounts?.name,
            assetType: data.asset_type,
            symbol: data.symbol,
            purchaseAt: data.purchase_at,
            purchasePrice: data.purchase_price,
            amount: data.amount,
            currency: data.currency,
            createdAt: new Date(data.created_at).getTime(),
          };
          set((state) => ({ portfolioHoldings: [...state.portfolioHoldings, newItem] }));

          // OTOMATİK HEDEF TAKİBİ (TERMINAL) EKLEME
          // Sadece BIST, US ve CRYPTO için ve eğer halihazırda takip listesinde yoksa
          const autoSyncTypes = ['BIST', 'US', 'CRYPTO'];
          if (autoSyncTypes.includes(newItem.assetType)) {
            const currentAssets = get().assets;
            const alreadyInTargets = currentAssets.some(a => 
              a.symbol === newItem.symbol || 
              a.symbol.replace('.IS', '') === newItem.symbol.replace('.IS', '')
            );
            
            if (!alreadyInTargets) {
              await get().addAsset({
                symbol: newItem.symbol,
                name: newItem.symbol,
                type: newItem.assetType as any,
                strategy: 'Kar Al',
                entryPrice: newItem.purchasePrice,
                targetPrice: 0,
                currency: newItem.currency
              });
            }
          }
        }
      },

      removePortfolioItem: async (id) => {
        const { error } = await supabase.from('portfolio').delete().eq('id', id);
        if (!error) {
          set((state) => ({ portfolioHoldings: state.portfolioHoldings.filter((a) => a.id !== id) }));

          // VARLIK SİLİNDİĞİNDE YETİM "CHIP"LERİ TEMİZLE
          const { assets, portfolioHoldings } = get();
          const orphanedChips = assets.filter(a => 
            a.targetPrice === 0 && 
            !portfolioHoldings.some(h => 
              h.symbol === a.symbol || 
              h.symbol.replace('.IS', '') === a.symbol.replace('.IS', '')
            )
          );

          for (const chip of orphanedChips) {
            await supabase.from('assets').delete().eq('id', chip.id);
            set(state => ({ assets: state.assets.filter(a => a.id !== chip.id) }));
          }
        }
      },

      updatePortfolioItem: async (id, updates) => {
        const supabaseUpdates: any = {};
        if (updates.accountId) supabaseUpdates.account_id = updates.accountId;
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

      syncPortfolioToAssets: async () => {
        const { portfolioHoldings, assets, addAsset } = get();
        const autoSyncTypes = ['BIST', 'US', 'CRYPTO'];
        
        // 1. Portföydeki uygun tipteki benzersiz sembolleri bul
        const portfolioSymbols = portfolioHoldings
          .filter(h => autoSyncTypes.includes(h.assetType))
          .reduce((acc, h) => {
            if (!acc[h.symbol]) {
              acc[h.symbol] = { 
                symbol: h.symbol, 
                type: h.assetType, 
                price: h.purchasePrice, 
                currency: h.currency 
              };
            }
            return acc;
          }, {} as Record<string, any>);

        // 2. Eksik olanları ekle
        let addedCount = 0;
        for (const sym of Object.values(portfolioSymbols)) {
          const exists = assets.some(a => 
            a.symbol === sym.symbol || 
            a.symbol.replace('.IS', '') === sym.symbol.replace('.IS', '')
          );
          if (!exists) {
            const { error } = await supabase.from('assets').insert([{
              symbol: sym.symbol,
              name: sym.symbol,
              type: sym.type,
              strategy: 'Kar Al',
              entry_price: sym.price,
              target_price: 0,
              currency: sym.currency,
              created_at: Date.now()
            }]);
            addedCount++;
          }
        }
        
        if (addedCount > 0) {
          get().triggerRefresh();
        }
      },

    }),
    {
      name: 'asset-tracker-storage-v4',
      partialize: (state) => ({ assets: state.assets, portfolioHoldings: state.portfolioHoldings, accounts: state.accounts }),
    }
  )
);
