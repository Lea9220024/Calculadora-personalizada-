import React, { useRef, useState } from 'react';
import { Download, Upload, FileText, Database, X, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { GradientIcon } from './GradientIcon';
import { Category, MonthlyBudget, Transaction, AppSettings } from '../types';
import { formatCurrency, formatDateSpanish } from '../utils/formatters';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categories: Category[];
  budgets: MonthlyBudget[];
  settings: AppSettings;
  onImportFullData: (data: {
    transactions: Transaction[];
    categories: Category[];
    budgets: MonthlyBudget[];
  }) => void;
  onResetSampleData: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  categories,
  budgets,
  settings,
  onImportFullData,
  onResetSampleData
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Export JSON
  const handleExportJSON = () => {
    const dataToExport = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      transactions,
      categories,
      budgets,
      settings
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mis_gastos_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setSuccessMsg('Respaldo JSON descargado correctamente.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Fecha', 'Tipo', 'Concepto', 'Monto', 'Categoría', 'Método de Pago', 'Recurrente', 'Notas'];
    
    const rows = transactions.map(tx => {
      const cat = categories.find(c => c.id === tx.categoryId)?.name || tx.categoryId;
      return [
        tx.id,
        tx.date,
        tx.type === 'expense' ? 'Gasto' : 'Ingreso',
        `"${tx.title.replace(/"/g, '""')}"`,
        tx.amount,
        `"${cat.replace(/"/g, '""')}"`,
        tx.paymentMethod,
        tx.isRecurring ? 'Sí' : 'No',
        `"${(tx.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mis_gastos_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setSuccessMsg('Archivo CSV exportado listo para Excel / Google Sheets.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Import JSON File
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.transactions && Array.isArray(parsed.transactions)) {
          onImportFullData({
            transactions: parsed.transactions,
            categories: parsed.categories || categories,
            budgets: parsed.budgets || budgets
          });
          setSuccessMsg(`¡Respaldo importado con éxito! (${parsed.transactions.length} movimientos)`);
          setTimeout(() => {
            setSuccessMsg('');
            onClose();
          }, 2000);
        } else {
          setErrorMsg('El archivo no tiene el formato válido de respaldo.');
        }
      } catch (err) {
        setErrorMsg('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-800 w-full max-w-md overflow-hidden flex flex-col text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-950 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <GradientIcon icon={Database} className="w-5 h-5" strokeWidth={2.4} />
            <h3 className="font-extrabold text-lg leading-tight text-white">Respaldos y Exportación</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800"
          >
            <GradientIcon icon={X} className="w-5 h-5" strokeWidth={2.2} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          
          {successMsg && (
            <div className="p-3 bg-orange-500/10 text-orange-300 rounded-xl text-xs font-semibold flex items-center gap-2 border border-orange-500/30">
              <GradientIcon icon={Check} className="w-4 h-4 shrink-0" strokeWidth={2.4} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-2 border border-rose-500/30">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <p className="text-xs text-zinc-400">
            Guarda una copia de seguridad local de todos tus datos en Pesos Argentinos o exporta tu reporte en Excel/CSV para análisis externo.
          </p>

          <div className="space-y-2 pt-2">
            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="w-full flex items-center justify-between p-3.5 bg-zinc-950 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-colors text-left group"
              id="export-csv-btn"
            >
              <div className="flex items-center gap-3">
                <GradientIcon icon={FileText} className="w-5 h-5" strokeWidth={2.2} />
                <div>
                  <h4 className="font-extrabold text-xs text-zinc-100 group-hover:text-orange-400 transition-colors">Exportar Planilla CSV</h4>
                  <p className="text-[11px] text-zinc-400">Para abrir en Excel o Google Sheets</p>
                </div>
              </div>
              <GradientIcon icon={Download} className="w-4 h-4" strokeWidth={2.2} />
            </button>

            {/* Export JSON */}
            <button
              onClick={handleExportJSON}
              className="w-full flex items-center justify-between p-3.5 bg-zinc-950 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-colors text-left group"
              id="export-json-btn"
            >
              <div className="flex items-center gap-3">
                <GradientIcon icon={Database} className="w-5 h-5" strokeWidth={2.2} />
                <div>
                  <h4 className="font-extrabold text-xs text-zinc-100 group-hover:text-amber-400 transition-colors">Guardar Copia de Seguridad JSON</h4>
                  <p className="text-[11px] text-zinc-400">Respaldo completo de la app</p>
                </div>
              </div>
              <GradientIcon icon={Download} className="w-4 h-4" strokeWidth={2.2} />
            </button>

            {/* Import JSON */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-between p-3.5 bg-zinc-950 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-colors text-left group"
              id="import-json-btn"
            >
              <div className="flex items-center gap-3">
                <GradientIcon icon={Upload} className="w-5 h-5" strokeWidth={2.2} />
                <div>
                  <h4 className="font-extrabold text-xs text-zinc-100 group-hover:text-orange-400 transition-colors">Restaurar Copia JSON</h4>
                  <p className="text-[11px] text-zinc-400">Cargar un archivo .json guardado previamente</p>
                </div>
              </div>
              <GradientIcon icon={Upload} className="w-4 h-4" strokeWidth={2.2} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />

            {/* Reset Sample Data */}
            <div className="pt-3 border-t border-zinc-800">
              <button
                onClick={() => {
                  if (window.confirm('¿Seguro que deseas cargar los datos de ejemplo iniciales?')) {
                    onResetSampleData();
                    onClose();
                  }
                }}
                className="w-full flex items-center justify-center gap-2 p-2.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl border border-dashed border-zinc-700 transition-colors"
                id="reset-sample-btn"
              >
                <GradientIcon icon={RefreshCw} className="w-3.5 h-3.5" strokeWidth={2.2} />
                <span>Restablecer Datos de Ejemplo</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
