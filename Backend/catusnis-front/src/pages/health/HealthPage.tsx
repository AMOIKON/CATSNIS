import React, { useState, useEffect, useCallback } from 'react';
import MainLayout        from '../../components/common/MainLayout';
import ConfirmModal      from '../../components/common/ConfirmModal';
import HealthFormModal   from './HealthFormModal';
import HealthUpdateModal from './HealthUpdateModal';
import HealthService     from '../../services/healthService';
import RegionService     from '../../services/regionService';
import DistrictService   from '../../services/districtService';
import { HealthResponse, RegionResponse, DistrictResponse } from '../../types';
import useAuth           from '../../hooks/useAuth';
import { buildHeader, getPrintConfig } from '../../services/globalprintservice';
import notify from '../../services/notify';

// ── Pagination intelligente avec ellipses ─────────────────────────────────────
const SmartPagination: React.FC<{
    page:         number;
    totalPages:   number;
    onPageChange: (p: number) => void;
}> = ({ page, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const MAX_VISIBLE = 10;

    const getPages = (): (number | '...')[] => {
        if (totalPages <= MAX_VISIBLE) {
            return Array.from({ length: totalPages }, (_, i) => i);
        }
        const pages: (number | '...')[] = [];
        const half  = Math.floor(MAX_VISIBLE / 2);
        let start   = Math.max(1, page - half);
        let end     = Math.min(totalPages - 2, page + half);

        if (page - half < 1)              end   = Math.min(totalPages - 2, MAX_VISIBLE - 2);
        if (page + half > totalPages - 2) start = Math.max(1, totalPages - MAX_VISIBLE + 1);

        pages.push(0);
        if (start > 1) pages.push('...');
        for (let i = start; i <= end; i++) pages.push(i);
        if (end < totalPages - 2) pages.push('...');
        pages.push(totalPages - 1);

        return pages;
    };

    return (
        <div className="card-footer bg-white border-0 d-flex justify-content-center align-items-center gap-2 py-3">
            <button
                className="btn btn-sm btn-outline-secondary rounded-3"
                onClick={() => onPageChange(page - 1)}
                disabled={page === 0}
            >
                <i className="bi bi-chevron-left" />
            </button>
            <nav>
                <ul className="pagination pagination-sm mb-0 gap-1">
                    {getPages().map((p, i) =>
                        p === '...'
                            ? <li key={`e-${i}`} className="page-item disabled">
                                <span className="page-link border-0 bg-transparent text-muted px-1">…</span>
                              </li>
                            : <li key={p} className={`page-item ${page === p ? 'active' : ''}`}>
                                <button
                                    className="page-link rounded-3"
                                    style={{ minWidth: '36px' }}
                                    onClick={() => onPageChange(p as number)}
                                >
                                    {(p as number) + 1}
                                </button>
                              </li>
                    )}
                </ul>
            </nav>
            <button
                className="btn btn-sm btn-outline-secondary rounded-3"
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages - 1}
            >
                <i className="bi bi-chevron-right" />
            </button>
            <small className="text-muted ms-1">Page {page + 1} / {totalPages}</small>
        </div>
    );
};

const HealthPage: React.FC = () => {
    const { person } = useAuth();
    const role      = person?.role;
    const canCreate = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'TECHNICIEN';
    const canEdit   = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'TECHNICIEN';
    const canDelete = role === 'SUPER_ADMIN' || role === 'ADMIN';

    const [healths,        setHealths]        = useState<HealthResponse[]>([]);
    const [regions,        setRegions]        = useState<RegionResponse[]>([]);
    const [districts,      setDistricts]      = useState<DistrictResponse[]>([]);
    const [totalPages,     setTotalPages]     = useState(0);
    const [totalElements,  setTotalElements]  = useState(0);
    const [page,           setPage]           = useState(0);
    const [keyword,        setKeyword]        = useState('');
    const [filterRegion,   setFilterRegion]   = useState<number>(0);
    const [filterDistrict, setFilterDistrict] = useState<number>(0);
    const [isLoading,      setIsLoading]      = useState(false);
    const [showForm,       setShowForm]       = useState(false);
    const [showUpdate,     setShowUpdate]     = useState(false);
    const [showConfirm,    setShowConfirm]    = useState(false);
    const [selectedId,     setSelectedId]     = useState<number | null>(null);
    const [selected,       setSelected]       = useState<HealthResponse | null>(null);
    const [deleteLoading,  setDeleteLoading]  = useState(false);
    const [isPrinting,     setIsPrinting]     = useState(false);

    useEffect(() => { RegionService.getAllList().then(setRegions); }, []);

    const handleRegionFilter = async (regionId: number) => {
        setFilterRegion(regionId);
        setFilterDistrict(0);
        setPage(0);
        if (regionId) {
            const data = await DistrictService.getAllList(regionId);
            setDistricts(data);
        } else {
            setDistricts([]);
        }
    };

    const loadHealths = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await HealthService.getAll(
                page, 150,
                filterDistrict || undefined,
                filterRegion   || undefined,
                keyword        || undefined
            );
            setHealths(data.content);
            setTotalPages(data.page.totalPages);
            setTotalElements(data.page.totalElements);
        } catch (err) { console.error(err); }
        finally { setIsLoading(false); }
    }, [page, keyword, filterRegion, filterDistrict]);

    useEffect(() => { loadHealths(); }, [loadHealths]);

