import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { Layout } from '../components/Layout';
import { OptionsBar } from '../components/OptionsBar';
import { SearchModal } from '../components/SearchModal';
import { positionsService } from '../services/positionsService';
import type { PositionDto } from '../types';

const getDefault = (): PositionDto => ({ id: 0, name: '' });

export function PositionsPage() {
  const navigate = useNavigate();
  const [entity, setEntity] = useState<PositionDto>(getDefault());
  const [positions, setPositions] = useState<PositionDto[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchRecords, setSearchRecords] = useState<PositionDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [navId, setNavId] = useState(0);

  const loadList = useCallback(async () => {
    const result = await positionsService.getList();
    if (result.isSuccess && result.value) setPositions(result.value);
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  const handleNew = () => { setEntity(getDefault()); setNavId(0); };

  const handleSave = async () => {
    if (!entity.name.trim()) { toast.error('El nombre del cargo es obligatorio'); return; }
    setIsSaving(true);
    try {
      const result = entity.id === 0
        ? await positionsService.insert({ name: entity.name })
        : await positionsService.update({ id: entity.id, name: entity.name });
      if (result.isSuccess) {
        toast.success(entity.id === 0 ? 'Cargo creado' : 'Cargo actualizado');
        if (entity.id === 0) handleNew();
        await loadList();
      } else {
        toast.error(result.errorMessage || 'Error al guardar');
      }
    } finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (entity.id === 0) return;
    if (!window.confirm('¿Eliminar este cargo?')) return;
    const result = await positionsService.delete(entity.id);
    if (result.isSuccess) {
      toast.success('Cargo eliminado');
      handleNew();
      await loadList();
    } else {
      toast.error(result.errorMessage || 'Error al eliminar');
    }
  };

  const handleSelect = (record: PositionDto) => {
    setEntity(record); setNavId(record.id); setSearchModalOpen(false);
  };

  const navigateRecord = async (navPositionId: number) => {
    const result = await positionsService.getNavBarById(navPositionId, navId);
    if (result.isSuccess && result.value) {
      setEntity(result.value); setNavId(result.value.id);
    } else {
      toast.error(result.errorMessage || 'No hay más registros');
    }
  };

  const handleSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    try {
      const result = await positionsService.getList(query);
      if (result.isSuccess && result.value) setSearchRecords(result.value);
    } finally { setIsSearching(false); }
  }, []);

  return (
    <Layout>
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8 py-2 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Cargos</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Gestión de cargos de la empresa</p>
            </div>
            <OptionsBar
              showNav onNew={handleNew} onSave={handleSave} onDelete={handleDelete}
              onSearch={() => setSearchModalOpen(true)} isSaving={isSaving} canDelete={entity.id !== 0}
              onFirst={() => navigateRecord(0)} onPrevious={() => navigateRecord(1)}
              onNext={() => navigateRecord(2)} onLast={() => navigateRecord(3)}
            />
            <input type="text" placeholder="Presione F2 para buscar..." className="input-field w-48" onFocus={() => setSearchModalOpen(true)} />
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="stat-card">
          <div className="space-y-5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre del Cargo
            </label>
            <input type="text" value={entity.name} onChange={(e) => setEntity({ ...entity, name: e.target.value })}
              className="input-field" placeholder="Ej: Gerente General" />
          </div>
        </div>

        {positions.length > 0 && (
          <div className="stat-card mt-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Lista de Cargos</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">ID</th>
                    <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Nombre</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((pos) => (
                    <tr key={pos.id} onClick={() => { setEntity(pos); setNavId(pos.id); }}
                      className={`border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        entity.id === pos.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                      }`}>
                      <td className="py-2 px-3 font-mono text-xs text-gray-500">{pos.id}</td>
                      <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{pos.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <SearchModal open={searchModalOpen} title="Buscar Cargo" records={searchRecords} isSearching={isSearching}
        hasMore={false} onSearch={handleSearch} onLoadMore={() => {}} onSelect={handleSelect}
        onClose={() => setSearchModalOpen(false)} />
    </Layout>
  );
}
