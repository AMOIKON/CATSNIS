import api from './api';
import { ApiResponse } from '../types';

export interface PublicVehiculeResponse {
  immatriculation: string;
  type: string;
  marque: string;
  modele: string;
  couleur: string;
  statut: string;
  kilometrage: number;
  regionName: string;
  districtName: string;
  conducteurNom: string;
  dateFinAssurance: string | null;
  dateFinVisiteTechnique: string | null;
  dateFinVignette: string | null;
}

const PublicVehiculeService = {
  get: async (id: number): Promise<PublicVehiculeResponse> => {
    const response = await api.get<ApiResponse<PublicVehiculeResponse>>(
      `/api/public/vehicules/${id}`
    );
    return response.data.data;
  },
};

export default PublicVehiculeService;