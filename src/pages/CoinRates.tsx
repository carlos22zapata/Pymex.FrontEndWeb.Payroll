import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Coins, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Layout } from '../components/Layout';
import { DecimalInput } from '../components/DecimalInput';
import { coinsService } from '../services/coinsService';
import { coinQuotationsService } from '../services/coinQuotationsService';
import type { CoinsDto, CoinQuotationDto } from '../types';

const PAGE_SIZE = 10;

function formatDateForDisplay(iso: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins}`;
  } catch { return iso; }
}

function nowLocalDateTime(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${mins}`;
}

function localToISO(local: string): string {
  const match = local.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/);
  if (!match) return new Date().toISOString();
  const [, day, month, year, hours, mins] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(mins)).toISOString();
}

const emptyQuotation: CoinQuotationDto = {
  id: 0,
  date: '',
  observation: '',
  value: 0,
  coinId: 0,
  origin: 0,
};

export function CoinRatesPage() {
  const navigate = useNavigate();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const [coins, setCoins] = useState<CoinsDto[]>([]);
  const [selectedCoinId, setSelectedCoinId] = useState(0);
  const [quotations, setQuotations] = useState<CoinQuotationDto[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [editing, setEditing] = useState<CoinQuotationDto>({ ...emptyQuotation });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const loadCoins = useCallback(async () => {
    try {
      const result = await coinsService.getList(1, 100, '');
      if (result.isSuccess && result.value) {
        setCoins(result.value);
      }
    } catch {
      toast.error('Error al cargar monedas');
    }
  }, []);

  const loadPage = useCallback(async (coinId: number, pg: number, append: boolean) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoadingInitial(true);
    }
    try {
      const result = await coinQuotationsService.getList(pg, PAGE_SIZE, coinId);
      if (result.isSuccess && result.value) {
        const items = result.value;
        setQuotations((prev) => (append ? [...prev, ...items] : items));
        setHasMore(items.length === PAGE_SIZE);
      } else {
        if (!append) setQuotations([]);
        setHasMore(false);
      }
    } catch {
      toast.error('Error al cargar tasas');
    } finally {
      setIsLoadingInitial(false);
      setIsLoadingMore(false);
    }
  }, []);

  const reloadFromStart = useCallback((coinId: number) => {
    setPage(1);
    setHasMore(true);
    loadPage(coinId, 1, false);
  }, [loadPage]);

  useEffect(() => {
    loadCoins();
  }, [loadCoins]);

  useEffect(() => {
    if (selectedCoinId) {
      reloadFromStart(selectedCoinId);
    } else {
      setQuotations([]);
    }
  }, [selectedCoinId, reloadFromStart]);

  useEffect(() => {
    if (!selectedCoinId || !hasMore || isLoadingMore || isLoadingInitial) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadPage(selectedCoinId, nextPage, true);
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [selectedCoinId, page, hasMore, isLoadingMore, isLoadingInitial, loadPage]);

  const handleCoinChange = (coinId: number) => {
    setSelectedCoinId(coinId);
    cancelEdit();
  };

  const startAdd = () => {
    setEditing({
      ...emptyQuotation,
      coinId: selectedCoinId,
      date: nowLocalDateTime(),
    });
    setIsEditing(true);
  };

  const startEdit = (q: CoinQuotationDto) => {
    setEditing({ ...q, date: formatDateForDisplay(q.date) });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setEditing({ ...emptyQuotation });
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editing.coinId) {
      toast.error('Seleccione una moneda');
      return;
    }
    if (editing.value <= 0) {
      toast.error('Debe ingresar un valor mayor a cero');
      return;
    }
    const payload = { ...editing, date: localToISO(editing.date) };
    setIsSaving(true);
    try {
      if (editing.id === 0) {
        const result = await coinQuotationsService.insert(payload);
        if (result.isSuccess) {
          toast.success('Tasa registrada correctamente');
          cancelEdit();
          reloadFromStart(selectedCoinId);
        } else {
          toast.error(result.errorMessage ?? 'Error al insertar');
        }
      } else {
        const result = await coinQuotationsService.update(payload);
        if (result.isSuccess) {
          toast.success('Tasa actualizada correctamente');
          cancelEdit();
          reloadFromStart(selectedCoinId);
        } else {
          toast.error(result.errorMessage ?? 'Error al actualizar');
        }
      }
    } catch {
      toast.error('Error al guardar la tasa');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar esta tasa?')) return;
    setIsSaving(true);
    try {
      const result = await coinQuotationsService.delete(id);
      if (result.isSuccess) {
        toast.success('Tasa eliminada correctamente');
        reloadFromStart(selectedCoinId);
        if (editing.id === id) cancelEdit();
      } else {
        toast.error(result.errorMessage ?? 'Error al eliminar');
      }
    } catch {
      toast.error('Error al eliminar la tasa');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncBCV = async () => {
    if (!window.confirm('¿Obtener tasas actualizadas del BCV?')) return;
    setIsSyncing(true);
    try {
      const result = await coinQuotationsService.updateBCV();
      if (result.isSuccess) {
        toast.success('Tasas del BCV actualizadas correctamente');
        if (selectedCoinId) reloadFromStart(selectedCoinId);
      } else {
        toast.error(result.errorMessage ?? 'Error al sincronizar con BCV');
      }
    } catch {
      toast.error('Error de conexión con el BCV');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportExcel = async () => {
    if (!window.confirm('¿Importar tasas históricas desde archivos Excel?')) return;
    setIsImporting(true);
    try {
      const result = await coinQuotationsService.importExcel();
      if (result.isSuccess) {
        toast.success('Tasas históricas importadas correctamente');
        if (selectedCoinId) reloadFromStart(selectedCoinId);
      } else {
        toast.error(result.errorMessage ?? 'Error al importar desde Excel');
      }
    } catch {
      toast.error('Error de conexión al importar Excel');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Layout>
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8 py-2 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Tasa de Monedas</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Registro de cotizaciones de monedas</p>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">

        <div className="stat-card">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600">
              <Coins className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Moneda</label>
              <select
                value={selectedCoinId}
                onChange={(e) => handleCoinChange(Number(e.target.value))}
                className="input-field mt-1"
              >
                <option value={0}>Seleccione una moneda...</option>
                {coins.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.symbol})</option>
                ))}
              </select>
            </div>
            {selectedCoinId !== 0 && (
              <div className="flex items-center gap-2 mt-5">
                <button
                  type="button"
                  onClick={startAdd}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Nueva Tasa
                </button>
                <button
                  type="button"
                  onClick={handleSyncBCV}
                  disabled={isSyncing}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'BCV'}
                  {isSyncing ? 'Sincronizando...' : ''}
                </button>
                <button
                  type="button"
                  onClick={handleImportExcel}
                  disabled={isImporting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Excel'}
                  {isImporting ? 'Importando...' : ''}
                </button>
              </div>
            )}
          </div>

          {isEditing && (
            <div className="mb-6 p-4 border border-indigo-200 dark:border-indigo-800 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 space-y-4">
              <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                {editing.id === 0 ? 'Nueva Tasa' : 'Editar Tasa'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Fecha</label>
                  <input
                    type="text"
                    value={editing.date}
                    onChange={(e) => setEditing((prev) => ({ ...prev, date: e.target.value }))}
                    placeholder="dd/MM/yyyy HH:mm"
                    className="input-field"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Valor</label>
                  <DecimalInput
                    value={editing.value}
                    onChange={(v) => setEditing((prev) => ({ ...prev, value: v }))}
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Observación</label>
                  <input
                    type="text"
                    value={editing.observation}
                    onChange={(e) => setEditing((prev) => ({ ...prev, observation: e.target.value }))}
                    className="input-field"
                    placeholder="Opcional"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editing.id === 0 ? 'Registrar' : 'Actualizar'}
                </button>
                {editing.id !== 0 && (
                  <button
                    type="button"
                    onClick={() => handleDelete(editing.id)}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          )}

          {isLoadingInitial ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : selectedCoinId === 0 ? (
            <div className="flex items-center justify-center py-20 text-gray-400 dark:text-gray-500">
              Seleccione una moneda para ver sus tasas
            </div>
          ) : quotations.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-gray-400 dark:text-gray-500">
              No hay tasas registradas para esta moneda
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Fecha</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Valor</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Observación</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Origen</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400 w-24">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {quotations.map((q) => (
                    <tr key={q.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-4 text-gray-900 dark:text-white">{formatDateForDisplay(q.date)}</td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">
                        <DecimalInput
                          value={q.value}
                          onChange={() => {}}
                          className="input-field text-right inline-block w-32"
                          disabled
                        />
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{q.observation}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          q.origin === 2
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {q.origin === 2 ? 'BCV' : 'Manual'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(q)}
                            className="rounded-lg px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                            title="Editar"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(q.id)}
                            className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div ref={sentinelRef} className="h-4" />
              {isLoadingMore && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                </div>
              )}
              {!hasMore && quotations.length > PAGE_SIZE && (
                <p className="text-center text-xs text-gray-400 dark:text-gray-500 py-3">
                  Mostrando todas las cotizaciones ({quotations.length})
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
