import api from './api';

// ── Types ─────────────────────────────────────────────────────────────────────
export type FournitureCategorie = 'INFORMATIQUE' | 'MOBILIER' | 'PAPETERIE' | 'BUREAUTIQUE' | 'ELECTROMENAGER' | 'AUTRE';
export type FournitureStatut    = 'DISPONIBLE' | 'DEPLOYE' | 'EN_RUPTURE';

export interface FournitureResponse {
  id:                 number;
  code:               string;
  designation:        string;
  categorie:          FournitureCategorie;
  quantite:           number;
  quantiteDisponible: number;
  quantiteDeployee:   number;
  unite:              string;
  description:        string | null;
  dateAcquisition:    string | null;
  fournisseur:        string | null;
  prixUnitaire:       number | null;
  statut:             FournitureStatut;
  createdAt:          string;
}

export interface FournitureRequest {
  designation:     string;
  categorie:       FournitureCategorie;
  quantite:        number;
  unite?:          string;
  description?:    string;
  dateAcquisition?: string;
  fournisseur?:    string;
  prixUnitaire?:   number;
}

export interface FournitureDeploiementResponse {
  id:                     number;
  fournitureId:           number;
  fournitureCode:         string;
  fournitureDesignation:  string;
  fournitureCategorie:    string;
  personId:               number | null;
  bookletId:              number | null;
  beneficiaireNom:        string | null;
  beneficiairePoste:      string | null;
  beneficiaireContact:    string | null;
  quantiteDeployee:       number;
  dateDeploiement:        string;
  motif:                  string | null;
  regionId:               number | null;
  regionName:             string | null;
  districtId:             number | null;
  districtName:           string | null;
  notes:                  string | null;
  active:                 boolean;
  createdAt:              string;
}

export interface FournitureDeploiementRequest {
  fournitureId:     number;
  personId?:        number;
  bookletId?:       number;
  quantiteDeployee: number;
  dateDeploiement?: string;
  motif?:           string;
  regionId?:        number;
  districtId?:      number;
  notes?:           string;
}

export interface FournitureStats {
  total:             number;
  disponibles:       number;
  deployes:          number;
  enRupture:         number;
  totalDeploiements: number;
  informatique:      number;
  mobilier:          number;
  papeterie:         number;
  bureautique:       number;
  electromenager:    number;
}

export interface SpringPage<T> {
  content:       T[];
  totalElements: number;
  totalPages:    number;
  number:        number;
  size:          number;
}

// Unwrap ApiResponse wrapper
function unwrap<T>(res: any): T {
  if (res?.success !== undefined && res?.data !== undefined) return res.data as T;
  return res as T;
}

