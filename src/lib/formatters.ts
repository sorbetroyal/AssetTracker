export const formatCurrency = (value: number, currency: string = 'TRY') => {
  // ISO kodlarını sembollerden temizleyelim veya eşleyelim
  let currencyCode = currency.trim().toUpperCase();
  if (currencyCode === '₺') currencyCode = 'TRY';
  if (currencyCode === '$') currencyCode = 'USD';
  
  // Eğer hala geçersiz bir kod varsa veya 3 karakterden farklıysa TRY'ye dön
  if (!['TRY', 'USD', 'EUR', 'GBP'].includes(currencyCode)) {
    currencyCode = 'TRY';
  }

  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: currencyCode === 'TRY' ? 0 : 2,
    maximumFractionDigits: currencyCode === 'TRY' ? 0 : 2,
  }).format(value);
};

export const formatPercent = (value: number) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
};

export const formatNumber = (value: number) => {
  return new Intl.NumberFormat('tr-TR').format(value);
};
