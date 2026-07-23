import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import { UpdatePersonRequest, AppRole } from '../../types';
import ReferenceService, { ReferenceItem } from '../../services/referenceService';
import PersonService, { PersonResponse } from '../../services/personService';
import useAuth from '../../hooks/useAuth';
import notify from '../../services/notify';

interface PersonUpdateModalProps {
    show:      boolean;
    onHide:    () => void;
    onSuccess: () => void;
    person:    PersonResponse | null;
}

const ALL_ROLES: { value: AppRole; label: string; badge: string }[] = [
    { value: 'SUPER_ADMIN', label: 'Super Administrateur', badge: 'bg-danger'          },
    { value: 'ADMIN',       label: 'Administrateur',       badge: 'bg-primary'         },
    { value: 'TECHNICIEN',  label: 'Technicien',           badge: 'bg-warning text-dark'},
    { value: 'LOGISTICIEN', label: 'Logisticien',          badge: 'bg-success'         },
    { value: 'USER',        label: 'Utilisateur',          badge: 'bg-secondary'       },
];

const getAvailableRoles = (currentRole?: string): AppRole[] => {
    if (currentRole === 'SUPER_ADMIN') return ['SUPER_ADMIN','ADMIN','TECHNICIEN','LOGISTICIEN','USER'];
    if (currentRole === 'ADMIN')       return ['TECHNICIEN','LOGISTICIEN','USER'];
    return [];
};

