import React, { useState } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import RegionService from '../../services/regionService';
import { RegionRequest } from '../../types';
import notify from '../../services/notify';

interface Props {
    show:      boolean;
    onHide:    () => void;
    onSuccess: () => void;
}

const RegionFormModal: React.FC<Props> = ({ show, onHide, onSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error,     setError]     = useState<string | null>(null);
    const [form,      setForm]      = useState<RegionRequest>({ regionName: '' });

    const handleSubmit = async () => {
        setError(null);
        if (!form.regionName.trim()) {
            setError('Le nom de la région est obligatoire.');
            return;
        }
        setIsLoading(true);
        try {
            await RegionService.create(form);
            notify.success('Région créée avec succès');
            onSuccess();
            onHide();
            setForm({ regionName: '' });
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Erreur lors de la création.';
            setError(msg);
            notify.apiError(err, 'Erreur lors de la création de la région');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold">
                    <i className="bi bi-geo-alt-fill text-success me-2" />
                    Nouvelle région
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4">
                {error && <Alert variant="danger" className="rounded-3">{error}</Alert>}
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">
                            Nom de la région <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            value={form.regionName}
                            onChange={e => setForm({ regionName: e.target.value })}
                            placeholder="Ex: PORO"
                            className="rounded-3"
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer className="border-0">
                <Button variant="light" onClick={onHide} className="rounded-3">
                    Annuler
                </Button>
                <Button
                    variant="success"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="rounded-3"
                >
                    {isLoading
                        ? <Spinner size="sm" className="me-2" />
                        : <i className="bi bi-plus-circle me-2" />
                    }
                    Enregistrer
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default RegionFormModal;