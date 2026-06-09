import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Spinner, Alert } from "react-bootstrap";
import TypesService   from "../../services/typesService";
import ImageService   from "../../services/imageService";
import { TypesRequest, TypeResponse, ImageResponse } from "../../types";
import { getImageSrc } from '../../utils/imageUtils';

interface Props {
    show:      boolean;
    onHide:    () => void;
    onSuccess: () => void;
    type:      TypeResponse | null;
}

const TypeUpdateModal: React.FC<Props> = ({ show, onHide, onSuccess, type }) => {
    const [isLoading,  setIsLoading]  = useState(false);
    const [error,      setError]      = useState<string | null>(null);
    const [images,     setImages]     = useState<ImageResponse[]>([]);
    const [showPicker, setShowPicker] = useState(false);
    const [imgLoading, setImgLoading] = useState(false);

    const [form, setForm] = useState<TypesRequest>({
        typeName: '', image: '', marque: '', modele: '',
    });

    // â”€â”€ PrÃ©-remplir + charger les images â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    useEffect(() => {
        if (show && type) {
            setForm({
                typeName: type.typeName,
                image:    type.image,
                marque:   type.marque,
                modele:   type.modele,
            });
            setImgLoading(true);
            ImageService.getAllList()
                .then(setImages)
                .catch(() => setError('Erreur chargement images'))
                .finally(() => setImgLoading(false));
        }
    }, [show, type]);

    // â”€â”€ RÃ©initialiser Ã  la fermeture â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    useEffect(() => {
        if (!show) {
            setShowPicker(false);
            setError(null);
        }
    }, [show]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!type) return;
        setError(null);
        if (!form.typeName.trim()) {
            setError("Le nom du type est obligatoire.");
            return;
        }
        setIsLoading(true);
        try {
            await TypesService.update(type.id, form);
            onSuccess();
            onHide();
        } catch (err: any) {
            setError(err.response?.data?.message || "Erreur lors de la modification.");
        } finally {
            setIsLoading(false);
        }
    };

    // â”€â”€ Image sÃ©lectionnÃ©e â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const selectedImage = images.find(img => img.fileName === form.image);


const getImageSrc = (fileName: string): string => {
    if (!fileName) return '/images/equipements/equipement.png';
    
    // Si c'est un UUID (image uploadÃ©e) â†’ backend
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
        .test(fileName);
    
    return isUUID
        ? `/api/images/file/${fileName}`      // â† image uploadÃ©e
        : `/images/equipements/${fileName}`;   // â† image statique
};

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold">
                    <i className="bi bi-pencil-square text-warning me-2" />
                    Modifier le type
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4">
                {error && (
                    <Alert variant="danger" className="rounded-3">{error}</Alert>
                )}
                <Form>
                    {/* Nom */}
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">
                            Nom du type <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            name="typeName"
                            value={form.typeName}
                            onChange={handleChange}
                            className="rounded-3"
                        />
                    </Form.Group>

                    {/* Marque + ModÃ¨le */}
                    <div className="row">
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Marque</Form.Label>
                                <Form.Control
                                    name="marque"
                                    value={form.marque}
                                    onChange={handleChange}
                                    className="rounded-3"
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">ModÃ¨le</Form.Label>
                                <Form.Control
                                    name="modele"
                                    value={form.modele}
                                    onChange={handleChange}
                                    className="rounded-3"
                                />
                            </Form.Group>
                        </div>
                    </div>

                    {/* Image Picker dynamique */}
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Image</Form.Label>

                        {/* AperÃ§u + bouton ouvrir */}
                        <div
                            className="border rounded-3 p-3 d-flex
                                       align-items-center gap-3 bg-light"
                            onClick={() => setShowPicker(!showPicker)}
                            style={{ cursor: 'pointer' }}
                        >
                            {form.image ? (
                                <>
                                    <img
                                        src={getImageSrc(form.image)}
                                        alt={form.image}
                                        style={{ width: '45px', height: '45px',
                                                 objectFit: 'contain' }}
                                        onError={e => {
                                            const t = e.target as HTMLImageElement;
                                            if (!t.src.includes('/images/equipements/')) {
                                                t.src = `/images/equipements/${form.image}`;
                                            } else {
                                                t.src = '/images/equipements/equipement.png';
                                            }
                                        }}
                                    />
                                    <div>
                                        <p className="mb-0 fw-semibold small">
                                            {selectedImage?.label || form.image}
                                        </p>
                                        <small className="text-muted">
                                            Cliquez pour changer
                                        </small>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div
                                        className="rounded-circle bg-secondary
                                                   bg-opacity-10 d-flex
                                                   align-items-center
                                                   justify-content-center"
                                        style={{ width: '45px', height: '45px',
                                                 minWidth: '45px' }}
                                    >
                                        <i className="bi bi-image text-muted fs-4" />
                                    </div>
                                    <div>
                                        <p className="mb-0 fw-semibold small text-muted">
                                            Aucune image sÃ©lectionnÃ©e
                                        </p>
                                        <small className="text-muted">
                                            Cliquez pour choisir
                                        </small>
                                    </div>
                                </>
                            )}
                            <i className={`bi ${showPicker
                                ? 'bi-chevron-up' : 'bi-chevron-down'}
                                ms-auto text-muted`}
                            />
                        </div>

                        {/* Grille de sÃ©lection */}
                        {showPicker && (
                            <div
                                className="border rounded-3 p-3 mt-2"
                                style={{ maxHeight: '260px', overflowY: 'auto' }}
                            >
                                {imgLoading ? (
                                    <div className="text-center py-3">
                                        <div className="spinner-border
                                                        spinner-border-sm
                                                        text-warning" />
                                        <p className="text-muted small mt-2 mb-0">
                                            Chargement des images...
                                        </p>
                                    </div>
                                ) : images.length === 0 ? (
                                    <div className="text-center py-3 text-muted small">
                                        <i className="bi bi-exclamation-circle me-1" />
                                        Aucune image disponible
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
                background: form.image === img.fileName
                    ? 'rgba(255,193,7,0.15)' : 'white',
                transition: 'all 0.2s'
            }}
            onClick={() => {
                setForm(prev => ({ ...prev, image: img.fileName }));
                setShowPicker(false);
            }}
        >
            <img
                src={getImageSrc(img.fileName)} // â† corrigÃ©
                alt={img.label}
                style={{ width: '40px', height: '40px',
                         objectFit: 'contain' }}
                onError={e => {
                    const t = e.target as HTMLImageElement;
                    if (!t.src.includes('/images/equipements/')) {
                        t.src = `/images/equipements/${img.fileName}`;
                    } else {
                        t.src = '/images/equipements/equipement.png';
                    }
                }}
            />
            <small className="text-muted"
                   style={{ fontSize: '0.65rem', lineHeight: '1.2' }}>
                {img.label}
            </small>
            {form.image === img.fileName && (
                <i className="bi bi-check-circle-fill text-warning small" />
            )}
        </div>
    </div>
))}


                              




                                    </div>
                                )}
                            </div>
                        )}
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer className="border-0">
                <Button variant="light" onClick={onHide} className="rounded-3">
                    Annuler
                </Button>
                <Button
                    variant="warning"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="rounded-3 text-white"
                >
                    {isLoading ? (
                        <><Spinner size="sm" className="me-2" />Modification...</>
                    ) : (
                        <><i className="bi bi-pencil me-2" />Modifier</>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default TypeUpdateModal;