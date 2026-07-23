import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../../components/common/MainLayout';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import ArchiveFormModal from './ArchiveFromModal';
import ArchiveUpdateModal from './ArchiveUpdateModal';   // ✅ NOUVEAU
import ActivityUploadModal, { ActivityDoc } from './ActivityUploadModal';
import ArchiveService, { getFileIcon,
  ArchiveResponse, TypeArchive, CategorieArchive, ArchiveStats,
} from '../../services/archiveService';
import useAuth from '../../hooks/useAuth';
import  notify  from '../../services/notify';

// ── Config catégories ─────────────────────────────────────────────────────────
const CAT_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  INTERVENTION: { icon: 'bi-tools',         color: 'primary',   label: 'Intervention' },
  DEPLOIEMENT:  { icon: 'bi-truck',          color: 'info',      label: 'Déploiement'  },
  ACQUISITION:  { icon: 'bi-box-seam-fill',  color: 'warning',   label: 'Acquisition'  },
  BOOKLET:      { icon: 'bi-journal-text',   color: 'success',   label: 'Booklet'      },
  ACTIVITE:     { icon: 'bi-lightning-fill', color: 'danger',    label: 'Activité'     },
  AUTRE:        { icon: 'bi-folder-fill',    color: 'secondary', label: 'Autre'        },
};

const TYPE_CONFIG: Record<TypeArchive, { icon: string; color: string; label: string }> = {
  SCANNE:  { icon: 'bi-cloud-upload', color: 'primary',   label: 'Scanné'  },
  IMPRIME: { icon: 'bi-printer-fill', color: 'secondary', label: 'Imprimé' },
};

// ── Documents d'activité ──────────────────────────────────────────────────────
const ACTIVITE_DOCS: ActivityDoc[] = [
  { key: 'LISTE_PRESENCE',  label: 'Liste de présence',    description: 'Suivi des présences lors des missions et réunions', icon: 'bi-person-lines-fill',      color: 'primary',   formats: ['PDF', 'DOCX'] },
  { key: 'RECU_CARBURANT',  label: 'Reçu de carburant',    description: 'Enregistrement des consommations et reçus carburant', icon: 'bi-fuel-pump-fill',       color: 'warning',   formats: ['PDF', 'DOCX'] },
  { key: 'FICHE_KILOMETRAGE',label: 'Fiche de kilométrage', description: 'Relevé kilométrique des véhicules et engins',       icon: 'bi-speedometer2',          color: 'info',      formats: ['PDF', 'DOCX'] },
  { key: 'RAPPORT_MISSION', label: 'Rapport de mission',   description: 'Comptes rendus et rapports de missions terrain',     icon: 'bi-file-earmark-text-fill', color: 'success',   formats: ['PDF', 'DOCX'] },
  { key: 'CNI',             label: 'CNI',                  description: "Carte nationale d'identité et pièces d'identité",   icon: 'bi-person-badge-fill',      color: 'secondary', formats: ['PDF']         },
  { key: 'FICHE_PAIEMENT',  label: 'Fiche de paiement',    description: 'Justificatifs et fiches de paiement du personnel',  icon: 'bi-cash-stack',             color: 'danger',    formats: ['PDF', 'DOCX'] },
];

const formatSize = (bytes?: number | null) => {
  if (!bytes) return '—';
  if (bytes < 1024)       return `${bytes} o`;
  if (bytes < 1024*1024)  return `${(bytes/1024).toFixed(1)} Ko`;
  return `${(bytes/1024/1024).toFixed(2)} Mo`;
};

type ActiveTab = 'archives' | 'activites';

