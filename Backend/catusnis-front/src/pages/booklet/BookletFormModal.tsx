import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import BookletService from '../../services/bookletService';
import { BookletRequest, Region, District, Post, BookletStatus } from '../../types';
import api from '../../services/api';

const toArray = (data: any): any[] => {
    if (Array.isArray(data))                return data;
    if (Array.isArray(data?.data?.content)) return data.data.content;
    if (Array.isArray(data?.data))          return data.data;
    if (Array.isArray(data?.content))       return data.content;
    return [];
};

// Résout le nom d'un statut peu importe la convention de nommage
const statusName = (s: any): string =>
    s?.statusName ?? s?.status_name ?? s?.name ?? `#${s?.id}`;

// Résout le nom d'un poste
const postName = (p: any): string =>
    p?.postName ?? p?.PostName ?? p?.post_name ?? p?.name ?? `#${p?.id}`;

// Résout le nom d'un district
const districtName = (d: any): string =>
    d?.districtName ?? d?.DistrictName ?? d?.district_name ?? d?.name ?? `#${d?.id}`;

interface Props {
    show:      boolean;
    onHide:    () => void;
    onSuccess: () => void;
}

const BookletFormModal: React.FC<Props> = ({ show, onHide, onSuccess }) => {
    const [regions,   setRegions]   = useState<Region[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [posts,     setPosts]     = useState<Post[]>([]);
    const [statuses,  setStatuses]  = useState<BookletStatus[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error,     setError]     = useState<string | null>(null);

    const [form, setForm] = useState<BookletRequest>({
        firstName: '', lastName: '', contact: '', email: '',
        region: { id: 0 }, district: { id: 0 }, post: { id: 0 }, status: { id: 0 },
    });

    useEffect(() => {
        if (!show) return;
        api.get('/api/regions?size=100').then(r => setRegions(toArray(r.data))).catch(console.error);
        api.get('/api/posts?size=100').then(r => setPosts(toArray(r.data))).catch(console.error);
        api.get('/api/booklet-status').then(r => setStatuses(toArray(r.data))).catch(console.error);
    }, [show]);

    useEffect(() => {
        if (!form.region.id) { setDistricts([]); return; }
        api.get(`/api/districts/region/${form.region.id}`)
           .then(r => setDistricts(toArray(r.data))).catch(console.error);
    }, [form.region.id]);

    useEffect(() => {
        if (!show) {
            setForm({ firstName: '', lastName: '', contact: '', email: '',
                region: { id: 0 }, district: { id: 0 }, post: { id: 0 }, status: { id: 0 } });
            setDistricts([]); setError(null);
        }
    }, [show]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (['region', 'district', 'post', 'status'].includes(name)) {
            setForm(prev => ({ ...prev, [name]: { id: Number(value) } }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async () => {
        setError(null);
        if (!form.firstName.trim() || !form.lastName.trim() || !form.contact.trim()) {
            setError('Le nom, prénom et contact sont obligatoires.'); return;
        }
        setIsLoading(true);
        try {
            const payload: BookletRequest = {
                ...form,
                email:    form.email || '',
                region:   form.region.id   ? form.region   : undefined as any,
                district: form.district.id ? form.district : undefined as any,
                post:     form.post.id     ? form.post     : undefined as any,
                status:   form.status.id   ? form.status   : undefined as any,
            };
            await BookletService.create(payload);
            onSuccess(); onHide();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de la création.');
        } finally { setIsLoading(false); }
    };

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold">
                    <i className="bi bi-journal-plus text-primary me-2" />
                    Nouveau Booklet
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4">
                {error && <Alert variant="danger" className="rounded-3">{error}</Alert>}
                <Form>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <Form.Group>
                                <Form.Label className="fw-semibold">Nom <span className="text-danger">*</span></Form.Label>
                                <Form.Control name="lastName" value={form.lastName} onChange={handleChange} placeholder="Ex: Kouassi" className="rounded-3" />
                            </Form.Group>
                        </div>
                        <div className="col-md-6">
                            <Form.Group>
                                <Form.Label className="fw-semibold">Prénom <span className="text-danger">*</span></Form.Label>
                                <Form.Control name="firstName" value={form.firstName} onChange={handleChange} placeholder="Ex: Jean" className="rounded-3" />
                            </Form.Group>
                        </div>
                        <div className="col-md-6">
                            <Form.Group>
                                <Form.Label className="fw-semibold">Contact <span className="text-danger">*</span></Form.Label>
                                <Form.Control name="contact" value={form.contact} onChange={handleChange} placeholder="Ex: 0700000000" className="rounded-3" />
                            </Form.Group>
                        </div>
                        <div className="col-md-6">
                            <Form.Group>
                                <Form.Label className="fw-semibold">Email</Form.Label>
                                <Form.Control type="email" name="email" value={form.email} onChange={handleChange} placeholder="Ex: jean@sante.ci" className="rounded-3" />
                            </Form.Group>
                        </div>
                        <div className="col-md-6">
                            <Form.Group>
                                <Form.Label className="fw-semibold">Région</Form.Label>
                                <Form.Select name="region" value={form.region.id} onChange={handleChange} className="rounded-3">
                                    <option value={0}>-- Sélectionner --</option>
                                    {regions.map(r => <option key={r.id} value={r.id}>{r.regionName}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </div>
                        <div className="col-md-6">
                            <Form.Group>
                                <Form.Label className="fw-semibold">District</Form.Label>
                                <Form.Select name="district" value={form.district.id} onChange={handleChange} className="rounded-3" disabled={!form.region.id}>
                                    <option value={0}>-- Sélectionner --</option>
                                    {districts.map(d => <option key={d.id} value={d.id}>{districtName(d)}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </div>
                        <div className="col-md-6">
                            <Form.Group>
                                <Form.Label className="fw-semibold">Poste</Form.Label>
                                <Form.Select name="post" value={form.post.id} onChange={handleChange} className="rounded-3">
                                    <option value={0}>-- Sélectionner --</option>
                                    {posts.map(p => <option key={p.id} value={p.id}>{postName(p)}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </div>
                        <div className="col-md-6">
                            <Form.Group>
                                <Form.Label className="fw-semibold">Statut</Form.Label>
                                <Form.Select name="status" value={form.status.id} onChange={handleChange} className="rounded-3">
                                    <option value={0}>-- Sélectionner --</option>
                                    {statuses.map(s => <option key={s.id} value={s.id}>{statusName(s)}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </div>
                    </div>
                </Form>
            </Modal.Body>
            <Modal.Footer className="border-0">
                <Button variant="light" onClick={onHide} className="rounded-3">Annuler</Button>
                <Button variant="primary" onClick={handleSubmit} disabled={isLoading} className="rounded-3">
                    {isLoading ? <><Spinner size="sm" className="me-2" />Enregistrement...</> : <><i className="bi bi-plus-circle me-2" />Enregistrer</>}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default BookletFormModal;