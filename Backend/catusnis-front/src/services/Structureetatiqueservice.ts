import api from './api';
import { ApiResponse } from '../types';

export interface StructureEtatiqueResponse {
  id: number;
  nom: string;
  regionId?: number;
  regionName?: string;
  districtId?: number;
  districtName?: string;
  contact?: string;
  logo?: string;
}

export interface StructureEtatiqueRequest {
  nom: string;
  regionId?: number;
  districtId?: number;
  contact?: string;
  logo?: string;
}

const StructureEtatiqueService = {
  getAllList: async (): Promise<StructureEtatiqueResponse[]> => {
    const response = await api.get<ApiResponse<StructureEtatiqueResponse[]>>('/api/structures-etatiques');
    return response.data.data;
  },

  getById: async (id: number): Promise<StructureEtatiqueResponse> => {
    const response = await api.get<ApiResponse<StructureEtatiqueResponse>>(`/api/structures-etatiques/${id}`);
    return response.data.data;
  },

  create: async (request: StructureEtatiqueRequest): Promise<StructureEtatiqueResponse> => {
    const response = await api.post<ApiResponse<StructureEtatiqueResponse>>('/api/structures-etatiques', request);
    return response.data.data;
  },

  update: async (id: number, request: StructureEtatiqueRequest): Promise<StructureEtatiqueResponse> => {
    const response = await api.put<ApiResponse<StructureEtatiqueResponse>>(`/api/structures-etatiques/${id}`, request);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/structures-etatiques/${id}`);
  },
};

export default StructureEtatiqueService;