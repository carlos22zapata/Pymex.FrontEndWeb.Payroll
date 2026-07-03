import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { Layout } from '../components/Layout';
import { OptionsBar } from '../components/OptionsBar';
import { SearchModal } from '../components/SearchModal';
import { FormulaBuilder } from '../components/FormulaBuilder';
import { payrollConceptsService } from '../services/payrollConceptsService';
import { employeesService } from '../services/employeesService';
import { payrollCalculationService } from '../services/payrollCalculationService';
import { ConceptType } from '../types';
import type { PayrollConceptDto } from '../types';

const getDefault = (): PayrollConceptDto => ({
  id: 0, code: '', name: '', conceptType: ConceptType.Earning, isTaxable: false, formula: '', isActive: true,
});

const conceptTypeOptions = [
  { value: ConceptType.Earning, label: 'Earning - Asignación' },
  { value: ConceptType.Deduction, label: 'Deduction - Deducción Interna' },
  { value: ConceptType.Withholding, label: 'Withholding - Retención Legal' },
  { value: ConceptType.Other, label: 'Other - Aporte Patronal' },
];

export function PayrollConceptsPage() {
  const navigate = useNavigate();
  const [entity, setEntity] = useState<PayrollConceptDto>(getDefault());
  const [concepts, setConcepts] = useState<PayrollConceptDto[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchRecords, setSearchRecords] = useState<PayrollConceptDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [navId, setNavId] = useState(0);
  const [isTesting, setIsTesting] = useState(false);

  const loadList = useCallback(async () => {
    const result = await payrollConceptsService.getList();
    if (result.isSuccess && result.value) setConcepts(result.value);
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  const handleNew = () => { setEntity(getDefault()); setNavId(0); };

  const handleSave = async () => {
    if (!entity.code.trim() || !entity.name.trim()) {
      toast.error('Código y nombre son obligatorios');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        code: entity.code, name: entity.name, conceptType: entity.conceptType,
        isTaxable: entity.isTaxable, formula: entity.formula, isActive: entity.isActive,
      };
      const result = entity.id === 0
        ? await payrollConceptsService.insert(payload)
        : await payrollConceptsService.update({ id: entity.id, ...payload });
      if (result.isSuccess) {
        toast.success(entity.id === 0 ? 'Concepto creado' : 'Concepto actualizado');
        if (entity.id === 0) handleNew();
        await loadList();
      } else {
        toast.error(result.errorMessage || 'Error al guardar');
      }
    } finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (entity.id === 0) return;
    if (!window.confirm('¿Eliminar este concepto?')) return;
    const result = await payrollConceptsService.delete(entity.id);
    if (result.isSuccess) {
      toast.success('Concepto eliminado');
      handleNew();
      await loadList();
    } else {
      toast.error(result.errorMessage || 'Error al eliminar');
    }
  };

  const handleSelect = (record: PayrollConceptDto) => {
    setEntity(record); setNavId(record.id); setSearchModalOpen(false);
  };

  const navigateRecord = async (navPositionId: number) => {
    const result = await payrollConceptsService.getNavBarById(navPositionId, navId);
    if (result.isSuccess && result.value) {
      setEntity(result.value); setNavId(result.value.id);
    } else {
      toast.error(result.errorMessage || 'No hay más registros');
    }
  };

  const handleSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    try {
      const result = await payrollConceptsService.getList(query);
      if (result.isSuccess && result.value) setSearchRecords(result.value);
    } finally { setIsSearching(false); }
  }, []);

  const handleTestFormula = async (formula: string) => {
    if (!formula) { toast.error('Escriba una fórmula para probar'); return; }
    setIsTesting(true);
    try {
      const employeesResult = await employeesService.getList(1, 1);
      if (employeesResult.isSuccess && employeesResult.value && employeesResult.value.length > 0) {
        const emp = employeesResult.value[0];
        const calcResult = await payrollCalculationService.calculateEmployeePayroll(emp.id);
        if (calcResult.isSuccess && calcResult.value) {
          toast.success('Fórmula probada correctamente');
        } else {
          toast.error(calcResult.errorMessage || 'Error al probar fórmula');
        }
      } else {
        toast.error('No hay empleados para probar la fórmula');
      }
    } catch {
      toast.error('Error al probar la fórmula');
    } finally { setIsTesting(false); }
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
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Conceptos de Nómina</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Reglas y fórmulas para el cálculo</p>
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
              {entity.id === 0 ? 'Nuevo Concepto' : `Concepto #${entity.id}`}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código</label>
                <input type="text" value={entity.code} onChange={(e) => setEntity({ ...entity, code: e.target.value })}
                  className="input-field font-mono" placeholder="C_CODIGO" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                <input type="text" value={entity.name} onChange={(e) => setEntity({ ...entity, name: e.target.value })}
                  className="input-field" placeholder="Nombre del concepto" />
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
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={entity.isTaxable} onChange={(e) => setEntity({ ...entity, isTaxable: e.target.checked })}
                    className="sr-only peer" />
                  <div className="toggle-track relative">
                    <div className="toggle-thumb" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Afecto a ISLR</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Concepto</label>
                <select value={entity.conceptType} onChange={(e) => setEntity({ ...entity, conceptType: Number(e.target.value) as ConceptType })}
                  className="input-field">
                  {conceptTypeOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fórmula</label>
              <FormulaBuilder
                formula={entity.formula}
                onChange={(formula) => setEntity({ ...entity, formula })}
                onTest={handleTestFormula}
                isTesting={isTesting}
              />
            </div>
          </div>
        </div>

        <div className="stat-card mt-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Lista de Conceptos</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Código</th>
                  <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Nombre</th>
                  <th className="text-center py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Tipo</th>
                  <th className="text-center py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">ISLR</th>
                  <th className="text-center py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {concepts.map((c) => (
                  <tr key={c.id} onClick={() => { setEntity(c); setNavId(c.id); }}
                    className={`border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      entity.id === c.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                    }`}>
                    <td className="py-2 px-3 font-mono text-xs text-indigo-600 dark:text-indigo-400">{c.code}</td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{c.name}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        c.conceptType === 1 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300' :
                        c.conceptType === 2 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300' :
                        c.conceptType === 3 ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300' :
                        'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {c.conceptTypeName || (c.conceptType === 1 ? 'Earning' : c.conceptType === 2 ? 'Deduction' : c.conceptType === 3 ? 'Withholding' : 'Other')}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={c.isTaxable ? 'badge-red' : 'badge-blue'}>
                        {c.isTaxable ? 'Sí' : 'No'}
                      </span>
                    </td>
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
      </div>

      <SearchModal open={searchModalOpen} title="Buscar Concepto" records={searchRecords} isSearching={isSearching}
        hasMore={false} onSearch={handleSearch} onLoadMore={() => {}} onSelect={handleSelect}
        onClose={() => setSearchModalOpen(false)} />
    </Layout>
  );
}
