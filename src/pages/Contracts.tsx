import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { Layout } from '../components/Layout';
import { OptionsBar } from '../components/OptionsBar';
import { SearchModal } from '../components/SearchModal';
import { DecimalInput, formatNumber } from '../components/DecimalInput';
import { contractsService } from '../services/contractsService';
import { contractConceptsService } from '../services/contractConceptsService';
import { payrollConceptsService } from '../services/payrollConceptsService';
import { contractVariablesService } from '../services/contractVariablesService';
import { payrollVariablesService } from '../services/payrollVariablesService';
import { Behavior } from '../types';
import type { ContractDto, ContractConceptDto, PayrollConceptDto, ContractVariableDto, PayrollVariableDto } from '../types';

const getDefault = (): ContractDto => ({ id: 0, name: '', description: '', isActive: true });

export function ContractsPage() {
  const navigate = useNavigate();
  const [entity, setEntity] = useState<ContractDto>(getDefault());
  const [contracts, setContracts] = useState<ContractDto[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchRecords, setSearchRecords] = useState<ContractDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [navId, setNavId] = useState(0);

  // Concepts modal
  const [conceptsModalOpen, setConceptsModalOpen] = useState(false);
  const [payrollConcepts, setPayrollConcepts] = useState<PayrollConceptDto[]>([]);
  const [contractConceptIds, setContractConceptIds] = useState<Set<number>>(new Set());

  // Variables modal
  const [variablesModalOpen, setVariablesModalOpen] = useState(false);
  const [contractVariables, setContractVariables] = useState<ContractVariableDto[]>([]);
  const [payrollVariables, setPayrollVariables] = useState<PayrollVariableDto[]>([]);
  const [variableSearchOpen, setVariableSearchOpen] = useState(false);
  const [selectedVariableId, setSelectedVariableId] = useState(0);
  const [selectedVariableName, setSelectedVariableName] = useState('');
  const [selectedVariableBehavior, setSelectedVariableBehavior] = useState<Behavior>(Behavior.Fixed);
  const [addVariableValue, setAddVariableValue] = useState(0);
  const [isAddingVariable, setIsAddingVariable] = useState(false);
  const [variableSearchRecords, setVariableSearchRecords] = useState<PayrollVariableDto[]>([]);
  const [variableBehaviorFilter, setVariableBehaviorFilter] = useState<Behavior | 0>(0);

  const loadList = useCallback(async () => {
    const result = await contractsService.getList();
    if (result.isSuccess && result.value) setContracts(result.value);
  }, []);

  const loadPayrollConcepts = useCallback(async () => {
    const result = await payrollConceptsService.getList();
    if (result.isSuccess && result.value) setPayrollConcepts(result.value);
  }, []);

  const loadPayrollVariables = useCallback(async () => {
    const result = await payrollVariablesService.getList();
    if (result.isSuccess && result.value) setPayrollVariables(result.value);
  }, []);

  useEffect(() => { loadList(); loadPayrollConcepts(); loadPayrollVariables(); }, [loadList, loadPayrollConcepts, loadPayrollVariables]);

  const handleNew = () => { setEntity(getDefault()); setNavId(0); };

  const handleSave = async () => {
    if (!entity.name.trim()) { toast.error('El nombre del contrato es obligatorio'); return; }
    setIsSaving(true);
    try {
      const result = entity.id === 0
        ? await contractsService.insert({ name: entity.name, description: entity.description, isActive: entity.isActive })
        : await contractsService.update({ id: entity.id, name: entity.name, description: entity.description, isActive: entity.isActive });
      if (result.isSuccess) {
        toast.success(entity.id === 0 ? 'Contrato creado' : 'Contrato actualizado');
        if (entity.id === 0) handleNew();
        await loadList();
      } else {
        toast.error(result.errorMessage || 'Error al guardar');
      }
    } finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (entity.id === 0) return;
    if (!window.confirm('¿Eliminar este contrato?')) return;
    const result = await contractsService.delete(entity.id);
    if (result.isSuccess) {
      toast.success('Contrato eliminado');
      handleNew();
      await loadList();
    } else {
      toast.error(result.errorMessage || 'Error al eliminar');
    }
  };

  const handleSelect = (record: ContractDto) => {
    setEntity(record);
    setNavId(record.id);
    setSearchModalOpen(false);
  };

  const navigateRecord = async (navPositionId: number) => {
    const result = await contractsService.getNavBarById(navPositionId, navId);
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
      const result = await contractsService.getList(query);
      if (result.isSuccess && result.value) setSearchRecords(result.value);
    } finally { setIsSearching(false); }
  }, []);

  // Concepts modal handlers
  const openConceptsModal = useCallback(async () => {
    if (entity.id === 0) { toast.error('Guarde el contrato primero'); return; }
    const result = await contractConceptsService.getByContractId(entity.id);
    const ids = new Set<number>();
    if (result.isSuccess && result.value) result.value.forEach(cc => ids.add(cc.payrollConceptId));
    setContractConceptIds(ids);
    setConceptsModalOpen(true);
  }, [entity.id]);

  const handleConceptToggle = async (payrollConceptId: number, checked: boolean) => {
    if (!checked) {
      const existing = await contractConceptsService.getByContractId(entity.id);
      const cc = existing.isSuccess ? existing.value?.find(c => c.payrollConceptId === payrollConceptId) : null;
      if (cc) {
        const result = await contractConceptsService.delete(cc.id);
        if (result.isSuccess) {
          setContractConceptIds(prev => { const next = new Set(prev); next.delete(payrollConceptId); return next; });
          toast.success('Concepto desasociado');
        } else {
          toast.error(result.errorMessage || 'Error al desasociar');
        }
      }
    } else {
      const result = await contractConceptsService.insert({ contractId: entity.id, payrollConceptId, isActive: true });
      if (result.isSuccess) {
        setContractConceptIds(prev => { const next = new Set(prev); next.add(payrollConceptId); return next; });
        toast.success('Concepto asociado');
      } else {
        toast.error(result.errorMessage || 'Error al asociar');
      }
    }
  };

  // Variables modal handlers
  const openVariablesModal = useCallback(async () => {
    if (entity.id === 0) { toast.error('Guarde el contrato primero'); return; }
    const result = await contractVariablesService.getByContractId(entity.id);
    if (result.isSuccess && result.value) setContractVariables(result.value);
    setVariableBehaviorFilter(0);
    setVariableSearchRecords(payrollVariables
      .filter(pv => pv.isActive && !contractVariables.some(cv => cv.payrollVariableId === pv.id))
      .sort(sortByBehaviorThenName));
    setVariablesModalOpen(true);
  }, [entity.id, payrollVariables, contractVariables]);

  const handleAddVariable = async (payrollVariableId: number, value: number, stringValue?: string) => {
    const result = await contractVariablesService.insert({ contractId: entity.id, payrollVariableId, value, stringValue });
    if (result.isSuccess) {
      toast.success('Variable agregada');
      const updated = await contractVariablesService.getByContractId(entity.id);
      if (updated.isSuccess && updated.value) setContractVariables(updated.value);
    } else {
      toast.error(result.errorMessage || 'Error al agregar variable');
    }
  };

  const handleDeleteVariable = async (id: number) => {
    if (!window.confirm('¿Eliminar esta variable del contrato?')) return;
    const result = await contractVariablesService.delete(id);
    if (result.isSuccess) {
      toast.success('Variable eliminada');
      setContractVariables(prev => prev.filter(v => v.id !== id));
    } else {
      toast.error(result.errorMessage || 'Error al eliminar');
    }
  };

  const sortByBehaviorThenName = (a: PayrollVariableDto, b: PayrollVariableDto) =>
    a.behavior - b.behavior || a.name.localeCompare(b.name);

  // Variable search handlers
  const handleVariableSearch = useCallback(async (query: string) => {
    const all = payrollVariables
      .filter(pv => pv.isActive && !contractVariables.some(cv => cv.payrollVariableId === pv.id))
      .sort(sortByBehaviorThenName);
    if (!query.trim()) {
      setVariableSearchRecords(all);
    } else {
      const q = query.toLowerCase();
      setVariableSearchRecords(all.filter(pv =>
        pv.code.toLowerCase().includes(q) || pv.name.toLowerCase().includes(q)));
    }
  }, [payrollVariables, contractVariables]);

  const handleSelectVariable = (record: PayrollVariableDto) => {
    setSelectedVariableId(record.id);
    setSelectedVariableName(`${record.code} - ${record.name}`);
    setSelectedVariableBehavior(record.behavior);
    setVariableSearchOpen(false);
    setVariableSearchRecords(prev => prev.filter(pv => pv.id !== record.id));
    if (record.behavior !== Behavior.Fixed) setAddVariableValue(0);
  };

  const handleAddVariableSubmit = async () => {
    if (selectedVariableId === 0) { toast.error('Seleccione una variable'); return; }
    const existing = contractVariables.find(cv => cv.payrollVariableId === selectedVariableId);
    if (existing) { toast.error('Esta variable ya está asignada al contrato'); return; }
    setIsAddingVariable(true);
    try {
      await handleAddVariable(selectedVariableId, addVariableValue);
      setSelectedVariableId(0);
      setSelectedVariableName('');
      setAddVariableValue(0);
    } finally { setIsAddingVariable(false); }
  };

  return (
    <Layout>
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8 py-2 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Contratos</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Plantillas de reglas salariales</p>
            </div>
            <OptionsBar showNav onNew={handleNew} onSave={handleSave} onDelete={handleDelete}
              onSearch={() => setSearchModalOpen(true)} isSaving={isSaving} canDelete={entity.id !== 0}
              onFirst={() => navigateRecord(0)} onPrevious={() => navigateRecord(1)}
              onNext={() => navigateRecord(2)} onLast={() => navigateRecord(3)} />
            <input type="text" placeholder="Presione F2 para buscar..." className="input-field w-48" onFocus={() => setSearchModalOpen(true)} />
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="stat-card">
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {entity.id === 0 ? 'Nuevo Contrato' : `Contrato #${entity.id}`}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                <input type="text" value={entity.name} onChange={(e) => setEntity({ ...entity, name: e.target.value })}
                  className="input-field" placeholder="Nombre del contrato" />
              </div>
              <div className="flex items-end gap-4 pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={entity.isActive} onChange={(e) => setEntity({ ...entity, isActive: e.target.checked })}
                    className="sr-only peer" />
                  <div className="toggle-track relative">
                    <div className="toggle-thumb" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Activo</span>
                </label>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                <textarea value={entity.description || ''} onChange={(e) => setEntity({ ...entity, description: e.target.value })}
                  className="input-field resize-none" rows={2} placeholder="Descripción del contrato" />
              </div>
            </div>

            {entity.id !== 0 && (
              <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={openConceptsModal}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-sm font-medium">
                  Conceptos Aplicados
                </button>
                <button type="button" onClick={openVariablesModal}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-sm font-medium">
                  Variables
                </button>
              </div>
            )}
          </div>
        </div>

        {contracts.length > 0 && (
          <div className="stat-card mt-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Lista de Contratos</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">ID</th>
                    <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Nombre</th>
                    <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Descripción</th>
                    <th className="text-center py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((c) => (
                    <tr key={c.id} onClick={() => { handleSelect(c); }}
                      className={`border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        entity.id === c.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                      }`}>
                      <td className="py-2 px-3 font-mono text-xs text-gray-500">{c.id}</td>
                      <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{c.name}</td>
                      <td className="py-2 px-3 text-gray-500 max-w-xs truncate">{c.description || '-'}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={c.isActive ? 'badge-green' : 'badge-red'}>
                          {c.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Contract Search Modal */}
      <SearchModal open={searchModalOpen} title="Buscar Contrato" records={searchRecords} isSearching={isSearching}
        hasMore={false} onSearch={handleSearch} onLoadMore={() => {}} onSelect={handleSelect}
        onClose={() => setSearchModalOpen(false)} />

      {/* Concepts Modal (switches) */}
      {conceptsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setConceptsModalOpen(false)}>
          <div className="fixed inset-0 bg-black/50" />
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Conceptos Aplicados</h3>
              <button onClick={() => setConceptsModalOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <ArrowLeft className="h-5 w-5 rotate-45" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {payrollConcepts.filter(pc => pc.isActive).map((pc) => {
                const isChecked = contractConceptIds.has(pc.id);
                return (
                  <div key={pc.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{pc.code} - {pc.name}</p>
                      <p className="text-xs text-gray-400">{pc.conceptType === 1 ? 'Asignación' : pc.conceptType === 2 ? 'Deducción' : pc.conceptType === 3 ? 'Retención' : 'Aporte'}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isChecked}
                      onClick={() => handleConceptToggle(pc.id, !isChecked)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                        isChecked ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                        isChecked ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                );
              })}
              {payrollConcepts.filter(pc => pc.isActive).length === 0 && (
                <p className="text-center text-sm text-gray-400 py-8">No hay conceptos activos disponibles</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Variables Modal (editable table) */}
      {variablesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setVariablesModalOpen(false)}>
          <div className="fixed inset-0 bg-black/50" />
          <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Variables del Contrato</h3>
              <button onClick={() => setVariablesModalOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <ArrowLeft className="h-5 w-5 rotate-45" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              {/* Add variable section (top) */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Agregar Variable</h4>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Variable</label>
                    <div className="flex gap-2">
                      <input type="text" readOnly value={selectedVariableName}
                        placeholder="Presione F2 para buscar..." onFocus={() => setVariableSearchOpen(true)}
                        className="input-field flex-1 cursor-pointer" />
                      {selectedVariableId !== 0 && (
                        <button type="button" onClick={() => { setSelectedVariableId(0); setSelectedVariableName(''); setSelectedVariableBehavior(Behavior.Fixed); }}
                          className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                          Limpiar
                        </button>
                      )}
                    </div>
                  </div>
                  {selectedVariableId !== 0 && selectedVariableBehavior === Behavior.Fixed && (
                    <div className="max-w-32">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Valor (Núm.)</label>
                      <DecimalInput value={addVariableValue} onChange={setAddVariableValue}
                        className="input-field text-sm text-right" placeholder="0.00" />
                    </div>
                  )}
                  <button type="button" onClick={handleAddVariableSubmit} disabled={isAddingVariable}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50">
                    {isAddingVariable ? '...' : 'Agregar'}
                  </button>
                </div>
              </div>

              {/* Behavior filter radio buttons */}
              <div className="flex items-center gap-4 mb-3">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Filtrar:</span>
                {[
                  { value: 0, label: 'Todas' },
                  { value: Behavior.Fixed, label: 'Fija' },
                  { value: Behavior.Volatile, label: 'Volátil' },
                  { value: Behavior.Calculated, label: 'Calculada' },
                ].map(opt => (
                  <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="behaviorFilter" checked={variableBehaviorFilter === opt.value}
                      onChange={() => setVariableBehaviorFilter(opt.value)}
                      className="accent-indigo-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
                  </label>
                ))}
              </div>

              {/* Variables table (bottom) */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Código</th>
                      <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Variable</th>
                      <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Comportamiento</th>
                      <th className="text-right py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Valor</th>
                      <th className="text-center py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contractVariables
                      .filter(cv => variableBehaviorFilter === 0 || cv.behavior === variableBehaviorFilter)
                      .map((cv) => (
                      <tr key={cv.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-2 px-3 font-mono text-xs text-indigo-600 dark:text-indigo-400">{cv.variableCode || `VAR#${cv.payrollVariableId}`}</td>
                        <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{cv.variableName || `Variable #${cv.payrollVariableId}`}</td>
                        <td className="py-2 px-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            cv.behavior === Behavior.Fixed ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            cv.behavior === Behavior.Volatile ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                            'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                          }`}>
                            {cv.behavior === Behavior.Fixed ? 'Fija' : cv.behavior === Behavior.Volatile ? 'Volátil' : 'Calculada'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-gray-700 dark:text-gray-300">
                          {formatNumber(cv.value)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button onClick={() => handleDeleteVariable(cv.id)}
                            className="text-xs text-rose-600 hover:text-rose-700 hover:underline">
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                    {contractVariables.filter(cv => variableBehaviorFilter === 0 || cv.behavior === variableBehaviorFilter).length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-sm text-gray-400">
                          No hay variables asignadas a este contrato
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}
      {/* Variable Search Modal */}
      <SearchModal
        open={variableSearchOpen}
        title="Buscar Variable"
        records={variableSearchRecords}
        isSearching={false}
        hasMore={false}
        onSearch={handleVariableSearch}
        onLoadMore={() => {}}
        onSelect={handleSelectVariable}
        onClose={() => setVariableSearchOpen(false)}
        columns={[
          { key: 'code', label: 'Código' },
          { key: 'name', label: 'Variable' },
          { key: 'behavior', label: 'Comportamiento', render: (v) => (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              v === Behavior.Fixed ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
              v === Behavior.Volatile ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
              'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
            }`}>
              {v === Behavior.Fixed ? 'Fija' : v === Behavior.Volatile ? 'Volátil' : 'Calculada'}
            </span>
          )},
        ]} />
    </Layout>
  );
}
