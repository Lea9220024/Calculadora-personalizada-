export const DEFAULT_CURRENCY = '$';

export const formatCurrency = (amount: number, currencySymbol: string = DEFAULT_CURRENCY): string => {
  const formatted = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
  
  const sign = amount < 0 ? '-' : '';
  return `${sign}${currencySymbol} ${formatted}`;
};

export const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const formatMonthYear = (monthKey: string): string => {
  if (!monthKey || !monthKey.includes('-')) return '';
  const [yearStr, monthStr] = monthKey.split('-');
  const monthIdx = parseInt(monthStr, 10) - 1;
  if (monthIdx >= 0 && monthIdx < 12) {
    return `${MONTH_NAMES_ES[monthIdx]} ${yearStr}`;
  }
  return monthKey;
};

export const getCurrentMonthKey = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateSpanish = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  
  const date = new Date(year, month, day);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export const getAdjacentMonthKey = (currentMonthKey: string, offset: number): string => {
  const [yearStr, monthStr] = currentMonthKey.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) - 1; // 0-indexed
  
  month += offset;
  
  while (month < 0) {
    month += 12;
    year -= 1;
  }
  while (month > 11) {
    month -= 12;
    year += 1;
  }
  
  const newMonthStr = String(month + 1).padStart(2, '0');
  return `${year}-${newMonthStr}`;
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta_debito: 'Tarjeta de Débito',
  tarjeta_credito: 'Tarjeta de Crédito',
  transferencia: 'Transferencia',
  otro: 'Otro'
};
