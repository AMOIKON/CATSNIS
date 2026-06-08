import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert, Row, Col, Badge } from 'react-bootstrap';
import TechnicianSiteService, { TechnicianSiteRequest } from '../../services/technicianSiteService';
import PersonService, { PersonResponse } from '../../services/personService';
import RegionService   from '../../services/regionService';
import DistrictService from '../../services/districtService';
import HealthService   from '../../services/healthService';
import { RegionResponse, DistrictResponse, HealthResponse } from '../../types';

interface Props {
    show:      boolean;
    onHide:    () => void;
    onSuccess: () => void;
}

const TechnicianSiteFormModal: React.FC<Props> = ({ show, onHide, onSuccess }) => {
    const [isLoading,   setIsLoading]   = useState(false);
    const [error,       setError]       = useState<string | null>(null);
    const [warn,        setWarn]        = useState<string | null>(null);

    const [technicians, setTechnicians] = useState<PersonResponse[]>([]);
    const [regions,     setRegions]     = useState<RegionResponse[]>([]);
    const [districts,   setDistricts]   = useState<DistrictResponse[]>([]);
    const [healths,     setHealths]     = useState<HealthResponse[]>([]);

    const [personId,          setPersonId]          = useState<number>(0);
    const [regionId,          setRegionId]          = useState<number>(0);
    const [districtId,        setDistrictId]        = useState<number>(0);
    const [selectedHealthIds, setSelectedHealthIds] = useState<number[]>([]);
    const [searchSite,        setSearchSite]        = useState('');

    useEffect(() => {
        if (!show) return;
        setError(null); setWarn(null);
        setPersonId(0); setRegionId(0); setDistrictId(0);
        setDistricts([]); setHealths([]);
        setSelectedHealthIds([]); setSearchSite('');

        Promise.all([
            PersonService.getAllList(),
            RegionService.getAllList(),
        ]).then(([persons, regs]) => {
            // ✅ Filtre robuste multi-champs
            setTechnicians(persons.filter(p => {
                const r = (p as any).role ?? (p as any).roleName ?? (p as any).roleCode ?? '';
                return typeof r === 'string' ? r.toUpperCase() === 'TECHNICIEN' : false;
            }));
            setRegions(regs);
        }).catch(() => setError('Erreur lors du chargement des données'));
    }, [show]);

    const handleRegionChange = async (id: number) => {
        setRegionId(id); setDistrictId(0);
        setHealths([]); setSelectedHealthIds([]);
        setDistricts(id ? await DistrictService.getAllList(id) : []);
    };

    const handleDistrictChange = async (id: number) => {
        setDistrictId(id);
        setHealths([]); setSelectedHealthIds([]);
        setSearchSite('');
        if (id) setHealths(await HealthService.getAllList(id));
    };

    const toggleHealth = (id: number) =>
        setSelectedHealthIds(prev =>
            prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]
        );

    const filteredHealths = healths.filter(h =>
        h.healthName.toLowerCase().includes(searchSite.toLowerCase())
    );

    const toggleAll = () =>
        setSelectedHealthIds(
            selectedHealthIds.length === filteredHealths.length
                ? []
                : filteredHealths.map(h => h.id)
        );

    const selectedTech = technicians.find(t => t.id === personId);

    const handleSubmit = async () => {
        setError(null); setWarn(null);
        if (!personId)                      { setError('Veuillez sélectionner un technicien.');    return; }
        if (selectedHealthIds.length === 0) { setError('Veuillez sélectionner au moins un site.'); return; }

        setIsLoading(true);
        try {
            const results = await Promise.allSettled(
                selectedHealthIds.map(healthId =>
                    TechnicianSiteService.assign({
                        personId,
                        regionId:   regionId   || undefined,
                        districtId: districtId || undefined,
                        healthId,
                    } as TechnicianSiteRequest)
                )
            );

            const succeeded = results.filter(r => r.status === 'fulfilled').length;
            const failed    = results.filter(r => r.status === 'rejected').length;

            if (succeeded === 0) {
                setError(failed === 1
                    ? 'Ce site est déjà assigné à ce technicien.'
                    : `${failed} site(s) déjà assigné(s) à ce technicien.`);
                return;
            }
            if (failed > 0) {
                setWarn(`${succeeded} site(s) assigné(s). ${failed} site(s) ignoré(s) (déjà assignés).`);
                setTimeout(() => { onSuccess(); onHide(); }, 2000);
                return;
            }
            onSuccess(); onHide();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold">
                    <i className="bi bi-geo-alt-fill text-primary me-2" />
                    Assigner des sites à un technicien
                </Modal.Title>
            </Modal.Header>

            <Modal.Body className="px-4">
                {error && <Alert variant="danger"  className="rounded-3 small"><i className="bi bi-exclamation-circle me-2" />{error}</Alert>}
                {warn  && <Alert variant="warning" className="rounded-3 small"><i className="bi bi-exclamation-triangle me-2" />{warn}</Alert>}

                {/* ── Technicien ── */}
                <div className="card border-0 bg-light rounded-4 p-3 mb-3">
                    <h6 className="fw-bold text-primary mb-3">
                        <i className="bi bi-person-fill me-2" />Technicien
                    </h6>
                    <Form.Select value={personId}
                        onChange={e => setPersonId(Number(e.target.value))}
                        className="rounded-3" size="sm">
                        <option value={0}>-- Sélectionner un technicien --</option>
                        {technicians.map(t => (
                            <option key={t.id} value={t.id}>
                                {t.firstName} {t.lastName}{t.postName ? ` — ${t.postName}` : ''}
                            </option>
                        ))}
                    </Form.Select>
                    {selectedTech && (
                        <div className="mt-2 p-2 bg-white rounded-3 border d-flex align-items-center gap-3">
                            <div className="rounded-circle bg-primary d-flex align-items-center
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

                {/* ── Localisation ── */}
                <div className="card border-0 bg-light rounded-4 p-3 mb-3">
                    <h6 className="fw-bold text-primary mb-3">
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
                    </Row>
                </div>

                {/* ── Sites de santé ── */}
                {healths.length > 0 && (
                    <div className="card border-0 bg-light rounded-4 p-3">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="fw-bold text-primary mb-0">
                                <i className="bi bi-hospital-fill me-2" />Sites de santé
                                {selectedHealthIds.length > 0 && (
                                    <Badge bg="primary" className="ms-2 fw-normal">
                                        {selectedHealthIds.length}/{healths.length}
                                    </Badge>
                                )}
                            </h6>
                            <button type="button"
                                className="btn btn-sm btn-outline-secondary rounded-3"
                                onClick={toggleAll}>
                                {selectedHealthIds.length === filteredHealths.length
                                    ? 'Désélectionner tout'
                                    : 'Tout sélectionner'}
                            </button>
                        </div>

                        {/* Barre de recherche sites */}
                        {healths.length > 5 && (
                            <div className="input-group input-group-sm mb-2">
                                <span className="input-group-text bg-white border-end-0">
                                    <i className="bi bi-search text-muted" />
                                </span>
                                <input type="text"
                                    className="form-control border-start-0 rounded-end-3"
                                    placeholder="Filtrer les sites..."
                                    value={searchSite}
                                    onChange={e => setSearchSite(e.target.value)} />
                            </div>
                        )}

                        <div className="border rounded-3 bg-white p-2"
                            style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {filteredHealths.length === 0 ? (
                                <p className="text-muted small text-center py-2 mb-0">Aucun site trouvé</p>
                            ) : filteredHealths.map(h => (
                                <Form.Check key={h.id} type="checkbox"
                                    id={`health-${h.id}`}
                                    label={h.healthName}
                                    checked={selectedHealthIds.includes(h.id)}
                                    onChange={() => toggleHealth(h.id)}
                                    className="mb-1 small" />
                            ))}
                        </div>
                    </div>
                )}

                {!districtId && (
                    <p className="text-muted small mt-2 mb-0">
                        <i className="bi bi-info-circle me-1" />
                        Sélectionnez une région puis un district pour afficher les sites.
                    </p>
                )}
            </Modal.Body>

            <Modal.Footer className="border-0">
                <Button variant="light" onClick={onHide} className="rounded-3">Annuler</Button>
                <Button variant="primary" onClick={handleSubmit}
                    disabled={isLoading || selectedHealthIds.length === 0 || !personId}
                    className="rounded-3">
                    {isLoading
                        ? <><Spinner size="sm" className="me-2" />Assignation...</>
                        : <><i className="bi bi-plus-circle me-2" />
                            Assigner {selectedHealthIds.length > 0
                                ? `(${selectedHealthIds.length} site${selectedHealthIds.length > 1 ? 's' : ''})` : ''}
                          </>
                    }
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default TechnicianSiteFormModal;