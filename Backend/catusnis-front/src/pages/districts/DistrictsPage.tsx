import React, { useState, useEffect, useCallback } from 'react';
import MainLayout           from '../../components/common/MainLayout';
import ConfirmModal         from '../../components/common/ConfirmModal';
import DistrictFormModal    from './DistrictFormModal';
import DistrictUpdateModal  from './DistrictUpdateModal';
import DistrictService      from '../../services/districtService';
import RegionService        from '../../services/regionService';
import { DistrictResponse, RegionResponse } from '../../types';
import useAuth              from '../../hooks/useAuth';
import { buildHeader, getPrintConfig } from '../../services/globalprintservice';
import notify from '../../services/notify';

const DistrictsPage: React.FC = () => {
    const { person } = useAuth();
    const role      = person?.role;
    const canCreate = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'TECHNICIEN';
    const canEdit   = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'TECHNICIEN';
    const canDelete = role === 'SUPER_ADMIN' || role === 'ADMIN';

    const [districts,     setDistricts]     = useState<DistrictResponse[]>([]);
    const [regions,       setRegions]       = useState<RegionResponse[]>([]);
    const [totalPages,    setTotalPages]    = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [page,          setPage]          = useState(0);
    const [keyword,       setKeyword]       = useState('');
    const [filterRegion,  setFilterRegion]  = useState<number>(0);
    const [isLoading,     setIsLoading]     = useState(false);
    const [showForm,      setShowForm]      = useState(false);
    const [showUpdate,    setShowUpdate]    = useState(false);
    const [showConfirm,   setShowConfirm]   = useState(false);
    const [selectedId,    setSelectedId]    = useState<number | null>(null);
    const [selected,      setSelected]      = useState<DistrictResponse | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [isPrinting,    setIsPrinting]    = useState(false);

    useEffect(() => { RegionService.getAllList().then(setRegions); }, []);

    const loadDistricts = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await DistrictService.getAll(
                page, 10,
                filterRegion || undefined,
                keyword      || undefined
            );
            setDistricts(data.content);
            setTotalPages(data.page.totalPages);
            setTotalElements(data.page.totalElements);
        } catch (err) { console.error(err); }
        finally { setIsLoading(false); }
    }, [page, keyword, filterRegion]);

    useEffect(() => { loadDistricts(); }, [loadDistricts]);
