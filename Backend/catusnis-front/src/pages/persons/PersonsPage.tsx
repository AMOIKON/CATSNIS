import React, { useState, useEffect, useCallback } from 'react';
import MainLayout          from '../../components/common/MainLayout';
import ConfirmModal        from '../../components/common/ConfirmModal';
import PrintButton         from '../../components/common/PrintButton';
import PersonFormModal     from './PersonFormModal';
import PersonUpdateModal   from './PersonUpdateModal';
import PersonService, { PersonResponse, ROLE_LABELS, ROLE_BADGE_CLASSES } from '../../services/personService';
import useAuth             from '../../hooks/useAuth';
import notify from '../../services/notify';

const PersonsPage: React.FC = () => {
    const { person: currentUser } = useAuth();
    const role           = currentUser?.role;
    const isSuperAdmin   = role === 'SUPER_ADMIN';
    const isAdminOrAbove = isSuperAdmin || role === 'ADMIN';
    const canCreateAccount = isSuperAdmin;
    const canEdit          = isAdminOrAbove;
    const canDelete        = isSuperAdmin;
    const showActions      = canEdit || canDelete;

    const [persons,        setPersons]        = useState<PersonResponse[]>([]);
    const [totalPages,     setTotalPages]     = useState(0);
    const [totalElements,  setTotalElements]  = useState(0);
    const [page,           setPage]           = useState(0);
    const [keyword,        setKeyword]        = useState('');
    const [filterRole,     setFilterRole]     = useState('');
    const [isLoading,      setIsLoading]      = useState(false);
    const [showForm,       setShowForm]       = useState(false);
    const [showUpdate,     setShowUpdate]     = useState(false);
    const [showConfirm,    setShowConfirm]    = useState(false);
    const [selectedId,     setSelectedId]     = useState<number | null>(null);
    const [selectedPerson, setSelectedPerson] = useState<PersonResponse | null>(null);
    const [deleteLoading,  setDeleteLoading]  = useState(false);
    // ✅ État visibilité mot de passe par personne (SUPER_ADMIN uniquement)
    const [visiblePwd, setVisiblePwd] = useState<Record<number, boolean>>({});

    const togglePwd = (id: number) =>
        setVisiblePwd(prev => ({ ...prev, [id]: !prev[id] }));

    const loadPersons = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await PersonService.getAll(
                page, 10, undefined, undefined, keyword || undefined
            );
            setPersons(data.content);
            setTotalPages(data.page.totalPages);
            setTotalElements(data.page.totalElements);
            // Réinitialiser la visibilité à chaque chargement
            setVisiblePwd({});
        } catch (err) { console.error(err); }
        finally { setIsLoading(false); }
    }, [page, keyword]);

    useEffect(() => { loadPersons(); }, [loadPersons]);

