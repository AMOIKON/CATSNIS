import api from './api';
import { ApiResponse, Page, RegionResponse, RegionRequest } from '../types';

const RegionService = {

    // ── Liste paginée (affichage tableau) ─────────────────────────────────────
    getAll: async (
        page    = 0,
        size    = 10,
        keyword?: string,
    ): Promise<Page<RegionResponse>> => {
        const params: Record<string, any> = { page, size };
        if (keyword) params.keyword = keyword;
        const response = await api.get<ApiResponse<Page<RegionResponse>>>(
            '/api/regions', { params }
        );
        return response.data.data;
    },

    // ── Liste sans pagination (pour les selects) ──────────────────────────────
    getAllList: async (): Promise<RegionResponse[]> => {
        const response = await api.get<ApiResponse<Page<RegionResponse>>>(
            '/api/regions', { params: { page: 0, size: 100 } }
        );
        return response.data.data.content;
    },

    // ── ✅ Liste complète pour impression — charge toutes les pages ───────────
    getAllForPrint: async (): Promise<RegionResponse[]> => {
        const all: RegionResponse[] = [];
        let   page  = 0;
        let   total = 0;

        do {
            const response = await api.get<ApiResponse<Page<RegionResponse>>>(
                '/api/regions', { params: { page, size: 100 } }
            );
            const data = response.data.data;
            all.push(...data.content);
            total = data.page.totalElements;
            page++;
        } while (all.length < total);

        // Trier par nom pour l'impression
        return all.sort((a, b) => a.regionName.localeCompare(b.regionName, 'fr'));
    },

    // ── CRUD ──────────────────────────────────────────────────────────────────

    create: async (request: RegionRequest): Promise<RegionResponse> => {
        const response = await api.post<ApiResponse<RegionResponse>>(
            '/api/regions', request
        );
        return response.data.data;
    },

    update: async (id: number, request: RegionRequest): Promise<RegionResponse> => {
        const response = await api.put<ApiResponse<RegionResponse>>(
            `/api/regions/${id}`, request
        );
        return response.data.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/api/regions/${id}`);
    },
};

export default RegionService;