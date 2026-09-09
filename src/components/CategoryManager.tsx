import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Tag, Check, X } from 'lucide-react';
import { Category, TransactionType } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { GradientIcon } from './GradientIcon';

interface CategoryManagerProps {
  categories: Category[];
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
}

const AVAILABLE_COLORS = [
  'bg-orange-600', 'bg-amber-500', 'bg-orange-500', 'bg-yellow-500',
  'bg-rose-500', 'bg-red-500', 'bg-amber-600', 'bg-rose-600',
  'bg-yellow-600', 'bg-zinc-600'
];

const AVAILABLE_ICONS = [
  'ShoppingBag', 'Home', 'Car', 'Zap', 'Film', 'HeartPulse',
  'CreditCard', 'Tag', 'GraduationCap', 'Briefcase', 'TrendingUp',
  'DollarSign', 'Coffee', 'Plane', 'Gift', 'Smile', 'Utensils', 'Dumbbell'
];

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Tag');
  const [color, setColor] = useState('bg-orange-500');
  const [type, setType] = useState<TransactionType>('expense');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId) {
      const existing = categories.find(c => c.id === editingId);
      if (existing) {
        onUpdateCategory({
          ...existing,
          name: name.trim(),
          icon,
          color,
          type
        });
      }
      setEditingId(null);
    } else {
      onAddCategory({
        name: name.trim(),
        icon,
        color,
        textColor: color.replace('bg-', 'text-'),
        type
      });
      setIsAdding(false);
    }

    // Reset
    setName('');
    setIcon('Tag');
    setColor('bg-orange-500');
    setType('expense');
  };

  const startEdit = (c: Category) => {
    setEditingId(c.id);
    setName(c.name);
    setIcon(c.icon);
    setColor(c.color);
    setType(c.type === 'both' ? 'expense' : c.type);
    setIsAdding(false);
  };

  return (
    <div className="bg-zinc-900/90 p-6 rounded-2xl border border-zinc-800 shadow-md space-y-6 text-zinc-100">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <GradientIcon icon={Tag} className="w-5 h-5" strokeWidth={2.4} />
            <span>Gestión de Categorías Personalizadas</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Personaliza las etiquetas para organizar tus gastos e ingresos en pesos argentinos.
          </p>
        </div>

        {!isAdding && !editingId && (
          <button
            onClick={() => {
              setIsAdding(true);
              setName('');
              setIcon('Tag');
              setColor('bg-orange-500');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 hover:bg-orange-400 text-black font-extrabold text-xs rounded-xl shadow-md transition-all self-start sm:self-auto"
            id="add-category-btn"
          >
            <Plus className="w-4 h-4 text-black" strokeWidth={2.8} />
            <span>Nueva Categoría</span>
          </button>
        )}
      </div>

      {/* Add / Edit Form Drawer */}
      {(isAdding || editingId) && (
        <form onSubmit={handleSave} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-zinc-100">
              {editingId ? 'Editar Categoría' : 'Agregar Nueva Categoría'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
              }}
              className="text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Nombre</label>
              <input
                type="text"
                required
                placeholder="Ej. Gimnasio, Mascotas..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-semibold text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                id="cat-name-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Aplica para</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TransactionType)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-semibold text-zinc-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="expense" className="bg-zinc-900">🟠 Gastos</option>
                <option value="income" className="bg-zinc-900">🟡 Ingresos</option>
              </select>
            </div>
          </div>

          {/* Color options */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Color</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-lg ${c} flex items-center justify-center transition-transform ${
                    color === c ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-zinc-950 scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  {color === c && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Icon picker */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Ícono</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`p-2 rounded-lg border text-zinc-300 hover:bg-zinc-800 transition-all ${
                    icon === ic ? 'border-orange-500 bg-orange-500/10 text-orange-400 font-bold' : 'border-zinc-800 bg-zinc-900'
                  }`}
                >
                  <CategoryIcon name={ic} className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
              }}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-orange-500 text-black font-extrabold text-xs rounded-lg shadow-sm hover:bg-orange-400"
            >
              Guardar Categoría
            </button>
          </div>
        </form>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {categories.map((c) => (
          <div
            key={c.id}
            className="p-3.5 bg-zinc-950/60 rounded-xl border border-zinc-800 flex items-center justify-between group hover:bg-zinc-800/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 text-white flex items-center justify-center shrink-0">
                <CategoryIcon name={c.icon} className="w-4 h-4" strokeWidth={2.4} />
              </div>
              <div>
                <h4 className="font-extrabold text-zinc-100 text-xs">{c.name}</h4>
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  {c.type === 'expense' ? '🟠 Gasto' : c.type === 'income' ? '🟡 Ingreso' : 'Ambos'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => startEdit(c)}
                className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800"
                title="Editar"
              >
                <GradientIcon icon={Edit2} className="w-3.5 h-3.5" strokeWidth={2.2} />
              </button>
              <button
                onClick={() => onDeleteCategory(c.id)}
                className="p-1 text-zinc-400 hover:text-rose-400 rounded hover:bg-rose-500/10"
                title="Eliminar"
              >
                <GradientIcon icon={Trash2} className="w-3.5 h-3.5" strokeWidth={2.2} />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
