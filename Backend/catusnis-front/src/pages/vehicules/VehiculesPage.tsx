import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../../components/common/MainLayout';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import VehiculeFormModal from './vehiculeFormModal';
import VehiculeIncidentModal from './vehiculeIncidentModal';
import VehiculeMaintenanceModal from './vehiculeMaintenanceModal';
import VehiculeAffectationModal from './vehiculeAffectationModal';
import notify  from '../../services/notify';
import VehiculeService, {
  VehiculeResponse, VehiculeIncidentResponse,
  VehiculeMaintenanceResponse, VehiculeAlertResponse,
  VehiculeAffectationResponse, printHistorique,
} from '../../services/vehiculeService';
import { buildHeader, getPrintConfig } from '../../services/globalprintservice';
import useAuth from '../../hooks/useAuth';
import VehiculeDocumentRenewalModal from './VehiculeDocumentRenewalModal';

const TYPE_ICONS: Record<string, string> = {
  VOITURE:'bi-car-front-fill', MOTO:'bi-bicycle', CAMION:'bi-truck',
  MINIBUS:'bi-bus-front-fill', AUTRE:'bi-vehicle-tractor',
};
const TypeBadge: React.FC<{ type: string }> = ({ type }) => (
  <span className="badge bg-primary bg-opacity-10 text-primary d-inline-flex align-items-center gap-1">
    <i className={`bi ${TYPE_ICONS[type] || 'bi-car-front-fill'}`} />{type}
  </span>
);
const STATUT_CONFIG: Record<string, { color: string; label: string }> = {
  DISPONIBLE:     { color:'success',   label:'Disponible'     },
  EN_MISSION:     { color:'primary',   label:'En mission'     },
  EN_PANNE:       { color:'danger',    label:'En panne'       },
  EN_MAINTENANCE: { color:'warning',   label:'En maintenance' },
  RETIRE:         { color:'secondary', label:'Retiré'         },
  REMIS:          { color:'info',      label:'Remis'          },
};
const StatutBadge: React.FC<{ statut: string }> = ({ statut }) => {
  const c = STATUT_CONFIG[statut] || { color:'secondary', label:statut };
  return <span className={`badge bg-${c.color} bg-opacity-10 text-${c.color}`}>{c.label}</span>;
};
const AlertBadge: React.FC<{ vehicule: VehiculeResponse }> = ({ vehicule }) => {
  const alerts: string[] = [];
  if (vehicule.assuranceExpiree)                                                alerts.push('Assurance expirée');
  if (vehicule.assuranceBientotExpiree    && !vehicule.assuranceExpiree)        alerts.push('Assurance bientôt');
  if (vehicule.visiteTechniqueExpiree)                                          alerts.push('Visite expirée');
  if (vehicule.visiteTechniqueBientotExpiree && !vehicule.visiteTechniqueExpiree) alerts.push('Visite bientôt');
  if (vehicule.vignetteExpiree)                                                 alerts.push('Vignette expirée');
  if (vehicule.vignetteBientotExpiree     && !vehicule.vignetteExpiree)         alerts.push('Vignette bientôt');
  if (!alerts.length)
    return <span className="text-success small"><i className="bi bi-check-circle-fill me-1" />OK</span>;
  return <div>{alerts.map(a => (
    <span key={a} className="badge bg-danger bg-opacity-10 text-danger d-block mb-1" style={{ fontSize:'10px' }}>
      <i className="bi bi-exclamation-triangle-fill me-1" />{a}
    </span>
  ))}</div>;
};

type Tab = 'vehicules' | 'affectations' | 'incidents' | 'maintenances' | 'alertes';

