import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import RegionService from '../../services/regionService';
import { RegionRequest, RegionResponse } from '../../types';
import notify from '../../services/notify';

interface Props {
    show:      boolean;
    onHide:    () => void;
    onSuccess: () => void;
    region:    RegionResponse | null;
}

const RegionUpdateModal: React.FC<Props> = ({ show, onHide, onSuccess, region }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error,     setError]     = useState<string | null>(null);
    const [form,      setForm]      = useState<RegionRequest>({ regionName: '' });

    useEffect(() => {
        if (show && region) {
            setForm({ regionName: region.regionName });
        }
    }, [show, region]);

    const handleSubmit = async () => {
        if (!region) return;
        setError(null);
        if (!form.regionName.trim()) {
            setError('Le nom de la région est obligatoire.');
            return;
        }
        setIsLoading(true);
        try {
            await RegionService.update(region.id, form);
            notify.success('Région modifiée avec succès');
            onSuccess();
            onHide();
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Erreur lors de la modification.';
            setError(msg);
            notify.apiError(err, 'Erreur lors de la modification de la région');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold">
                    <i className="bi bi-pencil-square text-success me-2" />
                    Modifier la région
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
                        : <i className="bi bi-pencil me-2" />
                    }
                    Modifier
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default RegionUpdateModal;