const PersonUpdateModal: React.FC<PersonUpdateModalProps> = ({
    show, onHide, onSuccess, person
}) => {
    const { person: currentUser } = useAuth();
    const isSuperAdmin   = currentUser?.role === 'SUPER_ADMIN';
    const availableRoles = getAvailableRoles(currentUser?.role);
    const canChangeRole  = isSuperAdmin;

    const [formData,      setFormData]      = useState<UpdatePersonRequest>({
        firstName: '', lastName: '', email: '', contact: '',
        postId: 0, unitsId: 0, partnerId: undefined, role: 'USER',
    });
    // ✅ Champs mot de passe — SUPER_ADMIN uniquement
    const [newPassword,   setNewPassword]   = useState('');
    const [showPassword,  setShowPassword]  = useState(false);

    const [posts,     setPosts]     = useState<ReferenceItem[]>([]);
    const [units,     setUnits]     = useState<ReferenceItem[]>([]);
    const [partners,  setPartners]  = useState<ReferenceItem[]>([]);
    const [error,     setError]     = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!show || !person) return;
        setError(null);
        setNewPassword('');
        setShowPassword(false);

        Promise.all([
            ReferenceService.getPosts(),
            ReferenceService.getUnits(),
            ReferenceService.getPartners(),
        ]).then(([p, u, pa]) => {
            setPosts(p); setUnits(u); setPartners(pa);
            setFormData({
                firstName: person.firstName,
                lastName:  person.lastName,
                email:     person.email,
                contact:   person.contact,
                postId:    p.find(x => x.name === person.postName)?.id  ?? 0,
                unitsId:   u.find(x => x.name === person.unitsName)?.id ?? 0,
                partnerId: pa.find(x => x.name === person.partnerName)?.id,
                role:      person.role ?? 'USER',
            });
        }).catch(err => console.error('Erreur références:', err));
    }, [show, person]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => {
            if (name === 'postId' || name === 'unitsId')
                return { ...prev, [name]: Number(value) };
            if (name === 'partnerId')
                return { ...prev, partnerId: value ? Number(value) : undefined };
            return { ...prev, [name]: value };
        });
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.postId)  { setError('Veuillez sélectionner un poste');  return; }
        if (!formData.unitsId) { setError('Veuillez sélectionner une unité'); return; }

        setIsLoading(true); setError(null);
        try {
            // ✅ Inclure plainPassword uniquement si renseigné par le SUPER_ADMIN
            const payload: UpdatePersonRequest = {
                ...formData,
                ...(isSuperAdmin && newPassword.trim()
                    ? { plainPassword: newPassword.trim() } : {}),
            };
            await PersonService.update(person!.id, payload);
            notify.success('Compte modifié avec succès');
            onSuccess(); onHide();
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Erreur lors de la mise à jour';
            setError(msg);
            notify.apiError(err, 'Erreur lors de la mise à jour du compte');
        } finally { setIsLoading(false); }
    };

    const currentRoleConf = ALL_ROLES.find(r => r.value === formData.role);

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold">
                    <i className="bi bi-pencil-fill text-warning me-2" />
                    Modifier le compte
                    {person && (
                        <small className="text-muted ms-2 fw-normal fs-6">
                            — {person.firstName} {person.lastName}
                        </small>
                    )}
                </Modal.Title>
            </Modal.Header>

            <Form onSubmit={handleSubmit}>
                <Modal.Body className="px-4">
                    {error && (
                        <Alert variant="danger" className="rounded-3">
                            <i className="bi bi-exclamation-circle me-2" />{error}
                        </Alert>
                    )}

                    {/* ── Informations personnelles ── */}
                    <div className="card border-0 bg-light rounded-4 p-3 mb-3">
                        <h6 className="fw-bold text-warning mb-3">
                            <i className="bi bi-person-fill me-2" />Informations personnelles
                        </h6>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Label className="fw-semibold small">Prénom</Form.Label>
                                <Form.Control type="text" name="firstName"
                                    value={formData.firstName} onChange={handleChange}
                                    className="rounded-3" size="sm" required />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="fw-semibold small">Nom</Form.Label>
                                <Form.Control type="text" name="lastName"
                                    value={formData.lastName} onChange={handleChange}
                                    className="rounded-3" size="sm" required />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="fw-semibold small">Email</Form.Label>
                                <Form.Control type="email" name="email"
                                    value={formData.email} onChange={handleChange}
                                    className="rounded-3" size="sm" required />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="fw-semibold small">Contact</Form.Label>
                                <Form.Control type="text" name="contact"
                                    value={formData.contact} onChange={handleChange}
                                    className="rounded-3" size="sm" required />
                            </Col>
                        </Row>
                    </div>

                    {/* ── Rôle & Organisation ── */}
                    <div className="card border-0 bg-light rounded-4 p-3 mb-3">
                        <h6 className="fw-bold text-warning mb-3">
                            <i className="bi bi-shield-fill me-2" />Rôle & Organisation
                        </h6>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Label className="fw-semibold small">
                                    Rôle
                                    {!canChangeRole && (
                                        <span className="text-muted fw-normal small ms-1">
                                            (lecture seule)
                                        </span>
                                    )}
                                </Form.Label>
                                {canChangeRole ? (
                                    <Form.Select name="role" value={formData.role ?? ''}
                                        onChange={handleChange} className="rounded-3" size="sm" required>
                                        {ALL_ROLES
                                            .filter(r => availableRoles.includes(r.value))
                                            .map(r => (
                                                <option key={r.value} value={r.value}>{r.label}</option>
                                            ))}
                                    </Form.Select>
                                ) : (
                                    <div className="form-control form-control-sm bg-light
                                        d-flex align-items-center gap-2 rounded-3">
                                        <span className={`badge ${currentRoleConf?.badge ?? 'bg-secondary'}`}>
                                            {currentRoleConf?.label ?? formData.role}
                                        </span>
                                    </div>
                                )}
                                {formData.role === 'LOGISTICIEN' && canChangeRole && (
                                    <small className="text-success mt-1 d-block">
                                        <i className="bi bi-info-circle me-1" />
                                        Accès limité au parc logistique.
                                    </small>
                                )}
                            </Col>
                            <Col md={6}>
                                <Form.Label className="fw-semibold small">Poste</Form.Label>
                                <Form.Select name="postId" value={formData.postId}
                                    onChange={handleChange} className="rounded-3" size="sm" required>
                                    <option value={0}>Sélectionner</option>
                                    {posts.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </Form.Select>
                            </Col>
                            <Col md={6}>
                                <Form.Label className="fw-semibold small">Unité</Form.Label>
                                <Form.Select name="unitsId" value={formData.unitsId}
                                    onChange={handleChange} className="rounded-3" size="sm" required>
                                    <option value={0}>Sélectionner</option>
                                    {units.map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </Form.Select>
                            </Col>
                            <Col md={6}>
                                <Form.Label className="fw-semibold small">
                                    Partenaire
                                    <span className="text-muted fw-normal small ms-1">(optionnel)</span>
                                </Form.Label>
                                <Form.Select name="partnerId"
                                    value={formData.partnerId || ''}
                                    onChange={handleChange} className="rounded-3" size="sm">
                                    <option value="">Aucun partenaire</option>
                                    {partners.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </Form.Select>
                            </Col>
                        </Row>
                    </div>

                    {/* ✅ Mot de passe — SUPER_ADMIN uniquement ── */}
                    {isSuperAdmin && (
                        <div className="card border-0 bg-light rounded-4 p-3">
                            <h6 className="fw-bold text-danger mb-1">
                                <i className="bi bi-key-fill me-2" />Mot de passe
                            </h6>
                            <small className="text-muted d-block mb-3">
                                Mot de passe actuel :
                                {person?.password ? (
                                    <code className="ms-2 text-danger fw-semibold">
                                        {person.password}
                                    </code>
                                ) : (
                                    <span className="ms-2 text-muted fst-italic">non disponible</span>
                                )}
                            </small>

                            <Form.Label className="fw-semibold small">
                                Nouveau mot de passe
                                <span className="text-muted fw-normal ms-1">(laisser vide pour ne pas changer)</span>
                            </Form.Label>
                            <div className="input-group input-group-sm">
                                <Form.Control
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Nouveau mot de passe..."
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="rounded-start-3"
                                />
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary rounded-end-3"
                                    onClick={() => setShowPassword(v => !v)}
                                    title={showPassword ? 'Masquer' : 'Afficher'}>
                                    <i className={`bi ${showPassword
                                        ? 'bi-eye-slash-fill text-danger'
                                        : 'bi-eye-fill text-primary'}`} />
                                </button>
                            </div>
                            {newPassword.trim() && (
                                <small className="text-warning mt-1 d-block">
                                    <i className="bi bi-exclamation-triangle me-1" />
                                    Le mot de passe sera modifié à l'enregistrement.
                                </small>
                            )}
                        </div>
                    )}
                </Modal.Body>

                <Modal.Footer className="border-0">
                    <Button variant="light" onClick={onHide} disabled={isLoading}
                        className="rounded-3">
                        Annuler
                    </Button>
                    <Button type="submit" variant="warning" disabled={isLoading}
                        className="rounded-3 text-white">
                        {isLoading
                            ? <><span className="spinner-border spinner-border-sm me-2" />Mise à jour...</>
                            : <><i className="bi bi-check-circle me-2" />Enregistrer</>
                        }
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default PersonUpdateModal;