import api from './api';
import { ApiResponse, Page, StatesResponse, StatesRequest } from '../types';

const StatesService = {
    getAll: async (page = 0, size = 10, keyword?: string): Promise<Page<StatesResponse>> => {
        const params: Record<string, any> = { page, size };
        if (keyword) params.keyword = keyword;
        const response = await api.get<ApiResponse<Page<StatesResponse>>>('/api/states', { params });
        return response.data.data;
    },
    getAllList: async (): Promise<StatesResponse[]> => {
        const response = await api.get<ApiResponse<Page<StatesResponse>>>('/api/states', { params: { page: 0, size: 100 } });
        return response.data.data.content;
    },
    getAllForPrint: async (keyword?: string): Promise<StatesResponse[]> => {
        const all: StatesResponse[] = [];
        let page = 0, total = 0;
        do {
            const params: Record<string, any> = { page, size: 100 };
            if (keyword) params.keyword = keyword;
            const response = await api.get<ApiResponse<Page<StatesResponse>>>('/api/states', { params });
            const data = response.data.data;
            all.push(...data.content);
            total = data.page.totalElements;
            page++;
        } while (all.length < total);
        return all.sort((a, b) => (a.statesName || '').localeCompare(b.statesName || '', 'fr'));
    },
    create: async (request: StatesRequest): Promise<StatesResponse> => {
        const response = await api.post<ApiResponse<StatesResponse>>('/api/states', request);
        return response.data.data;
    },
    update: async (id: number, request: StatesRequest): Promise<StatesResponse> => {
        const response = await api.put<ApiResponse<StatesResponse>>(`/api/states/${id}`, request);
        return response.data.data;
    },
    delete: async (id: number): Promise<void> => { await api.delete(`/api/states/${id}`); },
};

export default StatesService;