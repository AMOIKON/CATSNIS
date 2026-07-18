import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Spinner, Alert, Badge } from 'react-bootstrap';
import PublicDeploymentService, { PublicDeploymentResponse } from '../../services/Publicdeploymentservice';

const InfoRow: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
    <div className="d-flex border-bottom py-2">
        <div className="text-muted small fw-semibold" style={{ width: '160px', flexShrink: 0 }}>{label}</div>
        <div className="small">{value ?? '—'}</div>
    </div>
);

const PublicVerifyDeploymentPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [data,    setData]    = useState<PublicDeploymentResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        PublicDeploymentService.get(Number(id))
            .then(setData)
            .catch(() => setError("Ce déploiement n'a pas été trouvé, ou le lien est invalide."))
            .finally(() => setLoading(false));
    }, [id]);

    return (
        <div style={{ minHeight: '100vh', background: '#f4f4f7', display: 'flex', justifyContent: 'center', padding: '24px 16px' }}>
            <div style={{ width: '100%', maxWidth: '520px' }}>
                <div className="text-center mb-4">
                    <div className="d-inline-flex align-items-center gap-2 mb-2">
                        <i className="bi bi-shield-check text-primary fs-3" />
                        <h5 className="fw-bold mb-0" style={{ color: '#0d6efd' }}>CATUSNIS</h5>
                    </div>
                    <p className="text-muted small mb-0">Vérification de déploiement</p>
                </div>

                <div className="card border-0 shadow-sm rounded-4">
                    <div className="card-body p-4">
                        {loading ? (
                            <div className="text-center py-5"><Spinner /></div>
                        ) : error ? (
                            <Alert variant="danger" className="rounded-3 mb-0">{error}</Alert>
                        ) : data ? (
                            <>
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <h6 className="fw-bold mb-0">{data.codeDep}</h6>
                                    <Badge bg="success"><i className="bi bi-truck me-1" />Déploiement</Badge>
                                </div>

                                <hr />

                                <InfoRow label="Date de réception" value={data.dateRecep ? new Date(data.dateRecep).toLocaleDateString('fr-FR') : undefined} />
                                <InfoRow label="Région" value={data.regionDeploy} />
                                <InfoRow label="District" value={data.districtDeploy} />
                                <InfoRow label="Site" value={data.healthDeploy} />
                                <InfoRow label="Application" value={data.appsDeploy} />
                                <InfoRow label="Réalisé par" value={data.technicianName} />
                                {data.partnerName && <InfoRow label="Bailleur / Partenaire" value={data.partnerName} />}

                                {data.items?.length > 0 && (
                                    <>
                                        <h6 className="fw-bold mt-4 mb-2 small">Équipements déployés</h6>
                                        {data.items.map((item, i) => (
                                            <div key={i} className="small border-bottom py-2 d-flex justify-content-between">
                                                <span>{item.typeName} — {item.tag}</span>
                                                <span className="text-muted">{item.status}</span>
                                            </div>
                                        ))}
                                    </>
                                )}

                                {data.comment && (
                                    <div className="mt-4 p-3 bg-light rounded-3">
                                        <div className="fw-semibold small mb-1">Commentaire</div>
                                        <div className="small">{data.comment}</div>
                                    </div>
                                )}
                            </>
                        ) : null}
                    </div>
                </div>

                <p className="text-center text-muted mt-3" style={{ fontSize: '11px' }}>
                    Document vérifié via CATUSNIS — Côte d'Ivoire
                </p>
            </div>
        </div>
    );
};

export default PublicVerifyDeploymentPage;