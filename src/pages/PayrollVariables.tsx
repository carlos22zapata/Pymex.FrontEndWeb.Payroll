import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { Layout } from '../components/Layout';
import { OptionsBar } from '../components/OptionsBar';
import { SearchModal } from '../components/SearchModal';
import { payrollVariablesService } from '../services/payrollVariablesService';
import { coinsService } from '../services/coinsService';
import { DataType, Behavior } from '../types';
import type { PayrollVariableDto, CoinsDto } from '../types';

const getDefault = (): PayrollVariableDto => ({
  id: 0, code: '', name: '', dataType: DataType.Numeric, behavior: Behavior.Fixed, isActive: true, coinId: 0,
});

const dataTypeOptions = [
  { value: DataType.Numeric, label: 'Numérico' },
  { value: DataType.Alphanumeric, label: 'Alfanumérico' },
  { value: DataType.Date, label: 'Fecha' },
];

const behaviorOptions = [
  { value: Behavior.Fixed, label: 'Fija' },
  { value: Behavior.Volatile, label: 'Volátil' },
  { value: Behavior.Calculated, label: 'Calculada' },
];

export function PayrollVariablesPage() {
  const navigate = useNavigate();
  const [entity, setEntity] = useState<PayrollVariableDto>(getDefault());
  const [variables, setVariables] = useState<PayrollVariableDto[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchRecords, setSearchRecords] = useState<PayrollVariableDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [navId, setNavId] = useState(0);
  const [behaviorFilter, setBehaviorFilter] = useState<Behavior | 0>(0);
  const [coins, setCoins] = useState<CoinsDto[]>([]);

  const loadList = useCallback(async () => {
    const result = await payrollVariablesService.getList();
    if (result.isSuccess && result.value) setVariables(result.value);
  }, []);

  const loadCoins = useCallback(async () => {
    const result = await coinsService.getList(1, 100, '');
    if (result.isSuccess && result.value) setCoins(result.value);
  }, []);

  useEffect(() => { loadList(); loadCoins(); }, [loadList, loadCoins]);

  const handleNew = () => { setEntity(getDefault()); setNavId(0); };

  const handleSave = async () => {
    if (!entity.code.trim() || !entity.name.trim()) {
      toast.error('Código y nombre son obligatorios');
      return;
    }
    setIsSaving(true);
    try {
      const payload = { code: entity.code, name: entity.name, dataType: entity.dataType, behavior: entity.behavior, isActive: entity.isActive, coinId: entity.coinId };
      const result = entity.id === 0
        ? await payrollVariablesService.insert(payload)
        : await payrollVariablesService.update({ id: entity.id, ...payload });
      if (result.isSuccess) {
        toast.success(entity.id === 0 ? 'Variable creada' : 'Variable actualizada');
        if (entity.id === 0) handleNew();
        await loadList();
      } else {
        toast.error(result.errorMessage || 'Error al guardar');
      }
    } finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (entity.id === 0) return;
    if (!window.confirm('¿Eliminar esta variable?')) return;
    const result = await payrollVariablesService.delete(entity.id);
    if (result.isSuccess) {
      toast.success('Variable eliminada');
      handleNew();
      await loadList();
    } else {
      toast.error(result.errorMessage || 'Error al eliminar');
    }
  };

  const handleSelect = (record: PayrollVariableDto) => {
    setEntity(record); setNavId(record.id); setSearchModalOpen(false);
  };

  const navigateRecord = async (navPositionId: number) => {
    const result = await payrollVariablesService.getNavBarById(navPositionId, navId);
    if (result.isSuccess && result.value) {
      setEntity(result.value); setNavId(result.value.id);
    } else {
      toast.error(result.errorMessage || 'No hay más registros');
    }
  };

  const sortByBehaviorThenName = (a: PayrollVariableDto, b: PayrollVariableDto) =>
    a.behavior - b.behavior || a.name.localeCompare(b.name);

  const handleSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    try {
      const result = await payrollVariablesService.getList(query);
      if (result.isSuccess && result.value) setSearchRecords(result.value.sort(sortByBehaviorThenName));
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
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Variables de Nómina</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Insumos para las fórmulas de conceptos</p>
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
              {entity.id === 0 ? 'Nueva Variable' : `Variable #${entity.id}`}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código</label>
                <input type="text" value={entity.code} onChange={(e) => setEntity({ ...entity, code: e.target.value })}
                  className="input-field font-mono" placeholder="V_CODIGO" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                <input type="text" value={entity.name} onChange={(e) => setEntity({ ...entity, name: e.target.value })}
                  className="input-field" placeholder="Nombre de la variable" />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={entity.isActive} onChange={(e) => setEntity({ ...entity, isActive: e.target.checked })}
                    className="sr-only peer" />
                  <div className="toggle-track relative">
                    <div className="toggle-thumb" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Activo</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Dato</label>
                <select value={entity.dataType} onChange={(e) => setEntity({ ...entity, dataType: Number(e.target.value) as DataType })}
                  className="input-field">
                  {dataTypeOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comportamiento</label>
                <select value={entity.behavior} onChange={(e) => setEntity({ ...entity, behavior: Number(e.target.value) as Behavior })}
                  className="input-field">
                  {behaviorOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Moneda</label>
                <select value={entity.coinId} onChange={(e) => setEntity({ ...entity, coinId: Number(e.target.value) })}
                  className="input-field">
                  <option value={0}>-- Seleccione --</option>
                  {coins.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="stat-card mt-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Lista de Variables</h3>
          <div className="flex items-center gap-4 mb-3">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Filtrar:</span>
            {[
              { value: 0, label: 'Todas' },
              { value: Behavior.Fixed, label: 'Fija' },
              { value: Behavior.Volatile, label: 'Volátil' },
              { value: Behavior.Calculated, label: 'Calculada' },
            ].map(opt => (
              <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="behaviorFilter" checked={behaviorFilter === opt.value}
                  onChange={() => setBehaviorFilter(opt.value)}
                  className="accent-indigo-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
              </label>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Código</th>
                  <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Nombre</th>
                  <th className="text-center py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Tipo</th>
                  <th className="text-center py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Comportamiento</th>
                  <th className="text-center py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {variables.filter(v => behaviorFilter === 0 || v.behavior === behaviorFilter).map((v) => (
                  <tr key={v.id} onClick={() => { setEntity(v); setNavId(v.id); }}
                    className={`border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      entity.id === v.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                    }`}>
                    <td className="py-2 px-3 font-mono text-xs text-indigo-600 dark:text-indigo-400">{v.code}</td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{v.name}</td>
                    <td className="py-2 px-3 text-center">
                      <span className="badge-blue">{v.dataTypeName || (v.dataType === 1 ? 'Numérico' : v.dataType === 2 ? 'Alfanumérico' : 'Fecha')}</span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        v.behavior === Behavior.Fixed ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        v.behavior === Behavior.Volatile ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      }`}>
                        {v.behavior === Behavior.Fixed ? 'Fija' : v.behavior === Behavior.Volatile ? 'Volátil' : 'Calculada'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={v.isActive ? 'badge-green' : 'badge-red'}>
                        {v.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <SearchModal open={searchModalOpen} title="Buscar Variable" records={searchRecords} isSearching={isSearching}
        hasMore={false} onSearch={handleSearch} onLoadMore={() => {}} onSelect={handleSelect}
        onClose={() => setSearchModalOpen(false)}
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
