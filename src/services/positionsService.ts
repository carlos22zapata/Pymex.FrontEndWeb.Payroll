import { api } from './api';
import type { ApiResult, PositionDto } from '../types';

export const positionsService = {
  async getById(id: number) {
    const { data } = await api.get<ApiResult<PositionDto>>('/api/Positions/GetById', { params: { id } });
    return data;
  },
  async getNavBarById(navPositionId: number, idReference: number) {
    const { data } = await api.get<ApiResult<PositionDto>>('/api/Positions/GetNavBarById', { params: { navPositionId, idReference } });
    return data;
  },
  async getList(name?: string) {
    const { data } = await api.get<ApiResult<PositionDto[]>>('/api/Positions/GetList', { params: { name } });
    return data;
  },
  async insert(position: Partial<PositionDto>) {
    const { data } = await api.post<ApiResult<boolean>>('/api/Positions/Insert', position);
    return data;
  },
  async update(position: Partial<PositionDto>) {
    const { data } = await api.put<ApiResult<boolean>>('/api/Positions/Update', position);
    return data;
  },
  async delete(id: number) {
    const { data } = await api.delete<ApiResult<boolean>>('/api/Positions/Delete', { params: { id } });
    return data;
  },
};
