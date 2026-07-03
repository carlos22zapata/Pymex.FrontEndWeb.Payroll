import { api } from './api';
import type { ApiResult, DepartmentDto } from '../types';

export const departmentsService = {
  async getById(id: number) {
    const { data } = await api.get<ApiResult<DepartmentDto>>('/api/Departments/GetById', { params: { id } });
    return data;
  },
  async getNavBarById(navPositionId: number, idReference: number) {
    const { data } = await api.get<ApiResult<DepartmentDto>>('/api/Departments/GetNavBarById', { params: { navPositionId, idReference } });
    return data;
  },
  async getList(name?: string) {
    const { data } = await api.get<ApiResult<DepartmentDto[]>>('/api/Departments/GetList', { params: { name } });
    return data;
  },
  async insert(department: Partial<DepartmentDto>) {
    const { data } = await api.post<ApiResult<boolean>>('/api/Departments/Insert', department);
    return data;
  },
  async update(department: Partial<DepartmentDto>) {
    const { data } = await api.put<ApiResult<boolean>>('/api/Departments/Update', department);
    return data;
  },
  async delete(id: number) {
    const { data } = await api.delete<ApiResult<boolean>>('/api/Departments/Delete', { params: { id } });
    return data;
  },
};
