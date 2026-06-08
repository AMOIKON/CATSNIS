import api from './api';
import { ApiResponse } from '../types';

export interface TechnicianSiteResponse {
    id:              number;
    personId:        number;
    technicianName:  string;
    technicianEmail: string;
    personRole?:     string;
    regionId:        number | null;
    regionName:      string | null;
    districtId:      number | null;
    districtName:    string | null;
    healthId:        number | null;
    healthName:      string | null;
    niveau?:         string;
    createdAt?:      string;
    updatedAt?:      string;
}

export interface TechnicianSiteRequest {
    personId:    number;
    regionId?:   number | null;
    districtId?: number | null;
    healthId?:   number | null;
}

const TechnicianSiteService = {

    assign: async (request: TechnicianSiteRequest): Promise<TechnicianSiteResponse> => {
        const response = await api.post<ApiResponse<TechnicianSiteResponse>>(
            '/api/technician-sites', request
        );
        return response.data.data;
    },

    update: async (id: number, request: TechnicianSiteRequest): Promise<TechnicianSiteResponse> => {
        const response = await api.put<ApiResponse<TechnicianSiteResponse>>(
            `/api/technician-sites/${id}`, request
        );
        return response.data.data;
    },

    // ✅ Utilise /technician/ pour correspondre au controller existant
    getByTechnician: async (personId: number): Promise<TechnicianSiteResponse[]> => {
        const response = await api.get<ApiResponse<TechnicianSiteResponse[]>>(
            `/api/technician-sites/technician/${personId}`
        );
        return response.data.data;
    },

    unassign: async (id: number): Promise<void> => {
        await api.delete(`/api/technician-sites/${id}`);
    },

    getHealthIds: async (personId: number): Promise<number[]> => {
        const response = await api.get<ApiResponse<number[]>>(
            `/api/technician-sites/technician/${personId}/health-ids`
        );
        return response.data.data;
    },

    getRegionIds: async (personId: number): Promise<number[]> => {
        const response = await api.get<ApiResponse<number[]>>(
            `/api/technician-sites/technician/${personId}/region-ids`
        );
        return response.data.data;
    },

    getDistrictIds: async (personId: number): Promise<number[]> => {
        const response = await api.get<ApiResponse<number[]>>(
            `/api/technician-sites/technician/${personId}/district-ids`
        );
        return response.data.data;
    },
};

export default TechnicianSiteService;