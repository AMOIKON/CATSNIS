import React, { useState } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import UnitsService from '../../services/unitsService';
import { UnitsRequest } from '../../types';

interface Props {
    show:      boolean;
    onHide:    () => void;
    onSuccess: () => void;
}

const UnitFormModal: React.FC<Props> = ({ show, onHide, onSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error,     setError]     = useState<string | null>(null);
    const [form,      setForm]      = useState<UnitsRequest>({ unitName: '' });

    const handleSubmit = async () => {
        setError(null);
        if (!form.unitName.trim()) {
            setError("Le nom de l'unité est obligatoire.");
            return;
        }
        setIsLoading(true);
        try {
            await UnitsService.create(form);
            onSuccess();
            onHide();
            setForm({ unitName: '' });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de la création.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold">
                    <i className="bi bi-building-fill text-success me-2" />
                    Nouvelle unité
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4">
                {error && <Alert variant="danger" className="rounded-3">{error}</Alert>}
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">
                            Nom de l'unité <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            value={form.unitName}
                            onChange={e => setForm({ unitName: e.target.value })}
                            placeholder="Ex: Direction Régionale"
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

export default UnitFormModal;