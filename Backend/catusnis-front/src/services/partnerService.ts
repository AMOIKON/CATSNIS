import api from './api';
import { ApiResponse, Page, PartnerResponse, PartnerRequest } from '../types';

const PartnerService = {

    getAll: async (page = 0, size = 10, keyword?: string): Promise<Page<PartnerResponse>> => {
        const params: Record<string, any> = { page, size };
        if (keyword) params.keyword = keyword;
        const response = await api.get<ApiResponse<Page<PartnerResponse>>>('/api/partners', { params });
        return response.data.data;
    },

    getAllList: async (): Promise<PartnerResponse[]> => {
        const response = await api.get<ApiResponse<Page<PartnerResponse>>>(
            '/api/partners', { params: { page: 0, size: 100 } }
        );
        return response.data.data.content;
    },

    // ✅ Pour impression globale
    getAllForPrint: async (keyword?: string): Promise<PartnerResponse[]> => {
        const all: PartnerResponse[] = [];
        let page = 0, total = 0;
        do {
            const params: Record<string, any> = { page, size: 100 };
            if (keyword) params.keyword = keyword;
            const response = await api.get<ApiResponse<Page<PartnerResponse>>>('/api/partners', { params });
            const data = response.data.data;
            all.push(...data.content);
            total = data.page.totalElements;
            page++;
        } while (all.length < total);
        return all.sort((a, b) => a.partnerName.localeCompare(b.partnerName, 'fr'));
    },

    create: async (request: PartnerRequest): Promise<PartnerResponse> => {
        const response = await api.post<ApiResponse<PartnerResponse>>('/api/partners', request);
        return response.data.data;
    },

    update: async (id: number, request: PartnerRequest): Promise<PartnerResponse> => {
        const response = await api.put<ApiResponse<PartnerResponse>>(`/api/partners/${id}`, request);
        return response.data.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/api/partners/${id}`);
    },
};

export default PartnerService;