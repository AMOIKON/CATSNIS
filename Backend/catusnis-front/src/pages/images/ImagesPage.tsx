import React, { useState, useEffect, useCallback } from 'react';
import MainLayout        from '../../components/common/MainLayout';
import ConfirmModal      from '../../components/common/ConfirmModal';
import Pagination        from '../../components/common/Pagination';
import ImageFormModal    from './ImageFormModal';
import ImageUpdateModal  from './ImageUpdateModal';
import ImageService      from '../../services/imageService';
import { ImageResponse } from '../../types';
import useAuth           from '../../hooks/useAuth';

const PLACEHOLDER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="%23dee2e6"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>';

const ImagesPage: React.FC = () => {
    const { hasRole } = useAuth();

    const [images,        setImages]        = useState<ImageResponse[]>([]);
    const [totalPages,    setTotalPages]    = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [page,          setPage]          = useState(0);
    const [keyword,       setKeyword]       = useState('');
    const [isLoading,     setIsLoading]     = useState(false);
    const [showForm,      setShowForm]      = useState(false);
    const [showUpdate,    setShowUpdate]    = useState(false);
    const [showConfirm,   setShowConfirm]   = useState(false);
    const [selectedId,    setSelectedId]    = useState<number | null>(null);
    const [selected,      setSelected]      = useState<ImageResponse | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const loadImages = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await ImageService.getAll(page, 10, keyword || undefined);
            setImages(data.content);
            setTotalPages(data.page.totalPages);
            setTotalElements(data.page.totalElements);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [page, keyword]);

    useEffect(() => { loadImages(); }, [loadImages]);

    const handleDeleteConfirm = async () => {
        if (!selectedId) return;
        setDeleteLoading(true);
        try {
            await ImageService.delete(selectedId);
            loadImages();
        } catch (err) {
            console.error(err);
        } finally {
            setDeleteLoading(false);
            setShowConfirm(false);
            setSelectedId(null);
        }
    };

    return (
        <MainLayout title="Images">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 className="fw-bold mb-0">Gestion des images</h5>
                    <small className="text-muted">{totalElements} image(s) au total</small>
                </div>
                {(hasRole('ADMIN') || hasRole('SUPER_ADMIN')) && (
                    <button className="btn btn-primary d-flex align-items-center gap-2"
                        onClick={() => setShowForm(true)}>
                        <i className="bi bi-plus-circle-fill" />
                        Nouvelle image
                    </button>
                )}
            </div>

            {/* ── Recherche ───────────────────────────────────────── */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-body p-3">
                    <div className="input-group">
                        <span className="input-group-text bg-white border-end-0">
                            <i className="bi bi-search text-muted" />
                        </span>
                        <input type="text" className="form-control border-start-0"
                            placeholder="Rechercher une image..."
                            value={keyword}
                            onChange={e => { setKeyword(e.target.value); setPage(0); }} />
                    </div>
                </div>
            </div>

            {/* ── Grille d'images ─────────────────────────────────── */}
            <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body p-3">
                    {isLoading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" />
                        </div>
                    ) : images.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <i className="bi bi-images fs-1 d-block mb-2" />
                            Aucune image trouvée
                        </div>
                    ) : (
                        <div className="row g-3">
                            {images.map(img => (
                                <div key={img.id} className="col-6 col-md-3 col-lg-2">
                                    <div className="card border rounded-4 h-100 text-center p-3">
                                        {/* ✅ Template string corrigée */}
                                        <img
                                            src={ImageService.getFileUrl(img.fileName)}
                                            alt={img.label}
                                            className="mx-auto mb-2"
                                            style={{ width: '60px', height: '60px', objectFit: 'contain' }}
                                            onError={e => {
                                                const t = e.target as HTMLImageElement;
                                                t.onerror = null;
                                                t.src = PLACEHOLDER;
                                            }}
                                        />
                                        <p className="fw-semibold small mb-0 text-truncate">
                                            {img.label}
                                        </p>
                                        <small className="text-muted" style={{ fontSize: '0.65rem' }}>
                                            {img.fileName}
                                        </small>
                                        {(hasRole('ADMIN') || hasRole('SUPER_ADMIN')) && (
                                            <div className="d-flex gap-1 justify-content-center mt-2">
                                                <button className="btn btn-sm btn-outline-warning"
                                                    onClick={() => { setSelected(img); setShowUpdate(true); }}
                                                    title="Modifier">
                                                    <i className="bi bi-pencil" />
                                                </button>
                                                <button className="btn btn-sm btn-outline-danger"
                                                    onClick={() => { setSelectedId(img.id); setShowConfirm(true); }}
                                                    title="Supprimer">
                                                    <i className="bi bi-trash" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>

            <ImageFormModal show={showForm} onHide={() => setShowForm(false)} onSuccess={loadImages} />
            <ImageUpdateModal
                show={showUpdate}
                onHide={() => { setShowUpdate(false); setSelected(null); }}
                onSuccess={loadImages}
                image={selected}
            />
            <ConfirmModal
                show={showConfirm}
                title="Supprimer l'image"
                message="Êtes-vous sûr de vouloir supprimer cette image ?"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setShowConfirm(false)}
                isLoading={deleteLoading}
            />
        </MainLayout>
    );
};

export default ImagesPage;