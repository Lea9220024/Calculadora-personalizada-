import React, { useRef, useState } from 'react';
import { AlertCircle, Check, FileSpreadsheet, ShieldCheck, Upload, X, Sparkles } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Category, PaymentMethod, Transaction, TransactionType } from '../types';
import { GradientIcon } from './GradientIcon';
import { suggestCategory } from '../utils/autoCategorization';

interface SafeImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categories: Category[];
  onImportTransactions: (transactions: Transaction[]) => void;
}

type PreviewRow = { tx: Transaction; duplicate: boolean; error?: string; autoCategorized?: boolean };

const normalize = (value: unknown) => String(value ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const key = (value: unknown) => normalize(value).replace(/\s+/g, ' ');

const findValue = (row: Record<string, unknown>, aliases: string[]) => {
  const entries = Object.entries(row);
  const wanted = aliases.map(normalize);
  const found = entries.find(([name]) => wanted.includes(normalize(name)));
  return found?.[1];
};

const parseAmount = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.abs(value);
  let raw = String(value ?? '').trim().replace(/[^0-9,.-]/g, '');
  if (!raw) return null;
  if (raw.includes(',') && raw.includes('.')) raw = raw.lastIndexOf(',') > raw.lastIndexOf('.') ? raw.replace(/\./g, '').replace(',', '.') : raw.replace(/,/g, '');
  else if (raw.includes(',')) raw = raw.replace(',', '.');
  const amount = Number(raw);
  return Number.isFinite(amount) ? Math.abs(amount) : null;
};

