import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import PartnerService from '../../services/partnerService';
import ImagePicker    from '../../components/common/ImagePicker';
import { PartnerRequest, PartnerResponse } from '../../types';

interface Props {
    show:      boolean;
    onHide:    () => void;
    onSuccess: () => void;
    partner:   PartnerResponse | null;
}

const initialForm: PartnerRequest = {
    partnerName: '',
    logo:        'bi-building',
    color:       '#616161',
    image:       '',
};

const PartnerUpdateModal: React.FC<Props> = ({ show, onHide, onSuccess, partner }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error,     setError]     = useState<string | null>(null);
    const [form,      setForm]      = useState<PartnerRequest>(initialForm);

    // ── Pré-remplir avec les données existantes ───────────────────
    useEffect(() => {
        if (show && partner) {
            setForm({
                partnerName: partner.partnerName || '',
                logo:        partner.logo        || 'bi-building',
                color:       partner.color       || '#616161',
                image:       partner.image       || '',
            });
        }
    }, [show, partner]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!partner) return;
        setError(null);
        if (!form.partnerName.trim()) {
            setError('Le nom du partenaire est obligatoire.');
            return;
        }
        setIsLoading(true);
        try {
            await PartnerService.update(partner.id, form);
            onSuccess();
            onHide();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de la modification.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold">
                    <i className="bi bi-pencil-square text-warning me-2" />
                    Modifier le partenaire
                </Modal.Title>
            </Modal.Header>

            <Modal.Body className="px-4">
                {error && <Alert variant="danger" className="rounded-3">{error}</Alert>}
                <Form>
                    {/* ── Nom ──────────────────────────────────────── */}
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">
                            Nom du partenaire <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            name="partnerName"
                            value={form.partnerName}
                            onChange={handleChange}
                            className="rounded-3"
                        />
                    </Form.Group>

                    {/* ── Icône + Couleur ──────────────────────────── */}
                    <div className="row">
                        <div className="col-md-8">
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">
                                    Icône Bootstrap
                                </Form.Label>
                                <Form.Control
                                    name="logo"
                                    value={form.logo}
                                    onChange={handleChange}
                                    placeholder="Ex: bi-building"
                                    className="rounded-3"
                                />
                                <Form.Text className="text-muted">
                                    Voir{' '}
                                    <a href="https://icons.getbootstrap.com"
                                       target="_blank" rel="noreferrer">
                                        icons.getbootstrap.com
                                    </a>
                                </Form.Text>
                            </Form.Group>
                        </div>
                        <div className="col-md-4">
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Couleur</Form.Label>
                                <div className="d-flex align-items-center gap-2">
                                    <Form.Control
                                        type="color"
                                        name="color"
                                        value={form.color || '#616161'}
                                        onChange={handleChange}
                                        style={{
                                            width: '50px', height: '38px',
                                            padding: '2px', cursor: 'pointer'
                                        }}
                                        className="rounded-3"
                                    />
                                    <Form.Control
                                        name="color"
                                        value={form.color}
                                        onChange={handleChange}
                                        placeholder="#616161"
                                        className="rounded-3"
                                    />
                                </div>
                            </Form.Group>
                        </div>
                    </div>

                    {/* ── Aperçu ───────────────────────────────────── */}
                    {(form.logo || form.color) && (
                        <div className="mb-3 p-3 bg-light rounded-3
                                        d-flex align-items-center gap-3">
                            <small className="text-muted fw-semibold">Aperçu :</small>
                            <div style={{
                                width:          '44px',
                                height:         '44px',
                                borderRadius:   '10px',
                                background:     `${form.color}25`,
                                border:         `2px solid ${form.color}`,
                                display:        'flex',
                                alignItems:     'center',
                                justifyContent: 'center'
                            }}>
                                <i className={`bi ${form.logo}`}
                                   style={{ color: form.color, fontSize: '22px' }} />
                            </div>
                            <span className="fw-semibold" style={{ color: form.color }}>
                                {form.partnerName || 'Nom partenaire'}
                            </span>
                        </div>
                    )}

                    {/* ── Image / Logo ──────────────────────────────── */}
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">
                            Image / Logo du partenaire
                        </Form.Label>
                        <ImagePicker
                            value={form.image}
                            onChange={fileName =>
                                setForm(prev => ({ ...prev, image: fileName }))
                            }
                        />
                        <Form.Text className="text-muted">
                            L'image sera affichée dans la fiche de déploiement.
                        </Form.Text>
                    </Form.Group>
                </Form>
            </Modal.Body>

            <Modal.Footer className="border-0">
                <Button variant="light" onClick={onHide} className="rounded-3">
                    Annuler
                </Button>
                <Button
                    variant="warning"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="rounded-3 text-white"
                >
                    {isLoading
                        ? <><Spinner size="sm" className="me-2" />Modification...</>
                        : <><i className="bi bi-pencil me-2" />Modifier</>
                    }
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default PartnerUpdateModal;