import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import AcquisitionService from '../../services/acquisitionService';
import ReferenceService   from '../../services/referenceService';
import { AcquisitionRequest, TypeResponse } from '../../types';
import { getImageSrc } from '../../utils/imageUtils';
import useAuth from '../../hooks/useAuth';

interface Props {
    show:      boolean;
    onHide:    () => void;
    onSuccess: () => void;
}

const AcquisitionFormModal: React.FC<Props> = ({ show, onHide, onSuccess }) => {
    const { person, isUnrestricted } = useAuth();

    const [types,        setTypes]        = useState<TypeResponse[]>([]);
    const [partners,     setPartners]     = useState<{ id: number; name: string }[]>([]);
    const [isLoading,    setIsLoading]    = useState(false);
    const [error,        setError]        = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<TypeResponse | null>(null);
    const [pairs,        setPairs]        = useState<{ tag: string; serial: string }[]>([
        { tag: '', serial: '' },
    ]);

    const [form, setForm] = useState<AcquisitionRequest>({
        image: '', tag: '', dateAcq: '',
        quantity: 1, serial: '', typesId: 0, partnerId: undefined,
    });

    // ── Chargement des références ─────────────────────────────────────────────
    useEffect(() => {
        if (!show) return;
        AcquisitionService.getTypes()
            .then(setTypes)
            .catch(() => setError('Erreur lors du chargement des types'));

        // ✅ SUPER_ADMIN/ITECH → charger les partenaires pour le sélecteur
        if (isUnrestricted) {
            ReferenceService.getPartners()
                .then(list => setPartners(list.map(p => ({ id: p.id, name: p.name }))))
                .catch(() => {/* silencieux */});
        }
    }, [show, isUnrestricted]);

    // ── Réinitialiser à la fermeture ──────────────────────────────────────────
    useEffect(() => {
        if (!show) {
            setForm({ image: '', tag: '', dateAcq: '', quantity: 1, serial: '', typesId: 0, partnerId: undefined });
            setPairs([{ tag: '', serial: '' }]);
            setSelectedType(null);
            setError(null);
        }
    }, [show]);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const qty = Math.max(1, parseInt(e.target.value) || 1);
        setForm(prev => ({ ...prev, quantity: qty }));
        setPairs(prev =>
            Array.from({ length: qty }, (_, i) => prev[i] || { tag: '', serial: '' })
        );
    };

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id   = Number(e.target.value);
        const type = types.find(t => t.id === id) || null;
        setSelectedType(type);
        setForm(prev => ({ ...prev, typesId: id, image: type?.image || '' }));
    };

    const handlePairChange = (index: number, field: 'tag' | 'serial', value: string) => {
        const updated = [...pairs];
        updated[index] = { ...updated[index], [field]: value };
        setPairs(updated);
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: name === 'partnerId' ? (value ? Number(value) : undefined) : value,
        }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setForm(prev => ({ ...prev, image: `images/equipements/${file.name}` }));
        }
    };

    // ── Soumission ────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        setError(null);
        if (!form.dateAcq || !form.typesId) {
            setError('Veuillez remplir tous les champs obligatoires.');
            return;
        }
        if (isUnrestricted && !form.partnerId) {
            setError('Veuillez sélectionner un partenaire.');
            return;
        }
        if (pairs.some(p => !p.tag.trim() || !p.serial.trim())) {
            setError('Veuillez remplir tous les tags et numéros de série.');
            return;
        }
        setIsLoading(true);
        try {
            for (const pair of pairs) {
                await AcquisitionService.create({
                    ...form,
                    tag:      pair.tag.trim(),
                    serial:   pair.serial.trim(),
                    quantity: 1,
                });
            }
            onSuccess();
            onHide();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de la création.');
        } finally {
            setIsLoading(false);
        }
    };

    // Partenaire affiché dans la colonne droite
    const displayedPartnerName = isUnrestricted
        ? partners.find(p => p.id === form.partnerId)?.name
        : person?.partnerName;

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold">
                    <i className="bi bi-box-seam-fill text-warning me-2" />
                    Nouvelle acquisition
                    {displayedPartnerName && (
                        <span className="badge bg-warning bg-opacity-10 text-warning ms-2 fw-normal small">
                            <i className="bi bi-building me-1" />
                            {displayedPartnerName}
                        </span>
                    )}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body className="px-4">
                {error && <Alert variant="danger" className="rounded-3">{error}</Alert>}

                <div className="row g-4">
                    {/* ── Colonne gauche ──────────────────────────────── */}
                    <div className="col-md-8">
                        <Form>

                            {/* ✅ Phase 2 — Sélecteur partenaire pour SUPER_ADMIN/ITECH */}
                            {isUnrestricted && (
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold">
                                        Partenaire <span className="text-danger">*</span>
                                        <small className="text-muted fw-normal ms-1">
                                            (obligatoire pour assigner l'équipement)
                                        </small>
                                    </Form.Label>
                                    <Form.Select
                                        name="partnerId"
                                        value={form.partnerId || ''}
                                        onChange={handleChange}
                                        className="rounded-3"
                                    >
                                        <option value="">-- Sélectionner un partenaire --</option>
                                        {partners.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            )}

                            {/* Type d'équipement */}
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">
                                    Type d'équipement <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Select value={form.typesId} onChange={handleTypeChange} className="rounded-3">
                                    <option value={0}>-- Sélectionner un type --</option>
                                    {types.map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.typeName} — {t.marque} {t.modele}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            {/* Date + Quantité */}
                            <div className="row">
                                <div className="col-md-7">
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-semibold">
                                            Date d'acquisition <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Control type="date" name="dateAcq"
                                            value={form.dateAcq} onChange={handleChange}
                                            className="rounded-3" />
                                    </Form.Group>
                                </div>
                                <div className="col-md-5">
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-semibold">
                                            Quantité <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Control type="number" min={1} max={50}
                                            value={form.quantity} onChange={handleQuantityChange}
                                            className="rounded-3" />
                                    </Form.Group>
                                </div>
                            </div>

                            {/* Paires Tag + Serial */}
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">
                                    Tags & Numéros de série <span className="text-danger">*</span>
                                    <span className="badge bg-warning bg-opacity-10 text-warning ms-2">
                                        {pairs.length} équipement(s)
                                    </span>
                                </Form.Label>
                                <div className="border rounded-3 p-3"
                                    style={{ maxHeight: '220px', overflowY: 'auto' }}>
                                    <div className="row mb-2 px-1">
                                        <div className="col-1" />
                                        <div className="col-5">
                                            <small className="fw-semibold text-muted">Tag</small>
                                        </div>
                                        <div className="col-6">
                                            <small className="fw-semibold text-muted">Numéro de série</small>
                                        </div>
                                    </div>
                                    {pairs.map((pair, i) => (
                                        <div key={i} className="row align-items-center mb-2">
                                            <div className="col-1">
                                                <span className="badge bg-secondary bg-opacity-10 text-secondary fw-bold">
                                                    {i + 1}
                                                </span>
                                            </div>
                                            <div className="col-5">
                                                <Form.Control size="sm" value={pair.tag}
                                                    onChange={e => handlePairChange(i, 'tag', e.target.value)}
                                                    placeholder={`Tag ${i + 1}`} className="rounded-3" />
                                            </div>
                                            <div className="col-6">
                                                <Form.Control size="sm" value={pair.serial}
                                                    onChange={e => handlePairChange(i, 'serial', e.target.value)}
                                                    placeholder={`Série ${i + 1}`} className="rounded-3" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Form.Group>

                            {/* Image upload */}
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">
                                    Image personnalisée{' '}
                                    <span className="text-muted small">(optionnel)</span>
                                </Form.Label>
                                <Form.Control type="file" accept="image/*"
                                    onChange={handleImageUpload} className="rounded-3" />
                                <Form.Text className="text-muted">
                                    Par défaut, l'image du type sera utilisée.
                                </Form.Text>
                            </Form.Group>
                        </Form>
                    </div>

                    {/* ── Colonne droite : aperçu ──────────────────────── */}
                    <div className="col-md-4 d-flex flex-column align-items-center justify-content-start pt-2">
                        <div className="card border-0 bg-light rounded-4 p-3 text-center w-100">
                            {selectedType ? (
                                <>
                                    <img
                                        src={getImageSrc(selectedType.image || 'equipement.png')}
                                        alt={selectedType.typeName}
                                        className="img-fluid mb-3 mx-auto"
                                        style={{ maxHeight: '100px', objectFit: 'contain' }}
                                        onError={e => {
                                            (e.target as HTMLImageElement).src =
                                                '/images/equipements/equipement.png';
                                        }}
                                    />
                                    <p className="mb-1 fw-bold text-warning small">{selectedType.typeName}</p>
                                    <p className="mb-0 text-muted small">
                                        {selectedType.marque} {selectedType.modele}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-image text-muted" style={{ fontSize: '3rem' }} />
                                    <p className="mb-0 text-muted small mt-2">
                                        Sélectionnez un type<br />pour voir l'image
                                    </p>
                                </>
                            )}
                        </div>

                        {pairs.length > 1 && (
                            <div className="card border-0 bg-warning bg-opacity-10 rounded-4 p-3 text-center w-100 mt-3">
                                <i className="bi bi-boxes text-warning fs-4" />
                                <p className="mb-0 fw-bold text-warning mt-1">{pairs.length} équipements</p>
                                <p className="mb-0 text-muted small">seront créés</p>
                            </div>
                        )}

                        {/* ✅ Phase 2 — aperçu partenaire */}
                        {displayedPartnerName ? (
                            <div className="card border-0 bg-primary bg-opacity-10 rounded-4 p-3 text-center w-100 mt-3">
                                <i className="bi bi-building text-primary fs-4" />
                                <p className="mb-0 fw-bold text-primary mt-1 small">{displayedPartnerName}</p>
                                <p className="mb-0 text-muted small">Partenaire assigné</p>
                            </div>
                        ) : isUnrestricted ? (
                            <div className="card border-0 bg-secondary bg-opacity-10 rounded-4 p-3 text-center w-100 mt-3">
                                <i className="bi bi-building text-muted fs-4" />
                                <p className="mb-0 text-muted mt-1 small">Aucun partenaire</p>
                                <p className="mb-0 text-muted small">Sélectionnez ci-dessus</p>
                            </div>
                        ) : null}
                    </div>
                </div>
            </Modal.Body>

            <Modal.Footer className="border-0">
                <Button variant="light" onClick={onHide} className="rounded-3">Annuler</Button>
                <Button variant="warning" onClick={handleSubmit} disabled={isLoading}
                    className="rounded-3 text-white">
                    {isLoading
                        ? <><Spinner size="sm" className="me-2" />Enregistrement...</>
                        : <><i className="bi bi-plus-circle me-2" />
                            Enregistrer {pairs.length > 1 ? `(${pairs.length})` : ''}
                          </>
                    }
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AcquisitionFormModal;