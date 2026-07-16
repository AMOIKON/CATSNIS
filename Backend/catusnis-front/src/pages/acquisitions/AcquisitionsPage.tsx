import React, { useState, useEffect, useCallback } from 'react';
import MainLayout             from '../../components/common/MainLayout';
import ConfirmModal           from '../../components/common/ConfirmModal';
import Pagination             from '../../components/common/Pagination';
import AcquisitionFormModal   from './AcquisitionFormModal';
import AcquisitionUpdateModal from './AcquisitionUpdateModal';
import DeploymentFormModal    from '../Deployment/DeploymentFormModal';
import AcquisitionService     from '../../services/acquisitionService';
import { AcquisitionResponse } from '../../types';
import useAuth                from '../../hooks/useAuth';
import { buildHeader, getPrintConfig } from '../../services/globalprintservice';

// ── Types ──────────────────────────────────────────────────────────────────
type Tab = 'liste' | 'parType';

// ── Config statuts ─────────────────────────────────────────────────────────
// ✅ HORS_BASE ajouté — équipement non inventorié, créé automatiquement lors
//    d'une assistance technique (cf. AcquisitionQuickCreateService)
const STATUS_CONFIG: Record<string, { color: string; label: string; icon: string; bg: string }> = {
    'DISPONIBLE':      { color: '#198754', label: 'Disponible',      icon: 'bi-check-circle-fill', bg: 'rgba(25,135,84,0.1)'   },
    'DEPLOYE':         { color: '#6c757d', label: 'Déployé',         icon: 'bi-geo-alt-fill',      bg: 'rgba(108,117,125,0.1)' },
    'NON_FONCTIONNEL': { color: '#dc3545', label: 'Non fonctionnel', icon: 'bi-x-circle-fill',     bg: 'rgba(220,53,69,0.1)'   },
    'HORS_BASE':       { color: '#4f46e5', label: 'Hors base',       icon: 'bi-pencil-square',     bg: 'rgba(79,70,229,0.1)'   },
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const c = STATUS_CONFIG[status] || { color: '#6c757d', label: status, icon: 'bi-question', bg: 'rgba(108,117,125,0.1)' };
    return (
        <span className="d-inline-flex align-items-center gap-1 px-2 py-1 rounded-3 fw-semibold small"
              style={{ color: c.color, backgroundColor: c.bg }}>
            <i className={`bi ${c.icon}`} style={{ fontSize: '11px' }} />
            {c.label}
        </span>
    );
};

