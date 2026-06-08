import api from './api';
import { ApiResponse, Page, PostResponse, PostRequest } from '../types';

const PostService = {
    getAll: async (page = 0, size = 10, keyword?: string): Promise<Page<PostResponse>> => {
        const params: Record<string, any> = { page, size };
        if (keyword) params.keyword = keyword;
        const response = await api.get<ApiResponse<Page<PostResponse>>>('/api/posts', { params });
        return response.data.data;
    },
    getAllList: async (): Promise<PostResponse[]> => {
        const response = await api.get<ApiResponse<Page<PostResponse>>>('/api/posts', { params: { page: 0, size: 100 } });
        return response.data.data.content;
    },
    getAllForPrint: async (keyword?: string): Promise<PostResponse[]> => {
        const all: PostResponse[] = [];
        let page = 0, total = 0;
        do {
            const params: Record<string, any> = { page, size: 100 };
            if (keyword) params.keyword = keyword;
            const response = await api.get<ApiResponse<Page<PostResponse>>>('/api/posts', { params });
            const data = response.data.data;
            all.push(...data.content);
            total = data.page.totalElements;
            page++;
        } while (all.length < total);
        return all.sort((a, b) =>
            ((a as any).postName || '').localeCompare((b as any).postName || '', 'fr')
        );
    },
    create: async (request: PostRequest): Promise<PostResponse> => {
        const response = await api.post<ApiResponse<PostResponse>>('/api/posts', request);
        return response.data.data;
    },
    update: async (id: number, request: PostRequest): Promise<PostResponse> => {
        const response = await api.put<ApiResponse<PostResponse>>(`/api/posts/${id}`, request);
        return response.data.data;
    },
    delete: async (id: number): Promise<void> => { await api.delete(`/api/posts/${id}`); },
};

export default PostService;