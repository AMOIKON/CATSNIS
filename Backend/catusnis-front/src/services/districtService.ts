import api from './api';
import { ApiResponse, Page, DistrictResponse, DistrictRequest } from '../types';

const DistrictService = {

    // ── Liste paginée (affichage tableau) ─────────────────────────────────────
    getAll: async (
        page      = 0,
        size      = 10,
        regionId?: number,
        keyword?:  string,
    ): Promise<Page<DistrictResponse>> => {
        const params: Record<string, any> = { page, size };
        if (regionId) params.regionId = regionId;
        if (keyword)  params.keyword  = keyword;
        const response = await api.get<ApiResponse<Page<DistrictResponse>>>(
            '/api/districts', { params }
        );
        return response.data.data;
    },

    // ── Liste sans pagination (pour les selects) ──────────────────────────────
    getAllList: async (regionId?: number): Promise<DistrictResponse[]> => {
        const params: Record<string, any> = { page: 0, size: 100 };
        if (regionId) params.regionId = regionId;
        const response = await api.get<ApiResponse<Page<DistrictResponse>>>(
            '/api/districts', { params }
        );
        return response.data.data.content;
    },

    // ── ✅ Liste complète pour impression — charge toutes les pages ───────────
    getAllForPrint: async (
        regionId?: number,
        keyword?:  string,
    ): Promise<DistrictResponse[]> => {
        const all: DistrictResponse[] = [];
        let   page  = 0;
        let   total = 0;

        do {
            const params: Record<string, any> = { page, size: 100 };
            if (regionId) params.regionId = regionId;
            if (keyword)  params.keyword  = keyword;

            const response = await api.get<ApiResponse<Page<DistrictResponse>>>(
                '/api/districts', { params }
            );
            const data = response.data.data;
            all.push(...data.content);
            total = data.page.totalElements;
            page++;
        } while (all.length < total);

        return all.sort((a, b) =>
            a.DistrictName.localeCompare(b.DistrictName, 'fr')
        );
    },

    // ── CRUD ──────────────────────────────────────────────────────────────────

    create: async (request: DistrictRequest): Promise<DistrictResponse> => {
        const response = await api.post<ApiResponse<DistrictResponse>>(
            '/api/districts', request
        );
        return response.data.data;
    },

    update: async (id: number, request: DistrictRequest): Promise<DistrictResponse> => {
        const response = await api.put<ApiResponse<DistrictResponse>>(
            `/api/districts/${id}`, request
        );
        return response.data.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/api/districts/${id}`);
    },
};

export default DistrictService;