import api from './api';
import { ApiResponse } from '../types';

export interface SystemStatusResponse {
    locked: boolean;
    reason: string;
}

// ✅ NOUVEAU (27/08/2026)
export interface SystemLockHistoryEntry {
    id: number;
    action: 'LOCK' | 'UNLOCK';
    reason: string | null;
    occurredAt: string;
    actorPersonId: number;
    actorEmail: string;
}

const SystemStateService = {

    status: async (): Promise<SystemStatusResponse> => {
        const response = await api.get<ApiResponse<SystemStatusResponse>>('/api/system/status');
        return response.data.data;
    },

    lock: async (reason: string): Promise<void> => {
        await api.post<ApiResponse<void>>('/api/system/lock', { reason });
    },

    unlock: async (observation?: string): Promise<void> => {
        await api.post<ApiResponse<void>>('/api/system/unlock', { observation: observation || '' });
    },

    // ✅ NOUVEAU
    history: async (): Promise<SystemLockHistoryEntry[]> => {
        const response = await api.get<ApiResponse<SystemLockHistoryEntry[]>>('/api/system/history');
        return response.data.data;
    },

};

export default SystemStateService;