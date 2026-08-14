import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import DeploymentService  from '../../services/deploymentService';
import RegionService      from '../../services/regionService';
import DistrictService    from '../../services/districtService';
import HealthService      from '../../services/healthService';
import AppsService        from '../../services/appsService';
import AcquisitionService from '../../services/acquisitionService';
import BookletService     from '../../services/bookletService';
import {
    DeploymentRequest, DeploymentItemRequest,
    DeploymentResponse, RegionResponse, DistrictResponse,
    HealthResponse, AppsResponse, AcquisitionResponse
} from '../../types';
import { Booklet } from '../../types';
import { getImageSrc } from '../../utils/imageUtils';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import notify from '../../services/notify';

interface PartnerOption { id: number; label: string; }

interface Props {
    show:       boolean;
    onHide:     () => void;
    onSuccess:  () => void;
    deployment: DeploymentResponse | null;
}

// Poste identifiant un convoyeur — rend le site facultatif (doit matcher
// CONVOYEUR_POST côté DeploymentServiceImpl.java et DeploymentFormModal.tsx)
const CONVOYEUR_POST = 'Convoyeur';

const initialForm: DeploymentRequest = {
    codeDep: '', dateRecep: '', comment: '',
    regionId: 0, districtId: 0, healthId: 0,
    appsId: 0, items: [] as DeploymentItemRequest[],
    partnerId: undefined,
    receivedByBookletId: undefined,
    receivedByName: '',
    receivedByContact: '',
    receivedByPost: '',
};

