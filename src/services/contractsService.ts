import { api } from './api';
import type { ApiResult, ContractDto } from '../types';

export const contractsService = {
  async getById(id: number) {
    const { data } = await api.get<ApiResult<ContractDto>>('/api/Contracts/GetById', { params: { id } });
    return data;
  },
  async getNavBarById(navPositionId: number, idReference: number) {
    const { data } = await api.get<ApiResult<ContractDto>>('/api/Contracts/GetNavBarById', { params: { navPositionId, idReference } });
    return data;
  },
  async getList(name?: string) {
    const { data } = await api.get<ApiResult<ContractDto[]>>('/api/Contracts/GetList', { params: { name } });
    return data;
  },
  async insert(contract: Partial<ContractDto>) {
    const { data } = await api.post<ApiResult<boolean>>('/api/Contracts/Insert', contract);
    return data;
  },
  async update(contract: Partial<ContractDto>) {
    const { data } = await api.put<ApiResult<boolean>>('/api/Contracts/Update', contract);
    return data;
  },
  async delete(id: number) {
    const { data } = await api.delete<ApiResult<boolean>>('/api/Contracts/Delete', { params: { id } });
    return data;
  },
};
