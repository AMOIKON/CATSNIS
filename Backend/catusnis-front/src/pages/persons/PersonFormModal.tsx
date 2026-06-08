import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import { RegisterRequest } from '../../types';
import ReferenceService, { ReferenceItem } from '../../services/referenceService';
import api from '../../services/api';
import { ApiResponse, AuthResponse, AppRole } from '../../types';
import useAuth from '../../hooks/useAuth';

interface PersonFormModalProps {
    show:      boolean;
    onHide:    () => void;
    onSuccess: () => void;
}

// ✅ Tous les rôles incluant LOGISTICIEN
const ALL_ROLES: { value: AppRole; label: string }[] = [
    { value: 'SUPER_ADMIN', label: 'Super Administrateur' },
    { value: 'ADMIN',       label: 'Administrateur'       },
    { value: 'TECHNICIEN',  label: 'Technicien'           },
    { value: 'LOGISTICIEN', label: 'Logisticien'          },
    { value: 'USER',        label: 'Utilisateur'          },
];

const getAvailableRoles = (currentRole?: string): AppRole[] => {
    if (currentRole === 'SUPER_ADMIN') return ['SUPER_ADMIN', 'ADMIN', 'TECHNICIEN', 'LOGISTICIEN', 'USER'];
    if (currentRole === 'ADMIN')       return ['TECHNICIEN', 'LOGISTICIEN', 'USER'];
    return [];
};

const initialForm: RegisterRequest = {
    firstName: '', lastName: '', email: '', contact: '',
    password: '', postId: 0, unitsId: 0, partnerId: undefined, role: 'USER',
};

const PersonFormModal: React.FC<PersonFormModalProps> = ({ show, onHide, onSuccess }) => {
    const { person: currentUser } = useAuth();
    const availableRoles = getAvailableRoles(currentUser?.role);

    const [formData,  setFormData]  = useState<RegisterRequest>(initialForm);
    const [posts,     setPosts]     = useState<ReferenceItem[]>([]);
    const [units,     setUnits]     = useState<ReferenceItem[]>([]);
    const [partners,  setPartners]  = useState<ReferenceItem[]>([]);
    const [error,     setError]     = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!show) return;
        const defaultRole = availableRoles[availableRoles.length - 1] ?? 'USER';
        setFormData({ ...initialForm, role: defaultRole });
        setError(null);
        Promise.all([
            ReferenceService.getPosts(),
            ReferenceService.getUnits(),
            ReferenceService.getPartners(),
        ]).then(([p, u, pa]) => { setPosts(p); setUnits(u); setPartners(pa); })
          .catch(err => console.error('Erreur chargement références:', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            if (name === 'postId' || name === 'unitsId') return { ...prev, [name]: value ? Number(value) : 0 };
            if (name === 'partnerId') return { ...prev, partnerId: value ? Number(value) : undefined };
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
            await api.post<ApiResponse<AuthResponse>>('/api/auth/register', formData);
            setFormData(initialForm); onSuccess(); onHide();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de la création du compte');
        } finally { setIsLoading(false); }
    };

    const handleClose = () => { setFormData(initialForm); setError(null); onHide(); };

    return (
        <Modal show={show} onHide={handleClose} size="lg" centered>
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold">
                    <i className="bi bi-person-plus-fill text-primary me-2" />
                    Créer un compte
                </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body className="px-4">
                    {error && <Alert variant="danger" className="rounded-3"><i className="bi bi-exclamation-circle me-2" />{error}</Alert>}
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fw-semibold">Prénom</Form.Label>
                                <Form.Control type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Prénom" required />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fw-semibold">Nom</Form.Label>
                                <Form.Control type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Nom" required />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fw-semibold">Email</Form.Label>
                                <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} placeholder="exemple@email.com" required />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fw-semibold">Contact</Form.Label>
                                <Form.Control type="text" name="contact" value={formData.contact} onChange={handleChange} placeholder="+225 00 00 00 00" required />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fw-semibold">Mot de passe</Form.Label>
                                <Form.Control type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Minimum 8 caractères" required minLength={8} />
                            </Form.Group>
                        </Col>

                        {/* ✅ Rôle avec LOGISTICIEN */}
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fw-semibold">Rôle</Form.Label>
                                <Form.Select name="role" value={formData.role ?? ''} onChange={handleChange} required>
                                    {ALL_ROLES.filter(r => availableRoles.includes(r.value)).map(r => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </Form.Select>
                                {/* Badge aperçu du rôle sélectionné */}
                                {formData.role === 'LOGISTICIEN' && (
                                    <small className="text-success mt-1 d-block">
                                        <i className="bi bi-info-circle me-1" />
                                        Accès limité au parc logistique et tableau de bord logistique.
                                    </small>
                                )}
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fw-semibold">Poste</Form.Label>
                                <Form.Select name="postId" value={formData.postId || ''} onChange={handleChange} required>
                                    <option value={0}>Sélectionner un poste</option>
                                    {posts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fw-semibold">Unité</Form.Label>
                                <Form.Select name="unitsId" value={formData.unitsId || ''} onChange={handleChange} required>
                                    <option value={0}>Sélectionner une unité</option>
                                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label className="fw-semibold">Partenaire <span className="text-muted fw-normal small">(optionnel)</span></Form.Label>
                                <Form.Select name="partnerId" value={formData.partnerId || ''} onChange={handleChange}>
                                    <option value="">Aucun partenaire</option>
                                    {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="light" onClick={handleClose} disabled={isLoading}>Annuler</Button>
                    <Button type="submit" variant="primary" disabled={isLoading}>
                        {isLoading
                            ? <><span className="spinner-border spinner-border-sm me-2" />Création...</>
                            : <><i className="bi bi-check-circle me-2" />Créer le compte</>}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};
export default PersonFormModal;