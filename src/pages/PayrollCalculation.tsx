import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calculator, Loader2, FileText, DollarSign, AlertTriangle, CheckCircle, Coins } from 'lucide-react';
import toast from 'react-hot-toast';
import { Layout } from '../components/Layout';
import { formatNumber } from '../components/DecimalInput';
import { payrollCalculationService } from '../services/payrollCalculationService';
import { employeesService } from '../services/employeesService';
import { coinsService } from '../services/coinsService';
import { coinQuotationsService } from '../services/coinQuotationsService';
import { SearchModal } from '../components/SearchModal';
import type { PayrollResultDto, EmployeeDto, CoinsDto, CoinQuotationDto } from '../types';

export function PayrollCalculationPage() {
  const navigate = useNavigate();
  const [results, setResults] = useState<PayrollResultDto[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeDto | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchRecords, setSearchRecords] = useState<EmployeeDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedEmployee, setExpandedEmployee] = useState<number | null>(null);
  const [coins, setCoins] = useState<CoinsDto[]>([]);
  const [selectedCoinId, setSelectedCoinId] = useState(0);
  const [latestQuotation, setLatestQuotation] = useState<CoinQuotationDto | null>(null);

  const loadCoins = useCallback(async () => {
    const result = await coinsService.getList(1, 100, '');
    if (result.isSuccess && result.value) {
      const alternas = result.value.filter(c => c.id > 1);
      setCoins(alternas);
      if (alternas.length > 0) setSelectedCoinId(alternas[0].id);
    }
  }, []);

  useEffect(() => { loadCoins(); }, [loadCoins]);

  useEffect(() => {
    (async () => {
      const result = await coinQuotationsService.getList(1, 1, selectedCoinId);
      if (result.isSuccess && result.value && result.value.length > 0) setLatestQuotation(result.value[0]);
      else setLatestQuotation(null);
    })();
  }, [selectedCoinId]);

  const handleCalculateAll = async () => {
    setIsCalculating(true);
    try {
      const result = await payrollCalculationService.calculateAllPayroll();
      if (result.isSuccess && result.value) {
        setResults(result.value);
        toast.success(`Nómina calculada para ${result.value.length} empleados`);
      } else {
        toast.error(result.errorMessage || 'Error al calcular nómina');
      }
    } catch {
      toast.error('Error al calcular nómina');
    } finally { setIsCalculating(false); }
  };

  const handleCalculateEmployee = async () => {
    if (!selectedEmployee) { toast.error('Seleccione un empleado'); return; }
    setIsCalculating(true);
    try {
      const result = await payrollCalculationService.calculateEmployeePayroll(selectedEmployee.id);
      if (result.isSuccess && result.value) {
        setResults(result.value);
        toast.success(`Nómina calculada para ${selectedEmployee.name}`);
      } else {
        toast.error(result.errorMessage || 'Error al calcular nómina');
      }
    } catch {
      toast.error('Error al calcular nómina');
    } finally { setIsCalculating(false); }
  };

  const handleClosePayroll = async () => {
    if (!window.confirm('¿Está seguro de cerrar el período? Las variables volátiles se resetearán a 0.')) return;
    setIsClosing(true);
    try {
      const result = await payrollCalculationService.closePayroll();
      if (result.isSuccess) {
        toast.success('Período de nómina cerrado correctamente');
        setResults([]);
      } else {
        toast.error(result.errorMessage || 'Error al cerrar período');
      }
    } catch {
      toast.error('Error al cerrar período');
    } finally { setIsClosing(false); }
  };

  const handleSearchEmployee = async (query: string) => {
    setIsSearching(true);
    try {
      const result = await employeesService.getList(1, 50, query);
      if (result.isSuccess && result.value) setSearchRecords(result.value);
    } finally { setIsSearching(false); }
  };

  const handleSelectEmployee = (record: EmployeeDto) => {
    setSelectedEmployee(record);
    setSearchModalOpen(false);
  };

  const totals = results.reduce(
    (acc, r) => ({
      earnings: acc.earnings + r.totalEarnings,
      deductions: acc.deductions + r.totalDeductions,
      netPay: acc.netPay + r.netPay,
    }),
    { earnings: 0, deductions: 0, netPay: 0 },
  );

  return (
    <Layout>
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8 py-2 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Calcular Nómina</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Cálculo y cierre de nómina</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        {coins.length > 0 && (
          <div className="stat-card">
            <div className="flex items-center gap-4 flex-nowrap whitespace-nowrap">
              <div className="flex items-center gap-2 shrink-0">
                <Coins className="h-5 w-5 text-indigo-600 shrink-0" />
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 shrink-0">Monedas Alternas</h3>
              </div>
              <select value={selectedCoinId} onChange={(e) => setSelectedCoinId(Number(e.target.value))}
                className="input-field w-52 text-sm">
                {coins.map((c) => (<option key={c.id} value={c.id}>{c.name} ({c.symbol})</option>))}
              </select>
              {latestQuotation && (
                <>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Cotización:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{formatNumber(latestQuotation.value)}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Fecha:</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{new Date(latestQuotation.date).toLocaleDateString('es-ES')}</span>
                  </div>
                </>
              )}
              <div className="ml-auto shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm('¿Obtener tasas actualizadas del BCV?')) return;
                    const result = await coinQuotationsService.updateBCV();
                    if (result.isSuccess) {
                      toast.success('Tasas del BCV actualizadas correctamente');
                      if (selectedCoinId > 0) {
                        const q = await coinQuotationsService.getList(1, 1, selectedCoinId);
                        if (q.isSuccess && q.value && q.value.length > 0) setLatestQuotation(q.value[0]);
                      }
                    } else {
                      toast.error(result.errorMessage ?? 'Error al sincronizar con BCV');
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <Loader2 className="h-4 w-4" />
                  BCV
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="stat-card">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Opciones de Cálculo</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-500 dark:text-gray-400">Empleado (opcional)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={selectedEmployee ? `${selectedEmployee.name} ${selectedEmployee.lastName}` : ''}
                  placeholder="Seleccione un empleado..."
                  className="input-field flex-1 cursor-pointer"
                  onClick={() => setSearchModalOpen(true)}
                />
                {selectedEmployee && (
                  <button onClick={() => setSelectedEmployee(null)}
                    className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    Limpiar
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleCalculateEmployee}
                disabled={!selectedEmployee || isCalculating}
                className="flex-1 px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCalculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
                Calcular Empleado
              </button>
              <button
                onClick={handleCalculateAll}
                disabled={isCalculating}
                className="flex-1 px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCalculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                Calcular Todos
              </button>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleClosePayroll}
                disabled={isClosing || results.length === 0}
                className="w-full px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isClosing ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                Cerrar Período
              </button>
            </div>
          </div>
        </div>

        {results.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="stat-card">
                <div className="flex items-center gap-2 text-emerald-600 mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Total Asignaciones</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${totals.earnings.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="stat-card">
                <div className="flex items-center gap-2 text-rose-600 mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Total Deducciones</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${totals.deductions.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="stat-card">
                <div className="flex items-center gap-2 text-indigo-600 mb-1">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Neto a Pagar</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${totals.netPay.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="stat-card">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Resultados por Empleado</h3>
              <div className="space-y-3">
                {results.map((result) => (
                  <div key={result.employeeId} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedEmployee(expandedEmployee === result.employeeId ? null : result.employeeId)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 font-semibold text-sm">
                          {result.employeeName.charAt(0)}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{result.employeeName}</p>
                          <p className="text-xs text-gray-400">{result.concepts.length} conceptos</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          ${formatNumber(result.netPay)}
                        </p>
                        <p className="text-xs text-gray-400">
                          E: ${formatNumber(result.totalEarnings)} - D: ${formatNumber(result.totalDeductions)}
                        </p>
                      </div>
                    </button>

                    {expandedEmployee === result.employeeId && (
                      <div className="border-t border-gray-200 dark:border-gray-700">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-50 dark:bg-gray-800/50">
                                <th className="text-left py-2 px-4 text-gray-500 dark:text-gray-400 font-medium">Código</th>
                                <th className="text-left py-2 px-4 text-gray-500 dark:text-gray-400 font-medium">Concepto</th>
                                <th className="text-center py-2 px-4 text-gray-500 dark:text-gray-400 font-medium">Tipo</th>
                                <th className="text-right py-2 px-4 text-gray-500 dark:text-gray-400 font-medium">Monto</th>
                              </tr>
                            </thead>
                            <tbody>
                              {result.concepts.map((concept) => (
                                <tr key={concept.payrollConceptId} className="border-b border-gray-100 dark:border-gray-800">
                                  <td className="py-2 px-4 font-mono text-xs text-indigo-600">{concept.conceptCode}</td>
                                  <td className="py-2 px-4 text-gray-700 dark:text-gray-300">{concept.conceptName}</td>
                                  <td className="py-2 px-4 text-center">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                      concept.conceptType === 1 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40' :
                                      concept.conceptType === 3 ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/40' :
                                      concept.conceptType === 2 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40' :
                                      'bg-gray-100 text-gray-500 dark:bg-gray-700'
                                    }`}>
                                      {concept.conceptType === 1 ? 'Asignación' :
                                       concept.conceptType === 2 ? 'Deducción' :
                                       concept.conceptType === 3 ? 'Retención' : 'Aporte'}
                                    </span>
                                  </td>
                                  <td className={`py-2 px-4 text-right font-mono font-medium ${
                                    concept.conceptType === 1
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-rose-600 dark:text-rose-400'
                                  }`}>
                                    {concept.conceptType === 1 ? '+' : '-'}${formatNumber(Math.abs(concept.amount))}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {results.length === 0 && !isCalculating && (
          <div className="stat-card text-center py-12">
            <Calculator className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-400 dark:text-gray-500">
              Presione "Calcular Todos" o seleccione un empleado para calcular su nómina
            </p>
          </div>
        )}
      </div>

      <SearchModal open={searchModalOpen} title="Buscar Empleado" records={searchRecords} isSearching={isSearching}
        hasMore={false} onSearch={handleSearchEmployee} onLoadMore={() => {}} onSelect={handleSelectEmployee}
        onClose={() => setSearchModalOpen(false)} />
    </Layout>
  );
}
