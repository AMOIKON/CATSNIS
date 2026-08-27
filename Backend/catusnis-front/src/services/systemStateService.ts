import api from './api';
import { ApiResponse } from '../types';

export interface SystemStatusResponse {
    locked: boolean;
    reason: string;
}

const SystemStateService = {

    status: async (): Promise<SystemStatusResponse> => {
        const response = await api.get<ApiResponse<SystemStatusResponse>>('/api/system/status');
        return response.data.data;
    },

    lock: async (reason: string): Promise<void> => {
        await api.post<ApiResponse<void>>('/api/system/lock', { reason });
    },

    unlock: async (): Promise<void> => {
        await api.post<ApiResponse<void>>('/api/system/unlock');
    },

};

export default SystemStateService;