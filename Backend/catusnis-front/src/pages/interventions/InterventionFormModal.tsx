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
import AppsService           from '../../services/appsService';
import PartnerService        from '../../services/partnerService';
import StructureEtatiqueService, { StructureEtatiqueResponse } from '../../services/Structureetatiqueservice';
import notify from '../../services/notify';

import {
    InterventionRequest, EvaluationResponse,
    RegionResponse, DistrictResponse, HealthResponse,
    AcquisitionResponse, DeploymentItemResponse, DeploymentResponse,
    AppsResponse, PartnerResponse,
} from '../../types';
import { Booklet } from '../../types';
import useAuth from '../../hooks/useAuth';

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
    partnerId:            0,
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
    const [siteDeployments,    setSiteDeployments]    = useState<DeploymentResponse[]>([]);
    const [siteItems,          setSiteItems]          = useState<DeploymentItemResponse[]>([]);
    const [itemStates,         setItemStates]         = useState<Record<number, ItemState>>({});
    const [availableAcqs,      setAvailableAcqs]      = useState<Record<number, AcquisitionResponse[]>>({});
    const [acqLoading,         setAcqLoading]         = useState<Record<number, boolean>>({});
    const [allowedHealthIds,   setAllowedHealthIds]   = useState<number[]>([]);
    const [allowedDistrictIds, setAllowedDistrictIds] = useState<number[]>([]);
    const [siteLoading,        setSiteLoading]        = useState(false);
    const [manualPerson,       setManualPerson]       = useState(false);
    const [manualPersonName,    setManualPersonName]    = useState('');
    const [manualPersonContact, setManualPersonContact] = useState('');
    const [manualPersonPost,    setManualPersonPost]    = useState('');
    const [manualPersonEmail,   setManualPersonEmail]   = useState('');
    const [manualEquipment,       setManualEquipment]       = useState(false);
    const [manualStructure,       setManualStructure]       = useState(false);
    const [manualStructureName,   setManualStructureName]   = useState('');
    const [manualEquipmentName,   setManualEquipmentName]   = useState('');
    const [manualEquipmentType,   setManualEquipmentType]   = useState('');
    const [apps,                  setApps]                  = useState<AppsResponse[]>([]);
    const [partners,              setPartners]              = useState<PartnerResponse[]>([]);
    const [isCallOnly,            setIsCallOnly]            = useState(false);
    // ✅ NOUVEAU — Structure étatique appelante (mode "Appel / Orientation")
    const [structuresEtatiques,   setStructuresEtatiques]   = useState<StructureEtatiqueResponse[]>([]);
    const [structureEtatiqueId,   setStructureEtatiqueId]   = useState<number>(0);
    const [structureEtatiqueNom,  setStructureEtatiqueNom]  = useState('');
    const [structureEtatiqueMode, setStructureEtatiqueMode] = useState<'select' | 'create'>('select');

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
        setManualPerson(false); setManualPersonName(''); setManualPersonContact(''); setManualPersonPost(''); setManualPersonEmail('');
        setManualEquipment(false); setManualEquipmentName(''); setManualEquipmentType('');
        setManualStructure(false); setManualStructureName('');
        setIsCallOnly(false);
        setStructureEtatiqueId(0); setStructureEtatiqueNom(''); setStructureEtatiqueMode('select');
        StructureEtatiqueService.getAllList().then(setStructuresEtatiques).catch(() => setStructuresEtatiques([]));

        const load = async () => {
            try {
                const evls = await EvaluationService.getAllList();
                setEvaluations(evls);
                AppsService.getAllList().then(setApps).catch(() => setApps([]));
                PartnerService.getAllList().then(setPartners).catch(() => setPartners([]));
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
            actionInter: (manualEquipment || isCallOnly)
                ? (prev.actionInter === 'ORIENTATION_TECHNIQUE' ? 'ORIENTATION_TECHNIQUE' : 'ASSISTANCE_TECHNIQUE')
                : (typeInter === 'EN_LIGNE' ? 'MAINTENANCE' : 'MAINTENANCE_CURATIVE'),
        }));
        setSiteItems([]); setItemStates({});
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

    const handleHealthChange = async (healthId: number) => {
        setForm(prev => ({ ...prev, healthId, deploymentId: 0 }));
        setSiteItems([]); setItemStates({});
        setSiteDeployments([]); setBooklets([]);
        if (!healthId) return;

        setSiteLoading(true);
        try {
            const deps = await DeploymentService.getAll(0, 100, undefined, undefined, healthId);
            setSiteDeployments(deps.content || []);

            if (deps.content?.length > 0) {
                setForm(prev => ({ ...prev, healthId, deploymentId: deps.content[0].id }));
            }

            try {
                const bkts = await BookletService.getByDistrict(form.districtId);
                setBooklets(Array.isArray(bkts) ? bkts : []);
            } catch { setBooklets([]); }

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

    const handleToggleManualEquipment = (value: boolean) => {
        setManualEquipment(value);
        if (value) {
            setSiteItems([]); setItemStates({});
            setForm(prev => ({
                ...prev,
                deploymentId: 0,
                typesId: 0,
                actionInter: 'ASSISTANCE_TECHNIQUE',
            }));
        } else {
            setManualEquipmentName(''); setManualEquipmentType('');
            setForm(prev => ({
                ...prev,
                actionInter: prev.typeInter === 'EN_LIGNE' ? 'MAINTENANCE' : 'MAINTENANCE_CURATIVE',
            }));
            if (form.healthId) loadSiteItems(form.healthId, form.typeInter);
        }
    };

    const handleToggleCallOnly = (value: boolean) => {
        setIsCallOnly(value);
        if (value) {
            setManualStructure(false); setManualStructureName('');
            setManualEquipment(false); setManualEquipmentName(''); setManualEquipmentType('');
            setManualPerson(false); setManualPersonName(''); setManualPersonContact('');
            setManualPersonPost(''); setManualPersonEmail('');
            setSiteItems([]); setItemStates({});
            setSiteDeployments([]); setBooklets([]);
            setDistricts([]); setHealths([]);
            setStructureEtatiqueId(0); setStructureEtatiqueNom(''); setStructureEtatiqueMode('select');
            setForm(prev => ({
                ...prev,
                regionId: 0, districtId: 0, healthId: 0, deploymentId: 0, typesId: 0,
                evaluationId: 0, bookletId: undefined,
                actionInter: 'ASSISTANCE_TECHNIQUE',
            }));
        } else {
            setForm(prev => ({
                ...prev,
                actionInter: prev.typeInter === 'EN_LIGNE' ? 'MAINTENANCE' : 'MAINTENANCE_CURATIVE',
            }));
        }
    };

    const handleSubmit = async () => {
        setError(null);
        if (!form.dateInter || !form.durationMinutes || !form.commentInter.trim()) {
            setError('Veuillez remplir tous les champs obligatoires.'); return;
        }
        if (!isCallOnly) {
            if (!form.evaluationId) {
                setError('Veuillez remplir tous les champs obligatoires.'); return;
            }
            if (!manualStructure && (!form.regionId || !form.districtId || !form.healthId)) {
                setError('Veuillez sélectionner une région/district/site, ou basculer en saisie manuelle de la structure.'); return;
            }
            if (manualStructure && !manualStructureName.trim()) {
                setError('Veuillez indiquer le nom de la structure.'); return;
            }
            if (!manualEquipment && selectedItems.length === 0) {
                setError('Veuillez sélectionner au moins un équipement, ou basculer en mode assistance technique.'); return;
            }
            if (manualEquipment && !manualEquipmentName.trim()) {
                setError('Veuillez indiquer la désignation de l\'équipement hors base.'); return;
            }
            if (!form.bookletId && !manualPersonName.trim()) {
                setError('Veuillez sélectionner ou saisir la personne assistée.'); return;
            }
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
                regionId:             (manualStructure || isCallOnly) ? 0 : Number(form.regionId),
                districtId:           (manualStructure || isCallOnly) ? 0 : Number(form.districtId),
                healthId:             (manualStructure || isCallOnly) ? 0 : Number(form.healthId),
                deploymentId:         (manualEquipment || isCallOnly) ? 0 : Number(form.deploymentId),
                evaluationId:         isCallOnly ? undefined : Number(form.evaluationId),
                durationMinutes:      Number(form.durationMinutes),
                appsId:               form.appsId ? Number(form.appsId) : 0,
                partnerId:            form.partnerId ? Number(form.partnerId) : undefined,
                personId:             undefined,
                bookletId:            isCallOnly ? undefined : (form.bookletId ? Number(form.bookletId) : undefined),
                manualPersonName:     manualPersonName.trim()    || undefined,
                manualPersonContact:  manualPersonContact.trim() || undefined,
                manualPersonPost:     manualPersonPost.trim()    || undefined,
                manualPersonEmail:    isCallOnly ? undefined : (manualPersonEmail.trim()   || undefined),
                manualEquipmentName:  manualEquipment ? manualEquipmentName.trim() || undefined : undefined,
                manualEquipmentType:  manualEquipment ? manualEquipmentType.trim() || undefined : undefined,
                manualStructureName:  manualStructure ? manualStructureName.trim() || undefined : undefined,
                // ✅ Structure étatique appelante (mode appel)
                structureEtatiqueId:  isCallOnly && structureEtatiqueMode === 'select' && structureEtatiqueId
                    ? structureEtatiqueId : undefined,
                structureEtatiqueNom: isCallOnly && structureEtatiqueMode === 'create' && structureEtatiqueNom.trim()
                    ? structureEtatiqueNom.trim() : undefined,
                selectedItemIds:      (manualEquipment || isCallOnly) ? [] : selectedItems,
                etatsAvant,
                etatsApres,
                replacements,
                maintenanceReussie,
                enAttenteMaintenance: form.enAttenteMaintenance ?? false,
            });

            if (manualPerson && manualPersonName.trim() && !manualStructure && !isCallOnly) {
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
            notify.success(isCallOnly ? 'Appel enregistré avec succès' : 'Intervention créée avec succès');
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Erreur lors de la création.';
            setError(msg);
            notify.error(msg);
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
                            {(manualEquipment || isCallOnly) ? (
                                <Form.Select name="actionInter" value={form.actionInter} onChange={handleChange} className="rounded-3" size="sm">
                                    <option value="ASSISTANCE_TECHNIQUE">🛠️ Assistance technique</option>
                                    <option value="ORIENTATION_TECHNIQUE">🧭 Orientation technique</option>
                                </Form.Select>
                            ) : form.typeInter === 'EN_LIGNE' ? (
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

                    <div className="mt-3 pt-3 border-top">
                        <Form.Check
                            type="switch"
                            id="call-only-switch"
                            label={
                                <span className="fw-semibold small">
                                    📞 C'est un appel / une demande d'orientation — pas de site précis
                                    <span className="text-muted fw-normal ms-1">
                                        (structure étatique ou partenaire appelant pour une info, hors périmètre informatique par ex.)
                                    </span>
                                </span>
                            }
                            checked={isCallOnly}
                            onChange={e => handleToggleCallOnly(e.target.checked)}
                        />
                    </div>
                </div>

                {isCallOnly && (
                    <div className="card border-0 bg-light rounded-4 p-3 mb-3">
                        <h6 className="fw-bold text-primary mb-3"><i className="bi bi-building me-2" />Structure appelante (optionnel)</h6>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Label className="fw-semibold small">Structure étatique</Form.Label>
                                <div className="d-flex gap-2 mb-2">
                                    <button type="button"
                                        className={`btn btn-sm rounded-3 ${structureEtatiqueMode === 'select' ? 'btn-primary' : 'btn-outline-primary'}`}
                                        onClick={() => { setStructureEtatiqueMode('select'); setStructureEtatiqueNom(''); }}>
                                        Sélectionner
                                    </button>
                                    <button type="button"
                                        className={`btn btn-sm rounded-3 ${structureEtatiqueMode === 'create' ? 'btn-primary' : 'btn-outline-primary'}`}
                                        onClick={() => { setStructureEtatiqueMode('create'); setStructureEtatiqueId(0); }}>
                                        <i className="bi bi-plus-circle me-1" />Nouvelle
                                    </button>
                                </div>
                                {structureEtatiqueMode === 'select' ? (
                                    <Form.Select value={structureEtatiqueId} onChange={e => setStructureEtatiqueId(Number(e.target.value))} className="rounded-3" size="sm">
                                        <option value={0}>-- Aucune structure --</option>
                                        {structuresEtatiques.map(s => (
                                            <option key={s.id} value={s.id}>{s.nom}{s.regionName ? ` (${s.regionName})` : ''}</option>
                                        ))}
                                    </Form.Select>
                                ) : (
                                    <Form.Control type="text"
                                        placeholder="Ex: Préfecture de Yamoussoukro"
                                        value={structureEtatiqueNom}
                                        onChange={e => setStructureEtatiqueNom(e.target.value)}
                                        className="rounded-3" size="sm" />
                                )}
                            </Col>
                            <Col md={6}>
                                <Form.Label className="fw-semibold small">Bailleur / Partenaire</Form.Label>
                                <Form.Select name="partnerId" value={form.partnerId || 0} onChange={handleChange} className="rounded-3" size="sm">
                                    <option value={0}>-- Aucun partenaire --</option>
                                    {partners.map(p => <option key={p.id} value={p.id}>{p.partnerName}</option>)}
                                </Form.Select>
                            </Col>
                        </Row>

                        {/* ✅ NOUVEAU — Personne contactée : nom + poste (facultatif),
                            comme dans les modes En ligne / Sur site */}
                        <Row className="g-3 mt-1">
                            <Col md={6}>
                                <Form.Label className="fw-semibold small">Nom de la personne contactée</Form.Label>
                                <Form.Control type="text"
                                    placeholder="Ex: KOUASSI Jean"
                                    value={manualPersonName}
                                    onChange={e => setManualPersonName(e.target.value)}
                                    className="rounded-3" size="sm" />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="fw-semibold small">Fonction / Poste</Form.Label>
                                <Form.Control type="text"
                                    placeholder="Ex: Directeur des activités pharmaceutiques"
                                    value={manualPersonPost}
                                    onChange={e => setManualPersonPost(e.target.value)}
                                    className="rounded-3" size="sm" />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="fw-semibold small">Contact / Téléphone</Form.Label>
                                <Form.Control type="text"
                                    placeholder="Ex: 07 00 00 00 00"
                                    value={manualPersonContact}
                                    onChange={e => setManualPersonContact(e.target.value)}
                                    className="rounded-3" size="sm" />
                            </Col>
                        </Row>

                        <Alert variant="info" className="rounded-3 small mb-0 mt-3">
                            <i className="bi bi-info-circle me-2" />
                            Cet appel sera tracé sans site ni équipement précis — utile pour comptabiliser
                            toute sollicitation, même hors périmètre informatique.
                        </Alert>
                    </div>
                )}

                {!isCallOnly && (
                <div className="card border-0 bg-light rounded-4 p-3 mb-3">
                    <h6 className="fw-bold text-primary mb-3"><i className="bi bi-geo-alt me-2" />Localisation</h6>

                    <div className="d-flex gap-2 mb-3">
                        <button type="button"
                            className={`btn btn-sm rounded-3 ${!manualStructure ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setManualStructure(false)}>
                            <i className="bi bi-geo-alt-fill me-1" />Structure enregistrée
                        </button>
                        <button type="button"
                            className={`btn btn-sm rounded-3 ${manualStructure ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => {
                                setManualStructure(true);
                                setForm(prev => ({ ...prev, regionId: 0, districtId: 0, healthId: 0, deploymentId: 0 }));
                                setDistricts([]); setHealths([]); setSiteDeployments([]); setSiteItems([]); setItemStates({}); setBooklets([]);
                            }}>
                            <i className="bi bi-pencil me-1" />Structure non enregistrée (hors base)
                        </button>
                    </div>

                    {manualStructure ? (
                        <Row className="g-3">
                            <Col md={12}>
                                <Form.Label className="fw-semibold small">
                                    Nom de la structure / lieu <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control type="text"
                                    placeholder="Ex: Pharmacie de quartier Koumassi Nord"
                                    value={manualStructureName}
                                    onChange={e => setManualStructureName(e.target.value)}
                                    className="rounded-3" size="sm" />
                                <small className="text-muted">
                                    Région/district/site inconnus ou non enregistrés dans CATUSNIS.
                                </small>
                            </Col>
                        </Row>
                    ) : (
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
                    )}
                </div>
                )}

                {!isCallOnly && (form.healthId > 0 || manualStructure) && (
                    <div className="card border-0 bg-light rounded-4 p-3 mb-3">
                        <h6 className="fw-bold text-primary mb-3">
                            <i className="bi bi-pc-display-horizontal me-2" />Équipement concerné <span className="text-danger">*</span>
                        </h6>

                        <div className="d-flex gap-2 mb-3">
                            <button type="button"
                                className={`btn btn-sm rounded-3 ${!manualEquipment ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => handleToggleManualEquipment(false)}>
                                <i className="bi bi-hdd-stack me-1" />Équipement inventorié
                            </button>
                            <button type="button"
                                className={`btn btn-sm rounded-3 ${manualEquipment ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => handleToggleManualEquipment(true)}>
                                <i className="bi bi-pencil me-1" />Assistance technique (équipement hors base)
                            </button>
                        </div>

                        {manualEquipment ? (
                            <div className="row g-2">
                                <div className="col-md-6">
                                    <Form.Label className="fw-semibold small">
                                        Désignation de l'équipement <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control type="text"
                                        placeholder="Ex: Concentrateur O2 portable"
                                        value={manualEquipmentName}
                                        onChange={e => setManualEquipmentName(e.target.value)}
                                        className="rounded-3" size="sm" />
                                </div>
                                <div className="col-md-6">
                                    <Form.Label className="fw-semibold small">Type d'équipement</Form.Label>
                                    <Form.Control type="text"
                                        placeholder="Ex: Concentrateur d'oxygène"
                                        value={manualEquipmentType}
                                        onChange={e => setManualEquipmentType(e.target.value)}
                                        className="rounded-3" size="sm" />
                                </div>
                                <div className="col-md-6">
                                    <Form.Label className="fw-semibold small">Application</Form.Label>
                                    <Form.Select name="appsId" value={form.appsId || 0} onChange={handleChange} className="rounded-3" size="sm">
                                        <option value={0}>-- Application --</option>
                                        {apps.map(a => <option key={a.id} value={a.id}>{a.appsName}</option>)}
                                    </Form.Select>
                                </div>
                                <div className="col-md-6">
                                    <Form.Label className="fw-semibold small">Bailleur / Partenaire</Form.Label>
                                    <Form.Select name="partnerId" value={form.partnerId || 0} onChange={handleChange} className="rounded-3" size="sm">
                                        <option value={0}>-- Aucun partenaire --</option>
                                        {partners.map(p => <option key={p.id} value={p.id}>{p.partnerName}</option>)}
                                    </Form.Select>
                                </div>
                                <div className="col-12">
                                    <Alert variant="info" className="rounded-3 small mb-0 mt-1">
                                        <i className="bi bi-info-circle me-2" />
                                        Cet équipement sera automatiquement enregistré dans l'inventaire
                                        (statut « hors base ») pour un suivi ultérieur.
                                        Choisissez ci-dessus si l'action correspond à une
                                        <strong> assistance technique</strong> (prise en charge complète)
                                        ou une <strong>orientation technique</strong> (simple conseil/orientation).
                                    </Alert>
                                </div>
                            </div>
                        ) : (
                            <>
                                {siteDeployments.length === 0 ? (
                                    <Alert variant="warning" className="rounded-3 small mb-3">
                                        <i className="bi bi-exclamation-triangle me-2" />Aucun déploiement trouvé pour ce site.
                                    </Alert>
                                ) : (
                                    <Form.Select name="deploymentId" value={form.deploymentId} onChange={handleChange} className="rounded-3 mb-3" size="sm">
                                        <option value={0}>-- Sélectionner un déploiement --</option>
                                        {siteDeployments.map(d => (
                                            <option key={d.id} value={d.id}>
                                                {d.codeDep} — {d.appsDeploy} — {d.items?.length || 0} équipement(s)
                                            </option>
                                        ))}
                                    </Form.Select>
                                )}

                                <div className="d-flex align-items-center gap-2 mb-2">
                                    <span className="fw-semibold small">
                                        {form.typeInter === 'EN_LIGNE' ? 'Équipements du site' : "Équipements en attente d'intervention"}
                                    </span>
                                    <span className="badge bg-primary bg-opacity-10 text-primary small fw-normal">{siteItems.length} équipement(s)</span>
                                </div>

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
                                                const itemDep = siteDeployments.find(d => d.items?.some(it => it.id === item.id));

                                                return (
                                                    <tr key={item.id} style={{ background: isSelected ? '#f0f7ff' : 'white', opacity: !isSelected ? 0.7 : 1 }}>
                                                        <td className="text-center"><Form.Check type="checkbox" checked={isSelected} onChange={() => toggleItemSelected(item.id)} /></td>
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
                            </>
                        )}
                    </div>
                )}

                {!isCallOnly && (form.healthId > 0 || manualStructure) && (
                    <div className="card border-0 bg-light rounded-4 p-3 mb-3">
                        <h6 className="fw-bold text-primary mb-3">
                            <i className="bi bi-person-fill me-2" />
                            Personne assistée <span className="text-danger">*</span>
                        </h6>

                        <div className="d-flex gap-2 mb-3">
                            <button type="button"
                                className={`btn btn-sm rounded-3 ${!manualPerson ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => { setManualPerson(false); setManualPersonName(''); setManualPersonContact(''); setManualPersonPost(''); setManualPersonEmail(''); }}>
                                <i className="bi bi-person-lines-fill me-1" />Sélectionner dans la liste
                            </button>
                            <button type="button"
                                className={`btn btn-sm rounded-3 ${manualPerson ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => { setManualPerson(true); setForm(prev => ({ ...prev, bookletId: undefined })); }}>
                                <i className="bi bi-pencil me-1" />Saisir manuellement
                            </button>
                        </div>

                        {manualPerson ? (
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
                                <div className="col-md-6">
                                    <Form.Label className="fw-semibold small">Email</Form.Label>
                                    <Form.Control type="email"
                                        placeholder="Ex: nom@exemple.com"
                                        value={manualPersonEmail}
                                        onChange={e => setManualPersonEmail(e.target.value)}
                                        className="rounded-3" size="sm" />
                                    <small className="text-muted">Pour l'envoi du rapport d'intervention.</small>
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

                <div className="card border-0 bg-light rounded-4 p-3 mb-3">
                    <h6 className="fw-bold text-primary mb-3"><i className="bi bi-chat-left-text me-2" />
                        {isCallOnly ? 'Commentaire' : 'Évaluation & Commentaire'}
                    </h6>
                    <Row className="g-3">
                        {!isCallOnly && (
                            <Col md={4}>
                                <Form.Label className="fw-semibold small">Évaluation <span className="text-danger">*</span></Form.Label>
                                <Form.Select name="evaluationId" value={form.evaluationId} onChange={handleChange} className="rounded-3" size="sm">
                                    <option value={0}>-- Sélectionner --</option>
                                    {evaluations.map(e => <option key={e.id} value={e.id}>{e.evlName}</option>)}
                                </Form.Select>
                            </Col>
                        )}
                        <Col md={isCallOnly ? 12 : 8}>
                            <Form.Label className="fw-semibold small">Commentaire <span className="text-danger">*</span></Form.Label>
                            <Form.Control as="textarea" rows={2} name="commentInter" value={form.commentInter}
                                onChange={handleChange} placeholder="Décrivez l'appel / la demande..." className="rounded-3" size="sm" />
                        </Col>
                    </Row>
                </div>
            </Modal.Body>

            <Modal.Footer className="border-0">
                <Button variant="light" onClick={onHide} className="rounded-3">Annuler</Button>
                <Button variant="primary" onClick={handleSubmit}
                    disabled={isLoading || (!isCallOnly && !manualEquipment && selectedItems.length === 0)}
                    className="rounded-3">
                    {isLoading
                        ? <><Spinner size="sm" className="me-2" />Enregistrement...</>
                        : <><i className="bi bi-plus-circle me-2" />Enregistrer
                            {isCallOnly ? ' (appel / orientation)' : manualEquipment ? ' (assistance technique)' : ` (${selectedItems.length} équipement(s))`}
                          </>
                    }
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default InterventionFormModal;