import api from './api';
import { ApiResponse, Page, HealthResponse, HealthRequest } from '../types';

const HealthService = {

    // ── Liste paginée (affichage tableau) ─────────────────────────────────────
    getAll: async (
        page        = 0,
        size        = 10,
        districtId?: number,
        regionId?:   number,
        keyword?:    string,
    ): Promise<Page<HealthResponse>> => {
        const params: Record<string, any> = { page, size };
        if (districtId) params.districtId = districtId;
        if (regionId)   params.regionId   = regionId;
        if (keyword)    params.keyword    = keyword;
        const response = await api.get<ApiResponse<Page<HealthResponse>>>(
            '/api/healths', { params }
        );
        return response.data.data;
    },

    // ── Liste sans pagination (pour les selects) ──────────────────────────────
    getAllList: async (districtId?: number): Promise<HealthResponse[]> => {
        const params: Record<string, any> = { page: 0, size: 100 };
        if (districtId) params.districtId = districtId;
        const response = await api.get<ApiResponse<Page<HealthResponse>>>(
            '/api/healths', { params }
        );
        return response.data.data.content;
    },

    // ── ✅ Liste complète pour impression — charge toutes les pages ───────────
    getAllForPrint: async (
        districtId?: number,
        regionId?:   number,
        keyword?:    string,
    ): Promise<HealthResponse[]> => {
        const all: HealthResponse[] = [];
        let   page  = 0;
        let   total = 0;

        do {
            const params: Record<string, any> = { page, size: 200 };
            if (districtId) params.districtId = districtId;
            if (regionId)   params.regionId   = regionId;
            if (keyword)    params.keyword    = keyword;

            const response = await api.get<ApiResponse<Page<HealthResponse>>>(
                '/api/healths', { params }
            );
            const data = response.data.data;
            all.push(...data.content);
            total = data.page.totalElements;
            page++;
        } while (all.length < total);

        return all.sort((a, b) =>
            a.healthName.localeCompare(b.healthName, 'fr')
        );
    },

    // ── CRUD ──────────────────────────────────────────────────────────────────

    create: async (request: HealthRequest): Promise<HealthResponse> => {
        const response = await api.post<ApiResponse<HealthResponse>>(
            '/api/healths', request
        );
        return response.data.data;
    },

    update: async (id: number, request: HealthRequest): Promise<HealthResponse> => {
        const response = await api.put<ApiResponse<HealthResponse>>(
            `/api/healths/${id}`, request
        );
        return response.data.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/api/healths/${id}`);
    },
};

export default HealthService;