import api from './api';
import { ApiResponse } from '../types';

export interface SignatureResponse {
    configured: boolean;
    signatureBase64?: string;
}

export interface SignatureRequest {
    signatureBase64: string;
}

const SignatureService = {

    get: async (): Promise<SignatureResponse> => {
        const response = await api.get<ApiResponse<SignatureResponse>>('/api/persons/me/signature');
        return response.data.data;
    },

    update: async (request: SignatureRequest): Promise<void> => {
        await api.put<ApiResponse<void>>('/api/persons/me/signature', request);
    },

};

export default SignatureService;