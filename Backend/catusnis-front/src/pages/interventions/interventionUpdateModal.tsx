import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Form, Spinner, Alert, Row, Col, Table, Badge }
    from 'react-bootstrap';
import InterventionService   from '../../services/interventionService';
import EvaluationService     from '../../services/evaluationService';
import RegionService         from '../../services/regionService';
import DistrictService       from '../../services/districtService';
import HealthService         from '../../services/healthService';
import DeploymentService     from '../../services/deploymentService';
import AcquisitionService    from '../../services/acquisitionService';
import BookletService        from '../../services/bookletService';
import PartnerService        from '../../services/partnerService';
import {
    InterventionRequest, InterventionResponse, EvaluationResponse,
    RegionResponse, DistrictResponse, HealthResponse,
    AcquisitionResponse, DeploymentItemResponse, DeploymentResponse,
    PartnerResponse,
} from '../../types';
import { Booklet } from '../../types';
import AppsService from '../../services/appsService';
import { AppsResponse } from '../../types';
import { getImageSrc } from '../../utils/imageUtils';

// ── Badge statut ──────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const config: Record<string, { bg: string; label: string }> = {
        FONCTIONNEL:                  { bg: 'success',   label: '✅ Fonctionnel'     },
        DEGRADE:                      { bg: 'warning',   label: '⚠️ Dégradé'         },
        EN_ATTENTE_INTERVENTION_SITE: { bg: 'danger',    label: '🔴 En attente site' },
        NON_FONCTIONNEL:              { bg: 'danger',    label: '❌ Non fonctionnel'  },
        REMPLACE:                     { bg: 'secondary', label: '🔄 Remplacé'        },
    };
    const c = config[status] || { bg: 'secondary', label: status };
    return <Badge bg={c.bg}>{c.label}</Badge>;
};

interface ItemState {
    selected:            boolean;
    etatAvant:           string;
    etatApres:           string;
    maintenanceReussie?: boolean;
    replacementId?:      number;
}

interface Props {
    show:         boolean;
    onHide:       () => void;
    onSuccess:    () => void;
    intervention: InterventionResponse | null;
}

