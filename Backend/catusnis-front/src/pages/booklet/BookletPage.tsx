import React, { useState, useEffect, useCallback } from 'react';
import MainLayout         from '../../components/common/MainLayout';
import ConfirmModal       from '../../components/common/ConfirmModal';
import BookletFormModal   from './BookletFormModal';
import BookletUpdateModal from './BookletUpdateModal';
import BookletService     from '../../services/bookletService';
import { Booklet }        from '../../types';
import useAuth            from '../../hooks/useAuth';
import Pagination         from '../../components/common/Pagination';
import { buildHeader, getPrintConfig } from '../../services/globalprintservice';

// ── Badge statut ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
    'Affecté':        { color: '#198754', bg: 'rgba(25,135,84,0.1)',   icon: 'bi-check-circle-fill'  },
    'Réaffecté':      { color: '#fd7e14', bg: 'rgba(253,126,20,0.1)',  icon: 'bi-arrow-repeat'       },
    'Actif':          { color: '#0d6efd', bg: 'rgba(13,110,253,0.1)',  icon: 'bi-circle-fill'        },
    'Inactif':        { color: '#6c757d', bg: 'rgba(108,117,125,0.1)', icon: 'bi-dash-circle-fill'   },
    'En attente':     { color: '#ffc107', bg: 'rgba(255,193,7,0.1)',   icon: 'bi-clock-fill'         },
    'Suspendu':       { color: '#6f42c1', bg: 'rgba(111,66,193,0.1)',  icon: 'bi-pause-circle-fill'  },
    'Pas en service': { color: '#dc3545', bg: 'rgba(220,53,69,0.1)',   icon: 'bi-x-circle-fill'      },
};

const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
    if (!status) return <span className="text-muted small">—</span>;
    const c = STATUS_CONFIG[status] || { color: '#6c757d', bg: 'rgba(108,117,125,0.1)', icon: 'bi-question-circle' };
    return (
        <span className="d-inline-flex align-items-center gap-1 px-2 py-1 rounded-3 fw-semibold small"
              style={{ color: c.color, backgroundColor: c.bg }}>
            <i className={`bi ${c.icon}`} style={{ fontSize: '10px' }} />
            {status}
        </span>
    );
};

