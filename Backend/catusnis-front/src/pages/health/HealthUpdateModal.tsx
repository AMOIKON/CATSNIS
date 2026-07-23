import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import HealthService   from '../../services/healthService';
import RegionService   from '../../services/regionService';
import DistrictService from '../../services/districtService';
import { HealthRequest, HealthResponse, RegionResponse, DistrictResponse } from '../../types';
import notify from '../../services/notify';

interface Props {
    show:      boolean;
    onHide:    () => void;
    onSuccess: () => void;
    health:    HealthResponse | null;
}

const HealthUpdateModal: React.FC<Props> = ({ show, onHide, onSuccess, health }) => {
    const [isLoading,  setIsLoading]  = useState(false);
    const [error,      setError]      = useState<string | null>(null);
    const [regions,    setRegions]    = useState<RegionResponse[]>([]);
    const [districts,  setDistricts]  = useState<DistrictResponse[]>([]);
    const [form,       setForm]       = useState<HealthRequest>({
        healthName: '', districtId: 0, regionId: 0
    });

    useEffect(() => {
        if (show && health) {
            setForm({ healthName: health.healthName, districtId: 0, regionId: 0 });
            RegionService.getAllList().then(setRegions);
        }
    }, [show, health]);

    const handleRegionChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const regionId = Number(e.target.value);
        setForm(prev => ({ ...prev, regionId, districtId: 0 }));
        if (regionId) {
            const data = await DistrictService.getAllList(regionId);
            setDistricts(data);
        } else {
            setDistricts([]);
        }
    };

    const handleSubmit = async () => {
        if (!health) return;
        setError(null);
        if (!form.healthName.trim() || !form.districtId || !form.regionId) {
            setError('Veuillez remplir tous les champs obligatoires.');
            return;
        }
        setIsLoading(true);
        try {
            await HealthService.update(health.id, form);
            notify.success('Site de santé modifié avec succès');
            onSuccess();
            onHide();
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Erreur lors de la modification.';
            setError(msg);
            notify.apiError(err, 'Erreur lors de la modification du site de santé');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold">
                    <i className="bi bi-pencil-square text-danger me-2" />
                    Modifier le site de santé
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4">
                {error && <Alert variant="danger" className="rounded-3">{error}</Alert>}
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">
                            Nom du site <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            value={form.healthName}
                            onChange={e => setForm(prev => ({
                                ...prev, healthName: e.target.value
                            }))}
                            className="rounded-3"
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">
                            Région <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select
                            value={form.regionId}
                            onChange={handleRegionChange}
                            className="rounded-3"
                        >
                            <option value={0}>-- Sélectionner une région --</option>
                            {regions.map(r => (
                                <option key={r.id} value={r.id}>{r.regionName}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">
                            District <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select
                            value={form.districtId}
                            onChange={e => setForm(prev => ({
                                ...prev, districtId: Number(e.target.value)
                            }))}
                            className="rounded-3"
                            disabled={!form.regionId}
                        >
                            <option value={0}>-- Sélectionner un district --</option>
                            {districts.map(d => (
                                <option key={d.id} value={d.id}>{d.DistrictName}</option>
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
                    variant="danger"
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

export default HealthUpdateModal;