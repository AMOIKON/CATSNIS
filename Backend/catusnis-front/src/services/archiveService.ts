import api from './api';

// ── Types alignés sur le backend ─────────────────────────────────────────────
export type TypeArchive      = 'IMPRIME' | 'SCANNE';
export type CategorieArchive = 'INTERVENTION' | 'DEPLOIEMENT' | 'ACQUISITION' | 'BOOKLET' | 'AUTRE';

export interface ArchiveResponse {
  id:          number;
  titre:       string;
  type:        TypeArchive;
  categorie:   CategorieArchive;
  fileName:    string | null;
  fileSize:    number | null;
  mimeType:    string | null;
  description: string | null;
  archivedBy:  string | null;
  archivedAt:  string;
  relatedId:   number | null;
  relatedCode: string | null;
  downloadUrl: string | null;
}

export interface ArchiveRequest {
  titre:        string;
  type:         TypeArchive;
  categorie:    CategorieArchive;
  description?: string;
  archivedBy?:  string;
  relatedId?:   number;
  relatedCode?: string;
}

export interface ArchiveStats {
  total:         number;
  imprimes:      number;
  scannes:       number;
  interventions: number;
  deploiements:  number;
}

export interface SpringPage<T> {
  content:       T[];
  totalElements: number;
  totalPages:    number;
  number:        number;
  size:          number;
}

// ── Constantes formats acceptés (centralisées ici pour cohérence) ─────────────
export const ACCEPTED_EXTENSIONS = ['pdf', 'doc', 'docx', 'zip', 'rar', '7z'] as const;
export type  AcceptedExtension   = typeof ACCEPTED_EXTENSIONS[number];

export const ACCEPT_MIME =
  '.pdf,.doc,.docx,.zip,.rar,.7z,' +
  'application/pdf,' +
  'application/msword,' +
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document,' +
  'application/zip,' +
  'application/x-zip-compressed,' +
  'application/x-rar-compressed,' +
  'application/vnd.rar,' +
  'application/x-7z-compressed';

export const MAX_SIZE_MB = 30;
export const MAX_SIZE_B  = MAX_SIZE_MB * 1024 * 1024;

/** Valide l'extension et la taille. Retourne un message d'erreur ou null. */
export const validateFile = (file: File): string | null => {
  if (file.size > MAX_SIZE_B)
    return `Fichier trop volumineux. Taille max : ${MAX_SIZE_MB} Mo.`;
  const ext = file.name.split('.').pop()?.toLowerCase() as AcceptedExtension | undefined;
  if (!ext || !ACCEPTED_EXTENSIONS.includes(ext))
    return `Format non supporté. Formats acceptés : ${ACCEPTED_EXTENSIONS.join(', ').toUpperCase()}.`;
  return null;
};

/** Retourne l'icône Bootstrap et la couleur selon le type MIME ou l'extension. */
export const getFileIcon = (
  mimeType?: string | null,
  fileName?: string | null,
): { icon: string; color: string } => {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  if (mimeType === 'application/pdf'  || ext === 'pdf')  return { icon: 'bi-file-earmark-pdf-fill',  color: 'danger'   };
  if (mimeType?.includes('word')      || ext === 'doc' || ext === 'docx')
                                                          return { icon: 'bi-file-earmark-word-fill', color: 'primary'  };
  if (ext === 'zip' || mimeType?.includes('zip'))         return { icon: 'bi-file-zip-fill',          color: 'warning'  };
  if (ext === 'rar' || mimeType?.includes('rar'))         return { icon: 'bi-file-zip-fill',          color: 'orange'   };
  if (ext === '7z'  || mimeType?.includes('7z'))          return { icon: 'bi-file-zip-fill',          color: 'secondary'};
  return { icon: 'bi-file-earmark-fill', color: 'secondary' };
};

const ArchiveService = {

  // ── Liste paginée avec filtres ──────────────────────────────────────────────
  list: async (
    page      = 0,
    size      = 12,
    type?:      TypeArchive,
    categorie?: CategorieArchive,
    keyword?:   string,
  ): Promise<SpringPage<ArchiveResponse>> => {
    const params: Record<string, any> = { page, size };
    if (type)      params.type      = type;
    if (categorie) params.categorie = categorie;
    if (keyword)   params.keyword   = keyword;
    const res = await api.get<SpringPage<ArchiveResponse>>('/api/archives', { params });
    return res.data;
  },

  // ── Upload document scanné ──────────────────────────────────────────────────
  uploadScanne: async (file: File, dto: ArchiveRequest): Promise<ArchiveResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('data', new Blob([JSON.stringify(dto)], { type: 'application/json' }));
    const res = await api.post<ArchiveResponse>('/api/archives/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // ── Archiver un document imprimé (sans fichier) ─────────────────────────────
  archiverImprime: async (dto: ArchiveRequest): Promise<ArchiveResponse> => {
    const res = await api.post<ArchiveResponse>('/api/archives/imprime', dto);
    return res.data;
  },

  // ── Mettre à jour les métadonnées uniquement ────────────────────────────────
  update: async (id: number, dto: Partial<ArchiveRequest>): Promise<ArchiveResponse> => {
    const res = await api.put<ArchiveResponse>(`/api/archives/${id}`, dto);
    return res.data;
  },

  // ── Mettre à jour avec remplacement du fichier ──────────────────────────────
  updateWithFile: async (id: number, file: File, dto: Partial<ArchiveRequest>): Promise<ArchiveResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('data', new Blob([JSON.stringify(dto)], { type: 'application/json' }));
    const res = await api.put<ArchiveResponse>(`/api/archives/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // ── Télécharger un fichier ──────────────────────────────────────────────────
  download: async (id: number, fileName: string): Promise<void> => {
    const res = await api.get(`/api/archives/download/${id}`, { responseType: 'blob' });
    const url  = URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href     = url;
    link.download = fileName || `archive_${id}`;
    link.click();
    URL.revokeObjectURL(url);
  },

  // ── Supprimer ───────────────────────────────────────────────────────────────
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/archives/${id}`);
  },

  // ── Stats ───────────────────────────────────────────────────────────────────
  stats: async (): Promise<ArchiveStats> => {
    const res = await api.get<ArchiveStats>('/api/archives/stats');
    return res.data;
  },
};

export default ArchiveService;