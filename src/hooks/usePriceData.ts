import { useEffect, useCallback } from 'react';
import { useAssetStore } from '@/store/useAssetStore';

export function usePriceData() {
  const { assets, updateAsset } = useAssetStore();

  const fetchPrices = useCallback(async () => {
    if (assets.length === 0) return;

    try {
      const symbols = assets.map(a => a.symbol).join(',');
      // POST yerine GET kullanıyoruz ve sembolleri query param olarak gönderiyoruz
      const response = await fetch(`/api/prices?symbols=${encodeURIComponent(symbols)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          const matchingAssets = assets.filter(a => a.symbol === item.symbol);
          if (matchingAssets.length > 0) {
            matchingAssets.forEach(asset => {
              updateAsset(asset.id, { 
                currentPrice: item.price,
                last4hPrice: item.last4hPrice, // İşte burası artık çalışacak!
                name: item.name || asset.name 
              });
            });
          }
        });
      }
    } catch (error) {
      console.error('Price update failed:', error);
    }
  }, [assets, updateAsset]);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // 30 saniyede bir güncelle
    return () => clearInterval(interval);
  }, [fetchPrices]);

  return { refresh: fetchPrices };
}
