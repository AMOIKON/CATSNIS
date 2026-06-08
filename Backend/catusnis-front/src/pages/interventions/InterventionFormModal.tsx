import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Form, Spinner, Alert, Row, Col, Table, Badge }
    from 'react-bootstrap';
import InterventionService   from '../../services/interventionService';
import EvaluationService     from '../../services/evaluationService';
import RegionService         from '../../services/regionService';
import DistrictService       from '../../services/districtService';
import HealthService         from '../../services/healthService';
import DeploymentService     from '../../services/deploymentService';
import TechnicianSiteService from '../../services/technicianSiteService';
import AcquisitionService    from '../../services/acquisitionService';
import BookletService        from '../../services/bookletService';

import {
    InterventionRequest, EvaluationResponse,
    RegionResponse, DistrictResponse, HealthResponse,
    AcquisitionResponse, DeploymentItemResponse, DeploymentResponse,
} from '../../types';
import { Booklet } from '../../types';
import useAuth from '../../hooks/useAuth';

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
    selected:           boolean;
    etatAvant:          string;
    etatApres:          string;
    maintenanceReussie?: boolean;
    replacementId?:     number;
}

interface Props {
    show:      boolean;
    onHide:    () => void;
    onSuccess: () => void;
}

const initialForm: InterventionRequest = {
    typeInter:            'EN_LIGNE',
    actionInter:          'MAINTENANCE',
    commentInter:         '',
    dateInter:            '',
    durationMinutes:      0,
    regionId:             0,
    districtId:           0,
    healthId:             0,
    typesId:              0,
    appsId:               0,
    deploymentId:         0,
    evaluationId:         0,
    bookletId:            undefined,
    enAttenteMaintenance: false,
};

