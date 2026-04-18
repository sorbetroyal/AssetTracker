import { useEffect, useCallback } from 'react';
import { useAssetStore } from '@/store/useAssetStore';

export function usePriceData() {
  const { updateAssetPrice, updatePortfolioPrice, updateIndices, updateRates, refreshCount, setLastUpdated, setIsUpdating } = useAssetStore();

  const fetchPrices = useCallback(async () => {
    setIsUpdating(true);
    const { assets, portfolioHoldings } = useAssetStore.getState();
    const indexSymbols = ['XU100.IS', 'XU030.IS', 'USDTRY=X', '^GSPC', '^IXIC'];
    
    try {
      // Sembolleri tipleriyle birlikte paketle (Örn: US:QQQ, TEFAS:MAC)
      const assetPairs = assets.map(a => `${a.type}:${a.symbol}`);
      const portfolioPairs = portfolioHoldings.map(h => `${h.assetType}:${h.symbol}`);
      const indexPairs = indexSymbols.map(s => `INDEX:${s}`);
      const allPairs = Array.from(new Set([...indexPairs, ...assetPairs, ...portfolioPairs]));

      const response = await fetch(`/api/prices?pairs=${encodeURIComponent(allPairs.join(','))}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();

      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          // 0. Kur Güncelle (USD/TRY)
          if (item.symbol === 'USDTRY=X') {
            updateRates({ USD: item.price });
          }

          // 1. Endeksleri Güncelle
          if (indexSymbols.includes(item.symbol)) {
            updateIndices(item.symbol, {
              price: item.price,
              change: item.changePercent,
              name: item.name
            });
          }

          // 2. Terminal Varlıklarını Güncelle (Lightweight)
          const matchingAssets = assets.filter(a => a.symbol.trim().toUpperCase() === item.symbol.trim().toUpperCase());
          matchingAssets.forEach(asset => {
            updateAssetPrice(asset.id, { 
              currentPrice: item.price || 0,
              last4hPrice: item.last4hPrice,
              dailyChange: item.changePercent || 0
            });
          });

          // 3. Portföy Varlıklarını Güncelle (Lightweight)
          const matchingPortfolio = portfolioHoldings.filter(h => 
            h.symbol.trim().toUpperCase() === item.symbol.trim().toUpperCase() &&
            (item.type ? h.assetType === item.type : true)
          );
          matchingPortfolio.forEach(itemPH => {
            updatePortfolioPrice(itemPH.id, {
              currentPrice: item.price || 0,
              dailyChange: item.changePercent || 0
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
