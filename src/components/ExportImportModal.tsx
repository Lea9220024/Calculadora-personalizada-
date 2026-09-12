import React, { useRef, useState } from 'react';
import { Download, Upload, FileText, Database, X, Check, RefreshCw, AlertCircle, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { GradientIcon } from './GradientIcon';
import { Category, MonthlyBudget, Transaction, AppSettings } from '../types';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categories: Category[];
  budgets: MonthlyBudget[];
  settings: AppSettings;
  onImportFullData: (data: { transactions: Transaction[]; categories: Category[]; budgets: MonthlyBudget[]; settings: AppSettings }) => void;
  onResetSampleData: () => void;
  onOpenSafeImport: () => void;
}

const BACKUP_VERSION = '1.1';

const isValidSettings = (value: unknown): value is AppSettings => {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  return typeof data.currencySymbol === 'string' && typeof data.currencyCode === 'string' &&
    (data.theme === 'light' || data.theme === 'dark' || data.theme === 'system') &&
    typeof data.startDayOfMonth === 'number' && Number.isInteger(data.startDayOfMonth) && data.startDayOfMonth >= 1 && data.startDayOfMonth <= 31;
};

const isValidBackup = (value: unknown): value is { version?: string; transactions: Transaction[]; categories?: Category[]; budgets?: MonthlyBudget[]; settings?: AppSettings } => {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  return Array.isArray(data.transactions) && (data.categories === undefined || Array.isArray(data.categories)) &&
    (data.budgets === undefined || Array.isArray(data.budgets)) && (data.settings === undefined || isValidSettings(data.settings));
};

