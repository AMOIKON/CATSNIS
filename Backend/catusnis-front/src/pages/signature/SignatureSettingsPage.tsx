import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import MainLayout from '../../components/common/MainLayout';
import SignatureService from '../../services/Signatureservice';

const SignatureSettingsPage: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);
    const hasDrawn  = useRef(false);

    const [loading,    setLoading]    = useState(true);
    const [saving,     setSaving]     = useState(false);
    const [error,      setError]      = useState<string | null>(null);
    const [success,    setSuccess]    = useState(false);
    const [configured, setConfigured] = useState(false);
    const [existing,   setExisting]   = useState<string | null>(null);

    useEffect(() => {
        SignatureService.get()
            .then(data => {
                setConfigured(data.configured);
                if (data.signatureBase64) setExisting(data.signatureBase64);
            })
            .catch(() => setError('Impossible de charger la signature enregistrée.'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#1a1a2e';
    }, [loading]);

    const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        if ('touches' in e) {
            const touch = e.touches[0];
            return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
        }
        return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
    };

    const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        isDrawing.current = true;
        hasDrawn.current = true;
        const { x, y } = getPos(e, canvas);
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        e.preventDefault();
        const { x, y } = getPos(e, canvas);
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDraw = () => { isDrawing.current = false; };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        hasDrawn.current = false;
        setExisting(null);
    };

    const handleSave = async () => {
        const canvas = canvasRef.current;
        if (!canvas || !hasDrawn.current) {
            setError('Veuillez tracer votre signature avant d\'enregistrer.'); return;
        }
        setError(null); setSuccess(false); setSaving(true);
        try {
            const base64 = canvas.toDataURL('image/png');
            await SignatureService.update({ signatureBase64: base64 });
            setConfigured(true);
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.message || "Erreur lors de l'enregistrement.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <MainLayout title="Ma signature">
            <div className="row justify-content-center">
                <div className="col-lg-7">
                    <h5 className="fw-bold mb-1">
                        <i className="bi bi-pen-fill text-primary me-2" />
                        Signature numérique
                    </h5>
                    <p className="text-muted small mb-4">
                        Cette signature sera automatiquement intégrée sur toutes les fiches
                        PDF d'intervention que vous réalisez.
                    </p>

                    <Card className="border-0 shadow-sm rounded-4">
                        <Card.Body className="p-4">
                            {loading ? (
                                <div className="text-center py-4"><Spinner /></div>
                            ) : (
                                <>
                                    <div className="d-flex align-items-center gap-2 mb-4">
                                        {configured ? (
                                            <Badge bg="success" className="d-inline-flex align-items-center gap-1 px-3 py-2">
                                                <i className="bi bi-check-circle-fill" />Signature enregistrée
                                            </Badge>
                                        ) : (
                                            <Badge bg="warning" text="dark" className="d-inline-flex align-items-center gap-1 px-3 py-2">
                                                <i className="bi bi-exclamation-triangle-fill" />Aucune signature enregistrée
                                            </Badge>
                                        )}
                                    </div>

                                    {error   && <Alert variant="danger"  className="rounded-3">{error}</Alert>}
                                    {success && (
                                        <Alert variant="success" className="rounded-3">
                                            <i className="bi bi-check-circle me-2" />
                                            Signature enregistrée avec succès.
                                        </Alert>
                                    )}

                                    {existing && !hasDrawn.current && (
                                        <div className="mb-3">
                                            <p className="fw-semibold small mb-1">Signature actuelle :</p>
                                            <div className="border rounded-3 p-2 bg-light d-inline-block">
                                                <img src={existing} alt="Signature actuelle" style={{ maxHeight: '80px' }} />
                                            </div>
                                        </div>
                                    )}

                                    <p className="fw-semibold small mb-1">
                                        {existing ? 'Redessiner une nouvelle signature :' : 'Tracez votre signature ci-dessous :'}
                                    </p>
                                    <div className="border rounded-3 mb-2" style={{ background: '#fafafa' }}>
                                        <canvas
                                            ref={canvasRef}
                                            width={600}
                                            height={180}
                                            style={{ width: '100%', height: '180px', touchAction: 'none', cursor: 'crosshair' }}
                                            onMouseDown={startDraw}
                                            onMouseMove={draw}
                                            onMouseUp={stopDraw}
                                            onMouseLeave={stopDraw}
                                            onTouchStart={startDraw}
                                            onTouchMove={draw}
                                            onTouchEnd={stopDraw}
                                        />
                                    </div>

                                    <div className="d-flex justify-content-between">
                                        <Button variant="outline-secondary" size="sm" className="rounded-3" onClick={clearCanvas}>
                                            <i className="bi bi-eraser me-1" />Effacer
                                        </Button>
                                        <Button variant="primary" className="rounded-3" onClick={handleSave} disabled={saving}>
                                            {saving
                                                ? <><Spinner size="sm" className="me-2" />Enregistrement...</>
                                                : <><i className="bi bi-check-circle me-2" />Enregistrer ma signature</>}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
};

export default SignatureSettingsPage;