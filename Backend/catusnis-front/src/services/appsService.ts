import api from './api';
import { ApiResponse, Page, AppsResponse, AppsRequest } from '../types';

const AppsService = {
    getAll: async (page = 0, size = 10, keyword?: string): Promise<Page<AppsResponse>> => {
        const params: Record<string, any> = { page, size };
        if (keyword) params.keyword = keyword;
        const response = await api.get<ApiResponse<Page<AppsResponse>>>('/api/apps', { params });
        return response.data.data;
    },
    getAllList: async (): Promise<AppsResponse[]> => {
        const response = await api.get<ApiResponse<Page<AppsResponse>>>('/api/apps', { params: { page: 0, size: 100 } });
        return response.data.data.content;
    },
    getAllForPrint: async (keyword?: string): Promise<AppsResponse[]> => {
        const all: AppsResponse[] = [];
        let page = 0, total = 0;
        do {
            const params: Record<string, any> = { page, size: 100 };
            if (keyword) params.keyword = keyword;
            const response = await api.get<ApiResponse<Page<AppsResponse>>>('/api/apps', { params });
            const data = response.data.data;
            all.push(...data.content);
            total = data.page.totalElements;
            page++;
        } while (all.length < total);
        return all.sort((a, b) => (a.appsName || '').localeCompare(b.appsName || '', 'fr'));
    },
    create: async (request: AppsRequest): Promise<AppsResponse> => {
        const response = await api.post<ApiResponse<AppsResponse>>('/api/apps', request);
        return response.data.data;
    },
    update: async (id: number, request: AppsRequest): Promise<AppsResponse> => {
        const response = await api.put<ApiResponse<AppsResponse>>(`/api/apps/${id}`, request);
        return response.data.data;
    },
    delete: async (id: number): Promise<void> => { await api.delete(`/api/apps/${id}`); },
};

export default AppsService;