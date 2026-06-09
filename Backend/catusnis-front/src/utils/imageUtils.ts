const API_BASE = process.env.REACT_APP_API_URL || 'https://catsnis.onrender.com';

export const getImageSrc = (fileName: string): string => {
    if (!fileName) return '';
    // Toujours servir depuis l'API (LONGBLOB en base)
    return `${API_BASE}/api/images/file/${encodeURIComponent(fileName)}`;
};