const InterventionUpdateModal: React.FC<Props> = ({
    show, onHide, onSuccess, intervention
}) => {
    const [isLoading,          setIsLoading]          = useState(false);
    const [error,              setError]              = useState<string | null>(null);
    const [form,               setForm]               = useState<InterventionRequest>({
        typeInter: 'EN_LIGNE', actionInter: 'MAINTENANCE',
        commentInter: '', dateInter: '', durationMinutes: 0,
        regionId: 0, districtId: 0, healthId: 0,
        typesId: 0, appsId: 0, deploymentId: 0, evaluationId: 0,
        bookletId: undefined, enAttenteMaintenance: false, partnerId: 0,
    });
    const [evaluations,        setEvaluations]        = useState<EvaluationResponse[]>([]);
    const [regions,            setRegions]            = useState<RegionResponse[]>([]);
    const [districts,          setDistricts]          = useState<DistrictResponse[]>([]);
    const [healths,            setHealths]            = useState<HealthResponse[]>([]);
    const [booklets,           setBooklets]           = useState<Booklet[]>([]);
    const [siteDeployments,    setSiteDeployments]    = useState<DeploymentResponse[]>([]);
    const [siteItems,          setSiteItems]          = useState<DeploymentItemResponse[]>([]);
    const [itemStates,         setItemStates]         = useState<Record<number, ItemState>>({});
    const [availableAcqs,      setAvailableAcqs]      = useState<Record<number, AcquisitionResponse[]>>({});
    const [acqLoading,         setAcqLoading]         = useState<Record<number, boolean>>({});
    const [siteLoading,        setSiteLoading]        = useState(false);
    const [apps,               setApps]               = useState<AppsResponse[]>([]);
    const [partners,           setPartners]           = useState<PartnerResponse[]>([]); // ✅ AJOUT
    const [manualPerson,       setManualPerson]       = useState(false);
    const [manualPersonName,   setManualPersonName]   = useState('');
    const [manualPersonContact,setManualPersonContact]= useState('');
    const [manualPersonPost,   setManualPersonPost]   = useState('');

    const selectedItems = Object.entries(itemStates)
        .filter(([_, s]) => s.selected)
        .map(([id]) => Number(id));

    const loadSiteItems = useCallback(async (
        healthId:      number,
        typeInter:     string,
        existingItems?: DeploymentItemResponse[],
        deps?:         DeploymentResponse[]
    ) => {
        setSiteLoading(true);
        try {
            const deployments = deps
                || (await DeploymentService.getAll(0, 100, undefined, undefined, healthId)).content;

            const existingIds = new Set((existingItems || []).map(i => i.id));

            const allItems: DeploymentItemResponse[] = [];
            deployments.forEach(dep => {
                (dep.items || []).forEach(item => {
                    if (item.status === 'REMPLACE') return;
                    if (typeInter === 'EN_LIGNE') {
                        allItems.push({ ...item, deploymentCode: (dep as any).codeDep } as any);
                    } else {
                        if (item.status === 'EN_ATTENTE_INTERVENTION_SITE' || existingIds.has(item.id)) {
                            allItems.push({ ...item, deploymentCode: (dep as any).codeDep } as any);
                        }
                    }
                });
            });

            setSiteItems(allItems);

            const states: Record<number, ItemState> = {};
            allItems.forEach(item => {
                const existing = existingItems?.find(i => i.id === item.id);
                states[item.id] = {
                    selected:           existing !== undefined,
                    etatAvant:          existing?.etatAvant || item.status || 'FONCTIONNEL',
                    etatApres:          existing?.etatApres || '',
                    maintenanceReussie: undefined,
                    replacementId:      undefined,
                };
            });
            setItemStates(states);
        } catch (e) {
            console.error('Erreur chargement items:', e);
        } finally {
            setSiteLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!show || !intervention) return;
        setError(null);
        setSiteItems([]); setItemStates({});
        setBooklets([]); setAvailableAcqs({});
        setSiteDeployments([]);
        setManualPerson(false); setManualPersonName('');
        setManualPersonContact(''); setManualPersonPost('');

        AppsService.getAllList().then(setApps).catch(console.error);
        PartnerService.getAllList().then(setPartners).catch(console.error); // ✅ AJOUT

        Promise.all([
            EvaluationService.getAllList(),
            RegionService.getAllList(),
        ]).then(async ([evls, regs]) => {
            setEvaluations(evls);
            setRegions(regs);
            if (intervention.regionId) {
                const dists = await DistrictService.getAllList(intervention.regionId);
                setDistricts(dists);
            }
            if (intervention.districtId) {
                const hs = await HealthService.getAllList(intervention.districtId);
                setHealths(hs);
            }
            if (intervention.healthId) {
                const deps = await DeploymentService.getAll(0, 100, undefined, undefined, intervention.healthId);
                setSiteDeployments(deps.content || []);
                try {
                    const bkts = await BookletService.getByDistrict(intervention.districtId || 0);
                    setBooklets(Array.isArray(bkts) ? bkts : []);
                } catch { setBooklets([]); }

                await loadSiteItems(
                    intervention.healthId,
                    intervention.typeInter,
                    intervention.deploymentItems,
                    deps.content
                );
            }

            setForm({
                typeInter:            intervention.typeInter,
                actionInter:          intervention.actionInter,
                commentInter:         intervention.commentInter,
                dateInter:            new Date(intervention.dateInter).toISOString().split('T')[0],
                durationMinutes:      intervention.durationMinutes,
                regionId:             intervention.regionId    || 0,
                districtId:           intervention.districtId  || 0,
                healthId:             intervention.healthId    || 0,
                deploymentId:         intervention.deploymentId || 0,
                evaluationId:         intervention.evaluationId || 0,
                typesId:              intervention.typesId     || 0,
                appsId:               intervention.appsId      || 0,
                personId:             undefined,
                bookletId:            intervention.personId    || undefined,
                enAttenteMaintenance: intervention.enAttenteMaintenance ?? false,
                partnerId:            (intervention as any).partnerId || 0, // ✅ AJOUT
            });

            if (intervention.personId) {
                setManualPerson(false);
            } else if (intervention.personName?.trim()) {
                setManualPerson(true);
                setManualPersonName(intervention.personName.trim());
                setManualPersonContact(intervention.personContact || '');
                setManualPersonPost(intervention.personPost || '');
            }
        }).catch(() => setError('Erreur lors du chargement des données'));
    }, [show, intervention, loadSiteItems]);

    const handleTypeChange = async (typeInter: string) => {
        setForm(prev => ({
            ...prev, typeInter,
            actionInter: typeInter === 'EN_LIGNE' ? 'MAINTENANCE' : 'MAINTENANCE_CURATIVE',
        }));
        setSiteItems([]); setItemStates({}); setAvailableAcqs({});
        if (form.healthId) await loadSiteItems(form.healthId, typeInter);
    };

    const handleRegionChange = async (regionId: number) => {
        setForm(prev => ({ ...prev, regionId, districtId: 0, healthId: 0, deploymentId: 0 }));
        setDistricts([]); setHealths([]);
        setSiteItems([]); setItemStates({}); setBooklets([]);
        setSiteDeployments([]);
        if (regionId) setDistricts(await DistrictService.getAllList(regionId));
    };

    const handleDistrictChange = async (districtId: number) => {
        setForm(prev => ({ ...prev, districtId, healthId: 0, deploymentId: 0 }));
        setHealths([]); setSiteItems([]); setItemStates({}); setBooklets([]);
        setSiteDeployments([]);
        if (districtId) setHealths(await HealthService.getAllList(districtId));
    };

    const handleHealthChange = async (healthId: number) => {
        setForm(prev => ({ ...prev, healthId, deploymentId: 0 }));
        setSiteItems([]); setItemStates({}); setBooklets([]);
        setSiteDeployments([]);
        if (!healthId) return;
        const deps = await DeploymentService.getAll(0, 100, undefined, undefined, healthId);
        setSiteDeployments(deps.content || []);
        if (deps.content?.length > 0)
            setForm(prev => ({ ...prev, healthId, deploymentId: deps.content[0].id }));
        try {
            const bkts = await BookletService.getByDistrict(form.districtId);
            setBooklets(Array.isArray(bkts) ? bkts : []);
        } catch { setBooklets([]); }
        await loadSiteItems(healthId, form.typeInter, undefined, deps.content);
    };

    const toggleItemSelected = (itemId: number) => {
        setItemStates(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], selected: !prev[itemId].selected },
        }));
    };

    const handleEtatApresChange = (itemId: number, etat: string) => {
        setItemStates(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], etatApres: etat, maintenanceReussie: undefined, replacementId: undefined },
        }));
    };

    const handleMaintenanceResult = useCallback(async (itemId: number, reussie: boolean, typeName?: string) => {
        setItemStates(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], maintenanceReussie: reussie, replacementId: undefined },
        }));
        if (!reussie && typeName) {
            setAcqLoading(prev => ({ ...prev, [itemId]: true }));
            try {
                const all = await AcquisitionService.getAvailable();
                setAvailableAcqs(prev => ({
                    ...prev,
                    [itemId]: all.filter(a =>
                        a.Type?.toLowerCase().trim() === typeName.toLowerCase().trim()
                    ),
                }));
            } catch {
                setAvailableAcqs(prev => ({ ...prev, [itemId]: [] }));
            } finally {
                setAcqLoading(prev => ({ ...prev, [itemId]: false }));
            }
        }
    }, []);

    const handleReplacementChange = (itemId: number, acqId: number) => {
        setItemStates(prev => ({ ...prev, [itemId]: { ...prev[itemId], replacementId: acqId } }));
        setForm(prev => ({ ...prev, actionInter: 'REMPLACEMENT' }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        setError(null);
        if (!intervention) return;

        if (!form.dateInter || !form.regionId || !form.districtId ||
            !form.healthId || !form.evaluationId ||
            !form.durationMinutes || !form.commentInter?.trim()) {
            setError('Veuillez remplir tous les champs obligatoires.'); return;
        }
        if (selectedItems.length === 0) {
            setError('Veuillez sélectionner au moins un équipement.'); return;
        }
        if (!form.bookletId && !manualPersonName.trim()) {
            setError('Veuillez sélectionner ou saisir la personne assistée.'); return;
        }

        setIsLoading(true);
        try {
            const etatsAvant:         Record<number, string>  = {};
            const etatsApres:         Record<number, string>  = {};
            const replacements:       Record<number, number>  = {};
            const maintenanceReussie: Record<number, boolean> = {};

            selectedItems.forEach(id => {
                const s = itemStates[id];
                if (s.etatAvant)                       etatsAvant[id]          = s.etatAvant;
                if (s.etatApres)                       etatsApres[id]          = s.etatApres;
                if (s.replacementId)                   replacements[id]        = s.replacementId;
                if (s.maintenanceReussie !== undefined) maintenanceReussie[id]  = s.maintenanceReussie;
            });

            await InterventionService.update(intervention.id, {
                ...form,
                regionId:             Number(form.regionId),
                districtId:           Number(form.districtId),
                healthId:             Number(form.healthId),
                deploymentId:         Number(form.deploymentId),
                evaluationId:         Number(form.evaluationId),
                typesId:              Number(form.typesId),
                appsId:               Number(form.appsId),
                durationMinutes:      Number(form.durationMinutes),
                partnerId:            form.partnerId ? Number(form.partnerId) : undefined, // ✅ AJOUT
                personId:             undefined,
                bookletId:            form.bookletId ? Number(form.bookletId) : undefined,
                selectedItemIds:      selectedItems,
                etatsAvant, etatsApres, replacements, maintenanceReussie,
                enAttenteMaintenance: form.enAttenteMaintenance ?? false,
                manualPersonName:    manualPerson && manualPersonName.trim()
                    ? manualPersonName.trim()     : undefined,
                manualPersonContact: manualPerson && manualPersonContact.trim()
                    ? manualPersonContact.trim()  : undefined,
                manualPersonPost:    manualPerson && manualPersonPost.trim()
                    ? manualPersonPost.trim()     : undefined,
            });

            onSuccess();
            onHide();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de la modification.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered size="xl">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold">
                    <i className="bi bi-pencil-square text-warning me-2" />
                    Modifier l'intervention
                    {intervention && (
                        <span className="badge bg-warning bg-opacity-10 text-warning ms-2 small">
                            {intervention.codeInter}
                        </span>
                    )}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body className="px-4">
                {error && <Alert variant="danger" className="rounded-3">{error}</Alert>}

                {intervention && (
                    <div className="alert alert-info border-0 rounded-3 mb-3 small">
                        <i className="bi bi-info-circle me-2" />
                        Site : <strong>{intervention.healthName}</strong>
                        {' '}| Type : <strong>{intervention.typeInter}</strong>
                        {' '}| Durée : <strong>{intervention.durationMinutes} min</strong>
                        {intervention.enAttenteMaintenance && (
                            <span className="badge bg-warning text-dark ms-2">
                                <i className="bi bi-clock-history me-1" />En attente de maintenance
                            </span>
                        )}
                    </div>
                )}

                {/* ══ Section 1 — Type & Dates ══ */}
                <div className="card border-0 bg-light rounded-4 p-3 mb-3">
                    <h6 className="fw-bold text-warning mb-3">
                        <i className="bi bi-clipboard-data me-2" />Informations de l'intervention
                    </h6>
                    <Row className="g-3">
                        <Col md={3}>
                            <Form.Label className="fw-semibold small">Type <span className="text-danger">*</span></Form.Label>
                            <div className="d-flex flex-column gap-1 mt-1">
                                {[{ val: 'EN_LIGNE', label: '📞 En ligne' }, { val: 'SUR_SITE', label: '🏥 Sur site' }].map(({ val, label }) => (
                                    <Form.Check key={val} type="radio" id={`update-type-${val}`}
                                        name="typeInter" value={val} label={label}
                                        checked={form.typeInter === val}
                                        onChange={() => handleTypeChange(val)} />
                                ))}
                            </div>
                        </Col>
                        <Col md={3}>
                            <Form.Label className="fw-semibold small">Action</Form.Label>
                            {form.typeInter === 'EN_LIGNE' ? (
                                <div className="p-2 bg-warning bg-opacity-10 rounded-3 text-warning small fw-semibold">
                                    🔧 Maintenance (automatique)
                                </div>
                            ) : (
                                <Form.Select name="actionInter" value={form.actionInter} onChange={handleChange} className="rounded-3" size="sm">
                                    <option value="MAINTENANCE_CURATIVE">🔧 Maintenance curative</option>
                                    <option value="MAINTENANCE_PREVENTIVE">🛡️ Maintenance préventive</option>
                                    <option value="REMPLACEMENT">🔄 Remplacement</option>
                                </Form.Select>
                            )}
                        </Col>
                        <Col md={3}>
                            <Form.Label className="fw-semibold small">Date <span className="text-danger">*</span></Form.Label>
                            <Form.Control type="date" name="dateInter" value={form.dateInter as string} onChange={handleChange} className="rounded-3" size="sm" />
                        </Col>
                        <Col md={3}>
                            <Form.Label className="fw-semibold small">Durée (min) <span className="text-danger">*</span></Form.Label>
                            <Form.Control type="number" name="durationMinutes" min={1} value={form.durationMinutes} onChange={handleChange} className="rounded-3" size="sm" />
                        </Col>
                    </Row>
                </div>

                {/* ══ Section 2 — Localisation ══ */}
                <div className="card border-0 bg-light rounded-4 p-3 mb-3">
                    <h6 className="fw-bold text-warning mb-3">
                        <i className="bi bi-geo-alt me-2" />Localisation
                    </h6>
                    <Row className="g-3">
                        <Col md={4}>
                            <Form.Label className="fw-semibold small">Région <span className="text-danger">*</span></Form.Label>
                            <Form.Select value={form.regionId} onChange={e => handleRegionChange(Number(e.target.value))} className="rounded-3" size="sm">
                                <option value={0}>-- Région --</option>
                                {regions.map(r => <option key={r.id} value={r.id}>{r.regionName}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md={4}>
                            <Form.Label className="fw-semibold small">District <span className="text-danger">*</span></Form.Label>
                            <Form.Select value={form.districtId} onChange={e => handleDistrictChange(Number(e.target.value))} disabled={!form.regionId} className="rounded-3" size="sm">
                                <option value={0}>-- District --</option>
                                {districts.map(d => <option key={d.id} value={d.id}>{d.DistrictName}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md={4}>
                            <Form.Label className="fw-semibold small">Site <span className="text-danger">*</span></Form.Label>
                            <Form.Select value={form.healthId} onChange={e => handleHealthChange(Number(e.target.value))} disabled={!form.districtId} className="rounded-3" size="sm">
                                <option value={0}>-- Site --</option>
                                {healths.map(h => <option key={h.id} value={h.id}>{h.healthName}</option>)}
                            </Form.Select>
                        </Col>
                    </Row>
                </div>

                {/* ══ Section 2b — Application & Bailleur ══ */}
                <div className="card border-0 bg-light rounded-4 p-3 mb-3">
                    <h6 className="fw-bold text-warning mb-3">
                        <i className="bi bi-app-indicator me-2" />Application & Bailleur
                    </h6>
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Label className="fw-semibold small">Application <span className="text-danger">*</span></Form.Label>
                            <div className="d-flex align-items-center gap-2">
                                <Form.Select name="appsId" value={form.appsId} onChange={handleChange} className="rounded-3" size="sm">
                                    <option value={0}>-- Application --</option>
                                    {apps.map(a => <option key={a.id} value={a.id}>{a.appsName}</option>)}
                                </Form.Select>
                                {(() => {
                                    const selApp = apps.find(a => a.id === Number(form.appsId));
                                    return selApp ? (
                                        <div className="d-flex align-items-center gap-2 px-2 py-1 rounded-3 border flex-shrink-0"
                                            style={{ background: `${selApp.color || '#616161'}10`, borderColor: `${selApp.color || '#616161'}40` }}>
                                            <div style={{ width: '28px', height: '28px', borderRadius: '6px',
                                                background: `${selApp.color || '#616161'}20`,
                                                border: `1.5px solid ${selApp.color || '#616161'}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                overflow: 'hidden', flexShrink: 0 }}>
                                                {selApp.image
                                                    ? <img src={getImageSrc(selApp.image, selApp.base64)} alt={selApp.appsName} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2px' }} />
                                                    : <i className={`bi ${selApp.icon || 'bi-app-indicator'}`} style={{ color: selApp.color, fontSize: '13px' }} />}
                                            </div>
                                            <span className="fw-semibold small" style={{ color: selApp.color || '#616161', whiteSpace: 'nowrap' }}>{selApp.appsName}</span>
                                        </div>
                                    ) : null;
                                })()}
                            </div>
                        </Col>
                        {/* ✅ Bailleur modifiable */}
                        <Col md={6}>
                            <Form.Label className="fw-semibold small">Bailleur / Partenaire</Form.Label>
                            <Form.Select
                                name="partnerId"
                                value={form.partnerId || 0}
                                onChange={handleChange}
                                className="rounded-3"
                                size="sm">
                                <option value={0}>-- Aucun partenaire --</option>
                                {partners.map(p => (
                                    <option key={p.id} value={p.id}>{p.partnerName}</option>
                                ))}
                            </Form.Select>
                            {intervention?.partnerName && !form.partnerId && (
                                <small className="text-muted">
                                    <i className="bi bi-info-circle me-1"/>
                                    Actuel : {intervention.partnerName}
                                </small>
                            )}
                        </Col>
                    </Row>
                </div>

                {/* ══ Section 3 — Déploiement concerné ══ */}
                {form.healthId > 0 && (
                    <div className="card border-0 bg-light rounded-4 p-3 mb-3">
                        <h6 className="fw-bold text-warning mb-3">
                            <i className="bi bi-truck me-2" />Déploiement concerné <span className="text-danger">*</span>
                        </h6>
                        {siteDeployments.length === 0 ? (
                            <Alert variant="warning" className="rounded-3 small mb-0">
                                <i className="bi bi-exclamation-triangle me-2" />Aucun déploiement trouvé pour ce site.
                            </Alert>
                        ) : (
                            <Form.Select name="deploymentId" value={form.deploymentId} onChange={handleChange} className="rounded-3" size="sm">
                                <option value={0}>-- Sélectionner --</option>
                                {siteDeployments.map(d => (
                                    <option key={d.id} value={d.id}>
                                        {d.codeDep} — {d.appsDeploy} — {d.items?.length || 0} équipement(s)
                                    </option>
                                ))}
                            </Form.Select>
                        )}
                    </div>
                )}

                {/* ══ Section 4 — Équipements ══ */}
                {form.healthId > 0 && (
                    <div className="card border-0 bg-light rounded-4 p-3 mb-3">
                        <h6 className="fw-bold text-warning mb-3">
                            <i className="bi bi-pc-display-horizontal me-2" />
                            {form.typeInter === 'EN_LIGNE'
                                ? 'Équipements du site'
                                : "Équipements concernés par l'intervention"}
                            <span className="badge bg-warning bg-opacity-10 text-warning ms-2 small fw-normal">
                                {siteItems.length} équipement(s)
                            </span>
                        </h6>
                        {siteLoading ? (
                            <div className="text-center py-3"><Spinner size="sm" className="me-2" />Chargement...</div>
                        ) : siteItems.length === 0 ? (
                            <Alert variant="info" className="rounded-3 small mb-0">
                                <i className="bi bi-info-circle me-2" />Aucun équipement trouvé pour ce site.
                            </Alert>
                        ) : (
                            <Table size="sm" bordered hover className="mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th style={{ width: '40px' }}>✓</th>
                                        <th>Tag</th>
                                        <th>Équipement</th>
                                        <th>N° Série</th>
                                        <th>Partenaire</th>
                                        <th>Statut actuel</th>
                                        <th>État avant</th>
                                        <th>État après</th>
                                        {form.typeInter === 'SUR_SITE' && <th>Résultat</th>}
                                        {form.typeInter === 'SUR_SITE' && <th>Remplacement</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {siteItems.map(item => {
                                        const state = itemStates[item.id] || { selected: false, etatAvant: 'FONCTIONNEL', etatApres: '' };
                                        const isSelected = state.selected;
                                        const maintenanceEchouee = state.maintenanceReussie === false;
                                        const itemDep = siteDeployments.find(d => d.items?.some(it => it.id === item.id));
                                        return (
                                            <tr key={item.id} style={{ background: isSelected ? '#fff8f0' : 'white', opacity: !isSelected ? 0.7 : 1 }}>
                                                <td className="text-center">
                                                    <Form.Check type="checkbox" checked={isSelected} onChange={() => toggleItemSelected(item.id)} />
                                                </td>
                                                <td className="small fw-semibold">{item.tag}</td>
                                                <td className="small">{item.typeName}</td>
                                                <td className="small text-muted">{item.serial}</td>
                                                <td>
                                                    {itemDep?.partnerName
                                                        ? <span className="badge bg-warning bg-opacity-10 text-warning"><i className="bi bi-building me-1" />{itemDep.partnerName}</span>
                                                        : <span className="text-muted small">—</span>}
                                                </td>
                                                <td><StatusBadge status={item.status} /></td>
                                                <td>
                                                    {isSelected ? (
                                                        <Form.Select size="sm" value={state.etatAvant}
                                                            onChange={e => setItemStates(prev => ({ ...prev, [item.id]: { ...prev[item.id], etatAvant: e.target.value } }))}>
                                                            <option value="FONCTIONNEL">✅ Fonctionnel</option>
                                                            <option value="DEGRADE">⚠️ Dégradé</option>
                                                            <option value="NON_FONCTIONNEL">❌ Non fonctionnel</option>
                                                        </Form.Select>
                                                    ) : <span className="text-muted small">—</span>}
                                                </td>
                                                <td>
                                                    {isSelected ? (
                                                        <Form.Select size="sm" value={state.etatApres}
                                                            onChange={e => handleEtatApresChange(item.id, e.target.value)}
                                                            style={{ borderColor: state.etatApres === 'NON_FONCTIONNEL' ? '#dc3545' : state.etatApres === 'DEGRADE' ? '#f59e0b' : undefined }}>
                                                            <option value="">-- Choisir --</option>
                                                            <option value="FONCTIONNEL">✅ Fonctionnel</option>
                                                            <option value="DEGRADE">⚠️ Dégradé</option>
                                                            <option value="NON_FONCTIONNEL">❌ Non fonctionnel</option>
                                                        </Form.Select>
                                                    ) : <span className="text-muted small">—</span>}
                                                </td>
                                                {form.typeInter === 'SUR_SITE' && (
                                                    <td>
                                                        {isSelected ? (
                                                            <div className="d-flex gap-1">
                                                                <Button size="sm"
                                                                    variant={state.maintenanceReussie === true ? 'success' : 'outline-success'}
                                                                    className="rounded-2 py-0"
                                                                    onClick={() => handleMaintenanceResult(item.id, true, item.typeName)}>✅</Button>
                                                                <Button size="sm"
                                                                    variant={state.maintenanceReussie === false ? 'danger' : 'outline-danger'}
                                                                    className="rounded-2 py-0"
                                                                    onClick={() => handleMaintenanceResult(item.id, false, item.typeName)}>❌</Button>
                                                            </div>
                                                        ) : <span className="text-muted small">—</span>}
                                                    </td>
                                                )}
                                                {form.typeInter === 'SUR_SITE' && (
                                                    <td>
                                                        {isSelected && maintenanceEchouee ? (
                                                            acqLoading[item.id] ? <Spinner size="sm" />
                                                            : (availableAcqs[item.id] || []).length === 0
                                                                ? <span className="text-danger small">Aucun disponible</span>
                                                                : (
                                                                    <Form.Select size="sm" className="border-danger"
                                                                        value={state.replacementId || 0}
                                                                        onChange={e => handleReplacementChange(item.id, Number(e.target.value))}>
                                                                        <option value={0}>-- Choisir ({(availableAcqs[item.id] || []).length}) --</option>
                                                                        {(availableAcqs[item.id] || []).map(a => (
                                                                            <option key={a.id} value={a.id}>🔧 {a.tag} | {a.serial}</option>
                                                                        ))}
                                                                    </Form.Select>
                                                                )
                                                        ) : <span className="text-muted small">—</span>}
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        )}
                        {form.typeInter === 'EN_LIGNE' && Object.values(itemStates).some(s => s.selected && (s.etatApres === 'NON_FONCTIONNEL' || s.etatApres === 'DEGRADE')) && (
                            <Alert variant="warning" className="rounded-3 mt-2 small mb-0">
                                <i className="bi bi-exclamation-triangle me-2" />
                                Les équipements défaillants seront marqués <strong>En attente d'intervention sur site</strong>.
                            </Alert>
                        )}
                    </div>
                )}

                {/* ══ Section 5 — Personne assistée ══ */}
                {(form.healthId > 0 || intervention?.healthId) && (
                    <div className="card border-0 bg-light rounded-4 p-3 mb-3">
                        <h6 className="fw-bold text-warning mb-3">
                            <i className="bi bi-person-fill me-2" />Personne assistée <span className="text-danger">*</span>
                        </h6>
                        <div className="d-flex gap-2 mb-3">
                            <button type="button"
                                className={`btn btn-sm rounded-3 ${!manualPerson ? 'btn-warning text-white' : 'btn-outline-warning'}`}
                                onClick={() => { setManualPerson(false); setManualPersonName(''); setManualPersonContact(''); setManualPersonPost(''); }}>
                                <i className="bi bi-person-lines-fill me-1" />Sélectionner dans la liste
                            </button>
                            <button type="button"
                                className={`btn btn-sm rounded-3 ${manualPerson ? 'btn-warning text-white' : 'btn-outline-warning'}`}
                                onClick={() => { setManualPerson(true); setForm(prev => ({ ...prev, bookletId: undefined })); }}>
                                <i className="bi bi-pencil me-1" />Saisir manuellement
                            </button>
                        </div>

                        {manualPerson ? (
                            <div className="row g-2">
                                <div className="col-12">
                                    <Form.Label className="fw-semibold small">Nom & Prénom <span className="text-danger">*</span></Form.Label>
                                    <Form.Control type="text" placeholder="Ex: KOUASSI Jean"
                                        value={manualPersonName} onChange={e => setManualPersonName(e.target.value)}
                                        className="rounded-3" size="sm" />
                                    <small className="text-muted">Cette personne sera automatiquement ajoutée dans la liste des agents.</small>
                                </div>
                                <div className="col-md-6">
                                    <Form.Label className="fw-semibold small">Contact / Téléphone</Form.Label>
                                    <Form.Control type="text" placeholder="Ex: 07 00 00 00 00"
                                        value={manualPersonContact} onChange={e => setManualPersonContact(e.target.value)}
                                        className="rounded-3" size="sm" />
                                </div>
                                <div className="col-md-6">
                                    <Form.Label className="fw-semibold small">Fonction / Poste</Form.Label>
                                    <Form.Control type="text" placeholder="Ex: Infirmier chef"
                                        value={manualPersonPost} onChange={e => setManualPersonPost(e.target.value)}
                                        className="rounded-3" size="sm" />
                                    <small className="text-muted">Ce poste sera créé s'il n'existe pas encore.</small>
                                </div>
                                {manualPersonName.trim() && (
                                    <div className="col-12">
                                        <div className="p-2 bg-white rounded-3 border d-flex align-items-center gap-3 mt-1">
                                            <div className="rounded-circle bg-warning d-flex align-items-center justify-content-center"
                                                style={{ width: 36, height: 36, minWidth: 36 }}>
                                                <span className="text-white fw-bold small">{manualPersonName.trim().charAt(0).toUpperCase()}</span>
                                            </div>
                                            <div>
                                                <div className="fw-semibold small">{manualPersonName.trim()}</div>
                                                <div className="text-muted" style={{ fontSize: '11px' }}>
                                                    {manualPersonContact && <span className="me-2">📞 {manualPersonContact}</span>}
                                                    {manualPersonPost    && <span>💼 {manualPersonPost}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : booklets.length === 0 ? (
                            <Alert variant="info" className="rounded-3 small mb-0">
                                <i className="bi bi-info-circle me-2" />
                                Aucune personne enregistrée pour ce district.{' '}
                                <button type="button" className="btn btn-link btn-sm p-0" onClick={() => setManualPerson(true)}>
                                    Saisir manuellement →
                                </button>
                            </Alert>
                        ) : (
                            <>
                                <Form.Select name="bookletId" value={form.bookletId || 0} onChange={handleChange} className="rounded-3" size="sm">
                                    <option value={0}>-- Sélectionner --</option>
                                    {booklets.map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.lastName} {b.firstName}
                                            {b.contact        ? ` | 📞 ${b.contact}`   : ''}
                                            {b.post?.postName ? ` | ${b.post.postName}` : ''}
                                        </option>
                                    ))}
                                </Form.Select>
                                {form.bookletId && (() => {
                                    const sel = booklets.find(b => b.id === Number(form.bookletId));
                                    return sel ? (
                                        <div className="mt-2 p-2 bg-white rounded-3 small d-flex gap-3">
                                            <div className="rounded-circle bg-warning d-flex align-items-center justify-content-center"
                                                style={{ width: 36, height: 36, minWidth: 36 }}>
                                                <span className="text-white fw-bold small">{sel.lastName?.charAt(0)}{sel.firstName?.charAt(0)}</span>
                                            </div>
                                            <div>
                                                <div className="fw-semibold">{sel.lastName} {sel.firstName}</div>
                                                <div className="text-muted">📞 {sel.contact} | 💼 {sel.post?.postName}</div>
                                            </div>
                                        </div>
                                    ) : null;
                                })()}
                            </>
                        )}
                    </div>
                )}

                {/* ══ Section 6 — Évaluation & Commentaire ══ */}
                <div className="card border-0 bg-light rounded-4 p-3 mb-3">
                    <h6 className="fw-bold text-warning mb-3">
                        <i className="bi bi-chat-left-text me-2" />Évaluation & Commentaire
                    </h6>
                    <Row className="g-3">
                        <Col md={4}>
                            <Form.Label className="fw-semibold small">Évaluation <span className="text-danger">*</span></Form.Label>
                            <Form.Select name="evaluationId" value={form.evaluationId} onChange={handleChange} className="rounded-3" size="sm">
                                <option value={0}>-- Sélectionner --</option>
                                {evaluations.map(e => <option key={e.id} value={e.id}>{e.evlName}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md={8}>
                            <Form.Label className="fw-semibold small">Commentaire <span className="text-danger">*</span></Form.Label>
                            <Form.Control as="textarea" rows={2} name="commentInter" value={form.commentInter}
                                onChange={handleChange} placeholder="Décrivez l'intervention..."
                                className="rounded-3" size="sm" />
                        </Col>
                    </Row>
                </div>
            </Modal.Body>

            <Modal.Footer className="border-0">
                <Button variant="light" onClick={onHide} className="rounded-3">Annuler</Button>
                <Button variant="warning" onClick={handleSubmit}
                    disabled={isLoading || (siteItems.length > 0 && selectedItems.length === 0)}
                    className="rounded-3 text-white">
                    {isLoading
                        ? <><Spinner size="sm" className="me-2" />Modification...</>
                        : <><i className="bi bi-pencil me-2" />Modifier
                            {selectedItems.length > 0 ? ` (${selectedItems.length} équipement(s))` : ''}
                          </>
                    }
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default InterventionUpdateModal;