import { api } from './api';
import type { ApiResult, PayrollConceptDto } from '../types';

export const payrollConceptsService = {
  async getById(id: number) {
    const { data } = await api.get<ApiResult<PayrollConceptDto>>('/api/PayrollConcepts/GetById', { params: { id } });
    return data;
  },
  async getNavBarById(navPositionId: number, idReference: number) {
    const { data } = await api.get<ApiResult<PayrollConceptDto>>('/api/PayrollConcepts/GetNavBarById', { params: { navPositionId, idReference } });
    return data;
  },
  async getList(name?: string) {
    const { data } = await api.get<ApiResult<PayrollConceptDto[]>>('/api/PayrollConcepts/GetList', { params: { name } });
    return data;
  },
  async insert(concept: Partial<PayrollConceptDto>) {
    const { data } = await api.post<ApiResult<boolean>>('/api/PayrollConcepts/Insert', concept);
    return data;
  },
  async update(concept: Partial<PayrollConceptDto>) {
    const { data } = await api.put<ApiResult<boolean>>('/api/PayrollConcepts/Update', concept);
    return data;
  },
  async delete(id: number) {
    const { data } = await api.delete<ApiResult<boolean>>('/api/PayrollConcepts/Delete', { params: { id } });
    return data;
  },
};
