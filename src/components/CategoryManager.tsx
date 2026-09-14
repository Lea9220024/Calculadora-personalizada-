import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Tag, Check, X } from 'lucide-react';
import { Category, TransactionType } from '../types';
import { CategoryIcon } from './CategoryIcon';

interface CategoryManagerProps {
  categories: Category[];
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
}

const AVAILABLE_COLORS = [
  'bg-emerald-600', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-600',
  'bg-blue-600', 'bg-indigo-500', 'bg-violet-500', 'bg-amber-500',
  'bg-rose-500', 'bg-zinc-600'
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
  const [color, setColor] = useState('bg-emerald-500');
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

    setName('');
    setIcon('Tag');
    setColor('bg-emerald-500');
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
    <div className="bg-[#171B26] p-6 rounded-2xl border border-zinc-800 shadow-sm space-y-6 text-zinc-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-white font-['Plus_Jakarta_Sans'] flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-400" />
            <span>Gestión & Taxonomía de Categorías</span>
          </h2>
          <p className="text-xs text-[#9AA6A0] mt-0.5">
            Configuración de etiquetas y rubros para la imputación forense de ingresos y egresos.
          </p>
        </div>

        {!isAdding && !editingId && (
          <button
            onClick={() => {
              setIsAdding(true);
              setName('');
              setIcon('Tag');
              setColor('bg-emerald-500');
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl shadow-sm transition-all self-start sm:self-auto"
            id="add-category-btn"
          >
            <Plus className="w-4 h-4 text-zinc-950" strokeWidth={2.8} />
            <span>Nueva Categoría</span>
          </button>
        )}
      </div>

      {(isAdding || editingId) && (
        <form onSubmit={handleSave} className="bg-[#1C1F2A] p-5 rounded-xl border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-white font-['Plus_Jakarta_Sans']">
              {editingId ? 'Editar Categoría' : 'Agregar Nueva Categoría'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
              }}
              className="text-[#9AA6A0] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-[#9AA6A0] uppercase mb-1">Nombre</label>
              <input
                type="text"
                required
                placeholder="Ej. Vivienda, Inversiones..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-[#171B26] border border-zinc-800 rounded-lg text-xs font-medium text-white focus:outline-none focus:border-emerald-500"
                id="cat-name-input"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#9AA6A0] uppercase mb-1">Aplica para</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TransactionType)}
                className="w-full px-3 py-2 bg-[#171B26] border border-zinc-800 rounded-lg text-xs font-medium text-white cursor-pointer focus:outline-none focus:border-emerald-500"
              >
                <option value="expense" className="bg-[#171B26]">Egresos</option>
                <option value="income" className="bg-[#171B26]">Ingresos</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#9AA6A0] uppercase mb-1">Color de Distinción</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-lg ${c} flex items-center justify-center transition-transform ${
                    color === c ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-[#1C1F2A] scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  {color === c && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#9AA6A0] uppercase mb-1">Iconografía</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`p-2 rounded-lg border text-zinc-300 hover:bg-[#171B26] transition-all ${
                    icon === ic ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold' : 'border-zinc-800 bg-[#171B26]'
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
              className="px-3 py-1.5 text-xs text-[#9AA6A0] hover:bg-[#171B26] rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-500 text-zinc-950 font-bold text-xs rounded-lg shadow-sm hover:bg-emerald-400"
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
            className="p-3.5 bg-[#1C1F2A] rounded-xl border border-zinc-800 flex items-center justify-between group hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[#171B26] border border-zinc-800 text-emerald-400 flex items-center justify-center shrink-0">
                <CategoryIcon name={c.icon} className="w-4 h-4" strokeWidth={2.4} />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-white text-xs truncate">{c.name}</h4>
                <span className="text-[10px] font-mono text-[#9AA6A0] uppercase tracking-wider block">
                  {c.type === 'expense' ? 'Egreso' : c.type === 'income' ? 'Ingreso' : 'Dual'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => startEdit(c)}
                className="p-1.5 text-[#9AA6A0] hover:text-white rounded-lg hover:bg-[#171B26]"
                title="Editar"
              >
                <Edit2 className="w-3.5 h-3.5" strokeWidth={2.2} />
              </button>
              <button
                onClick={() => onDeleteCategory(c.id)}
                className="p-1.5 text-[#9AA6A0] hover:text-rose-400 rounded-lg hover:bg-rose-500/10"
                title="Eliminar"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={2.2} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
