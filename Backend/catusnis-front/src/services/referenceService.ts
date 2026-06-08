import api from './api';
import { ApiResponse } from '../types';

export interface ReferenceItem {
    id:   number;
    name: string;
}

const ReferenceService = {

    getPosts: async (): Promise<ReferenceItem[]> => {
        const response = await api.get<ApiResponse<any>>(
            '/api/posts?size=100'
        );
        const content = response.data.data?.content ?? [];
        return content.map((item: any) => ({
            id:   item.id,
            name: item.postName,
        }));
    },

    getUnits: async (): Promise<ReferenceItem[]> => {
        const response = await api.get<ApiResponse<any>>(
            '/api/units?size=100'
        );
        const content = response.data.data?.content ?? [];
        return content.map((item: any) => ({
            id:   item.id,
            name: item.unitName,
        }));
    },

    getPartners: async (): Promise<ReferenceItem[]> => {
        const response = await api.get<ApiResponse<any>>(
            '/api/partners?size=100'
        );
        const content = response.data.data?.content ?? [];
        return content.map((item: any) => ({
            id:   item.id,
            name: item.partnerName,
        }));
    },
};

export default ReferenceService;