import React, { useState } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import ImageService from '../../services/imageService';

interface Props {
    show:      boolean;
    onHide:    () => void;
    onSuccess: () => void;
}

const ImageFormModal: React.FC<Props> = ({ show, onHide, onSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error,     setError]     = useState<string | null>(null);
    const [label,     setLabel]     = useState('');
    const [file,      setFile]      = useState<File | null>(null);
    const [preview,   setPreview]   = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
        }
    };

    const handleSubmit = async () => {
        setError(null);
        if (!file || !label.trim()) {
            setError('Veuillez sélectionner une image et entrer un libellé.');
            return;
        }
        setIsLoading(true);
        try {
            await ImageService.upload(file, label);
            onSuccess();
            onHide();
            setFile(null);
            setLabel('');
            setPreview(null);
        } catch (err: any) {
            setError(err.response?.data?.message || "Erreur lors de l'upload.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold">
                    <i className="bi bi-image-fill text-primary me-2" />
                    Ajouter une image
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4">
                {error && (
                    <Alert variant="danger" className="rounded-3">{error}</Alert>
                )}
                <Form>
                    {/* Upload fichier */}
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">
                            Fichier image <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="rounded-3"
                        />
                    </Form.Group>

                    {/* Libellé */}
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">
                            Libellé <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            value={label}
                            onChange={e => setLabel(e.target.value)}
                            placeholder="Ex: Ordinateur Bureau"
                            className="rounded-3"
                        />
                    </Form.Group>

                    {/* Aperçu */}
                    {preview && (
                        <div className="text-center p-3 bg-light rounded-3">
                            <img
                                src={preview}
                                alt="aperçu"
                                style={{ maxWidth: '150px', maxHeight: '150px',
                                         objectFit: 'contain' }}
                            />
                            <p className="mb-0 small text-muted mt-2">Aperçu</p>
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
                    {isLoading
                        ? <><Spinner size="sm" className="me-2" />Upload...</>
                        : <><i className="bi bi-cloud-upload me-2" />Uploader</>
                    }
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ImageFormModal;