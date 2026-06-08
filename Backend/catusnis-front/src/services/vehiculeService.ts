import api from './api';
import { ApiResponse, Page } from '../types';
import { getPrintConfig } from './globalprintservice';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface VehiculeResponse {
  id: number; immatriculation: string; type: string;
  marque: string; modele: string; couleur: string;
  dateAcquisition: string; kilometrage: number; statut: string;
  numeroCarteGrise: string;
  dateAssurance: string; dateFinAssurance: string;
  assuranceExpiree: boolean; assuranceBientotExpiree: boolean;
  dateVisiteTechnique: string; dateFinVisiteTechnique: string;
  visiteTechniqueExpiree: boolean; visiteTechniqueBientotExpiree: boolean;
  dateVignette: string; dateFinVignette: string;
  vignetteExpiree: boolean; vignetteBientotExpiree: boolean;
  conducteurId: number; conducteurNom: string;
  conducteurBookletId?: number | null;
  conducteurActifNom?: string | null;
  regionId: number; regionName: string;
  districtId: number; districtName: string;
  image: string; observations: string;
  // ✅ Acquisition (optionnels)
  prixAchat?: number | null;
  fournisseur?: string | null;
  modeFinancement?: string | null;
  numeroBonCommande?: string | null;
  sourceFinancement?: string | null;
}

export interface VehiculeRequest {
  immatriculation: string; type: string;
  marque?: string; modele?: string; couleur?: string;
  dateAcquisition?: string; kilometrage?: number; statut?: string;
  numeroCarteGrise?: string;
  dateAssurance?: string; dateFinAssurance?: string;
  dateVisiteTechnique?: string; dateFinVisiteTechnique?: string;
  dateVignette?: string; dateFinVignette?: string;
  conducteurId?: number;
  conducteurBookletId?: number;  // conducteur depuis registre Booklet
  regionId?: number; districtId?: number;
  image?: string; observations?: string;
  // ✅ Acquisition (tous optionnels)
  prixAchat?: number | null;
  fournisseur?: string | null;
  modeFinancement?: string | null;
  numeroBonCommande?: string | null;
  sourceFinancement?: string | null;
}

export interface VehiculeIncidentResponse {
  id: number; vehiculeId: number; immatriculation: string; vehiculeType: string;
  dateIncident: string; description: string; typeIncident: string; statut: string;
  coutEstime: number; signalePar: string; lieuIncident: string; observations: string;
}

export interface VehiculeIncidentRequest {
  vehiculeId: number; dateIncident: string; description: string;
  typeIncident?: string; statut?: string; coutEstime?: number;
  signalePar?: string; lieuIncident?: string; observations?: string;
}

export interface VehiculeMaintenanceResponse {
  id: number; vehiculeId: number; immatriculation: string;
  dateMaintenance: string; typeMaintenance: string; description: string;
  prestataire: string; coutReel: number; statut: string;
  kilometrageIntervention: number; observations: string;
}

export interface VehiculeMaintenanceRequest {
  vehiculeId: number; dateMaintenance: string;
  typeMaintenance: string; description: string;
  prestataire?: string; coutReel?: number; statut?: string;
  kilometrageIntervention?: number; observations?: string;
}

export interface VehiculeAffectationResponse {
  id: number; vehiculeId: number;
  immatriculation: string; vehiculeType: string; vehiculeMarque: string;
  personId: number | null; bookletId: number | null;
  personNom: string; personPoste: string; personContact: string | null;
  regionId: number; regionName: string;
  districtId: number; districtName: string;
  dateAffectation: string; dateRetour: string | null;
  motif: string; observations: string; active: boolean;
}

export interface VehiculeAffectationRequest {
  vehiculeId: number; personId?: number; bookletId?: number;
  regionId?: number; districtId?: number;
  dateAffectation: string; dateRetour?: string;
  motif?: string; observations?: string;
}

export interface VehiculeAlertResponse {
  id: number; immatriculation: string; vehiculeType: string;
  typeAlerte: string; niveau: string; dateExpiration: string; joursRestants: number;
}


