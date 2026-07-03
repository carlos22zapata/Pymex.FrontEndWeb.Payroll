import { api } from './api';
import type { ApiResult, ContractConceptDto } from '../types';

export const contractConceptsService = {
  async getById(id: number) {
    const { data } = await api.get<ApiResult<ContractConceptDto>>('/api/ContractConcepts/GetById', { params: { id } });
    return data;
  },
  async getNavBarById(navPositionId: number, idReference: number) {
    const { data } = await api.get<ApiResult<ContractConceptDto>>('/api/ContractConcepts/GetNavBarById', { params: { navPositionId, idReference } });
    return data;
  },
  async getByContractId(contractId: number) {
    const { data } = await api.get<ApiResult<ContractConceptDto[]>>('/api/ContractConcepts/GetByContractId', { params: { contractId } });
    return data;
  },
  async insert(contractConcept: Partial<ContractConceptDto>) {
    const { data } = await api.post<ApiResult<boolean>>('/api/ContractConcepts/Insert', contractConcept);
    return data;
  },
  async update(contractConcept: Partial<ContractConceptDto>) {
    const { data } = await api.put<ApiResult<boolean>>('/api/ContractConcepts/Update', contractConcept);
    return data;
  },
  async delete(id: number) {
    const { data } = await api.delete<ApiResult<boolean>>('/api/ContractConcepts/Delete', { params: { id } });
    return data;
  },
};
