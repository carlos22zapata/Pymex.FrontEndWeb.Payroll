import { api } from './api';
import type { ApiResult, RelatedContractDto } from '../types';

export const relatedContractsService = {
  async getById(id: number) {
    const { data } = await api.get<ApiResult<RelatedContractDto>>('/api/RelatedContracts/GetById', { params: { id } });
    return data;
  },
  async getNavBarById(navPositionId: number, idReference: number) {
    const { data } = await api.get<ApiResult<RelatedContractDto>>('/api/RelatedContracts/GetNavBarById', { params: { navPositionId, idReference } });
    return data;
  },
  async getByContractId(contractId: number) {
    const { data } = await api.get<ApiResult<RelatedContractDto[]>>('/api/RelatedContracts/GetByContractId', { params: { contractId } });
    return data;
  },
  async insert(relatedContract: Partial<RelatedContractDto>) {
    const { data } = await api.post<ApiResult<boolean>>('/api/RelatedContracts/Insert', relatedContract);
    return data;
  },
  async update(relatedContract: Partial<RelatedContractDto>) {
    const { data } = await api.put<ApiResult<boolean>>('/api/RelatedContracts/Update', relatedContract);
    return data;
  },
  async delete(id: number) {
    const { data } = await api.delete<ApiResult<boolean>>('/api/RelatedContracts/Delete', { params: { id } });
    return data;
  },
};
