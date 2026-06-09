import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import ImageService from '../../services/imageService';
import { ImageRequest, ImageResponse } from '../../types';
import { getImageSrc } from '../../utils/imageUtils';

const PLACEHOLDER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 24 24" fill="%23dee2e6"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>';

interface Props {
    show:      boolean;
    onHide:    () => void;
    onSuccess: () => void;
    image:     ImageResponse | null;
}

const ImageUpdateModal: React.FC<Props> = ({ show, onHide, onSuccess, image }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error,     setError]     = useState<string | null>(null);
    const [label,     setLabel]     = useState('');
    const [file,      setFile]      = useState<File | null>(null);
    const [preview,   setPreview]   = useState<string | null>(null);

    // â”€â”€ PrÃ©-remplir â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    useEffect(() => {
        if (show && image) {
            setLabel(image.label);
            // âœ… AperÃ§u depuis l'API (pas depuis image.url qui peut Ãªtre obsolÃ¨te)
            setPreview(getImageSrc(image.fileName));
            setFile(null);
        }
    }, [show, image]);

    // â”€â”€ SÃ©lection nouveau fichier â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
        }
    };

    const handleSubmit = async () => {
        if (!image) return;
        setError(null);
        if (!label.trim()) {
            setError('Le libellÃ© est obligatoire.');
            return;
        }
        setIsLoading(true);
        try {
            if (file) {
                // âœ… Nouveau fichier : upload puis suppression de l'ancienne
                await ImageService.upload(file, label);
                await ImageService.delete(image.id);
            } else {
                // âœ… Juste le libellÃ© modifiÃ©
                const request: ImageRequest = {
                    fileName: image.fileName,
                    label:    label,
                };
                await ImageService.update(image.id, request);
            }
            onSuccess();
            onHide();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de la modification.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold">
                    <i className="bi bi-pencil-square text-primary me-2" />
                    Modifier l'image
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4">
                {error && (
                    <Alert variant="danger" className="rounded-3">{error}</Alert>
                )}
                <Form>
                    {/* LibellÃ© */}
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">
                            LibellÃ© <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            value={label}
                            onChange={e => setLabel(e.target.value)}
                            className="rounded-3"
                        />
                    </Form.Group>

                    {/* Changer l'image (optionnel) */}
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">
                            Changer l'image
                            <span className="text-muted small ms-2">(optionnel)</span>
                        </Form.Label>
                        <Form.Control
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="rounded-3"
                        />
                        <Form.Text className="text-muted">
                            Laissez vide pour conserver l'image actuelle.
                        </Form.Text>
                    </Form.Group>

                    {/* AperÃ§u */}
                    {preview && (
                        <div className="text-center p-3 bg-light rounded-3">
                            <img
                                src={preview}
                                alt={label}
                                style={{ maxWidth: '150px', maxHeight: '150px',
                                         objectFit: 'contain' }}
                                onError={e => {
                                    const t = e.target as HTMLImageElement;
                                    t.onerror = null; // Ã©vite la boucle infinie
                                    t.src = PLACEHOLDER;
                                }}
                            />
                            <p className="mb-0 small text-muted mt-2">AperÃ§u</p>
                        </div>
                    )}
                </Form>
            </Modal.Body>
            <Modal.Footer className="border-0">
                <Button variant="light" onClick={onHide} className="rounded-3">
                    Annuler
                </Button>
                <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="rounded-3"
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

export default ImageUpdateModal;