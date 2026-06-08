import React, { useState, useRef } from 'react';
import MainLayout from '../../components/common/MainLayout';
import useAuth from '../../hooks/useAuth';

// ─────────────────────────────────────────────────────────────────────────────
// Clés localStorage pour stocker les URLs des manuels
// ─────────────────────────────────────────────────────────────────────────────
const KEYS = {
    userManual: 'catusnis_user_manual',
    procManual: 'catusnis_proc_manual',
};

function getStoredUrl(key: string): string | null {
    return localStorage.getItem(key);
}

function storeFile(key: string, file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => { localStorage.setItem(key, reader.result as string); resolve(reader.result as string); };
        reader.onerror = () => reject(new Error('Lecture du fichier impossible.'));
        reader.readAsDataURL(file);
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Page Manuels
// ─────────────────────────────────────────────────────────────────────────────
const ManualPage: React.FC = () => {
    const { hasRole } = useAuth();
    const canUpload   = hasRole('ADMIN') || hasRole('SUPER_ADMIN');

    const [userManualUrl,  setUserManualUrl]  = useState<string | null>(getStoredUrl(KEYS.userManual));
    const [procManualUrl,  setProcManualUrl]  = useState<string | null>(getStoredUrl(KEYS.procManual));
    const [previewUrl,     setPreviewUrl]     = useState<string | null>(null);
    const [previewTitle,   setPreviewTitle]   = useState('');

    const [uploading,      setUploading]      = useState<string | null>(null);  // 'user' | 'proc'
    const [uploadError,    setUploadError]    = useState<string | null>(null);
    const [uploadSuccess,  setUploadSuccess]  = useState<string | null>(null);

    const userInputRef = useRef<HTMLInputElement>(null);
    const procInputRef = useRef<HTMLInputElement>(null);

    // ── Upload ────────────────────────────────────────────────────────────────
    const handleUpload = async (key: 'user' | 'proc', file: File | undefined) => {
        if (!file) return;
        if (file.type !== 'application/pdf') { setUploadError('Seuls les fichiers PDF sont acceptés.'); return; }
        if (file.size > 30 * 1024 * 1024)   { setUploadError('Fichier trop volumineux (max 30 Mo).'); return; }
        setUploading(key); setUploadError(null); setUploadSuccess(null);
        try {
            const url = await storeFile(key === 'user' ? KEYS.userManual : KEYS.procManual, file);
            if (key === 'user') setUserManualUrl(url);
            else                setProcManualUrl(url);
            setUploadSuccess(key === 'user' ? 'Manuel utilisateur mis à jour avec succès.' : 'Manuel de procédure mis à jour avec succès.');
        } catch {
            setUploadError('Erreur lors du chargement du fichier.');
        } finally { setUploading(null); }
    };

    return (
        <MainLayout title="Manuels">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 className="fw-bold mb-0">
                        <i className="bi bi-book-fill text-primary me-2" />Documentation
                    </h5>
                    <small className="text-muted">Manuels utilisateur et procédures CATUSNIS</small>
                </div>
            </div>

            {uploadError   && <div className="alert alert-danger   py-2 small mb-3"><i className="bi bi-exclamation-circle me-2" />{uploadError}</div>}
            {uploadSuccess && <div className="alert alert-success  py-2 small mb-3"><i className="bi bi-check-circle me-2" />{uploadSuccess}</div>}

            <div className="row g-4">
                {/* ── Manuel Utilisateur ── */}
                <div className="col-md-6">
                    <ManualCard
                        icon="bi-person-lines-fill"
                        color="primary"
                        title="Manuel Utilisateur"
                        description="Guide complet d'utilisation de CATUSNIS — navigation, gestion des équipements, déploiements et interventions."
                        hasFile={!!userManualUrl}
                        onView={() => { setPreviewUrl(userManualUrl); setPreviewTitle('Manuel Utilisateur'); }}
                        onDownload={() => downloadPdf(userManualUrl, 'CATUSNIS_Manuel_Utilisateur.pdf')}
                        canUpload={canUpload}
                        uploading={uploading === 'user'}
                        onUploadClick={() => userInputRef.current?.click()}
                    />
                    {canUpload && (
                        <input ref={userInputRef} type="file" accept=".pdf" className="d-none"
                            onChange={e => handleUpload('user', e.target.files?.[0])}
                            onClick={e => ((e.target as HTMLInputElement).value = '')} />
                    )}
                </div>

                {/* ── Manuel de Procédure ── */}
                <div className="col-md-6">
                    <ManualCard
                        icon="bi-file-earmark-text-fill"
                        color="success"
                        title="Manuel de Procédure"
                        description="Procédures opérationnelles — assignation des sites, circuits, déploiements, gestion des interventions et maintenance."
                        hasFile={!!procManualUrl}
                        onView={() => { setPreviewUrl(procManualUrl); setPreviewTitle('Manuel de Procédure'); }}
                        onDownload={() => downloadPdf(procManualUrl, 'CATUSNIS_Manuel_Procedure.pdf')}
                        canUpload={canUpload}
                        uploading={uploading === 'proc'}
                        onUploadClick={() => procInputRef.current?.click()}
                    />
                    {canUpload && (
                        <input ref={procInputRef} type="file" accept=".pdf" className="d-none"
                            onChange={e => handleUpload('proc', e.target.files?.[0])}
                            onClick={e => ((e.target as HTMLInputElement).value = '')} />
                    )}
                </div>
            </div>

            {/* ── Zone upload admin ── */}
            {canUpload && (
                <div className="card border-0 shadow-sm mt-4">
                    <div className="card-header bg-white border-bottom py-3 px-4">
                        <h6 className="fw-bold mb-0">
                            <i className="bi bi-cloud-upload text-warning me-2" />
                            Mettre à jour les manuels
                        </h6>
                        <small className="text-muted">Importez un nouveau fichier PDF pour remplacer la version actuelle</small>
                    </div>
                    <div className="card-body px-4 py-3">
                        <div className="row g-3">
                            <UploadZone
                                label="Manuel Utilisateur"
                                icon="bi-person-lines-fill"
                                color="primary"
                                uploading={uploading === 'user'}
                                onDrop={file => handleUpload('user', file)}
                                onBrowse={() => userInputRef.current?.click()}
                            />
                            <UploadZone
                                label="Manuel de Procédure"
                                icon="bi-file-earmark-text-fill"
                                color="success"
                                uploading={uploading === 'proc'}
                                onDrop={file => handleUpload('proc', file)}
                                onBrowse={() => procInputRef.current?.click()}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ── Visionneuse PDF ── */}
            {previewUrl && (
                <div className="modal d-block" style={{ background: 'rgba(0,0,0,.7)' }}>
                    <div className="modal-dialog modal-xl modal-dialog-centered" style={{ maxWidth: '90vw' }}>
                        <div className="modal-content border-0 shadow-lg" style={{ height: '88vh' }}>
                            <div className="modal-header py-2 px-4">
                                <h6 className="modal-title fw-bold mb-0">
                                    <i className="bi bi-file-pdf text-danger me-2" />{previewTitle}
                                </h6>
                                <div className="d-flex gap-2">
                                    <button className="btn btn-sm btn-outline-primary"
                                        onClick={() => downloadPdf(previewUrl, `CATUSNIS_${previewTitle.replace(' ', '_')}.pdf`)}>
                                        <i className="bi bi-download me-1" />Télécharger
                                    </button>
                                    <button type="button" className="btn-close"
                                        onClick={() => { setPreviewUrl(null); setPreviewTitle(''); }} />
                                </div>
                            </div>
                            <div className="modal-body p-0" style={{ flex: 1 }}>
                                <iframe src={previewUrl} width="100%" height="100%"
                                    style={{ border: 'none' }} title={previewTitle} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Carte manuel
// ─────────────────────────────────────────────────────────────────────────────
interface ManualCardProps {
    icon: string; color: string; title: string; description: string;
    hasFile: boolean; canUpload: boolean; uploading: boolean;
    onView: () => void; onDownload: () => void; onUploadClick: () => void;
}

const ManualCard: React.FC<ManualCardProps> = ({
    icon, color, title, description, hasFile, canUpload, uploading, onView, onDownload, onUploadClick,
}) => (
    <div className="card border-0 shadow-sm h-100">
        <div className="card-body p-4">
            <div className="d-flex align-items-center gap-3 mb-3">
                <div className={`rounded-3 d-flex align-items-center justify-content-center bg-${color} bg-opacity-10`}
                    style={{ width: 52, height: 52, flexShrink: 0 }}>
                    <i className={`bi ${icon} text-${color} fs-4`} />
                </div>
                <div>
                    <h6 className="fw-bold mb-0">{title}</h6>
                    <small className={`text-${hasFile ? 'success' : 'muted'}`}>
                        <i className={`bi bi-${hasFile ? 'check-circle-fill' : 'clock'} me-1`} />
                        {hasFile ? 'Document disponible' : 'Aucun document chargé'}
                    </small>
                </div>
            </div>

            <p className="text-muted small mb-4">{description}</p>

            <div className="d-flex gap-2 flex-wrap">
                {hasFile ? (
                    <>
                        <button className={`btn btn-${color} btn-sm`} onClick={onView}>
                            <i className="bi bi-eye me-1" />Consulter
                        </button>
                        <button className={`btn btn-outline-${color} btn-sm`} onClick={onDownload}>
                            <i className="bi bi-download me-1" />Télécharger
                        </button>
                    </>
                ) : (
                    <span className="badge bg-secondary bg-opacity-15 text-secondary px-3 py-2">
                        <i className="bi bi-info-circle me-1" />Document non encore chargé
                    </span>
                )}
                {canUpload && (
                    <button className="btn btn-outline-warning btn-sm ms-auto" onClick={onUploadClick}
                        disabled={uploading}>
                        {uploading
                            ? <><span className="spinner-border spinner-border-sm me-1" />Import...</>
                            : <><i className="bi bi-cloud-upload me-1" />Mettre à jour</>}
                    </button>
                )}
            </div>
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Zone drag & drop upload
// ─────────────────────────────────────────────────────────────────────────────
interface UploadZoneProps {
    label: string; icon: string; color: string; uploading: boolean;
    onDrop: (file: File) => void; onBrowse: () => void;
}

const UploadZone: React.FC<UploadZoneProps> = ({ label, icon, color, uploading, onDrop, onBrowse }) => {
    const [drag, setDrag] = useState(false);

    return (
        <div className="col-md-6">
            <div
                className={`border-2 rounded-3 p-4 text-center ${drag ? `border-${color} bg-${color} bg-opacity-5` : 'border-secondary'}`}
                style={{ borderStyle: 'dashed', cursor: 'pointer', transition: 'all .2s' }}
                onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={e => {
                    e.preventDefault(); setDrag(false);
                    const file = e.dataTransfer.files[0];
                    if (file) onDrop(file);
                }}
                onClick={onBrowse}>
                <i className={`bi ${icon} text-${color} fs-2 d-block mb-2`} />
                <div className="fw-semibold small mb-1">{label}</div>
                <div className="text-muted" style={{ fontSize: 11 }}>
                    {uploading
                        ? <><span className="spinner-border spinner-border-sm me-1" />Import en cours...</>
                        : 'Glissez un PDF ici ou cliquez pour parcourir'}
                </div>
                <div className="text-muted mt-1" style={{ fontSize: 10 }}>Format PDF · Max 30 Mo</div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper téléchargement
// ─────────────────────────────────────────────────────────────────────────────
function downloadPdf(dataUrl: string | null, filename: string) {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl; a.download = filename; a.click();
}

export default ManualPage;