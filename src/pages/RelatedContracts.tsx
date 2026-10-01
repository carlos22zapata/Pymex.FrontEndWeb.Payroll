import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Link2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Layout } from '../components/Layout';
import { OptionsBar } from '../components/OptionsBar';
import { SearchModal } from '../components/SearchModal';
import { Toggle } from '../components/Toggle';
import { relatedContractsService } from '../services/relatedContractsService';
import { contractsService } from '../services/contractsService';
import type { RelatedContractDto, ContractDto } from '../types';

const getDefault = (): RelatedContractDto => ({
  id: 0,
  contractId: 0,
  relatedContractId: 0,
  description: '',
  isActive: true,
});

export function RelatedContractsPage() {
  const navigate = useNavigate();
  const [entity, setEntity] = useState<RelatedContractDto>(getDefault());
  const [records, setRecords] = useState<RelatedContractDto[]>([]);
  const [contracts, setContracts] = useState<ContractDto[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchRecords, setSearchRecords] = useState<RelatedContractDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [navId, setNavId] = useState(0);

  const loadList = useCallback(async () => {
    const result = await relatedContractsService.getNavBarById(3, 0);
    if (result.isSuccess && result.value) {
      const listResult = await relatedContractsService.getByContractId(0);
    }
    const list = await relatedContractsService.getNavBarById(3, 0);
  }, []);

  const loadContracts = useCallback(async () => {
    const result = await contractsService.getList();
    if (result.isSuccess && result.value) setContracts(result.value);
  }, []);

  useEffect(() => {
    loadContracts();
    loadAllRecords();
  }, [loadContracts]);

  const loadAllRecords = async () => {
    const result = await relatedContractsService.getNavBarById(3, 0);
  };

  const handleNew = () => { setEntity(getDefault()); setNavId(0); };

  const handleSave = async () => {
    if (entity.contractId === 0) { toast.error('Seleccione el contrato principal'); return; }
    if (entity.relatedContractId === 0) { toast.error('Seleccione el contrato relacionado'); return; }
    if (entity.contractId === entity.relatedContractId) { toast.error('Un contrato no puede estar relacionado consigo mismo'); return; }
    setIsSaving(true);
    try {
      const result = entity.id === 0
        ? await relatedContractsService.insert(entity)
        : await relatedContractsService.update(entity);
      if (result.isSuccess) {
        toast.success(entity.id === 0 ? 'Relación creada' : 'Relación actualizada');
        if (entity.id === 0) handleNew();
      } else {
        toast.error(result.errorMessage || 'Error al guardar');
      }
    } finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (entity.id === 0) return;
    if (!window.confirm('¿Eliminar esta relación?')) return;
    const result = await relatedContractsService.delete(entity.id);
    if (result.isSuccess) {
      toast.success('Relación eliminada');
      handleNew();
    } else {
      toast.error(result.errorMessage || 'Error al eliminar');
    }
  };

  const handleSelect = (record: RelatedContractDto) => {
    setEntity(record);
    setNavId(record.id);
    setSearchModalOpen(false);
  };

  const navigateRecord = async (navPositionId: number) => {
    const result = await relatedContractsService.getNavBarById(navPositionId, navId);
    if (result.isSuccess && result.value) {
      setEntity(result.value);
      setNavId(result.value.id);
    } else {
      toast.error(result.errorMessage || 'No hay más registros');
    }
  };

  const handleSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    try {
      const result = await relatedContractsService.getNavBarById(3, 0);
      if (result.isSuccess && result.value) {
        setSearchRecords([result.value]);
      }
    } finally { setIsSearching(false); }
  }, []);

  const getContractName = (id: number) => contracts.find(c => c.id === id)?.name || '';

  return (
    <Layout>
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8 py-2 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Contratos Relacionados</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Vínculos entre contratos</p>
            </div>
            <OptionsBar
              showNav onNew={handleNew} onSave={handleSave} onDelete={handleDelete}
              onSearch={() => setSearchModalOpen(true)} isSaving={isSaving} canDelete={entity.id !== 0}
              onFirst={() => navigateRecord(0)} onPrevious={() => navigateRecord(1)}
              onNext={() => navigateRecord(2)} onLast={() => navigateRecord(3)}
            />
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="stat-card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contrato Principal
              </label>
              <select
                value={entity.contractId || ''}
                onChange={(e) => setEntity({ ...entity, contractId: Number(e.target.value) })}
                className="input-field"
              >
                <option value={0}>Seleccione un contrato...</option>
                {contracts.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contrato Relacionado
              </label>
              <select
                value={entity.relatedContractId || ''}
                onChange={(e) => setEntity({ ...entity, relatedContractId: Number(e.target.value) })}
                className="input-field"
              >
                <option value={0}>Seleccione un contrato...</option>
                {contracts.filter(c => c.id !== entity.contractId).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción
              </label>
              <input
                type="text"
                value={entity.description ?? ''}
                onChange={(e) => setEntity({ ...entity, description: e.target.value })}
                className="input-field"
                placeholder="Motivo de la relación entre contratos..."
              />
            </div>

            <div>
              <Toggle
                id="related-contract-active"
                checked={entity.isActive}
                onChange={(e) => setEntity({ ...entity, isActive: e.target.checked })}
                label="Activo"
              />
            </div>
          </div>
        </div>

        {entity.id !== 0 && (
          <div className="stat-card mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Link2 className="h-4 w-4" />
              <span>
                Relacionando: <strong>{getContractName(entity.contractId)}</strong> ↔ <strong>{getContractName(entity.relatedContractId)}</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      <SearchModal
        open={searchModalOpen}
        title="Buscar Relación"
        records={searchRecords}
        isSearching={isSearching}
        hasMore={false}
        onSearch={handleSearch}
        onLoadMore={() => {}}
        onSelect={handleSelect}
        onClose={() => setSearchModalOpen(false)}
      />
    </Layout>
  );
}
