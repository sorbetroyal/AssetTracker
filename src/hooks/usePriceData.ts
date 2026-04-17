import { useEffect, useCallback } from 'react';
import { useAssetStore } from '@/store/useAssetStore';

export function usePriceData() {
  const { updateAssetPrice, updatePortfolioPrice, updateIndices, refreshCount, setLastUpdated, setIsUpdating } = useAssetStore();

  const fetchPrices = useCallback(async () => {
    setIsUpdating(true);
    const { assets, portfolioHoldings } = useAssetStore.getState();
    const indexSymbols = ['XU100.IS', 'XU030.IS', 'USDTRY=X', '^GSPC', '^IXIC'];
    
    // Hem terminal hem portföy sembollerini birleştir
    const assetSymbols = assets.map(a => a.symbol);
    const portfolioSymbols = portfolioHoldings.map(h => h.symbol);
    const allSymbols = Array.from(new Set([...indexSymbols, ...assetSymbols, ...portfolioSymbols]));
    
    if (allSymbols.length === 0) {
      setIsUpdating(false);
      return;
    }

    try {
      const response = await fetch(`/api/prices?symbols=${encodeURIComponent(allSymbols.join(','))}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();

      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          // 1. Endeksleri Güncelle
          if (indexSymbols.includes(item.symbol)) {
            updateIndices(item.symbol, {
              price: item.price,
              change: item.changePercent,
              name: item.name
            });
          }

          // 2. Terminal Varlıklarını Güncelle (Lightweight)
          const matchingAssets = assets.filter(a => a.symbol === item.symbol);
          matchingAssets.forEach(asset => {
            updateAssetPrice(asset.id, { 
              currentPrice: item.price,
              last4hPrice: item.last4hPrice,
              dailyChange: item.changePercent
            });
          });

          // 3. Portföy Varlıklarını Güncelle (Lightweight)
          const matchingPortfolio = portfolioHoldings.filter(h => h.symbol === item.symbol);
          matchingPortfolio.forEach(itemPH => {
            updatePortfolioPrice(itemPH.id, {
              currentPrice: item.price,
              dailyChange: item.changePercent
            });
          });
        });

        setLastUpdated(new Date().toLocaleTimeString('tr-TR', { 
          hour: '2-digit', minute: '2-digit', second: '2-digit' 
        }));
      }
    } catch (error) {
      console.error('Price update failed:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [updateAssetPrice, updatePortfolioPrice, updateIndices, setLastUpdated, setIsUpdating]);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // 1 dakikada bir güncelle
    return () => clearInterval(interval);
  }, [fetchPrices, refreshCount]);

  return { refresh: fetchPrices };
}
