import { Category, Transaction, TransactionType } from '../types';

export interface CategorySuggestion {
  categoryId: string;
  categoryName: string;
  confidence: number;
  reason: string;
}

const normalize = (value: unknown) => String(value ?? '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const RULES: Record<string, string[]> = {
  vivienda: ['alquiler', 'expensa', 'hipoteca', 'inmobiliaria', 'hogar', 'rent'],
  comida: ['supermercado', 'super', 'almacen', 'verduleria', 'carniceria', 'panaderia', 'dietética', 'kiosco', 'comida', 'restaurante', 'delivery', 'pedido ya', 'rappi', 'coto', 'carrefour', 'dia', 'jumbo', 'disco', 'changomas', 'la anonima'],
  transporte: ['sube', 'colectivo', 'tren', 'bus', 'uber', 'didi', 'cabify', 'nafta', 'combustible', 'estacionamiento', 'peaje', 'taxi', 'moto', 'auto', 'garaje', 'garage'],
  servicios: ['luz', 'agua', 'gas', 'internet', 'telefono', 'celular', 'telefonia', 'edenor', 'edesur', 'metrogas', 'naturgy', 'personal', 'movistar', 'claro', 'fibertel', 'flow', 'telecom'],
  salud: ['farmacia', 'medico', 'medica', 'doctor', 'dentista', 'odontologo', 'psicologo', 'laboratorio', 'clinica', 'hospital', 'remedio', 'medicamento', 'medicamentos', 'obra social', 'prepaga'],
  suscripciones: ['netflix', 'spotify', 'youtube premium', 'youtube music', 'disney', 'disney plus', 'prime video', 'amazon prime', 'hbo', 'max', 'star plus', 'apple music', 'icloud', 'google one', 'dropbox', 'suscripcion', 'subscription'],
  entretenimiento: ['cine', 'teatro', 'boliche', 'bar', 'juego', 'videojuego', 'playstation', 'xbox', 'steam', 'evento', 'concierto', 'recital', 'entrada'],
  compras: ['ropa', 'zapatilla', 'zapatos', 'electronica', 'electrodomestico', 'mueble', 'regalo', 'shopping', 'mercadolibre', 'mercado libre', 'compra'],
  educacion: ['curso', 'universidad', 'facultad', 'colegio', 'escuela', 'libro', 'libreria', 'capacitacion', 'educacion', 'udemy', 'coursera'],
  sueldo: ['sueldo', 'salario', 'haberes', 'nomina', 'remuneracion'],
  otros_ingresos: ['transferencia recibida', 'venta', 'cobro', 'honorarios', 'freelance', 'bono', 'premio', 'reintegro', 'devolucion', 'ingreso'],
};

const isCompatible = (category: Category, type: TransactionType) => category.type === 'both' || category.type === type;

const keywordScore = (text: string, keyword: string) => {
  const normalizedKeyword = normalize(keyword);
  if (!normalizedKeyword) return 0;
  if (text.includes(normalizedKeyword)) return normalizedKeyword.includes(' ') ? 0.98 : 0.9;
  return 0;
};

export function suggestCategory(
  title: string,
  notes: string | undefined,
  type: TransactionType,
  categories: Category[],
  transactions: Transaction[] = []
): CategorySuggestion | null {
  const text = normalize(`${title} ${notes ?? ''}`);
  if (!text) return null;

  const compatible = categories.filter(category => isCompatible(category, type));
  if (!compatible.length) return null;

  // 1. Repeated concepts from the user's own history have the highest priority.
  const normalizedTitle = normalize(title);
  const repeated = transactions
    .filter(tx => tx.type === type && normalize(tx.title) === normalizedTitle)
    .map(tx => compatible.find(category => category.id === tx.categoryId))
    .filter((category): category is Category => Boolean(category));
  if (repeated.length) {
    const category = repeated[0];
    return {
      categoryId: category.id,
      categoryName: category.name,
      confidence: 0.99,
      reason: 'Coincide con un movimiento anterior de la misma categoría'
    };
  }

  let best: { category: Category; score: number; reason: string } | null = null;

  for (const category of compatible) {
    const ruleKeywords = RULES[category.id] ?? [];
    const ruleScore = Math.max(0, ...ruleKeywords.map(keyword => keywordScore(text, keyword)));
    const categoryNameScore = keywordScore(text, category.name);
    const score = Math.max(ruleScore, categoryNameScore * 0.85);
    if (score > (best?.score ?? 0)) {
      best = {
        category,
        score,
        reason: ruleScore > 0
          ? `Detectó una coincidencia con ${category.name}`
          : `Coincide con el nombre de la categoría ${category.name}`
      };
    }
  }

  if (!best || best.score < 0.65) return null;

  return {
    categoryId: best.category.id,
    categoryName: best.category.name,
    confidence: Math.min(0.96, best.score),
    reason: best.reason
  };
}

export function categorizeTransaction(
  transaction: Transaction,
  categories: Category[],
  transactions: Transaction[] = []
): Transaction {
  const suggestion = suggestCategory(transaction.title, transaction.notes, transaction.type, categories, transactions);
  if (!suggestion) return transaction;
  return { ...transaction, categoryId: suggestion.categoryId };
}