const handleDeleteConfirm = async () => {
    if (!selectedId) return;
    setDeleteLoading(true);
    try {
        await HealthService.delete(selectedId);
        notify.success('Site de santé supprimé avec succès');
        loadHealths();
    } catch (err) {
        notify.apiError(err, 'Erreur lors de la suppression du site de santé');
    }
    finally { setDeleteLoading(false); setShowConfirm(false); setSelectedId(null); }
};

    // ── Imprimer TOUS les sites (filtres région/district/recherche respectés) ─
    const handlePrintAll = async () => {
        setIsPrinting(true);
        try {
            const all = await HealthService.getAllForPrint(
                filterDistrict || undefined,
                filterRegion   || undefined,
                keyword        || undefined
            );
            const cfg = getPrintConfig();

            // Titre dynamique selon les filtres actifs
            let titre = 'Liste des sites de santé';
            if (filterRegion) {
                const rName = regions.find(r => r.id === filterRegion)?.regionName;
                titre += ` — ${rName ?? ''}`;
            }
            if (filterDistrict) {
                const dName = districts.find(d => d.id === filterDistrict)?.DistrictName;
                titre += ` / ${dName ?? ''}`;
            }

            const header = buildHeader(titre, cfg);

            const rows = all.map((h, i) => `
                <tr>
                    <td style="color:#6c757d;font-size:11px;width:50px;">${i + 1}</td>
                    <td style="font-weight:500;">${h.healthName}</td>
                    <td>
                        <span style="background:#cff4fc;color:#055160;
                              padding:2px 10px;border-radius:20px;font-size:11px;">
                            ${h.districtName}
                        </span>
                    </td>
                    <td>
                        <span style="background:#d1e7dd;color:#0a3622;
                              padding:2px 10px;border-radius:20px;font-size:11px;">
                            ${h.Region}
                        </span>
                    </td>
                </tr>
            `).join('');

            const html = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8" />
    <title>Sites de santé — CATUSNIS</title>
    <style>
        @page { margin: 1.5cm; size: A4 landscape; }
        body  { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; }
        .total { font-size: 12px; color: #6c757d; margin: 8px 0 16px 0; }
        table { width: 100%; border-collapse: collapse; }
        th    { background: #f8f9fa; border: 1px solid #dee2e6;
                padding: 7px 10px; font-size: 11px; text-align: left; }
        td    { border: 1px solid #dee2e6; padding: 7px 10px; font-size: 11px; }
        tr:nth-child(even) { background: #f9f9f9; }
    </style>
</head>
<body>
    ${header}
    <p class="total">${all.length} site(s) de santé au total</p>
    <table>
        <thead>
            <tr><th>#</th><th>Site de santé</th><th>District</th><th>Région</th></tr>
        </thead>
        <tbody>${rows}</tbody>
    </table>
</body>
</html>`;

            const win = window.open('', '_blank', 'width=900,height=700');
            if (!win) { alert('Veuillez autoriser les popups pour imprimer.'); return; }
            win.document.write(html);
            win.document.close();
            win.onload = () => { win.focus(); win.print(); win.close(); };
        } catch (err) {
            console.error(err);
        } finally {
            setIsPrinting(false);
        }
    };

    return (
        <MainLayout title="Sites de santé">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 className="fw-bold mb-0">
                        <i className="bi bi-hospital-fill text-danger me-2" />
                        Liste des sites de santé
                    </h5>
                    <small className="text-muted">{totalElements} site(s) au total</small>
                </div>
                <div className="d-flex gap-2 align-items-center">
                    {/* ✅ Impression globale — respecte les filtres actifs */}
                    <button
                        className="btn btn-outline-secondary d-flex align-items-center gap-2"
                        onClick={handlePrintAll}
                        disabled={isPrinting}
                        title="Imprimer tous les sites de santé"
                    >
                        {isPrinting ? (
                            <>
                                <span className="spinner-border spinner-border-sm" role="status" />
                                Chargement...
                            </>
                        ) : (
                            <><i className="bi bi-printer" />Imprimer</>
                        )}
                    </button>
                    {canCreate && (
                        <button
                            className="btn btn-danger d-flex align-items-center gap-2"
                            onClick={() => setShowForm(true)}
                        >
                            <i className="bi bi-plus-circle-fill" /> Nouveau site
                        </button>
                    )}
                </div>
            </div>

            {/* Filtres */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-body p-3">
                    <div className="row g-3">
                        <div className="col-md-6">
                            <div className="input-group">
                                <span className="input-group-text bg-white border-end-0">
                                    <i className="bi bi-search text-muted" />
                                </span>
                                <input
                                    type="text"
                                    className="form-control border-start-0"
                                    placeholder="Rechercher un site..."
                                    value={keyword}
                                    onChange={e => { setKeyword(e.target.value); setPage(0); }}
                                />
                            </div>
                        </div>
                        <div className="col-md-3">
                            <select
                                className="form-select rounded-3"
                                value={filterRegion}
                                onChange={e => handleRegionFilter(Number(e.target.value))}
                            >
                                <option value={0}>Toutes les régions</option>
                                {regions.map(r => (
                                    <option key={r.id} value={r.id}>{r.regionName}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <select
                                className="form-select rounded-3"
                                value={filterDistrict}
                                onChange={e => { setFilterDistrict(Number(e.target.value)); setPage(0); }}
                                disabled={!filterRegion}
                            >
                                <option value={0}>Tous les districts</option>
                                {districts.map(d => (
                                    <option key={d.id} value={d.id}>{d.DistrictName}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tableau */}
            <div id="health-table" className="card border-0 shadow-sm rounded-4">
                <div className="card-body p-0">
                    {isLoading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-danger" />
                        </div>
                    ) : healths.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <i className="bi bi-hospital fs-1 d-block mb-2" />
                            Aucun site de santé trouvé
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>#</th>
                                        <th>Site de santé</th>
                                        <th>District</th>
                                        <th>Région</th>
                                        {(canEdit || canDelete) && (
                                            <th className="text-end no-print">Actions</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {healths.map((h, i) => (
                                        <tr key={h.id}>
                                            <td className="text-muted small">{page * 150 + i + 1}</td>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <div
                                                        className="rounded-circle bg-danger bg-opacity-10 d-flex align-items-center justify-content-center"
                                                        style={{ width: '35px', height: '35px', minWidth: '35px' }}
                                                    >
                                                        <i className="bi bi-hospital-fill text-danger" />
                                                    </div>
                                                    <span className="fw-semibold">{h.healthName}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge bg-info bg-opacity-10 text-info">
                                                    {h.districtName}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="badge bg-success bg-opacity-10 text-success">
                                                    {h.Region}
                                                </span>
                                            </td>
                                            {(canEdit || canDelete) && (
                                                <td className="text-end no-print">
                                                    {canEdit && (
                                                        <button
                                                            className="btn btn-sm btn-outline-warning me-2"
                                                            onClick={() => { setSelected(h); setShowUpdate(true); }}
                                                        >
                                                            <i className="bi bi-pencil" />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => { setSelectedId(h.id); setShowConfirm(true); }}
                                                        >
                                                            <i className="bi bi-trash" />
                                                        </button>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination intelligente */}
                <SmartPagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                />
            </div>

            <HealthFormModal
                show={showForm}
                onHide={() => setShowForm(false)}
                onSuccess={loadHealths}
            />
            <HealthUpdateModal
                show={showUpdate}
                onHide={() => { setShowUpdate(false); setSelected(null); }}
                onSuccess={loadHealths}
                health={selected}
            />
            <ConfirmModal
                show={showConfirm}
                title="Supprimer le site de santé"
                message="Êtes-vous sûr ? Cette action est irréversible."
                onConfirm={handleDeleteConfirm}
                onCancel={() => setShowConfirm(false)}
                isLoading={deleteLoading}
            />
        </MainLayout>
    );
};

export default HealthPage;