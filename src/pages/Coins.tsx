import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, Loader2, Coins } from 'lucide-react';
import toast from 'react-hot-toast';
import { Layout } from '../components/Layout';
import { OptionsBar } from '../components/OptionsBar';
import { Toggle } from '../components/Toggle';
import { SearchModal } from '../components/SearchModal';
import { coinsService } from '../services/coinsService';
import type { CoinsDto } from '../types';

const emptyEntity: CoinsDto = {
  id: 0,
  name: '',
  symbol: '',
  enabled: true,
  idWeb: '',
};

export function CoinsPage() {
  const navigate = useNavigate();
  const [entity, setEntity] = useState<CoinsDto>({ ...emptyEntity });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searchRecords, setSearchRecords] = useState<{ id: number; code: string; name: string }[]>([]);
  const searchFilterRef = useRef('');
  const [navId, setNavId] = useState(0);

  const handleFieldChange = (field: keyof CoinsDto, value: unknown) => {
    setEntity((prev) => ({ ...prev, [field]: value }));
  };

  const validate = (): string | null => {
    if (!entity.name.trim()) return 'Debe ingresar el nombre de la moneda';
    if (!entity.symbol.trim()) return 'Debe ingresar el símbolo de la moneda';
    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }
    setIsSaving(true);
    try {
      if (entity.id === 0) {
        const result = await coinsService.insert(entity);
        if (result.isSuccess) {
          toast.success('Moneda registrada correctamente');
          handleNew();
        } else {
          toast.error(result.errorMessage ?? 'Error al insertar');
        }
      } else {
        const result = await coinsService.update(entity);
        if (result.isSuccess) {
          toast.success('Moneda actualizada correctamente');
        } else {
          toast.error(result.errorMessage ?? 'Error al actualizar');
        }
      }
    } catch {
      toast.error('Error al guardar la moneda');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (entity.id === 0) return;
    if (!window.confirm('¿Está seguro de eliminar esta moneda?')) return;
    setIsSaving(true);
    try {
      const result = await coinsService.delete(entity.id);
      if (result.isSuccess) {
        toast.success('Moneda eliminada correctamente');
        handleNew();
      } else {
        toast.error(result.errorMessage ?? 'Error al eliminar');
      }
    } catch {
      toast.error('Error al eliminar la moneda');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNew = () => {
    setEntity({ ...emptyEntity });
    setNavId(0);
  };

  const navigateRecord = async (navPositionId: number) => {
    if (isSaving) { toast.error('Espere a que termine el guardado...'); return; }
    const currentId = navId || entity.id;
    if (currentId === 0 && (navPositionId === 1 || navPositionId === 2)) return;
    try {
      const result = await coinsService.getNavBarById(navPositionId, navPositionId === 0 || navPositionId === 3 ? 0 : currentId);
      if (result.isSuccess && result.value) {
        setNavId(result.value.id);
        setEntity(result.value);
      } else {
        toast.error(result.errorMessage ?? 'No hay más registros');
      }
    } catch {
      toast.error('Error al navegar');
    }
  };

  const handleSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    setSearchPage(1);
    searchFilterRef.current = query;
    try {
      const result = await coinsService.getList(1, 21, query);
      if (result.isSuccess && result.value) {
        if (result.value.length === 1) {
          const single = result.value[0];
          setEntity({ ...single });
          setNavId(single.id);
          setSearchQuery('');
          toast.success('Registro encontrado y cargado');
        } else {
          setSearchRecords(
            result.value.slice(0, 20).map((r) => ({
              id: r.id,
              code: r.symbol,
              name: r.name,
            }))
          );
          setHasMore(result.value.length > 20);
          setSearchModalOpen(true);
        }
      }
    } catch {
      toast.error('Error al buscar');
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchModalSearch = useCallback(
    async (filter: string) => {
      setIsSearching(true);
      setSearchPage(1);
      searchFilterRef.current = filter;
      try {
        const result = await coinsService.getList(1, 21, filter);
        if (result.isSuccess && result.value) {
          setSearchRecords(
            result.value.slice(0, 20).map((r) => ({
              id: r.id,
              code: r.symbol,
              name: r.name,
            }))
          );
          setHasMore(result.value.length > 20);
        }
      } catch {
        toast.error('Error al buscar');
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  const handleLoadMore = useCallback(async () => {
    const nextPage = searchPage + 1;
    setIsSearching(true);
    try {
      const result = await coinsService.getList(nextPage, 21, searchFilterRef.current);
      if (result.isSuccess && result.value) {
        const mapped = result.value.map((r) => ({
          id: r.id,
          code: r.symbol,
          name: r.name,
        }));
        setSearchRecords((prev) => [...prev, ...mapped]);
        setHasMore(result.value.length > 20);
        setSearchPage(nextPage);
      }
    } catch {
      toast.error('Error al buscar');
    } finally {
      setIsSearching(false);
    }
  }, [searchPage]);

  const selectSearchResult = async (record: { id: number; code: string; name: string; [key: string]: unknown }) => {
    setSearchModalOpen(false);
    setIsLoading(true);
    try {
      const result = await coinsService.getById(record.id);
      if (result.isSuccess && result.value) {
        setEntity(result.value);
        setNavId(result.value.id);
        setSearchQuery('');
        toast.success('Registro cargado');
      } else {
        toast.error(result.errorMessage ?? 'Error al cargar registro');
      }
    } catch {
      toast.error('Error al cargar el registro');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8 py-2 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Monedas</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Registro de monedas</p>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <OptionsBar
                onNew={handleNew}
                onSave={handleSave}
                onDelete={handleDelete}
                onSearch={() => handleSearch(searchQuery)}
                isSaving={isSaving}
                canDelete={entity.id !== 0}
                onFirst={() => navigateRecord(0)}
                onPrevious={() => navigateRecord(1)}
                onNext={() => navigateRecord(2)}
                onLast={() => navigateRecord(3)}
                showNav={true}
              />
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch(searchQuery);
                  }}
                  placeholder="Presione F2 para buscar un registro"
                  className="input-field !pl-9 w-48"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">

        <div className="stat-card">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600">
                  <Coins className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {entity.id === 0 ? 'Nueva moneda' : `Moneda #${entity.id}`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={entity.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    className="input-field"
                    placeholder="Ej: Dólar Americano"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Símbolo
                  </label>
                  <input
                    type="text"
                    value={entity.symbol}
                    onChange={(e) => handleFieldChange('symbol', e.target.value)}
                    className="input-field"
                    placeholder="Ej: USD"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Id Web (BCV)
                </label>
                <input
                  type="text"
                  value={entity.idWeb}
                  onChange={(e) => handleFieldChange('idWeb', e.target.value)}
                  className="input-field"
                  placeholder="Ej: dolar, euro"
                />
              </div>

              <div className="pt-2">
                <Toggle
                  id="enabled"
                  checked={entity.enabled}
                  onChange={(e) => handleFieldChange('enabled', e.target.checked)}
                  label="Moneda activa"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <SearchModal
        open={searchModalOpen}
        title="Buscar monedas"
        records={searchRecords}
        isSearching={isSearching}
        hasMore={hasMore}
        onSearch={handleSearchModalSearch}
        onLoadMore={handleLoadMore}
        onSelect={selectSearchResult}
        onClose={() => setSearchModalOpen(false)}
      />
    </Layout>
  );
}
