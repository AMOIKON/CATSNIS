import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import DeploymentService  from '../../services/deploymentService';
import RegionService      from '../../services/regionService';
import DistrictService    from '../../services/districtService';
import HealthService      from '../../services/healthService';
import AppsService        from '../../services/appsService';
import AcquisitionService from '../../services/acquisitionService';
import {
    DeploymentRequest, DeploymentItemRequest,
    RegionResponse, DistrictResponse, HealthResponse,
    AppsResponse, AcquisitionResponse
} from '../../types';
import { getImageSrc } from '../../utils/imageUtils';
import useAuth from '../../hooks/useAuth';
import ReferenceService from '../../services/referenceService';

interface Props {
    show:      boolean;
    onHide:    () => void;
    onSuccess: () => void;
    // ✅ Acquisition pré-sélectionnée depuis AcquisitionsPage
    preselectedAcquisition?: AcquisitionResponse | null;
}

const initialForm: DeploymentRequest = {
    codeDep: '', dateRecep: '', comment: '',
    regionId: 0, districtId: 0, healthId: 0,
    appsId: 0, items: [] as DeploymentItemRequest[],
    partnerId: undefined,
};

const DeploymentFormModal: React.FC<Props> = ({
    show, onHide, onSuccess, preselectedAcquisition
}) => {
    const { person, isUnrestricted } = useAuth();

    const [isLoading,    setIsLoading]    = useState(false);
    const [error,        setError]        = useState<string | null>(null);
    const [regions,      setRegions]      = useState<RegionResponse[]>([]);
    const [districts,    setDistricts]    = useState<DistrictResponse[]>([]);
    const [healths,      setHealths]      = useState<HealthResponse[]>([]);
    const [apps,         setApps]         = useState<AppsResponse[]>([]);
    const [acquisitions, setAcquisitions] = useState<AcquisitionResponse[]>([]);
    const [partners,     setPartners]     = useState<{ id: number; name: string }[]>([]);
    const [form,         setForm]         = useState<DeploymentRequest>(initialForm);

    useEffect(() => {
        if (!show) return;
        RegionService.getAllList().then(setRegions).catch(console.error);
        AppsService.getAllList().then(setApps).catch(console.error);
        if (isUnrestricted) {
            ReferenceService.getPartners()
                .then(list => setPartners(list.map(p => ({ id: p.id, name: p.name }))))
                .catch(() => {});
        }
        AcquisitionService.getAvailable().then(list => {
            setAcquisitions(list);
            // ✅ Pré-ajouter l'acquisition sélectionnée dans les items
            if (preselectedAcquisition) {
                // Générer un code automatique
                const code = `DEP-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
                setForm(prev => ({
                    ...prev,
                    codeDep: code,
                    items: [{
                        acquisitionId: preselectedAcquisition.id,
                        status: 'FONCTIONNEL',
                    }],
                }));
            }
        }).catch(console.error);
    }, [show, preselectedAcquisition, isUnrestricted]);

    useEffect(() => {
        if (!show) {
            setForm(initialForm);
            setDistricts([]);
            setHealths([]);
            setError(null);
        }
    }, [show]);

    const handleRegionChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const regionId = Number(e.target.value);
        setForm(prev => ({ ...prev, regionId, districtId: 0, healthId: 0 }));
        setHealths([]);
        if (regionId) {
            const data = await DistrictService.getAllList(regionId);
            setDistricts(data);
        } else setDistricts([]);
    };

    const handleDistrictChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const districtId = Number(e.target.value);
        setForm(prev => ({ ...prev, districtId, healthId: 0 }));
        if (districtId) {
            const data = await HealthService.getAllList(districtId);
            setHealths(data);
        } else setHealths([]);
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: ['healthId', 'appsId', 'partnerId'].includes(name)
                ? (value ? Number(value) : 0) : value,
        }));
    };

    const handleAddItem = () =>
        setForm(prev => ({
            ...prev,
            items: [...prev.items, { acquisitionId: 0, status: 'FONCTIONNEL' }],
        }));

    const handleRemoveItem = (index: number) =>
        setForm(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index),
        }));

    const handleItemChange = (
        index: number, field: keyof DeploymentItemRequest, value: string | number
    ) => {
        const updated = [...form.items];
        // ✅ Empêcher de sélectionner un acquisitionId déjà utilisé par un autre item
        if (field === 'acquisitionId') {
            const newId = Number(value);
            const alreadyUsed = form.items.some(
                (item, i) => i !== index && item.acquisitionId === newId && newId !== 0
            );
            if (alreadyUsed) {
                setError('Cet équipement est déjà ajouté. Veuillez en choisir un autre.');
                return;
            }
            setError(null);
        }
        updated[index] = {
            ...updated[index],
            [field]: field === 'acquisitionId' ? Number(value) : value,
        } as DeploymentItemRequest;
        setForm(prev => ({ ...prev, items: updated }));
    };

    const handleSubmit = async () => {
        setError(null);
        if (!form.codeDep.trim()) { setError('Le code déploiement est obligatoire.'); return; }
        if (!form.dateRecep)      { setError('La date est obligatoire.'); return; }
        if (!form.regionId)       { setError('La région est obligatoire.'); return; }
        if (!form.districtId)     { setError('Le district est obligatoire.'); return; }
        if (!form.healthId)       { setError('Le site de santé est obligatoire.'); return; }
        if (!form.appsId)         { setError("L'application est obligatoire."); return; }
        if (form.items.length === 0) { setError('Ajoutez au moins un équipement.'); return; }
        if (form.items.some(i => !i.acquisitionId)) { setError('Veuillez sélectionner tous les équipements.'); return; }

        setIsLoading(true);
        try {
            // ✅ Correction LocalDateTime — ajouter T00:00:00 si date seule
            const formToSend = {
                ...form,
                dateRecep: form.dateRecep && !form.dateRecep.includes('T')
                    ? `${form.dateRecep}T00:00:00`
                    : form.dateRecep,
            };
            await DeploymentService.create(formToSend);
            onSuccess();
            onHide();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de la création.');
        } finally {
            setIsLoading(false);
        }
    };

    const selectedApp = apps.find(a => a.id === form.appsId);
    const selectedIds = form.items.map(i => i.acquisitionId);

    return (
        <Modal show={show} onHide={onHide} centered size="xl">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold">
                    <i className="bi bi-truck text-primary me-2" />
                    Nouveau déploiement
                    {/* ✅ Badge partenaire dans le titre */}
                    {person?.partnerName && (
                        <span className="badge bg-primary bg-opacity-10 text-primary ms-2 fw-normal small">
                            <i className="bi bi-building me-1" />
                            {person.partnerName}
                        </span>
                    )}
                    {/* ✅ Badge équipement pré-sélectionné */}
                    {preselectedAcquisition && (
                        <span className="badge bg-warning bg-opacity-10 text-warning ms-2 fw-normal small">
                            <i className="bi bi-box-seam me-1" />
                            {preselectedAcquisition.Type} — {preselectedAcquisition.tag}
                        </span>
                    )}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body className="px-4">
                {error && <Alert variant="danger" className="rounded-3">{error}</Alert>}

                {/* ✅ Bandeau info si équipement pré-sélectionné */}
                {preselectedAcquisition && (
                    <Alert variant="info" className="rounded-3 py-2 small mb-3 d-flex align-items-center gap-2">
                        <i className="bi bi-info-circle-fill" />
                        <span>
                            Déploiement de <strong>{preselectedAcquisition.Type}</strong> —
                            Tag : <strong>{preselectedAcquisition.tag}</strong> —
                            Série : <strong>{preselectedAcquisition.serial}</strong>
                            {preselectedAcquisition.partnerName && (
                                <> — Partenaire : <strong>{preselectedAcquisition.partnerName}</strong></>
                            )}
                        </span>
                    </Alert>
                )}

                <Form>
                    {/* ── Code + Date ──────────────────────────────── */}
                    <div className="row">
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">
                                    Code déploiement <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    name="codeDep" value={form.codeDep}
                                    onChange={handleChange}
                                    placeholder="Ex: DEP-2024-001" className="rounded-3"
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">
                                    Date <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="date" name="dateRecep" value={form.dateRecep}
                                    onChange={handleChange} className="rounded-3"
                                />
                            </Form.Group>
                        </div>
                    </div>

                    {/* ── Région + District + Site ─────────────────── */}
                    <div className="row">
                        <div className="col-md-4">
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">
                                    Région <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Select value={form.regionId} onChange={handleRegionChange} className="rounded-3">
                                    <option value={0}>-- Région --</option>
                                    {regions.map(r => <option key={r.id} value={r.id}>{r.regionName}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </div>
                        <div className="col-md-4">
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">
                                    District <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Select value={form.districtId} onChange={handleDistrictChange}
                                    className="rounded-3" disabled={!form.regionId}>
                                    <option value={0}>-- District --</option>
                                    {districts.map(d => <option key={d.id} value={d.id}>{d.DistrictName}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </div>
                        <div className="col-md-4">
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">
                                    Site de santé <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Select name="healthId" value={form.healthId}
                                    onChange={handleChange} className="rounded-3" disabled={!form.districtId}>
                                    <option value={0}>-- Site --</option>
                                    {healths.map(h => <option key={h.id} value={h.id}>{h.healthName}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </div>
                    </div>

                    {/* ── Application ──────────────────────────────── */}
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">
                            Application <span className="text-danger">*</span>
                        </Form.Label>
                        <div className="d-flex align-items-center gap-2">
                            <Form.Select name="appsId" value={form.appsId}
                                onChange={handleChange} className="rounded-3">
                                <option value={0}>-- Application --</option>
                                {apps.map(a => (
                                    <option key={a.id} value={a.id}>{a.appsName}</option>
                                ))}
                            </Form.Select>
                            {selectedApp && (
                                <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 border"
                                    style={{
                                        background:  `${selectedApp.color || '#616161'}10`,
                                        borderColor: `${selectedApp.color || '#616161'}40`,
                                        whiteSpace:  'nowrap', minWidth: '140px',
                                    }}>
                                    <div style={{
                                        width: '30px', height: '30px', borderRadius: '8px',
                                        background: `${selectedApp.color}20`,
                                        border: `1.5px solid ${selectedApp.color}`,
                                        display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
                                    }}>
                                        {selectedApp.image
                                            ? <img src={getImageSrc(selectedApp.image)} alt={selectedApp.appsName}
                                                   style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <i className={`bi ${selectedApp.icon || 'bi-app-indicator'}`}
                                                 style={{ color: selectedApp.color, fontSize: '14px' }} />
                                        }
                                    </div>
                                    <span className="fw-semibold small" style={{ color: selectedApp.color }}>
                                        {selectedApp.appsName}
                                    </span>
                                </div>
                            )}
                        </div>
                    </Form.Group>

                    {/* ── Partenaire (SUPER_ADMIN/ITECH) ──────────── */}
                    {isUnrestricted && (
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">
                                Partenaire
                                <small className="text-muted fw-normal ms-1">(optionnel — auto-assigné si vide)</small>
                            </Form.Label>
                            <Form.Select name="partnerId" value={form.partnerId || ''} onChange={handleChange} className="rounded-3">
                                <option value="">-- Auto (partenaire du technicien) --</option>
                                {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </Form.Select>
                        </Form.Group>
                    )}

                    {/* ── Équipements ──────────────────────────────── */}
                    <div className="card border-0 bg-light rounded-4 p-3 mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="fw-bold mb-0">
                                <i className="bi bi-pc-display me-2 text-primary" />
                                Équipements déployés
                                <span className="badge bg-primary bg-opacity-10 text-primary ms-2">
                                    {form.items.length}
                                </span>
                            </h6>
                            <button type="button" className="btn btn-sm btn-primary rounded-3"
                                onClick={handleAddItem}>
                                <i className="bi bi-plus-circle me-1" /> Ajouter
                            </button>
                        </div>

                        {form.items.length === 0 ? (
                            <div className="text-center py-3 text-muted">
                                <i className="bi bi-inbox fs-3 d-block mb-2" />
                                Aucun équipement ajouté
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-sm align-middle mb-0 bg-white rounded-3">
                                    <thead className="table-light">
                                        <tr>
                                            <th>#</th>
                                            <th>Équipement</th>
                                            <th>Type</th>
                                            <th>N° Tag</th>
                                            <th>N° Série</th>
                                            {/* ✅ Colonne partenaire dans le tableau équipements */}
                                            <th>Partenaire</th>
                                            <th>État</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {form.items.map((item, i) => {
                                            const sel = acquisitions.find(
                                                a => a.id === Number(item.acquisitionId)
                                            );
                                            // ✅ Pour l'équipement pré-sélectionné, inclure aussi dans la liste
                                            const selOrPre = sel
                                                || (preselectedAcquisition?.id === Number(item.acquisitionId)
                                                    ? preselectedAcquisition : undefined);
                                            return (
                                                <tr key={i}>
                                                    <td className="text-muted small">{i + 1}</td>
                                                    <td style={{ minWidth: '200px' }}>
                                                        <Form.Select size="sm"
                                                            value={item.acquisitionId}
                                                            onChange={e => handleItemChange(i, 'acquisitionId', e.target.value)}
                                                            className="rounded-3">
                                                            <option value={0}>-- Sélectionner --</option>
                                                            {/* ✅ Inclure l'équipement pré-sélectionné même s'il n'est pas dans getAvailable() */}
                                                            {preselectedAcquisition
                                                                && !acquisitions.find(a => a.id === preselectedAcquisition.id)
                                                                && (
                                                                    <option value={preselectedAcquisition.id}>
                                                                        {preselectedAcquisition.Type} | {preselectedAcquisition.tag}
                                                                    </option>
                                                                )
                                                            }
                                                            {acquisitions
                                                                .filter(a => a.id === item.acquisitionId || !selectedIds.includes(a.id))
                                                                .map(a => (
                                                                    <option key={a.id} value={a.id}>
                                                                        {a.Type} | {a.tag}
                                                                    </option>
                                                                ))}
                                                        </Form.Select>
                                                    </td>
                                                    <td>
                                                        {selOrPre
                                                            ? <span className="badge bg-primary bg-opacity-10 text-primary">
                                                                <i className="bi bi-pc-display me-1" />{selOrPre.Type}
                                                              </span>
                                                            : <span className="text-muted small">—</span>}
                                                    </td>
                                                    <td>
                                                        {selOrPre
                                                            ? <span className="badge bg-warning bg-opacity-10 text-warning">
                                                                <i className="bi bi-tag me-1" />{selOrPre.tag}
                                                              </span>
                                                            : <span className="text-muted small">—</span>}
                                                    </td>
                                                    <td>
                                                        {selOrPre
                                                            ? <span className="badge bg-success bg-opacity-10 text-success">
                                                                <i className="bi bi-upc me-1" />{selOrPre.serial}
                                                              </span>
                                                            : <span className="text-muted small">—</span>}
                                                    </td>
                                                    {/* ✅ Partenaire de l'équipement */}
                                                    <td>
                                                        {selOrPre?.partnerName
                                                            ? <span className="badge bg-warning bg-opacity-10 text-warning">
                                                                <i className="bi bi-building me-1" />{selOrPre.partnerName}
                                                              </span>
                                                            : <span className="text-muted small">—</span>}
                                                    </td>
                                                    <td>
                                                        <Form.Select size="sm"
                                                            value={item.status}
                                                            onChange={e => handleItemChange(i, 'status', e.target.value)}
                                                            className="rounded-3"
                                                            style={{ color: item.status === 'FONCTIONNEL' ? '#198754' : '#dc3545' }}>
                                                            <option value="FONCTIONNEL">✅ Fonctionnel</option>
                                                            <option value="NON_FONCTIONNEL">❌ Non fonctionnel</option>
                                                        </Form.Select>
                                                    </td>
                                                    <td>
                                                        <button type="button"
                                                            className="btn btn-sm btn-outline-danger rounded-3"
                                                            onClick={() => handleRemoveItem(i)}>
                                                            <i className="bi bi-trash" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* ── Commentaire ──────────────────────────────── */}
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Commentaire / Compte rendu</Form.Label>
                        <Form.Control
                            as="textarea" rows={3} name="comment" value={form.comment}
                            onChange={handleChange}
                            placeholder="Point de l'activité de déploiement..."
                            className="rounded-3"
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>

            <Modal.Footer className="border-0">
                <Button variant="light" onClick={onHide} className="rounded-3">Annuler</Button>
                <Button variant="primary" onClick={handleSubmit} disabled={isLoading} className="rounded-3">
                    {isLoading
                        ? <><Spinner size="sm" className="me-2" />Enregistrement...</>
                        : <><i className="bi bi-plus-circle me-2" />Enregistrer</>
                    }
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default DeploymentFormModal;