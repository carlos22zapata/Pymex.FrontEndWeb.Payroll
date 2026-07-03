import { api } from './api';
import type { ApiResult, ContractVariableDto } from '../types';

export const contractVariablesService = {
  async getById(id: number) { const { data } = await api.get<ApiResult<ContractVariableDto>>('/api/ContractVariables/GetById', { params: { id } }); return data; },
  async getNavBarById(navPositionId: number, idReference: number) { const { data } = await api.get<ApiResult<ContractVariableDto>>('/api/ContractVariables/GetNavBarById', { params: { navPositionId, idReference } }); return data; },
  async getByContractId(contractId: number) { const { data } = await api.get<ApiResult<ContractVariableDto[]>>('/api/ContractVariables/GetByContractId', { params: { contractId } }); return data; },
  async insert(variable: Partial<ContractVariableDto>) { const { data } = await api.post<ApiResult<boolean>>('/api/ContractVariables/Insert', variable); return data; },
  async update(variable: Partial<ContractVariableDto>) { const { data } = await api.put<ApiResult<boolean>>('/api/ContractVariables/Update', variable); return data; },
  async delete(id: number) { const { data } = await api.delete<ApiResult<boolean>>('/api/ContractVariables/Delete', { params: { id } }); return data; },
};