const BookletPage: React.FC = () => {
    const { person } = useAuth();
    const role      = person?.role;
    const canCreate = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'TECHNICIEN';
    const canEdit   = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'TECHNICIEN';
    const canDelete = role === 'SUPER_ADMIN' || role === 'ADMIN';

    const [booklets,      setBooklets]      = useState<Booklet[]>([]);
    const [totalElements, setTotalElements] = useState(0);
    const [page,          setPage]          = useState(0);
    const [keyword,       setKeyword]       = useState('');
    const [filterStatus,  setFilterStatus]  = useState('');
    const [isLoading,     setIsLoading]     = useState(false);
    const [isPrinting,    setIsPrinting]    = useState(false);
    const [showForm,      setShowForm]      = useState(false);
    const [showUpdate,    setShowUpdate]    = useState(false);
    const [showConfirm,   setShowConfirm]   = useState(false);
    const [selected,      setSelected]      = useState<Booklet | null>(null);
    const [selectedId,    setSelectedId]    = useState<number | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [pdfLoading,    setPdfLoading]    = useState<number | null>(null);

    const loadBooklets = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = keyword.trim()
                ? await BookletService.search(keyword)
                : await BookletService.getAll();
            const safeData = Array.isArray(data) ? data : [];
            setBooklets(safeData);
            setTotalElements(safeData.length);
        } catch (err) {
            console.error(err);
            setBooklets([]);
            setTotalElements(0);
        } finally {
            setIsLoading(false);
        }
    }, [keyword]);

    useEffect(() => { loadBooklets(); }, [loadBooklets]);

    const handleSearch      = (e: React.ChangeEvent<HTMLInputElement>) => { setKeyword(e.target.value); setPage(0); };
    const handleEditClick   = (b: Booklet) => { setSelected(b); setShowUpdate(true); };
    const handleDeleteClick = (id: number) => { setSelectedId(id); setShowConfirm(true); };

    const handleDeleteConfirm = async () => {
        if (!selectedId) return;
        setDeleteLoading(true);
        try { await BookletService.delete(selectedId); loadBooklets(); }
        catch (err) { console.error(err); }
        finally { setDeleteLoading(false); setShowConfirm(false); setSelectedId(null); }
    };

    const handleDownloadPdf = async (id: number, lastName: string) => {
        setPdfLoading(id);
        try { await BookletService.downloadPdf(id, lastName); }
        catch (err) { console.error(err); }
        finally { setPdfLoading(null); }
    };

    // ✅ Impression globale — charge TOUS les booklets puis filtre par statut actif
    const handlePrintAll = async () => {
        setIsPrinting(true);
        try {
            const all = await BookletService.getAllForPrint();
            // Appliquer le filtre statut actif
            const filtered = filterStatus
                ? all.filter(b => b.status?.statusName === filterStatus)
                : all;

            const cfg = getPrintConfig();
            const titre = filterStatus
                ? `Liste des Booklets — ${filterStatus}`
                : 'Liste des Booklets';
            const header = buildHeader(titre, cfg);

            const rows = filtered.map((b, i) => `
                <tr>
                    <td style="color:#6c757d;font-size:10px;">${i + 1}</td>
                    <td style="font-weight:500;">${b.lastName || ''} ${b.firstName || ''}</td>
                    <td style="color:#6c757d;font-size:10px;">${b.contact || '—'}</td>
                    <td style="color:#6c757d;font-size:10px;">${b.email || '—'}</td>
                    <td><span style="background:#d1e7dd;color:#0a3622;padding:1px 8px;border-radius:20px;font-size:10px;">${b.region?.regionName || '—'}</span></td>
                    <td style="color:#6c757d;font-size:10px;">${b.district?.districtName || '—'}</td>
                    <td><span style="background:#e2e3e5;color:#383d41;padding:1px 8px;border-radius:20px;font-size:10px;">${b.post?.postName || '—'}</span></td>
                    <td><span style="font-size:10px;color:${STATUS_CONFIG[b.status?.statusName || '']?.color || '#6c757d'}">${b.status?.statusName || '—'}</span></td>
                </tr>`).join('');

            const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
                <title>Booklets — CATUSNIS</title>
                <style>@page{margin:1.5cm;size:A4 landscape}body{font-family:Arial,sans-serif;color:#333;margin:0}
                .total{font-size:12px;color:#6c757d;margin:8px 0 16px}table{width:100%;border-collapse:collapse}
                th{background:#f8f9fa;border:1px solid #dee2e6;padding:6px 8px;font-size:10px;text-align:left}
                td{border:1px solid #dee2e6;padding:6px 8px;font-size:11px}tr:nth-child(even){background:#f9f9f9}
                </style></head>
                <body>${header}<p class="total">${filtered.length} booklet(s)${filterStatus ? ' — Filtre: ' + filterStatus : ''}</p>
                <table><thead><tr><th>#</th><th>Nom & Prénom</th><th>Contact</th><th>Email</th><th>Région</th><th>District</th><th>Poste</th><th>Statut</th></tr></thead>
                <tbody>${rows}</tbody></table></body></html>`;

            const win = window.open('', '_blank', 'width=900,height=700');
            if (!win) { alert('Veuillez autoriser les popups.'); return; }
            win.document.write(html); win.document.close();
            win.onload = () => { win.focus(); win.print(); win.close(); };
        } catch (err) { console.error(err); }
        finally { setIsPrinting(false); }
    };

    // Filtre local par statut + pagination
    const pageSize   = 10;
    const safeList   = Array.isArray(booklets) ? booklets : [];
    const filtered   = filterStatus ? safeList.filter(b => b.status?.statusName === filterStatus) : safeList;
    const totalPages = Math.ceil(filtered.length / pageSize);
    const paginated  = filtered.slice(page * pageSize, page * pageSize + pageSize);

    const counts = safeList.reduce<Record<string, number>>((acc, b) => {
        const s = b.status?.statusName || 'Inconnu';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
    }, {});

    return (
        <MainLayout title="Booklets">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 className="fw-bold mb-0">Liste des Booklets</h5>
                    <small className="text-muted">{totalElements} booklet(s) au total</small>
                </div>
                <div className="d-flex gap-2 align-items-center">
                    {/* ✅ Imprimer tous (respecte le filtre statut actif) */}
                    <button className="btn btn-outline-secondary d-flex align-items-center gap-2 no-print"
                        onClick={handlePrintAll} disabled={isPrinting}>
                        {isPrinting
                            ? <><span className="spinner-border spinner-border-sm" role="status" />Chargement...</>
                            : <><i className="bi bi-printer-fill" /><span>Imprimer</span></>}
                    </button>
                    {canCreate && (
                        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => setShowForm(true)}>
                            <i className="bi bi-plus-circle-fill" />Nouveau Booklet
                        </button>
                    )}
                </div>
            </div>

            {/* Compteurs statuts */}
            <div className="row g-3 mb-4">
                {Object.entries(STATUS_CONFIG).map(([status, conf]) => (
                    counts[status] ? (
                        <div className="col-auto" key={status}>
                            <button
                                className={`btn btn-sm border rounded-3 px-3 py-2 ${filterStatus === status ? 'fw-bold shadow-sm' : ''}`}
                                style={{ color: conf.color, backgroundColor: filterStatus === status ? conf.bg : 'white', borderColor: conf.color }}
                                onClick={() => { setFilterStatus(filterStatus === status ? '' : status); setPage(0); }}>
                                <i className={`bi ${conf.icon} me-1`} />
                                {status}
                                <span className="badge ms-2 rounded-pill" style={{ backgroundColor: conf.color }}>{counts[status]}</span>
                            </button>
                        </div>
                    ) : null
                ))}
            </div>

            {/* Recherche */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-body p-3">
                    <div className="input-group">
                        <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted" /></span>
                        <input type="text" className="form-control border-start-0"
                            placeholder="Rechercher par nom ou prénom..."
                            value={keyword} onChange={handleSearch} />
                        {keyword && (
                            <button className="btn btn-outline-secondary" onClick={() => setKeyword('')}>
                                <i className="bi bi-x-lg" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tableau */}
            <div id="booklet-table" className="card border-0 shadow-sm rounded-4">
                <div className="card-body p-0">
                    {isLoading ? (
                        <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
                    ) : paginated.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <i className="bi bi-journal-text fs-1 d-block mb-2" />Aucun booklet trouvé
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>#</th><th>Nom & Prénom</th><th>Contact</th><th>Email</th>
                                        <th>Région</th><th>District</th><th>Poste</th><th>Statut</th>
                                        {(canEdit || canDelete) && <th className="text-end no-print">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.map((b, index) => {
                                        const isPasEnService = b.status?.statusName === 'Pas en service';
                                        return (
                                            <tr key={b.id} style={{
                                                opacity: isPasEnService ? 0.55 : 1,
                                                backgroundColor: isPasEnService ? '#f8f9fa' : 'white',
                                            }}>
                                                <td className="text-muted small">{page * pageSize + index + 1}</td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className="rounded-circle d-flex align-items-center justify-content-center"
                                                            style={{ width: '35px', height: '35px', minWidth: '35px',
                                                                background: isPasEnService ? 'rgba(108,117,125,0.1)' : 'rgba(13,110,253,0.1)' }}>
                                                            <i className={`bi bi-person-fill ${isPasEnService ? 'text-secondary' : 'text-primary'}`} />
                                                        </div>
                                                        <span className="fw-semibold">{b.lastName} {b.firstName}</span>
                                                    </div>
                                                </td>
                                                <td className="text-muted small">{b.contact}</td>
                                                <td className="text-muted small">{b.email || '—'}</td>
                                                <td>{b.region?.regionName
                                                    ? <span className="badge bg-primary bg-opacity-10 text-primary">{b.region.regionName}</span>
                                                    : <span className="text-muted small">—</span>}</td>
                                                <td className="text-muted small">{b.district?.districtName || '—'}</td>
                                                <td>{b.post?.postName
                                                    ? <span className="badge bg-secondary bg-opacity-10 text-secondary">{b.post.postName}</span>
                                                    : <span className="text-muted small">—</span>}</td>
                                                <td><StatusBadge status={b.status?.statusName} /></td>
                                                {(canEdit || canDelete) && (
                                                    <td className="text-end no-print">
                                                        {canEdit && (
                                                            <button className="btn btn-sm btn-outline-warning me-1"
                                                                onClick={() => handleEditClick(b)}>
                                                                <i className="bi bi-pencil" />
                                                            </button>
                                                        )}
                                                        {canDelete && (
                                                            <button className="btn btn-sm btn-outline-danger me-1"
                                                                onClick={() => handleDeleteClick(b.id)}>
                                                                <i className="bi bi-trash" />
                                                            </button>
                                                        )}
                                                        <button className="btn btn-sm btn-outline-success"
                                                            onClick={() => handleDownloadPdf(b.id, b.lastName)}
                                                            disabled={pdfLoading === b.id}>
                                                            {pdfLoading === b.id
                                                                ? <span className="spinner-border spinner-border-sm" />
                                                                : <i className="bi bi-file-pdf" />}
                                                        </button>
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

            <BookletFormModal show={showForm} onHide={() => setShowForm(false)} onSuccess={loadBooklets} />
            <BookletUpdateModal show={showUpdate} onHide={() => { setShowUpdate(false); setSelected(null); }}
                onSuccess={loadBooklets} booklet={selected} />
            <ConfirmModal show={showConfirm}
                title="Supprimer le booklet"
                message="Êtes-vous sûr de vouloir supprimer ce booklet ? Cette action est irréversible."
                onConfirm={handleDeleteConfirm}
                onCancel={() => setShowConfirm(false)}
                isLoading={deleteLoading} />
        </MainLayout>
    );
};

export default BookletPage;