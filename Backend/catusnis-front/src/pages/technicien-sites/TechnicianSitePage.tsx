import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button } from 'react-bootstrap';
import MainLayout              from '../../components/common/MainLayout';
import ConfirmModal            from '../../components/common/ConfirmModal';
import TechnicianSiteService, { TechnicianSiteResponse } from '../../services/technicianSiteService';
import PersonService,          { PersonResponse }         from '../../services/personService';
import RegionService                                       from '../../services/regionService';
import DistrictService                                     from '../../services/districtService';
import HealthService                                       from '../../services/healthService';
import { RegionResponse, DistrictResponse, HealthResponse } from '../../types';
import useAuth from '../../hooks/useAuth';

type RoleKey = 'TECHNICIEN' | 'LOGISTICIEN';

// ─────────────────────────────────────────────────────────────────────────────
// Page principale — nouveau visuel : grille de cartes + modal de gestion
// ─────────────────────────────────────────────────────────────────────────────
const TechnicianSitePage: React.FC = () => {
    const { hasRole } = useAuth();
    const canManage = hasRole('ADMIN') || hasRole('SUPER_ADMIN');

    const [activeRole,     setActiveRole]     = useState<RoleKey>('TECHNICIEN');
    const [persons,        setPersons]        = useState<PersonResponse[]>([]);
    const [assignCounts,   setAssignCounts]   = useState<Record<number, { regions: number; districts: number; sites: number }>>({});
    const [personsLoading, setPersonsLoading] = useState(false);
    const [searchPerson,   setSearchPerson]   = useState('');

    const [selected,       setSelected]       = useState<PersonResponse | null>(null);
    const [showModal,      setShowModal]      = useState(false);
    const [assignments,    setAssignments]    = useState<TechnicianSiteResponse[]>([]);
    const [sitesLoading,   setSitesLoading]   = useState(false);
    const [confirmId,      setConfirmId]      = useState<number | null>(null);
    const [deleteLoading,  setDeleteLoading]  = useState(false);

    // ── Personnes + compteurs ─────────────────────────────────────────────────
    const loadPersons = useCallback(async () => {
        setPersonsLoading(true);
        try {
            const all = await PersonService.getAllList();
            const filtered = all.filter(p => ((p as any).role ?? '').toUpperCase() === activeRole);
            setPersons(filtered);

            const counts: Record<number, { regions: number; districts: number; sites: number }> = {};
            await Promise.all(filtered.map(async p => {
                try {
                    const assigns = await TechnicianSiteService.getByTechnician(p.id);
                    counts[p.id] = {
                        regions:   new Set(assigns.filter(a => a.regionId).map(a => a.regionId)).size,
                        districts: new Set(assigns.filter(a => a.districtId).map(a => a.districtId)).size,
                        sites:     new Set(assigns.filter(a => a.healthId).map(a => a.healthId)).size,
                    };
                } catch { counts[p.id] = { regions: 0, districts: 0, sites: 0 }; }
            }));
            setAssignCounts(counts);
        } catch (e) { console.error(e); }
        finally { setPersonsLoading(false); }
    }, [activeRole]);

    useEffect(() => {
        loadPersons();
        setSearchPerson('');
    }, [activeRole, loadPersons]);

    // ── Assignations de la personne sélectionnée ──────────────────────────────
    const loadAssignments = useCallback(async () => {
        if (!selected) return;
        setSitesLoading(true);
        try { setAssignments(await TechnicianSiteService.getByTechnician(selected.id)); }
        catch (e) { console.error(e); }
        finally { setSitesLoading(false); }
    }, [selected]);

    useEffect(() => { if (showModal) loadAssignments(); }, [showModal, loadAssignments]);

    const openModal = (p: PersonResponse) => { setSelected(p); setShowModal(true); };
    const closeModal = () => { setShowModal(false); setSelected(null); loadPersons(); };

    const handleDelete = async () => {
        if (!confirmId) return;
        setDeleteLoading(true);
        try { await TechnicianSiteService.unassign(confirmId); await loadAssignments(); }
        catch (e) { console.error(e); }
        finally { setDeleteLoading(false); setConfirmId(null); }
    };

    const filteredPersons = persons.filter(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchPerson.toLowerCase())
    );

    const initials  = (p: PersonResponse) => `${p.firstName[0]}${p.lastName[0]}`.toUpperCase();
    const roleColor = activeRole === 'TECHNICIEN' ? 'primary' : 'success';
    const roleLabel = activeRole === 'TECHNICIEN' ? 'Technicien' : 'Logisticien';

    return (
        <MainLayout title="Périmètre géographique">
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div>
                    <h5 className="fw-bold mb-0">
                        <i className="bi bi-geo-alt-fill text-primary me-2" />Périmètre géographique
                    </h5>
                    <small className="text-muted">Hiérarchie Régions → Districts → Sites de santé</small>
                </div>
                <div className="ms-auto d-flex align-items-center gap-2 rounded-pill px-3 py-1 border border-warning bg-warning bg-opacity-10">
                    <i className="bi bi-shield-fill-check text-warning" style={{ fontSize: 12 }} />
                    <small className="text-warning fw-semibold">Admins — accès global toutes régions et districts</small>
                </div>
            </div>

            {/* ── Sélecteur rôle + recherche ── */}
            <div className="d-flex gap-2 mb-3 flex-wrap align-items-center">
                {(['TECHNICIEN','LOGISTICIEN'] as RoleKey[]).map(role => (
                    <button key={role}
                        className={`btn btn-sm rounded-pill px-3 ${activeRole === role ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setActiveRole(role)}>
                        <i className={`bi ${role === 'TECHNICIEN' ? 'bi-wrench-adjustable' : 'bi-truck'} me-1`} />
                        {role === 'TECHNICIEN' ? 'Techniciens' : 'Logisticiens'}
                    </button>
                ))}
                <div className="ms-auto" style={{ minWidth: 240 }}>
                    <input type="text" className="form-control form-control-sm rounded-pill"
                        placeholder="Rechercher un nom..." value={searchPerson}
                        onChange={e => setSearchPerson(e.target.value)} />
                </div>
            </div>

            {/* ── Grille de cartes ── */}
            {personsLoading ? (
                <div className="text-center py-5"><div className={`spinner-border text-${roleColor}`} /></div>
            ) : filteredPersons.length === 0 ? (
                <div className="text-center py-5 text-muted">
                    <i className="bi bi-person-bounding-box fs-1 opacity-25 mb-2 d-block" />
                    Aucun {roleLabel.toLowerCase()} trouvé
                </div>
            ) : (
                <div className="row g-3">
                    {filteredPersons.map(p => {
                        const c = assignCounts[p.id] || { regions: 0, districts: 0, sites: 0 };
                        const hasNone = c.regions === 0 && c.districts === 0 && c.sites === 0;
                        return (
                            <div key={p.id} className="col-sm-6 col-lg-4 col-xl-3">
                                <div className={`card h-100 rounded-4 ${hasNone ? 'border-dashed' : 'border-0 shadow-sm'}`}
                                    style={hasNone ? { border: '1px dashed #ced4da' } : undefined}>
                                    <div className="card-body p-3 d-flex flex-column">
                                        <div className="d-flex align-items-center gap-2 mb-3">
                                            <div className={`rounded-circle d-flex align-items-center justify-content-center text-white fw-semibold bg-${roleColor}`}
                                                style={{ width: 40, height: 40, minWidth: 40, fontSize: 13 }}>
                                                {initials(p)}
                                            </div>
                                            <div className="overflow-hidden">
                                                <div className="fw-semibold small text-truncate">{p.firstName} {p.lastName}</div>
                                                <div className="text-muted" style={{ fontSize: 11 }}>{roleLabel}</div>
                                            </div>
                                        </div>

                                        {hasNone ? (
                                            <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-center py-2">
                                                <i className="bi bi-exclamation-circle text-muted mb-1" style={{ fontSize: 20 }} />
                                                <small className="text-muted">Aucun périmètre assigné</small>
                                            </div>
                                        ) : (
                                            <div className="row g-1 mb-3 text-center">
                                                {[
                                                    { label: 'régions',   value: c.regions   },
                                                    { label: 'districts', value: c.districts },
                                                    { label: 'sites',     value: c.sites     },
                                                ].map(k => (
                                                    <div key={k.label} className="col-4">
                                                        <div className="bg-light rounded-3 py-1">
                                                            <div className="fw-semibold small">{k.value}</div>
                                                            <div className="text-muted" style={{ fontSize: 10 }}>{k.label}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <button className={`btn btn-sm btn-outline-${roleColor} w-100 mt-auto`}
                                            onClick={() => openModal(p)}>
                                            <i className="bi bi-map me-1" />Gérer le périmètre
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Modal de gestion du périmètre ── */}
            {selected && (
                <PerimetreModal
                    show={showModal}
                    onHide={closeModal}
                    person={selected}
                    roleLabel={roleLabel}
                    roleColor={roleColor}
                    assignments={assignments}
                    sitesLoading={sitesLoading}
                    canManage={canManage}
                    onRemove={id => setConfirmId(id)}
                    onRefresh={loadAssignments}
                />
            )}

            <ConfirmModal
                show={!!confirmId} title="Retirer du périmètre"
                message="Supprimer cette assignation géographique ?"
                onConfirm={handleDelete}
                onCancel={() => setConfirmId(null)}
                isLoading={deleteLoading} />
        </MainLayout>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Modal — détail + formulaire d'ajout (remplace l'ancien panneau latéral)
// ─────────────────────────────────────────────────────────────────────────────
interface TagItem { id: number; label: string; isExisting: boolean; parentLabel?: string; }

interface PerimetreModalProps {
    show:         boolean;
    onHide:       () => void;
    person:       PersonResponse;
    roleLabel:    string;
    roleColor:    string;
    assignments:  TechnicianSiteResponse[];
    sitesLoading: boolean;
    canManage:    boolean;
    onRemove:     (id: number) => void;
    onRefresh:    () => void;
}

const PerimetreModal: React.FC<PerimetreModalProps> = ({
    show, onHide, person, roleLabel, roleColor, assignments, sitesLoading, canManage, onRemove, onRefresh,
}) => {
    const [allRegions,   setAllRegions]   = useState<RegionResponse[]>([]);
    const [allDistricts, setAllDistricts] = useState<DistrictResponse[]>([]);
    const [allSites,     setAllSites]     = useState<HealthResponse[]>([]);

    const initTags = (type: 'region' | 'district' | 'site'): TagItem[] => {
        const tags: TagItem[] = [];
        assignments.forEach(a => {
            if (type === 'region'   && !a.districtId && !a.healthId && a.regionId)
                tags.push({ id: a.regionId,   label: a.regionName   ?? '', isExisting: true });
            if (type === 'district' && a.districtId  && !a.healthId)
                tags.push({ id: a.districtId, label: a.districtName ?? '', isExisting: true, parentLabel: a.regionName   ?? undefined });
            if (type === 'site'     && a.healthId)
                tags.push({ id: a.healthId,   label: a.healthName   ?? '', isExisting: true, parentLabel: a.districtName ?? undefined });
        });
        return tags.filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i);
    };

    const [regionTags,   setRegionTags]   = useState<TagItem[]>(() => initTags('region'));
    const [districtTags, setDistrictTags] = useState<TagItem[]>(() => initTags('district'));
    const [siteTags,     setSiteTags]     = useState<TagItem[]>(() => initTags('site'));

    useEffect(() => {
        setRegionTags(initTags('region'));
        setDistrictTags(initTags('district'));
        setSiteTags(initTags('site'));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assignments]);

    const [srR, setSrR] = useState('');
    const [srD, setSrD] = useState('');
    const [srS, setSrS] = useState('');
    const [openDd, setOpenDd] = useState<'R' | 'D' | 'S' | null>(null);

    const [saving, setSaving] = useState(false);
    const [error,  setError]  = useState<string | null>(null);

    useEffect(() => {
        if (show) RegionService.getAllList().then(setAllRegions).catch(console.error);
    }, [show]);

    useEffect(() => {
        const ids = regionTags.map(t => t.id);
        if (ids.length === 0) { setAllDistricts([]); return; }
        Promise.all(ids.map(rId => DistrictService.getAllList(rId)))
            .then(arrays => setAllDistricts(
                arrays.flat().filter((d, i, arr) => arr.findIndex(x => x.id === d.id) === i)
            )).catch(console.error);
    }, [regionTags]);

    useEffect(() => {
        const ids = districtTags.map(t => t.id);
        if (ids.length === 0) { setAllSites([]); return; }
        Promise.all(ids.map(dId => HealthService.getAll(0, 200, dId).then(p => p.content)))
            .then(arrays => setAllSites(
                arrays.flat().filter((s, i, arr) => arr.findIndex(x => x.id === s.id) === i)
            )).catch(console.error);
    }, [districtTags]);

    const addRegion = (r: RegionResponse) => {
        if (regionTags.some(t => t.id === r.id)) return;
        setRegionTags(prev => [...prev, { id: r.id, label: r.regionName, isExisting: false }]);
        setSrR(''); setOpenDd(null);
    };

    const addDistrict = (d: DistrictResponse) => {
        if (districtTags.some(t => t.id === d.id)) return;
        const parent = allRegions.find(r => r.regionName === d.regionDistrict);
        if (parent && !regionTags.some(t => t.id === parent.id))
            setRegionTags(prev => [...prev, { id: parent.id, label: parent.regionName, isExisting: false }]);
        setDistrictTags(prev => [...prev, { id: d.id, label: d.DistrictName, isExisting: false, parentLabel: d.regionDistrict }]);
        setSrD(''); setOpenDd(null);
    };

    const addSite = (s: HealthResponse) => {
        if (siteTags.some(t => t.id === s.id)) return;
        setSiteTags(prev => [...prev, { id: s.id, label: s.healthName, isExisting: false, parentLabel: s.districtName }]);
        setSrS(''); setOpenDd(null);
    };

    const removeTag = (setFn: React.Dispatch<React.SetStateAction<TagItem[]>>, id: number) =>
        setFn(prev => prev.filter(t => t.id !== id));

    const newRegions   = regionTags.filter(t => !t.isExisting);
    const newDistricts = districtTags.filter(t => !t.isExisting);
    const newSites     = siteTags.filter(t => !t.isExisting);
    const totalNew     = newRegions.length + newDistricts.length + newSites.length;

    const handleSubmit = async () => {
        if (totalNew === 0) { setError('Aucune nouvelle assignation à enregistrer.'); return; }
        setSaving(true); setError(null);
        try {
            const calls: Promise<any>[] = [];
            newRegions.forEach(t =>
                calls.push(TechnicianSiteService.assign({ personId: person.id, regionId: t.id, districtId: null, healthId: null } as any)));
            newDistricts.forEach(t => {
                const d   = allDistricts.find(x => x.id === t.id);
                const reg = allRegions.find(r => r.regionName === d?.regionDistrict);
                calls.push(TechnicianSiteService.assign({ personId: person.id, regionId: reg?.id ?? null, districtId: t.id, healthId: null } as any));
            });
            newSites.forEach(t => {
                const s   = allSites.find(x => x.id === t.id);
                const dis = allDistricts.find(d => d.DistrictName === s?.districtName);
                const reg = allRegions.find(r => r.regionName === dis?.regionDistrict);
                calls.push(TechnicianSiteService.assign({ personId: person.id, regionId: reg?.id ?? null, districtId: dis?.id ?? null, healthId: t.id } as any));
            });
            await Promise.all(calls);
            onRefresh();
        } catch (err: any) {
            setError(err?.response?.data?.message ?? "Erreur lors de l'assignation.");
        } finally { setSaving(false); }
    };

    const filtR = allRegions.filter(r => !regionTags.some(t => t.id === r.id) && r.regionName.toLowerCase().includes(srR.toLowerCase()));
    const filtD = allDistricts.filter(d => !districtTags.some(t => t.id === d.id) && d.DistrictName.toLowerCase().includes(srD.toLowerCase()));
    const filtS = allSites.filter(s => !siteTags.some(t => t.id === s.id) && s.healthName.toLowerCase().includes(srS.toLowerCase()));

    const initials = `${person.firstName[0]}${person.lastName[0]}`.toUpperCase();

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton className="border-0 pb-0">
                <div className="d-flex align-items-center gap-2">
                    <div className={`rounded-circle d-flex align-items-center justify-content-center text-white fw-semibold bg-${roleColor}`}
                        style={{ width: 36, height: 36, minWidth: 36, fontSize: 12 }}>
                        {initials}
                    </div>
                    <div>
                        <div className="fw-bold small">Périmètre — {person.firstName} {person.lastName}</div>
                        <div className={`text-${roleColor}`} style={{ fontSize: 11 }}>{roleLabel}</div>
                    </div>
                </div>
            </Modal.Header>
            <Modal.Body>
                {error && <div className="alert alert-danger py-2 small mb-3">{error}</div>}

                {sitesLoading ? (
                    <div className="text-center py-4"><div className={`spinner-border spinner-border-sm text-${roleColor}`} /></div>
                ) : (
                    <>
                        <FormTagSection
                            label="Régions du périmètre :"
                            icon="bi-globe2" color="primary"
                            tags={regionTags}
                            onRemove={id => removeTag(setRegionTags, id)}
                            searchVal={srR} onSearch={setSrR}
                            isOpen={openDd === 'R'}
                            onToggle={e => { e.stopPropagation(); setOpenDd(o => o === 'R' ? null : 'R'); }}
                            items={filtR}
                            getId={r => r.id} getLabel={r => r.regionName} getSub={() => null}
                            onAdd={addRegion}
                            placeholder="Rechercher une région..."
                            canManage={canManage}
                        />
                        <FormTagSection
                            label="Districts :"
                            icon="bi-building" color="info"
                            tags={districtTags}
                            onRemove={id => removeTag(setDistrictTags, id)}
                            searchVal={srD} onSearch={setSrD}
                            isOpen={openDd === 'D'}
                            onToggle={e => { e.stopPropagation(); setOpenDd(o => o === 'D' ? null : 'D'); }}
                            items={filtD}
                            getId={d => d.id} getLabel={d => d.DistrictName} getSub={d => d.regionDistrict}
                            onAdd={addDistrict}
                            placeholder="Rechercher un district..."
                            disabled={allDistricts.length === 0}
                            disabledHint="← Ajoutez d'abord une région"
                            canManage={canManage}
                        />
                        <FormTagSection
                            label="Sites de santé :"
                            icon="bi-hospital" color="success"
                            tags={siteTags}
                            onRemove={id => removeTag(setSiteTags, id)}
                            searchVal={srS} onSearch={setSrS}
                            isOpen={openDd === 'S'}
                            onToggle={e => { e.stopPropagation(); setOpenDd(o => o === 'S' ? null : 'S'); }}
                            items={filtS}
                            getId={s => s.id} getLabel={s => s.healthName} getSub={s => s.districtName}
                            onAdd={addSite}
                            placeholder="Rechercher un site..."
                            disabled={allSites.length === 0}
                            disabledHint="← Ajoutez d'abord un district"
                            canManage={canManage}
                        />

                        {canManage && (
                            <div>
                                <p className="fw-semibold small mb-2">Assignations existantes (retirer) :</p>
                                <div className="d-flex flex-wrap gap-2">
                                    {[...regionTags, ...districtTags, ...siteTags].filter(t => t.isExisting).length === 0 ? (
                                        <span className="text-muted small">Aucune assignation existante</span>
                                    ) : (
                                        assignments.map(a => (
                                            <span key={a.id} className="badge bg-light text-dark border d-inline-flex align-items-center gap-1 px-2 py-1">
                                                {a.healthName || a.districtName || a.regionName}
                                                <i className="bi bi-x-circle text-danger ms-1" style={{ cursor: 'pointer' }}
                                                    onClick={() => onRemove(a.id)} />
                                            </span>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Modal.Body>
            <Modal.Footer className="border-0">
                {totalNew > 0 && (
                    <span className="badge bg-primary px-3 py-2 me-auto">
                        <i className="bi bi-plus-circle me-1" />
                        {totalNew} nouvelle{totalNew > 1 ? 's' : ''} assignation{totalNew > 1 ? 's' : ''}
                    </span>
                )}
                <Button variant="light" onClick={onHide} disabled={saving}>Fermer</Button>
                <Button variant="primary" onClick={handleSubmit} disabled={saving || totalNew === 0}>
                    {saving
                        ? <><span className="spinner-border spinner-border-sm me-1" />Enregistrement...</>
                        : <><i className="bi bi-check2 me-1" />Enregistrer</>}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Section tags — inchangée dans son fonctionnement
// ─────────────────────────────────────────────────────────────────────────────
interface FormTagSectionProps<T> {
    label: string; icon: string; color: string;
    tags: TagItem[];
    onRemove: (id: number) => void;
    searchVal: string; onSearch: (v: string) => void;
    isOpen: boolean; onToggle: (e: React.MouseEvent) => void;
    items: T[];
    getId:    (item: T) => number;
    getLabel: (item: T) => string;
    getSub:   (item: T) => string | null;
    onAdd:    (item: T) => void;
    placeholder: string;
    disabled?:    boolean;
    disabledHint?: string;
    canManage: boolean;
}

function FormTagSection<T>({
    label, icon, color, tags, onRemove, searchVal, onSearch,
    isOpen, onToggle, items, getId, getLabel, getSub, onAdd,
    placeholder, disabled, disabledHint, canManage,
}: FormTagSectionProps<T>) {
    return (
        <div className="mb-3">
            <label className="form-label fw-semibold small mb-1">
                <i className={`bi ${icon} text-${color} me-1`} />{label}
            </label>
            <div className="border rounded p-2 bg-white" style={{ minHeight: 44, borderColor: '#ced4da' }}>
                <div className="d-flex flex-wrap gap-1 align-items-center">
                    {tags.filter(t => t.isExisting).map(t => (
                        <span key={`ex-${t.id}`}
                            className="d-inline-flex align-items-center gap-1 border rounded px-2 py-1 small"
                            style={{ background: '#f8f9fa', fontSize: 12, color: '#495057' }}>
                            <i className={`bi bi-check-circle-fill text-${color}`} style={{ fontSize: 10 }} />
                            {t.label}
                            {t.parentLabel && <span className="text-muted ms-1" style={{ fontSize: 10 }}>({t.parentLabel})</span>}
                        </span>
                    ))}
                    {tags.filter(t => !t.isExisting).map(t => (
                        <span key={`new-${t.id}`}
                            className={`d-inline-flex align-items-center gap-1 border rounded px-2 py-1 small bg-${color} bg-opacity-10 border-${color} border-opacity-25`}
                            style={{ fontSize: 12, color: `var(--bs-${color})` }}>
                            {t.label}
                            {t.parentLabel && <span className="opacity-75 ms-1" style={{ fontSize: 10 }}>({t.parentLabel})</span>}
                            <button className={`btn btn-link p-0 ms-1 text-${color}`}
                                style={{ fontSize: 12, lineHeight: 1 }}
                                onClick={() => onRemove(t.id)}>×</button>
                        </span>
                    ))}
                    {canManage && !disabled && (
                        <div className="position-relative d-inline-block">
                            <button className="btn btn-link btn-sm p-0 text-muted d-flex align-items-center gap-1"
                                style={{ fontSize: 12 }} onClick={onToggle}>
                                <span className="rounded-circle border d-flex align-items-center justify-content-center"
                                    style={{ width: 18, height: 18, fontSize: 14, lineHeight: 1 }}>+</span>
                                Ajouter
                            </button>
                            {isOpen && (
                                <div className="position-absolute bg-white border rounded shadow p-2"
                                    style={{ top: '110%', left: 0, minWidth: 260, maxHeight: 220,
                                        overflowY: 'auto', zIndex: 1060 }}
                                    onClick={e => e.stopPropagation()}>
                                    <input type="text" className="form-control form-control-sm mb-1"
                                        placeholder={placeholder} value={searchVal}
                                        onChange={e => onSearch(e.target.value)} autoFocus />
                                    {items.length === 0 ? (
                                        <p className="text-muted small text-center py-2 mb-0">Aucun résultat</p>
                                    ) : items.slice(0, 60).map(item => {
                                        const id  = getId(item);
                                        const lbl = getLabel(item);
                                        const sub = getSub(item);
                                        return (
                                            <div key={id}
                                                className="d-flex align-items-center gap-2 px-2 py-1 rounded small"
                                                style={{ cursor: 'pointer' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = '#f0f9ff')}
                                                onMouseLeave={e => (e.currentTarget.style.background = '')}
                                                onClick={() => onAdd(item)}>
                                                <i className={`bi ${icon} text-${color}`} style={{ fontSize: 11 }} />
                                                <div>
                                                    <div>{lbl}</div>
                                                    {sub && <div className="text-muted" style={{ fontSize: 10 }}>{sub}</div>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                    {tags.length === 0 && disabled && (
                        <small className="text-muted" style={{ fontSize: 11 }}>{disabledHint}</small>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TechnicianSitePage;