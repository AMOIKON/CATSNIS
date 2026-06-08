import api from './api';
import { ApiResponse, EvaluationResponse } from '../types';

const EvaluationService = {
    getAllList: async (): Promise<EvaluationResponse[]> => {
        const response = await api.get<ApiResponse<EvaluationResponse[]>>('/api/evaluations/all');
        return response.data.data;
    },
    // ✅ Alias pour cohérence avec les autres services — charge tout d'un coup
    getAllForPrint: async (): Promise<EvaluationResponse[]> => {
        const response = await api.get<ApiResponse<EvaluationResponse[]>>('/api/evaluations/all');
        return response.data.data;
    },
};

export default EvaluationService;