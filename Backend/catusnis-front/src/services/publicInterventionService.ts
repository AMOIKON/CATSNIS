import api from './api';
import { ApiResponse } from '../types';

export interface PublicDeploymentItem {
    typeName?: string;
    tag?: string;
    etatAvant?: string;
    etatApres?: string;
}

export interface PublicInterventionResponse {
    codeInter: string;
    typeInter: string;
    actionInter: string;
    commentInter: string;
    dateInter: string;
    durationMinutes: number;
    regionName?: string;
    districtName?: string;
    healthName?: string;
    structureName?: string;
    appName?: string;
    technicianName: string;
    personName?: string;
    manualEquipmentName?: string;
    manualEquipmentType?: string;
    structureEnregistree: boolean;
    equipementHorsBase: boolean;
    deploymentItems: PublicDeploymentItem[];
}

const PublicInterventionService = {
    // ✅ Pas de token requis — endpoint public dédié à la consultation via QR code
    get: async (id: number): Promise<PublicInterventionResponse> => {
        const response = await api.get<ApiResponse<PublicInterventionResponse>>(
            `/api/public/interventions/${id}`
        );
        return response.data.data;
    },
};

export default PublicInterventionService;