const handleDeleteConfirm = async () => {
    if (!selectedId) return;
    setDeleteLoading(true);
    try {
        await DistrictService.delete(selectedId);
        notify.success('District supprimé avec succès');
        loadDistricts();
    } catch (err) {
        notify.apiError(err, 'Erreur lors de la suppression du district');
    }
    finally { setDeleteLoading(false); setShowConfirm(false); setSelectedId(null); }
};

    // ── Imprimer TOUS les districts (filtre région respecté) ─────────────────
    const handlePrintAll = async () => {
        setIsPrinting(true);
        try {
            const all = await DistrictService.getAllForPrint(
                filterRegion || undefined,
                keyword      || undefined
            );
            const cfg    = getPrintConfig();
            const titre  = filterRegion
                ? `Liste des districts — ${regions.find(r => r.id === filterRegion)?.regionName ?? ''}`
                : 'Liste des districts';
            const header = buildHeader(titre, cfg);

            const rows = all.map((d, i) => `
                <tr>
                    <td style="color:#6c757d;font-size:11px;width:50px;">${i + 1}</td>
                    <td style="font-weight:500;">${d.DistrictName}</td>
                    <td>
                        <span style="background:#d1e7dd;color:#0a3622;
                              padding:2px 10px;border-radius:20px;font-size:11px;">
                            ${d.regionDistrict}
                        </span>
                    </td>
                </tr>
            `).join('');

            const html = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8" />
    <title>Districts — CATUSNIS</title>
    <style>
        @page { margin: 1.5cm; size: A4 portrait; }
        body  { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; }
        .total { font-size: 12px; color: #6c757d; margin: 8px 0 16px 0; }
        table { width: 100%; border-collapse: collapse; }
        th    { background: #f8f9fa; border: 1px solid #dee2e6;
                padding: 8px 12px; font-size: 12px; text-align: left; }
        td    { border: 1px solid #dee2e6; padding: 8px 12px; font-size: 12px; }
        tr:nth-child(even) { background: #f9f9f9; }
    </style>
</head>
<body>
    ${header}
    <p class="total">${all.length} district(s) au total</p>
    <table>
        <thead>
            <tr><th>#</th><th>District</th><th>Région</th></tr>
        </thead>
        <tbody>${rows}</tbody>
    </table>
</body>
</html>`;

            const win = window.open('', '_blank', 'width=800,height=700');
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
        <MainLayout title="Districts">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 className="fw-bold mb-0">Liste des districts</h5>
                    <small className="text-muted">{totalElements} district(s) au total</small>
                </div>
                <div className="d-flex gap-2 align-items-center">
                    {/* ✅ Impression globale — respecte le filtre région actif */}
                    <button
                        className="btn btn-outline-secondary d-flex align-items-center gap-2"
                        onClick={handlePrintAll}
                        disabled={isPrinting}
                        title="Imprimer tous les districts"
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
                            className="btn btn-info text-white d-flex align-items-center gap-2"
                            onClick={() => setShowForm(true)}
                        >
                            <i className="bi bi-plus-circle-fill" />Nouveau district
                        </button>
                    )}
                </div>
            </div>

            {/* Filtres */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-body p-3">
                    <div className="row g-3">
                        <div className="col-md-8">
                            <div className="input-group">
                                <span className="input-group-text bg-white border-end-0">
                                    <i className="bi bi-search text-muted" />
                                </span>
                                <input
                                    type="text"
                                    className="form-control border-start-0"
                                    placeholder="Rechercher un district..."
                                    value={keyword}
                                    onChange={e => { setKeyword(e.target.value); setPage(0); }}
                                />
                            </div>
                        </div>
                        <div className="col-md-4">
                            <select
                                className="form-select rounded-3"
                                value={filterRegion}
                                onChange={e => { setFilterRegion(Number(e.target.value)); setPage(0); }}
                            >
                                <option value={0}>Toutes les régions</option>
                                {regions.map(r => (
                                    <option key={r.id} value={r.id}>{r.regionName}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tableau */}
            <div id="districts-table" className="card border-0 shadow-sm rounded-4">
                <div className="card-body p-0">
                    {isLoading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-info" />
                        </div>
                    ) : districts.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <i className="bi bi-map fs-1 d-block mb-2" />
                            Aucun district trouvé
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>#</th>
                                        <th>District</th>
                                        <th>Région</th>
                                        {(canEdit || canDelete) && (
                                            <th className="text-end no-print">Actions</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {districts.map((d, i) => (
                                        <tr key={d.id}>
                                            <td className="text-muted small">{page * 10 + i + 1}</td>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <div
                                                        className="rounded-circle bg-info bg-opacity-10 d-flex align-items-center justify-content-center"
                                                        style={{ width: '35px', height: '35px', minWidth: '35px' }}
                                                    >
                                                        <i className="bi bi-map-fill text-info" />
                                                    </div>
                                                    <span className="fw-semibold">{d.DistrictName}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge bg-success bg-opacity-10 text-success">
                                                    {d.regionDistrict}
                                                </span>
                                            </td>
                                            {(canEdit || canDelete) && (
                                                <td className="text-end no-print">
                                                    {canEdit && (
                                                        <button
                                                            className="btn btn-sm btn-outline-warning me-2"
                                                            onClick={() => { setSelected(d); setShowUpdate(true); }}
                                                        >
                                                            <i className="bi bi-pencil" />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => { setSelectedId(d.id); setShowConfirm(true); }}
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

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="card-footer bg-white border-0 d-flex justify-content-center py-3">
                        <nav>
                            <ul className="pagination pagination-sm mb-0">
                                <li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => setPage(p => p - 1)}>
                                        <i className="bi bi-chevron-left" />
                                    </button>
                                </li>
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <li key={i} className={`page-item ${page === i ? 'active' : ''}`}>
                                        <button className="page-link" onClick={() => setPage(i)}>{i + 1}</button>
                                    </li>
                                ))}
                                <li className={`page-item ${page === totalPages - 1 ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => setPage(p => p + 1)}>
                                        <i className="bi bi-chevron-right" />
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                )}
            </div>

            <DistrictFormModal
                show={showForm}
                onHide={() => setShowForm(false)}
                onSuccess={loadDistricts}
            />
            <DistrictUpdateModal
                show={showUpdate}
                onHide={() => { setShowUpdate(false); setSelected(null); }}
                onSuccess={loadDistricts}
                district={selected}
            />
            <ConfirmModal
                show={showConfirm}
                title="Supprimer le district"
                message="Êtes-vous sûr ? Cette action est irréversible."
                onConfirm={handleDeleteConfirm}
                onCancel={() => setShowConfirm(false)}
                isLoading={deleteLoading}
            />
        </MainLayout>
    );
};

export default DistrictsPage;