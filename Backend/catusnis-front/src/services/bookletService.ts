import api from './api';
import { Booklet, BookletRequest, BookletStats } from '../types';

const BookletService = {

    getAll: async (): Promise<Booklet[]> => {
        const response = await api.get('/api/booklets');
        return Array.isArray(response.data) ? response.data : response.data.data ?? [];
    },

    getById: async (id: number): Promise<Booklet> => {
        const response = await api.get(`/api/booklets/${id}`);
        return response.data.data ?? response.data;
    },

    // ✅ Pour impression globale
    getAllForPrint: async (): Promise<Booklet[]> => {
        const response = await api.get('/api/booklets');
        const all = Array.isArray(response.data) ? response.data : response.data.data ?? [];
        return (all as Booklet[]).sort((a, b) =>
            (a.lastName || '').localeCompare(b.lastName || '', 'fr')
        );
    },

    create: async (request: BookletRequest): Promise<Booklet> => {
        const response = await api.post('/api/booklets', request);
        return response.data.data ?? response.data;
    },

    update: async (id: number, request: BookletRequest): Promise<Booklet> => {
        const response = await api.put(`/api/booklets/${id}`, request);
        return response.data.data ?? response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/api/booklets/${id}`);
    },

    search: async (keyword: string): Promise<Booklet[]> => {
        const response = await api.get(`/api/booklets/search?keyword=${keyword}`);
        return Array.isArray(response.data) ? response.data : response.data.data ?? [];
    },

    getByRegion: async (regionId: number): Promise<Booklet[]> => {
        const response = await api.get(`/api/booklets/region/${regionId}`);
        return Array.isArray(response.data) ? response.data : response.data.data ?? [];
    },

    getByDistrict: async (districtId: number): Promise<Booklet[]> => {
        try {
            const response = await api.get(`/api/booklets/district/${districtId}`);
            const list = Array.isArray(response.data) ? response.data : response.data.data ?? [];
            if (list.length === 0) {
                const allResponse = await api.get('/api/booklets');
                return Array.isArray(allResponse.data) ? allResponse.data : allResponse.data.data ?? [];
            }
            return list;
        } catch {
            try {
                const allResponse = await api.get('/api/booklets');
                return Array.isArray(allResponse.data) ? allResponse.data : allResponse.data.data ?? [];
            } catch { return []; }
        }
    },

    createFromIntervention: async (data: {
        lastName: string; firstName: string; contact?: string; postName?: string;
        regionId: number; districtId: number;
    }): Promise<Booklet | null> => {
        try {
            const response = await api.post('/api/booklets/quick-create', data);
            return response.data.data ?? response.data;
        } catch (err) {
            console.warn('Création booklet échouée:', err);
            return null;
        }
    },

    getByStatus: async (statusId: number): Promise<Booklet[]> => {
        const response = await api.get(`/api/booklets/status/${statusId}`);
        return Array.isArray(response.data) ? response.data : response.data.data ?? [];
    },

    getByDistrictAndHealth: async (districtId: number, healthId: number): Promise<Booklet[]> => {
        const response = await api.get('/api/booklets/by-site', { params: { districtId, healthId } });
        return Array.isArray(response.data) ? response.data : response.data.data ?? [];
    },

    getStats: async (): Promise<BookletStats> => {
        const response = await api.get('/api/booklets/stats');
        return response.data.data ?? response.data;
    },

    downloadPdf: async (id: number, lastName: string): Promise<void> => {
        const response = await api.get(`/api/booklets/${id}/pdf`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `booklet_${lastName}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    exportAllPdf: async (): Promise<void> => {
        const response = await api.get('/api/booklets/export/pdf', { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'booklets_export.pdf');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },
};

export default BookletService;