const API_BASE = process.env.REACT_APP_API_URL || 'https://catsnis.onrender.com';

export const getImageSrc = (fileName: string): string => {
    if (!fileName) return '';
    return /^[0-9a-f]{8}-/i.test(fileName)
        ? `${API_BASE}/api/images/file/${fileName}`
        : `/images/equipements/${fileName}`;
};