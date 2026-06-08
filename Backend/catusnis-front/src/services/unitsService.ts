import api from './api';
import { ApiResponse, Page, UnitsResponse, UnitsRequest } from '../types';

const UnitsService = {
    getAll: async (page = 0, size = 10, keyword?: string): Promise<Page<UnitsResponse>> => {
        const params: Record<string, any> = { page, size };
        if (keyword) params.keyword = keyword;
        const response = await api.get<ApiResponse<Page<UnitsResponse>>>('/api/units', { params });
        return response.data.data;
    },
    getAllList: async (): Promise<UnitsResponse[]> => {
        const response = await api.get<ApiResponse<Page<UnitsResponse>>>('/api/units', { params: { page: 0, size: 100 } });
        return response.data.data.content;
    },
    getAllForPrint: async (keyword?: string): Promise<UnitsResponse[]> => {
        const all: UnitsResponse[] = [];
        let page = 0, total = 0;
        do {
            const params: Record<string, any> = { page, size: 100 };
            if (keyword) params.keyword = keyword;
            const response = await api.get<ApiResponse<Page<UnitsResponse>>>('/api/units', { params });
            const data = response.data.data;
            all.push(...data.content);
            total = data.page.totalElements;
            page++;
        } while (all.length < total);
        return all.sort((a, b) =>
            ((a as any).unitName || '').localeCompare((b as any).unitName || '', 'fr')
        );
    },
    create: async (request: UnitsRequest): Promise<UnitsResponse> => {
        const response = await api.post<ApiResponse<UnitsResponse>>('/api/units', request);
        return response.data.data;
    },
    update: async (id: number, request: UnitsRequest): Promise<UnitsResponse> => {
        const response = await api.put<ApiResponse<UnitsResponse>>(`/api/units/${id}`, request);
        return response.data.data;
    },
    delete: async (id: number): Promise<void> => { await api.delete(`/api/units/${id}`); },
};

export default UnitsService;