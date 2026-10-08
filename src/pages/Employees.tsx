import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { Layout } from '../components/Layout';
import { OptionsBar } from '../components/OptionsBar';
import { SearchModal } from '../components/SearchModal';
import { DecimalInput } from '../components/DecimalInput';
import { Pagination } from '../components/Pagination';
import { employeesService } from '../services/employeesService';
import { departmentsService } from '../services/departmentsService';
import { positionsService } from '../services/positionsService';
import { contractsService } from '../services/contractsService';
import { contractVariablesService } from '../services/contractVariablesService';
import { payrollNoveltiesService } from '../services/payrollNoveltiesService';
import { Behavior, DataType } from '../types';
import type { EmployeeDto, DepartmentDto, PositionDto, ContractDto, ContractVariableDto, PayrollNoveltyDto } from '../types';
import { todayWall } from '../lib/timeZone';

const getDefault = (): EmployeeDto => ({
  id: 0, employeeCode: '', name: '', lastName: '', email: '', phone: '',
  address: '', city: '', state: '', zipCode: '',
  hireDate: todayWall(),
  terminationDate: null, contractId: 0,
  departmentId: 0, positionId: 0,
});

export function EmployeesPage() {
  const navigate = useNavigate();
  const [entity, setEntity] = useState<EmployeeDto>(getDefault());
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [positions, setPositions] = useState<PositionDto[]>([]);
  const [contracts, setContracts] = useState<ContractDto[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchRecords, setSearchRecords] = useState<EmployeeDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [navId, setNavId] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Novelties modal
  const [noveltiesModalOpen, setNoveltiesModalOpen] = useState(false);
  const [periodCode, setPeriodCode] = useState('');
  const [activeContract, setActiveContract] = useState<ContractDto | null>(null);
  const [fixedVariables, setFixedVariables] = useState<ContractVariableDto[]>([]);
  const [novelties, setNovelties] = useState<PayrollNoveltyDto[]>([]);
  const [isLoadingNovelties, setIsLoadingNovelties] = useState(false);
  const [noveltyValues, setNoveltyValues] = useState<Record<string, number>>({});
  const [noveltyBehaviorFilter, setNoveltyBehaviorFilter] = useState<Behavior | 0>(0);
  const [noveltyDataTypeFilter, setNoveltyDataTypeFilter] = useState<DataType | 0>(0);

  const handleNoveltyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const tr = (e.currentTarget as HTMLElement).closest('tr');
      const targetTr = e.key === 'ArrowDown' ? tr?.nextElementSibling : tr?.previousElementSibling;
      const input = targetTr?.querySelector<HTMLInputElement>('td:last-child input');
      input?.focus();
    }
  };

  const loadList = useCallback(async () => {
    setIsLoading(true);
    const [empResult, depResult, posResult, conResult] = await Promise.all([
      employeesService.getList(page, pageSize),
      departmentsService.getList(),
      positionsService.getList(),
      contractsService.getList(),
    ]);
    if (empResult.isSuccess && empResult.value) setEmployees(empResult.value);
    if (depResult.isSuccess && depResult.value) setDepartments(depResult.value);
    if (posResult.isSuccess && posResult.value) setPositions(posResult.value);
    if (conResult.isSuccess && conResult.value) setContracts(conResult.value);
    setIsLoading(false);
  }, [page, pageSize]);

  useEffect(() => { loadList(); }, [loadList]);

  const handleNew = () => { setEntity(getDefault()); setNavId(0); };

  const handleSave = async () => {
    if (!entity.name.trim() || !entity.lastName.trim()) {
      toast.error('Nombre y apellido son obligatorios');
      return;
    }
    if (!entity.employeeCode.trim()) {
      toast.error('El código de empleado es obligatorio');
      return;
    }
    if (!entity.contractId) {
      toast.error('Debe seleccionar un contrato');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        ...entity,
        hireDate: entity.hireDate || undefined,
        terminationDate: entity.terminationDate || null,
      };
      const result = entity.id === 0
        ? await employeesService.insert(payload)
        : await employeesService.update(payload);
      if (result.isSuccess) {
        toast.success(entity.id === 0 ? 'Empleado creado' : 'Empleado actualizado');
        if (entity.id === 0) handleNew();
        await loadList();
      } else {
        toast.error(result.errorMessage || 'Error al guardar');
      }
    } finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (entity.id === 0) return;
    if (!window.confirm('¿Eliminar este empleado?')) return;
    const result = await employeesService.delete(entity.id);
    if (result.isSuccess) {
      toast.success('Empleado eliminado');
      handleNew();
      await loadList();
    } else {
      toast.error(result.errorMessage || 'Error al eliminar');
    }
  };

  const handleSelect = (record: EmployeeDto) => {
    setEntity(record); setNavId(record.id); setSearchModalOpen(false);
  };

  const navigateRecord = async (navPositionId: number) => {
    const result = await employeesService.getNavBarById(navPositionId, navId);
    if (result.isSuccess && result.value) {
      setEntity(result.value); setNavId(result.value.id);
    } else {
      toast.error(result.errorMessage || 'No hay más registros');
    }
  };

  const handleSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    try {
      const result = await employeesService.getList(1, 50, query);
      if (result.isSuccess && result.value) setSearchRecords(result.value);
    } finally { setIsSearching(false); }
  }, []);

  // Novelties modal handlers
  const openNoveltiesModal = useCallback(async () => {
    if (entity.id === 0) { toast.error('Seleccione un empleado'); return; }
    if (!entity.contractId) { toast.error('El empleado no tiene un contrato asignado'); return; }
    setIsLoadingNovelties(true);
    setNoveltiesModalOpen(true);
    setPeriodCode(todayWall().slice(0, 7) + '-Q1');
    try {
      const contract = contracts.find(c => c.id === entity.contractId) || null;
      setActiveContract(contract);

      if (contract) {
        const [varsResult, novsResult] = await Promise.all([
          contractVariablesService.getByContractId(contract.id),
          payrollNoveltiesService.getByContractId(contract.id),
        ]);
        if (varsResult.isSuccess && varsResult.value) setFixedVariables(varsResult.value);
        if (novsResult.isSuccess && novsResult.value) setNovelties(novsResult.value);
      } else {
        setFixedVariables([]);
        setNovelties([]);
      }
    } finally { setIsLoadingNovelties(false); }
  }, [entity.id, entity.contractId, contracts]);

  const handleSaveNovelties = async () => {
    if (!activeContract) { toast.error('El empleado no tiene un contrato activo'); return; }
    if (!periodCode.trim()) { toast.error('Ingrese un período'); return; }
    setIsLoadingNovelties(true);
    try {
      for (const [varKey, val] of Object.entries(noveltyValues)) {
        const [, payrollVariableIdStr] = varKey.split('_');
        const payrollVariableId = Number(payrollVariableIdStr);

        const existing = novelties.find(n => n.payrollVariableId === payrollVariableId && n.periodCode === periodCode);
        if (existing) {
          await payrollNoveltiesService.update({ ...existing, value: val });
        } else {
          await payrollNoveltiesService.insert({
            periodCode, contractId: activeContract.id, payrollVariableId, value: val,
          });
        }
      }
      toast.success('Novedades guardadas');
      const updated = await payrollNoveltiesService.getByContractId(activeContract.id);
      if (updated.isSuccess && updated.value) setNovelties(updated.value);
      setNoveltyValues({});
    } catch {
      toast.error('Error al guardar novedades');
    } finally { setIsLoadingNovelties(false); }
  };

  const filteredVariables = fixedVariables.filter(v =>
    (noveltyBehaviorFilter === 0 || v.behavior === noveltyBehaviorFilter) &&
    (noveltyDataTypeFilter === 0 || v.dataType === noveltyDataTypeFilter)
  );
  const volatileNovelties = filteredVariables.map(vv => {
    const existing = novelties.find(n => n.payrollVariableId === vv.payrollVariableId && n.periodCode === periodCode);
    return { variable: vv, novelty: existing || null };
  });

  return (
    <Layout>
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8 py-2 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Empleados</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Gestión de empleados</p>
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
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {entity.id === 0 ? 'Nuevo Empleado' : `Empleado #${entity.id}`}
              </h3>
              {entity.id !== 0 && entity.isActive !== undefined && (
                <span className={entity.isActive ? 'badge-green' : 'badge-red'}>
                  {entity.isActive ? 'Activo' : 'Inactivo'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código</label>
                <input type="text" value={entity.employeeCode} onChange={(e) => setEntity({ ...entity, employeeCode: e.target.value })}
                  className="input-field font-mono" placeholder="EMP001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                <input type="text" value={entity.name} onChange={(e) => setEntity({ ...entity, name: e.target.value })}
                  className="input-field" placeholder="Nombre" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apellido</label>
                <input type="text" value={entity.lastName} onChange={(e) => setEntity({ ...entity, lastName: e.target.value })}
                  className="input-field" placeholder="Apellido" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input type="email" value={entity.email || ''} onChange={(e) => setEntity({ ...entity, email: e.target.value })}
                  className="input-field" placeholder="email@empresa.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
                <input type="text" value={entity.phone || ''} onChange={(e) => setEntity({ ...entity, phone: e.target.value })}
                  className="input-field" placeholder="04121234567" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contrato</label>
                <select value={entity.contractId} onChange={(e) => setEntity({ ...entity, contractId: Number(e.target.value) })}
                  className="input-field">
                  <option value={0}>Seleccionar...</option>
                  {contracts.filter(c => c.isActive).map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Departamento</label>
                <select value={entity.departmentId} onChange={(e) => setEntity({ ...entity, departmentId: Number(e.target.value) })}
                  className="input-field">
                  <option value={0}>Seleccionar...</option>
                  {departments.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cargo</label>
                <select value={entity.positionId} onChange={(e) => setEntity({ ...entity, positionId: Number(e.target.value) })}
                  className="input-field">
                  <option value={0}>Seleccionar...</option>
                  {positions.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Ingreso</label>
                <input type="date" value={entity.hireDate ? entity.hireDate.split('T')[0] : ''}
                  onChange={(e) => setEntity({ ...entity, hireDate: e.target.value })}
                  className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Egreso</label>
                <input type="date" value={entity.terminationDate ? entity.terminationDate.split('T')[0] : ''}
                  onChange={(e) => setEntity({ ...entity, terminationDate: e.target.value || null })}
                  className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección</label>
                <input type="text" value={entity.address || ''} onChange={(e) => setEntity({ ...entity, address: e.target.value })}
                  className="input-field" placeholder="Dirección" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ciudad</label>
                <input type="text" value={entity.city || ''} onChange={(e) => setEntity({ ...entity, city: e.target.value })}
                  className="input-field" placeholder="Ciudad" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
                <input type="text" value={entity.state || ''} onChange={(e) => setEntity({ ...entity, state: e.target.value })}
                  className="input-field" placeholder="Estado" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código Postal</label>
                <input type="text" value={entity.zipCode || ''} onChange={(e) => setEntity({ ...entity, zipCode: e.target.value })}
                  className="input-field" placeholder="1010" />
              </div>
            </div>

            {entity.id !== 0 && (
              <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={openNoveltiesModal}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 text-white hover:bg-amber-700 transition-colors text-sm font-medium">
                  <Calendar className="h-4 w-4" />
                  Novedades
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="stat-card mt-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Lista de Empleados</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Código</th>
                  <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Nombre</th>
                  <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Contrato</th>
                  <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Depto</th>
                  <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Cargo</th>
                  <th className="text-center py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Estado</th>
                  <th className="text-center py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} onClick={() => { setEntity(emp); setNavId(emp.id); }}
                    className={`border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      entity.id === emp.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                    }`}>
                    <td className="py-2 px-3 font-mono text-xs text-gray-500">{emp.employeeCode}</td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{emp.name} {emp.lastName}</td>
                    <td className="py-2 px-3 text-gray-500">{emp.contractName || '-'}</td>
                    <td className="py-2 px-3 text-gray-500">{emp.departmentName || '-'}</td>
                    <td className="py-2 px-3 text-gray-500">{emp.positionName || '-'}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={emp.isActive !== false ? 'badge-green' : 'badge-red'}>
                        {emp.isActive !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEntity(emp); setNavId(emp.id); setTimeout(() => openNoveltiesModal(), 50); }}
                        className="text-xs text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-1 mx-auto">
                        <Calendar className="h-3 w-3" />
                        Novedades
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} recordsPerPage={pageSize} onPageChange={setPage} onRecordsPerPageChange={setPageSize} />
        </div>
      </div>

      <SearchModal open={searchModalOpen} title="Buscar Empleado" records={searchRecords} isSearching={isSearching}
        hasMore={false} onSearch={handleSearch} onLoadMore={() => {}} onSelect={handleSelect}
        onClose={() => setSearchModalOpen(false)} />

      {/* Novelties Modal */}
      {noveltiesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setNoveltiesModalOpen(false)}>
          <div className="fixed inset-0 bg-black/50" />
          <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Novedades del Período
                </h3>
                <p className="text-xs text-gray-400">{entity.name} {entity.lastName} ({entity.employeeCode})</p>
              </div>
              <button onClick={() => setNoveltiesModalOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <ArrowLeft className="h-5 w-5 rotate-45" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-end gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Período</label>
                  <input type="text" value={periodCode} onChange={(e) => setPeriodCode(e.target.value)}
                    className="input-field text-sm font-mono" placeholder="2026-06-Q1" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Contrato Activo</label>
                  <input type="text" readOnly value={activeContract ? `${activeContract.name}` : 'Sin contrato activo'}
                    className="input-field text-sm bg-gray-50 dark:bg-gray-800" />
                </div>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-4">
              {isLoadingNovelties ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                </div>
              ) : !activeContract ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400">El empleado no tiene un contrato activo asignado.</p>
                </div>
              ) : (
                <>
                  <div className="mb-3 space-y-2">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Comportamiento:</span>
                      {[
                        { value: 0, label: 'Todas' },
                        { value: Behavior.Fixed, label: 'Fija' },
                        { value: Behavior.Volatile, label: 'Volátil' },
                        { value: Behavior.Calculated, label: 'Calculada' },
                      ].map(opt => (
                        <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
                          <input type="radio" name="noveltyBehavior" checked={noveltyBehaviorFilter === opt.value}
                            onChange={() => setNoveltyBehaviorFilter(opt.value)}
                            className="accent-indigo-600" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Tipo:</span>
                      {[
                        { value: 0, label: 'Todos' },
                        { value: DataType.Numeric, label: 'Numérico' },
                        { value: DataType.Alphanumeric, label: 'Alfanumérico' },
                        { value: DataType.Date, label: 'Fecha' },
                      ].map(opt => (
                        <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
                          <input type="radio" name="noveltyDataType" checked={noveltyDataTypeFilter === opt.value}
                            onChange={() => setNoveltyDataTypeFilter(opt.value)}
                            className="accent-indigo-600" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {volatileNovelties.length > 0 && (
                    <div className="mb-4">
                      <div className="overflow-x-auto">
                        <table id="novelties-table" className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Código</th>
                              <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Variable</th>
                              <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Comportamiento</th>
                              <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Tipo</th>
                              <th className="text-right py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Valor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {volatileNovelties.map(({ variable: vv, novelty }) => {
                              const varKey = `${vv.id}_${vv.payrollVariableId}`;
                              const val = noveltyValues[varKey] ?? (novelty?.value ?? vv.value);
                              return (
                                <tr key={vv.id} className="border-b border-gray-100 dark:border-gray-800">
                                  <td className="py-2 px-3 font-mono text-xs text-indigo-600">{vv.variableCode || `VAR#${vv.payrollVariableId}`}</td>
                                  <td className="py-2 px-3 text-gray-700 dark:text-gray-300">
                                    {vv.variableName || `Variable #${vv.payrollVariableId}`}
                                    {vv.coinName?.toLowerCase().includes('dólar') || vv.coinName?.toLowerCase().includes('dollar') ? <span className="text-green-600 font-medium ml-1">($)</span> : null}
                                  </td>
                                  <td className="py-2 px-3">
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                      vv.behavior === Behavior.Fixed ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                      vv.behavior === Behavior.Volatile ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                    }`}>
                                      {vv.behavior === Behavior.Fixed ? 'Fija' : vv.behavior === Behavior.Volatile ? 'Volátil' : 'Calculada'}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3">
                                    <span className="badge-blue text-xs">{vv.dataType === DataType.Numeric ? 'Numérico' : vv.dataType === DataType.Alphanumeric ? 'Alfanumérico' : 'Fecha'}</span>
                                  </td>
                                  <td className="py-2 px-3 text-right">
                                    <DecimalInput value={val}
                                      onChange={(v) => setNoveltyValues(prev => ({ ...prev, [varKey]: v }))}
                                      onKeyDown={handleNoveltyKeyDown}
                                      className="input-field py-1 text-sm w-28 text-right" />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {volatileNovelties.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-400">No hay variables que coincidan con los filtros seleccionados.</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {activeContract && volatileNovelties.length > 0 && (
              <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
                <button onClick={() => setNoveltiesModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm">
                  Cerrar
                </button>
                <button onClick={handleSaveNovelties} disabled={isLoadingNovelties}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50">
                  {isLoadingNovelties ? 'Guardando...' : 'Guardar Novedades'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}