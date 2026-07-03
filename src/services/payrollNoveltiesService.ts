import { api } from './api';
import type { ApiResult, PayrollNoveltyDto } from '../types';

export const payrollNoveltiesService = {
  async getById(id: number) { const { data } = await api.get<ApiResult<PayrollNoveltyDto>>('/api/PayrollNovelties/GetById', { params: { id } }); return data; },
  async getNavBarById(navPositionId: number, idReference: number) { const { data } = await api.get<ApiResult<PayrollNoveltyDto>>('/api/PayrollNovelties/GetNavBarById', { params: { navPositionId, idReference } }); return data; },
  async getByContractId(contractId: number) { const { data } = await api.get<ApiResult<PayrollNoveltyDto[]>>('/api/PayrollNovelties/GetByContractId', { params: { contractId } }); return data; },
  async insert(novelty: Partial<PayrollNoveltyDto>) { const { data } = await api.post<ApiResult<boolean>>('/api/PayrollNovelties/Insert', novelty); return data; },
  async update(novelty: Partial<PayrollNoveltyDto>) { const { data } = await api.put<ApiResult<boolean>>('/api/PayrollNovelties/Update', novelty); return data; },
  async delete(id: number) { const { data } = await api.delete<ApiResult<boolean>>('/api/PayrollNovelties/Delete', { params: { id } }); return data; },
};