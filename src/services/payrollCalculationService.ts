import { api } from './api';
import type { ApiResult, PayrollResultDto } from '../types';

export const payrollCalculationService = {
  async calculateEmployeePayroll(employeeId: number) {
    const { data } = await api.get<ApiResult<PayrollResultDto[]>>('/api/PayrollCalculation/CalculateEmployeePayroll', { params: { employeeId } });
    return data;
  },
  async calculateAllPayroll() {
    const { data } = await api.get<ApiResult<PayrollResultDto[]>>('/api/PayrollCalculation/CalculateAllPayroll');
    return data;
  },
  async closePayroll() {
    const { data } = await api.post<ApiResult<boolean>>('/api/PayrollCalculation/ClosePayroll');
    return data;
  },
};
