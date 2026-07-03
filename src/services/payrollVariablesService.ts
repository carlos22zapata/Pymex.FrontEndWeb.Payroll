import { api } from './api';
import type { ApiResult, PayrollVariableDto } from '../types';

export const payrollVariablesService = {
  async getById(id: number) {
    const { data } = await api.get<ApiResult<PayrollVariableDto>>('/api/PayrollVariables/GetById', { params: { id } });
    return data;
  },
  async getNavBarById(navPositionId: number, idReference: number) {
    const { data } = await api.get<ApiResult<PayrollVariableDto>>('/api/PayrollVariables/GetNavBarById', { params: { navPositionId, idReference } });
    return data;
  },
  async getList(name?: string) {
    const { data } = await api.get<ApiResult<PayrollVariableDto[]>>('/api/PayrollVariables/GetList', { params: { name } });
    return data;
  },
  async insert(variable: Partial<PayrollVariableDto>) {
    const { data } = await api.post<ApiResult<boolean>>('/api/PayrollVariables/Insert', variable);
    return data;
  },
  async update(variable: Partial<PayrollVariableDto>) {
    const { data } = await api.put<ApiResult<boolean>>('/api/PayrollVariables/Update', variable);
    return data;
  },
  async delete(id: number) {
    const { data } = await api.delete<ApiResult<boolean>>('/api/PayrollVariables/Delete', { params: { id } });
    return data;
  },
};