const FournitureService = {

  getAll: async (
    page      = 0,
    size      = 12,
    categorie?: FournitureCategorie,
    statut?:    FournitureStatut,
    keyword?:   string,
  ): Promise<SpringPage<FournitureResponse>> => {
    const params: Record<string, any> = { page, size };
    if (categorie) params.categorie = categorie;
    if (statut)    params.statut    = statut;
    if (keyword)   params.keyword   = keyword;
    const res = await api.get('/api/fournitures', { params });
    return unwrap<SpringPage<FournitureResponse>>(res.data);
  },

  getAllList: async (): Promise<FournitureResponse[]> => {
    const res = await api.get('/api/fournitures/all');
    return unwrap<FournitureResponse[]>(res.data);
  },

  save: async (request: FournitureRequest): Promise<FournitureResponse> => {
    const res = await api.post('/api/fournitures', request);
    return unwrap<FournitureResponse>(res.data);
  },

  update: async (id: number, request: FournitureRequest): Promise<FournitureResponse> => {
    const res = await api.put(`/api/fournitures/${id}`, request);
    return unwrap<FournitureResponse>(res.data);
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/fournitures/${id}`);
  },

  // ── Déploiements ────────────────────────────────────────────────────────────

  getDeploiements: async (
    page?:        number,
    size?:        number,
    fournitureId?: number,
    active?:      boolean,
    keyword?:     string,
  ): Promise<SpringPage<FournitureDeploiementResponse>> => {
    const params: Record<string, any> = { page: page ?? 0, size: size ?? 10 };
    if (fournitureId !== undefined) params.fournitureId = fournitureId;
    if (active       !== undefined) params.active       = active;
    if (keyword)                    params.keyword      = keyword;
    const res = await api.get('/api/fournitures/deploiements', { params });
    return unwrap<SpringPage<FournitureDeploiementResponse>>(res.data);
  },

  deployer: async (request: FournitureDeploiementRequest): Promise<FournitureDeploiementResponse> => {
    const res = await api.post('/api/fournitures/deploiements', request);
    return unwrap<FournitureDeploiementResponse>(res.data);
  },

  updateDeploiement: async (id: number, request: FournitureDeploiementRequest): Promise<FournitureDeploiementResponse> => {
    const res = await api.put(`/api/fournitures/deploiements/${id}`, request);
    return unwrap<FournitureDeploiementResponse>(res.data);
  },

  cloturerDeploiement: async (id: number): Promise<void> => {
    await api.put(`/api/fournitures/deploiements/${id}/cloturer`);
  },

  deleteDeploiement: async (id: number): Promise<void> => {
    await api.delete(`/api/fournitures/deploiements/${id}`);
  },

  // ── Stats ────────────────────────────────────────────────────────────────────

  stats: async (): Promise<FournitureStats> => {
    const res = await api.get('/api/fournitures/stats');
    return unwrap<FournitureStats>(res.data);
  },

  // ── Impression ───────────────────────────────────────────────────────────────

  printListe: (fournitures: FournitureResponse[], titre = 'Liste des fournitures') => {
    const html = `
      <html><head><title>${titre}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
        h2   { color: #1e3a5f; text-align: center; margin-bottom: 4px; }
        .sub { text-align: center; color: #64748b; margin-bottom: 16px; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; }
        th    { background: #1e3a5f; color: #fff; padding: 8px 6px; text-align: left; font-size: 11px; }
        td    { padding: 6px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
        tr:nth-child(even) td { background: #f8fafc; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; }
        .ok   { background: #dcfce7; color: #166534; }
        .dep  { background: #dbeafe; color: #1e40af; }
        .err  { background: #fee2e2; color: #991b1b; }
        @media print { button { display:none; } }
      </style></head>
      <body>
        <h2>CATUSNIS — ${titre}</h2>
        <p class="sub">Édité le ${new Date().toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
        <table>
          <thead><tr>
            <th>Code</th><th>Désignation</th><th>Catégorie</th>
            <th>Qté totale</th><th>Disponible</th><th>Déployé</th>
            <th>Unité</th><th>Fournisseur</th><th>Statut</th>
          </tr></thead>
          <tbody>
            ${fournitures.map(f => `
              <tr>
                <td>${f.code}</td>
                <td>${f.designation}</td>
                <td>${f.categorie}</td>
                <td style="text-align:center">${f.quantite}</td>
                <td style="text-align:center">${f.quantiteDisponible}</td>
                <td style="text-align:center">${f.quantiteDeployee}</td>
                <td>${f.unite}</td>
                <td>${f.fournisseur || '—'}</td>
                <td><span class="badge ${f.statut === 'DISPONIBLE' ? 'ok' : f.statut === 'DEPLOYE' ? 'dep' : 'err'}">${f.statut}</span></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </body></html>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  },

  printDeploiements: (deploiements: FournitureDeploiementResponse[], titre = 'Historique des déploiements') => {
    const html = `
      <html><head><title>${titre}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
        h2   { color: #1e3a5f; text-align: center; margin-bottom: 4px; }
        .sub { text-align: center; color: #64748b; margin-bottom: 16px; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; }
        th    { background: #1e3a5f; color: #fff; padding: 8px 6px; text-align: left; font-size: 11px; }
        td    { padding: 6px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
        tr:nth-child(even) td { background: #f8fafc; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; }
        .ok   { background: #dcfce7; color: #166534; }
        .end  { background: #f1f5f9; color: #475569; }
        @media print { button { display:none; } }
      </style></head>
      <body>
        <h2>CATUSNIS — ${titre}</h2>
        <p class="sub">Édité le ${new Date().toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
        <table>
          <thead><tr>
            <th>Code</th><th>Désignation</th><th>Bénéficiaire</th><th>Poste</th>
            <th>Qté</th><th>Date</th><th>Région</th><th>Motif</th><th>Statut</th>
          </tr></thead>
          <tbody>
            ${deploiements.map(d => `
              <tr>
                <td>${d.fournitureCode}</td>
                <td>${d.fournitureDesignation}</td>
                <td>${d.beneficiaireNom || '—'}</td>
                <td>${d.beneficiairePoste || '—'}</td>
                <td style="text-align:center">${d.quantiteDeployee}</td>
                <td>${new Date(d.dateDeploiement).toLocaleDateString('fr-FR')}</td>
                <td>${d.regionName || '—'}</td>
                <td>${d.motif || '—'}</td>
                <td><span class="badge ${d.active ? 'ok' : 'end'}">${d.active ? 'Actif' : 'Clôturé'}</span></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </body></html>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  },
};

export default FournitureService;