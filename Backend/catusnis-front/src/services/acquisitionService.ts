import api from './api';
import { ApiResponse, Page, AcquisitionResponse, AcquisitionRequest, TypeResponse } from '../types';

const AcquisitionService = {

    getAll: async (page = 0, size = 10, keyword?: string, status?: string): Promise<Page<AcquisitionResponse>> => {
        const params: Record<string, any> = { page, size };
        if (keyword) params.keyword = keyword;
        if (status)  params.status  = status;
        const response = await api.get<ApiResponse<Page<AcquisitionResponse>>>('/api/acquisitions', { params });
        return response.data.data;
    },

    // ✅ Pour impression globale (tous les éléments)
    getAllForPrint: async (keyword?: string, status?: string): Promise<AcquisitionResponse[]> => {
        const all: AcquisitionResponse[] = [];
        let page = 0, total = 0;
        do {
            const params: Record<string, any> = { page, size: 100 };
            if (keyword) params.keyword = keyword;
            if (status)  params.status  = status;
            const response = await api.get<ApiResponse<Page<AcquisitionResponse>>>('/api/acquisitions', { params });
            const data = response.data.data;
            all.push(...data.content);
            total = data.page.totalElements;
            page++;
        } while (all.length < total);
        return all.sort((a, b) => (a.tag || '').localeCompare(b.tag || '', 'fr'));
    },

    create: async (request: AcquisitionRequest): Promise<AcquisitionResponse> => {
        const response = await api.post<ApiResponse<AcquisitionResponse>>('/api/acquisitions', request);
        return response.data.data;
    },

    update: async (id: number, request: AcquisitionRequest): Promise<AcquisitionResponse> => {
        const response = await api.put<ApiResponse<AcquisitionResponse>>(`/api/acquisitions/${id}`, request);
        return response.data.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/api/acquisitions/${id}`);
    },

    getTypes: async (): Promise<TypeResponse[]> => {
        const response = await api.get<ApiResponse<Page<TypeResponse>>>('/api/types', { params: { page: 0, size: 100 } });
        return response.data.data.content;
    },

    getAvailable: async (typesId?: number): Promise<AcquisitionResponse[]> => {
        const params: Record<string, any> = {};
        if (typesId) params.typesId = typesId;
        const response = await api.get<ApiResponse<AcquisitionResponse[]>>('/api/acquisitions/available', { params });
        return response.data.data;
    },

    // ✅ Compteur d'équipements hors base (assistance technique)
    getHorsBaseCount: async (): Promise<number> => {
        const response = await api.get<ApiResponse<number>>('/api/acquisitions/stats/hors-base');
        return response.data.data;
    },
};

export default AcquisitionService;