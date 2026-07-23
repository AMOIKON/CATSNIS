import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import AcquisitionService from '../../services/acquisitionService';
import ReferenceService   from '../../services/referenceService';
import { AcquisitionRequest, AcquisitionResponse, TypeResponse } from '../../types';
import { getImageSrc } from '../../utils/imageUtils';
import useAuth from '../../hooks/useAuth';
import notify from '../../services/notify';

interface Props {
    show:        boolean;
    onHide:      () => void;
    onSuccess:   () => void;
    acquisition: AcquisitionResponse | null;
}

const AcquisitionUpdateModal: React.FC<Props> = ({
    show, onHide, onSuccess, acquisition
}) => {
    const { person, isUnrestricted } = useAuth();

    const [types,     setTypes]     = useState<TypeResponse[]>([]);
    const [partners,  setPartners]  = useState<{ id: number; name: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error,     setError]     = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<TypeResponse | null>(null);

    const [form, setForm] = useState<AcquisitionRequest>({
        image: '', tag: '', dateAcq: '',
        quantity: 1, serial: '', typesId: 0, partnerId: undefined,
    });

    useEffect(() => {
        if (!show || !acquisition) return;
        setError(null);

        setForm({
            image:     acquisition.image    || '',
            tag:       acquisition.tag,
            dateAcq:   acquisition.dateAcq ? String(acquisition.dateAcq).split('T')[0] : '',
            quantity:  acquisition.quantity,
            serial:    acquisition.serial,
            typesId:   acquisition.typesId  || 0,
            partnerId: acquisition.partnerId ?? undefined,
        });

        AcquisitionService.getTypes()
            .then(list => {
                setTypes(list);
                const current = list.find(t => t.id === acquisition.typesId);
                setSelectedType(current || null);
            })
            .catch(() => setError('Erreur lors du chargement des types'));

        if (isUnrestricted) {
            ReferenceService.getPartners()
                .then(list => setPartners(list.map(p => ({ id: p.id, name: p.name }))))
                .catch(() => {});
        }
    }, [show, acquisition, isUnrestricted]);

    useEffect(() => {
        if (!show) setError(null);
    }, [show]);

    // ✅ AJOUTÉ — manquait dans le fichier d'origine
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: name === 'partnerId'
                ? (value ? Number(value) : undefined)
                : name === 'quantity'
                    ? (value ? Number(value) : 1)
                    : value,
        }));
    };

    // ✅ AJOUTÉ — manquait dans le fichier d'origine
    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id   = Number(e.target.value);
        const type = types.find(t => t.id === id) || null;
        setSelectedType(type);
        setForm(prev => ({ ...prev, typesId: id }));
    };

    const handleSubmit = async () => {
        if (!acquisition) return;
        setError(null);
        if (!form.tag || !form.dateAcq || !form.serial || !form.typesId) {
            setError('Veuillez remplir tous les champs obligatoires.');
            return;
        }
        setIsLoading(true);
        try {
            await AcquisitionService.update(acquisition.id, form);
            onSuccess();
            onHide();
            notify.success('Acquisition modifiée avec succès');
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Erreur lors de la modification.';
            setError(msg);
            notify.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const displayedPartnerName = isUnrestricted
        ? partners.find(p => p.id === form.partnerId)?.name
            ?? acquisition?.partnerName
            ?? null
        : acquisition?.partnerName
            ?? person?.partnerName
            ?? null;

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold">
                    <i className="bi bi-pencil-square text-warning me-2" />
                    Modifier l'acquisition
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
                    <div className="col-md-8">
                        <Form>
                            {isUnrestricted && (
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold">
                                        Partenaire
                                        <small className="text-muted fw-normal ms-1">(réassignation possible)</small>
                                    </Form.Label>
                                    <Form.Select
                                        name="partnerId"
                                        value={form.partnerId || ''}
                                        onChange={handleChange}
                                        className="rounded-3"
                                    >
                                        <option value="">-- Aucun partenaire --</option>
                                        {partners.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            )}

                            {!isUnrestricted && (
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold">Partenaire</Form.Label>
                                    <div className="form-control bg-light rounded-3 d-flex align-items-center gap-2"
                                         style={{ cursor: 'not-allowed' }}>
                                        <i className="bi bi-building text-warning" />
                                        <span className={displayedPartnerName ? 'fw-semibold text-warning' : 'text-muted'}>
                                            {displayedPartnerName ?? 'Non assigné'}
                                        </span>
                                        <i className="bi bi-lock-fill text-muted ms-auto small" />
                                    </div>
                                </Form.Group>
                            )}

                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">
                                    Tag <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control name="tag" value={form.tag}
                                    onChange={handleChange} className="rounded-3" />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">
                                    Numéro de série <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control name="serial" value={form.serial}
                                    onChange={handleChange} className="rounded-3" />
                            </Form.Group>

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
                                        <Form.Label className="fw-semibold">Quantité</Form.Label>
                                        <Form.Control type="number" name="quantity"
                                            min={1} value={form.quantity}
                                            onChange={handleChange} className="rounded-3" />
                                    </Form.Group>
                                </div>
                            </div>

                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Image (URL)</Form.Label>
                                <Form.Control name="image" value={form.image}
                                    onChange={handleChange} placeholder="https://..."
                                    className="rounded-3" />
                            </Form.Group>
                        </Form>
                    </div>

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

                        <div className={`card border-0 rounded-4 p-3 text-center w-100 mt-3
                            ${displayedPartnerName
                                ? 'bg-primary bg-opacity-10'
                                : 'bg-secondary bg-opacity-10'}`}>
                            <i className={`bi bi-building fs-4
                                ${displayedPartnerName ? 'text-primary' : 'text-muted'}`} />
                            <p className={`mb-0 fw-bold mt-1 small
                                ${displayedPartnerName ? 'text-primary' : 'text-muted'}`}>
                                {displayedPartnerName ?? 'Non assigné'}
                            </p>
                            <p className="mb-0 text-muted small">
                                {isUnrestricted ? 'Partenaire (modifiable)' : 'Partenaire assigné'}
                            </p>
                        </div>
                    </div>
                </div>
            </Modal.Body>

            <Modal.Footer className="border-0">
                <Button variant="light" onClick={onHide} className="rounded-3">Annuler</Button>
                <Button variant="warning" onClick={handleSubmit} disabled={isLoading}
                    className="rounded-3 text-white">
                    {isLoading
                        ? <><Spinner size="sm" className="me-2" />Modification...</>
                        : <><i className="bi bi-pencil me-2" />Modifier</>
                    }
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AcquisitionUpdateModal;