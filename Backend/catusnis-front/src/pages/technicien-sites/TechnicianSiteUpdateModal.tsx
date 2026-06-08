import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert, Row, Col } from 'react-bootstrap';
import TechnicianSiteService, {
    TechnicianSiteRequest,
    TechnicianSiteResponse,
} from '../../services/technicianSiteService';
import PersonService, { PersonResponse } from '../../services/personService';
import RegionService   from '../../services/regionService';
import DistrictService from '../../services/districtService';
import HealthService   from '../../services/healthService';
import { RegionResponse, DistrictResponse, HealthResponse } from '../../types';

interface Props {
    show:       boolean;
    onHide:     () => void;
    onSuccess:  () => void;
    assignment: TechnicianSiteResponse | null;
}

const TechnicianSiteUpdateModal: React.FC<Props> = ({ show, onHide, onSuccess, assignment }) => {
    const [isLoading,  setIsLoading]  = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [error,      setError]      = useState<string | null>(null);

    const [technicians, setTechnicians] = useState<PersonResponse[]>([]);
    const [regions,     setRegions]     = useState<RegionResponse[]>([]);
    const [districts,   setDistricts]   = useState<DistrictResponse[]>([]);
    const [healths,     setHealths]     = useState<HealthResponse[]>([]);

    const [personId,   setPersonId]   = useState<number>(0);
    const [regionId,   setRegionId]   = useState<number>(0);
    const [districtId, setDistrictId] = useState<number>(0);
    const [healthId,   setHealthId]   = useState<number>(0);

    useEffect(() => {
        if (!show || !assignment) return;
        setError(null); setIsFetching(true);

        Promise.all([
            PersonService.getAllList(),
            RegionService.getAllList(),
        ]).then(async ([persons, regs]) => {
            setTechnicians(persons.filter(p => {
                const r = (p as any).role ?? (p as any).roleName ?? (p as any).roleCode ?? '';
                return typeof r === 'string' ? r.toUpperCase() === 'TECHNICIEN' : false;
            }));
            setRegions(regs);

            setPersonId(assignment.personId);
            setRegionId(assignment.regionId ?? 0);
            setDistrictId(assignment.districtId ?? 0);
            setHealthId(assignment.healthId ?? 0);

            if (assignment.regionId)
                setDistricts(await DistrictService.getAllList(assignment.regionId));
            if (assignment.districtId)
                setHealths(await HealthService.getAllList(assignment.districtId));
        }).catch(() => {
            setError('Erreur lors du chargement des données.');
        }).finally(() => setIsFetching(false));
    }, [show, assignment]);

    const handleRegionChange = async (id: number) => {
        setRegionId(id); setDistrictId(0); setHealthId(0);
        setDistricts([]); setHealths([]);
        if (id) setDistricts(await DistrictService.getAllList(id));
    };

    const handleDistrictChange = async (id: number) => {
        setDistrictId(id); setHealthId(0); setHealths([]);
        if (id) setHealths(await HealthService.getAllList(id));
    };

    const handleSubmit = async () => {
        setError(null);
        if (!personId) { setError('Veuillez sélectionner un technicien.');  return; }
        if (!healthId) { setError('Veuillez sélectionner un site de santé.'); return; }

        setIsLoading(true);
        try {
            const request: TechnicianSiteRequest = {
                personId,
                regionId:   regionId   || undefined,
                districtId: districtId || undefined,
                healthId:   healthId   || undefined,
            };
            // ✅ Vérifier si update existe, sinon supprimer + recréer
            if (typeof TechnicianSiteService.update === 'function') {
                await TechnicianSiteService.update(assignment!.id, request);
            } else {
                await TechnicianSiteService.unassign(assignment!.id);
                await TechnicianSiteService.assign(request);
            }
            onSuccess(); onHide();
        } catch (err: any) {
            setError(err.response?.data?.message || "Erreur lors de la mise à jour.");
        } finally { setIsLoading(false); }
    };

    const selectedTech = technicians.find(t => t.id === personId);

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold">
                    <i className="bi bi-pencil-fill text-warning me-2" />
                    Modifier l'assignation
                    {assignment && (
                        <span className="badge bg-warning bg-opacity-10 text-warning ms-2 small fw-normal">
                            #{assignment.id}
                        </span>
                    )}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body className="px-4">
                {error && (
                    <Alert variant="danger" className="rounded-3 small">
                        <i className="bi bi-exclamation-circle me-2" />{error}
                    </Alert>
                )}

                {isFetching ? (
                    <div className="text-center py-4">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-2 text-muted small">Chargement...</p>
                    </div>
                ) : (
                    <>
                        {/* Résumé assignation actuelle */}
                        {assignment && (
                            <div className="alert alert-light border rounded-3 mb-4 small">
                                <div className="d-flex gap-2 flex-wrap">
                                    <span className="fw-semibold text-muted">Assignation actuelle :</span>
                                    <span className="badge bg-danger bg-opacity-10 text-danger">
                                        <i className="bi bi-hospital me-1" />{assignment.healthName}
                                    </span>
                                    <span className="badge bg-info bg-opacity-10 text-info">
                                        {assignment.districtName}
                                    </span>
                                    <span className="badge bg-success bg-opacity-10 text-success">
                                        {assignment.regionName}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Technicien */}
                        <div className="card border-0 bg-light rounded-4 p-3 mb-3">
                            <h6 className="fw-bold text-warning mb-3">
                                <i className="bi bi-person-fill me-2" />Technicien
                            </h6>
                            <Form.Select value={personId}
                                onChange={e => setPersonId(Number(e.target.value))}
                                className="rounded-3" size="sm">
                                <option value={0}>-- Sélectionner --</option>
                                {technicians.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {t.firstName} {t.lastName}{t.postName ? ` — ${t.postName}` : ''}
                                    </option>
                                ))}
                            </Form.Select>
                            {selectedTech && (
                                <div className="mt-2 p-2 bg-white rounded-3 border d-flex align-items-center gap-3">
                                    <div className="rounded-circle bg-warning d-flex align-items-center
                                        justify-content-center text-white fw-bold small flex-shrink-0"
                                        style={{ width: '36px', height: '36px' }}>
                                        {selectedTech.firstName.charAt(0)}{selectedTech.lastName.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="mb-0 fw-semibold small">
                                            {selectedTech.firstName} {selectedTech.lastName}
                                        </p>
                                        <small className="text-muted">{selectedTech.postName || 'Technicien'}</small>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Localisation */}
                        <div className="card border-0 bg-light rounded-4 p-3 mb-3">
                            <h6 className="fw-bold text-warning mb-3">
                                <i className="bi bi-geo-alt me-2" />Localisation
                            </h6>
                            <Row className="g-3">
                                <Col md={6}>
                                    <Form.Label className="fw-semibold small">Région</Form.Label>
                                    <Form.Select value={regionId}
                                        onChange={e => handleRegionChange(Number(e.target.value))}
                                        className="rounded-3" size="sm">
                                        <option value={0}>-- Région --</option>
                                        {regions.map(r => <option key={r.id} value={r.id}>{r.regionName}</option>)}
                                    </Form.Select>
                                </Col>
                                <Col md={6}>
                                    <Form.Label className="fw-semibold small">District</Form.Label>
                                    <Form.Select value={districtId}
                                        onChange={e => handleDistrictChange(Number(e.target.value))}
                                        disabled={!regionId} className="rounded-3" size="sm">
                                        <option value={0}>-- District --</option>
                                        {districts.map(d => <option key={d.id} value={d.id}>{d.DistrictName}</option>)}
                                    </Form.Select>
                                </Col>
                                <Col md={12}>
                                    <Form.Label className="fw-semibold small">
                                        Site de santé <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Select value={healthId}
                                        onChange={e => setHealthId(Number(e.target.value))}
                                        disabled={!districtId} className="rounded-3" size="sm">
                                        <option value={0}>-- Site --</option>
                                        {healths.map(h => <option key={h.id} value={h.id}>{h.healthName}</option>)}
                                    </Form.Select>
                                    {!districtId && (
                                        <Form.Text className="text-muted">
                                            <i className="bi bi-info-circle me-1" />
                                            Sélectionnez une région puis un district.
                                        </Form.Text>
                                    )}
                                </Col>
                            </Row>
                        </div>
                    </>
                )}
            </Modal.Body>

            <Modal.Footer className="border-0">
                <Button variant="light" onClick={onHide} disabled={isLoading} className="rounded-3">
                    Annuler
                </Button>
                <Button variant="warning" onClick={handleSubmit}
                    disabled={isLoading || isFetching || !personId || !healthId}
                    className="rounded-3 text-white">
                    {isLoading
                        ? <><Spinner size="sm" className="me-2" />Mise à jour...</>
                        : <><i className="bi bi-check-circle me-2" />Enregistrer</>
                    }
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default TechnicianSiteUpdateModal;