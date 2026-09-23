import React, { useRef, useState } from 'react';
import { Download, Upload, FileText, Database, X, Check, RefreshCw, AlertCircle, ShieldCheck, FileSpreadsheet, RotateCcw } from 'lucide-react';
import { GradientIcon } from './GradientIcon';
import { AppSettings, Category, FinancialCard, FutureCommitment, InstallmentPlan, MonthlyBudget, NetWorthSnapshot, PatrimonyItem, Subscription, Transaction } from '../types';
import { BACKUP_VERSION, CreamBackup, createBackup, isValidBackup, loadSafetyBackup } from '../lib/backup';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categories: Category[];
  budgets: MonthlyBudget[];
  settings: AppSettings;
  cards: FinancialCard[];
  installmentPlans: InstallmentPlan[];
  subscriptions: Subscription[];
  patrimonyItems: PatrimonyItem[];
  netWorthSnapshots: NetWorthSnapshot[];
  futureCommitments: FutureCommitment[];
  onImportFullData: (data: Omit<CreamBackup, 'app' | 'exportDate' | 'version'>) => void;
  onResetSampleData: () => void;
  onOpenSafeImport: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen, onClose, transactions, categories, budgets, settings, cards, installmentPlans,
  subscriptions, patrimonyItems, netWorthSnapshots, futureCommitments,
  onImportFullData, onResetSampleData, onOpenSafeImport
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [pendingImport, setPendingImport] = useState<CreamBackup | null>(null);

  if (!isOpen) return null;

  const currentData = () => createBackup({
    transactions, categories, budgets, settings, cards, installmentPlans,
    subscriptions, patrimonyItems, netWorthSnapshots, futureCommitments
  });

  const downloadBackup = (backup: CreamBackup, label: string) => {
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cream_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setErrorMsg('');
    setSuccessMsg(label);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleExportJSON = () => {
    const backup = currentData();
    downloadBackup(backup, `Respaldo integral v${BACKUP_VERSION}: ${backup.transactions.length} movimientos, ${backup.cards.length} tarjetas, ${backup.subscriptions.length} suscripciones, ${backup.patrimonyItems.length} registros patrimoniales y ${backup.futureCommitments.length} compromisos.`);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Fecha', 'Tipo', 'Concepto', 'Monto', 'Categoría', 'Método de Pago', 'Recurrente', 'Notas'];
    const escapeCSV = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = transactions.map(tx => {
      const cat = categories.find(c => c.id === tx.categoryId)?.name || tx.categoryId;
      return [escapeCSV(tx.id), tx.date, tx.type === 'expense' ? 'Gasto' : 'Ingreso', escapeCSV(tx.title), tx.amount, escapeCSV(cat), tx.paymentMethod, tx.isRecurring ? 'Sí' : 'No', escapeCSV(tx.notes || '')].join(',');
    });
    const blob = new Blob(['\\uFEFF' + [headers.join(','), ...rows].join('\\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `cream_movimientos_${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
    setSuccessMsg('Archivo CSV exportado correctamente.'); setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
    setErrorMsg(''); setSuccessMsg('');
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed: unknown = JSON.parse(String(event.target?.result || ''));
        if (!isValidBackup(parsed)) {
          setErrorMsg('El archivo no tiene una estructura válida de respaldo. No se modificó ningún dato.');
          return;
        }
        const data = parsed as Partial<CreamBackup> & { transactions: Transaction[] };
        const complete: CreamBackup = createBackup({
          transactions: data.transactions,
          categories: data.categories ?? categories,
          budgets: data.budgets ?? budgets,
          settings: data.settings ?? settings,
          cards: data.cards ?? cards,
          installmentPlans: data.installmentPlans ?? installmentPlans,
          subscriptions: data.subscriptions ?? subscriptions,
          patrimonyItems: data.patrimonyItems ?? patrimonyItems,
          netWorthSnapshots: data.netWorthSnapshots ?? netWorthSnapshots,
          futureCommitments: data.futureCommitments ?? futureCommitments
        });
        setPendingImport(complete);
        setSuccessMsg(`Respaldo válido detectado${data.version ? ` (v${data.version})` : ''}. Revisá el resumen y confirmá.`);
      } catch {
        setErrorMsg('No se pudo leer el archivo JSON. No se modificó ningún dato.');
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    onImportFullData({
      transactions: pendingImport.transactions, categories: pendingImport.categories, budgets: pendingImport.budgets,
      settings: pendingImport.settings, cards: pendingImport.cards, installmentPlans: pendingImport.installmentPlans,
      subscriptions: pendingImport.subscriptions, patrimonyItems: pendingImport.patrimonyItems,
      netWorthSnapshots: pendingImport.netWorthSnapshots, futureCommitments: pendingImport.futureCommitments
    });
    setSuccessMsg(`Restauración integral completada: ${pendingImport.transactions.length} movimientos y ${pendingImport.patrimonyItems.length} registros patrimoniales.`);
    setPendingImport(null);
    setTimeout(() => { setSuccessMsg(''); onClose(); }, 1800);
  };

  const handleSafetyRecovery = () => {
    const safety = loadSafetyBackup();
    if (!safety) {
      setErrorMsg('No hay un respaldo de seguridad integral disponible en este dispositivo.');
      return;
    }
    setPendingImport(safety);
    setErrorMsg('');
    setSuccessMsg(`Último respaldo de seguridad encontrado: ${new Date(safety.exportDate).toLocaleString()}.`);
  };

  const resetSamples = () => {
    if (window.confirm('Se creará un respaldo de seguridad automático antes de reemplazar todos los datos locales. ¿Continuar?')) {
      onResetSampleData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-800 w-full max-w-lg overflow-hidden flex flex-col text-zinc-100" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-950 border-b border-zinc-800">
          <div className="flex items-center gap-2"><GradientIcon icon={Database} className="w-5 h-5" strokeWidth={2.4}/><h3 className="font-extrabold text-lg text-white">Respaldos y recuperación</h3></div>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800" aria-label="Cerrar"><GradientIcon icon={X} className="w-5 h-5"/></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-3 bg-orange-500/10 text-orange-200 rounded-xl text-xs border border-orange-500/20 flex gap-2">
            <GradientIcon icon={ShieldCheck} className="w-4 h-4 shrink-0"/><span>5.33 protege los 10 dominios de datos de C.R.E.A.M. antes de restauraciones o reinicios.</span>
          </div>
          {successMsg && <div className="p-3 bg-orange-500/10 text-orange-300 rounded-xl text-xs font-semibold flex items-center gap-2 border border-orange-500/30"><GradientIcon icon={Check} className="w-4 h-4 shrink-0"/><span>{successMsg}</span></div>}
          {errorMsg && <div className="p-3 bg-rose-500/10 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-2 border border-rose-500/30"><AlertCircle className="w-4 h-4 text-rose-400 shrink-0"/><span>{errorMsg}</span></div>}

          {pendingImport ? (
            <div className="space-y-3 p-4 bg-zinc-950 rounded-2xl border border-zinc-700">
              <div className="text-sm font-extrabold text-white">Confirmar restauración integral</div>
              <div className="text-xs text-zinc-400">El respaldo contiene:</div>
              <ul className="text-xs text-zinc-200 space-y-1">
                <li>• {pendingImport.transactions.length} movimientos</li><li>• {pendingImport.categories.length} categorías</li>
                <li>• {pendingImport.budgets.length} presupuestos</li><li>• {pendingImport.cards.length} tarjetas / {pendingImport.installmentPlans.length} planes de cuotas</li>
                <li>• {pendingImport.subscriptions.length} suscripciones</li><li>• {pendingImport.patrimonyItems.length} registros patrimoniales / {pendingImport.netWorthSnapshots.length} snapshots</li>
                <li>• {pendingImport.futureCommitments.length} compromisos futuros</li>
              </ul>
              <p className="text-[11px] text-amber-300">Antes de reemplazar los datos actuales se guarda automáticamente una copia de seguridad local.</p>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setPendingImport(null)} className="flex-1 p-2.5 text-xs font-bold text-zinc-300 bg-zinc-800 rounded-xl hover:bg-zinc-700">Cancelar</button>
                <button onClick={confirmImport} className="flex-1 p-2.5 text-xs font-extrabold text-black bg-orange-400 rounded-xl hover:bg-orange-300">Confirmar restauración</button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs text-zinc-400">El respaldo JSON v{BACKUP_VERSION} incluye movimientos, categorías, presupuestos, configuración, tarjetas, cuotas, suscripciones, patrimonio, snapshots y compromisos futuros.</p>
              <div className="space-y-2 pt-2">
                <button onClick={onOpenSafeImport} className="w-full flex items-center justify-between p-3.5 bg-orange-500/10 hover:bg-orange-500/20 rounded-xl border border-orange-500/30 transition-colors text-left group"><div className="flex items-center gap-3"><GradientIcon icon={FileSpreadsheet} className="w-5 h-5"/><div><h4 className="font-extrabold text-xs text-orange-300">Importar movimientos Excel / CSV</h4><p className="text-[11px] text-zinc-400">Vista previa + detección de duplicados</p></div></div><GradientIcon icon={Upload} className="w-4 h-4"/></button>
                <button onClick={handleExportCSV} className="w-full flex items-center justify-between p-3.5 bg-zinc-950 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-colors text-left group"><div className="flex items-center gap-3"><GradientIcon icon={FileText} className="w-5 h-5"/><div><h4 className="font-extrabold text-xs text-zinc-100 group-hover:text-orange-400">Exportar Planilla CSV</h4><p className="text-[11px] text-zinc-400">Solo movimientos para Excel / Sheets</p></div></div><GradientIcon icon={Download} className="w-4 h-4"/></button>
                <button onClick={handleExportJSON} className="w-full flex items-center justify-between p-3.5 bg-zinc-950 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-colors text-left group"><div className="flex items-center gap-3"><GradientIcon icon={Database} className="w-5 h-5"/><div><h4 className="font-extrabold text-xs text-zinc-100 group-hover:text-amber-400">Guardar respaldo integral JSON</h4><p className="text-[11px] text-zinc-400">Copia externa completa v{BACKUP_VERSION}</p></div></div><GradientIcon icon={Download} className="w-4 h-4"/></button>
                <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-between p-3.5 bg-zinc-950 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-colors text-left group"><div className="flex items-center gap-3"><GradientIcon icon={Upload} className="w-5 h-5"/><div><h4 className="font-extrabold text-xs text-zinc-100 group-hover:text-orange-400">Restaurar respaldo JSON</h4><p className="text-[11px] text-zinc-400">Validar primero, confirmar después</p></div></div><GradientIcon icon={Upload} className="w-4 h-4"/></button>
                <button onClick={handleSafetyRecovery} className="w-full flex items-center justify-between p-3.5 bg-zinc-950 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-colors text-left group"><div className="flex items-center gap-3"><GradientIcon icon={RotateCcw} className="w-5 h-5"/><div><h4 className="font-extrabold text-xs text-zinc-100">Recuperar último respaldo de seguridad</h4><p className="text-[11px] text-zinc-400">Copia automática previa a la última operación destructiva</p></div></div><GradientIcon icon={RotateCcw} className="w-4 h-4"/></button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json,application/json" className="hidden"/>
                <div className="pt-3 border-t border-zinc-800"><button onClick={resetSamples} className="w-full flex items-center justify-center gap-2 p-2.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl border border-dashed border-zinc-700 transition-colors"><GradientIcon icon={RefreshCw} className="w-3.5 h-3.5"/><span>Restablecer datos de ejemplo</span></button></div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