const AcquisitionsPage: React.FC = () => {
    const { person, isUnrestricted } = useAuth();
    const role      = person?.role;
    const canCreate = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'TECHNICIEN';
    const canEdit   = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'TECHNICIEN';
    const canDelete = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'TECHNICIEN';
    const canDeploy = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'TECHNICIEN';

    const [activeTab,         setActiveTab]         = useState<Tab>('liste');
    const [activeTypeFilter,  setActiveTypeFilter]  = useState<string | undefined>(undefined);
    const [acquisitions,      setAcquisitions]      = useState<AcquisitionResponse[]>([]);
    const [totalPages,        setTotalPages]        = useState(0);
    const [totalElements,     setTotalElements]     = useState(0);
    const [page,              setPage]              = useState(0);
    const [keyword,           setKeyword]           = useState('');
    const [filterStatus,      setFilterStatus]      = useState('');
    const [isLoading,         setIsLoading]         = useState(false);
    const [isPrinting,        setIsPrinting]        = useState(false);
    const [showForm,          setShowForm]          = useState(false);
    const [showUpdate,        setShowUpdate]        = useState(false);
    const [showConfirm,       setShowConfirm]       = useState(false);
    const [showDeploy,        setShowDeploy]        = useState(false);
    const [selectedId,        setSelectedId]        = useState<number | null>(null);
    const [selected,          setSelected]          = useState<AcquisitionResponse | null>(null);
    const [selectedForDeploy, setSelectedForDeploy] = useState<AcquisitionResponse | null>(null);
    const [deleteLoading,     setDeleteLoading]     = useState(false);
    const [allAcq,            setAllAcq]            = useState<AcquisitionResponse[]>([]);

    // ✅ status filtré côté serveur désormais (au lieu d'un filtre client sur la page chargée uniquement)
    const loadAcquisitions = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await AcquisitionService.getAll(page, 10, keyword || undefined, filterStatus || undefined);
            setAcquisitions(data.content);
            setTotalPages(data.page.totalPages);
            setTotalElements(data.page.totalElements);
        } catch (err) { console.error(err); }
        finally { setIsLoading(false); }
    }, [page, keyword, filterStatus]);

    const loadAllForStats = useCallback(async () => {
        try {
            const data = await AcquisitionService.getAll(0, 1000);
            setAllAcq(data.content);
        } catch { /* silencieux */ }
    }, []);

    useEffect(() => { loadAcquisitions(); }, [loadAcquisitions]);
    useEffect(() => { loadAllForStats();  }, [loadAllForStats]);

    const handleDeleteConfirm = async () => {
        if (!selectedId) return;
        setDeleteLoading(true);
        try { await AcquisitionService.delete(selectedId); loadAcquisitions(); loadAllForStats(); }
        catch (err) { console.error(err); }
        finally { setDeleteLoading(false); setShowConfirm(false); setSelectedId(null); }
    };

    const handleDeployClick = (acq: AcquisitionResponse) => {
        setSelectedForDeploy(acq); setShowDeploy(true);
    };

    // ✅ Impression globale — liste (respecte filtres keyword + statut + type)
    const handlePrintAll = async () => {
        setIsPrinting(true);
        try {
            const raw = await AcquisitionService.getAllForPrint(keyword || undefined, filterStatus || undefined);
            // Filtre local restant : le type (nom), non géré côté backend
            const all = raw.filter(a => !activeTypeFilter || a.Type === activeTypeFilter);

            const cfg = getPrintConfig();
            let titre = 'Liste des acquisitions';
            if (activeTypeFilter) titre += ` — ${activeTypeFilter}`;
            if (filterStatus)     titre += ` (${STATUS_CONFIG[filterStatus]?.label || filterStatus})`;
            const header = buildHeader(titre, cfg);

            const rows = all.map((acq, i) => `
                <tr>
                    <td style="color:#6c757d;font-size:10px;">${i + 1}</td>
                    <td style="font-weight:500;">${acq.tag || '—'}</td>
                    <td style="font-family:monospace;font-size:10px;">${acq.serial || '—'}</td>
                    <td><span style="background:#fff3cd;color:#856404;padding:1px 8px;border-radius:20px;font-size:10px;">${acq.Type || '—'}</span></td>
                    <td style="font-size:10px;">${new Date(acq.dateAcq).toLocaleDateString('fr-FR')}</td>
                    <td style="text-align:center;">${acq.quantity}</td>
                    <td><span style="font-size:10px;font-weight:600;color:${
                        acq.status === 'DISPONIBLE'      ? '#198754' :
                        acq.status === 'NON_FONCTIONNEL' ? '#dc3545' :
                        acq.status === 'HORS_BASE'       ? '#4f46e5' : '#6c757d'
                    };">${STATUS_CONFIG[acq.status || '']?.label || acq.status || '—'}</span></td>
                    <td style="font-size:10px;">${acq.partnerName || '—'}</td>
                </tr>`).join('');

            const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
                <title>Acquisitions — CATUSNIS</title>
                <style>
                    @page { margin:1.5cm; size:A4 landscape; }
                    body  { font-family:Arial,sans-serif; color:#333; margin:0; }
                    .total { font-size:12px; color:#6c757d; margin:8px 0 16px; }
                    table { width:100%; border-collapse:collapse; }
                    th  { background:#f8f9fa; border:1px solid #dee2e6; padding:7px 8px; font-size:11px; text-align:left; }
                    td  { border:1px solid #dee2e6; padding:7px 8px; font-size:11px; }
                    tr:nth-child(even) { background:#f9f9f9; }
                </style></head>
                <body>
                ${header}
                <p class="total">${all.length} acquisition(s) au total</p>
                <table>
                    <thead>
                        <tr>
                            <th>#</th><th>Tag</th><th>N° Série</th><th>Type</th>
                            <th>Date acq.</th><th style="text-align:center">Qté</th>
                            <th>Statut</th><th>Partenaire</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
                </body></html>`;

            const win = window.open('', '_blank', 'width=900,height=700');
            if (!win) { alert('Veuillez autoriser les popups pour imprimer.'); return; }
            win.document.write(html); win.document.close();
            win.onload = () => { win.focus(); win.print(); win.close(); };
        } catch (err) { console.error(err); }
        finally { setIsPrinting(false); }
    };

    // ✅ Impression vue "Par type" (utilise allAcq déjà chargé)
    const handlePrintParType = () => {
        const cfg = getPrintConfig();
        const header = buildHeader('Acquisitions par type', cfg);

        const rows = parTypeData.map((t, i) => {
            const pct = t.total > 0 ? Math.round((t.dispo / t.total) * 100) : 0;
            return `<tr>
                <td style="color:#6c757d;font-size:10px;">${i + 1}</td>
                <td style="font-weight:500;">${t.type}</td>
                <td style="text-align:center;font-weight:bold;color:#fd7e14;">${t.total}</td>
                <td style="text-align:center;font-weight:bold;color:#198754;">${t.dispo}</td>
                <td style="text-align:center;font-weight:bold;color:#6c757d;">${t.dep}</td>
                <td style="text-align:center;font-weight:bold;color:#dc3545;">${t.nf}</td>
                <td style="text-align:center;">${pct}%</td>
            </tr>`;
        }).join('');

        const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
            <title>Acquisitions par type — CATUSNIS</title>
            <style>
                @page { margin:1.5cm; size:A4 portrait; }
                body  { font-family:Arial,sans-serif; color:#333; margin:0; }
                .total { font-size:12px; color:#6c757d; margin:8px 0 16px; }
                table { width:100%; border-collapse:collapse; }
                th  { background:#f8f9fa; border:1px solid #dee2e6; padding:8px 10px; font-size:11px; text-align:left; }
                td  { border:1px solid #dee2e6; padding:8px 10px; font-size:11px; }
                tr:nth-child(even) { background:#f9f9f9; }
            </style></head>
            <body>
            ${header}
            <p class="total">${parTypeData.length} type(s) — ${allAcq.length} acquisitions au total</p>
            <table>
                <thead>
                    <tr>
                        <th>#</th><th>Type d'équipement</th>
                        <th style="text-align:center">Total</th>
                        <th style="text-align:center">Disponibles</th>
                        <th style="text-align:center">Déployés</th>
                        <th style="text-align:center">Non fonct.</th>
                        <th style="text-align:center">Dispo%</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
            </body></html>`;

        const win = window.open('', '_blank', 'width=800,height=700');
        if (!win) { alert('Veuillez autoriser les popups pour imprimer.'); return; }
        win.document.write(html); win.document.close();
        win.onload = () => { win.focus(); win.print(); win.close(); };
    };

    // ── Stats cards ──────────────────────────────────────────────────────────
    // ✅ Carte "Hors base" ajoutée
    const statsCards = [
        { label: 'Total',            value: allAcq.length,                                             icon: 'bi-box-seam-fill',     color: 'warning'   },
        { label: 'Disponibles',      value: allAcq.filter(a => a.status === 'DISPONIBLE').length,      icon: 'bi-check-circle-fill', color: 'success'   },
        { label: 'Déployés',         value: allAcq.filter(a => a.status === 'DEPLOYE').length,         icon: 'bi-geo-alt-fill',      color: 'secondary' },
        { label: 'Non fonctionnels', value: allAcq.filter(a => a.status === 'NON_FONCTIONNEL').length, icon: 'bi-x-circle-fill',     color: 'danger'    },
        { label: 'Hors base',        value: allAcq.filter(a => a.status === 'HORS_BASE').length,       icon: 'bi-pencil-square',     color: 'indigo'    },
    ];

    // ── Stats par type (cliquables) ──────────────────────────────────────────
    const types = Array.from(new Set(allAcq.map(a => a.Type))).filter(Boolean);
    const statsParType = types.map(t => ({
        key:   t,
        label: t,
        count: allAcq.filter(a => a.Type === t).length,
        dispo: allAcq.filter(a => a.Type === t && a.status === 'DISPONIBLE').length,
    }));

    // ── Filtre local (uniquement le type — le statut est désormais filtré côté serveur) ──
    const filtered = acquisitions.filter(a => !activeTypeFilter || a.Type === activeTypeFilter);

    // ── Vue par type ─────────────────────────────────────────────────────────
    const parTypeData = types.map(t => ({
        type:  t,
        total: allAcq.filter(a => a.Type === t).length,
        dispo: allAcq.filter(a => a.Type === t && a.status === 'DISPONIBLE').length,
        dep:   allAcq.filter(a => a.Type === t && a.status === 'DEPLOYE').length,
        nf:    allAcq.filter(a => a.Type === t && a.status === 'NON_FONCTIONNEL').length,
    }));

    return (
        <MainLayout title="Acquisitions">
            {/* ── Header ── */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 className="fw-bold mb-0">
                        <i className="bi bi-box-seam-fill text-warning me-2" />
                        Gestion des acquisitions
                    </h5>
                    <small className="text-muted">
                        {totalElements} acquisition(s) au total
                        {!isUnrestricted && person?.partnerName && (
                            <span className="badge bg-warning bg-opacity-10 text-warning ms-2">
                                <i className="bi bi-funnel-fill me-1" />{person.partnerName}
                            </span>
                        )}
                    </small>
                </div>
                <div className="d-flex gap-2 align-items-center">
                    {/* ✅ Bouton Imprimer — liste */}
                    {activeTab === 'liste' && (
                        <button
                            className="btn btn-outline-secondary d-flex align-items-center gap-2"
                            onClick={handlePrintAll}
                            disabled={isPrinting}
                            title="Imprimer toutes les acquisitions">
                            {isPrinting ? (
                                <><span className="spinner-border spinner-border-sm" role="status" />Chargement...</>
                            ) : (
                                <><i className="bi bi-printer" />Imprimer</>
                            )}
                        </button>
                    )}
                    {/* ✅ Bouton Imprimer — par type */}
                    {activeTab === 'parType' && (
                        <button
                            className="btn btn-outline-secondary d-flex align-items-center gap-2"
                            onClick={handlePrintParType}
                            title="Imprimer le résumé par type">
                            <i className="bi bi-printer" />Imprimer par type
                        </button>
                    )}
                    {canCreate && (
                        <button className="btn btn-warning text-white d-flex align-items-center gap-2"
                            onClick={() => setShowForm(true)}>
                            <i className="bi bi-plus-circle-fill" /> Nouvelle acquisition
                        </button>
                    )}
                </div>
            </div>

            {/* ── Stats cards ── */}
            <div className="row g-3 mb-3">
                {statsCards.map((s, i) => {
                    const isIndigo = s.color === 'indigo';
                    return (
                        <div key={i} className="col-6 col-md-3">
                            <div className="card border-0 shadow-sm rounded-4 h-100">
                                <div className="card-body p-3 d-flex align-items-center gap-3">
                                    <div className={!isIndigo ? `rounded-3 bg-${s.color} bg-opacity-10 d-flex align-items-center justify-content-center` : 'rounded-3 d-flex align-items-center justify-content-center'}
                                        style={{ width: '44px', height: '44px', minWidth: '44px', ...(isIndigo ? { background: 'rgba(79,70,229,0.1)' } : {}) }}>
                                        <i className={`bi ${s.icon} ${!isIndigo ? `text-${s.color}` : ''}`} style={isIndigo ? { color: '#4f46e5' } : undefined} />
                                    </div>
                                    <div>
                                        <p className="mb-0 text-muted small">{s.label}</p>
                                        <h5 className="fw-bold mb-0">{s.value}</h5>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Stats par type (cliquables) ── */}
            {statsParType.length > 0 && (
                <div className="row g-2 mb-4">
                    {statsParType.map((s, i) => {
                        const isActive = activeTypeFilter === s.key;
                        return (
                            <div key={i} className="col-6 col-md">
                                <div
                                    className={`card rounded-4 h-100 ${isActive ? 'bg-warning shadow' : 'border-0 shadow-sm'}`}
                                    style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                                    onClick={() => { setActiveTypeFilter(isActive ? undefined : s.key); setActiveTab('liste'); setPage(0); }}>
                                    <div className="card-body p-2 d-flex align-items-center gap-2">
                                        <div className={`rounded-3 d-flex align-items-center justify-content-center ${isActive ? 'bg-white bg-opacity-25' : 'bg-warning bg-opacity-10'}`}
                                            style={{ width: '36px', height: '36px', minWidth: '36px' }}>
                                            <i className={`bi bi-box-seam ${isActive ? 'text-white' : 'text-warning'} small`} />
                                        </div>
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="mb-0 text-truncate" style={{ fontSize: '10px', color: isActive ? 'rgba(255,255,255,0.8)' : '#6c757d' }}>
                                                {s.label}
                                            </p>
                                            <span className={`fw-bold small ${isActive ? 'text-white' : 'text-warning'}`}>{s.count}</span>
                                            <span style={{ fontSize: '10px', color: isActive ? 'rgba(255,255,255,0.7)' : '#6c757d' }}> ({s.dispo} dispo)</span>
                                        </div>
                                        {isActive && <i className="bi bi-check-circle-fill text-white small" />}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Onglets ── */}
            <ul className="nav nav-tabs mb-4">
                {([
                    { key: 'liste',   label: 'Liste',    icon: 'bi-list-ul'        },
                    { key: 'parType', label: 'Par type', icon: 'bi-bar-chart-fill' },
                ] as { key: Tab; label: string; icon: string }[]).map(tab => (
                    <li key={tab.key} className="nav-item">
                        <button
                            className={`nav-link d-flex align-items-center gap-2 ${activeTab === tab.key ? 'active fw-bold' : ''}`}
                            onClick={() => setActiveTab(tab.key)}>
                            <i className={`bi ${tab.icon}`} />{tab.label}
                        </button>
                    </li>
                ))}
            </ul>

            {/* ══ TAB Liste ══════════════════════════════════════════════════ */}
            {activeTab === 'liste' && (
                <>
                    {/* Filtres statut — HORS_BASE inclus automatiquement (boucle sur STATUS_CONFIG) */}
                    <div className="d-flex gap-2 mb-3 flex-wrap align-items-center">
                        <button
                            className={`btn btn-sm ${filterStatus === '' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                            onClick={() => { setFilterStatus(''); setPage(0); }}>
                            Tous
                        </button>
                        {Object.entries(STATUS_CONFIG).map(([key, conf]) => (
                            <button key={key}
                                className={`btn btn-sm ${filterStatus === key ? 'text-white' : ''}`}
                                style={{
                                    backgroundColor: filterStatus === key ? conf.color : 'white',
                                    borderColor: conf.color,
                                    color: filterStatus === key ? 'white' : conf.color,
                                }}
                                onClick={() => { setFilterStatus(filterStatus === key ? '' : key); setPage(0); }}>
                                <i className={`bi ${conf.icon} me-1`} />{conf.label}
                                <span className="badge ms-1 rounded-pill"
                                    style={{ backgroundColor: filterStatus === key ? 'rgba(255,255,255,0.3)' : conf.color, color: 'white' }}>
                                    {allAcq.filter(a => a.status === key).length}
                                </span>
                            </button>
                        ))}
                        {activeTypeFilter && (
                            <span className="badge bg-warning d-inline-flex align-items-center gap-2 px-3 py-2"
                                style={{ fontSize: '13px' }}>
                                <i className="bi bi-box-seam" />
                                {activeTypeFilter}
                                <span className="ms-1" style={{ fontSize: '11px', opacity: 0.8 }}>
                                    ({allAcq.filter(a => a.Type === activeTypeFilter).length})
                                </span>
                                <button className="btn-close btn-close-white ms-1" style={{ fontSize: '10px' }}
                                    onClick={() => setActiveTypeFilter(undefined)} />
                            </span>
                        )}
                    </div>

                    {/* ✅ Info contextuelle quand le filtre Hors base est actif */}
                    {filterStatus === 'HORS_BASE' && (
                        <div className="alert alert-secondary border-0 rounded-3 small mb-3" style={{ background: 'rgba(79,70,229,0.08)', color: '#4338ca' }}>
                            <i className="bi bi-info-circle me-2" />
                            Ces équipements ont été enregistrés automatiquement lors d'assistances techniques
                            sur du matériel non inventorié. Pensez à les compléter (tag réel, numéro de série)
                            si vous souhaitez les intégrer officiellement à l'inventaire.
                        </div>
                    )}

                    {/* Recherche */}
                    <div className="card border-0 shadow-sm rounded-4 mb-4">
                        <div className="card-body p-3">
                            <div className="input-group">
                                <span className="input-group-text bg-white border-end-0">
                                    <i className="bi bi-search text-muted" />
                                </span>
                                <input type="text" className="form-control border-start-0"
                                    placeholder="Rechercher par tag, numéro de série, type..."
                                    value={keyword}
                                    onChange={e => { setKeyword(e.target.value); setPage(0); }} />
                                {keyword && (
                                    <button className="btn btn-outline-secondary" onClick={() => setKeyword('')}>
                                        <i className="bi bi-x-lg" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tableau */}
                    <div id="acquisitions-table" className="card border-0 shadow-sm rounded-4">
                        <div className="card-body p-0">
                            {isLoading ? (
                                <div className="text-center py-5"><div className="spinner-border text-warning" /></div>
                            ) : filtered.length === 0 ? (
                                <div className="text-center py-5 text-muted">
                                    <i className="bi bi-box-seam fs-1 d-block mb-2" />
                                    {activeTypeFilter ? `Aucune acquisition de type ${activeTypeFilter}` : 'Aucune acquisition trouvée'}
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>#</th><th>Tag</th><th>N° Série</th><th>Type</th>
                                                <th>Date acquisition</th><th>Quantité</th><th>Statut</th>
                                                {isUnrestricted && <th>Partenaire</th>}
                                                {(canEdit || canDelete || canDeploy) && (
                                                    <th className="text-end no-print">Actions</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered.map((acq, i) => {
                                                const isDisponible = acq.status === 'DISPONIBLE';
                                                const grised       = !isDisponible;
                                                return (
                                                    <tr key={acq.id} style={{
                                                        opacity:         grised ? 0.5 : 1,
                                                        backgroundColor: grised ? '#f0f0f0' : 'white',
                                                        transition:      'opacity 0.2s, background-color 0.2s',
                                                    }}>
                                                        <td className="text-muted small">{page * 10 + i + 1}</td>
                                                        <td>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <div className="rounded-circle d-flex align-items-center justify-content-center"
                                                                    style={{ width: '35px', height: '35px', minWidth: '35px',
                                                                        background: grised ? 'rgba(108,117,125,0.1)' : 'rgba(255,193,7,0.1)' }}>
                                                                    <i className={`bi bi-box-seam ${grised ? 'text-secondary' : 'text-warning'}`} />
                                                                </div>
                                                                <div>
                                                                    <span className={`fw-semibold d-block ${grised ? 'text-muted' : ''}`}>{acq.tag}</span>
                                                                    {acq.status === 'DEPLOYE' && (
                                                                        <small className="text-secondary" style={{ fontSize: '10px' }}>
                                                                            <i className="bi bi-geo-alt-fill me-1" />Déployé
                                                                        </small>
                                                                    )}
                                                                    {acq.status === 'HORS_BASE' && (
                                                                        <small style={{ fontSize: '10px', color: '#4f46e5' }}>
                                                                            <i className="bi bi-pencil-square me-1" />Assistance technique
                                                                        </small>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="text-muted small">{acq.serial}</td>
                                                        <td>
                                                            <span className={`badge ${grised ? 'bg-secondary bg-opacity-10 text-secondary' : 'bg-warning bg-opacity-10 text-warning'}`}>
                                                                {acq.Type}
                                                            </span>
                                                        </td>
                                                        <td className="text-muted small">
                                                            {new Date(acq.dateAcq).toLocaleDateString('fr-FR')}
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${grised ? 'bg-secondary bg-opacity-10 text-secondary' : 'bg-primary bg-opacity-10 text-primary'}`}>
                                                                {acq.quantity}
                                                            </span>
                                                        </td>
                                                        <td><StatusBadge status={acq.status || 'DISPONIBLE'} /></td>
                                                        {isUnrestricted && (
                                                            <td>
                                                                {acq.partnerName
                                                                    ? <span className="badge bg-warning bg-opacity-10 text-warning">{acq.partnerName}</span>
                                                                    : <span className="text-muted small">—</span>}
                                                            </td>
                                                        )}
                                                        {(canEdit || canDelete || canDeploy) && (
                                                            <td className="text-end no-print">
                                                                {canDeploy && isDisponible && (
                                                                    <button className="btn btn-sm btn-outline-primary me-1"
                                                                        onClick={() => handleDeployClick(acq)}
                                                                        title="Déployer cet équipement">
                                                                        <i className="bi bi-truck" />
                                                                    </button>
                                                                )}
                                                                {canEdit && (
                                                                    <button className="btn btn-sm btn-outline-warning me-1"
                                                                        onClick={() => { setSelected(acq); setShowUpdate(true); }}
                                                                        disabled={acq.deployed}
                                                                        title={acq.deployed ? 'Impossible de modifier un équipement déployé' : 'Modifier'}>
                                                                        <i className="bi bi-pencil" />
                                                                    </button>
                                                                )}
                                                                {canDelete && (
                                                                    <button className="btn btn-sm btn-outline-danger"
                                                                        onClick={() => { setSelectedId(acq.id); setShowConfirm(true); }}
                                                                        disabled={acq.deployed}
                                                                        title={acq.deployed ? 'Impossible de supprimer un équipement déployé' : 'Supprimer'}>
                                                                        <i className="bi bi-trash" />
                                                                    </button>
                                                                )}
                                                            </td>
                                                        )}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                    </div>
                </>
            )}

            {/* ══ TAB Par type ══════════════════════════════════════════════ */}
            {activeTab === 'parType' && (
                <div id="partype-table" className="card border-0 shadow-sm rounded-4">
                    <div className="card-body p-0">
                        {parTypeData.length === 0 ? (
                            <div className="text-center py-5 text-muted">
                                <i className="bi bi-box-seam fs-1 d-block mb-2" />
                                Aucun type d'équipement
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>#</th><th>Type d'équipement</th>
                                            <th className="text-center">Total</th>
                                            <th className="text-center"><span className="text-success">Disponibles</span></th>
                                            <th className="text-center"><span className="text-secondary">Déployés</span></th>
                                            <th className="text-center"><span className="text-danger">Non fonct.</span></th>
                                            <th>Disponibilité</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parTypeData.map((t, i) => {
                                            const pct = t.total > 0 ? Math.round((t.dispo / t.total) * 100) : 0;
                                            return (
                                                <tr key={t.type} style={{ cursor: 'pointer' }}
                                                    onClick={() => { setActiveTypeFilter(t.type); setActiveTab('liste'); }}>
                                                    <td className="text-muted small">{i + 1}</td>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div className="rounded-3 bg-warning bg-opacity-10 d-flex align-items-center justify-content-center"
                                                                style={{ width: '38px', height: '38px', minWidth: '38px' }}>
                                                                <i className="bi bi-box-seam text-warning" />
                                                            </div>
                                                            <span className="fw-semibold">{t.type}</span>
                                                        </div>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="badge bg-warning bg-opacity-10 text-warning fw-bold">{t.total}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="badge bg-success bg-opacity-10 text-success fw-bold">{t.dispo}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="badge bg-secondary bg-opacity-10 text-secondary fw-bold">{t.dep}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="badge bg-danger bg-opacity-10 text-danger fw-bold">{t.nf}</span>
                                                    </td>
                                                    <td style={{ minWidth: '150px' }}>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div className="progress flex-grow-1" style={{ height: '8px' }}>
                                                                <div className={`progress-bar ${pct > 66 ? 'bg-success' : pct > 33 ? 'bg-warning' : 'bg-danger'}`}
                                                                    style={{ width: `${pct}%` }} />
                                                            </div>
                                                            <small className="text-muted fw-semibold" style={{ minWidth: '35px' }}>{pct}%</small>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="table-light fw-bold">
                                        <tr>
                                            <td colSpan={2} className="text-end">Total</td>
                                            <td className="text-center">
                                                <span className="badge bg-warning bg-opacity-10 text-warning fw-bold">{allAcq.length}</span>
                                            </td>
                                            <td className="text-center">
                                                <span className="badge bg-success bg-opacity-10 text-success fw-bold">
                                                    {allAcq.filter(a => a.status === 'DISPONIBLE').length}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <span className="badge bg-secondary bg-opacity-10 text-secondary fw-bold">
                                                    {allAcq.filter(a => a.status === 'DEPLOYE').length}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <span className="badge bg-danger bg-opacity-10 text-danger fw-bold">
                                                    {allAcq.filter(a => a.status === 'NON_FONCTIONNEL').length}
                                                </span>
                                            </td>
                                            <td />
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Modals ── */}
            <AcquisitionFormModal
                show={showForm}
                onHide={() => setShowForm(false)}
                onSuccess={() => { loadAcquisitions(); loadAllForStats(); }}
            />
            <AcquisitionUpdateModal
                show={showUpdate}
                onHide={() => { setShowUpdate(false); setSelected(null); }}
                onSuccess={() => { loadAcquisitions(); loadAllForStats(); }}
                acquisition={selected}
            />
            <DeploymentFormModal
                show={showDeploy}
                onHide={() => { setShowDeploy(false); setSelectedForDeploy(null); }}
                onSuccess={() => { loadAcquisitions(); loadAllForStats(); }}
                preselectedAcquisition={selectedForDeploy}
            />
            <ConfirmModal
                show={showConfirm}
                title="Supprimer l'acquisition"
                message="Êtes-vous sûr de vouloir supprimer cette acquisition ? Cette action est irréversible."
                onConfirm={handleDeleteConfirm}
                onCancel={() => setShowConfirm(false)}
                isLoading={deleteLoading}
            />
        </MainLayout>
    );
};

export default AcquisitionsPage;