import api from './api';
import VehiculeService from './vehiculeService';
import AuthService from './authService';

console.log('[DashboardService] v9 — fix getUserStats: size 1000 + archivesTotal');

const PREFIX = '/api';
const ITECH_PARTNER_ID = 17;

function unwrap(raw: any): any {
  if (!raw) return null;
  if (raw.success !== undefined && raw.data !== undefined) return raw.data;
  return raw;
}

function extractContent<T = any>(raw: any): T[] {
  const data = unwrap(raw);
  if (!data) return [];
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray(data.content)) return data.content as T[];
  if (data._embedded) {
    const k = Object.keys(data._embedded)[0];
    if (k && Array.isArray(data._embedded[k])) return data._embedded[k] as T[];
  }
  return [];
}

function extractTotal(raw: any): number {
  const data = unwrap(raw);
  if (!data) return 0;
  if (data.page?.totalElements != null) return data.page.totalElements;
  if (typeof data.totalElements === 'number') return data.totalElements;
  if (typeof data.total === 'number') return data.total;
  if (Array.isArray(data)) return data.length;
  if (Array.isArray(data.content)) return data.content.length;
  return 0;
}

function normalizeAcquisition(a: any): any {
  return {
    ...a,
    dateAcquisition: a.dateAcquisition || a.dateAcq || null,
    typeName: a.typeName || a.Type || a.type?.name || a.type || 'Autre',
    quantite: a.quantite ?? a.quantity ?? 1,
    statut: a.statut || a.status || 'INCONNU',
  };
}

function normalizeDeployment(d: any): any {
  return {
    ...d,
    dateDeployment: d.dateDeployment || d.dateDepl || d.date || null,
    healthSiteName: d.healthSiteName || d.siteName || d.site?.name || '—',
  };
}

function normalizeIntervention(it: any): any {
  return {
    ...it,
    dateIntervention: it.dateIntervention || it.dateInter || it.dateInterv || it.date || null,
    statut:           it.statut || it.status || 'INCONNU',
    typeIntervention: it.typeIntervention || it.typeInter || it.type || 'AUTRE',
    healthSiteName:   it.healthSiteName   || it.healthName || it.siteName || it.site?.name || '—',
    codeInter:        it.codeInter        || it.code || null,
  };
}

function sortByDateDesc<T = any>(items: T[], dateField: string): T[] {
  return [...items].sort((a: any, b: any) => {
    const da = a?.[dateField] ? new Date(a[dateField]).getTime() : 0;
    const db = b?.[dateField] ? new Date(b[dateField]).getTime() : 0;
    return db - da;
  });
}

function buildParams(
  base: Record<string, any>,
  size: number,
): Record<string, any> {
  const person = AuthService.getCurrentPerson();
  const params: Record<string, any> = { page: 0, size, ...base };
  if (!person) return params;
  if (person.role === 'SUPER_ADMIN') return params;
  if (person.partnerId === ITECH_PARTNER_ID) return params;
  if (person.partnerId) { params.partnerId = person.partnerId; }
  return params;
}

async function fetchAll<T = any>(
  endpoint: string,
  size = 200,
  extraParams: Record<string, any> = {},
): Promise<T[]> {
  const url = `${PREFIX}${endpoint}`;
  try {
    const params = buildParams(extraParams, size);
    const { data } = await api.get(url, { params });
    const list = extractContent<T>(data);
    if (list.length === 0) {
      const keys      = data ? Object.keys(data) : [];
      const innerKeys = data?.data ? Object.keys(data.data) : [];
      console.warn(`[dashboard] ⚠️  ${url} → 0 items. Structure: {${keys.join(',')}} inner:{${innerKeys.join(',')}}`);
    } else {
      console.log(`[dashboard] ✅ ${url} → ${list.length} items`);
    }
    return list;
  } catch (err: any) {
    const status = err?.response?.status || '?';
    const msg    = err?.response?.data?.message || err?.message;
    console.warn(`[dashboard] ❌ ${url} → HTTP ${status} | ${msg}`);
    return [];
  }
}

async function fetchTotal(endpoint: string): Promise<number> {
  const url = `${PREFIX}${endpoint}`;
  try {
    const params = buildParams({}, 1);
    const { data } = await api.get(url, { params });
    const total = extractTotal(data);
    console.log(`[dashboard] ✅ ${url} total → ${total}`);
    return total;
  } catch (err: any) {
    console.warn(`[dashboard] ❌ ${url} total → HTTP ${err?.response?.status}`);
    return 0;
  }
}

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface GlobalStats {
  acquisitionsTotal:    number;
  deploymentsTotal:     number;
  interventionsTotal:   number;
  sitesTotal:           number;
  vehiculesTotal:       number;
  vehiculesDisponibles: number;
  vehiculesEnMission:   number;
  vehiculesEnPanne:     number;
  alertesTotal:         number;
  alertesExpirees:      number;
  vehiculesByType:      Record<string, number>;
  acquisitions:         any[];
  deployments:          any[];
  interventions:        any[];
}

