import React, { useEffect, useState } from 'react';
import { LogIn, LogOut, Cloud, ShieldCheck, X } from 'lucide-react';
import { supabase, supabaseUrl, supabasePublishableKey } from '../lib/supabase';
import { migrateLocalDataToSupabase } from '../lib/supabaseMigration';
import { AppSettings, Category, MonthlyBudget, Transaction } from '../types';

type Props = { isOpen: boolean; onClose: () => void; transactions: Transaction[]; categories: Category[]; budgets: MonthlyBudget[]; settings: AppSettings; };

const formatAuthError = (error: unknown) => {
  if (error instanceof Error) {
    const details = error as Error & { status?: number; code?: string; name?: string };
    const parts = [details.message];
    if (details.status) parts.push(`HTTP ${details.status}`);
    if (details.code) parts.push(`código: ${details.code}`);
    if (details.name && details.name !== 'Error') parts.push(`tipo: ${details.name}`);
    return parts.join(' · ');
  }
  return `Error inesperado: ${String(error)}`;
};

const checkSupabaseConnection = async () => {
  if (!supabaseUrl || !supabasePublishableKey) return { ok: false, detail: 'Faltan las variables VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY.' };
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/health`, { headers: { apikey: supabasePublishableKey } });
    const body = await response.text();
    if (!response.ok) return { ok: false, detail: `Supabase Auth respondió HTTP ${response.status}${body ? ` · ${body.slice(0, 160)}` : ' sin cuerpo de respuesta'} · URL: ${supabaseUrl}` };
    return { ok: true, detail: `Supabase Auth operativo · HTTP ${response.status} · URL: ${supabaseUrl}` };
  } catch (error) {
    return { ok: false, detail: `No se pudo conectar con Supabase desde este navegador · URL: ${supabaseUrl} · ${error instanceof Error ? error.message : String(error)}` };
  }
};

export const SupabaseSyncModal: React.FC<Props> = ({ isOpen, onClose, transactions, categories, budgets, settings }) => {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUserId(session?.user.id ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  if (!isOpen) return null;

  const handleAuth = async () => {
    if (!supabase) { setError('Supabase todavía no está configurado en este entorno.'); return; }
    setLoading(true); setError(''); setMessage('');
    try {
      const connection = await checkSupabaseConnection();
      if (!connection.ok) throw new Error(`Diagnóstico de conexión: ${connection.detail}`);
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authError) throw authError;
      setUserId(data.user?.id ?? null);
      setMessage('Sesión iniciada correctamente.');
    } catch (e) {
      console.error('Supabase Auth error:', e);
      setError(formatAuthError(e));
    } finally { setLoading(false); }
  };

  const handleMigration = async () => {
    if (!userId) return; setLoading(true); setError(''); setMessage('Copiando tus datos locales a Supabase…');
    try { const result = await migrateLocalDataToSupabase(userId, { transactions, categories, budgets, settings }); setMessage(`Migración verificada: ${result.transactions} movimientos, ${result.categories} categorías y ${result.budgets} presupuestos. Tus datos locales siguen intactos.`); }
    catch (e) { setError(e instanceof Error ? e.message : 'La migración no pudo completarse.'); }
    finally { setLoading(false); }
  };
  const handleLogout = async () => { if (!supabase) return; await supabase.auth.signOut(); setUserId(null); setMessage('Sesión cerrada.'); };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"><div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
    <div className="flex items-center justify-between p-5 border-b border-zinc-800"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center"><Cloud className="w-5 h-5 text-orange-400" /></div><div><h2 className="font-extrabold text-white">Nube y respaldo</h2><p className="text-xs text-zinc-500">Supabase · migración segura</p></div></div><button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900"><X className="w-5 h-5" /></button></div>
    <div className="p-5 space-y-5"><div className="flex gap-3 rounded-xl bg-zinc-900/70 border border-zinc-800 p-4 text-sm text-zinc-300"><ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400" /><p>La migración es manual. No borra localStorage, no reemplaza todavía la fuente actual y puede repetirse sin crear duplicados.</p></div>
      {!userId ? <div className="space-y-3"><h3 className="font-bold text-white">Iniciar sesión</h3><input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Tu email" className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-white outline-none focus:border-orange-500" /><input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Tu contraseña" className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-white outline-none focus:border-orange-500" /><button disabled={loading || !email || !password} onClick={handleAuth} className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-40 px-4 py-3 text-sm font-extrabold text-black"><LogIn className="w-4 h-4" /> {loading ? 'Verificando conexión…' : 'Iniciar sesión'}</button><p className="text-xs text-zinc-500">La cuenta debe existir previamente en Supabase Auth. No se crea ninguna cuenta automáticamente.</p></div>
      : <div className="space-y-4"><div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4"><p className="text-xs text-zinc-500">Sesión autenticada</p><p className="text-sm text-zinc-200 mt-1">Ya puedes copiar los datos locales a tu cuenta Supabase.</p></div><button disabled={loading} onClick={handleMigration} className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 px-4 py-3 text-sm font-extrabold text-black">{loading ? 'Procesando…' : 'Migrar mis datos a Supabase'}</button><button disabled={loading} onClick={handleLogout} className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-700 hover:bg-zinc-900 px-4 py-3 text-sm font-bold text-zinc-300"><LogOut className="w-4 h-4" /> Cerrar sesión</button></div>}
      {message && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{message}</div>}{error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
    </div></div></div>;
};