const parseDate = (value: unknown): string | null => {
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
  }
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return `${iso[1]}-${String(Number(iso[2])).padStart(2, '0')}-${String(Number(iso[3])).padStart(2, '0')}`;
  const dmy = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${String(Number(dmy[2])).padStart(2, '0')}-${String(Number(dmy[1])).padStart(2, '0')}`;
  const date = new Date(raw);
  if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  return null;
};

const parseType = (value: unknown): TransactionType => {
  const v = normalize(value);
  return v.includes('ingreso') || v === 'income' || v === 'entrada' || v === 'haber' ? 'income' : 'expense';
};

const parsePaymentMethod = (value: unknown): PaymentMethod => {
  const v = normalize(value);
  if (v.includes('credito')) return 'tarjeta_credito';
  if (v.includes('debito')) return 'tarjeta_debito';
  if (v.includes('transfer')) return 'transferencia';
  if (v.includes('efect')) return 'efectivo';
  return 'otro';
};

const fingerprint = (tx: Transaction) => [tx.date, key(tx.title), tx.amount.toFixed(2), tx.type, tx.categoryId, tx.paymentMethod].join('|');
const createId = () => `tx-import-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const SafeImportModal: React.FC<SafeImportModalProps> = ({ isOpen, onClose, transactions, categories, onImportTransactions }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const reset = () => { setPreview([]); setFileName(''); setError(''); setSuccess(''); };

  const parseRows = (rows: Record<string, unknown>[]) => {
    const existing = new Set(transactions.map(fingerprint));
    const seen = new Set<string>();
    const result: PreviewRow[] = rows.map((row, index) => {
      const date = parseDate(findValue(row, ['Fecha', 'Date', 'Día', 'Dia']));
      const title = String(findValue(row, ['Concepto', 'Descripcion', 'Descripción', 'Detalle', 'Titulo', 'Título', 'Description']) ?? '').trim();
      const amount = parseAmount(findValue(row, ['Monto', 'Importe', 'Amount', 'Valor', 'Total']));
      const type = parseType(findValue(row, ['Tipo', 'Type', 'Movimiento']));
      const categoryRaw = String(findValue(row, ['Categoría', 'Categoria', 'Category']) ?? '').trim();
      const category = categories.find(c => normalize(c.name) === normalize(categoryRaw) && (c.type === 'both' || c.type === type));
      const suggestion = !category ? suggestCategory(title, String(findValue(row, ['Notas', 'Nota', 'Notes', 'Observaciones']) ?? '').trim(), type, categories, transactions) : null;
      const paymentMethod = parsePaymentMethod(findValue(row, ['Método de Pago', 'Metodo de Pago', 'Medio de Pago', 'Forma de Pago', 'Payment Method']));
      const notes = String(findValue(row, ['Notas', 'Nota', 'Notes', 'Observaciones']) ?? '').trim();
      const recurring = normalize(findValue(row, ['Recurrente', 'Recurring'])) === 'si' || normalize(findValue(row, ['Recurrente', 'Recurring'])) === 'true';
      const problems: string[] = [];
      if (!date) problems.push('fecha inválida');
      if (!title) problems.push('concepto vacío');
      if (amount === null || amount <= 0) problems.push('monto inválido');
      if (!category && !suggestion) problems.push(categoryRaw ? `categoría no encontrada: ${categoryRaw}` : 'categoría faltante y no se pudo inferir');
      if (problems.length) return { tx: { id: `invalid-${index}`, title, amount: amount || 0, type, categoryId: category?.id || suggestion?.categoryId || '', date: date || '', paymentMethod, notes, isRecurring: recurring, createdAt: new Date().toISOString() }, duplicate: false, error: problems.join(', ') };
      const tx: Transaction = { id: createId(), title, amount: amount!, type, categoryId: category?.id || suggestion!.categoryId, date: date!, paymentMethod, notes: notes || undefined, isRecurring: recurring, createdAt: new Date().toISOString() };
      const fp = fingerprint(tx);
      const duplicate = existing.has(fp) || seen.has(fp);
      seen.add(fp);
      return { tx, duplicate, autoCategorized: !category && Boolean(suggestion) };
    });
    setPreview(result);
  };

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    reset();
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = reader.result;
        let rows: Record<string, unknown>[] = [];
        if (file.name.toLowerCase().endsWith('.csv')) {
          const text = String(data ?? '').replace(/^\uFEFF/, '');
          const workbook = XLSX.read(text, { type: 'string' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
        } else {
          const workbook = XLSX.read(data, { type: 'array', cellDates: false });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
        }
        if (!rows.length) throw new Error('El archivo no contiene filas de movimientos.');
        parseRows(rows);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo leer el archivo.');
      }
    };
    if (file.name.toLowerCase().endsWith('.csv')) reader.readAsText(file, 'UTF-8');
    else reader.readAsArrayBuffer(file);
  };

  const validNew = preview.filter(r => !r.error && !r.duplicate).map(r => r.tx);
  const duplicates = preview.filter(r => r.duplicate).length;
  const errors = preview.filter(r => r.error).length;
  const autoCategorized = preview.filter(r => r.autoCategorized).length;

  const confirmImport = () => {
    if (!validNew.length) return;
    onImportTransactions(validNew);
    setSuccess(`${validNew.length} movimientos nuevos agregados. ${autoCategorized} categorizados automáticamente. ${duplicates} duplicados y ${errors} errores quedaron fuera.`);
    setPreview([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col text-zinc-100">
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-950 border-b border-zinc-800">
          <div className="flex items-center gap-3"><GradientIcon icon={FileSpreadsheet} className="w-5 h-5" /><div><h3 className="font-extrabold text-lg">5.25 · Importación segura</h3><p className="text-[11px] text-zinc-400">Excel / CSV · agregar sin reemplazar</p></div></div>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800" aria-label="Cerrar"><GradientIcon icon={X} className="w-5 h-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="p-3 bg-orange-500/10 text-orange-200 rounded-xl text-xs border border-orange-500/20 flex gap-2"><GradientIcon icon={ShieldCheck} className="w-4 h-4 shrink-0" /><span><b>Protección de datos:</b> esta importación solo agrega movimientos nuevos. Nunca reemplaza ni elimina tus movimientos existentes.</span></div>
          <div className="p-3 bg-violet-500/10 text-violet-200 rounded-xl text-xs border border-violet-500/20 flex gap-2"><Sparkles className="w-4 h-4 shrink-0" /><span><b>Categorización automática:</b> si el archivo no trae una categoría válida, C.R.E.A.M. la infiere usando el concepto, notas y tus movimientos anteriores.</span></div>
          {error && <div className="p-3 bg-rose-500/10 text-rose-300 rounded-xl text-xs font-semibold flex gap-2 border border-rose-500/30"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
          {success && <div className="p-3 bg-emerald-500/10 text-emerald-300 rounded-xl text-xs font-semibold flex gap-2 border border-emerald-500/30"><Check className="w-4 h-4 shrink-0" />{success}</div>}

          {!preview.length ? <>
            <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950 p-6 text-center">
              <GradientIcon icon={Upload} className="w-8 h-8 mx-auto mb-3" />
              <p className="text-sm font-bold text-white">Seleccioná tu Excel o CSV</p>
              <p className="text-xs text-zinc-500 mt-1">Primera hoja · encabezados en la primera fila</p>
              <button onClick={() => inputRef.current?.click()} className="mt-4 px-5 py-2.5 rounded-xl bg-orange-400 text-black text-xs font-extrabold hover:bg-orange-300">Seleccionar archivo</button>
              <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" onChange={handleFile} className="hidden" />
            </div>
            <div className="text-[11px] text-zinc-500">Columnas reconocidas: <span className="text-zinc-300">Fecha, Concepto, Monto, Tipo, Categoría, Método de Pago, Recurrente y Notas.</span> Los nombres pueden variar levemente.</div>
          </> : <>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300">{validNew.length} nuevos</span>
              <span className="px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-300">{autoCategorized} auto-categorizados</span>
              <span className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300">{duplicates} duplicados</span>
              <span className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-300">{errors} errores</span>
            </div>
            <p className="text-xs text-zinc-400">Archivo: <span className="text-zinc-200">{fileName}</span> · Se encontraron {preview.length} filas.</p>
            <div className="rounded-2xl border border-zinc-800 overflow-hidden">
              <div className="max-h-80 overflow-auto">
                <table className="w-full text-left text-[11px]"><thead className="sticky top-0 bg-zinc-950 text-zinc-400"><tr><th className="p-3">Estado</th><th className="p-3">Fecha</th><th className="p-3">Concepto</th><th className="p-3">Categoría</th><th className="p-3 text-right">Monto</th></tr></thead><tbody>{preview.slice(0, 100).map((row, i) => <tr key={i} className="border-t border-zinc-800"><td className="p-3">{row.error ? <span className="text-rose-400">Error</span> : row.duplicate ? <span className="text-zinc-500">Duplicado</span> : <span className="text-emerald-400">Nuevo</span>}</td><td className="p-3 text-zinc-300">{row.tx.date || '—'}</td><td className="p-3 text-zinc-200"><div>{row.tx.title || '—'}</div>{row.error && <div className="text-rose-400 mt-1">{row.error}</div>}</td><td className="p-3 text-zinc-300">{categories.find(c => c.id === row.tx.categoryId)?.name || '—'}{row.autoCategorized && <span className="ml-1 text-violet-300">✦</span>}</td><td className="p-3 text-right text-zinc-200">{row.tx.amount ? row.tx.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 }) : '—'}</td></tr>)}</tbody></table>
              </div>
              {preview.length > 100 && <p className="p-2 text-center text-[10px] text-zinc-500 border-t border-zinc-800">Mostrando las primeras 100 filas. El resumen contempla todas.</p>}
            </div>
            <div className="flex gap-2"><button onClick={reset} className="flex-1 p-3 rounded-xl bg-zinc-800 text-zinc-200 text-xs font-bold hover:bg-zinc-700">Cancelar / elegir otro</button><button onClick={confirmImport} disabled={!validNew.length} className="flex-1 p-3 rounded-xl bg-orange-400 text-black text-xs font-extrabold disabled:opacity-40 disabled:cursor-not-allowed">Importar {validNew.length} nuevos</button></div>
          </>}
        </div>
      </div>
    </div>
  );
};