const VehiculesPage: React.FC = () => {
  const { person } = useAuth();
  const role        = person?.role;
  const canCreate   = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'LOGISTICIEN';
  const canEdit     = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'LOGISTICIEN';
  const canDelete   = role === 'SUPER_ADMIN' || role === 'ADMIN';
  const canIncident = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'TECHNICIEN' || role === 'LOGISTICIEN';

  const [activeTab,        setActiveTab]        = useState<Tab>('vehicules');
  const [isPrinting,       setIsPrinting]       = useState(false);
  const [printLoadingId,   setPrintLoadingId]   = useState<number | null>(null);
  const [pdfLoadingId,     setPdfLoadingId]     = useState<number | null>(null);
  const [activeEnginType,  setActiveEnginType]  = useState<string | undefined>(undefined);

  // Véhicules
  const [vehicules,        setVehicules]        = useState<VehiculeResponse[]>([]);
  const [totalPages,       setTotalPages]       = useState(0);
  const [totalElements,    setTotalElements]    = useState(0);
  const [page,             setPage]             = useState(0);
  const [keyword,          setKeyword]          = useState('');
  const [isLoading,        setIsLoading]        = useState(false);
  const [showForm,         setShowForm]         = useState(false);
  const [showUpdate,       setShowUpdate]       = useState(false);
  const [showConfirm,      setShowConfirm]      = useState(false);
  const [selectedVehicule, setSelectedVehicule] = useState<VehiculeResponse | null>(null);
  const [selectedId,       setSelectedId]       = useState<number | null>(null);
  const [deleteLoading,    setDeleteLoading]    = useState(false);

  // Incidents
  const [incidents,           setIncidents]           = useState<VehiculeIncidentResponse[]>([]);
  const [incidentPages,       setIncidentPages]       = useState(0);
  const [incidentPage,        setIncidentPage]        = useState(0);
  const [incidentLoading,     setIncidentLoading]     = useState(false);
  const [showIncidentModal,   setShowIncidentModal]   = useState(false);
  const [selectedIncident,    setSelectedIncident]    = useState<VehiculeIncidentResponse | null>(null);
  const [showIncidentConfirm, setShowIncidentConfirm] = useState(false);
  const [incidentDeleteId,    setIncidentDeleteId]    = useState<number | null>(null);

  // Maintenances
  const [maintenances,           setMaintenances]           = useState<VehiculeMaintenanceResponse[]>([]);
  const [maintenancePages,       setMaintenancePages]       = useState(0);
  const [maintenancePage,        setMaintenancePage]        = useState(0);
  const [maintenanceLoading,     setMaintenanceLoading]     = useState(false);
  const [showMaintenanceModal,   setShowMaintenanceModal]   = useState(false);
  const [selectedMaintenance,    setSelectedMaintenance]    = useState<VehiculeMaintenanceResponse | null>(null);
  const [showMaintenanceConfirm, setShowMaintenanceConfirm] = useState(false);
  const [maintenanceDeleteId,    setMaintenanceDeleteId]    = useState<number | null>(null);

  // Alertes
  const [alertes,        setAlertes]        = useState<VehiculeAlertResponse[]>([]);
  const [alertesLoading, setAlertesLoading] = useState(false);

  // Affectations
  const [affectations,         setAffectations]         = useState<VehiculeAffectationResponse[]>([]);
  const [affectationPages,     setAffectationPages]     = useState(0);
  const [affectationPage,      setAffectationPage]      = useState(0);
  const [affectationLoading,   setAffectationLoading]   = useState(false);
  const [showAffectationModal, setShowAffectationModal] = useState(false);
  const [selectedAffectation,  setSelectedAffectation]  = useState<VehiculeAffectationResponse | null>(null);
  const [affectationVehicule,  setAffectationVehicule]  = useState<VehiculeResponse | null>(null);
  const [filterActif,          setFilterActif]          = useState<boolean | undefined>(undefined);

  // Renouvellement document
  const [showRenewalModal,  setShowRenewalModal]  = useState(false);
  const [renewalVehicule,   setRenewalVehicule]   = useState<VehiculeResponse | null>(null);

  // ── Loaders ─────────────────────────────────────────────────────────────────
  const loadVehicules = useCallback(async () => {
    setIsLoading(true);
    try {
      const d = await VehiculeService.getAll(page, 10, keyword || undefined);
      setVehicules(d.content); setTotalPages(d.page.totalPages); setTotalElements(d.page.totalElements);
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  }, [page, keyword]);

  const loadIncidents = useCallback(async () => {
    setIncidentLoading(true);
    try { const d = await VehiculeService.getIncidents(incidentPage, 10); setIncidents(d.content); setIncidentPages(d.page.totalPages); }
    catch (err) { console.error(err); } finally { setIncidentLoading(false); }
  }, [incidentPage]);

  const loadMaintenances = useCallback(async () => {
    setMaintenanceLoading(true);
    try { const d = await VehiculeService.getMaintenances(maintenancePage, 10); setMaintenances(d.content); setMaintenancePages(d.page.totalPages); }
    catch (err) { console.error(err); } finally { setMaintenanceLoading(false); }
  }, [maintenancePage]);

  const loadAlertes = useCallback(async () => {
    setAlertesLoading(true);
    try { setAlertes(await VehiculeService.getAlertes(30)); }
    catch (err) { console.error(err); } finally { setAlertesLoading(false); }
  }, []);

  const loadAffectations = useCallback(async () => {
    setAffectationLoading(true);
    try {
      const d = await VehiculeService.getAffectations(affectationPage, 10, undefined, filterActif);
      setAffectations(d.content); setAffectationPages(d.page.totalPages);
    } catch (err) { console.error(err); } finally { setAffectationLoading(false); }
  }, [affectationPage, filterActif]);

  useEffect(() => { loadVehicules(); loadAlertes(); }, [loadVehicules, loadAlertes]);
  useEffect(() => { if (activeTab === 'incidents')    loadIncidents();    }, [loadIncidents,    activeTab]);
  useEffect(() => { if (activeTab === 'maintenances') loadMaintenances(); }, [loadMaintenances, activeTab]);
  useEffect(() => { if (activeTab === 'alertes')      loadAlertes();      }, [loadAlertes,      activeTab]);
  useEffect(() => { if (activeTab === 'affectations') loadAffectations(); }, [loadAffectations, activeTab]);

  // const handleDeleteVehicule    = async () => { if (!selectedId) return; setDeleteLoading(true); try { await VehiculeService.delete(selectedId); loadVehicules(); } catch (e) { console.error(e); } finally { setDeleteLoading(false); setShowConfirm(false); setSelectedId(null); } };
  // const handleDeleteIncident    = async () => { if (!incidentDeleteId) return; try { await VehiculeService.deleteIncident(incidentDeleteId); loadIncidents(); } catch (e) { console.error(e); } finally { setShowIncidentConfirm(false); setIncidentDeleteId(null); } };
  // const handleDeleteMaintenance = async () => { if (!maintenanceDeleteId) return; try { await VehiculeService.deleteMaintenance(maintenanceDeleteId); loadMaintenances(); } catch (e) { console.error(e); } finally { setShowMaintenanceConfirm(false); setMaintenanceDeleteId(null); } };
const handleDeleteVehicule = async () => {
  if (!selectedId) return;
  setDeleteLoading(true);
  try {
    await VehiculeService.delete(selectedId);
    notify.success('Véhicule supprimé avec succès');
    loadVehicules();
  } catch (e) {
    notify.apiError(e, 'Erreur lors de la suppression du véhicule');
  } finally { setDeleteLoading(false); setShowConfirm(false); setSelectedId(null); }
};

const handleDeleteIncident = async () => {
  if (!incidentDeleteId) return;
  try {
    await VehiculeService.deleteIncident(incidentDeleteId);
    notify.success('Incident supprimé avec succès');
    loadIncidents();
  } catch (e) {
    notify.apiError(e, "Erreur lors de la suppression de l'incident");
  } finally { setShowIncidentConfirm(false); setIncidentDeleteId(null); }
};

const handleDeleteMaintenance = async () => {
  if (!maintenanceDeleteId) return;
  try {
    await VehiculeService.deleteMaintenance(maintenanceDeleteId);
    notify.success('Maintenance supprimée avec succès');
    loadMaintenances();
  } catch (e) {
    notify.apiError(e, 'Erreur lors de la suppression de la maintenance');
  } finally { setShowMaintenanceConfirm(false); setMaintenanceDeleteId(null); }
};










  const handlePrintHistorique = async (vehiculeId: number) => {
    setPrintLoadingId(vehiculeId);
    try { const h = await VehiculeService.getHistorique(vehiculeId); printHistorique(h); }
    catch (err) { console.error(err); alert("Erreur lors du chargement de l'historique"); }
    finally { setPrintLoadingId(null); }
  };

  // ✅ NOUVEAU — Télécharger/afficher la fiche PDF (QR code + archivage auto backend)
  const handleDownloadPdf = async (vehiculeId: number) => {
    setPdfLoadingId(vehiculeId);
    try {
      const blob = await VehiculeService.downloadPdf(vehiculeId);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la génération du PDF');
    } finally {
      setPdfLoadingId(null);
    }
  };

  // ── Helper alerte texte pour impression ──────────────────────────────────
  const getDocAlerts = (v: VehiculeResponse): string => {
    const alerts: string[] = [];
    if (v.assuranceExpiree)        alerts.push('Assurance expirée');
    if (v.visiteTechniqueExpiree)  alerts.push('Visite expirée');
    if (v.vignetteExpiree)         alerts.push('Vignette expirée');
    if (!alerts.length) return '<span style="color:#198754">✅ OK</span>';
    return alerts.map(a => `<span style="color:#dc3545;font-size:10px">⚠️ ${a}</span>`).join('<br/>');
  };

  // ── ✅ Impression onglet Véhicules ────────────────────────────────────────
  const handlePrintVehicules = async () => {
    setIsPrinting(true);
    try {
      const data = await VehiculeService.getAll(0, 1000, keyword || undefined);
      const all  = activeEnginType ? data.content.filter(v => v.type === activeEnginType) : data.content;
      const cfg    = getPrintConfig();
      const titre  = activeEnginType ? `Liste des véhicules — ${activeEnginType}` : 'Liste des véhicules';
      const header = buildHeader(titre, cfg);

      const rows = all.map((v, i) => `
        <tr>
          <td style="color:#6c757d;font-size:10px;">${i + 1}</td>
          <td style="font-weight:600;">${v.immatriculation}</td>
          <td><span style="background:#dbeafe;color:#1d4ed8;padding:1px 8px;border-radius:20px;font-size:10px;">${v.type}</span></td>
          <td style="font-size:10px;">${v.marque || '—'} ${v.modele || ''}</td>
          <td style="font-size:10px;">${v.regionName || '—'}${v.districtName ? ` / ${v.districtName}` : ''}</td>
          <td style="font-size:10px;">${v.conducteurActifNom || v.conducteurNom || '—'}</td>
          <td><span style="font-size:10px;font-weight:600;color:${
            v.statut === 'DISPONIBLE' ? '#198754' :
            v.statut === 'EN_PANNE'   ? '#dc3545' :
            v.statut === 'EN_MISSION' ? '#0d6efd' : '#6c757d'
          };">${STATUT_CONFIG[v.statut]?.label || v.statut}</span></td>
          <td style="font-size:10px;">${getDocAlerts(v)}</td>
        </tr>`).join('');

      const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
        <title>Véhicules — CATUSNIS</title>
        <style>@page{margin:1.5cm;size:A4 landscape}body{font-family:Arial,sans-serif;color:#333;margin:0}
        .total{font-size:12px;color:#6c757d;margin:8px 0 16px}table{width:100%;border-collapse:collapse}
        th{background:#f8f9fa;border:1px solid #dee2e6;padding:6px 8px;font-size:10px;text-align:left}
        td{border:1px solid #dee2e6;padding:6px 8px;font-size:11px}tr:nth-child(even){background:#f9f9f9}
        </style></head>
        <body>${header}
        <p class="total">${all.length} engin(s) enregistré(s)</p>
        <table><thead><tr>
          <th>#</th><th>Immatriculation</th><th>Type</th><th>Marque / Modèle</th>
          <th>Région / District</th><th>Conducteur</th><th>Statut</th><th>Documents</th>
        </tr></thead><tbody>${rows}</tbody></table>
        </body></html>`;
      const win = window.open('', '_blank', 'width=900,height=700');
      if (!win) { alert('Veuillez autoriser les popups pour imprimer.'); return; }
      win.document.write(html); win.document.close();
      win.onload = () => { win.focus(); win.print(); win.close(); };
    } catch (err) { console.error(err); }
    finally { setIsPrinting(false); }
  };

  // ── ✅ Impression onglet Affectations ────────────────────────────────────
  const handlePrintAffectations = async () => {
    setIsPrinting(true);
    try {
      const data = await VehiculeService.getAffectations(0, 1000, undefined, filterActif);
      const all  = data.content;
      const cfg    = getPrintConfig();
      const filtre = filterActif === true ? ' — Actives' : filterActif === false ? ' — Clôturées' : '';
      const header = buildHeader(`Affectations engins${filtre}`, cfg);

      const rows = all.map((a, i) => `
        <tr>
          <td style="font-weight:600;">${a.immatriculation}</td>
          <td style="font-size:10px;">${a.vehiculeType}</td>
          <td style="font-size:10px;font-weight:500;">${a.personNom || '—'}</td>
          <td style="font-size:10px;">${a.personPoste || '—'}</td>
          <td style="font-size:10px;">${a.regionName || '—'}${a.districtName ? ` / ${a.districtName}` : ''}</td>
          <td style="font-size:10px;">${new Date(a.dateAffectation).toLocaleDateString('fr-FR')}</td>
          <td style="font-size:10px;">${a.dateRetour ? new Date(a.dateRetour).toLocaleDateString('fr-FR') : '—'}</td>
          <td style="font-size:10px;">${a.motif || '—'}</td>
          <td style="font-size:10px;font-weight:600;color:${a.active ? '#198754' : '#6c757d'};">${a.active ? '✅ Active' : 'Clôturée'}</td>
        </tr>`).join('');

      const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
        <title>Affectations — CATUSNIS</title>
        <style>@page{margin:1.5cm;size:A4 landscape}body{font-family:Arial,sans-serif;color:#333;margin:0}
        .total{font-size:12px;color:#6c757d;margin:8px 0 16px}table{width:100%;border-collapse:collapse}
        th{background:#f8f9fa;border:1px solid #dee2e6;padding:6px 8px;font-size:10px;text-align:left}
        td{border:1px solid #dee2e6;padding:6px 8px;font-size:11px}tr:nth-child(even){background:#f9f9f9}
        </style></head>
        <body>${header}
        <p class="total">${all.length} affectation(s)</p>
        <table><thead><tr>
          <th>Engin</th><th>Type</th><th>Conducteur</th><th>Poste</th>
          <th>Région / District</th><th>Date affectation</th><th>Date retour</th><th>Motif</th><th>Statut</th>
        </tr></thead><tbody>${rows}</tbody></table>
        </body></html>`;
      const win = window.open('', '_blank', 'width=900,height=700');
      if (!win) { alert('Veuillez autoriser les popups pour imprimer.'); return; }
      win.document.write(html); win.document.close();
      win.onload = () => { win.focus(); win.print(); win.close(); };
    } catch (err) { console.error(err); }
    finally { setIsPrinting(false); }
  };

  // ── ✅ Impression onglet Incidents ───────────────────────────────────────
  const handlePrintIncidents = async () => {
    setIsPrinting(true);
    try {
      const data = await VehiculeService.getIncidents(0, 1000);
      const all  = data.content;
      const cfg    = getPrintConfig();
      const header = buildHeader('Incidents engins roulants', cfg);

      const rows = all.map((inc, i) => `
        <tr>
          <td style="color:#6c757d;font-size:10px;">${i + 1}</td>
          <td style="font-weight:600;">${inc.immatriculation}</td>
          <td style="font-size:10px;">${inc.vehiculeType}</td>
          <td style="font-size:10px;">${new Date(inc.dateIncident).toLocaleDateString('fr-FR')}</td>
          <td><span style="font-size:10px;font-weight:600;color:${inc.typeIncident === 'ACCIDENT' ? '#dc3545' : inc.typeIncident === 'VOL' ? '#333' : '#fd7e14'};">${inc.typeIncident}</span></td>
          <td style="font-size:10px;">${inc.lieuIncident || '—'}</td>
          <td style="font-size:10px;">${inc.signalePar || '—'}</td>
          <td style="font-size:10px;">${inc.coutEstime ? `${inc.coutEstime.toLocaleString()} FCFA` : '—'}</td>
          <td style="font-size:10px;font-weight:600;color:${inc.statut === 'RESOLU' ? '#198754' : inc.statut === 'EN_COURS' ? '#fd7e14' : '#dc3545'};">${inc.statut?.replace('_', ' ')}</td>
        </tr>`).join('');

      const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
        <title>Incidents — CATUSNIS</title>
        <style>@page{margin:1.5cm;size:A4 landscape}body{font-family:Arial,sans-serif;color:#333;margin:0}
        .total{font-size:12px;color:#6c757d;margin:8px 0 16px}table{width:100%;border-collapse:collapse}
        th{background:#f8f9fa;border:1px solid #dee2e6;padding:6px 8px;font-size:10px;text-align:left}
        td{border:1px solid #dee2e6;padding:6px 8px;font-size:11px}tr:nth-child(even){background:#f9f9f9}
        </style></head>
        <body>${header}
        <p class="total">${all.length} incident(s)</p>
        <table><thead><tr>
          <th>#</th><th>Engin</th><th>Type véhicule</th><th>Date</th><th>Type incident</th>
          <th>Lieu</th><th>Signalé par</th><th>Coût estimé</th><th>Statut</th>
        </tr></thead><tbody>${rows}</tbody></table>
        </body></html>`;
      const win = window.open('', '_blank', 'width=900,height=700');
      if (!win) { alert('Veuillez autoriser les popups pour imprimer.'); return; }
      win.document.write(html); win.document.close();
      win.onload = () => { win.focus(); win.print(); win.close(); };
    } catch (err) { console.error(err); }
    finally { setIsPrinting(false); }
  };

  // ── ✅ Impression onglet Maintenances ────────────────────────────────────
  const handlePrintMaintenances = async () => {
    setIsPrinting(true);
    try {
      const data = await VehiculeService.getMaintenances(0, 1000);
      const all  = data.content;
      const cfg    = getPrintConfig();
      const header = buildHeader('Maintenances engins roulants', cfg);

      const rows = all.map((m, i) => `
        <tr>
          <td style="color:#6c757d;font-size:10px;">${i + 1}</td>
          <td style="font-weight:600;">${m.immatriculation}</td>
          <td style="font-size:10px;">${new Date(m.dateMaintenance).toLocaleDateString('fr-FR')}</td>
          <td><span style="font-size:10px;font-weight:600;color:${m.typeMaintenance === 'PREVENTIVE' ? '#198754' : '#dc3545'};">${m.typeMaintenance}</span></td>
          <td style="font-size:10px;">${m.prestataire || '—'}</td>
          <td style="font-size:10px;">${m.coutReel ? `${m.coutReel.toLocaleString()} FCFA` : '—'}</td>
          <td style="font-size:10px;">${m.kilometrageIntervention ? `${m.kilometrageIntervention.toLocaleString()} km` : '—'}</td>
          <td style="font-size:10px;font-weight:600;color:${m.statut === 'TERMINEE' ? '#198754' : m.statut === 'EN_COURS' ? '#fd7e14' : '#6c757d'};">${m.statut?.replace('_', ' ')}</td>
        </tr>`).join('');

      const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
        <title>Maintenances — CATUSNIS</title>
        <style>@page{margin:1.5cm;size:A4 landscape}body{font-family:Arial,sans-serif;color:#333;margin:0}
        .total{font-size:12px;color:#6c757d;margin:8px 0 16px}table{width:100%;border-collapse:collapse}
        th{background:#f8f9fa;border:1px solid #dee2e6;padding:6px 8px;font-size:10px;text-align:left}
        td{border:1px solid #dee2e6;padding:6px 8px;font-size:11px}tr:nth-child(even){background:#f9f9f9}
        </style></head>
        <body>${header}
        <p class="total">${all.length} maintenance(s)</p>
        <table><thead><tr>
          <th>#</th><th>Engin</th><th>Date</th><th>Type</th>
          <th>Prestataire</th><th>Coût réel</th><th>Kilométrage</th><th>Statut</th>
        </tr></thead><tbody>${rows}</tbody></table>
        </body></html>`;
      const win = window.open('', '_blank', 'width=900,height=700');
      if (!win) { alert('Veuillez autoriser les popups pour imprimer.'); return; }
      win.document.write(html); win.document.close();
      win.onload = () => { win.focus(); win.print(); win.close(); };
    } catch (err) { console.error(err); }
    finally { setIsPrinting(false); }
  };

  // ── ✅ Impression onglet Alertes ─────────────────────────────────────────
  const handlePrintAlertes = () => {
    const cfg    = getPrintConfig();
    const header = buildHeader('Alertes documents engins roulants', cfg);

    const rows = alertes.map((a, i) => `
      <tr style="background:${a.niveau === 'EXPIRE' ? '#fff5f5' : i % 2 === 0 ? 'white' : '#f9f9f9'}">
        <td style="font-weight:600;">${a.immatriculation}</td>
        <td style="font-size:10px;">${a.vehiculeType}</td>
        <td><span style="background:#dbeafe;color:#1d4ed8;padding:1px 8px;border-radius:20px;font-size:10px;">${a.typeAlerte.replace('_', ' ')}</span></td>
        <td style="font-size:10px;">${new Date(a.dateExpiration).toLocaleDateString('fr-FR')}</td>
        <td style="font-size:10px;font-weight:600;color:${a.joursRestants <= 0 ? '#dc3545' : '#fd7e14'};">
          ${a.joursRestants <= 0 ? `Expiré depuis ${Math.abs(a.joursRestants)} j` : `${a.joursRestants} j`}
        </td>
        <td style="font-size:10px;font-weight:bold;color:${a.niveau === 'EXPIRE' ? '#dc3545' : '#fd7e14'};">
          ${a.niveau === 'EXPIRE' ? '🔴 EXPIRÉ' : '🟠 BIENTÔT'}
        </td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
      <title>Alertes — CATUSNIS</title>
      <style>@page{margin:1.5cm;size:A4 portrait}body{font-family:Arial,sans-serif;color:#333;margin:0}
      .total{font-size:12px;color:#6c757d;margin:8px 0 16px}table{width:100%;border-collapse:collapse}
      th{background:#f8f9fa;border:1px solid #dee2e6;padding:6px 8px;font-size:10px;text-align:left}
      td{border:1px solid #dee2e6;padding:6px 8px;font-size:11px}
      </style></head>
      <body>${header}
      <p class="total">${alertes.length} alerte(s) — ${alertes.filter(a => a.niveau === 'EXPIRE').length} expirée(s)</p>
      <table><thead><tr>
        <th>Engin</th><th>Type véhicule</th><th>Document</th>
        <th>Date expiration</th><th>Jours restants</th><th>Niveau</th>
      </tr></thead><tbody>${rows}</tbody></table>
      </body></html>`;
    const win = window.open('', '_blank', 'width=800,height=700');
    if (!win) { alert('Veuillez autoriser les popups pour imprimer.'); return; }
    win.document.write(html); win.document.close();
    win.onload = () => { win.focus(); win.print(); win.close(); };
  };

  const expireCount = alertes.filter(a => a.niveau === 'EXPIRE').length;

  const statsStatuts = [
    { label:'Total',        value:totalElements,                                             icon:'bi-car-front-fill',           color:'primary'  },
    { label:'Disponibles',  value:vehicules.filter(v=>v.statut==='DISPONIBLE').length,       icon:'bi-check-circle-fill',         color:'success'  },
    { label:'En mission',   value:vehicules.filter(v=>v.statut==='EN_MISSION').length,       icon:'bi-geo-alt-fill',              color:'info'     },
    { label:'En panne',     value:vehicules.filter(v=>v.statut==='EN_PANNE').length,         icon:'bi-exclamation-triangle-fill', color:'danger'   },
    { label:'Alertes docs', value:alertes.length, icon:'bi-bell-fill', color:alertes.length>0?'warning':'secondary' },
  ];

  const statsParType = [
    { key:'VOITURE', label:'Voitures', icon:'bi-car-front-fill',  color:'primary'   },
    { key:'MOTO',    label:'Motos',    icon:'bi-bicycle',         color:'success'   },
    { key:'CAMION',  label:'Camions',  icon:'bi-truck',           color:'warning'   },
    { key:'MINIBUS', label:'Minibus',  icon:'bi-bus-front-fill',  color:'info'      },
    { key:'AUTRE',   label:'Autres',   icon:'bi-vehicle-tractor', color:'secondary' },
  ];

  const vehiculesFiltres = activeEnginType ? vehicules.filter(v => v.type === activeEnginType) : vehicules;

  // ── Bouton imprimer selon onglet actif ───────────────────────────────────
  const PrintBtn = () => {
    const handlers: Record<Tab, () => void> = {
      vehicules:    handlePrintVehicules,
      affectations: handlePrintAffectations,
      incidents:    handlePrintIncidents,
      maintenances: handlePrintMaintenances,
      alertes:      handlePrintAlertes,
    };
    return (
      <button
        className="btn btn-outline-secondary d-flex align-items-center gap-2"
        onClick={handlers[activeTab]}
        disabled={isPrinting}
        title="Imprimer">
        {isPrinting
          ? <><span className="spinner-border spinner-border-sm" role="status" />Chargement...</>
          : <><i className="bi bi-printer" />Imprimer</>}
      </button>
    );
  };

  return (
    <MainLayout title="Parc — Engins roulants">
      {/* ── Header ── */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="fw-bold mb-0"><i className="bi bi-car-front-fill text-success me-2" />Parc logistique — Engins roulants</h5>
          <small className="text-muted">{totalElements} engin(s) enregistré(s)</small>
        </div>
        <div className="d-flex gap-2 align-items-center">
          {/* ✅ Bouton imprimer unique adapté à l'onglet actif */}
          <PrintBtn />
          {activeTab==='vehicules'    && canCreate   && <button className="btn btn-success d-flex align-items-center gap-2" onClick={()=>setShowForm(true)}><i className="bi bi-plus-circle-fill" />Nouvel engin</button>}
          {activeTab==='incidents'    && canIncident && <button className="btn btn-danger d-flex align-items-center gap-2" onClick={()=>{setSelectedIncident(null);setShowIncidentModal(true);}}><i className="bi bi-plus-circle-fill" />Signaler incident</button>}
          {activeTab==='maintenances' && canIncident && <button className="btn btn-primary d-flex align-items-center gap-2" onClick={()=>{setSelectedMaintenance(null);setShowMaintenanceModal(true);}}><i className="bi bi-plus-circle-fill" />Planifier maintenance</button>}
          {activeTab==='affectations' && canCreate   && <button className="btn btn-primary d-flex align-items-center gap-2" onClick={()=>{setSelectedAffectation(null);setAffectationVehicule(vehicules[0]||null);setShowAffectationModal(true);}}><i className="bi bi-person-fill-check me-1" />Nouvelle affectation</button>}
        </div>
      </div>

      {/* ── Stats statuts ── */}
      <div className="row g-3 mb-3">
        {statsStatuts.map((s, i) => (
          <div key={i} className="col-6 col-md">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-3 d-flex align-items-center gap-3">
                <div className={`rounded-3 bg-${s.color} bg-opacity-10 d-flex align-items-center justify-content-center`} style={{width:'44px',height:'44px',minWidth:'44px'}}>
                  <i className={`bi ${s.icon} text-${s.color}`} />
                </div>
                <div>
                  <p className="mb-0 text-muted small">{s.label}</p>
                  <h5 className="fw-bold mb-0">{s.value}</h5>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Stats par type d'engins (cliquables) ── */}
      <div className="row g-3 mb-4">
        {statsParType.map((s, i) => {
          const count    = vehicules.filter(v => v.type === s.key).length;
          const isActive = activeEnginType === s.key;
          return (
            <div key={i} className="col-6 col-md">
              <div
                className={`card rounded-4 h-100 ${isActive ? `bg-${s.color} shadow` : 'border-0 shadow-sm'}`}
                style={{ cursor:'pointer', transition:'all 0.15s', border: isActive ? 'none' : '1px solid rgba(0,0,0,0.06)' }}
                onClick={() => { setActiveEnginType(isActive ? undefined : s.key); setActiveTab('vehicules'); setPage(0); }}>
                <div className="card-body p-2 d-flex align-items-center gap-2">
                  <div className={`rounded-3 d-flex align-items-center justify-content-center ${isActive ? 'bg-white bg-opacity-25' : `bg-${s.color} bg-opacity-10`}`} style={{width:'36px',height:'36px',minWidth:'36px'}}>
                    <i className={`bi ${s.icon} ${isActive ? 'text-white' : `text-${s.color}`} small`} />
                  </div>
                  <div className="flex-grow-1">
                    <p className="mb-0 small" style={{fontSize:'11px', color: isActive ? 'rgba(255,255,255,0.8)' : '#6c757d'}}>{s.label}</p>
                    <span className={`fw-bold ${isActive ? 'text-white' : `text-${s.color}`}`}>{count}</span>
                  </div>
                  {isActive && <i className="bi bi-check-circle-fill text-white small" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Onglets ── */}
      <ul className="nav nav-tabs mb-4">
        {([
          { key:'vehicules',    label:'Engins',       icon:'bi-car-front-fill'           },
          { key:'affectations', label:'Affectations', icon:'bi-person-fill-check'         },
          { key:'incidents',    label:'Incidents',    icon:'bi-exclamation-triangle-fill' },
          { key:'maintenances', label:'Maintenances', icon:'bi-tools'                     },
          { key:'alertes',      label:`Alertes${alertes.length>0?` (${alertes.length})`:''}`, icon:'bi-bell-fill' },
        ] as {key:Tab;label:string;icon:string}[]).map(tab => (
          <li key={tab.key} className="nav-item">
            <button className={`nav-link d-flex align-items-center gap-2 ${activeTab===tab.key?'active fw-bold':''}`} onClick={()=>setActiveTab(tab.key)}>
              <i className={`bi ${tab.icon} ${tab.key==='alertes'&&expireCount>0?'text-danger':''}`} />
              {tab.label}
              {tab.key==='alertes' && expireCount>0 && <span className="badge bg-danger rounded-pill">{expireCount}</span>}
            </button>
          </li>
        ))}
      </ul>

      {/* ══ TAB Engins ══ */}
      {activeTab === 'vehicules' && (
        <>
          <div className="card border-0 shadow-sm rounded-4 mb-3">
            <div className="card-body p-3">
              <div className="d-flex gap-3 align-items-center">
                <div className="input-group flex-grow-1">
                  <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted" /></span>
                  <input type="text" className="form-control border-start-0"
                    placeholder="Rechercher par immatriculation, marque, modèle..."
                    value={keyword} onChange={e => { setKeyword(e.target.value); setPage(0); }} />
                </div>
                {activeEnginType && (
                  <span className={`badge d-inline-flex align-items-center gap-2 px-3 py-2 bg-${statsParType.find(s=>s.key===activeEnginType)?.color || 'primary'}`} style={{fontSize:'13px'}}>
                    <i className={`bi ${TYPE_ICONS[activeEnginType]}`} />
                    {activeEnginType}
                    <span className="ms-1" style={{fontSize:'11px',opacity:0.8}}>({vehiculesFiltres.length})</span>
                    <button className="btn-close btn-close-white ms-1" style={{fontSize:'10px'}} onClick={()=>setActiveEnginType(undefined)} />
                  </span>
                )}
              </div>
            </div>
          </div>

          <div id="vehicules-table" className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-0">
              {isLoading ? <div className="text-center py-5"><div className="spinner-border text-success" /></div>
              : vehiculesFiltres.length===0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-car-front fs-1 d-block mb-2" />
                  {activeEnginType ? `Aucun engin de type ${activeEnginType}` : 'Aucun engin enregistré'}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr><th>#</th><th>Immatriculation</th><th>Type</th><th>Marque / Modèle</th><th>Région / District</th><th>Conducteur</th><th>Statut</th><th>Documents</th><th className="text-end no-print">Actions</th></tr>
                    </thead>
                    <tbody>
                      {vehiculesFiltres.map((v, i) => (
                        <tr key={v.id}>
                          <td className="text-muted small">{page*10+i+1}</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center" style={{width:'36px',height:'36px',minWidth:'36px'}}>
                                <i className={`bi ${TYPE_ICONS[v.type]||'bi-car-front-fill'} text-success`} />
                              </div>
                              <span className="fw-semibold">{v.immatriculation}</span>
                            </div>
                          </td>
                          <td><TypeBadge type={v.type} /></td>
                          <td><span className="fw-semibold small">{v.marque||'—'}</span>{v.modele&&<span className="text-muted small ms-1">{v.modele}</span>}</td>
                          <td>{v.regionName?<><span className="badge bg-info bg-opacity-10 text-info">{v.regionName}</span>{v.districtName&&<span className="badge bg-secondary bg-opacity-10 text-secondary ms-1">{v.districtName}</span>}</>:<span className="text-muted small">—</span>}</td>
                          <td className="small">{v.conducteurActifNom || v.conducteurNom || <span className="text-muted">—</span>}</td>
                          <td><StatutBadge statut={v.statut} /></td>
                          <td>
                            <AlertBadge vehicule={v} />
                            {(v.assuranceExpiree || v.visiteTechniqueExpiree || v.vignetteExpiree ||
                              v.assuranceBientotExpiree || v.visiteTechniqueBientotExpiree || v.vignetteBientotExpiree) && canEdit && (
                              <button className="btn btn-sm btn-outline-warning mt-1 d-block" style={{fontSize:'10px'}}
                                onClick={() => { setRenewalVehicule(v); setShowRenewalModal(true); }}
                                title="Renouveler un document">
                                <i className="bi bi-arrow-clockwise me-1" />Renouveler
                              </button>
                            )}
                          </td>
                          <td className="text-end no-print">
                            <button
                              className="btn btn-sm btn-outline-success me-1"
                              onClick={() => handleDownloadPdf(v.id)}
                              disabled={pdfLoadingId === v.id}
                              title="Générer la fiche PDF (QR code)">
                              {pdfLoadingId === v.id
                                ? <span className="spinner-border spinner-border-sm" />
                                : <i className="bi bi-file-earmark-pdf" />}
                            </button>
                            <button className="btn btn-sm btn-outline-secondary me-1" onClick={()=>handlePrintHistorique(v.id)} disabled={printLoadingId===v.id} title="Historique complet">
                              {printLoadingId===v.id?<span className="spinner-border spinner-border-sm"/>:<i className="bi bi-file-earmark-text"/>}
                            </button>
                            {canCreate && <button className="btn btn-sm btn-outline-success me-1" onClick={()=>{setAffectationVehicule(v);setSelectedAffectation(null);setShowAffectationModal(true);}} title="Affecter conducteur"><i className="bi bi-person-fill-check"/></button>}
                            {canEdit   && <button className="btn btn-sm btn-outline-warning me-1" onClick={()=>{setSelectedVehicule(v);setShowUpdate(true);}} title="Modifier"><i className="bi bi-pencil"/></button>}
                            {canDelete && <button className="btn btn-sm btn-outline-danger" onClick={()=>{setSelectedId(v.id);setShowConfirm(true);}} title="Supprimer"><i className="bi bi-trash"/></button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}

      {/* ══ TAB Affectations ══ */}
      {activeTab === 'affectations' && (
        <>
          <div className="d-flex gap-2 mb-3">
            {([{label:'Toutes',value:undefined},{label:'Actives',value:true},{label:'Clôturées',value:false}] as {label:string;value:boolean|undefined}[]).map(f=>(
              <button key={String(f.value)} type="button"
                className={`btn btn-sm ${filterActif===f.value?'btn-primary':'btn-outline-primary'}`}
                onClick={()=>{setFilterActif(f.value);setAffectationPage(0);}}>
                {f.label}
              </button>
            ))}
          </div>
          <div id="affectations-table" className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-0">
              {affectationLoading?<div className="text-center py-5"><div className="spinner-border text-primary"/></div>
              :affectations.length===0?<div className="text-center py-5 text-muted"><i className="bi bi-person-fill-check fs-1 d-block mb-2"/>Aucune affectation</div>
              :(
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr><th>Engin</th><th>Conducteur</th><th>Poste</th><th>Région / District</th><th>Date aff.</th><th>Date retour</th><th>Motif</th><th>Statut</th><th className="text-end no-print">Actions</th></tr>
                    </thead>
                    <tbody>
                      {affectations.map(aff=>(
                        <tr key={aff.id} className={aff.active?'':'opacity-50'}>
                          <td><span className="fw-semibold">{aff.immatriculation}</span><span className="badge bg-secondary bg-opacity-10 text-secondary ms-1">{aff.vehiculeType}</span></td>
                          <td className="fw-semibold small">{aff.personNom}</td>
                          <td><small className="text-muted">{aff.personPoste||'—'}</small></td>
                          <td>{aff.regionName?<><span className="badge bg-info bg-opacity-10 text-info">{aff.regionName}</span>{aff.districtName&&<span className="badge bg-secondary bg-opacity-10 text-secondary ms-1">{aff.districtName}</span>}</>:<span className="text-muted small">—</span>}</td>
                          <td className="small">{new Date(aff.dateAffectation).toLocaleDateString('fr-FR')}</td>
                          <td className="small">{aff.dateRetour?new Date(aff.dateRetour).toLocaleDateString('fr-FR'):'—'}</td>
                          <td><small className="text-muted">{aff.motif||'—'}</small></td>
                          <td>{aff.active?<span className="badge bg-success bg-opacity-10 text-success"><i className="bi bi-check-circle me-1"/>Active</span>:<span className="badge bg-secondary bg-opacity-10 text-secondary"><i className="bi bi-clock-history me-1"/>Clôturée</span>}</td>
                          <td className="text-end no-print">
                            <button className="btn btn-sm btn-outline-secondary me-1" onClick={()=>handlePrintHistorique(aff.vehiculeId)} disabled={printLoadingId===aff.vehiculeId} title="Historique complet">
                              {printLoadingId===aff.vehiculeId?<span className="spinner-border spinner-border-sm"/>:<i className="bi bi-file-earmark-text"/>}
                            </button>
                            {canCreate && aff.active && <>
                              <button className="btn btn-sm btn-outline-primary me-1" title="Réaffecter" onClick={()=>{const v=vehicules.find(v=>v.id===aff.vehiculeId)||null;setAffectationVehicule(v);setSelectedAffectation(null);setShowAffectationModal(true);}}><i className="bi bi-arrow-repeat"/></button>
                              <button className="btn btn-sm btn-outline-warning" title="Modifier" onClick={()=>{const v=vehicules.find(v=>v.id===aff.vehiculeId)||null;setAffectationVehicule(v);setSelectedAffectation(aff);setShowAffectationModal(true);}}><i className="bi bi-pencil"/></button>
                            </>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <Pagination page={affectationPage} totalPages={affectationPages} onPageChange={setAffectationPage}/>
          </div>
        </>
      )}

      {/* ══ TAB Incidents ══ */}
      {activeTab === 'incidents' && (
        <div id="incidents-table" className="card border-0 shadow-sm rounded-4">
          <div className="card-body p-0">
            {incidentLoading?<div className="text-center py-5"><div className="spinner-border text-danger"/></div>
            :incidents.length===0?<div className="text-center py-5 text-muted"><i className="bi bi-exclamation-triangle fs-1 d-block mb-2"/>Aucun incident</div>
            :(
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr><th>#</th><th>Engin</th><th>Date</th><th>Type</th><th>Lieu</th><th>Signalé par</th><th>Coût estimé</th><th>Statut</th><th>Description</th><th className="text-end no-print">Actions</th></tr>
                  </thead>
                  <tbody>
                    {incidents.map((inc,i)=>(
                      <tr key={inc.id}>
                        <td className="text-muted small">{incidentPage*10+i+1}</td>
                        <td><span className="fw-semibold">{inc.immatriculation}</span><span className="badge bg-secondary bg-opacity-10 text-secondary ms-1">{inc.vehiculeType}</span></td>
                        <td className="small">{new Date(inc.dateIncident).toLocaleDateString('fr-FR')}</td>
                        <td><span className={`badge ${inc.typeIncident==='ACCIDENT'?'bg-danger bg-opacity-10 text-danger':inc.typeIncident==='VOL'?'bg-dark bg-opacity-10 text-dark':'bg-warning bg-opacity-10 text-warning'}`}>{inc.typeIncident}</span></td>
                        <td className="small">{inc.lieuIncident||'—'}</td>
                        <td className="small">{inc.signalePar||'—'}</td>
                        <td className="small">{inc.coutEstime?`${inc.coutEstime.toLocaleString()} FCFA`:'—'}</td>
                        <td><span className={`badge ${inc.statut==='RESOLU'?'bg-success bg-opacity-10 text-success':inc.statut==='EN_COURS'?'bg-warning bg-opacity-10 text-warning':'bg-danger bg-opacity-10 text-danger'}`}>{inc.statut?.replace('_',' ')}</span></td>
                        <td style={{maxWidth:'150px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}><span className="small text-muted" title={inc.description}>{inc.description}</span></td>
                        <td className="text-end no-print">
                          <button className="btn btn-sm btn-outline-secondary me-1" onClick={()=>handlePrintHistorique(inc.vehiculeId)} disabled={printLoadingId===inc.vehiculeId} title="Historique complet">
                            {printLoadingId===inc.vehiculeId?<span className="spinner-border spinner-border-sm"/>:<i className="bi bi-file-earmark-text"/>}
                          </button>
                          {canIncident && <button className="btn btn-sm btn-outline-warning me-1" onClick={()=>{setSelectedIncident(inc);setShowIncidentModal(true);}}><i className="bi bi-pencil"/></button>}
                          {canDelete   && <button className="btn btn-sm btn-outline-danger" onClick={()=>{setIncidentDeleteId(inc.id);setShowIncidentConfirm(true);}}><i className="bi bi-trash"/></button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <Pagination page={incidentPage} totalPages={incidentPages} onPageChange={setIncidentPage}/>
        </div>
      )}

      {/* ══ TAB Maintenances ══ */}
      {activeTab === 'maintenances' && (
        <div id="maintenances-table" className="card border-0 shadow-sm rounded-4">
          <div className="card-body p-0">
            {maintenanceLoading?<div className="text-center py-5"><div className="spinner-border text-success"/></div>
            :maintenances.length===0?<div className="text-center py-5 text-muted"><i className="bi bi-tools fs-1 d-block mb-2"/>Aucune maintenance</div>
            :(
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr><th>#</th><th>Engin</th><th>Date</th><th>Type</th><th>Prestataire</th><th>Coût réel</th><th>Kilométrage</th><th>Statut</th><th>Description</th><th className="text-end no-print">Actions</th></tr>
                  </thead>
                  <tbody>
                    {maintenances.map((m,i)=>(
                      <tr key={m.id}>
                        <td className="text-muted small">{maintenancePage*10+i+1}</td>
                        <td><span className="fw-semibold">{m.immatriculation}</span></td>
                        <td className="small">{new Date(m.dateMaintenance).toLocaleDateString('fr-FR')}</td>
                        <td><span className={`badge ${m.typeMaintenance==='PREVENTIVE'?'bg-success bg-opacity-10 text-success':'bg-danger bg-opacity-10 text-danger'}`}>{m.typeMaintenance}</span></td>
                        <td className="small">{m.prestataire||'—'}</td>
                        <td className="small">{m.coutReel?`${m.coutReel.toLocaleString()} FCFA`:'—'}</td>
                        <td className="small">{m.kilometrageIntervention?`${m.kilometrageIntervention.toLocaleString()} km`:'—'}</td>
                        <td><span className={`badge ${m.statut==='TERMINEE'?'bg-success bg-opacity-10 text-success':m.statut==='EN_COURS'?'bg-warning bg-opacity-10 text-warning':'bg-secondary bg-opacity-10 text-secondary'}`}>{m.statut?.replace('_',' ')}</span></td>
                        <td style={{maxWidth:'150px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}><span className="small text-muted" title={m.description}>{m.description}</span></td>
                        <td className="text-end no-print">
                          <button className="btn btn-sm btn-outline-secondary me-1" onClick={()=>handlePrintHistorique(m.vehiculeId)} disabled={printLoadingId===m.vehiculeId} title="Historique complet">
                            {printLoadingId===m.vehiculeId?<span className="spinner-border spinner-border-sm"/>:<i className="bi bi-file-earmark-text"/>}
                          </button>
                          {canIncident && <button className="btn btn-sm btn-outline-warning me-1" onClick={()=>{setSelectedMaintenance(m);setShowMaintenanceModal(true);}}><i className="bi bi-pencil"/></button>}
                          {canDelete   && <button className="btn btn-sm btn-outline-danger" onClick={()=>{setMaintenanceDeleteId(m.id);setShowMaintenanceConfirm(true);}}><i className="bi bi-trash"/></button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <Pagination page={maintenancePage} totalPages={maintenancePages} onPageChange={setMaintenancePage}/>
        </div>
      )}

      {/* ══ TAB Alertes ══ */}
      {activeTab === 'alertes' && (
        <div id="alertes-table" className="card border-0 shadow-sm rounded-4">
          <div className="card-body">
            {alertesLoading?<div className="text-center py-5"><div className="spinner-border text-warning"/></div>
            :alertes.length===0?(
              <div className="text-center py-5">
                <i className="bi bi-shield-check text-success fs-1 d-block mb-2"/>
                <p className="text-success fw-semibold">Tous les documents sont à jour ✅</p>
              </div>
            ):(
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr><th>Engin</th><th>Type</th><th>Document</th><th>Date expiration</th><th>Jours restants</th><th>Niveau</th><th className="text-end no-print">Historique</th></tr>
                  </thead>
                  <tbody>
                    {alertes.map((a,i)=>(
                      <tr key={i} className={a.niveau==='EXPIRE'?'table-danger':'table-warning'}>
                        <td><span className="fw-semibold">{a.immatriculation}</span><span className="badge bg-secondary bg-opacity-10 text-secondary ms-2">{a.vehiculeType}</span></td>
                        <td><TypeBadge type={a.vehiculeType}/></td>
                        <td><span className="badge bg-primary bg-opacity-10 text-primary">{a.typeAlerte.replace('_',' ')}</span></td>
                        <td className="small">{new Date(a.dateExpiration).toLocaleDateString('fr-FR')}</td>
                        <td><span className={`fw-bold ${a.joursRestants<=0?'text-danger':'text-warning'}`}>{a.joursRestants<=0?`Expiré depuis ${Math.abs(a.joursRestants)} j`:`${a.joursRestants} j`}</span></td>
                        <td><span className={`badge ${a.niveau==='EXPIRE'?'bg-danger text-white':'bg-warning text-dark'}`}><i className={`bi ${a.niveau==='EXPIRE'?'bi-x-circle-fill':'bi-exclamation-triangle-fill'} me-1`}/>{a.niveau==='EXPIRE'?'EXPIRÉ':'BIENTÔT'}</span></td>
                        <td className="text-end no-print">
                          <button className="btn btn-sm btn-outline-secondary" onClick={()=>handlePrintHistorique(a.id)} disabled={printLoadingId===a.id} title="Historique complet">
                            {printLoadingId===a.id?<span className="spinner-border spinner-border-sm"/>:<i className="bi bi-file-earmark-text"/>}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      <VehiculeDocumentRenewalModal
        show={showRenewalModal}
        onHide={() => { setShowRenewalModal(false); setRenewalVehicule(null); }}
        onSuccess={() => { loadVehicules(); loadAlertes(); }}
        vehiculeId={renewalVehicule?.id || 0}
        immatriculation={renewalVehicule?.immatriculation || ''}
        dateFinAssurance={renewalVehicule?.dateFinAssurance}
        dateFinVisiteTechnique={renewalVehicule?.dateFinVisiteTechnique}
        dateFinVignette={renewalVehicule?.dateFinVignette}
      />
      <VehiculeFormModal show={showForm} onHide={()=>setShowForm(false)} onSuccess={loadVehicules}/>
      <VehiculeFormModal show={showUpdate} vehicule={selectedVehicule} onHide={()=>{setShowUpdate(false);setSelectedVehicule(null);}} onSuccess={loadVehicules}/>
      <VehiculeIncidentModal show={showIncidentModal} incident={selectedIncident} vehicules={vehicules} onHide={()=>{setShowIncidentModal(false);setSelectedIncident(null);}} onSuccess={loadIncidents}/>
      <VehiculeMaintenanceModal show={showMaintenanceModal} maintenance={selectedMaintenance} vehicules={vehicules} onHide={()=>{setShowMaintenanceModal(false);setSelectedMaintenance(null);}} onSuccess={loadMaintenances}/>
      <VehiculeAffectationModal show={showAffectationModal} vehicule={affectationVehicule} affectation={selectedAffectation} onHide={()=>{setShowAffectationModal(false);setSelectedAffectation(null);setAffectationVehicule(null);}} onSuccess={()=>{loadAffectations();loadVehicules();}}/>
      <ConfirmModal show={showConfirm}           title="Supprimer l'engin"        message="Êtes-vous sûr de vouloir supprimer cet engin ?"  onConfirm={handleDeleteVehicule}    onCancel={()=>setShowConfirm(false)}           isLoading={deleteLoading}/>
      <ConfirmModal show={showIncidentConfirm}    title="Supprimer l'incident"     message="Êtes-vous sûr ?"                                 onConfirm={handleDeleteIncident}    onCancel={()=>setShowIncidentConfirm(false)}    isLoading={false}/>
      <ConfirmModal show={showMaintenanceConfirm} title="Supprimer la maintenance" message="Êtes-vous sûr ?"                                 onConfirm={handleDeleteMaintenance} onCancel={()=>setShowMaintenanceConfirm(false)} isLoading={false}/>
    </MainLayout>
  );
};

export default VehiculesPage;