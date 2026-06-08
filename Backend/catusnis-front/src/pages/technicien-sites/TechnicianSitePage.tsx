import React, { useState, useEffect, useCallback } from 'react';
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
type PanelMode = 'list' | 'edit';

// ─────────────────────────────────────────────────────────────────────────────
// Construction de l'arbre hiérarchique (pour l'affichage liste)
// ─────────────────────────────────────────────────────────────────────────────
interface TreeRow {
    id:           number;
    niveau:       'REGION' | 'DISTRICT' | 'SITE';
    regionName:   string | null;
    districtName: string | null;
    healthName:   string | null;
    createdAt:    string | undefined;
    assignment:   TechnicianSiteResponse;
}

function buildRows(assignments: TechnicianSiteResponse[]): TreeRow[] {
    // Tri : régions d'abord, puis districts, puis sites
    const sorted = [...assignments].sort((a, b) => {
        const lvl = (x: TechnicianSiteResponse) => x.healthId ? 3 : x.districtId ? 2 : 1;
        if (lvl(a) !== lvl(b)) return lvl(a) - lvl(b);
        return (a.regionName ?? '').localeCompare(b.regionName ?? '');
    });
    return sorted.map(a => ({
        id:           a.id,
        niveau:       a.healthId ? 'SITE' : a.districtId ? 'DISTRICT' : 'REGION',
        regionName:   a.regionName,
        districtName: a.districtName,
        healthName:   a.healthName,
        createdAt:    a.createdAt,
        assignment:   a,
    }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────────────────────────────────────
const TechnicianSitePage: React.FC = () => {
    const { hasRole } = useAuth();
    const canManage = hasRole('ADMIN') || hasRole('SUPER_ADMIN');

    const [activeRole,     setActiveRole]     = useState<RoleKey>('TECHNICIEN');
    const [persons,        setPersons]        = useState<PersonResponse[]>([]);
    const [selected,       setSelected]       = useState<PersonResponse | null>(null);
    const [assignments,    setAssignments]    = useState<TechnicianSiteResponse[]>([]);
    const [personsLoading, setPersonsLoading] = useState(false);
    const [sitesLoading,   setSitesLoading]   = useState(false);
    const [searchPerson,   setSearchPerson]   = useState('');
    const [panelMode,      setPanelMode]      = useState<PanelMode>('list');
    const [confirmId,      setConfirmId]      = useState<number | null>(null);
    const [deleteLoading,  setDeleteLoading]  = useState(false);

    // ── Personnes ─────────────────────────────────────────────────────────────
    const loadPersons = useCallback(async () => {
        setPersonsLoading(true);
        try {
            const all = await PersonService.getAllList();
            setPersons(all.filter(p => ((p as any).role ?? '').toUpperCase() === activeRole));
        } catch (e) { console.error(e); }
        finally { setPersonsLoading(false); }
    }, [activeRole]);

    useEffect(() => {
        loadPersons();
        setSelected(null);
        setAssignments([]);
        setSearchPerson('');
        setPanelMode('list');
    }, [activeRole, loadPersons]);

    // ── Assignations ──────────────────────────────────────────────────────────
    const loadAssignments = useCallback(async () => {
        if (!selected) return;
        setSitesLoading(true);
        try { setAssignments(await TechnicianSiteService.getByTechnician(selected.id)); }
        catch (e) { console.error(e); }
        finally { setSitesLoading(false); }
    }, [selected]);

    useEffect(() => { loadAssignments(); }, [loadAssignments]);

    const handleDelete = async () => {
        if (!confirmId) return;
        setDeleteLoading(true);
        try { await TechnicianSiteService.unassign(confirmId); await loadAssignments(); }
        catch (e) { console.error(e); }
        finally { setDeleteLoading(false); setConfirmId(null); }
    };

    const handleSelectPerson = (p: PersonResponse) => {
        setSelected(p);
        setPanelMode('list');
    };

    const filteredPersons = persons.filter(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchPerson.toLowerCase())
    );

    const initials  = (p: PersonResponse) => `${p.firstName[0]}${p.lastName[0]}`.toUpperCase();
    const roleColor = activeRole === 'TECHNICIEN' ? 'primary' : 'success';
    const roleIcon  = activeRole === 'TECHNICIEN' ? 'bi-wrench-adjustable' : 'bi-truck';
    const roleLabel = activeRole === 'TECHNICIEN' ? 'Technicien' : 'Logisticien';

    const totalRegions   = new Set(assignments.filter(a => a.regionId).map(a => a.regionId)).size;
    const totalDistricts = new Set(assignments.filter(a => a.districtId).map(a => a.districtId)).size;
    const totalSites     = new Set(assignments.filter(a => a.healthId).map(a => a.healthId)).size;
    const rows           = buildRows(assignments);

    return (
        <MainLayout title="Périmètre géographique">

            {/* ── En-tête ── */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h5 className="fw-bold mb-0">
                        <i className="bi bi-geo-alt-fill text-primary me-2" />Périmètre géographique
                    </h5>
                    <small className="text-muted">Hiérarchie Régions → Districts → Sites de santé</small>
                </div>
            </div>

            {/* ── Sélecteur rôle ── */}
            <div className="d-flex gap-2 mb-3 flex-wrap">
                {(['TECHNICIEN','LOGISTICIEN'] as RoleKey[]).map(role => (
                    <button key={role}
                        className={`btn btn-sm rounded-pill px-3 ${activeRole === role ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setActiveRole(role)}>
                        <i className={`bi ${role === 'TECHNICIEN' ? 'bi-wrench-adjustable' : 'bi-truck'} me-1`} />
                        {role === 'TECHNICIEN' ? 'Techniciens' : 'Logisticiens'}
                    </button>
                ))}
                <div className="ms-auto d-flex align-items-center gap-2 rounded-pill px-3 py-1 border border-warning bg-warning bg-opacity-10">
                    <i className="bi bi-shield-fill-check text-warning" style={{ fontSize: 12 }} />
                    <small className="text-warning fw-semibold">Admins — accès global toutes régions et districts</small>
                </div>
            </div>

            <div className="row g-3">

                {/* ── Panneau gauche — liste personnes ── */}
                <div className="col-md-4 col-lg-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white py-2 px-3">
                            <div className="d-flex align-items-center gap-2 mb-2">
                                <i className={`bi ${roleIcon} text-${roleColor}`} />
                                <span className="fw-semibold small">
                                    {roleLabel}s
                                    <span className="text-muted fw-normal ms-1">({filteredPersons.length})</span>
                                </span>
                            </div>
                            <input type="text" className="form-control form-control-sm"
                                placeholder="Rechercher..." value={searchPerson}
                                onChange={e => setSearchPerson(e.target.value)} />
                        </div>
                        <div style={{ overflowY: 'auto', maxHeight: 540 }}>
                            {personsLoading ? (
                                <div className="text-center py-4">
                                    <div className={`spinner-border spinner-border-sm text-${roleColor}`} />
                                </div>
                            ) : filteredPersons.length === 0 ? (
                                <p className="text-muted small text-center py-4 mb-0">Aucun {roleLabel.toLowerCase()} trouvé</p>
                            ) : filteredPersons.map(p => {
                                const active = selected?.id === p.id;
                                return (
                                    <div key={p.id}
                                        className={`d-flex align-items-center gap-2 px-3 py-2 border-bottom ${active ? `bg-${roleColor} bg-opacity-10` : ''}`}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleSelectPerson(p)}>
                                        <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-semibold flex-shrink-0"
                                            style={{ width: 34, height: 34, fontSize: 12,
                                                background: active ? `var(--bs-${roleColor})` : '#adb5bd' }}>
                                            {initials(p)}
                                        </div>
                                        <div className="overflow-hidden flex-grow-1">
                                            <div className="small fw-semibold text-truncate">{p.firstName} {p.lastName}</div>
                                            <div className="text-muted" style={{ fontSize: 11 }}>{(p as any).postName ?? roleLabel}</div>
                                        </div>
                                        {active && <i className="bi bi-chevron-right text-muted" style={{ fontSize: 11 }} />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── Panneau droit ── */}
                <div className="col-md-8 col-lg-9">
                    {!selected ? (
                        <div className="card border-0 shadow-sm text-center py-5 text-muted">
                            <i className="bi bi-person-bounding-box fs-1 opacity-25 mb-2 d-block" />
                            <p className="fw-semibold mb-0">Sélectionnez un {roleLabel.toLowerCase()}</p>
                            <small>Son périmètre géographique s'affichera ici</small>
                        </div>
                    ) : panelMode === 'list' ? (
                        /* ══ MODE LISTE ══════════════════════════════════════════════════════ */
                        <div>
                            {/* Fiche personne + KPIs */}
                            <div className="card border-0 shadow-sm mb-3">
                                <div className="card-body py-3 px-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                                            style={{ width: 44, height: 44, background: `var(--bs-${roleColor})`, fontSize: 16 }}>
                                            {initials(selected)}
                                        </div>
                                        <div>
                                            <div className="fw-bold">{selected.firstName} {selected.lastName}</div>
                                            <small className="text-muted">{roleLabel} · {(selected as any).postName ?? ''}</small>
                                        </div>
                                    </div>
                                    {/* KPIs */}
                                    <div className="d-flex gap-2">
                                        {[
                                            { label: 'Régions',   count: totalRegions,   color: 'primary', icon: 'bi-globe2'   },
                                            { label: 'Districts', count: totalDistricts, color: 'info',    icon: 'bi-building' },
                                            { label: 'Sites',     count: totalSites,     color: 'success', icon: 'bi-hospital' },
                                        ].map(k => (
                                            <div key={k.label}
                                                className={`text-center px-3 py-2 rounded-3 bg-${k.color} bg-opacity-10 border border-${k.color} border-opacity-25`}
                                                style={{ minWidth: 68 }}>
                                                <div className={`fw-bold text-${k.color}`} style={{ fontSize: 18 }}>{k.count}</div>
                                                <div className="text-muted" style={{ fontSize: 10 }}>
                                                    <i className={`bi ${k.icon} me-1`} />{k.label}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Bouton Assigner */}
                                    {canManage && (
                                        <button className="btn btn-primary btn-sm px-3"
                                            onClick={() => setPanelMode('edit')}>
                                            <i className="bi bi-plus-circle me-1" />Assigner / Modifier
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Tableau des assignations */}
                            <div className="card border-0 shadow-sm">
                                {sitesLoading ? (
                                    <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
                                ) : assignments.length === 0 ? (
                                    <div className="text-center py-5 text-muted">
                                        <i className="bi bi-map fs-2 d-block mb-2 opacity-25" />
                                        <p className="fw-semibold mb-1">Aucun périmètre assigné</p>
                                        <small>Cliquez sur "Assigner / Modifier" pour commencer</small>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0" style={{ fontSize: 13 }}>
                                            <thead className="table-light">
                                                <tr>
                                                    <th className="ps-3 text-muted fw-semibold" style={{ width: 40 }}>N°</th>
                                                    <th className="fw-semibold" style={{ width: 100 }}>Niveau</th>
                                                    <th className="fw-semibold">Région</th>
                                                    <th className="fw-semibold">District</th>
                                                    <th className="fw-semibold">Site de santé</th>
                                                    <th className="fw-semibold text-muted" style={{ width: 120 }}>
                                                        <i className="bi bi-clock me-1" />Assigné le
                                                    </th>
                                                    {canManage && <th className="text-end pe-3 fw-semibold" style={{ width: 70 }}>Retirer</th>}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rows.map((row, i) => {
                                                    const nColors = { REGION: 'primary', DISTRICT: 'info', SITE: 'success' };
                                                    const nIcons  = { REGION: 'bi-globe2', DISTRICT: 'bi-building', SITE: 'bi-hospital-fill' };
                                                    const nLabels = { REGION: 'Région', DISTRICT: 'District', SITE: 'Site' };
                                                    const nc = nColors[row.niveau]; const ni = nIcons[row.niveau]; const nl = nLabels[row.niveau];
                                                    return (
                                                        <tr key={row.id}>
                                                            <td className="ps-3 text-muted small">{i + 1}</td>
                                                            <td>
                                                                <span className={`badge bg-${nc} bg-opacity-15 text-${nc} d-inline-flex align-items-center gap-1`}>
                                                                    <i className={`bi ${ni}`} style={{ fontSize: 10 }} />{nl}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {row.regionName
                                                                    ? <span className="badge bg-primary bg-opacity-10 text-primary">{row.regionName}</span>
                                                                    : <span className="text-muted">—</span>}
                                                            </td>
                                                            <td>
                                                                {row.districtName
                                                                    ? <span className="badge bg-info bg-opacity-10 text-info">{row.districtName}</span>
                                                                    : <span className="text-muted">—</span>}
                                                            </td>
                                                            <td>
                                                                {row.healthName
                                                                    ? <span className="fw-semibold small text-success">{row.healthName}</span>
                                                                    : <span className="text-muted">—</span>}
                                                            </td>
                                                            <td>
                                                                <span className="text-muted small">{row.createdAt ?? '—'}</span>
                                                            </td>
                                                            {canManage && (
                                                                <td className="text-end pe-3">
                                                                    <button
                                                                        className="btn btn-sm btn-outline-danger py-0 px-2"
                                                                        style={{ fontSize: 11 }}
                                                                        onClick={() => setConfirmId(row.id)}
                                                                        title="Retirer cette assignation">
                                                                        <i className="bi bi-trash" />
                                                                    </button>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* ══ MODE ÉDITION ════════════════════════════════════════════════════ */
                        <PerimetreForm
                            personId={selected.id}
                            personName={`${selected.firstName} ${selected.lastName}`}
                            roleLabel={roleLabel}
                            roleColor={roleColor}
                            existingAssignments={assignments}
                            onCancel={() => setPanelMode('list')}
                            onSuccess={() => { setPanelMode('list'); loadAssignments(); }}
                        />
                    )}
                </div>
            </div>

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
// Formulaire inline d'assignation (style images 1 & 3)
// ─────────────────────────────────────────────────────────────────────────────
interface TagItem { id: number; label: string; isExisting: boolean; parentLabel?: string; }

interface PerimetreFormProps {
    personId:            number;
    personName:          string;
    roleLabel:           string;
    roleColor:           string;
    existingAssignments: TechnicianSiteResponse[];
    onCancel:            () => void;
    onSuccess:           () => void;
}

const PerimetreForm: React.FC<PerimetreFormProps> = ({
    personId, personName, roleLabel, roleColor, existingAssignments, onCancel, onSuccess,
}) => {
    const [allRegions,   setAllRegions]   = useState<RegionResponse[]>([]);
    const [allDistricts, setAllDistricts] = useState<DistrictResponse[]>([]);
    const [allSites,     setAllSites]     = useState<HealthResponse[]>([]);

    // ── Init des tags depuis les existants — calculé une seule fois ──────────
    // On utilise une fonction d'initialisation de useState pour éviter l'useEffect
    const initTags = (assignments: TechnicianSiteResponse[], type: 'region' | 'district' | 'site'): TagItem[] => {
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

    const [regionTags,   setRegionTags]   = useState<TagItem[]>(() => initTags(existingAssignments, 'region'));
    const [districtTags, setDistrictTags] = useState<TagItem[]>(() => initTags(existingAssignments, 'district'));
    const [siteTags,     setSiteTags]     = useState<TagItem[]>(() => initTags(existingAssignments, 'site'));

    const [srR, setSrR] = useState('');
    const [srD, setSrD] = useState('');
    const [srS, setSrS] = useState('');
    const [openDd, setOpenDd] = useState<'R' | 'D' | 'S' | null>(null);

    const [saving, setSaving] = useState(false);
    const [error,  setError]  = useState<string | null>(null);

    // ── Charger toutes les régions au montage (pour la cascade add) ───────────
    useEffect(() => {
        RegionService.getAllList().then(setAllRegions).catch(console.error);
    }, []);

    // ── Cascade districts ─────────────────────────────────────────────────────
    useEffect(() => {
        const ids = regionTags.map(t => t.id);
        if (ids.length === 0) { setAllDistricts([]); return; }
        Promise.all(ids.map(rId => DistrictService.getAllList(rId)))
            .then(arrays => setAllDistricts(
                arrays.flat().filter((d, i, arr) => arr.findIndex(x => x.id === d.id) === i)
            )).catch(console.error);
    }, [regionTags]);

    // ── Cascade sites ─────────────────────────────────────────────────────────
    useEffect(() => {
        const ids = districtTags.map(t => t.id);
        if (ids.length === 0) { setAllSites([]); return; }
        Promise.all(ids.map(dId => HealthService.getAll(0, 200, dId).then(p => p.content)))
            .then(arrays => setAllSites(
                arrays.flat().filter((s, i, arr) => arr.findIndex(x => x.id === s.id) === i)
            )).catch(console.error);
    }, [districtTags]);

    // ── Ajout de tags ─────────────────────────────────────────────────────────
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

    // ── Soumettre ─────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (totalNew === 0) { setError('Aucune nouvelle assignation à enregistrer.'); return; }
        setSaving(true); setError(null);
        try {
            const calls: Promise<any>[] = [];
            newRegions.forEach(t =>
                calls.push(TechnicianSiteService.assign({ personId, regionId: t.id, districtId: null, healthId: null } as any)));
            newDistricts.forEach(t => {
                const d   = allDistricts.find(x => x.id === t.id);
                const reg = allRegions.find(r => r.regionName === d?.regionDistrict);
                calls.push(TechnicianSiteService.assign({ personId, regionId: reg?.id ?? null, districtId: t.id, healthId: null } as any));
            });
            newSites.forEach(t => {
                const s   = allSites.find(x => x.id === t.id);
                const dis = allDistricts.find(d => d.DistrictName === s?.districtName);
                const reg = allRegions.find(r => r.regionName === dis?.regionDistrict);
                calls.push(TechnicianSiteService.assign({ personId, regionId: reg?.id ?? null, districtId: dis?.id ?? null, healthId: t.id } as any));
            });
            await Promise.all(calls);
            onSuccess();
        } catch (err: any) {
            setError(err?.response?.data?.message ?? "Erreur lors de l'assignation.");
        } finally { setSaving(false); }
    };

    const filtR = allRegions.filter(r => !regionTags.some(t => t.id === r.id) && r.regionName.toLowerCase().includes(srR.toLowerCase()));
    const filtD = allDistricts.filter(d => !districtTags.some(t => t.id === d.id) && d.DistrictName.toLowerCase().includes(srD.toLowerCase()));
    const filtS = allSites.filter(s => !siteTags.some(t => t.id === s.id) && s.healthName.toLowerCase().includes(srS.toLowerCase()));

    return (
        <div className="card border-0 shadow-sm" onClick={() => setOpenDd(null)}>
            {/* ── En-tête formulaire ── */}
            <div className="card-header bg-white py-3 px-4 d-flex align-items-center justify-content-between border-bottom">
                <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-pencil-square text-primary" />
                    <div>
                        <span className="fw-bold">Modifier le périmètre</span>
                        <small className="text-muted ms-2">
                            — {personName} · <span className={`text-${roleColor}`}>{roleLabel}</span>
                        </small>
                    </div>
                </div>
                <button className="btn btn-sm btn-outline-secondary" onClick={onCancel}>
                    <i className="bi bi-arrow-left me-1" />Retour à la liste
                </button>
            </div>

            <div className="card-body px-4 py-4" onClick={e => e.stopPropagation()}>
                {error && <div className="alert alert-danger py-2 small mb-3">{error}</div>}

                {/* ── Régions ── */}
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
                />

                {/* ── Districts ── */}
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
                />

                {/* ── Sites de santé ── */}
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
                />
            </div>

            {/* ── Pied de formulaire ── */}
            <div className="card-footer bg-white border-top d-flex justify-content-between align-items-center px-4 py-3">
                <div>
                    {totalNew > 0 && (
                        <span className="badge bg-primary px-3 py-2 fs-6">
                            <i className="bi bi-plus-circle me-1" />
                            {totalNew} nouvelle{totalNew > 1 ? 's' : ''} assignation{totalNew > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-secondary btn-sm px-4" onClick={onCancel} disabled={saving}>
                        Annuler
                    </button>
                    <button className="btn btn-primary btn-sm px-4" onClick={handleSubmit}
                        disabled={saving || totalNew === 0}>
                        {saving
                            ? <><span className="spinner-border spinner-border-sm me-1" />Enregistrement...</>
                            : <><i className="bi bi-check2 me-1" />Enregistrer</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Section tags (style "Sites du circuit" — images 1 & 3)
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
}

function FormTagSection<T>({
    label, icon, color, tags, onRemove, searchVal, onSearch,
    isOpen, onToggle, items, getId, getLabel, getSub, onAdd,
    placeholder, disabled, disabledHint,
}: FormTagSectionProps<T>) {
    return (
        <div className="mb-4">
            <label className="form-label fw-semibold small mb-1">
                <i className={`bi ${icon} text-${color} me-1`} />{label}
            </label>

            {/* Zone tags — style bordé comme image 1 & 3 */}
            <div className="border rounded p-2 bg-white" style={{ minHeight: 48, borderColor: '#ced4da' }}>
                <div className="d-flex flex-wrap gap-1 align-items-center">

                    {/* Tags existants (non supprimables depuis ce formulaire) */}
                    {tags.filter(t => t.isExisting).map(t => (
                        <span key={`ex-${t.id}`}
                            className="d-inline-flex align-items-center gap-1 border rounded px-2 py-1 small"
                            style={{ background: '#f8f9fa', fontSize: 12, color: '#495057' }}>
                            <i className={`bi bi-check-circle-fill text-${color}`} style={{ fontSize: 10 }} />
                            {t.label}
                            {t.parentLabel && <span className="text-muted ms-1" style={{ fontSize: 10 }}>({t.parentLabel})</span>}
                        </span>
                    ))}

                    {/* Nouveaux tags (supprimables) */}
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

                    {/* Bouton + Ajouter */}
                    {!disabled && (
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
                                        overflowY: 'auto', zIndex: 1050 }}
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