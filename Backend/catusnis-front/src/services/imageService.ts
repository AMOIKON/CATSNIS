import api from './api';
import { ApiResponse, Page, ImageResponse, ImageRequest } from '../types';

const ImageService = {

    // ✅ Chemin relatif — Nginx fait le proxy en production
    getFileUrl: (fileName: string): string => {
        return `/api/images/file/${fileName}`;
    },

    upload: async (file: File, label: string): Promise<ImageResponse> => {
        const formData = new FormData();
        formData.append('file',  file);
        formData.append('label', label);
        const response = await api.post<ApiResponse<ImageResponse>>(
            '/api/images/upload', formData,
            { headers: { 'Content-Type': undefined } }
        );
        return response.data.data;
    },

    getAllList: async (): Promise<ImageResponse[]> => {
        const response = await api.get<ApiResponse<ImageResponse[]>>(
            '/api/images/all'
        );
        return response.data.data;
    },

    getAll: async (
        page = 0, size = 10, keyword?: string
    ): Promise<Page<ImageResponse>> => {
        const params: Record<string, any> = { page, size };
        if (keyword) params.keyword = keyword;
        const response = await api.get<ApiResponse<Page<ImageResponse>>>(
            '/api/images', { params }
        );
        return response.data.data;
    },

    update: async (id: number, request: ImageRequest): Promise<ImageResponse> => {
        const response = await api.put<ApiResponse<ImageResponse>>(
            `/api/images/${id}`, request
        );
        return response.data.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/api/images/${id}`);
    },
};

export default ImageService;