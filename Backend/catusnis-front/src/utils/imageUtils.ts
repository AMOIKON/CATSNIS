const API_BASE = process.env.REACT_APP_API_URL || 'https://catsnis.onrender.com';

/**
 * Détecte si une chaîne est du base64 brut (sans préfixe data:)
 */
const isBase64Raw = (value: string): boolean => {
    if (!value || value.startsWith('data:')) return false;
    return (
        value.startsWith('/9j/')    ||  // JPEG
        value.startsWith('iVBOR')  ||  // PNG
        value.startsWith('AAAA')   ||  // AVIF / MP4
        value.startsWith('R0lG')   ||  // GIF
        (value.length > 200 && /^[A-Za-z0-9+/]+=*$/.test(value.substring(0, 100)))
    );
};

/**
 * Retourne la source d'une image :
 * - base64 explicite (second argument) : retourné tel quel ou préfixé si nécessaire
 * - fileName contenant du base64 brut : préfixé avec le bon mime type
 * - fileName normal : URL absolue vers le backend
 */
export const getImageSrc = (fileName: string, base64?: string | null): string => {
    if (!fileName) return '/images/equipements/equipement.png';

    // Base64 explicite passé en second argument
    if (base64) {
        return base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
    }

    // fileName commence déjà par data: (déjà préfixé)
    if (fileName.startsWith('data:')) return fileName;

    // fileName contient du base64 brut sans préfixe
    if (isBase64Raw(fileName)) {
        const mime = fileName.startsWith('/9j/')   ? 'image/jpeg' :
                     fileName.startsWith('AAAA')   ? 'image/avif' :
                     fileName.startsWith('R0lG')   ? 'image/gif'  : 'image/png';
        return `data:${mime};base64,${fileName}`;
    }

    // Nom de fichier normal → URL backend
    return `${API_BASE}/api/images/file/${encodeURIComponent(fileName)}`;
};