export interface EquipStats {
  acquisitionsTotal:     number;
  deploymentsTotal:      number;
  interventionsTotal:    number;
  sitesTotal:            number;
  acquisitionsByType:    Record<string, number>;
  interventionsByStatus: Record<string, number>;
  interventionsByType:   Record<string, number>;
  acquisitionsByMonth:   Record<string, number>;
  deploymentsByMonth:    Record<string, number>;
  interventionsByMonth:  Record<string, number>;
  acquisitions: any[];
  deployments:  any[];
  interventions: any[];
}

// ✅ FIX — ajout archivesTotal
export interface UserStats {
  acquisitionsTotal: number;
  deploymentsTotal:  number;
  sitesTotal:        number;
  archivesTotal:     number;    // ✅ NOUVEAU
  recentDeployments: any[];
  acquisitions:      any[];
  deployments:       any[];
}

export interface TechnicienStats {
  interventions: any[];
  sites:         any[];
}

function groupByMonth(items: any[], dateField: string): Record<string, number> {
  const out: Record<string, number> = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out[d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })] = 0;
  }
  items.forEach((it: any) => {
    if (!it?.[dateField]) return;
    const dt = new Date(it[dateField]);
    if (isNaN(dt.getTime())) return;
    const key = dt.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    if (key in out) out[key]++;
  });
  return out;
}

// ── Fonctions export ──────────────────────────────────────────────────────────

export async function getGlobalStats(): Promise<GlobalStats> {
  const [aRaw, dRaw, iRaw, sitesTotal, vPage, alertes] = await Promise.all([
    fetchAll<any>('/acquisitions',  200),
    fetchAll<any>('/deployments',   200),
    fetchAll<any>('/interventions', 200),
    fetchTotal('/healths'),
    VehiculeService.getAll(0, 200).catch(() => ({ content: [], totalElements: 0 } as any)),
    VehiculeService.getAlertes(30).catch(() => [] as any[]),
  ]);

  const acquisitions  = sortByDateDesc(aRaw.map(normalizeAcquisition),  'dateAcquisition');
  const deployments   = sortByDateDesc(dRaw.map(normalizeDeployment),   'dateDeployment');
  const interventions = sortByDateDesc(iRaw.map(normalizeIntervention), 'dateIntervention');

  const vehicules: any[] = vPage?.content || [];
  const vehiculesByType: Record<string, number> = {};
  vehicules.forEach((v: any) => {
    const t = v?.type || 'AUTRE';
    vehiculesByType[t] = (vehiculesByType[t] || 0) + 1;
  });

  return {
    acquisitionsTotal:    acquisitions.length,
    deploymentsTotal:     deployments.length,
    interventionsTotal:   interventions.length,
    sitesTotal,
    vehiculesTotal:       vPage?.totalElements ?? vehicules.length,
    vehiculesDisponibles: vehicules.filter((v: any) => v?.statut === 'DISPONIBLE').length,
    vehiculesEnMission:   vehicules.filter((v: any) => v?.statut === 'EN_MISSION').length,
    vehiculesEnPanne:     vehicules.filter((v: any) => v?.statut === 'EN_PANNE').length,
    alertesTotal:         alertes.length,
    alertesExpirees:      alertes.filter((a: any) => a?.niveau === 'EXPIRE').length,
    vehiculesByType,
    acquisitions, deployments, interventions,
  };
}

