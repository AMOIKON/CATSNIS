import React, { useState, useEffect, useCallback } from 'react';
import MainLayout      from '../../components/common/MainLayout';
import ConfirmModal    from '../../components/common/ConfirmModal';
import Pagination      from '../../components/common/Pagination';
import TypeFormModal   from './TypeFormModal';
import TypeUpdateModal from './TypeUpdateModal';
import TypesService    from '../../services/typesService';
import { TypeResponse } from '../../types';
import useAuth         from '../../hooks/useAuth';
import { getImageSrc } from '../../utils/imageUtils';
import { buildHeader, getPrintConfig } from '../../services/globalprintservice';

const TypesPage: React.FC = () => {
    const { person } = useAuth();
    const role      = person?.role;
    const canCreate = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'TECHNICIEN';
    const canEdit   = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'TECHNICIEN';
    const canDelete = role === 'SUPER_ADMIN' || role === 'ADMIN';

    const [types,         setTypes]         = useState<TypeResponse[]>([]);
    const [totalPages,    setTotalPages]    = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [page,          setPage]          = useState(0);
    const [keyword,       setKeyword]       = useState('');
    const [isLoading,     setIsLoading]     = useState(false);
    const [isPrinting,    setIsPrinting]    = useState(false);
    const [showForm,      setShowForm]      = useState(false);
    const [showUpdate,    setShowUpdate]    = useState(false);
    const [showConfirm,   setShowConfirm]   = useState(false);
    const [selectedId,    setSelectedId]    = useState<number | null>(null);
    const [selected,      setSelected]      = useState<TypeResponse | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const loadTypes = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await TypesService.getAll(page, 10, keyword || undefined);
            setTypes(data.content);
            setTotalPages(data.page.totalPages);
            setTotalElements(data.page.totalElements);
        } catch (err) { console.error(err); }
        finally { setIsLoading(false); }
    }, [page, keyword]);

    useEffect(() => { loadTypes(); }, [loadTypes]);

    const handleDeleteConfirm = async () => {
        if (!selectedId) return;
        setDeleteLoading(true);
        try { await TypesService.delete(selectedId); loadTypes(); }
        catch (err) { console.error(err); }
        finally { setDeleteLoading(false); setShowConfirm(false); setSelectedId(null); }
    };

    // ✅ Impression globale
    const handlePrintAll = async () => {
        setIsPrinting(true);
        try {
            const all = await TypesService.getAllForPrint(keyword || undefined);
            const cfg    = getPrintConfig();
            const header = buildHeader("Types d'équipements", cfg);

            const rows = all.map((t, i) => `
                <tr>
                    <td style="color:#6c757d;font-size:11px;">${i + 1}</td>
                    <td style="font-weight:500;">${t.typeName}</td>
                    <td><span style="background:#fff3cd;color:#856404;padding:2px 10px;border-radius:20px;font-size:11px;">${t.marque || '—'}</span></td>
                    <td style="color:#6c757d;font-size:11px;">${t.modele || '—'}</td>
                </tr>
            `).join('');

            const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
                <title>Types équipements — CATUSNIS</title>
                <style>@page{margin:1.5cm;size:A4 portrait}body{font-family:Arial,sans-serif;color:#333;margin:0}
                .total{font-size:12px;color:#6c757d;margin:8px 0 16px}
                table{width:100%;border-collapse:collapse}
                th{background:#f8f9fa;border:1px solid #dee2e6;padding:8px 12px;font-size:12px;text-align:left}
                td{border:1px solid #dee2e6;padding:8px 12px;font-size:12px}
                tr:nth-child(even){background:#f9f9f9}</style></head>
                <body>${header}<p class="total">${all.length} type(s) au total</p>
                <table><thead><tr><th>#</th><th>Type d'équipement</th><th>Marque</th><th>Modèle</th></tr></thead>
                <tbody>${rows}</tbody></table></body></html>`;

            const win = window.open('', '_blank', 'width=800,height=700');
            if (!win) { alert('Veuillez autoriser les popups pour imprimer.'); return; }
            win.document.write(html);
            win.document.close();
            win.onload = () => { win.focus(); win.print(); win.close(); };
        } catch (err) { console.error(err); }
        finally { setIsPrinting(false); }
    };

    const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const t = e.target as HTMLImageElement;
        t.onerror = null;
        t.src = '/images/equipements/equipement.png';
    };

    return (
        <MainLayout title="Types d'équipements">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 className="fw-bold mb-0">Types d'équipements</h5>
                    <small className="text-muted">{totalElements} type(s) au total</small>
                </div>
                <div className="d-flex gap-2 align-items-center">
                    <button className="btn btn-outline-secondary d-flex align-items-center gap-2"
                        onClick={handlePrintAll} disabled={isPrinting}>
                        {isPrinting
                            ? <><span className="spinner-border spinner-border-sm" role="status" />Chargement...</>
                            : <><i className="bi bi-printer" />Imprimer</>}
                    </button>
                    {canCreate && (
                        <button className="btn btn-warning text-white d-flex align-items-center gap-2"
                            onClick={() => setShowForm(true)}>
                            <i className="bi bi-plus-circle-fill" />Nouveau type
                        </button>
                    )}
                </div>
            </div>
            <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-body p-3">
                    <div className="input-group">
                        <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted" /></span>
                        <input type="text" className="form-control border-start-0" placeholder="Rechercher un type..."
                            value={keyword} onChange={e => { setKeyword(e.target.value); setPage(0); }} />
                    </div>
                </div>
            </div>
            <div id="types-table" className="card border-0 shadow-sm rounded-4">
                <div className="card-body p-0">
                    {isLoading ? (
                        <div className="text-center py-5"><div className="spinner-border text-warning" /></div>
                    ) : types.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <i className="bi bi-tag fs-1 d-block mb-2" />Aucun type trouvé
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr><th>#</th><th>Image</th><th>Type</th><th>Marque</th><th>Modèle</th>
                                        {(canEdit || canDelete) && <th className="text-end no-print">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {types.map((t, i) => (
                                        <tr key={t.id}>
                                            <td className="text-muted small">{page * 10 + i + 1}</td>
                                            <td><img src={getImageSrc(t.image)} alt={t.typeName}
                                                style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                                                onError={handleImgError} /></td>
                                            <td><span className="fw-semibold">{t.typeName}</span></td>
                                            <td><span className="badge bg-warning bg-opacity-10 text-warning">{t.marque || '—'}</span></td>
                                            <td className="text-muted small">{t.modele || '—'}</td>
                                            {(canEdit || canDelete) && (
                                                <td className="text-end no-print">
                                                    {canEdit && <button className="btn btn-sm btn-outline-warning me-2"
                                                        onClick={() => { setSelected(t); setShowUpdate(true); }}><i className="bi bi-pencil" /></button>}
                                                    {canDelete && <button className="btn btn-sm btn-outline-danger"
                                                        onClick={() => { setSelectedId(t.id); setShowConfirm(true); }}><i className="bi bi-trash" /></button>}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
            <TypeFormModal show={showForm} onHide={() => setShowForm(false)} onSuccess={loadTypes} />
            <TypeUpdateModal show={showUpdate} onHide={() => { setShowUpdate(false); setSelected(null); }} onSuccess={loadTypes} type={selected} />
            <ConfirmModal show={showConfirm} title="Supprimer le type" message="Êtes-vous sûr ?"
                onConfirm={handleDeleteConfirm} onCancel={() => setShowConfirm(false)} isLoading={deleteLoading} />
        </MainLayout>
    );
};
export default TypesPage;