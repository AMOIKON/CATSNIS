import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Spinner, Alert, Badge } from 'react-bootstrap';
import PublicVehiculeService, { PublicVehiculeResponse } from '../../services/Publicvehiculeservice';

const InfoRow: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
    <div className="d-flex border-bottom py-2">
        <div className="text-muted small fw-semibold" style={{ width: '160px', flexShrink: 0 }}>{label}</div>
        <div className="small">{value ?? '—'}</div>
    </div>
);

const STATUT_LABELS: Record<string, string> = {
  DISPONIBLE: 'Disponible',
  EN_MISSION: 'En mission',
  EN_PANNE: 'En panne',
  EN_MAINTENANCE: 'En maintenance',
  RETIRE: 'Retiré',
};

const PublicVerifyVehiculePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [data,    setData]    = useState<PublicVehiculeResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        PublicVehiculeService.get(Number(id))
            .then(setData)
            .catch(() => setError("Cet engin n'a pas été trouvé, ou le lien est invalide."))
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
                    <p className="text-muted small mb-0">Vérification d'engin roulant</p>
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
                                    <h6 className="fw-bold mb-0">{data.immatriculation}</h6>
                                    <Badge bg="success"><i className="bi bi-car-front-fill me-1" />{STATUT_LABELS[data.statut] || data.statut}</Badge>
                                </div>

                                <hr />

                                <InfoRow label="Type" value={data.type} />
                                <InfoRow label="Marque / Modèle" value={`${data.marque || ''} ${data.modele || ''}`.trim() || undefined} />
                                <InfoRow label="Couleur" value={data.couleur} />
                                <InfoRow label="Kilométrage" value={data.kilometrage ? `${data.kilometrage.toLocaleString()} km` : undefined} />
                                <InfoRow label="Région" value={data.regionName} />
                                <InfoRow label="District" value={data.districtName} />
                                <InfoRow label="Conducteur" value={data.conducteurNom} />

                                <h6 className="fw-bold mt-4 mb-2 small">Documents administratifs</h6>
                                <InfoRow label="Assurance" value={data.dateFinAssurance ? new Date(data.dateFinAssurance).toLocaleDateString('fr-FR') : undefined} />
                                <InfoRow label="Visite technique" value={data.dateFinVisiteTechnique ? new Date(data.dateFinVisiteTechnique).toLocaleDateString('fr-FR') : undefined} />
                                <InfoRow label="Vignette" value={data.dateFinVignette ? new Date(data.dateFinVignette).toLocaleDateString('fr-FR') : undefined} />
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

export default PublicVerifyVehiculePage;