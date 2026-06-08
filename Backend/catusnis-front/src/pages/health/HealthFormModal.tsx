import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import HealthService   from '../../services/healthService';
import RegionService   from '../../services/regionService';
import DistrictService from '../../services/districtService';
import { HealthRequest, RegionResponse, DistrictResponse } from '../../types';

interface Props {
    show:      boolean;
    onHide:    () => void;
    onSuccess: () => void;
}

const HealthFormModal: React.FC<Props> = ({ show, onHide, onSuccess }) => {
    const [isLoading,  setIsLoading]  = useState(false);
    const [error,      setError]      = useState<string | null>(null);
    const [regions,    setRegions]    = useState<RegionResponse[]>([]);
    const [districts,  setDistricts]  = useState<DistrictResponse[]>([]);
    const [form,       setForm]       = useState<HealthRequest>({
        healthName: '', districtId: 0, regionId: 0
    });

    useEffect(() => {
        if (show) RegionService.getAllList().then(setRegions);
    }, [show]);

    // Charger les districts quand la région change
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
        setError(null);
        if (!form.healthName.trim() || !form.districtId || !form.regionId) {
            setError('Veuillez remplir tous les champs obligatoires.');
            return;
        }
        setIsLoading(true);
        try {
            await HealthService.create(form);
            onSuccess();
            onHide();
            setForm({ healthName: '', districtId: 0, regionId: 0 });
            setDistricts([]);
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
                    <i className="bi bi-hospital-fill text-danger me-2" />
                    Nouveau site de santé
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
                            placeholder="Ex: CSU de Korhogo"
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
                        : <i className="bi bi-plus-circle me-2" />
                    }
                    Enregistrer
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default HealthFormModal;