import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spinner, Badge, Alert, Button } from 'react-bootstrap';
import MainLayout from '../../components/common/MainLayout';
import InterventionService from '../../services/interventionService';
import { InterventionResponse } from '../../types';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const config: Record<string, { bg: string; label: string }> = {
        FONCTIONNEL:                  { bg: 'success',   label: '✅ Fonctionnel'     },
        DEGRADE:                      { bg: 'warning',   label: '⚠️ Dégradé'         },
        EN_ATTENTE_INTERVENTION_SITE: { bg: 'danger',    label: '🔴 En attente site' },
        NON_FONCTIONNEL:              { bg: 'danger',    label: '❌ Non fonctionnel'  },
        REMPLACE:                     { bg: 'secondary', label: '🔄 Remplacé'        },
    };
    const c = config[status] || { bg: 'secondary', label: status };
    return <Badge bg={c.bg}>{c.label}</Badge>;
};

const InfoRow: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
    <div className="d-flex border-bottom py-2">
        <div className="text-muted small fw-semibold" style={{ width: '180px', flexShrink: 0 }}>{label}</div>
        <div className="small">{value ?? '—'}</div>
    </div>
);

const InterventionDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [intervention, setIntervention] = useState<InterventionResponse | null>(null);
    const [loading,       setLoading]     = useState(true);
    const [error,         setError]       = useState<string | null>(null);
    const [downloading,   setDownloading] = useState(false);

    useEffect(() => {
        if (!id) return;
        InterventionService.getById(Number(id))
            .then(setIntervention)
            .catch(() => setError("Cette intervention n'a pas été trouvée."))
            .finally(() => setLoading(false));
    }, [id]);

    const handleDownload = async () => {
        if (!intervention) return;
        setDownloading(true);
        try {
            const blob = await InterventionService.downloadPdf(intervention.id);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `fiche-intervention-${intervention.codeInter}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            setError('Erreur lors du téléchargement du PDF.');
        } finally {
            setDownloading(false);
        }
    };

    const isStructureEnregistree = !!(intervention?.regionId && intervention?.districtId && intervention?.healthId);
    const isEquipmentHorsBase = !intervention?.deploymentId;

    return (
        <MainLayout title="Détail de l'intervention">
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    <Button variant="link" className="ps-0 mb-3 text-decoration-none" onClick={() => navigate('/interventions')}>
                        <i className="bi bi-arrow-left me-2" />Retour à la liste
                    </Button>

                    {loading ? (
                        <div className="text-center py-5"><Spinner /></div>
                    ) : error ? (
                        <Alert variant="danger" className="rounded-3">{error}</Alert>
                    ) : intervention ? (
                        <div className="card border-0 shadow-sm rounded-4">
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <h5 className="fw-bold mb-1">
                                            <i className="bi bi-tools text-primary me-2" />
                                            {intervention.codeInter}
                                        </h5>
                                        <div className="d-flex gap-2 flex-wrap">
                                            <Badge bg={intervention.typeInter === 'EN_LIGNE' ? 'primary' : 'success'}>
                                                <i className={`bi ${intervention.typeInter === 'EN_LIGNE' ? 'bi-telephone-fill' : 'bi-geo-alt-fill'} me-1`} />
                                                {intervention.typeInter === 'EN_LIGNE' ? 'En ligne' : 'Sur site'}
                                            </Badge>
                                            {(!isStructureEnregistree || isEquipmentHorsBase) && (
                                                <Badge style={{ background: 'rgba(79,70,229,0.15)', color: '#4f46e5' }}>
                                                    <i className="bi bi-pencil-square me-1" />Assistance technique
                                                </Badge>
                                            )}
                                            {intervention.enAttenteMaintenance && (
                                                <Badge bg="warning" text="dark">
                                                    <i className="bi bi-clock-history me-1" />En attente maintenance
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <Button variant="primary" className="rounded-3" onClick={handleDownload} disabled={downloading}>
                                        {downloading
                                            ? <><Spinner size="sm" className="me-2" />Téléchargement...</>
                                            : <><i className="bi bi-file-earmark-pdf me-2" />Télécharger PDF</>}
                                    </Button>
                                </div>

                                <hr />

                                <InfoRow label="Date" value={new Date(intervention.dateInter).toLocaleDateString('fr-FR')} />
                                <InfoRow label="Durée" value={`${intervention.durationMinutes} min`} />
                                <InfoRow label="Application" value={intervention.appName} />

                                {isStructureEnregistree ? (
                                    <>
                                        <InfoRow label="Région" value={intervention.regionName} />
                                        <InfoRow label="District" value={intervention.districtName} />
                                        <InfoRow label="Site" value={intervention.healthName} />
                                    </>
                                ) : (
                                    <InfoRow label="Structure" value={intervention.regionName || intervention.manualStructureName} />
                                )}

                                <InfoRow label="Réalisée par" value={intervention.technicianName} />
                                <InfoRow label="Personne assistée" value={intervention.personName} />

                                {isEquipmentHorsBase && intervention.manualEquipmentName && (
                                    <InfoRow label="Équipement (hors base)" value={
                                        intervention.manualEquipmentName +
                                        (intervention.manualEquipmentType ? ` (${intervention.manualEquipmentType})` : '')
                                    } />
                                )}

                                {intervention.partnerName && (
                                    <InfoRow label="Bailleur / Partenaire" value={intervention.partnerName} />
                                )}

                                {intervention.latitude != null && intervention.longitude != null && (
                                    <InfoRow label="Coordonnées GPS" value={
                                        `${intervention.latitude.toFixed(6)}, ${intervention.longitude.toFixed(6)}`
                                    } />
                                )}

                                {intervention.deploymentItems?.length > 0 && (
                                    <>
                                        <h6 className="fw-bold mt-4 mb-3">Équipements concernés</h6>
                                        <div className="table-responsive">
                                            <table className="table table-sm table-bordered">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Type</th><th>Tag</th><th>N° Série</th>
                                                        <th>État avant</th><th>État après</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {intervention.deploymentItems.map(item => (
                                                        <tr key={item.id}>
                                                            <td className="small">{item.typeName}</td>
                                                            <td className="small">{item.tag}</td>
                                                            <td className="small text-muted">{item.serial}</td>
                                                            <td><StatusBadge status={item.etatAvant || 'FONCTIONNEL'} /></td>
                                                            <td><StatusBadge status={item.etatApres || 'FONCTIONNEL'} /></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}

                                {intervention.commentInter && (
                                    <div className="mt-4 p-3 bg-light rounded-3">
                                        <div className="fw-semibold small mb-1">Commentaire</div>
                                        <div className="small">
                                            {intervention.commentInter.replace(/\s*\|\s*\[[^\]]*\][^|]*/g, '').trim()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </MainLayout>
    );
};

export default InterventionDetailPage;