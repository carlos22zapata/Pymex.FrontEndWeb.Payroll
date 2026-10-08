import { useEffect, useState } from 'react';
import { todayWall } from '../lib/timeZone';
import { Layout } from '../components/Layout';
import { employeesService } from '../services/employeesService';
import { contractsService } from '../services/contractsService';
import { payrollVariablesService } from '../services/payrollVariablesService';
import { payrollConceptsService } from '../services/payrollConceptsService';
import { payrollCalculationService } from '../services/payrollCalculationService';
import {
  Users,
  FileText,
  Variable,
  Sigma,
  DollarSign,
  TrendingUp,
  Calendar,
  Loader2,
} from 'lucide-react';

export function DashboardPage() {
  const [stats, setStats] = useState({
    employees: 0,
    activeEmployees: 0,
    contracts: 0,
    variables: 0,
    concepts: 0,
  });
  const [lastCalculation, setLastCalculation] = useState<{ date: string; totalNet: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [empResult, contResult, varResult, concResult, calcResult] = await Promise.all([
          employeesService.getList(1, 1),
          contractsService.getList(),
          payrollVariablesService.getList(),
          payrollConceptsService.getList(),
          payrollCalculationService.calculateAllPayroll(),
        ]);

        let totalNet = 0;
        let totalEmployees = 0;
        let activeEmployees = 0;

        if (empResult.isSuccess && empResult.value) {
          totalEmployees = empResult.value.length;
          activeEmployees = empResult.value.filter((e) => e.isActive !== false).length;
        }

        if (calcResult.isSuccess && calcResult.value) {
          totalNet = calcResult.value.reduce((sum, r) => sum + r.netPay, 0);
          totalEmployees = calcResult.value.length;
        }

        setStats({
          employees: totalEmployees,
          activeEmployees,
          contracts: contResult.isSuccess && contResult.value ? contResult.value.length : 0,
          variables: varResult.isSuccess && varResult.value ? varResult.value.length : 0,
          concepts: concResult.isSuccess && concResult.value ? concResult.value.length : 0,
        });

        if (calcResult.isSuccess && calcResult.value && calcResult.value.length > 0) {
          setLastCalculation({
            date: new Intl.DateTimeFormat('es-ES', { timeZone: 'UTC' }).format(new Date(`${todayWall()}T12:00:00Z`)),
            totalNet,
          });
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8 py-2 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Dashboard Nómina</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Resumen del sistema de nómina</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="stat-card">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Empleados</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.employees}</p>
                <p className="text-xs text-emerald-600">{stats.activeEmployees} activos</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Contratos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.contracts}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/40 text-amber-600">
                <Variable className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Variables</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.variables}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-900/40 text-violet-600">
                <Sigma className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Conceptos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.concepts}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="h-5 w-5 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Último Cálculo</h3>
            </div>
            {lastCalculation ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>{lastCalculation.date}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Total Neto a Pagar</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    ${lastCalculation.totalNet.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">
                No se ha realizado ningún cálculo aún. Vaya a "Calcular Nómina" para iniciar.
              </p>
            )}
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-5 w-5 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Acciones Rápidas</h3>
            </div>
            <div className="space-y-2">
              <a
                href="/empleados"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Users className="h-5 w-5 text-indigo-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Gestionar Empleados</span>
              </a>
              <a
                href="/variables-nomina"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Variable className="h-5 w-5 text-amber-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Configurar Variables</span>
              </a>
              <a
                href="/conceptos-nomina"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Sigma className="h-5 w-5 text-violet-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Definir Conceptos y Fórmulas</span>
              </a>
              <a
                href="/calcular-nomina"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Calcular Nómina</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
