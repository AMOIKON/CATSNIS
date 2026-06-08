import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import StatesService from '../../services/statesService';
import { StatesRequest, StatesResponse } from '../../types';

interface Props {
    show:      boolean;
    onHide:    () => void;
    onSuccess: () => void;
    state:     StatesResponse | null;
}

const StateUpdateModal: React.FC<Props> = ({ show, onHide, onSuccess, state }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error,     setError]     = useState<string | null>(null);
    const [form,      setForm]      = useState<StatesRequest>({ statesName: '' });

    useEffect(() => {
        if (show && state) setForm({ statesName: state.statesName });
    }, [show, state]);

    const handleSubmit = async () => {
        if (!state) return;
        setError(null);
        if (!form.statesName.trim()) {
            setError("Le nom de l'état est obligatoire.");
            return;
        }
        setIsLoading(true);
        try {
            await StatesService.update(state.id, form);
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
                    <i className="bi bi-pencil-square text-success me-2" />
                    Modifier l'état
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4">
                {error && <Alert variant="danger" className="rounded-3">{error}</Alert>}
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">
                            Nom de l'état <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            value={form.statesName}
                            onChange={e => setForm({ statesName: e.target.value })}
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

export default StateUpdateModal;