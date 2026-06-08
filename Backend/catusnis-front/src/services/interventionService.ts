import api from './api';
import { ApiResponse, Page, InterventionResponse, InterventionRequest } from '../types';

const InterventionService = {

    getAll: async (
        page = 0, size = 10,
        regionId?: number, districtId?: number, healthId?: number, keyword?: string
    ): Promise<Page<InterventionResponse>> => {
        const params: Record<string, any> = { page, size };
        if (regionId)   params.regionId   = regionId;
        if (districtId) params.districtId = districtId;
        if (healthId)   params.healthId   = healthId;
        if (keyword)    params.keyword    = keyword;
        const response = await api.get<ApiResponse<Page<InterventionResponse>>>('/api/interventions', { params });
        return response.data.data;
    },

    // ✅ Pour impression globale (respecte les filtres actifs)
    getAllForPrint: async (
        regionId?: number, districtId?: number, healthId?: number, keyword?: string
    ): Promise<InterventionResponse[]> => {
        const all: InterventionResponse[] = [];
        let page = 0, total = 0;
        do {
            const params: Record<string, any> = { page, size: 100 };
            if (regionId)   params.regionId   = regionId;
            if (districtId) params.districtId = districtId;
            if (healthId)   params.healthId   = healthId;
            if (keyword)    params.keyword    = keyword;
            const response = await api.get<ApiResponse<Page<InterventionResponse>>>('/api/interventions', { params });
            const data = response.data.data;
            all.push(...data.content);
            total = data.page.totalElements;
            page++;
        } while (all.length < total);
        return all.sort((a, b) => (b.dateInter || '').localeCompare(a.dateInter || ''));
    },

    getById: async (id: number): Promise<InterventionResponse> => {
        const response = await api.get<ApiResponse<InterventionResponse>>(`/api/interventions/${id}`);
        return response.data.data;
    },

    create: async (request: InterventionRequest): Promise<InterventionResponse> => {
        const response = await api.post<ApiResponse<InterventionResponse>>('/api/interventions', request);
        return response.data.data;
    },

    update: async (id: number, request: InterventionRequest): Promise<InterventionResponse> => {
        const response = await api.put<ApiResponse<InterventionResponse>>(`/api/interventions/${id}`, request);
        return response.data.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/api/interventions/${id}`);
    },

    getStats: async (): Promise<{ totalEnLigne: number; totalSurSite: number; totalGlobal: number }> => {
        const response = await api.get<ApiResponse<{ totalEnLigne: number; totalSurSite: number; totalGlobal: number }>>(
            '/api/interventions/stats/minutes'
        );
        return response.data.data;
    },
};

export default InterventionService;