import React, { useState, useEffect } from 'react';
import ImageService from '../../services/imageService';
import { ImageResponse } from '../../types';
import { getImageSrc } from '../../utils/imageUtils';

const PLACEHOLDER = '/images/equipements/equipement.png';

interface ImagePickerProps {
    value:    string;
    onChange: (file: string) => void;
}

const ImagePicker: React.FC<ImagePickerProps> = ({ value, onChange }) => {
    const [show,      setShow]      = useState(false);
    const [images,    setImages]    = useState<ImageResponse[]>([]);
    const [loading,   setLoading]   = useState(false);

    // ✅ Charger les images depuis la DB
    useEffect(() => {
        setLoading(true);
        ImageService.getAllList()
            .then(setImages)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // ✅ Label de l'image sélectionnée
    const selectedLabel = images.find(img => img.fileName === value)?.label || value;

    // ✅ Handler onError centralisé
    const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const t = e.target as HTMLImageElement;
        t.onerror = null;
        t.src = PLACEHOLDER;
    };

    return (
        <div>
            {/* ── Aperçu + bouton ouvrir ─────────────────────────── */}
            <div
                className="border rounded-3 p-3 d-flex align-items-center
                           gap-3 bg-light"
                onClick={() => setShow(!show)}
                style={{ cursor: 'pointer' }}
            >
                {value ? (
                    <>
                        <img
                            src={getImageSrc(value)} // ✅ utilitaire
                            alt={value}
                            style={{ width: '45px', height: '45px',
                                     objectFit: 'contain' }}
                            onError={handleImgError}
                        />
                        <div>
                            <p className="mb-0 fw-semibold small">{selectedLabel}</p>
                            <small className="text-muted">Cliquez pour changer</small>
                        </div>
                    </>
                ) : (
                    <>
                        <div
                            className="rounded-circle bg-secondary bg-opacity-10
                                       d-flex align-items-center justify-content-center"
                            style={{ width: '45px', height: '45px', minWidth: '45px' }}
                        >
                            <i className="bi bi-image text-muted fs-4" />
                        </div>
                        <div>
                            <p className="mb-0 fw-semibold small text-muted">
                                Aucune image sélectionnée
                            </p>
                            <small className="text-muted">Cliquez pour choisir</small>
                        </div>
                    </>
                )}
                <i className={`bi ${show ? 'bi-chevron-up' : 'bi-chevron-down'}
                               ms-auto text-muted`} />
            </div>

            {/* ── Grille de sélection ────────────────────────────── */}
            {show && (
                <div className="border rounded-3 p-3 mt-2"
                     style={{ maxHeight: '260px', overflowY: 'auto' }}>
                    {loading ? (
                        <div className="text-center py-3">
                            <div className="spinner-border spinner-border-sm text-warning" />
                            <p className="text-muted small mt-2 mb-0">
                                Chargement des images...
                            </p>
                        </div>
                    ) : images.length === 0 ? (
                        <div className="text-center py-3 text-muted small">
                            <i className="bi bi-exclamation-circle me-1" />
                            Aucune image disponible —{' '}
                            <span className="text-warning">
                                Ajoutez des images dans la gestion des images
                            </span>
                        </div>
                    ) : (
                        <div className="row g-2">
                            {images.map(img => (
                                <div key={img.id} className="col-3">
                                    <div
                                        className="border rounded-3 p-2 text-center
                                                   d-flex flex-column align-items-center gap-1"
                                        style={{
                                            cursor: 'pointer',
                                            background: value === img.fileName
                                                ? 'rgba(255,193,7,0.15)' : 'white',
                                            transition: 'all 0.2s'
                                        }}
                                        onClick={() => {
                                            onChange(img.fileName);
                                            setShow(false);
                                        }}
                                    >
                                        <img
                                            src={getImageSrc(img.fileName)} // ✅ utilitaire
                                            alt={img.label}
                                            style={{ width: '40px', height: '40px',
                                                     objectFit: 'contain' }}
                                            onError={handleImgError}
                                        />
                                        <small className="text-muted"
                                               style={{ fontSize: '0.65rem',
                                                        lineHeight: '1.2' }}>
                                            {img.label}
                                        </small>
                                        {value === img.fileName && (
                                            <i className="bi bi-check-circle-fill
                                                           text-warning small" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ImagePicker;