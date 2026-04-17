import { useEffect, useCallback } from 'react';
import { useAssetStore } from '@/store/useAssetStore';

export function usePriceData() {
  const { updateAsset, updateIndices, refreshCount, setLastUpdated } = useAssetStore();

  const fetchPrices = useCallback(async () => {
    const assets = useAssetStore.getState().assets;
    const indexSymbols = ['XU100.IS', 'XU030.IS', 'USDTRY=X', '^GSPC', '^IXIC'];
    const assetSymbols = assets.map(a => a.symbol);
    const allSymbols = Array.from(new Set([...indexSymbols, ...assetSymbols]));
    
    if (allSymbols.length === 0) return;

    try {
      const response = await fetch(`/api/prices?symbols=${encodeURIComponent(allSymbols.join(','))}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          if (indexSymbols.includes(item.symbol)) {
            updateIndices(item.symbol, {
              price: item.price,
              change: item.changePercent,
              name: item.name
            });
          }

          const matchingAssets = assets.filter(a => a.symbol === item.symbol);
          if (matchingAssets.length > 0) {
            matchingAssets.forEach(asset => {
              updateAsset(asset.id, { 
                currentPrice: item.price,
                last4hPrice: item.last4hPrice,
                dailyChange: item.changePercent,
                name: item.name || asset.name 
              });
            });
          }
        });

        setLastUpdated(new Date().toLocaleTimeString('tr-TR', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        }));
      }
    } catch (error) {
      console.error('Price update failed:', error);
    }
  }, [updateAsset, updateIndices, setLastUpdated]);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // 1 dakikada bir güncelle
    return () => clearInterval(interval);
  }, [fetchPrices, refreshCount]);

  return { refresh: fetchPrices };
}