const InterventionFormModal: React.FC<Props> = ({ show, onHide, onSuccess }) => {
    const { person, hasRole } = useAuth();
    const isTechnician = hasRole('TECHNICIEN');

    const [isLoading,          setIsLoading]          = useState(false);
    const [error,              setError]              = useState<string | null>(null);
    const [form,               setForm]               = useState<InterventionRequest>(initialForm);
    const [evaluations,        setEvaluations]        = useState<EvaluationResponse[]>([]);
    const [regions,            setRegions]            = useState<RegionResponse[]>([]);
    const [districts,          setDistricts]          = useState<DistrictResponse[]>([]);
    const [healths,            setHealths]            = useState<HealthResponse[]>([]);
    const [booklets,           setBooklets]           = useState<Booklet[]>([]);
    // ✅ Déploiements du site pour le select
    const [siteDeployments,    setSiteDeployments]    = useState<DeploymentResponse[]>([]);
    const [siteItems,          setSiteItems]          = useState<DeploymentItemResponse[]>([]);
    const [itemStates,         setItemStates]         = useState<Record<number, ItemState>>({});
    const [availableAcqs,      setAvailableAcqs]      = useState<Record<number, AcquisitionResponse[]>>({});
    const [acqLoading,         setAcqLoading]         = useState<Record<number, boolean>>({});
    const [allowedHealthIds,   setAllowedHealthIds]   = useState<number[]>([]);
    const [allowedDistrictIds, setAllowedDistrictIds] = useState<number[]>([]);
    const [siteLoading,        setSiteLoading]        = useState(false);
    // ✅ Saisie manuelle de la personne assistée
    const [manualPerson,       setManualPerson]       = useState(false);
    const [manualPersonName,    setManualPersonName]    = useState('');
    const [manualPersonContact, setManualPersonContact] = useState('');
    const [manualPersonPost,    setManualPersonPost]    = useState('');

    const selectedItems = Object.entries(itemStates)
        .filter(([_, s]) => s.selected)
        .map(([id]) => Number(id));

    useEffect(() => {
        if (!show) return;
        setForm(initialForm);
        setError(null);
        setDistricts([]); setHealths([]);
        setSiteItems([]); setItemStates([]);
        setSiteDeployments([]); setBooklets([]);
        setManualPerson(false); setManualPersonName(''); setManualPersonContact(''); setManualPersonPost('');

        const load = async () => {
            try {
                const evls = await EvaluationService.getAllList();
                setEvaluations(evls);
                if (isTechnician && person?.id) {
                    const [healthIds, regionIds, districtIds] = await Promise.all([
                        TechnicianSiteService.getHealthIds(person.id),
                        TechnicianSiteService.getRegionIds(person.id),
                        TechnicianSiteService.getDistrictIds(person.id),
                    ]);
                    setAllowedHealthIds(healthIds);
                    setAllowedDistrictIds(districtIds);
                    const allRegions = await RegionService.getAllList();
                    setRegions(allRegions.filter(r => regionIds.includes(r.id)));
                } else {
                    setRegions(await RegionService.getAllList());
                }
            } catch {
                setError('Erreur lors du chargement');
            }
        };
        load();
    }, [show, isTechnician, person?.id]);

    const handleTypeChange = (typeInter: string) => {
        setForm(prev => ({
            ...prev,
            typeInter,
            actionInter: typeInter === 'EN_LIGNE' ? 'MAINTENANCE' : 'MAINTENANCE_CURATIVE',
        }));
        setSiteItems([]); setItemStates({});
        // Recharger les items si site déjà sélectionné
        if (form.healthId) loadSiteItems(form.healthId, typeInter);
    };

    const handleRegionChange = async (regionId: number) => {
        setForm(prev => ({ ...prev, regionId, districtId: 0, healthId: 0, deploymentId: 0 }));
        setDistricts([]); setHealths([]);
        setSiteItems([]); setItemStates({});
        setSiteDeployments([]); setBooklets([]);
        if (regionId) {
            const data = await DistrictService.getAllList(regionId);
            setDistricts(isTechnician ? data.filter(d => allowedDistrictIds.includes(d.id)) : data);
        }
    };

    const handleDistrictChange = async (districtId: number) => {
        setForm(prev => ({ ...prev, districtId, healthId: 0, deploymentId: 0 }));
        setHealths([]); setSiteItems([]); setItemStates({});
        setSiteDeployments([]); setBooklets([]);
        if (districtId) {
            const data = await HealthService.getAllList(districtId);
            setHealths(isTechnician ? data.filter(h => allowedHealthIds.includes(h.id)) : data);
        }
    };

    // ✅ Site sélectionné → charger déploiements + équipements + booklets
    const handleHealthChange = async (healthId: number) => {
        setForm(prev => ({ ...prev, healthId, deploymentId: 0 }));
        setSiteItems([]); setItemStates({});
        setSiteDeployments([]); setBooklets([]);
        if (!healthId) return;

        setSiteLoading(true);
        try {
            // ✅ Charger déploiements du site
            const deps = await DeploymentService.getAll(0, 100, undefined, undefined, healthId);
            setSiteDeployments(deps.content || []);

            // ✅ Auto-sélectionner le premier déploiement
            if (deps.content?.length > 0) {
                setForm(prev => ({ ...prev, healthId, deploymentId: deps.content[0].id }));
            }

            // ✅ Charger booklets par district (pas de health_id dans la table booklet)
            try {
                const bkts = await BookletService.getByDistrict(form.districtId);
                setBooklets(Array.isArray(bkts) ? bkts : []);
            } catch { setBooklets([]); }

            // ✅ Charger équipements
            await loadSiteItems(healthId, form.typeInter, deps.content || []);
        } finally {
            setSiteLoading(false);
        }
    };

    const loadSiteItems = async (
        healthId: number, typeInter: string, deps?: DeploymentResponse[]
    ) => {
        try {
            const deployments = deps || (await DeploymentService.getAll(0, 100, undefined, undefined, healthId)).content;
            const allItems: DeploymentItemResponse[] = [];

            deployments.forEach(dep => {
                (dep.items || []).forEach(item => {
                    if (typeInter === 'EN_LIGNE') {
                        if (item.status !== 'REMPLACE') {
                            allItems.push({ ...item, deploymentCode: dep.codeDep } as any);
                        }
                    } else {
                        if (item.status === 'EN_ATTENTE_INTERVENTION_SITE') {
                            allItems.push({ ...item, deploymentCode: dep.codeDep } as any);
                        }
                    }
                });
            });

            setSiteItems(allItems);
            const states: Record<number, ItemState> = {};
            allItems.forEach(item => {
                states[item.id] = {
                    selected: false, etatAvant: item.status || 'FONCTIONNEL', etatApres: '',
                };
            });
            setItemStates(states);
        } catch (e) { console.error('Erreur chargement items:', e); }
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
                setAvailableAcqs(prev => ({ ...prev, [itemId]: all.filter(a => a.Type?.toLowerCase().trim() === typeName.toLowerCase().trim()) }));
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
        if (!form.dateInter || !form.regionId || !form.districtId ||
            !form.healthId || !form.evaluationId ||
            !form.durationMinutes || !form.commentInter.trim()) {
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
                if (s.etatAvant)              etatsAvant[id]         = s.etatAvant;
                if (s.etatApres)              etatsApres[id]         = s.etatApres;
                if (s.replacementId)          replacements[id]       = s.replacementId;
                if (s.maintenanceReussie !== undefined) maintenanceReussie[id] = s.maintenanceReussie;
            });

            await InterventionService.create({
                ...form,
                regionId:             Number(form.regionId),
                districtId:           Number(form.districtId),
                healthId:             Number(form.healthId),
                deploymentId:         Number(form.deploymentId),
                evaluationId:         Number(form.evaluationId),
                durationMinutes:      Number(form.durationMinutes),
                personId:             undefined,
                bookletId:            form.bookletId ? Number(form.bookletId) : undefined,
                manualPersonName:     manualPersonName.trim()    || undefined,
                manualPersonContact:  manualPersonContact.trim() || undefined,
                manualPersonPost:     manualPersonPost.trim()    || undefined,
                selectedItemIds:      selectedItems,
                etatsAvant,
                etatsApres,
                replacements,
                maintenanceReussie,
                enAttenteMaintenance: form.enAttenteMaintenance ?? false,
            });

            // ✅ Saisie manuelle → créer/retrouver la personne dans la table booklet
            if (manualPerson && manualPersonName.trim()) {
                const parts = manualPersonName.trim().split(' ');
                await BookletService.createFromIntervention({
                    lastName:   parts[0],
                    firstName:  parts.slice(1).join(' ') || '',
                    contact:    manualPersonContact.trim() || undefined,
                    postName:   manualPersonPost.trim()   || undefined,
                    regionId:   Number(form.regionId),
                    districtId: Number(form.districtId),
                });
            }
            onSuccess(); onHide();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de la création.');
        } finally { setIsLoading(false); }
    };

    return (
        <Modal show={show} onHide={onHide} centered size="xl">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold">
                    <i className="bi bi-tools text-primary me-2" />
                    Nouvelle intervention
                </Modal.Title>
            </Modal.Header>

            <Modal.Body className="px-4">
                {error && <Alert variant="danger" className="rounded-3">{error}</Alert>}

                {/* ══ Section 1 — Type + Date + Durée ══ */}
                <div className="card border-0 bg-light rounded-4 p-3 mb-3">
                    <h6 className="fw-bold text-primary mb-3"><i className="bi bi-clipboard-data me-2" />Informations générales</h6>
                    <Row className="g-3">
                        <Col md={3}>
                            <Form.Label className="fw-semibold small">Type <span className="text-danger">*</span></Form.Label>
                            <div className="d-flex flex-column gap-1 mt-1">
                                {[{ val: 'EN_LIGNE', label: '📞 En ligne' }, { val: 'SUR_SITE', label: '🏥 Sur site' }].map(({ val, label }) => (
                                    <Form.Check key={val} type="radio" id={`type-${val}`} name="typeInter"
                                        value={val} label={label} checked={form.typeInter === val}
                                        onChange={() => handleTypeChange(val)} />
                                ))}
                            </div>
                        </Col>
                        <Col md={3}>
                            <Form.Label className="fw-semibold small">Action</Form.Label>
                            {form.typeInter === 'EN_LIGNE' ? (
                                <div className="p-2 bg-primary bg-opacity-10 rounded-3 text-primary small fw-semibold">🔧 Maintenance (automatique)</div>
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
                            <Form.Control type="number" name="durationMinutes" min={1} value={form.durationMinutes} onChange={handleChange} placeholder="Ex: 30" className="rounded-3" size="sm" />
                        </Col>
                    </Row>
                </div>

                {/* ══ Section 2 — Localisation ══ */}
                <div className="card border-0 bg-light rounded-4 p-3 mb-3">
                    <h6 className="fw-bold text-primary mb-3"><i className="bi bi-geo-alt me-2" />Localisation</h6>
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

                {/* ══ Section 3 — Déploiement concerné ══ */}
                {form.healthId > 0 && (
                    <div className="card border-0 bg-light rounded-4 p-3 mb-3">
                        <h6 className="fw-bold text-primary mb-3"><i className="bi bi-truck me-2" />Déploiement concerné <span className="text-danger">*</span></h6>
                        {siteDeployments.length === 0 ? (
                            <Alert variant="warning" className="rounded-3 small mb-0">
                                <i className="bi bi-exclamation-triangle me-2" />Aucun déploiement trouvé pour ce site.
                            </Alert>
                        ) : (
                            <Form.Select name="deploymentId" value={form.deploymentId} onChange={handleChange} className="rounded-3" size="sm">
                                <option value={0}>-- Sélectionner un déploiement --</option>
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
                        <h6 className="fw-bold text-primary mb-3">
                            <i className="bi bi-pc-display-horizontal me-2" />
                            {form.typeInter === 'EN_LIGNE' ? 'Équipements du site' : "Équipements en attente d'intervention"}
                            <span className="badge bg-primary bg-opacity-10 text-primary ms-2 small fw-normal">{siteItems.length} équipement(s)</span>
                        </h6>

                        {siteLoading ? (
                            <div className="text-center py-3"><Spinner size="sm" className="me-2" />Chargement...</div>
                        ) : siteItems.length === 0 ? (
                            <Alert variant="info" className="rounded-3 small mb-0">
                                <i className="bi bi-info-circle me-2" />
                                {form.typeInter === 'SUR_SITE' ? "Aucun équipement en attente d'intervention sur site." : 'Aucun équipement déployé sur ce site.'}
                            </Alert>
                        ) : (
                            <Table size="sm" bordered hover className="mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th style={{ width: '40px' }}>✓</th>
                                        <th>Tag</th>
                                        <th>Équipement</th>
                                        <th>N° Série</th>
                                        {/* ✅ Partenaire équipement */}
                                        <th>Partenaire</th>
                                        <th>Statut au déploiement</th>
                                        <th>État avant</th>
                                        <th>État après</th>
                                        {form.typeInter === 'SUR_SITE' && <th>Résultat maintenance</th>}
                                        {form.typeInter === 'SUR_SITE' && <th>Remplacement</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {siteItems.map(item => {
                                        const state = itemStates[item.id] || { selected: false, etatAvant: 'FONCTIONNEL', etatApres: '' };
                                        const isSelected = state.selected;
                                        const maintenanceEchouee = state.maintenanceReussie === false;
                                        // ✅ Chercher le partenaire depuis les déploiements
                                        const itemDep = siteDeployments.find(d => d.items?.some(it => it.id === item.id));

                                        return (
                                            <tr key={item.id} style={{ background: isSelected ? '#f0f7ff' : 'white', opacity: !isSelected ? 0.7 : 1 }}>
                                                <td className="text-center"><Form.Check type="checkbox" checked={isSelected} onChange={() => toggleItemSelected(item.id)} /></td>
                                                <td className="small fw-semibold">{item.tag}</td>
                                                <td className="small">{item.typeName}</td>
                                                <td className="small text-muted">{item.serial}</td>
                                                {/* ✅ Partenaire de l'équipement */}
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
                                                        <Form.Select size="sm" value={state.etatApres} onChange={e => handleEtatApresChange(item.id, e.target.value)}>
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
                                                                <Button size="sm" variant={state.maintenanceReussie === true ? 'success' : 'outline-success'} className="rounded-2 py-0"
                                                                    onClick={() => handleMaintenanceResult(item.id, true, item.typeName)}>✅ Réussie</Button>
                                                                <Button size="sm" variant={state.maintenanceReussie === false ? 'danger' : 'outline-danger'} className="rounded-2 py-0"
                                                                    onClick={() => handleMaintenanceResult(item.id, false, item.typeName)}>❌ Échouée</Button>
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
                                                                    <Form.Select size="sm" className="border-danger" value={state.replacementId || 0}
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
                                Les équipements défaillants/dégradés seront marqués <strong>En attente d'intervention sur site</strong>.
                            </Alert>
                        )}
                    </div>
                )}

                {/* ══ Section 5 — Personne assistée ══ */}
                {form.healthId > 0 && (
                    <div className="card border-0 bg-light rounded-4 p-3 mb-3">
                        <h6 className="fw-bold text-primary mb-3">
                            <i className="bi bi-person-fill me-2" />
                            Personne assistée <span className="text-danger">*</span>
                        </h6>

                        {/* ✅ Toggle entre sélection booklet et saisie manuelle */}
                        <div className="d-flex gap-2 mb-3">
                            <button type="button"
                                className={`btn btn-sm rounded-3 ${!manualPerson ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => { setManualPerson(false); setManualPersonName(''); setManualPersonContact(''); setManualPersonPost(''); }}>
                                <i className="bi bi-person-lines-fill me-1" />Sélectionner dans la liste
                            </button>
                            <button type="button"
                                className={`btn btn-sm rounded-3 ${manualPerson ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => { setManualPerson(true); setForm(prev => ({ ...prev, bookletId: undefined })); }}>
                                <i className="bi bi-pencil me-1" />Saisir manuellement
                            </button>
                        </div>

                        {manualPerson ? (
                            /* ✅ Saisie manuelle avec contact et fonction */
                            <div className="row g-2">
                                <div className="col-md-12">
                                    <Form.Label className="fw-semibold small">
                                        Nom & Prénom <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control type="text"
                                        placeholder="Ex: KOUASSI Jean"
                                        value={manualPersonName}
                                        onChange={e => setManualPersonName(e.target.value)}
                                        className="rounded-3" size="sm" />
                                </div>
                                <div className="col-md-6">
                                    <Form.Label className="fw-semibold small">Contact / Téléphone</Form.Label>
                                    <Form.Control type="text"
                                        placeholder="Ex: 07 00 00 00 00"
                                        value={manualPersonContact}
                                        onChange={e => setManualPersonContact(e.target.value)}
                                        className="rounded-3" size="sm" />
                                </div>
                                <div className="col-md-6">
                                    <Form.Label className="fw-semibold small">Fonction / Poste</Form.Label>
                                    <Form.Control type="text"
                                        placeholder="Ex: Infirmier chef"
                                        value={manualPersonPost}
                                        onChange={e => setManualPersonPost(e.target.value)}
                                        className="rounded-3" size="sm" />
                                </div>
                                {manualPersonName.trim() && (
                                    <div className="col-12">
                                        <div className="p-2 bg-white rounded-3 border d-flex align-items-center gap-3 mt-1">
                                            <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center"
                                                style={{ width: 36, height: 36, minWidth: 36 }}>
                                                <span className="text-white fw-bold small">
                                                    {manualPersonName.trim().charAt(0).toUpperCase()}
                                                </span>
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
                                Aucune personne enregistrée pour ce site.{' '}
                                <button type="button" className="btn btn-link btn-sm p-0"
                                    onClick={() => setManualPerson(true)}>
                                    Saisir manuellement →
                                </button>
                            </Alert>
                        ) : (
                            <Form.Select name="bookletId" value={form.bookletId || 0}
                                onChange={handleChange} className="rounded-3" size="sm">
                                <option value={0}>-- Sélectionner --</option>
                                {booklets.map(b => (
                                    <option key={b.id} value={b.id}>
                                        {b.lastName} {b.firstName}
                                        {b.contact        ? ` | 📞 ${b.contact}`   : ''}
                                        {b.post?.postName ? ` | ${b.post.postName}` : ''}
                                    </option>
                                ))}
                            </Form.Select>
                        )}
                    </div>
                )}

                {/* ══ Section 6 — Évaluation + Commentaire ══ */}
                <div className="card border-0 bg-light rounded-4 p-3 mb-3">
                    <h6 className="fw-bold text-primary mb-3"><i className="bi bi-chat-left-text me-2" />Évaluation & Commentaire</h6>
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
                                onChange={handleChange} placeholder="Décrivez l'intervention..." className="rounded-3" size="sm" />
                        </Col>
                    </Row>
                </div>
            </Modal.Body>

            <Modal.Footer className="border-0">
                <Button variant="light" onClick={onHide} className="rounded-3">Annuler</Button>
                <Button variant="primary" onClick={handleSubmit}
                    disabled={isLoading || selectedItems.length === 0}
                    className="rounded-3">
                    {isLoading
                        ? <><Spinner size="sm" className="me-2" />Enregistrement...</>
                        : <><i className="bi bi-plus-circle me-2" />Enregistrer ({selectedItems.length} équipement(s))</>
                    }
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default InterventionFormModal;