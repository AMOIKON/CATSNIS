import React, { useEffect, useState } from 'react';
import { Card, Button, Alert, Spinner, Badge, Form } from 'react-bootstrap';
import MainLayout from '../components/common/MainLayout';
import systemStateService from '../services/systemStateService';

/**
 * NOUVEAU (27/08/2026) — écran réservé au SUPER_ADMIN pour verrouiller ou
 * déverrouiller l'ensemble de l'application (ex : litige de paiement). Une
 * fois verrouillée, plus personne (sauf SUPER_ADMIN) ne peut se connecter
 * ni consulter quoi que ce soit — voir SystemLockFilter côté backend.
 */
const SystemLockPage: React.FC = () => {
    const [loading,  setLoading]  = useState(true);
    const [locked,   setLocked]   = useState(false);
    const [reason,   setReason]   = useState('');
    const [newReason, setNewReason] = useState('');
    const [busy,     setBusy]     = useState(false);
    const [error,    setError]    = useState<string | null>(null);
    const [success,  setSuccess]  = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        systemStateService.status()
            .then(data => { setLocked(data.locked); setReason(data.reason); })
            .catch(() => setError('Impossible de charger le statut.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const handleLock = async () => {
        if (!newReason.trim()) {
            setError('Veuillez indiquer une raison pour le verrouillage.');
            return;
        }
        setError(null); setSuccess(null); setBusy(true);
        try {
            await systemStateService.lock(newReason.trim());
            setSuccess('Application verrouillée.');
            setNewReason('');
            load();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors du verrouillage.');
        } finally {
            setBusy(false);
        }
    };

    const handleUnlock = async () => {
        setError(null); setSuccess(null); setBusy(true);
        try {
            await systemStateService.unlock();
            setSuccess('Application déverrouillée.');
            load();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors du déverrouillage.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <MainLayout title="Verrouillage de l'application">
            <div className="row justify-content-center">
                <div className="col-lg-7">
                    <h5 className="fw-bold mb-1">
                        <i className="bi bi-shield-lock-fill text-primary me-2" />
                        Verrouillage administratif
                    </h5>
                    <p className="text-muted small mb-4">
                        En cas de litige (ex : paiement non effectué), vous pouvez suspendre
                        l'accès à l'application pour tous les utilisateurs, sauf vous-même.
                    </p>

                    <Card className="border-0 shadow-sm rounded-4">
                        <Card.Body className="p-4">
                            {loading ? (
                                <div className="text-center py-4"><Spinner /></div>
                            ) : (
                                <>
                                    <div className="d-flex align-items-center gap-2 mb-4">
                                        {locked ? (
                                            <Badge bg="danger" className="d-inline-flex align-items-center gap-1 px-3 py-2">
                                                <i className="bi bi-lock-fill" />Application verrouillée
                                            </Badge>
                                        ) : (
                                            <Badge bg="success" className="d-inline-flex align-items-center gap-1 px-3 py-2">
                                                <i className="bi bi-unlock-fill" />Application active
                                            </Badge>
                                        )}
                                    </div>

                                    {error   && <Alert variant="danger"  className="rounded-3">{error}</Alert>}
                                    {success && <Alert variant="success" className="rounded-3">{success}</Alert>}

                                    {locked && reason && (
                                        <div className="mb-3">
                                            <p className="fw-semibold small mb-1">Raison actuelle :</p>
                                            <p className="text-muted small">{reason}</p>
                                        </div>
                                    )}

                                    {locked ? (
                                        <Button variant="success" className="rounded-3" onClick={handleUnlock} disabled={busy}>
                                            {busy
                                                ? <><Spinner size="sm" className="me-2" />Déverrouillage...</>
                                                : <><i className="bi bi-unlock me-2" />Déverrouiller l'application</>}
                                        </Button>
                                    ) : (
                                        <>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="fw-semibold small">
                                                    Raison du verrouillage <span className="text-danger">*</span>
                                                </Form.Label>
                                                <Form.Control
                                                    as="textarea"
                                                    rows={2}
                                                    placeholder="Ex : Paiement non effectué depuis le 15/08/2026"
                                                    value={newReason}
                                                    onChange={e => setNewReason(e.target.value)}
                                                    className="rounded-3"
                                                />
                                            </Form.Group>
                                            <Button variant="danger" className="rounded-3" onClick={handleLock} disabled={busy}>
                                                {busy
                                                    ? <><Spinner size="sm" className="me-2" />Verrouillage...</>
                                                    : <><i className="bi bi-lock me-2" />Verrouiller l'application</>}
                                            </Button>
                                        </>
                                    )}
                                </>
                            )}
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
};

export default SystemLockPage;