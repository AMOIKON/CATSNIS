// ✅ Fonction partagée — utilisée dans tous les composants
export const getImageSrc = (fileName: string): string => {
    if (!fileName) return '/images/equipements/equipement.png';
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
        .test(fileName);
    return isUUID
        ? `/api/images/file/${fileName}`        // ✅ URL relative
        : `/images/equipements/${fileName}`;
};

// ✅ Helper imgUrl — URL relative aussi
export const imgUrl = (fileName?: string): string | undefined => {
    if (!fileName) return undefined;
    if (fileName.startsWith('http')) return fileName;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
        .test(fileName);
    return isUUID
        ? `/api/images/file/${fileName}`        // ✅ URL relative
        : `/images/equipements/${fileName}`;
};