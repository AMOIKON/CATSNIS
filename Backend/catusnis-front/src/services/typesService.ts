// ── typesService.ts ──────────────────────────────────────────────────────────
import api from './api';
import { ApiResponse, Page, TypeResponse, TypesRequest } from '../types';

const TypesService = {
    getAll: async (page = 0, size = 10, keyword?: string): Promise<Page<TypeResponse>> => {
        const params: Record<string, any> = { page, size };
        if (keyword) params.keyword = keyword;
        const response = await api.get<ApiResponse<Page<TypeResponse>>>('/api/types', { params });
        return response.data.data;
    },
    getAllList: async (): Promise<TypeResponse[]> => {
        const response = await api.get<ApiResponse<Page<TypeResponse>>>('/api/types', { params: { page: 0, size: 100 } });
        return response.data.data.content;
    },
    getAllForPrint: async (keyword?: string): Promise<TypeResponse[]> => {
        const all: TypeResponse[] = [];
        let page = 0, total = 0;
        do {
            const params: Record<string, any> = { page, size: 100 };
            if (keyword) params.keyword = keyword;
            const response = await api.get<ApiResponse<Page<TypeResponse>>>('/api/types', { params });
            const data = response.data.data;
            all.push(...data.content);
            total = data.page.totalElements;
            page++;
        } while (all.length < total);
        return all.sort((a, b) => a.typeName.localeCompare(b.typeName, 'fr'));
    },
    create: async (request: TypesRequest): Promise<TypeResponse> => {
        const response = await api.post<ApiResponse<TypeResponse>>('/api/types', request);
        return response.data.data;
    },
    update: async (id: number, request: TypesRequest): Promise<TypeResponse> => {
        const response = await api.put<ApiResponse<TypeResponse>>(`/api/types/${id}`, request);
        return response.data.data;
    },
    delete: async (id: number): Promise<void> => { await api.delete(`/api/types/${id}`); },
};

export default TypesService;