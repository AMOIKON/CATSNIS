import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../../components/common/MainLayout';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import FournitureFormModal from './Fournitureformmodal';
import FournitureDeploymentModal from './Fournituredeploymentmodal';
import FournitureService, {
  FournitureResponse, FournitureDeploiementResponse,
  FournitureCategorie, FournitureStatut, FournitureStats,
} from '../../services/Fournitureservice';
import { buildHeader, getPrintConfig } from '../../services/globalprintservice';
import useAuth from '../../hooks/useAuth';

// ── Badges / Config ───────────────────────────────────────────────────────────
const CAT_ICONS: Record<FournitureCategorie, string> = {
  INFORMATIQUE:   'bi-cpu-fill',
  MOBILIER:       'bi-house-fill',
  PAPETERIE:      'bi-journal-text',
  BUREAUTIQUE:    'bi-printer-fill',
  ELECTROMENAGER: 'bi-lightning-fill',
  AUTRE:          'bi-box-seam-fill',
};

const CategorieBadge: React.FC<{ categorie: FournitureCategorie }> = ({ categorie }) => {
  const CONFIG: Record<FournitureCategorie, { color: string; label: string }> = {
    INFORMATIQUE:   { color:'primary',   label:'Informatique'   },
    MOBILIER:       { color:'success',   label:'Mobilier'       },
    PAPETERIE:      { color:'warning',   label:'Papeterie'      },
    BUREAUTIQUE:    { color:'info',      label:'Bureautique'    },
    ELECTROMENAGER: { color:'danger',    label:'Électroménager' },
    AUTRE:          { color:'secondary', label:'Autre'          },
  };
  const c = CONFIG[categorie] || CONFIG.AUTRE;
  return (
    <span className={`badge bg-${c.color} bg-opacity-10 text-${c.color} d-inline-flex align-items-center gap-1`}>
      <i className={`bi ${CAT_ICONS[categorie]}`} />{c.label}
    </span>
  );
};

const STATUT_CONFIG: Record<FournitureStatut, { color: string; label: string; icon: string }> = {
  DISPONIBLE: { color:'success',   label:'Disponible', icon:'bi-check-circle-fill'        },
  DEPLOYE:    { color:'primary',   label:'Déployé',    icon:'bi-box-arrow-right'           },
  EN_RUPTURE: { color:'danger',    label:'En rupture', icon:'bi-exclamation-triangle-fill' },
};
const StatutBadge: React.FC<{ statut: FournitureStatut }> = ({ statut }) => {
  const c = STATUT_CONFIG[statut] || STATUT_CONFIG.DISPONIBLE;
  return <span className={`badge bg-${c.color} bg-opacity-10 text-${c.color}`}>{c.label}</span>;
};

type Tab = 'fournitures' | 'deploiements' | 'historique';

