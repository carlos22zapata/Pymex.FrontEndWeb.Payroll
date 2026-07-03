import { api } from './api';
import type { ApiResult, EmployeeDto } from '../types';

export const employeesService = {
  async getById(id: number) {
    const { data } = await api.get<ApiResult<EmployeeDto>>('/api/Employees/GetById', { params: { id } });
    return data;
  },
  async getNavBarById(navPositionId: number, idReference: number) {
    const { data } = await api.get<ApiResult<EmployeeDto>>('/api/Employees/GetNavBarById', { params: { navPositionId, idReference } });
    return data;
  },
  async getList(page = 1, pageSize = 20, name?: string) {
    const { data } = await api.get<ApiResult<EmployeeDto[]>>('/api/Employees/GetList', { params: { page, pageSize, name } });
    return data;
  },
  async getByDepartmentId(departmentId: number) {
    const { data } = await api.get<ApiResult<EmployeeDto[]>>('/api/Employees/GetByDepartmentId', { params: { departmentId } });
    return data;
  },
  async getByCode(code: string) {
    const { data } = await api.get<ApiResult<EmployeeDto>>('/api/Employees/GetByCode', { params: { code } });
    return data;
  },
  async insert(employee: Partial<EmployeeDto>) {
    const { data } = await api.post<ApiResult<boolean>>('/api/Employees/Insert', employee);
    return data;
  },
  async update(employee: Partial<EmployeeDto>) {
    const { data } = await api.put<ApiResult<boolean>>('/api/Employees/Update', employee);
    return data;
  },
  async delete(id: number) {
    const { data } = await api.delete<ApiResult<boolean>>('/api/Employees/Delete', { params: { id } });
    return data;
  },
};
