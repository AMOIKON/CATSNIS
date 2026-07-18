import api from './api';
import { ApiResponse, Page, DeploymentResponse, DeploymentRequest } from '../types';

const DeploymentService = {

    getAll: async (
        page = 0, size = 10,
        regionId?: number, districtId?: number, healthId?: number, keyword?: string,
    ): Promise<Page<DeploymentResponse>> => {
        const params: Record<string, any> = { page, size };
        if (regionId)   params.regionId   = regionId;
        if (districtId) params.districtId = districtId;
        if (healthId)   params.healthId   = healthId;
        if (keyword)    params.keyword    = keyword;
        const response = await api.get<ApiResponse<Page<DeploymentResponse>>>('/api/deployments', { params });
        return response.data.data;
    },

    // ✅ Pour impression globale (respecte les filtres actifs)
    getAllForPrint: async (
        regionId?: number, districtId?: number, healthId?: number, keyword?: string,
    ): Promise<DeploymentResponse[]> => {
        const all: DeploymentResponse[] = [];
        let page = 0, total = 0;
        do {
            const params: Record<string, any> = { page, size: 100 };
            if (regionId)   params.regionId   = regionId;
            if (districtId) params.districtId = districtId;
            if (healthId)   params.healthId   = healthId;
            if (keyword)    params.keyword    = keyword;
            const response = await api.get<ApiResponse<Page<DeploymentResponse>>>('/api/deployments', { params });
            const data = response.data.data;
            all.push(...data.content);
            total = data.page.totalElements;
            page++;
        } while (all.length < total);
        return all.sort((a, b) => (b.dateRecep || '').localeCompare(a.dateRecep || ''));
    },

    create: async (request: DeploymentRequest): Promise<DeploymentResponse> => {
        const response = await api.post<ApiResponse<DeploymentResponse>>('/api/deployments', request);
        return response.data.data;
    },

    update: async (id: number, request: DeploymentRequest): Promise<DeploymentResponse> => {
        const response = await api.put<ApiResponse<DeploymentResponse>>(`/api/deployments/${id}`, request);
        return response.data.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/api/deployments/${id}`);
    },

    removeItem: async (deploymentId: number, itemId: number): Promise<DeploymentResponse> => {
        const response = await api.delete<ApiResponse<DeploymentResponse>>(
            `/api/deployments/${deploymentId}/items/${itemId}`
        );
        return response.data.data;
    },

    // ✅ Télécharge la fiche PDF du déploiement
    downloadPdf: async (id: number): Promise<Blob> => {
        const response = await api.get(`/api/deployments/${id}/pdf`, { responseType: 'blob' });
        return response.data;
    },
};

export default DeploymentService;