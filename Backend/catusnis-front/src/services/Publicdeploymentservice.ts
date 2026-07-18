import api from './api';
import { ApiResponse } from '../types';

export interface PublicDeploymentItem {
    typeName?: string;
    tag?: string;
    status?: string;
}

export interface PublicDeploymentResponse {
    codeDep: string;
    dateRecep?: string;
    comment?: string;
    regionDeploy?: string;
    districtDeploy?: string;
    healthDeploy?: string;
    appsDeploy?: string;
    technicianName?: string;
    partnerName?: string;
    items: PublicDeploymentItem[];
}

const PublicDeploymentService = {
    get: async (id: number): Promise<PublicDeploymentResponse> => {
        const response = await api.get<ApiResponse<PublicDeploymentResponse>>(
            `/api/public/deployments/${id}`
        );
        return response.data.data;
    },
};

export default PublicDeploymentService;