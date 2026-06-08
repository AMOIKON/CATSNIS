import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import DistrictService from '../../services/districtService';
import RegionService   from '../../services/regionService';
import { DistrictRequest, RegionResponse } from '../../types';

interface Props {
    show:      boolean;
    onHide:    () => void;
    onSuccess: () => void;
}

const DistrictFormModal: React.FC<Props> = ({ show, onHide, onSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error,     setError]     = useState<string | null>(null);
    const [regions,   setRegions]   = useState<RegionResponse[]>([]);
    const [form,      setForm]      = useState<DistrictRequest>({
        districtName: '', regionId: 0
    });

    useEffect(() => {
        if (show) {
            RegionService.getAllList().then(setRegions);
        }
    }, [show]);

    const handleSubmit = async () => {
        setError(null);
        if (!form.districtName.trim() || !form.regionId) {
            setError('Veuillez remplir tous les champs obligatoires.');
            return;
        }
        setIsLoading(true);
        try {
            await DistrictService.create(form);
            onSuccess();
            onHide();
            setForm({ districtName: '', regionId: 0 });
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
                    <i className="bi bi-map-fill text-info me-2" />
                    Nouveau district
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4">
                {error && <Alert variant="danger" className="rounded-3">{error}</Alert>}
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">
                            Nom du district <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            value={form.districtName}
                            onChange={e => setForm(prev => ({
                                ...prev, districtName: e.target.value
                            }))}
                            placeholder="Ex: KORHOGO 1"
                            className="rounded-3"
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">
                            Région <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select
                            value={form.regionId}
                            onChange={e => setForm(prev => ({
                                ...prev, regionId: Number(e.target.value)
                            }))}
                            className="rounded-3"
                        >
                            <option value={0}>-- Sélectionner une région --</option>
                            {regions.map(r => (
                                <option key={r.id} value={r.id}>{r.regionName}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer className="border-0">
                <Button variant="light" onClick={onHide} className="rounded-3">
                    Annuler
                </Button>
                <Button
                    variant="info"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="rounded-3 text-white"
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

export default DistrictFormModal;