import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardPage } from './pages/Dashboard';
import { DepartmentsPage } from './pages/Departments';
import { PositionsPage } from './pages/Positions';
import { EmployeesPage } from './pages/Employees';
import { ContractsPage } from './pages/Contracts';
import { PayrollVariablesPage } from './pages/PayrollVariables';
import { PayrollConceptsPage } from './pages/PayrollConcepts';

import { PayrollCalculationPage } from './pages/PayrollCalculation';
import { CoinsPage } from './pages/Coins';
import { CoinRatesPage } from './pages/CoinRates';

export function App() {
  return (
    <BrowserRouter basename="/payroll">
      <ThemeProvider>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '12px',
                background: '#1f2937',
                color: '#f9fafb',
                fontSize: '14px',
              },
            }}
          />
          <Routes>
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/departamentos" element={<ProtectedRoute><DepartmentsPage /></ProtectedRoute>} />
            <Route path="/cargos" element={<ProtectedRoute><PositionsPage /></ProtectedRoute>} />
            <Route path="/empleados" element={<ProtectedRoute><EmployeesPage /></ProtectedRoute>} />
            <Route path="/contratos" element={<ProtectedRoute><ContractsPage /></ProtectedRoute>} />
            <Route path="/variables-nomina" element={<ProtectedRoute><PayrollVariablesPage /></ProtectedRoute>} />
            <Route path="/conceptos-nomina" element={<ProtectedRoute><PayrollConceptsPage /></ProtectedRoute>} />

            <Route path="/calcular-nomina" element={<ProtectedRoute><PayrollCalculationPage /></ProtectedRoute>} />
            <Route path="/monedas" element={<ProtectedRoute><CoinsPage /></ProtectedRoute>} />
            <Route path="/tasa-monedas" element={<ProtectedRoute><CoinRatesPage /></ProtectedRoute>} />
            <Route path="\*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