export const ExportImportModal: React.FC<ExportImportModalProps> = ({ isOpen, onClose, transactions, categories, budgets, settings, onImportFullData, onResetSampleData, onOpenSafeImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [pendingImport, setPendingImport] = useState<{ transactions: Transaction[]; categories: Category[]; budgets: MonthlyBudget[]; settings: AppSettings } | null>(null);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    const dataToExport = { app: 'Control de Gastos Mensuales', exportDate: new Date().toISOString(), version: BACKUP_VERSION, transactions, categories, budgets, settings };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `mis_gastos_backup_${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url);
    setErrorMsg(''); setSuccessMsg(`Respaldo completo creado: ${transactions.length} movimientos, ${categories.length} categorías y ${budgets.length} presupuestos.`); setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Fecha', 'Tipo', 'Concepto', 'Monto', 'Categoría', 'Método de Pago', 'Recurrente', 'Notas'];
    const escapeCSV = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = transactions.map(tx => {
      const cat = categories.find(c => c.id === tx.categoryId)?.name || tx.categoryId;
      return [escapeCSV(tx.id), tx.date, tx.type === 'expense' ? 'Gasto' : 'Ingreso', escapeCSV(tx.title), tx.amount, escapeCSV(cat), tx.paymentMethod, tx.isRecurring ? 'Sí' : 'No', escapeCSV(tx.notes || '')].join(',');
    });
    const blob = new Blob(['\uFEFF' + [headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `mis_gastos_${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
    setSuccessMsg('Archivo CSV exportado correctamente.'); setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
    setErrorMsg(''); setSuccessMsg('');
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed: unknown = JSON.parse(String(event.target?.result || ''));
        if (!isValidBackup(parsed)) { setErrorMsg('El archivo no tiene una estructura válida de respaldo.'); return; }
        const data = parsed as { version?: string; transactions: Transaction[]; categories?: Category[]; budgets?: MonthlyBudget[]; settings?: AppSettings };
        setPendingImport({ transactions: data.transactions, categories: data.categories || categories, budgets: data.budgets || budgets, settings: data.settings || settings });
        setSuccessMsg(`Respaldo válido detectado${data.version ? ` (v${data.version})` : ''}. Revisá el resumen y confirmá la restauración.`);
      } catch { setErrorMsg('No se pudo leer el archivo JSON. No se modificó ningún dato.'); }
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    onImportFullData(pendingImport); setSuccessMsg(`Restauración local completada: ${pendingImport.transactions.length} movimientos.`); setPendingImport(null);
    setTimeout(() => { setSuccessMsg(''); onClose(); }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-800 w-full max-w-md overflow-hidden flex flex-col text-zinc-100" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-950 border-b border-zinc-800"><div className="flex items-center gap-2"><GradientIcon icon={Database} className="w-5 h-5" strokeWidth={2.4} /><h3 className="font-extrabold text-lg leading-tight text-white">Respaldos y Exportación</h3></div><button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800" aria-label="Cerrar"><GradientIcon icon={X} className="w-5 h-5" /></button></div>
        <div className="p-6 space-y-4">
          <div className="p-3 bg-orange-500/10 text-orange-200 rounded-xl text-xs border border-orange-500/20 flex gap-2"><GradientIcon icon={ShieldCheck} className="w-4 h-4 shrink-0" /><span>Los movimientos importados se agregan de forma segura. La restauración JSON es una acción distinta y requiere confirmación.</span></div>
          {successMsg && <div className="p-3 bg-orange-500/10 text-orange-300 rounded-xl text-xs font-semibold flex items-center gap-2 border border-orange-500/30"><GradientIcon icon={Check} className="w-4 h-4 shrink-0" /><span>{successMsg}</span></div>}
          {errorMsg && <div className="p-3 bg-rose-500/10 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-2 border border-rose-500/30"><AlertCircle className="w-4 h-4 text-rose-400 shrink-0" /><span>{errorMsg}</span></div>}
          {pendingImport ? (
            <div className="space-y-3 p-4 bg-zinc-950 rounded-2xl border border-zinc-700"><div className="text-sm font-extrabold text-white">Confirmar restauración</div><div className="text-xs text-zinc-400">El archivo contiene:</div><ul className="text-xs text-zinc-200 space-y-1"><li>• {pendingImport.transactions.length} movimientos</li><li>• {pendingImport.categories.length} categorías</li><li>• {pendingImport.budgets.length} presupuestos</li><li>• Configuración incluida</li></ul><p className="text-[11px] text-amber-300">La restauración reemplazará los datos locales actuales por los del archivo, incluida la configuración.</p><div className="flex gap-2 pt-1"><button onClick={() => setPendingImport(null)} className="flex-1 p-2.5 text-xs font-bold text-zinc-300 bg-zinc-800 rounded-xl hover:bg-zinc-700">Cancelar</button><button onClick={confirmImport} className="flex-1 p-2.5 text-xs font-extrabold text-black bg-orange-400 rounded-xl hover:bg-orange-300">Confirmar restauración</button></div></div>
          ) : <>
            <p className="text-xs text-zinc-400">Usá la importación segura para sumar movimientos desde Excel/CSV sin tocar los datos que ya tenés cargados.</p>
            <div className="space-y-2 pt-2">
              <button onClick={onOpenSafeImport} className="w-full flex items-center justify-between p-3.5 bg-orange-500/10 hover:bg-orange-500/20 rounded-xl border border-orange-500/30 transition-colors text-left group"><div className="flex items-center gap-3"><GradientIcon icon={FileSpreadsheet} className="w-5 h-5" /><div><h4 className="font-extrabold text-xs text-orange-300">Importar movimientos Excel / CSV</h4><p className="text-[11px] text-zinc-400">Vista previa + detección de duplicados</p></div></div><GradientIcon icon={Upload} className="w-4 h-4" /></button>
              <button onClick={handleExportCSV} className="w-full flex items-center justify-between p-3.5 bg-zinc-950 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-colors text-left group"><div className="flex items-center gap-3"><GradientIcon icon={FileText} className="w-5 h-5" /><div><h4 className="font-extrabold text-xs text-zinc-100 group-hover:text-orange-400">Exportar Planilla CSV</h4><p className="text-[11px] text-zinc-400">Para Excel o Google Sheets</p></div></div><GradientIcon icon={Download} className="w-4 h-4" /></button>
              <button onClick={handleExportJSON} className="w-full flex items-center justify-between p-3.5 bg-zinc-950 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-colors text-left group"><div className="flex items-center gap-3"><GradientIcon icon={Database} className="w-5 h-5" /><div><h4 className="font-extrabold text-xs text-zinc-100 group-hover:text-amber-400">Guardar Copia de Seguridad JSON</h4><p className="text-[11px] text-zinc-400">Respaldo completo v{BACKUP_VERSION}</p></div></div><GradientIcon icon={Download} className="w-4 h-4" /></button>
              <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-between p-3.5 bg-zinc-950 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-colors text-left group"><div className="flex items-center gap-3"><GradientIcon icon={Upload} className="w-5 h-5" /><div><h4 className="font-extrabold text-xs text-zinc-100 group-hover:text-orange-400">Restaurar Copia JSON</h4><p className="text-[11px] text-zinc-400">Validar primero, confirmar después</p></div></div><GradientIcon icon={Upload} className="w-4 h-4" /></button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json,application/json" className="hidden" />
              <div className="pt-3 border-t border-zinc-800"><button onClick={() => { if (window.confirm('¿Seguro que deseas cargar los datos de ejemplo iniciales? Esta acción reemplazará los datos locales actuales.')) { onResetSampleData(); onClose(); } }} className="w-full flex items-center justify-center gap-2 p-2.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl border border-dashed border-zinc-700 transition-colors"><GradientIcon icon={RefreshCw} className="w-3.5 h-3.5" /><span>Restablecer Datos de Ejemplo</span></button></div>
            </div>
          </>}
        </div>
      </div>
    </div>
  );
};