export interface VehiculeDocumentHistoriqueResponse {
  id: number; vehiculeId: number; immatriculation: string;
  typeDocument: string;
  ancienneDateDebut: string | null; ancienneDateFin: string | null;
  nouvelleDateDebut: string; nouvelleDateFin: string;
  dateRenouvellement: string; notes: string | null;
}

export interface VehiculeDocumentRenewalRequest {
  typeDocument: string;
  nouvelleDateDebut: string;
  nouvelleDateFin: string;
  notes?: string | null;
}

export interface VehiculeHistoriqueResponse {
  id: number; immatriculation: string; type: string;
  marque: string; modele: string; couleur: string;
  dateAcquisition: string; kilometrage: number; statut: string;
  numeroCarteGrise: string;
  regionName: string; districtName: string; conducteurNom: string;
  observations: string; image: string;
  dateFinAssurance: string; assuranceExpiree: boolean; assuranceBientotExpiree: boolean;
  dateFinVisiteTechnique: string; visiteTechniqueExpiree: boolean; visiteTechniqueBientotExpiree: boolean;
  dateFinVignette: string; vignetteExpiree: boolean; vignetteBientotExpiree: boolean;
  prixAchat?: number | null; fournisseur?: string | null;
  modeFinancement?: string | null; numeroBonCommande?: string | null; sourceFinancement?: string | null;
  affectations: VehiculeAffectationResponse[];
  incidents: VehiculeIncidentResponse[];
  maintenances: VehiculeMaintenanceResponse[];
  alertes: VehiculeAlertResponse[];
  documentsHistorique: VehiculeDocumentHistoriqueResponse[];
}

// ── Impression historique ─────────────────────────────────────────────────────
const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('fr-FR') : '—';

const docStatus = (expir: boolean, bientot: boolean, date?: string) => {
  if (expir)   return `<span style="color:#dc3545;font-weight:bold">⚠️ EXPIRÉ (${fmtDate(date)})</span>`;
  if (bientot) return `<span style="color:#fd7e14;font-weight:bold">⚠️ Bientôt (${fmtDate(date)})</span>`;
  return `<span style="color:#198754">✅ Valide (${fmtDate(date)})</span>`;
};

export const printHistorique = (h: VehiculeHistoriqueResponse): void => {
  const cfg = getPrintConfig();
  const leftImg  = cfg.leftImageUrl  ? `<img src="${cfg.leftImageUrl}"  style="width:70px;height:70px;object-fit:contain" />` : '';
  const rightImg = cfg.rightImageUrl ? `<img src="${cfg.rightImageUrl}" style="width:70px;height:70px;object-fit:contain" />` : '';
  const bgStyle  = cfg.bgImageUrl
    ? `background-image:url('${cfg.bgImageUrl}');background-repeat:no-repeat;background-position:center;background-size:300px;background-attachment:fixed;`
    : '';
  const now = new Date().toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  const rowStyle = 'border:1px solid #dee2e6;padding:8px;font-size:11px;';
  const thStyle  = `${rowStyle}background:#f8f9fa;font-weight:bold;`;

  const affRows = (h.affectations || []).map((a, i) => `
    <tr style="background:${i%2===0?'white':'#f9f9f9'}">
      <td style="${rowStyle}">${fmtDate(a.dateAffectation)}</td>
      <td style="${rowStyle}">${a.personNom || '—'}</td>
      <td style="${rowStyle}">${a.personPoste || '—'}</td>
      <td style="${rowStyle}">${a.regionName || '—'}</td>
      <td style="${rowStyle}">${a.motif || '—'}</td>
      <td style="${rowStyle}">${fmtDate(a.dateRetour)}</td>
      <td style="${rowStyle}">${a.active ? '✅ Active' : 'Clôturée'}</td>
    </tr>`).join('');

  const incRows = (h.incidents || []).map((inc, i) => `
    <tr style="background:${i%2===0?'white':'#f9f9f9'}">
      <td style="${rowStyle}">${fmtDate(inc.dateIncident)}</td>
      <td style="${rowStyle}">${inc.typeIncident || '—'}</td>
      <td style="${rowStyle}">${inc.lieuIncident || '—'}</td>
      <td style="${rowStyle}">${inc.signalePar || '—'}</td>
      <td style="${rowStyle}">${inc.coutEstime ? `${inc.coutEstime.toLocaleString()} FCFA` : '—'}</td>
      <td style="${rowStyle}">${inc.statut || '—'}</td>
      <td style="${rowStyle}">${inc.description || '—'}</td>
    </tr>`).join('');

  const maintRows = (h.maintenances || []).map((m, i) => `
    <tr style="background:${i%2===0?'white':'#f9f9f9'}">
      <td style="${rowStyle}">${fmtDate(m.dateMaintenance)}</td>
      <td style="${rowStyle}">${m.typeMaintenance || '—'}</td>
      <td style="${rowStyle}">${m.prestataire || '—'}</td>
      <td style="${rowStyle}">${m.coutReel ? `${m.coutReel.toLocaleString()} FCFA` : '—'}</td>
      <td style="${rowStyle}">${m.kilometrageIntervention ? `${m.kilometrageIntervention.toLocaleString()} km` : '—'}</td>
      <td style="${rowStyle}">${m.statut || '—'}</td>
      <td style="${rowStyle}">${m.description || '—'}</td>
    </tr>`).join('');

  const alertRows = (h.alertes || []).map((a, i) => `
    <tr style="background:${a.niveau==='EXPIRE'?'#fff5f5':i%2===0?'white':'#f9f9f9'}">
      <td style="${rowStyle}">${a.typeAlerte.replace('_',' ')}</td>
      <td style="${rowStyle}">${fmtDate(a.dateExpiration)}</td>
      <td style="${rowStyle}">${a.joursRestants <= 0
        ? `<span style="color:#dc3545;font-weight:bold">Expiré depuis ${Math.abs(a.joursRestants)} j</span>`
        : `<span style="color:#fd7e14">${a.joursRestants} j restants</span>`}</td>
      <td style="${rowStyle}"><span style="color:${a.niveau==='EXPIRE'?'#dc3545':'#fd7e14'};font-weight:bold">${a.niveau==='EXPIRE'?'🔴 EXPIRÉ':'🟠 BIENTÔT'}</span></td>
    </tr>`).join('');

  // Section historique documents
  const docHistRows = (h.documentsHistorique || []).map((d, i) => `
    <tr style="background:${i%2===0?'white':'#f9f9f9'}">
      <td style="${rowStyle}">${d.typeDocument.replace(/_/g,' ')}</td>
      <td style="${rowStyle}">${fmtDate(d.dateRenouvellement)}</td>
      <td style="${rowStyle}">${d.ancienneDateDebut ? fmtDate(d.ancienneDateDebut) + ' → ' + fmtDate(d.ancienneDateFin) : '—'}</td>
      <td style="${rowStyle};color:#198754;font-weight:bold">${fmtDate(d.nouvelleDateDebut)} → ${fmtDate(d.nouvelleDateFin)}</td>
      <td style="${rowStyle}">${d.notes || '—'}</td>
    </tr>`).join('');

  // Section acquisition dans l'historique
  const acqSection = (h.prixAchat || h.fournisseur || h.modeFinancement || h.numeroBonCommande || h.sourceFinancement) ? `
    <h3>💰 Informations d'acquisition</h3>
    <table>
      <tr>
        <td style="${thStyle}width:20%">Prix d'achat</td>
        <td style="${rowStyle}width:30%">${h.prixAchat ? `${h.prixAchat.toLocaleString()} FCFA` : '—'}</td>
        <td style="${thStyle}width:20%">Fournisseur</td>
        <td style="${rowStyle}width:30%">${h.fournisseur || '—'}</td>
      </tr>
      <tr>
        <td style="${thStyle}">Mode financement</td>
        <td style="${rowStyle}">${h.modeFinancement?.replace(/_/g,' ') || '—'}</td>
        <td style="${thStyle}">Source financement</td>
        <td style="${rowStyle}">${h.sourceFinancement || '—'}</td>
      </tr>
      <tr>
        <td style="${thStyle}">N° Bon de commande</td>
        <td style="${rowStyle}" colspan="3">${h.numeroBonCommande || '—'}</td>
      </tr>
    </table>` : '';

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"/>
<title>Historique — ${h.immatriculation}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:Arial,sans-serif; font-size:12px; color:#222; ${bgStyle} }
  body::before { content:''; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.93); z-index:-1; }
  h3 { color:#0d6efd; margin:16px 0 8px 0; font-size:13px; border-bottom:1px solid #dee2e6; padding-bottom:4px; }
  table { width:100%; border-collapse:collapse; margin-bottom:16px; }
  @page { margin:1.5cm; size:A4 landscape; }
  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style></head>
<body><div style="position:relative;padding:20px;">
  <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:2px solid #0d6efd;margin-bottom:20px;">
    <div style="width:90px;display:flex;justify-content:center;">${leftImg}</div>
    <div style="text-align:center;flex:1;padding:0 16px;">
      <h2 style="margin:0 0 4px 0;font-size:20px;color:#0d6efd;">HISTORIQUE VÉHICULE</h2>
      <p style="margin:0;font-size:16px;font-weight:bold;">${h.immatriculation}</p>
      <p style="margin:4px 0 0 0;color:#666;font-size:12px;">${now}</p>
    </div>
    <div style="width:90px;display:flex;justify-content:center;">${rightImg}</div>
  </div>
  <h3>🚗 Informations générales</h3>
  <table>
    <tr>
      <td style="${thStyle}width:16%">Immatriculation</td><td style="${rowStyle}width:17%">${h.immatriculation}</td>
      <td style="${thStyle}width:16%">Type</td><td style="${rowStyle}width:17%">${h.type||'—'}</td>
      <td style="${thStyle}width:16%">Statut</td><td style="${rowStyle}width:17%">${h.statut||'—'}</td>
    </tr>
    <tr>
      <td style="${thStyle}">Marque / Modèle</td><td style="${rowStyle}">${h.marque||'—'} ${h.modele||''}</td>
      <td style="${thStyle}">Couleur</td><td style="${rowStyle}">${h.couleur||'—'}</td>
      <td style="${thStyle}">Kilométrage</td><td style="${rowStyle}">${h.kilometrage?`${h.kilometrage.toLocaleString()} km`:'—'}</td>
    </tr>
    <tr>
      <td style="${thStyle}">Région</td><td style="${rowStyle}">${h.regionName||'—'}</td>
      <td style="${thStyle}">District</td><td style="${rowStyle}">${h.districtName||'—'}</td>
      <td style="${thStyle}">Conducteur</td><td style="${rowStyle}">${h.conducteurNom||'—'}</td>
    </tr>
    <tr>
      <td style="${thStyle}">N° Carte grise</td><td style="${rowStyle}">${h.numeroCarteGrise||'—'}</td>
      <td style="${thStyle}">Date acquisition</td><td style="${rowStyle}">${fmtDate(h.dateAcquisition)}</td>
      <td style="${thStyle}">Observations</td><td style="${rowStyle}">${h.observations||'—'}</td>
    </tr>
  </table>
  ${acqSection}
  <h3>📄 État actuel des documents</h3>
  <table>
    <tr>
      <td style="${thStyle}width:20%">Assurance</td>
      <td style="${rowStyle}width:30%">${docStatus(h.assuranceExpiree, h.assuranceBientotExpiree, h.dateFinAssurance)}</td>
      <td style="${thStyle}width:20%">Visite technique</td>
      <td style="${rowStyle}width:30%">${docStatus(h.visiteTechniqueExpiree, h.visiteTechniqueBientotExpiree, h.dateFinVisiteTechnique)}</td>
    </tr>
    <tr>
      <td style="${thStyle}">Vignette</td>
      <td style="${rowStyle}">${docStatus(h.vignetteExpiree, h.vignetteBientotExpiree, h.dateFinVignette)}</td>
      <td style="${thStyle}"></td><td style="${rowStyle}"></td>
    </tr>
  </table>
  ${h.affectations?.length > 0 ? `<h3>👤 Affectations (${h.affectations.length})</h3>
  <table><thead><tr>
    <th style="${thStyle}">Date</th><th style="${thStyle}">Conducteur</th><th style="${thStyle}">Poste</th>
    <th style="${thStyle}">Région</th><th style="${thStyle}">Motif</th><th style="${thStyle}">Retour</th><th style="${thStyle}">Statut</th>
  </tr></thead><tbody>${affRows}</tbody></table>`
  : '<h3>👤 Affectations</h3><p style="color:#999;font-size:11px;margin-bottom:16px;">Aucune affectation</p>'}
  ${h.incidents?.length > 0 ? `<h3>⚠️ Incidents (${h.incidents.length})</h3>
  <table><thead><tr>
    <th style="${thStyle}">Date</th><th style="${thStyle}">Type</th><th style="${thStyle}">Lieu</th>
    <th style="${thStyle}">Signalé par</th><th style="${thStyle}">Coût</th><th style="${thStyle}">Statut</th><th style="${thStyle}">Description</th>
  </tr></thead><tbody>${incRows}</tbody></table>`
  : '<h3>⚠️ Incidents</h3><p style="color:#999;font-size:11px;margin-bottom:16px;">Aucun incident</p>'}
  ${h.maintenances?.length > 0 ? `<h3>🔧 Maintenances (${h.maintenances.length})</h3>
  <table><thead><tr>
    <th style="${thStyle}">Date</th><th style="${thStyle}">Type</th><th style="${thStyle}">Prestataire</th>
    <th style="${thStyle}">Coût</th><th style="${thStyle}">Kilométrage</th><th style="${thStyle}">Statut</th><th style="${thStyle}">Description</th>
  </tr></thead><tbody>${maintRows}</tbody></table>`
  : '<h3>🔧 Maintenances</h3><p style="color:#999;font-size:11px;margin-bottom:16px;">Aucune maintenance</p>'}
  ${h.alertes?.length > 0 ? `<h3>🔔 Alertes (${h.alertes.length})</h3>
  <table><thead><tr>
    <th style="${thStyle}">Document</th><th style="${thStyle}">Expiration</th>
    <th style="${thStyle}">Jours restants</th><th style="${thStyle}">Niveau</th>
  </tr></thead><tbody>${alertRows}</tbody></table>`
  : '<h3>🔔 Alertes</h3><p style="color:#198754;font-size:11px;margin-bottom:16px;">✅ Tous documents valides</p>'}
  ${(h.documentsHistorique && h.documentsHistorique.length > 0) ? `<h3>🔄 Renouvellements de documents (${h.documentsHistorique.length})</h3>
  <table><thead><tr>
    <th style="${thStyle}">Document</th>
    <th style="${thStyle}">Date renouvellement</th>
    <th style="${thStyle}">Ancienne période</th>
    <th style="${thStyle}">Nouvelle période</th>
    <th style="${thStyle}">Notes</th>
  </tr></thead><tbody>${docHistRows}</tbody></table>`
  : ''}
  <div style="margin-top:40px;display:flex;justify-content:space-between;">
    <div style="text-align:center"><p style="font-weight:bold">Responsable logistique</p><p style="margin-top:30px">____________________</p></div>
    <div style="text-align:center"><p style="font-weight:bold;color:#666;font-size:11px">CATUSNIS — ${now}</p></div>
    <div style="text-align:center"><p style="font-weight:bold">Conducteur / Convoyeur</p><p style="margin-top:30px">____________________</p></div>
  </div>
</div></body></html>`;

  const win = window.open('', '_blank', 'width=1200,height=800');
  if (!win) { alert('Autorisez les popups pour imprimer'); return; }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); setTimeout(() => win.close(), 1000); }, 600);
};

const VehiculeService = {
  getAll: async (page = 0, size = 10, keyword?: string, type?: string): Promise<Page<VehiculeResponse>> => {
    const params: Record<string, any> = { page, size };
    if (keyword) params.keyword = keyword;
    if (type)    params.type    = type;
    return (await api.get<ApiResponse<Page<VehiculeResponse>>>('/api/vehicules', { params })).data.data;
  },
  save:   async (r: VehiculeRequest): Promise<VehiculeResponse> =>
    (await api.post<ApiResponse<VehiculeResponse>>('/api/vehicules', r)).data.data,
  update: async (id: number, r: VehiculeRequest): Promise<VehiculeResponse> =>
    (await api.put<ApiResponse<VehiculeResponse>>(`/api/vehicules/${id}`, r)).data.data,
  delete: async (id: number) => api.delete(`/api/vehicules/${id}`),

  renouvelerDocument: async (id: number, r: VehiculeDocumentRenewalRequest): Promise<VehiculeDocumentHistoriqueResponse> =>
    (await api.post<ApiResponse<VehiculeDocumentHistoriqueResponse>>(`/api/vehicules/${id}/renouveler-document`, r)).data.data,

  getDocumentsHistorique: async (id: number): Promise<VehiculeDocumentHistoriqueResponse[]> =>
    (await api.get<ApiResponse<VehiculeDocumentHistoriqueResponse[]>>(`/api/vehicules/${id}/documents-historique`)).data.data,

  getHistorique: async (id: number): Promise<VehiculeHistoriqueResponse> =>
    (await api.get<ApiResponse<VehiculeHistoriqueResponse>>(`/api/vehicules/${id}/historique`)).data.data,

  getAlertes: async (joursAvance = 30): Promise<VehiculeAlertResponse[]> =>
    (await api.get<ApiResponse<VehiculeAlertResponse[]>>('/api/vehicules/alertes', { params: { joursAvance } })).data.data,

  getIncidents: async (page = 0, size = 10, vehiculeId?: number): Promise<Page<VehiculeIncidentResponse>> => {
    const params: Record<string, any> = { page, size };
    if (vehiculeId) params.vehiculeId = vehiculeId;
    return (await api.get<ApiResponse<Page<VehiculeIncidentResponse>>>('/api/vehicules/incidents', { params })).data.data;
  },
  saveIncident:   async (r: VehiculeIncidentRequest) =>
    (await api.post<ApiResponse<VehiculeIncidentResponse>>('/api/vehicules/incidents', r)).data.data,
  updateIncident: async (id: number, r: VehiculeIncidentRequest) =>
    (await api.put<ApiResponse<VehiculeIncidentResponse>>(`/api/vehicules/incidents/${id}`, r)).data.data,
  deleteIncident: async (id: number) => api.delete(`/api/vehicules/incidents/${id}`),

  getMaintenances: async (page = 0, size = 10, vehiculeId?: number): Promise<Page<VehiculeMaintenanceResponse>> => {
    const params: Record<string, any> = { page, size };
    if (vehiculeId) params.vehiculeId = vehiculeId;
    return (await api.get<ApiResponse<Page<VehiculeMaintenanceResponse>>>('/api/vehicules/maintenances', { params })).data.data;
  },
  saveMaintenance:   async (r: VehiculeMaintenanceRequest) =>
    (await api.post<ApiResponse<VehiculeMaintenanceResponse>>('/api/vehicules/maintenances', r)).data.data,
  updateMaintenance: async (id: number, r: VehiculeMaintenanceRequest) =>
    (await api.put<ApiResponse<VehiculeMaintenanceResponse>>(`/api/vehicules/maintenances/${id}`, r)).data.data,
  deleteMaintenance: async (id: number) => api.delete(`/api/vehicules/maintenances/${id}`),

  getAffectations: async (page = 0, size = 10, vehiculeId?: number, active?: boolean): Promise<Page<VehiculeAffectationResponse>> => {
    const params: Record<string, any> = { page, size };
    if (vehiculeId !== undefined) params.vehiculeId = vehiculeId;
    if (active     !== undefined) params.active     = active;
    return (await api.get<ApiResponse<Page<VehiculeAffectationResponse>>>('/api/vehicules/affectations', { params })).data.data;
  },
  getAffectationActive: async (vehiculeId: number): Promise<VehiculeAffectationResponse | null> => {
    try { return (await api.get<ApiResponse<VehiculeAffectationResponse>>(`/api/vehicules/${vehiculeId}/affectation-active`)).data.data; }
    catch { return null; }
  },
  affecter: async (r: VehiculeAffectationRequest): Promise<VehiculeAffectationResponse> =>
    (await api.post<ApiResponse<VehiculeAffectationResponse>>('/api/vehicules/affectations', r)).data.data,
  updateAffectation: async (id: number, r: VehiculeAffectationRequest): Promise<VehiculeAffectationResponse> =>
    (await api.put<ApiResponse<VehiculeAffectationResponse>>(`/api/vehicules/affectations/${id}`, r)).data.data,
  cloturerAffectation: async (vehiculeId: number) =>
    api.put(`/api/vehicules/${vehiculeId}/cloturer-affectation`),
};

export default VehiculeService;