const ArchivesPage: React.FC = () => {
  const { person } = useAuth();
  const role       = person?.role;
  const canUpload  = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'TECHNICIEN';
  const canEdit    = role === 'SUPER_ADMIN' || role === 'ADMIN';   // ✅ droit modification
  const canDelete  = role === 'SUPER_ADMIN' || role === 'ADMIN';
  const canActivite = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'TECHNICIEN' || role === 'LOGISTICIEN';

  // ── États ──────────────────────────────────────────────────────────────────
  const [activeTab,       setActiveTab]       = useState<ActiveTab>('archives');
  const [archives,        setArchives]        = useState<ArchiveResponse[]>([]);
  const [totalPages,      setTotalPages]      = useState(0);
  const [totalElements,   setTotalElements]   = useState(0);
  const [page,            setPage]            = useState(0);
  const [keyword,         setKeyword]         = useState('');
  const [filterType,      setFilterType]      = useState<TypeArchive | ''>('');
  const [filterCat,       setFilterCat]       = useState<CategorieArchive | ''>('');
  const [isLoading,       setIsLoading]       = useState(false);
  const [showForm,        setShowForm]        = useState(false);
  const [showUpdate,      setShowUpdate]      = useState(false);          // ✅
  const [selectedArchive, setSelectedArchive] = useState<ArchiveResponse | null>(null); // ✅
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [selectedId,      setSelectedId]      = useState<number | null>(null);
  const [deleteLoading,   setDeleteLoading]   = useState(false);
  const [viewMode,        setViewMode]        = useState<'grid' | 'list'>('list');
  const [stats,           setStats]           = useState<ArchiveStats | null>(null);
  const [activityDoc,     setActivityDoc]     = useState<ActivityDoc | null>(null);
  const [exportLoading,   setExportLoading]   = useState(false);
  const [templateLoading, setTemplateLoading] = useState<string | null>(null);

  // ── Chargement ─────────────────────────────────────────────────────────────
  const loadArchives = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await ArchiveService.list(
        page, 12,
        filterType || undefined,
        filterCat  || undefined,
        keyword    || undefined,
      );
      setArchives(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  }, [page, keyword, filterType, filterCat]);

  const loadStats = useCallback(async () => {
    try { setStats(await ArchiveService.stats()); }
    catch (err) { console.error(err); }
  }, []);

  useEffect(() => { loadArchives(); }, [loadArchives]);
  useEffect(() => { loadStats();    }, [loadStats]);

  // ── Ouvrir le modal de modification ────────────────────────────────────────
  const handleEdit = (arch: ArchiveResponse) => {
    setSelectedArchive(arch);
    setShowUpdate(true);
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
  if (!selectedId) return;
  setDeleteLoading(true);
  try {
    await ArchiveService.delete(selectedId);
    notify.success('Archive supprimée avec succès');
    loadArchives(); loadStats();
  } catch (err) {
    notify.apiError(err, "Erreur lors de la suppression de l'archive");
  } finally { setDeleteLoading(false); setShowConfirm(false); setSelectedId(null); }
};

  const handleDownload = async (arch: ArchiveResponse) => {
    if (!arch.downloadUrl) return;
    await ArchiveService.download(arch.id, arch.fileName || `archive_${arch.id}`);
  };

  // ── Export CSV ──────────────────────────────────────────────────────────────
  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      const allData = await ArchiveService.list(0, 1000, filterType || undefined, filterCat || undefined, keyword || undefined);
      const headers = ['ID','Titre','Type','Catégorie','Référence','Taille (o)','Archivé par','Date'];
      const lines   = allData.content.map(a => [
        a.id,
        `"${(a.titre || '').replace(/"/g, '""')}"`,
        TYPE_CONFIG[a.type]?.label || a.type,
        CAT_CONFIG[a.categorie]?.label  || a.categorie,
        a.relatedCode || '',
        a.fileSize    || '',
        `"${(a.archivedBy || '').replace(/"/g, '""')}"`,
        new Date(a.archivedAt).toLocaleDateString('fr-FR'),
      ].join(','));
      const csv  = [headers.join(','), ...lines].join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href     = url;
      link.download = `archives_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error(err); }
    finally { setExportLoading(false); }
  };

  // ── Télécharger modèle ──────────────────────────────────────────────────────
  const handleDownloadTemplate = async (doc: ActivityDoc, format: string) => {
    setTemplateLoading(`${doc.key}-${format}`);
    try {
      const response = await fetch(
        `/api/archives/templates/${doc.key}?format=${format.toLowerCase()}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } }
      );
      if (!response.ok) throw new Error('Modèle non disponible');
      const blob = await response.blob();
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href     = url;
      link.download = `modele_${doc.key.toLowerCase()}.${format.toLowerCase()}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      alert(`Le modèle ${doc.label} en ${format} n'est pas encore disponible sur le serveur.`);
    } finally { setTemplateLoading(null); }
  };

  // ── Card grille ─────────────────────────────────────────────────────────────
  const renderCard = (arch: ArchiveResponse) => {
    const cat   = CAT_CONFIG[arch.categorie]  || CAT_CONFIG.AUTRE;
    const type  = TYPE_CONFIG[arch.type]      || TYPE_CONFIG.IMPRIME;
    return (
      <div key={arch.id} className="col-6 col-md-4 col-lg-3">
        <div className="card border rounded-4 h-100 overflow-hidden">
          <div className="d-flex align-items-center justify-content-center bg-light" style={{ height: '100px' }}>
            {arch.downloadUrl ? (() => {
              const fi = getFileIcon(arch.mimeType, arch.fileName);
              return <i className={`bi ${fi.icon} text-${fi.color}`} style={{ fontSize: '40px' }} />;
            })() : <i className="bi bi-printer-fill text-secondary" style={{ fontSize: '40px' }} />}
          </div>
          <div className="p-2">
            <div className="d-flex gap-1 mb-1 flex-wrap">
              <span className={`badge bg-${type.color} bg-opacity-10 text-${type.color}`} style={{ fontSize: '10px' }}>{type.label}</span>
              <span className={`badge bg-${cat.color}  bg-opacity-10 text-${cat.color}`}  style={{ fontSize: '10px' }}>{cat.label}</span>
            </div>
            <p className="fw-semibold small mb-0 text-truncate" title={arch.titre}>{arch.titre}</p>
            {arch.relatedCode && <small className="text-muted font-monospace">{arch.relatedCode}</small>}
            <p className="text-muted mb-2" style={{ fontSize: '10px' }}>
              {new Date(arch.archivedAt).toLocaleDateString('fr-FR')}
              {arch.archivedBy && ` — ${arch.archivedBy}`}
            </p>
            <div className="d-flex gap-1">
              {arch.downloadUrl && (
                <button className="btn btn-sm btn-outline-success flex-grow-1" onClick={() => handleDownload(arch)}>
                  <i className="bi bi-download" />
                </button>
              )}
              {/* ✅ Bouton Modifier */}
              {canEdit && (
                <button className="btn btn-sm btn-outline-warning" onClick={() => handleEdit(arch)} title="Modifier">
                  <i className="bi bi-pencil" />
                </button>
              )}
              {canDelete && (
                <button className="btn btn-sm btn-outline-danger"
                  onClick={() => { setSelectedId(arch.id); setShowConfirm(true); }}>
                  <i className="bi bi-trash" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <MainLayout title="Archives">

      {/* ── Header ── */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="fw-bold mb-0">
            <i className="bi bi-archive-fill text-secondary me-2" />Archives & Activités
          </h5>
          <small className="text-muted">{totalElements} document(s) archivé(s)</small>
        </div>
        <div className="d-flex gap-2 align-items-center">
          {activeTab === 'archives' && (
            <div className="btn-group btn-group-sm">
              <button className={`btn ${viewMode === 'grid' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => setViewMode('grid')}>
                <i className="bi bi-grid-fill" />
              </button>
              <button className={`btn ${viewMode === 'list' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => setViewMode('list')}>
                <i className="bi bi-list-ul" />
              </button>
            </div>
          )}
          {activeTab === 'archives' && (
            <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              onClick={handleExportCSV} disabled={exportLoading || archives.length === 0}>
              {exportLoading ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-file-earmark-spreadsheet" />}
              Exporter
            </button>
          )}
          {canUpload && activeTab === 'archives' && (
            <button className="btn btn-primary btn-sm d-flex align-items-center gap-2" onClick={() => setShowForm(true)}>
              <i className="bi bi-folder-plus" />Archiver
            </button>
          )}
        </div>
      </div>

      {/* ── Onglets ── */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button className={`nav-link d-flex align-items-center gap-2 ${activeTab === 'archives' ? 'active fw-bold' : ''}`}
            onClick={() => setActiveTab('archives')}>
            <i className="bi bi-archive-fill" />Archives
            {totalElements > 0 && <span className="badge bg-secondary rounded-pill" style={{ fontSize:'10px' }}>{totalElements}</span>}
          </button>
        </li>
        {canActivite && (
          <li className="nav-item">
            <button className={`nav-link d-flex align-items-center gap-2 ${activeTab === 'activites' ? 'active fw-bold' : ''}`}
              onClick={() => setActiveTab('activites')}>
              <i className="bi bi-lightning-fill" />Activités
              <span className="badge bg-danger rounded-pill" style={{ fontSize:'10px' }}>{ACTIVITE_DOCS.length}</span>
            </button>
          </li>
        )}
      </ul>

      {/* ══ ONGLET ARCHIVES ══ */}
      {activeTab === 'archives' && (
        <>
          {/* Stats */}
          {stats && (
            <div className="row g-3 mb-4">
              {[
                { label: 'Total',         value: stats.total,         icon: 'bi-archive-fill', color: 'secondary' },
                { label: 'Imprimés',      value: stats.imprimes,      icon: 'bi-printer-fill', color: 'dark'      },
                { label: 'Scannés',       value: stats.scannes,       icon: 'bi-cloud-upload', color: 'primary'   },
                { label: 'Interventions', value: stats.interventions, icon: 'bi-tools',        color: 'info'      },
                { label: 'Déploiements',  value: stats.deploiements,  icon: 'bi-truck',        color: 'warning'   },
              ].map((s, i) => (
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
          )}

          {/* Filtres */}
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-body p-3">
              <div className="row g-3 align-items-center">
                <div className="col-md-4">
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted" /></span>
                    <input type="text" className="form-control border-start-0"
                      placeholder="Titre, code de référence..."
                      value={keyword} onChange={e => { setKeyword(e.target.value); setPage(0); }} />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="d-flex gap-2">
                    <button type="button" className={`btn btn-sm ${filterType === '' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                      onClick={() => { setFilterType(''); setPage(0); }}>Tous</button>
                    {(Object.keys(TYPE_CONFIG) as TypeArchive[]).map(t => (
                      <button key={t} type="button"
                        className={`btn btn-sm ${filterType === t ? `btn-${TYPE_CONFIG[t].color}` : `btn-outline-${TYPE_CONFIG[t].color}`}`}
                        onClick={() => { setFilterType(t); setPage(0); }}>
                        <i className={`bi ${TYPE_CONFIG[t].icon} me-1`} />{TYPE_CONFIG[t].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="col-md-4">
                  <select className="form-select form-select-sm" value={filterCat}
                    onChange={e => { setFilterCat(e.target.value as any); setPage(0); }}>
                    <option value="">Toutes les catégories</option>
                    {Object.entries(CAT_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Liste / Grille */}
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-0">
              {isLoading ? (
                <div className="text-center py-5"><div className="spinner-border text-secondary" /></div>
              ) : archives.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-archive fs-1 d-block mb-2" />Aucun document archivé
                </div>
              ) : viewMode === 'list' ? (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Titre</th><th>Type</th><th>Catégorie</th>
                        <th>Réf.</th><th>Taille</th><th>Archivé par</th>
                        <th>Date</th><th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {archives.map(arch => {
                        const cat   = CAT_CONFIG[arch.categorie] || CAT_CONFIG.AUTRE;
                        const type  = TYPE_CONFIG[arch.type]     || TYPE_CONFIG.IMPRIME;
                                            return (
                          <tr key={arch.id}>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                {arch.downloadUrl ? (() => {
                                  const fi = getFileIcon(arch.mimeType, arch.fileName);
                                  return <i className={`bi ${fi.icon} text-${fi.color} fs-5`} />;
                                })() : <i className="bi bi-printer-fill text-secondary fs-5" />}
                                <div>
                                  <p className="fw-semibold small mb-0">{arch.titre}</p>
                                  {arch.description && <small className="text-muted">{arch.description}</small>}
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={`badge bg-${type.color} bg-opacity-10 text-${type.color}`}>
                                <i className={`bi ${type.icon} me-1`} />{type.label}
                              </span>
                            </td>
                            <td>
                              <span className={`badge bg-${cat.color} bg-opacity-10 text-${cat.color}`}>
                                <i className={`bi ${cat.icon} me-1`} />{cat.label}
                              </span>
                            </td>
                            <td><small className="text-muted font-monospace">{arch.relatedCode || '—'}</small></td>
                            <td><small>{formatSize(arch.fileSize)}</small></td>
                            <td><small className="text-muted">{arch.archivedBy || '—'}</small></td>
                            <td><small>{new Date(arch.archivedAt).toLocaleDateString('fr-FR')}</small></td>
                            <td className="text-end">
                              {arch.downloadUrl && (
                                <button className="btn btn-sm btn-outline-success me-1"
                                  onClick={() => handleDownload(arch)} title="Télécharger">
                                  <i className="bi bi-download" />
                                </button>
                              )}
                              {/* ✅ Bouton Modifier */}
                              {canEdit && (
                                <button className="btn btn-sm btn-outline-warning me-1"
                                  onClick={() => handleEdit(arch)} title="Modifier">
                                  <i className="bi bi-pencil" />
                                </button>
                              )}
                              {canDelete && (
                                <button className="btn btn-sm btn-outline-danger"
                                  onClick={() => { setSelectedId(arch.id); setShowConfirm(true); }}>
                                  <i className="bi bi-trash" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-3 row g-3">
                  {archives.map(arch => renderCard(arch))}
                </div>
              )}
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}

      {/* ══ ONGLET ACTIVITÉS ══ */}
      {activeTab === 'activites' && canActivite && (
        <div>
          <div className="alert alert-info border-0 rounded-4 d-flex align-items-center gap-3 mb-4">
            <i className="bi bi-info-circle-fill fs-5 text-info flex-shrink-0" />
            <div>
              <p className="mb-0 fw-semibold small">Importez vos documents d'activité ou téléchargez les modèles officiels.</p>
              <p className="mb-0 text-muted" style={{ fontSize:'11px' }}>Formats acceptés : PDF, DOC, DOCX, ZIP, RAR, 7Z — Taille max : 30 Mo</p>
            </div>
          </div>
          <div className="row g-4">
            {ACTIVITE_DOCS.map(doc => (
              <div key={doc.key} className="col-md-6 col-lg-4">
                <div className="card border-0 shadow-sm rounded-4 h-100">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div className={`rounded-3 bg-${doc.color} bg-opacity-10 d-flex align-items-center justify-content-center flex-shrink-0`} style={{ width:'48px', height:'48px' }}>
                        <i className={`bi ${doc.icon} text-${doc.color} fs-4`} />
                      </div>
                      <div>
                        <h6 className="fw-bold mb-0">{doc.label}</h6>
                        <small className="text-muted">{doc.description}</small>
                      </div>
                    </div>
                    <div className="d-flex gap-1 mb-4 flex-wrap">
                      {doc.formats.map(f => (
                        <span key={f} className={`badge bg-${doc.color} bg-opacity-10 text-${doc.color}`} style={{ fontSize:'11px' }}>
                          <i className={`bi ${f === 'PDF' ? 'bi-file-earmark-pdf' : 'bi-file-earmark-word'} me-1`} />{f}
                        </span>
                      ))}
                    </div>
                    <div className="d-flex gap-2">
                      <button className={`btn btn-${doc.color} btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-2`}
                        onClick={() => setActivityDoc(doc)}>
                        <i className="bi bi-cloud-upload" />Importer
                      </button>
                      <div className="dropdown">
                        <button className="btn btn-outline-secondary btn-sm dropdown-toggle" data-bs-toggle="dropdown" title="Télécharger un modèle">
                          {templateLoading?.startsWith(doc.key) ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-download" />}
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end shadow border-0 rounded-3">
                          <li><span className="dropdown-item-text small fw-semibold text-muted px-3 py-1">Télécharger modèle</span></li>
                          {doc.formats.map(f => (
                            <li key={f}>
                              <button className="dropdown-item d-flex align-items-center gap-2 small"
                                onClick={() => handleDownloadTemplate(doc, f)} disabled={!!templateLoading}>
                                <i className={`bi ${f === 'PDF' ? 'bi-file-earmark-pdf text-danger' : 'bi-file-earmark-word text-primary'}`} />Modèle {f}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <h6 className="fw-bold mb-3"><i className="bi bi-clock-history text-secondary me-2" />Récemment importés</h6>
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body p-0">
                {isLoading ? (
                  <div className="text-center py-4"><div className="spinner-border spinner-border-sm text-secondary" /></div>
                ) : archives.filter(a => a.categorie === ('ACTIVITE' as any)).length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <i className="bi bi-inbox fs-3 d-block mb-2" />
                    <small>Aucun document d'activité importé pour le moment</small>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr><th>Document</th><th>Taille</th><th>Importé par</th><th>Date</th><th className="text-end">Actions</th></tr>
                      </thead>
                      <tbody>
                        {archives.filter(a => a.categorie === ('ACTIVITE' as any)).slice(0, 8).map(arch => (
                          <tr key={arch.id}>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                {(() => { const fi = getFileIcon(arch.mimeType, arch.fileName); return <i className={`bi ${fi.icon} text-${fi.color} fs-5`} />; })()}
                                <p className="fw-semibold small mb-0">{arch.titre}</p>
                              </div>
                            </td>
                            <td><small>{formatSize(arch.fileSize)}</small></td>
                            <td><small className="text-muted">{arch.archivedBy || '—'}</small></td>
                            <td><small>{new Date(arch.archivedAt).toLocaleDateString('fr-FR')}</small></td>
                            <td className="text-end">
                              {arch.downloadUrl && (
                                <button className="btn btn-sm btn-outline-success me-1" onClick={() => handleDownload(arch)}>
                                  <i className="bi bi-download" />
                                </button>
                              )}
                              {canEdit && (
                                <button className="btn btn-sm btn-outline-warning me-1" onClick={() => handleEdit(arch)} title="Modifier">
                                  <i className="bi bi-pencil" />
                                </button>
                              )}
                              {canDelete && (
                                <button className="btn btn-sm btn-outline-danger"
                                  onClick={() => { setSelectedId(arch.id); setShowConfirm(true); }}>
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
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      <ArchiveFormModal
        show={showForm}
        onHide={() => setShowForm(false)}
        onSuccess={() => { loadArchives(); loadStats(); }}
      />
      {/* ✅ Modal de modification */}
      <ArchiveUpdateModal
        show={showUpdate}
        archive={selectedArchive}
        onHide={() => { setShowUpdate(false); setSelectedArchive(null); }}
        onSuccess={() => { loadArchives(); loadStats(); }}
      />
      <ActivityUploadModal
        show={!!activityDoc}
        docType={activityDoc}
        onHide={() => setActivityDoc(null)}
        onSuccess={() => { loadArchives(); loadStats(); setActivityDoc(null); }}
      />
      <ConfirmModal
        show={showConfirm}
        title="Supprimer l'archive"
        message="Êtes-vous sûr de vouloir supprimer ce document ?"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowConfirm(false)}
        isLoading={deleteLoading}
      />
    </MainLayout>
  );
};

export default ArchivesPage;