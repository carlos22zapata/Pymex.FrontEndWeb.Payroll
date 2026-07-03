import { api } from './api';
import type { ApiResult, CoinQuotationDto } from '../types';

export const coinQuotationsService = {
  async getById(id: number) {
    const { data } = await api.get<ApiResult<CoinQuotationDto>>('/api/CoinQuotations/GetById', { params: { id } });
    return data;
  },
  async getList(page = 1, pageSize = 10, coinId = 0) {
    const { data } = await api.get<ApiResult<CoinQuotationDto[]>>('/api/CoinQuotations/GetList', { params: { page, pageSize, coinId } });
    return data;
  },
  async insert(dto: CoinQuotationDto) {
    const { data } = await api.post<ApiResult<boolean>>('/api/CoinQuotations/Insert', dto);
    return data;
  },
  async update(dto: CoinQuotationDto) {
    const { data } = await api.put<ApiResult<boolean>>('/api/CoinQuotations/Update', dto);
    return data;
  },
  async delete(id: number) {
    const { data } = await api.delete<ApiResult<boolean>>('/api/CoinQuotations/Delete', { params: { id } });
    return data;
  },
  async updateBCV() {
    const { data } = await api.post<ApiResult<boolean>>('/api/CoinQuotations/UpdateBCVCoinQuotationListScraper');
    return data;
  },
  async importExcel() {
    const { data } = await api.post<ApiResult<boolean>>('/api/CoinQuotations/ImportBCVExcelHistoricalRates');
    return data;
  },
};