// ── Page principale ───────────────────────────────────────────────────────────
const FournituresPage: React.FC = () => {
  const { person } = useAuth();
  const role      = person?.role;
  const canCreate = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'LOGISTICIEN';
  const canEdit   = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'LOGISTICIEN';
  const canDelete = role === 'SUPER_ADMIN' || role === 'ADMIN';
  const canDeploy = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'LOGISTICIEN' || role === 'TECHNICIEN';

  const [activeTab,         setActiveTab]         = useState<Tab>('fournitures');
  const [activeCatFilter,   setActiveCatFilter]   = useState<FournitureCategorie | undefined>(undefined);
  const [isPrinting,        setIsPrinting]        = useState(false);

  // ── États fournitures ──────────────────────────────────────────────────────
  const [fournitures,        setFournitures]        = useState<FournitureResponse[]>([]);
  const [totalPages,         setTotalPages]         = useState(0);
  const [totalElements,      setTotalElements]      = useState(0);
  const [page,               setPage]               = useState(0);
  const [keyword,            setKeyword]            = useState('');
  const [filterStatut,       setFilterStatut]       = useState<FournitureStatut | undefined>(undefined);
  const [isLoading,          setIsLoading]          = useState(false);
  const [stats,              setStats]              = useState<FournitureStats | null>(null);
  const [showForm,           setShowForm]           = useState(false);
  const [selectedFourniture, setSelectedFourniture] = useState<FournitureResponse | null>(null);
  const [showConfirm,        setShowConfirm]        = useState(false);
  const [selectedId,         setSelectedId]         = useState<number | null>(null);
  const [deleteLoading,      setDeleteLoading]      = useState(false);

  // ── États déploiements ─────────────────────────────────────────────────────
  const [deploiements,     setDeploiements]     = useState<FournitureDeploiementResponse[]>([]);
  const [deplPages,        setDeplPages]        = useState(0);
  const [deplPage,         setDeplPage]         = useState(0);
  const [deplLoading,      setDeplLoading]      = useState(false);
  const [showDeplModal,    setShowDeplModal]    = useState(false);
  const [deplFourniture,   setDeplFourniture]   = useState<FournitureResponse | null>(null);
  const [selectedDepl,     setSelectedDepl]     = useState<FournitureDeploiementResponse | null>(null);
  const [showDeplConfirm,  setShowDeplConfirm]  = useState(false);
  const [deplDeleteId,     setDeplDeleteId]     = useState<number | null>(null);
  const [filterDeplActif,  setFilterDeplActif]  = useState<boolean | undefined>(undefined);
  const [deplKeyword,      setDeplKeyword]      = useState('');

  // ── États historique ───────────────────────────────────────────────────────
  const [historique,   setHistorique]   = useState<FournitureDeploiementResponse[]>([]);
  const [histPages,    setHistPages]    = useState(0);
  const [histPage,     setHistPage]     = useState(0);
  const [histLoading,  setHistLoading]  = useState(false);

  // ── Loaders ────────────────────────────────────────────────────────────────
  const loadFournitures = useCallback(async () => {
    setIsLoading(true);
    try {
      const d = await FournitureService.getAll(page, 10, activeCatFilter, filterStatut, keyword || undefined);
      setFournitures(d.content);
      setTotalPages(d.totalPages);
      setTotalElements(d.totalElements);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  }, [page, keyword, activeCatFilter, filterStatut]);

  const loadStats = useCallback(async () => {
    try { setStats(await FournitureService.stats()); }
    catch (err) { console.error(err); }
  }, []);

  const loadDeploiements = useCallback(async () => {
    setDeplLoading(true);
    try {
      const d = await FournitureService.getDeploiements(deplPage, 10, undefined, filterDeplActif, deplKeyword || undefined);
      setDeploiements(d.content); setDeplPages(d.totalPages);
    } catch (err) { console.error(err); }
    finally { setDeplLoading(false); }
  }, [deplPage, filterDeplActif, deplKeyword]);

  const loadHistorique = useCallback(async () => {
    setHistLoading(true);
    try {
      const d = await FournitureService.getDeploiements(histPage, 10);
      setHistorique(d.content); setHistPages(d.totalPages);
    } catch (err) { console.error(err); }
    finally { setHistLoading(false); }
  }, [histPage]);

  useEffect(() => { loadFournitures(); loadStats(); }, [loadFournitures, loadStats]);
  useEffect(() => { if (activeTab === 'deploiements') loadDeploiements(); }, [activeTab, loadDeploiements]);
  useEffect(() => { if (activeTab === 'historique')   loadHistorique();   }, [activeTab, loadHistorique]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!selectedId) return;
    setDeleteLoading(true);
    try { await FournitureService.delete(selectedId); loadFournitures(); loadStats(); }
    catch (err) { console.error(err); }
    finally { setDeleteLoading(false); setShowConfirm(false); setSelectedId(null); }
  };

  const handleDeleteDepl = async () => {
    if (!deplDeleteId) return;
    try { await FournitureService.deleteDeploiement(deplDeleteId); loadDeploiements(); loadStats(); }
    catch (err) { console.error(err); }
    finally { setShowDeplConfirm(false); setDeplDeleteId(null); }
  };

  const handleCloturer = async (id: number) => {
    try { await FournitureService.cloturerDeploiement(id); loadDeploiements(); loadStats(); loadFournitures(); }
    catch (err) { console.error(err); }
  };

  // ── ✅ Impression onglet Articles ────────────────────────────────────────
  const handlePrintFournitures = async () => {
    setIsPrinting(true);
    try {
      const data = await FournitureService.getAll(0, 1000, activeCatFilter, filterStatut, keyword || undefined);
      const all  = data.content;
      const cfg  = getPrintConfig();
      let titre  = 'Liste des fournitures';
      if (activeCatFilter) titre += ` — ${activeCatFilter}`;
      if (filterStatut)    titre += ` (${STATUT_CONFIG[filterStatut]?.label})`;
      const header = buildHeader(titre, cfg);

      const catColors: Record<string, string> = {
        INFORMATIQUE:'#0d6efd', MOBILIER:'#198754', PAPETERIE:'#ffc107',
        BUREAUTIQUE:'#0dcaf0', ELECTROMENAGER:'#dc3545', AUTRE:'#6c757d',
      };

      const rows = all.map((f, i) => `
        <tr>
          <td style="color:#6c757d;font-size:10px;">${i + 1}</td>
          <td style="font-family:monospace;font-size:10px;color:#0d6efd;font-weight:600;">${f.code}</td>
          <td style="font-weight:500;">${f.designation}</td>
          <td><span style="background:${catColors[f.categorie] || '#6c757d'}22;color:${catColors[f.categorie] || '#6c757d'};padding:1px 8px;border-radius:20px;font-size:10px;">${f.categorie}</span></td>
          <td style="text-align:center;font-weight:bold;">${f.quantite}</td>
          <td style="text-align:center;font-weight:bold;color:${f.quantiteDisponible > 0 ? '#198754' : '#dc3545'};">${f.quantiteDisponible}</td>
          <td style="text-align:center;font-weight:bold;color:#0d6efd;">${f.quantiteDeployee}</td>
          <td style="font-size:10px;">${f.unite || '—'}</td>
          <td style="font-size:10px;">${f.fournisseur || '—'}</td>
          <td style="font-size:10px;font-weight:600;color:${f.statut === 'DISPONIBLE' ? '#198754' : f.statut === 'EN_RUPTURE' ? '#dc3545' : '#0d6efd'};">${STATUT_CONFIG[f.statut]?.label || f.statut}</td>
        </tr>`).join('');

      const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
        <title>Fournitures — CATUSNIS</title>
        <style>@page{margin:1.5cm;size:A4 landscape}body{font-family:Arial,sans-serif;color:#333;margin:0}
        .total{font-size:12px;color:#6c757d;margin:8px 0 16px}table{width:100%;border-collapse:collapse}
        th{background:#f8f9fa;border:1px solid #dee2e6;padding:6px 8px;font-size:10px;text-align:left}
        td{border:1px solid #dee2e6;padding:6px 8px;font-size:11px}tr:nth-child(even){background:#f9f9f9}
        </style></head>
        <body>${header}
        <p class="total">${all.length} article(s)</p>
        <table><thead><tr>
          <th>#</th><th>Code</th><th>Désignation</th><th>Catégorie</th>
          <th style="text-align:center">Qté totale</th><th style="text-align:center">Disponible</th>
          <th style="text-align:center">Déployé</th><th>Unité</th><th>Fournisseur</th><th>Statut</th>
        </tr></thead><tbody>${rows}</tbody></table>
        </body></html>`;
      const win = window.open('', '_blank', 'width=900,height=700');
      if (!win) { alert('Veuillez autoriser les popups pour imprimer.'); return; }
      win.document.write(html); win.document.close();
      win.onload = () => { win.focus(); win.print(); win.close(); };
    } catch (err) { console.error(err); }
    finally { setIsPrinting(false); }
  };

  // ── ✅ Impression onglet Déploiements ────────────────────────────────────
  const handlePrintDeploiements = async () => {
    setIsPrinting(true);
    try {
      const data = await FournitureService.getDeploiements(0, 1000, undefined, filterDeplActif, deplKeyword || undefined);
      const all  = data.content;
      const cfg  = getPrintConfig();
      const filtre = filterDeplActif === true ? ' — Actifs' : filterDeplActif === false ? ' — Clôturés' : '';
      const header = buildHeader(`Déploiements fournitures${filtre}`, cfg);

      const rows = all.map((d, i) => `
        <tr>
          <td style="color:#6c757d;font-size:10px;">${i + 1}</td>
          <td style="font-family:monospace;font-size:10px;color:#0d6efd;">${d.fournitureCode}</td>
          <td style="font-weight:500;">${d.fournitureDesignation}</td>
          <td style="font-size:10px;font-weight:500;">${d.beneficiaireNom || '—'}</td>
          <td style="font-size:10px;">${d.beneficiairePoste || '—'}</td>
          <td style="font-size:10px;">${d.regionName || '—'}${d.districtName ? ` / ${d.districtName}` : ''}</td>
          <td style="text-align:center;font-weight:bold;">${d.quantiteDeployee}</td>
          <td style="font-size:10px;">${new Date(d.dateDeploiement).toLocaleDateString('fr-FR')}</td>
          <td style="font-size:10px;">${d.motif || '—'}</td>
          <td style="font-size:10px;font-weight:600;color:${d.active ? '#198754' : '#6c757d'};">${d.active ? '✅ Actif' : 'Clôturé'}</td>
        </tr>`).join('');

      const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
        <title>Déploiements fournitures — CATUSNIS</title>
        <style>@page{margin:1.5cm;size:A4 landscape}body{font-family:Arial,sans-serif;color:#333;margin:0}
        .total{font-size:12px;color:#6c757d;margin:8px 0 16px}table{width:100%;border-collapse:collapse}
        th{background:#f8f9fa;border:1px solid #dee2e6;padding:6px 8px;font-size:10px;text-align:left}
        td{border:1px solid #dee2e6;padding:6px 8px;font-size:11px}tr:nth-child(even){background:#f9f9f9}
        </style></head>
        <body>${header}
        <p class="total">${all.length} déploiement(s)</p>
        <table><thead><tr>
          <th>#</th><th>Code</th><th>Désignation</th><th>Bénéficiaire</th><th>Poste</th>
          <th>Région / District</th><th style="text-align:center">Qté</th>
          <th>Date</th><th>Motif</th><th>Statut</th>
        </tr></thead><tbody>${rows}</tbody></table>
        </body></html>`;
      const win = window.open('', '_blank', 'width=900,height=700');
      if (!win) { alert('Veuillez autoriser les popups pour imprimer.'); return; }
      win.document.write(html); win.document.close();
      win.onload = () => { win.focus(); win.print(); win.close(); };
    } catch (err) { console.error(err); }
    finally { setIsPrinting(false); }
  };

  // ── ✅ Impression onglet Historique ──────────────────────────────────────
  const handlePrintHistorique = async () => {
    setIsPrinting(true);
    try {
      const data = await FournitureService.getDeploiements(0, 1000);
      const all  = data.content;
      const cfg  = getPrintConfig();
      const header = buildHeader('Historique des déploiements fournitures', cfg);

      const rows = all.map((h, i) => `
        <tr class="${h.active ? '' : 'opacity-60'}">
          <td style="color:#6c757d;font-size:10px;">${i + 1}</td>
          <td style="font-family:monospace;font-size:10px;color:#0d6efd;">${h.fournitureCode}</td>
          <td style="font-weight:500;">${h.fournitureDesignation}</td>
          <td style="font-size:10px;">${h.fournitureCategorie}</td>
          <td style="font-size:10px;">${h.beneficiaireNom || '—'}</td>
          <td style="text-align:center;font-weight:bold;">${h.quantiteDeployee}</td>
          <td style="font-size:10px;">${new Date(h.dateDeploiement).toLocaleDateString('fr-FR')}</td>
          <td style="font-size:10px;">${h.regionName || '—'}${h.districtName ? ` / ${h.districtName}` : ''}</td>
          <td style="font-size:10px;">${h.motif || '—'}</td>
          <td style="font-size:10px;font-weight:600;color:${h.active ? '#198754' : '#6c757d'};">${h.active ? 'Actif' : 'Clôturé'}</td>
        </tr>`).join('');

      const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
        <title>Historique fournitures — CATUSNIS</title>
        <style>@page{margin:1.5cm;size:A4 landscape}body{font-family:Arial,sans-serif;color:#333;margin:0}
        .total{font-size:12px;color:#6c757d;margin:8px 0 16px}table{width:100%;border-collapse:collapse}
        th{background:#f8f9fa;border:1px solid #dee2e6;padding:6px 8px;font-size:10px;text-align:left}
        td{border:1px solid #dee2e6;padding:6px 8px;font-size:11px}tr:nth-child(even){background:#f9f9f9}
        </style></head>
        <body>${header}
        <p class="total">${all.length} enregistrement(s)</p>
        <table><thead><tr>
          <th>#</th><th>Code</th><th>Désignation</th><th>Catégorie</th><th>Bénéficiaire</th>
          <th style="text-align:center">Qté</th><th>Date</th>
          <th>Région / District</th><th>Motif</th><th>Statut</th>
        </tr></thead><tbody>${rows}</tbody></table>
        </body></html>`;
      const win = window.open('', '_blank', 'width=900,height=700');
      if (!win) { alert('Veuillez autoriser les popups pour imprimer.'); return; }
      win.document.write(html); win.document.close();
      win.onload = () => { win.focus(); win.print(); win.close(); };
    } catch (err) { console.error(err); }
    finally { setIsPrinting(false); }
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const statsStatuts = [
    { label:'Total articles',      value: stats?.total             ?? 0, icon:'bi-box-seam-fill',            color:'secondary' },
    { label:'Disponibles',         value: stats?.disponibles        ?? 0, icon:'bi-check-circle-fill',        color:'success'  },
    { label:'Déployés',            value: stats?.deployes           ?? 0, icon:'bi-box-arrow-right',          color:'primary'  },
    { label:'En rupture',          value: stats?.enRupture          ?? 0, icon:'bi-exclamation-triangle-fill',
      color: (stats?.enRupture ?? 0) > 0 ? 'danger' : 'secondary' },
    { label:'Déploiements actifs', value: stats?.totalDeploiements  ?? 0, icon:'bi-people-fill',              color:'info'     },
  ];

  const statsParCat: { key: FournitureCategorie; label: string; icon: string; color: string; statsKey: keyof FournitureStats }[] = [
    { key:'MOBILIER',       label:'Mobilier',       icon:'bi-house-fill',     color:'success',   statsKey:'mobilier'       },
    { key:'PAPETERIE',      label:'Papeterie',      icon:'bi-journal-text',   color:'warning',   statsKey:'papeterie'      },
    { key:'BUREAUTIQUE',    label:'Bureautique',    icon:'bi-printer-fill',   color:'info',      statsKey:'bureautique'    },
    { key:'ELECTROMENAGER', label:'Électroménager', icon:'bi-lightning-fill', color:'danger',    statsKey:'electromenager' },
  ];

  const fournituresFiltrees = activeCatFilter ? fournitures.filter(f => f.categorie === activeCatFilter) : fournitures;

  // ── Bouton imprimer selon onglet ─────────────────────────────────────────
  const printHandlers: Record<Tab, () => void> = {
    fournitures:  handlePrintFournitures,
    deploiements: handlePrintDeploiements,
    historique:   handlePrintHistorique,
  };

  return (
    <MainLayout title="Fournitures & Mobilier">

      {/* ── Header ── */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="fw-bold mb-0">
            <i className="bi bi-box-seam-fill text-primary me-2" />
            Parc logistique — Fournitures & Mobilier
          </h5>
          <small className="text-muted">{totalElements} article(s) enregistré(s)</small>
        </div>
        <div className="d-flex gap-2 align-items-center">
          {/* ✅ Bouton imprimer unique adapté à l'onglet actif */}
          <button
            className="btn btn-outline-secondary d-flex align-items-center gap-2"
            onClick={printHandlers[activeTab]}
            disabled={isPrinting}
            title="Imprimer">
            {isPrinting
              ? <><span className="spinner-border spinner-border-sm" role="status" />Chargement...</>
              : <><i className="bi bi-printer" />Imprimer</>}
          </button>
          {activeTab === 'fournitures'  && canCreate && (
            <button className="btn btn-primary d-flex align-items-center gap-2"
              onClick={() => { setSelectedFourniture(null); setShowForm(true); }}>
              <i className="bi bi-plus-circle-fill" />Nouvelle fourniture
            </button>
          )}
          {activeTab === 'deploiements' && canDeploy && (
            <button className="btn btn-success d-flex align-items-center gap-2"
              onClick={() => { setDeplFourniture(fournitures[0] || null); setSelectedDepl(null); setShowDeplModal(true); }}>
              <i className="bi bi-box-arrow-right" />Nouveau déploiement
            </button>
          )}
        </div>
      </div>

      {/* ── Rangée 1 : Stats statuts ── */}
      <div className="row g-3 mb-3">
        {statsStatuts.map((s, i) => (
          <div key={i} className="col-6 col-md">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-3 d-flex align-items-center gap-3">
                <div className={`rounded-3 bg-${s.color} bg-opacity-10 d-flex align-items-center justify-content-center`} style={{ width:'44px', height:'44px', minWidth:'44px' }}>
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

      {/* ── Rangée 2 : Stats par catégorie (cliquables) ── */}
      <div className="row g-3 mb-4">
        {statsParCat.map((s, i) => {
          const count    = stats ? Number(stats[s.statsKey]) : 0;
          const isActive = activeCatFilter === s.key;
          return (
            <div key={i} className="col-6 col-md">
              <div
                className={`card rounded-4 h-100 ${isActive ? `bg-${s.color} shadow` : 'border-0 shadow-sm'}`}
                style={{ cursor:'pointer', transition:'all 0.15s', border: isActive ? 'none' : '1px solid rgba(0,0,0,0.06)' }}
                onClick={() => { setActiveCatFilter(isActive ? undefined : s.key); setActiveTab('fournitures'); setPage(0); }}>
                <div className="card-body p-2 d-flex align-items-center gap-2">
                  <div className={`rounded-3 d-flex align-items-center justify-content-center ${isActive ? 'bg-white bg-opacity-25' : `bg-${s.color} bg-opacity-10`}`} style={{ width:'36px', height:'36px', minWidth:'36px' }}>
                    <i className={`bi ${s.icon} ${isActive ? 'text-white' : `text-${s.color}`} small`} />
                  </div>
                  <div className="flex-grow-1">
                    <p className="mb-0 small" style={{ fontSize:'11px', color: isActive ? 'rgba(255,255,255,0.8)' : '#6c757d' }}>{s.label}</p>
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
          { key:'fournitures',  label:'Articles',     icon:'bi-box-seam-fill'   },
          { key:'deploiements', label:'Déploiements', icon:'bi-box-arrow-right' },
          { key:'historique',   label:'Historique',   icon:'bi-clock-history'   },
        ] as { key:Tab; label:string; icon:string }[]).map(tab => (
          <li key={tab.key} className="nav-item">
            <button
              className={`nav-link d-flex align-items-center gap-2 ${activeTab === tab.key ? 'active fw-bold' : ''}`}
              onClick={() => setActiveTab(tab.key)}>
              <i className={`bi ${tab.icon}`} />{tab.label}
            </button>
          </li>
        ))}
      </ul>

      {/* ══ TAB Articles ══ */}
      {activeTab === 'fournitures' && (
        <>
          <div className="card border-0 shadow-sm rounded-4 mb-3">
            <div className="card-body p-3">
              <div className="d-flex gap-3 align-items-center flex-wrap">
                <div className="input-group flex-grow-1">
                  <span className="input-group-text bg-white border-end-0">
                    <i className="bi bi-search text-muted" />
                  </span>
                  <input type="text" className="form-control border-start-0"
                    placeholder="Rechercher par code, désignation…"
                    value={keyword}
                    onChange={e => { setKeyword(e.target.value); setPage(0); }} />
                </div>
                <div className="d-flex gap-2">
                  <button type="button"
                    className={`btn btn-sm ${!filterStatut ? 'btn-secondary' : 'btn-outline-secondary'}`}
                    onClick={() => { setFilterStatut(undefined); setPage(0); }}>
                    Tous les statuts
                  </button>
                  {(Object.keys(STATUT_CONFIG) as FournitureStatut[]).map(s => (
                    <button key={s} type="button"
                      className={`btn btn-sm ${filterStatut === s ? `btn-${STATUT_CONFIG[s].color}` : `btn-outline-${STATUT_CONFIG[s].color}`}`}
                      onClick={() => { setFilterStatut(s); setPage(0); }}>
                      <i className={`bi ${STATUT_CONFIG[s].icon} me-1`} />
                      {STATUT_CONFIG[s].label}
                    </button>
                  ))}
                </div>
                {activeCatFilter && (
                  <span className={`badge d-inline-flex align-items-center gap-2 px-3 py-2 bg-${statsParCat.find(s => s.key === activeCatFilter)?.color || 'primary'}`} style={{ fontSize:'13px' }}>
                    <i className={`bi ${CAT_ICONS[activeCatFilter]}`} />
                    {activeCatFilter}
                    <span className="ms-1" style={{ fontSize:'11px', opacity:0.8 }}>({fournituresFiltrees.length})</span>
                    <button className="btn-close btn-close-white ms-1" style={{ fontSize:'10px' }} onClick={() => setActiveCatFilter(undefined)} />
                  </span>
                )}
              </div>
            </div>
          </div>

          <div id="fournitures-table" className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-0">
              {isLoading ? <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
              : fournituresFiltrees.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-box-seam fs-1 d-block mb-2" />
                  {activeCatFilter ? `Aucun article en catégorie ${activeCatFilter}` : 'Aucun article enregistré'}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>#</th><th>Code</th><th>Désignation</th><th>Catégorie</th>
                        <th>Qté totale</th><th>Disponible</th><th>Déployé</th>
                        <th>Unité</th><th>Fournisseur</th><th>Statut</th>
                        <th className="text-end no-print">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fournituresFiltrees.map((f, i) => (
                        <tr key={f.id}>
                          <td className="text-muted small">{page * 10 + i + 1}</td>
                          <td><span className="fw-semibold font-monospace small text-primary">{f.code}</span></td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div className={`rounded-circle bg-${statsParCat.find(s=>s.key===f.categorie)?.color||'secondary'} bg-opacity-10 d-flex align-items-center justify-content-center`} style={{ width:'36px', height:'36px', minWidth:'36px' }}>
                                <i className={`bi ${CAT_ICONS[f.categorie]} text-${statsParCat.find(s=>s.key===f.categorie)?.color||'secondary'}`} />
                              </div>
                              <span className="fw-semibold small">{f.designation}</span>
                            </div>
                          </td>
                          <td><CategorieBadge categorie={f.categorie} /></td>
                          <td className="text-center fw-semibold">{f.quantite}</td>
                          <td className="text-center">
                            <span className={`fw-bold text-${f.quantiteDisponible > 0 ? 'success' : 'danger'}`}>{f.quantiteDisponible}</span>
                          </td>
                          <td className="text-center"><span className="text-primary fw-semibold">{f.quantiteDeployee}</span></td>
                          <td><small className="text-muted">{f.unite}</small></td>
                          <td><small className="text-muted">{f.fournisseur || '—'}</small></td>
                          <td><StatutBadge statut={f.statut} /></td>
                          <td className="text-end no-print">
                            {canDeploy && f.quantiteDisponible > 0 && (
                              <button className="btn btn-sm btn-outline-primary me-1" title="Déployer"
                                onClick={() => { setDeplFourniture(f); setSelectedDepl(null); setShowDeplModal(true); }}>
                                <i className="bi bi-box-arrow-right" />
                              </button>
                            )}
                            {canEdit && (
                              <button className="btn btn-sm btn-outline-warning me-1" title="Modifier"
                                onClick={() => { setSelectedFourniture(f); setShowForm(true); }}>
                                <i className="bi bi-pencil" />
                              </button>
                            )}
                            {canDelete && (
                              <button className="btn btn-sm btn-outline-danger" title="Supprimer"
                                onClick={() => { setSelectedId(f.id); setShowConfirm(true); }}>
                                <i className="bi bi-trash" />
                              </button>
                            )}
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

      {/* ══ TAB Déploiements ══ */}
      {activeTab === 'deploiements' && (
        <>
          <div className="d-flex gap-3 mb-3 align-items-center flex-wrap">
            <div className="d-flex gap-2">
              {([
                { label:'Tous',     value:undefined },
                { label:'Actifs',   value:true      },
                { label:'Clôturés', value:false     },
              ] as { label:string; value:boolean|undefined }[]).map(f => (
                <button key={String(f.value)} type="button"
                  className={`btn btn-sm ${filterDeplActif === f.value ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => { setFilterDeplActif(f.value); setDeplPage(0); }}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="input-group" style={{ maxWidth:'300px' }}>
              <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted" /></span>
              <input type="text" className="form-control border-start-0"
                placeholder="Désignation, motif…"
                value={deplKeyword}
                onChange={e => { setDeplKeyword(e.target.value); setDeplPage(0); }} />
            </div>
          </div>

          <div id="deploiements-table" className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-0">
              {deplLoading ? <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
              : deploiements.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-box-arrow-right fs-1 d-block mb-2" />Aucun déploiement
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>#</th><th>Code</th><th>Désignation</th><th>Bénéficiaire</th><th>Poste</th>
                        <th>Région / District</th><th>Qté</th><th>Date</th><th>Motif</th><th>Statut</th>
                        <th className="text-end no-print">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deploiements.map((d, i) => (
                        <tr key={d.id} className={d.active ? '' : 'opacity-50'}>
                          <td className="text-muted small">{deplPage * 10 + i + 1}</td>
                          <td><span className="font-monospace small text-primary">{d.fournitureCode}</span></td>
                          <td><span className="fw-semibold small">{d.fournitureDesignation}</span></td>
                          <td className="fw-semibold small">{d.beneficiaireNom || '—'}</td>
                          <td><small className="text-muted">{d.beneficiairePoste || '—'}</small></td>
                          <td>
                            {d.regionName ? <>
                              <span className="badge bg-info bg-opacity-10 text-info">{d.regionName}</span>
                              {d.districtName && <span className="badge bg-secondary bg-opacity-10 text-secondary ms-1">{d.districtName}</span>}
                            </> : <span className="text-muted small">—</span>}
                          </td>
                          <td className="text-center fw-semibold">{d.quantiteDeployee}</td>
                          <td><small>{new Date(d.dateDeploiement).toLocaleDateString('fr-FR')}</small></td>
                          <td><small className="text-muted">{d.motif || '—'}</small></td>
                          <td>
                            {d.active
                              ? <span className="badge bg-success bg-opacity-10 text-success"><i className="bi bi-check-circle me-1" />Active</span>
                              : <span className="badge bg-secondary bg-opacity-10 text-secondary"><i className="bi bi-clock-history me-1" />Clôturée</span>}
                          </td>
                          <td className="text-end no-print">
                            {canEdit && d.active && (
                              <>
                                <button className="btn btn-sm btn-outline-warning me-1" title="Modifier"
                                  onClick={() => {
                                    const f = fournitures.find(f => f.id === d.fournitureId) || null;
                                    setDeplFourniture(f); setSelectedDepl(d); setShowDeplModal(true);
                                  }}>
                                  <i className="bi bi-pencil" />
                                </button>
                                <button className="btn btn-sm btn-outline-secondary me-1" title="Clôturer"
                                  onClick={() => handleCloturer(d.id)}>
                                  <i className="bi bi-check2-circle" />
                                </button>
                              </>
                            )}
                            {canDelete && (
                              <button className="btn btn-sm btn-outline-danger" title="Supprimer"
                                onClick={() => { setDeplDeleteId(d.id); setShowDeplConfirm(true); }}>
                                <i className="bi bi-trash" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <Pagination page={deplPage} totalPages={deplPages} onPageChange={setDeplPage} />
          </div>
        </>
      )}

      {/* ══ TAB Historique ══ */}
      {activeTab === 'historique' && (
        <div id="historique-table" className="card border-0 shadow-sm rounded-4">
          <div className="card-body p-0">
            {histLoading ? <div className="text-center py-5"><div className="spinner-border text-secondary" /></div>
            : historique.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-clock-history fs-1 d-block mb-2" />Aucun historique disponible
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>#</th><th>Code</th><th>Désignation</th><th>Catégorie</th><th>Bénéficiaire</th>
                      <th>Qté</th><th>Date</th><th>Région / District</th><th>Motif</th><th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historique.map((h, i) => (
                      <tr key={h.id} className={h.active ? '' : 'opacity-60'}>
                        <td className="text-muted small">{histPage * 10 + i + 1}</td>
                        <td><span className="font-monospace small text-primary">{h.fournitureCode}</span></td>
                        <td><span className="fw-semibold small">{h.fournitureDesignation}</span></td>
                        <td><CategorieBadge categorie={h.fournitureCategorie as FournitureCategorie} /></td>
                        <td className="small">{h.beneficiaireNom || '—'}</td>
                        <td className="text-center fw-semibold">{h.quantiteDeployee}</td>
                        <td><small>{new Date(h.dateDeploiement).toLocaleDateString('fr-FR')}</small></td>
                        <td>
                          {h.regionName ? <>
                            <span className="badge bg-info bg-opacity-10 text-info me-1">{h.regionName}</span>
                            {h.districtName && <span className="badge bg-secondary bg-opacity-10 text-secondary">{h.districtName}</span>}
                          </> : <span className="text-muted small">—</span>}
                        </td>
                        <td><small className="text-muted">{h.motif || '—'}</small></td>
                        <td>
                          {h.active
                            ? <span className="badge bg-success bg-opacity-10 text-success">Actif</span>
                            : <span className="badge bg-secondary bg-opacity-10 text-secondary">Clôturé</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <Pagination page={histPage} totalPages={histPages} onPageChange={setHistPage} />
        </div>
      )}

      {/* ── Modals ── */}
      <FournitureFormModal
        show={showForm}
        fourniture={selectedFourniture}
        onHide={() => { setShowForm(false); setSelectedFourniture(null); }}
        onSuccess={() => { loadFournitures(); loadStats(); }}
      />
      <FournitureDeploymentModal
        show={showDeplModal}
        fourniture={deplFourniture}
        deploiement={selectedDepl}
        onHide={() => { setShowDeplModal(false); setDeplFourniture(null); setSelectedDepl(null); }}
        onSuccess={() => { loadDeploiements(); loadFournitures(); loadStats(); }}
      />
      <ConfirmModal
        show={showConfirm}
        title="Supprimer l'article"
        message="Cette action supprimera aussi tous les déploiements associés. Continuer ?"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
        isLoading={deleteLoading}
      />
      <ConfirmModal
        show={showDeplConfirm}
        title="Supprimer le déploiement"
        message="La quantité sera restituée au stock. Confirmer ?"
        onConfirm={handleDeleteDepl}
        onCancel={() => setShowDeplConfirm(false)}
        isLoading={false}
      />
    </MainLayout>
  );
};

export default FournituresPage;