export async function getEquipStats(): Promise<EquipStats> {
  const [aRaw, dRaw, iRaw, sitesTotal] = await Promise.all([
    fetchAll<any>('/acquisitions',  200),
    fetchAll<any>('/deployments',   200),
    fetchAll<any>('/interventions', 200),
    fetchTotal('/healths'),
  ]);

  const acquisitions  = sortByDateDesc(aRaw.map(normalizeAcquisition),  'dateAcquisition');
  const deployments   = sortByDateDesc(dRaw.map(normalizeDeployment),   'dateDeployment');
  const interventions = sortByDateDesc(iRaw.map(normalizeIntervention), 'dateIntervention');

  const acquisitionsByType: Record<string, number> = {};
  acquisitions.forEach((a: any) => {
    const t = a.typeName || 'Autre';
    acquisitionsByType[t] = (acquisitionsByType[t] || 0) + (a.quantite ?? 1);
  });

  const interventionsByStatus: Record<string, number> = {};
  interventions.forEach((it: any) => {
    const s = it.statut || 'INCONNU';
    interventionsByStatus[s] = (interventionsByStatus[s] || 0) + 1;
  });

  const interventionsByType: Record<string, number> = {};
  interventions.forEach((it: any) => {
    const t = it.typeIntervention || 'AUTRE';
    interventionsByType[t] = (interventionsByType[t] || 0) + 1;
  });

  return {
    acquisitionsTotal:    acquisitions.length,
    deploymentsTotal:     deployments.length,
    interventionsTotal:   interventions.length,
    sitesTotal,
    acquisitionsByType, interventionsByStatus, interventionsByType,
    acquisitionsByMonth:  groupByMonth(acquisitions,  'dateAcquisition'),
    deploymentsByMonth:   groupByMonth(deployments,   'dateDeployment'),
    interventionsByMonth: groupByMonth(interventions, 'dateIntervention'),
    acquisitions, deployments, interventions,
  };
}

// ✅ FIX getUserStats — taille 1000 + archivesTotal
export async function getUserStats(): Promise<UserStats> {
  const [aRaw, dRaw, sitesTotal, archivesTotal] = await Promise.all([
    fetchAll<any>('/acquisitions', 1000),   // ✅ était 100 → vrai total
    fetchAll<any>('/deployments',  200),
    fetchTotal('/healths'),
    fetchTotal('/archives'),                // ✅ NOUVEAU
  ]);

  const acquisitions = sortByDateDesc(aRaw.map(normalizeAcquisition), 'dateAcquisition');
  const deployments  = sortByDateDesc(dRaw.map(normalizeDeployment),  'dateDeployment');

  return {
    acquisitionsTotal: acquisitions.length,
    deploymentsTotal:  deployments.length,
    sitesTotal,
    archivesTotal,                          // ✅ NOUVEAU
    recentDeployments: deployments.slice(0, 5),
    acquisitions,
    deployments,
  };
}

export async function getTechnicienStats(personId: number): Promise<TechnicienStats> {
  if (!personId) return { interventions: [], sites: [] };

  const [iRaw, sitesRes] = await Promise.all([
    fetchAll<any>('/interventions', 200),
    api.get(`${PREFIX}/technician-sites/technician/${personId}`)
      .then((r: any) => {
        const raw = r.data;
        return Array.isArray(raw) ? raw
          : Array.isArray(raw?.data) ? raw.data
          : extractContent(raw);
      })
      .catch((err: any) => {
        console.warn(`[dashboard] ❌ technician-sites/technician/${personId} → HTTP ${err?.response?.status}`);
        return [] as any[];
      }),
  ]);

  const norm     = iRaw.map(normalizeIntervention);
  const filtered = norm.filter((it: any) =>
    !it.technicienId || it.technicienId === personId ||
    it.technicien?.id === personId || it.personId === personId
  );

  return {
    interventions: sortByDateDesc(filtered, 'dateIntervention'),
    sites: sitesRes,
  };
}

export async function getRecentDeployments(size = 5): Promise<any[]> {
  const raw = await fetchAll('/deployments', 50);
  return sortByDateDesc(raw.map(normalizeDeployment), 'dateDeployment').slice(0, size);
}
export async function getRecentInterventions(size = 5): Promise<any[]> {
  const raw = await fetchAll('/interventions', 50);
  return sortByDateDesc(raw.map(normalizeIntervention), 'dateIntervention').slice(0, size);
}
export async function getRecentAcquisitions(size = 5): Promise<any[]> {
  const raw = await fetchAll('/acquisitions', 50);
  return sortByDateDesc(raw.map(normalizeAcquisition), 'dateAcquisition').slice(0, size);
}

export async function getActiveAffectations(size = 10): Promise<any[]> {
  try {
    const p = await VehiculeService.getAffectations(0, size, undefined, true);
    return p?.content || [];
  } catch { return []; }
}

export async function getAlertes(days = 30): Promise<any[]> {
  try { return await VehiculeService.getAlertes(days); } catch { return []; }
}

const DashboardService = {
  getGlobalStats, getEquipStats, getUserStats, getTechnicienStats,
  getRecentDeployments, getRecentInterventions, getRecentAcquisitions,
  getActiveAffectations, getAlertes,
};

export default DashboardService;