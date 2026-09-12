import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { getPendingSupabaseSyncCount } from '../lib/supabaseSyncQueue';
import { flushPendingSupabaseSync } from '../lib/supabaseSyncRunner';

export const SupabaseStatusBadge: React.FC = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [retrying, setRetrying] = useState(false);

  const refreshCount = () => setPendingCount(getPendingSupabaseSyncCount());

  useEffect(() => {
    refreshCount();
    const timer = window.setInterval(refreshCount, 2000);
    window.addEventListener('supabase-sync-status', refreshCount);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('supabase-sync-status', refreshCount);
    };
  }, []);

  const retry = async () => {
    setRetrying(true);
    try {
      await flushPendingSupabaseSync();
    } finally {
      refreshCount();
      setRetrying(false);
    }
  };

  if (pendingCount === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400" title="No hay operaciones pendientes de sincronización">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Nube al día
      </span>
    );
  }

  return (
    <button
      onClick={retry}
      disabled={retrying}
      className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-orange-400 hover:text-orange-300 disabled:opacity-60 transition-colors"
      title={`${pendingCount} operación${pendingCount === 1 ? '' : 'es'} pendiente${pendingCount === 1 ? '' : 's'}. Toca para reintentar.`}
      aria-label={`${pendingCount} operaciones pendientes de sincronización. Reintentar ahora.`}
    >
      {retrying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
      {pendingCount} pendiente{pendingCount === 1 ? '' : 's'} · Reintentar
    </button>
  );
};
