import { api } from './api';
import type { ApiResult, CoinsDto } from '../types';

export const coinsService = {
  async getById(id: number) {
    const { data } = await api.get<ApiResult<CoinsDto>>('/api/Coins/GetById', { params: { id } });
    return data;
  },
  async getNavBarById(navPositionId: number, idReference: number) {
    const { data } = await api.get<ApiResult<CoinsDto>>('/api/Coins/GetNavBarById', { params: { navPositionId, idReference } });
    return data;
  },
  async getList(page = 1, pageSize = 50, name = '') {
    const { data } = await api.get<ApiResult<CoinsDto[]>>('/api/Coins/GetList', { params: { page, pageSize, name } });
    return data;
  },
  async insert(dto: CoinsDto) {
    const { data } = await api.post<ApiResult<boolean>>('/api/Coins/Insert', dto);
    return data;
  },
  async update(dto: CoinsDto) {
    const { data } = await api.put<ApiResult<boolean>>('/api/Coins/Update', dto);
    return data;
  },
  async delete(id: number) {
    const { data } = await api.delete<ApiResult<boolean>>('/api/Coins/Delete', { params: { id } });
    return data;
  },
};