const DeploymentUpdateModal: React.FC<Props> = ({
    show, onHide, onSuccess, deployment
}) => {
    const { isUnrestricted } = useAuth();
    const [isLoading,    setIsLoading]    = useState(false);
    const [partners,     setPartners]     = useState<PartnerOption[]>([]);
    const [error,        setError]        = useState<string | null>(null);
    const [regions,      setRegions]      = useState<RegionResponse[]>([]);
    const [districts,    setDistricts]    = useState<DistrictResponse[]>([]);
    const [healths,      setHealths]      = useState<HealthResponse[]>([]);
    const [apps,         setApps]         = useState<AppsResponse[]>([]);
    const [acquisitions, setAcquisitions] = useState<AcquisitionResponse[]>([]);
    const [form,         setForm]         = useState<DeploymentRequest>(initialForm);

    // ── Personne réceptionnaire ─────────────────────────────────────────────
    const [booklets,          setBooklets]          = useState<Booklet[]>([]);
    const [manualReceivedBy,  setManualReceivedBy]  = useState(false);
    const [receivedByName,    setReceivedByName]    = useState('');
    const [receivedByContact, setReceivedByContact] = useState('');
    const [receivedByPost,    setReceivedByPost]    = useState('');

    const isConvoyeur = receivedByPost.trim().toLowerCase() === CONVOYEUR_POST.toLowerCase();

    useEffect(() => {
        if (!show || !deployment) return;
        setError(null);

        // ✅ Chargement direct depuis /api/partners — évite le problème de mapping ReferenceService
        if (isUnrestricted) {
            api.get('/api/partners?page=0&size=100')
                .then(res => {
                    // Gérer les deux formats possibles : liste directe ou paginée
                    const raw = res.data?.data?.content ?? res.data?.data ?? res.data ?? [];
                    const list: PartnerOption[] = Array.isArray(raw)
                        ? raw.map((p: any) => ({
                            id:    p.id,
                            // ✅ Essayer tous les champs possibles
                            label: p.partnerName ?? p.partner_name ?? p.name ?? `Partenaire ${p.id}`,
                        }))
                        : [];
                    setPartners(list);
                })
                .catch(() => setPartners([]));
        }

        Promise.all([
            RegionService.getAllList(),
            AppsService.getAllList(),
            AcquisitionService.getAvailable(),
        ]).then(([regList, appList, acqList]) => {
            setRegions(regList);
            setApps(appList);

            // ✅ Inclure aussi les acquisitions déjà déployées dans ce déploiement
            //    pour qu'elles apparaissent dans le dropdown
            const deployedAcqs = (deployment.items ?? []).map(item => ({
                id:         item.acquisitionId,
                tag:        item.tag,
                serial:     item.serial,
                Type:       item.typeName,
                status:     'DEPLOYE',
                deployed:   true,
                quantity:   1,
                dateAcq:    '',
                partnerName: deployment.partnerName,
            } as AcquisitionResponse));

            // Fusionner : déjà déployés + disponibles, sans doublons
            const mergedMap = new Map<number, AcquisitionResponse>();
            // Priorité aux items déjà déployés (affichés en premier)
            deployedAcqs.forEach(a => mergedMap.set(a.id, a));
            // Ajouter les disponibles non encore présents
            acqList.forEach(a => { if (!mergedMap.has(a.id)) mergedMap.set(a.id, a); });
            const merged = Array.from(mergedMap.values());
            setAcquisitions(merged);

            const regionId   = deployment.regionId   ?? 0;
            const districtId = deployment.districtId ?? 0;

            const loadCascade = async () => {
                if (regionId) {
                    const distList = await DistrictService.getAllList(regionId).catch(() => []);
                    setDistricts(distList);
                }
                if (districtId) {
                    const healList = await HealthService.getAllList(districtId).catch(() => []);
                    setHealths(healList);
                    // ✅ Booklets du district — pour la sélection de la personne réceptionnaire
                    try {
                        const bkts = await BookletService.getByDistrict(districtId);
                        setBooklets(Array.isArray(bkts) ? bkts : []);
                    } catch { setBooklets([]); }
                }

                setForm({
                    codeDep:    deployment.codeDep,
                    dateRecep:  String(deployment.dateRecep).split('T')[0],
                    comment:    deployment.comment ?? '',
                    regionId,
                    districtId,
                    healthId:   deployment.healthId  ?? 0,
                    appsId:     deployment.appsId    ?? 0,
                    partnerId:  deployment.partnerId ?? undefined,
                    receivedByBookletId: deployment.receivedByBookletId ?? undefined,
                    items: (deployment.items ?? []).map(item => ({
                        acquisitionId: item.acquisitionId,
                        status:        item.status as 'FONCTIONNEL' | 'NON_FONCTIONNEL',
                    })),
                });

                // ✅ Pré-remplir la personne réceptionnaire existante
                if (deployment.receivedByBookletId) {
                    setManualReceivedBy(false);
                } else if (deployment.receivedByName) {
                    setManualReceivedBy(true);
                    setReceivedByName(deployment.receivedByName ?? '');
                    setReceivedByContact(deployment.receivedByContact ?? '');
                }
                setReceivedByPost(deployment.receivedByPost ?? '');
            };
            loadCascade();
        }).catch(err => console.error('Erreur chargement références:', err));
    }, [show, deployment, isUnrestricted]);

    useEffect(() => {
        if (!show) {
            setForm(initialForm);
            setDistricts([]);
            setHealths([]);
            setError(null);
            setBooklets([]);
            setManualReceivedBy(false);
            setReceivedByName('');
            setReceivedByContact('');
            setReceivedByPost('');
        }
    }, [show]);

    const handleRegionChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const regionId = Number(e.target.value);
        setForm(prev => ({ ...prev, regionId, districtId: 0, healthId: 0 }));
        setHealths([]);
        setBooklets([]);
        if (regionId) {
            const data = await DistrictService.getAllList(regionId);
            setDistricts(data);
        } else setDistricts([]);
    };

    const handleDistrictChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const districtId = Number(e.target.value);
        setForm(prev => ({ ...prev, districtId, healthId: 0 }));
        setBooklets([]);
        if (districtId) {
            const data = await HealthService.getAllList(districtId);
            setHealths(data);
            try {
                const bkts = await BookletService.getByDistrict(districtId);
                setBooklets(Array.isArray(bkts) ? bkts : []);
            } catch { setBooklets([]); }
        } else setHealths([]);
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: ['healthId', 'appsId', 'partnerId', 'receivedByBookletId'].includes(name)
                ? (value ? Number(value) : undefined) : value,
        }));
    };

    // ✅ NOUVEAU — bascule du poste de la personne réceptionnaire ; si
    // "Convoyeur", le site devient facultatif
    const handleReceivedByPostChange = (value: string) => {
        setReceivedByPost(value);
        if (value.trim().toLowerCase() === CONVOYEUR_POST.toLowerCase()) {
            setForm(prev => ({ ...prev, healthId: 0 }));
        }
    };

    const handleToggleManualReceivedBy = (value: boolean) => {
        setManualReceivedBy(value);
        if (value) {
            setForm(prev => ({ ...prev, receivedByBookletId: undefined }));
        } else {
            setReceivedByName(''); setReceivedByContact(''); setReceivedByPost('');
        }
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
        if (!deployment) return;
        setError(null);
        if (!form.codeDep.trim()) { setError('Le code déploiement est obligatoire.'); return; }
        if (!form.dateRecep)      { setError('La date est obligatoire.');              return; }
        if (!form.regionId)       { setError('La région est obligatoire.');            return; }
        if (!form.districtId)     { setError('Le district est obligatoire.');          return; }
        // ✅ MODIFIÉ — site facultatif si la personne réceptionnaire est un Convoyeur
        if (!isConvoyeur && !form.healthId) { setError('Le site de santé est obligatoire (sauf si la personne réceptionnaire est un Convoyeur).'); return; }
        if (!form.appsId)         { setError("L'application est obligatoire.");        return; }
        if (form.items.length === 0)                { setError('Ajoutez au moins un équipement.'); return; }
        if (form.items.some(i => !i.acquisitionId)) { setError('Veuillez sélectionner tous les équipements.'); return; }
        if (!form.receivedByBookletId && !receivedByName.trim()) {
            setError('Veuillez sélectionner ou saisir la personne réceptionnaire.'); return;
        }

        setIsLoading(true);
        try {
            const formToSend = {
                ...form,
                dateRecep: form.dateRecep && !form.dateRecep.includes('T')
                    ? `${form.dateRecep}T00:00:00`
                    : form.dateRecep,
                healthId: isConvoyeur ? undefined : form.healthId,
                receivedByName:    manualReceivedBy ? receivedByName.trim()    || undefined : undefined,
                receivedByContact: manualReceivedBy ? receivedByContact.trim() || undefined : undefined,
                receivedByPost:    receivedByPost.trim() || undefined,
            };
            await DeploymentService.update(deployment.id, formToSend);
            onSuccess();
            onHide();
            notify.success('Déploiement modifié avec succès');
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Erreur lors de la modification.';
            setError(msg);
            notify.error(msg);
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
                    <i className="bi bi-pencil-square text-warning me-2" />
                    Modifier le déploiement
                    {deployment && (
                        <small className="text-muted ms-2 fw-normal fs-6">— {deployment.codeDep}</small>
                    )}
                    {deployment?.partnerName && (
                        <span className="badge bg-warning bg-opacity-10 text-warning ms-2 fw-normal small">
                            <i className="bi bi-building me-1" />{deployment.partnerName}
                        </span>
                    )}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body className="px-4">
                {error && <Alert variant="danger" className="rounded-3">{error}</Alert>}

                {/* ✅ Partenaire — sélecteur complet pour SUPER_ADMIN/ITECH */}
                {isUnrestricted ? (
                    <div className="mb-3">
                        <label className="fw-semibold form-label">
                            Partenaire
                            <small className="text-muted fw-normal ms-2">
                                ({partners.length} partenaire(s) disponibles)
                            </small>
                        </label>
                        <select
                            name="partnerId"
                            className="form-select rounded-3"
                            value={form.partnerId ?? ''}
                            onChange={handleChange}>
                            <option value="">-- Aucun partenaire --</option>
                            {partners.map(p => (
                                <option key={p.id} value={p.id}>{p.label}</option>
                            ))}
                        </select>
                        {form.partnerId && (
                            <small className="text-success mt-1 d-block">
                                <i className="bi bi-check-circle me-1" />
                                Partenaire sélectionné : {partners.find(p => p.id === form.partnerId)?.label || `ID ${form.partnerId}`}
                            </small>
                        )}
                    </div>
                ) : deployment?.partnerName ? (
                    <Alert variant="info" className="rounded-3 py-2 small mb-3 d-flex align-items-center gap-2">
                        <i className="bi bi-building-fill text-primary" />
                        <span>Partenaire : <strong>{deployment.partnerName}</strong></span>
                    </Alert>
                ) : null}

                <Form>
                    {/* ── Code + Date ──────────────────────────────── */}
                    <div className="row">
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">
                                    Code déploiement <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control name="codeDep" value={form.codeDep}
                                    onChange={handleChange} className="rounded-3" />
                            </Form.Group>
                        </div>
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">
                                    Date <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control type="date" name="dateRecep" value={form.dateRecep}
                                    onChange={handleChange} className="rounded-3" />
                            </Form.Group>
                        </div>
                    </div>

                    {/* ── Région + District + Site ─────────────────── */}
                    <div className="row">
                        <div className="col-md-4">
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Région <span className="text-danger">*</span></Form.Label>
                                <Form.Select value={form.regionId} onChange={handleRegionChange} className="rounded-3">
                                    <option value={0}>-- Région --</option>
                                    {regions.map(r => <option key={r.id} value={r.id}>{r.regionName}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </div>
                        <div className="col-md-4">
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">District <span className="text-danger">*</span></Form.Label>
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
                                    Site de santé {!isConvoyeur && <span className="text-danger">*</span>}
                                    {isConvoyeur && (
                                        <small className="text-muted fw-normal ms-1">(facultatif — Convoyeur)</small>
                                    )}
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
                        <Form.Label className="fw-semibold">Application <span className="text-danger">*</span></Form.Label>
                        <div className="d-flex align-items-center gap-2">
                            <Form.Select name="appsId" value={form.appsId} onChange={handleChange} className="rounded-3">
                                <option value={0}>-- Application --</option>
                                {apps.map(a => <option key={a.id} value={a.id}>{a.appsName}</option>)}
                            </Form.Select>
                            {selectedApp && (
                                <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 border"
                                    style={{ background: `${selectedApp.color || '#616161'}10`,
                                             borderColor: `${selectedApp.color || '#616161'}40`,
                                             whiteSpace: 'nowrap', minWidth: '140px' }}>
                                    <div style={{ width:'30px', height:'30px', borderRadius:'8px',
                                        background:`${selectedApp.color}20`, border:`1.5px solid ${selectedApp.color}`,
                                        display:'flex', alignItems:'center', justifyContent:'center',
                                        overflow:'hidden', flexShrink:0 }}>
                                        {selectedApp.image
                                            ? <img src={getImageSrc(selectedApp.image)} alt={selectedApp.appsName}
                                                   style={{ width:'100%', height:'100%', objectFit:'contain', padding:'2px' }} />
                                            : <i className={`bi ${selectedApp.icon || 'bi-app-indicator'}`}
                                                 style={{ color: selectedApp.color, fontSize:'14px' }} />}
                                    </div>
                                    <span className="fw-semibold small" style={{ color: selectedApp.color }}>
                                        {selectedApp.appsName}
                                    </span>
                                </div>
                            )}
                        </div>
                    </Form.Group>

                    {/* ── Personne réceptionnaire ──────────────────── */}
                    <div className="card border-0 bg-light rounded-4 p-3 mb-3">
                        <h6 className="fw-bold text-warning mb-3">
                            <i className="bi bi-person-fill me-2" />
                            Personne réceptionnaire <span className="text-danger">*</span>
                        </h6>

                        <div className="d-flex gap-2 mb-3">
                            <button type="button"
                                className={`btn btn-sm rounded-3 ${!manualReceivedBy ? 'btn-warning text-white' : 'btn-outline-warning'}`}
                                onClick={() => handleToggleManualReceivedBy(false)}>
                                <i className="bi bi-person-lines-fill me-1" />Sélectionner dans la liste
                            </button>
                            <button type="button"
                                className={`btn btn-sm rounded-3 ${manualReceivedBy ? 'btn-warning text-white' : 'btn-outline-warning'}`}
                                onClick={() => handleToggleManualReceivedBy(true)}>
                                <i className="bi bi-pencil me-1" />Saisir manuellement
                            </button>
                        </div>

                        {manualReceivedBy ? (
                            <div className="row g-2">
                                <div className="col-md-12">
                                    <Form.Label className="fw-semibold small">
                                        Nom & Prénom <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control type="text"
                                        placeholder="Ex: KOUASSI Jean"
                                        value={receivedByName}
                                        onChange={e => setReceivedByName(e.target.value)}
                                        className="rounded-3" size="sm" />
                                </div>
                                <div className="col-md-6">
                                    <Form.Label className="fw-semibold small">Contact / Téléphone</Form.Label>
                                    <Form.Control type="text"
                                        placeholder="Ex: 07 00 00 00 00"
                                        value={receivedByContact}
                                        onChange={e => setReceivedByContact(e.target.value)}
                                        className="rounded-3" size="sm" />
                                </div>
                                <div className="col-md-6">
                                    <Form.Label className="fw-semibold small">Fonction / Poste</Form.Label>
                                    <Form.Control type="text"
                                        placeholder="Ex: Infirmier chef, Convoyeur..."
                                        value={receivedByPost}
                                        onChange={e => handleReceivedByPostChange(e.target.value)}
                                        className="rounded-3" size="sm" />
                                </div>
                                {isConvoyeur && (
                                    <div className="col-12">
                                        <Alert variant="info" className="rounded-3 small mb-0 mt-1">
                                            <i className="bi bi-info-circle me-2" />
                                            Poste "Convoyeur" détecté — le site de santé devient facultatif
                                            pour ce déploiement.
                                        </Alert>
                                    </div>
                                )}
                            </div>
                        ) : booklets.length === 0 ? (
                            <Alert variant="info" className="rounded-3 small mb-0">
                                <i className="bi bi-info-circle me-2" />
                                Aucune personne enregistrée pour ce district.{' '}
                                <button type="button" className="btn btn-link btn-sm p-0"
                                    onClick={() => handleToggleManualReceivedBy(true)}>
                                    Saisir manuellement →
                                </button>
                            </Alert>
                        ) : (
                            <Form.Select name="receivedByBookletId" value={form.receivedByBookletId || 0}
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

                    {/* ── Équipements ──────────────────────────────── */}
                    <div className="card border-0 bg-light rounded-4 p-3 mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="fw-bold mb-0">
                                <i className="bi bi-pc-display me-2 text-warning" />
                                Équipements déployés
                                <span className="badge bg-warning bg-opacity-10 text-warning ms-2">{form.items.length}</span>
                            </h6>
                            <button type="button" className="btn btn-sm btn-warning text-white rounded-3" onClick={handleAddItem}>
                                <i className="bi bi-plus-circle me-1" /> Ajouter
                            </button>
                        </div>

                        {form.items.length === 0 ? (
                            <div className="text-center py-3 text-muted">
                                <i className="bi bi-inbox fs-3 d-block mb-2" />Aucun équipement ajouté
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-sm align-middle mb-0 bg-white rounded-3">
                                    <thead className="table-light">
                                        <tr><th>#</th><th>Équipement</th><th>Type</th><th>N° Tag</th><th>N° Série</th><th>Partenaire</th><th>État</th><th></th></tr>
                                    </thead>
                                    <tbody>
                                        {form.items.map((item, i) => {
                                            const sel = acquisitions.find(a => a.id === Number(item.acquisitionId));
                                            return (
                                                <tr key={i}>
                                                    <td className="text-muted small">{i + 1}</td>
                                                    <td style={{ minWidth:'200px' }}>
                                                        <Form.Select size="sm" value={item.acquisitionId}
                                                            onChange={e => handleItemChange(i, 'acquisitionId', e.target.value)}
                                                            className="rounded-3">
                                                            <option value={0}>-- Sélectionner --</option>
                                                            {Array.from(
                                                                new Map(
                                                                    acquisitions
                                                                        .filter(a => a.id === item.acquisitionId || !selectedIds.includes(a.id))
                                                                        .map(a => [a.id, a])
                                                                ).values()
                                                            ).map(a => (
                                                                <option key={a.id} value={a.id}>
                                                                    {a.Type} | {a.tag}
                                                                    {a.status === 'DEPLOYE' ? ' ✓' : ''}
                                                                </option>
                                                            ))}
                                                        </Form.Select>
                                                    </td>
                                                    <td>{sel ? <span className="badge bg-primary bg-opacity-10 text-primary">{sel.Type}</span> : <span className="text-muted small">—</span>}</td>
                                                    <td>{sel ? <span className="badge bg-warning bg-opacity-10 text-warning">{sel.tag}</span> : <span className="text-muted small">—</span>}</td>
                                                    <td>{sel ? <span className="badge bg-success bg-opacity-10 text-success">{sel.serial}</span> : <span className="text-muted small">—</span>}</td>
                                                    <td>{sel?.partnerName ? <span className="badge bg-warning bg-opacity-10 text-warning">{sel.partnerName}</span> : <span className="text-muted small">—</span>}</td>
                                                    <td>
                                                        <Form.Select size="sm" value={item.status}
                                                            onChange={e => handleItemChange(i, 'status', e.target.value)}
                                                            className="rounded-3"
                                                            style={{ color: item.status === 'FONCTIONNEL' ? '#198754' : '#dc3545' }}>
                                                            <option value="FONCTIONNEL">✅ Fonctionnel</option>
                                                            <option value="NON_FONCTIONNEL">❌ Non fonctionnel</option>
                                                        </Form.Select>
                                                    </td>
                                                    <td>
                                                        <button type="button" className="btn btn-sm btn-outline-danger rounded-3"
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
                        <Form.Control as="textarea" rows={3} name="comment" value={form.comment}
                            onChange={handleChange}
                            placeholder="Point de l'activité de déploiement..."
                            className="rounded-3" />
                    </Form.Group>
                </Form>
            </Modal.Body>

            <Modal.Footer className="border-0">
                <Button variant="light" onClick={onHide} className="rounded-3" disabled={isLoading}>Annuler</Button>
                <Button variant="warning" onClick={handleSubmit} disabled={isLoading} className="rounded-3 text-white">
                    {isLoading
                        ? <><Spinner size="sm" className="me-2" />Modification...</>
                        : <><i className="bi bi-pencil me-2" />Modifier</>
                    }
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default DeploymentUpdateModal;