const handleDeleteConfirm = async () => {
    if (!selectedId) return;
    setDeleteLoading(true);
    try {
        await PersonService.delete(selectedId);
        notify.success('Compte supprimé avec succès');
        loadPersons();
    } catch (err) {
        notify.apiError(err, 'Erreur lors de la suppression du compte');
    }
    finally { setDeleteLoading(false); setShowConfirm(false); setSelectedId(null); }
};

    const personsFiltres = filterRole
        ? persons.filter(p => p.role === filterRole)
        : persons;

    const ROLE_FILTER_OPTIONS = [
        { value: '',            label: 'Tous les rôles' },
        { value: 'SUPER_ADMIN', label: 'Super Admin'    },
        { value: 'ADMIN',       label: 'Administrateur' },
        { value: 'TECHNICIEN',  label: 'Technicien'     },
        { value: 'LOGISTICIEN', label: 'Logisticien'    },
        { value: 'USER',        label: 'Utilisateur'    },
    ];

    return (
        <MainLayout title="Gestion des accès">

            {/* ── Header ── */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 className="fw-bold mb-0">
                        <i className="bi bi-shield-shaded text-danger me-2" />
                        Gestion des accès
                    </h5>
                    <small className="text-muted">{totalElements} compte(s) enregistré(s)</small>
                </div>
                <div className="d-flex gap-2 align-items-center">
                    <PrintButton tableId="persons-table" title="Gestion des accès" />
                    {canCreateAccount && (
                        <button className="btn btn-primary btn-sm d-flex align-items-center gap-2 rounded-3"
                            onClick={() => setShowForm(true)}>
                            <i className="bi bi-person-plus-fill" />Créer un compte
                        </button>
                    )}
                </div>
            </div>

            {/* ── Stats par rôle ── */}
            <div className="row g-3 mb-4">
                {[
                    { role:'SUPER_ADMIN', label:'Super Admin',    color:'danger',    icon:'bi-shield-fill-exclamation' },
                    { role:'ADMIN',       label:'Administrateur', color:'primary',   icon:'bi-person-fill-gear'        },
                    { role:'TECHNICIEN',  label:'Technicien',     color:'warning',   icon:'bi-tools'                   },
                    { role:'LOGISTICIEN', label:'Logisticien',    color:'success',   icon:'bi-car-front-fill'          },
                    { role:'USER',        label:'Utilisateur',    color:'secondary', icon:'bi-person-fill'             },
                ].map(s => {
                    const count    = persons.filter(p => p.role === s.role).length;
                    const isActive = filterRole === s.role;
                    return (
                        <div key={s.role} className="col-6 col-md">
                            <div className={`card rounded-4 h-100 ${isActive
                                ? `bg-${s.color} shadow` : 'border-0 shadow-sm'}`}
                                style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                                onClick={() => setFilterRole(isActive ? '' : s.role)}>
                                <div className="card-body p-2 d-flex align-items-center gap-2">
                                    <div className={`rounded-3 d-flex align-items-center justify-content-center
                                        ${isActive ? 'bg-white bg-opacity-25' : `bg-${s.color} bg-opacity-10`}`}
                                        style={{ width:'36px', height:'36px', minWidth:'36px' }}>
                                        <i className={`bi ${s.icon} small
                                            ${isActive ? 'text-white' : `text-${s.color}`}`} />
                                    </div>
                                    <div className="flex-grow-1">
                                        <p className="mb-0" style={{ fontSize:'11px',
                                            color: isActive ? 'rgba(255,255,255,0.8)' : '#6c757d' }}>
                                            {s.label}
                                        </p>
                                        <span className={`fw-bold ${isActive ? 'text-white' : `text-${s.color}`}`}>
                                            {count}
                                        </span>
                                    </div>
                                    {isActive && <i className="bi bi-check-circle-fill text-white small" />}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Recherche + filtre ── */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-body p-3">
                    <div className="d-flex gap-3 align-items-center">
                        <div className="input-group flex-grow-1">
                            <span className="input-group-text bg-white border-end-0">
                                <i className="bi bi-search text-muted" />
                            </span>
                            <input type="text" className="form-control border-start-0"
                                placeholder="Rechercher par nom, prénom ou email..."
                                value={keyword}
                                onChange={e => { setKeyword(e.target.value); setPage(0); }} />
                        </div>
                        <select className="form-select w-auto"
                            value={filterRole}
                            onChange={e => setFilterRole(e.target.value)}>
                            {ROLE_FILTER_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* ── Tableau ── */}
            <div id="persons-table" className="card border-0 shadow-sm rounded-4">
                <div className="card-body p-0">
                    {isLoading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" />
                        </div>
                    ) : personsFiltres.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <i className="bi bi-people fs-1 d-block mb-2" />
                            Aucun compte trouvé
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>#</th>
                                        <th>Nom complet</th>
                                        <th>Email</th>
                                        <th>Contact</th>
                                        <th>Rôle</th>
                                        <th>Poste</th>
                                        <th>Unité</th>
                                        <th>Partenaire</th>
                                        {/* ✅ Colonne mot de passe — SUPER_ADMIN uniquement */}
                                        {isSuperAdmin && (
                                            <th className="no-print">
                                                <i className="bi bi-key-fill text-danger me-1" />
                                                Mot de passe
                                            </th>
                                        )}
                                        {showActions && (
                                            <th className="text-end no-print">Actions</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {personsFiltres.map((p, i) => (
                                        <tr key={p.id}>
                                            <td className="text-muted small">{page * 10 + i + 1}</td>

                                            {/* Nom complet */}
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="rounded-circle bg-primary bg-opacity-10
                                                        d-flex align-items-center justify-content-center"
                                                        style={{ width:'35px', height:'35px', minWidth:'35px' }}>
                                                        <span className="text-primary fw-bold small">
                                                            {p.firstName.charAt(0)}{p.lastName.charAt(0)}
                                                        </span>
                                                    </div>
                                                    <p className="mb-0 fw-semibold small">
                                                        {p.firstName} {p.lastName}
                                                    </p>
                                                </div>
                                            </td>

                                            <td className="text-muted small">{p.email}</td>
                                            <td className="text-muted small">{p.contact}</td>

                                            <td>
                                                <span className={`badge ${ROLE_BADGE_CLASSES[p.role]}`}>
                                                    {ROLE_LABELS[p.role]}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="badge bg-primary bg-opacity-10 text-primary">
                                                    {p.postName}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="badge bg-success bg-opacity-10 text-success">
                                                    {p.unitsName}
                                                </span>
                                            </td>
                                            <td>
                                                {p.partnerName
                                                    ? <span className="badge bg-warning bg-opacity-10 text-warning">
                                                        {p.partnerName}
                                                      </span>
                                                    : <span className="text-muted small">—</span>
                                                }
                                            </td>

                                            {/* ✅ Mot de passe — SUPER_ADMIN uniquement */}
                                            {isSuperAdmin && (
                                                <td className="no-print">
                                                    {p.password ? (
                                                        <div className="d-flex align-items-center gap-2">
                                                            <code className="small text-muted"
                                                                style={{
                                                                    maxWidth: '180px',
                                                                    overflow: 'hidden',
                                                                    display: 'inline-block',
                                                                    whiteSpace: 'nowrap',
                                                                    textOverflow: 'ellipsis',
                                                                    filter: visiblePwd[p.id]
                                                                        ? 'none'
                                                                        : 'blur(4px)',
                                                                    transition: 'filter 0.2s',
                                                                    userSelect: visiblePwd[p.id]
                                                                        ? 'text' : 'none',
                                                                }}>
                                                                {p.password}
                                                            </code>
                                                            <button
                                                                className="btn btn-sm btn-link p-0 text-muted"
                                                                onClick={() => togglePwd(p.id)}
                                                                title={visiblePwd[p.id]
                                                                    ? 'Masquer' : 'Afficher'}>
                                                                <i className={`bi ${visiblePwd[p.id]
                                                                    ? 'bi-eye-slash-fill text-danger'
                                                                    : 'bi-eye-fill text-primary'}`} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted small">—</span>
                                                    )}
                                                </td>
                                            )}

                                            {/* Actions */}
                                            {showActions && (
                                                <td className="text-end no-print">
                                                    {canEdit && (
                                                        <button
                                                            className="btn btn-sm btn-outline-warning me-2 rounded-2"
                                                            onClick={() => {
                                                                setSelectedPerson(p);
                                                                setShowUpdate(true);
                                                            }}>
                                                            <i className="bi bi-pencil" />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            className="btn btn-sm btn-outline-danger rounded-2"
                                                            onClick={() => {
                                                                setSelectedId(p.id);
                                                                setShowConfirm(true);
                                                            }}>
                                                            <i className="bi bi-trash" />
                                                        </button>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="card-footer bg-white border-0 d-flex justify-content-center py-3">
                        <nav>
                            <ul className="pagination pagination-sm mb-0">
                                <li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
                                    <button className="page-link rounded-start-3"
                                        onClick={() => setPage(p => p - 1)}>
                                        <i className="bi bi-chevron-left" />
                                    </button>
                                </li>
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <li key={i} className={`page-item ${page === i ? 'active' : ''}`}>
                                        <button className="page-link" onClick={() => setPage(i)}>
                                            {i + 1}
                                        </button>
                                    </li>
                                ))}
                                <li className={`page-item ${page === totalPages - 1 ? 'disabled' : ''}`}>
                                    <button className="page-link rounded-end-3"
                                        onClick={() => setPage(p => p + 1)}>
                                        <i className="bi bi-chevron-right" />
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                )}
            </div>

            {/* ── Modals ── */}
            <PersonFormModal
                show={showForm}
                onHide={() => setShowForm(false)}
                onSuccess={loadPersons}
            />
            <PersonUpdateModal
                show={showUpdate}
                onHide={() => { setShowUpdate(false); setSelectedPerson(null); }}
                onSuccess={loadPersons}
                person={selectedPerson}
            />
            <ConfirmModal
                show={showConfirm}
                title="Supprimer le compte"
                message="Êtes-vous sûr de vouloir supprimer ce compte ?"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setShowConfirm(false)}
                isLoading={deleteLoading}
            />
        </MainLayout>
    );
};

export default PersonsPage;