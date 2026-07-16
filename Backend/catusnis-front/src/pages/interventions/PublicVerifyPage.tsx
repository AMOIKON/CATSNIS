import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Spinner, Alert, Badge } from 'react-bootstrap';
import PublicInterventionService, { PublicInterventionResponse } from '../../services/Publicinterventionservice';

const InfoRow: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
    <div className="d-flex border-bottom py-2">
        <div className="text-muted small fw-semibold" style={{ width: '160px', flexShrink: 0 }}>{label}</div>
        <div className="small">{value ?? '—'}</div>
    </div>
);

const formatEtat = (etat?: string) =>
    etat === 'NON_FONCTIONNEL' ? '❌ Non fonctionnel' : etat === 'DEGRADE' ? '⚠️ Dégradé' : '✅ Fonctionnel';

const PublicVerifyPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [data,    setData]    = useState<PublicInterventionResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        PublicInterventionService.get(Number(id))
            .then(setData)
            .catch(() => setError("Cette intervention n'a pas été trouvée, ou le lien est invalide."))
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
                    <p className="text-muted small mb-0">Vérification d'intervention</p>
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
                                    <h6 className="fw-bold mb-0">{data.codeInter}</h6>
                                    <div className="d-flex gap-2 flex-wrap justify-content-end">
                                        <Badge bg={data.typeInter === 'EN_LIGNE' ? 'primary' : 'success'}>
                                            {data.typeInter === 'EN_LIGNE' ? '📞 En ligne' : '🏥 Sur site'}
                                        </Badge>
                                        {(!data.structureEnregistree || data.equipementHorsBase) && (
                                            <Badge style={{ background: 'rgba(79,70,229,0.15)', color: '#4f46e5' }}>
                                                Assistance technique
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <hr />

                                <InfoRow label="Date" value={new Date(data.dateInter).toLocaleDateString('fr-FR')} />
                                <InfoRow label="Durée" value={`${data.durationMinutes} min`} />
                                <InfoRow label="Application" value={data.appName} />

                                {data.structureEnregistree ? (
                                    <>
                                        <InfoRow label="Région" value={data.regionName} />
                                        <InfoRow label="District" value={data.districtName} />
                                        <InfoRow label="Site" value={data.healthName} />
                                    </>
                                ) : (
                                    <InfoRow label="Structure" value={data.structureName} />
                                )}

                                <InfoRow label="Réalisée par" value={data.technicianName} />
                                <InfoRow label="Personne assistée" value={data.personName} />

                                {data.equipementHorsBase && data.manualEquipmentName && (
                                    <InfoRow label="Équipement" value={
                                        data.manualEquipmentName + (data.manualEquipmentType ? ` (${data.manualEquipmentType})` : '')
                                    } />
                                )}

                                {data.deploymentItems?.length > 0 && (
                                    <>
                                        <h6 className="fw-bold mt-4 mb-2 small">Équipements concernés</h6>
                                        {data.deploymentItems.map((item, i) => (
                                            <div key={i} className="small border-bottom py-2 d-flex justify-content-between">
                                                <span>{item.typeName} — {item.tag}</span>
                                                <span className="text-muted">{formatEtat(item.etatApres)}</span>
                                            </div>
                                        ))}
                                    </>
                                )}

                                {data.commentInter && (
                                    <div className="mt-4 p-3 bg-light rounded-3">
                                        <div className="fw-semibold small mb-1">Commentaire</div>
                                        <div className="small">{data.commentInter}</div>
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

export default PublicVerifyPage;