const API_BASE = process.env.REACT_APP_API_URL || 'https://catsnis.onrender.com';

/**
 * Retourne la source d'une image :
 * - base64 si fourni directement (depuis la liste API)
 * - URL absolue vers le backend sinon
 */
export const getImageSrc = (fileName: string, base64?: string | null): string => {
    if (!fileName) return '';
    if (base64) return base64;
    return `${API_BASE}/api/images/file/${encodeURIComponent(fileName)}`;
};