import React, { useState, useRef } from 'react';
import api from '../../services/api';
import {
  ACCEPT_MIME, MAX_SIZE_MB,
  ACCEPTED_EXTENSIONS, validateFile, getFileIcon,
} from '../../services/archiveService';
import notify from '../../services/notify';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ActivityDoc {
  key:         string;
  label:       string;
  description: string;
  icon:        string;
  color:       string;
  formats:     string[];
}

interface Props {
  show:      boolean;
  docType:   ActivityDoc | null;
  onHide:    () => void;
  onSuccess: () => void;
}

const formatSize = (b: number) =>
  b < 1024        ? `${b} o`
  : b < 1024*1024 ? `${(b / 1024).toFixed(1)} Ko`
  :                 `${(b / 1024 / 1024).toFixed(2)} Mo`;

const ActivityUploadModal: React.FC<Props> = ({ show, docType, onHide, onSuccess }) => {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [file,     setFile]     = useState<File | null>(null);
  const [note,     setNote]     = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  if (!show || !docType) return null;

  const reset = () => {
    setFile(null); setNote(''); setError(null); setProgress(0);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleClose = () => { reset(); onHide(); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setError(null);
    if (f) {
      const err = validateFile(f);
      if (err) { setError(err); setFile(null); e.target.value = ''; return; }
    }
    setFile(f);
  };

  const handleSubmit = async () => {
    if (!file) { setError('Veuillez sélectionner un fichier.'); return; }
    setLoading(true); setError(null); setProgress(0);
    try {
      const meta = {
        titre:       `${docType.label} — ${new Date().toLocaleDateString('fr-FR')}`,
        type:        'SCANNE',
        categorie:   'AUTRE',
        description: note || `Document activité : ${docType.label}`,
      };
      const formData = new FormData();
      formData.append('file', file);
      formData.append('data', new Blob([JSON.stringify(meta)], { type: 'application/json' }));

      await api.post('/api/archives/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e: any) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      notify.success(`${docType.label} importé avec succès`);
      reset(); onSuccess(); onHide();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Erreur lors de l'import. Réessayez.";
      setError(msg);
      notify.apiError(err, "Erreur lors de l'import du document");
    } finally { setLoading(false); }
  };

  const fileIcon = file ? getFileIcon(file.type, file.name) : null;

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}
        onClick={!loading ? handleClose : undefined} />

      <div className="modal fade show d-block" tabIndex={-1} style={{ zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow rounded-4">

            {/* Header */}
            <div className="modal-header border-0 pb-0">
              <div className="d-flex align-items-center gap-3">
                <div className={`rounded-3 bg-${docType.color} bg-opacity-10 d-flex align-items-center justify-content-center`}
                  style={{ width:'42px', height:'42px', minWidth:'42px' }}>
                  <i className={`bi ${docType.icon} text-${docType.color} fs-5`} />
                </div>
                <div>
                  <h6 className="fw-bold mb-0">Importer — {docType.label}</h6>
                  <small className="text-muted">{docType.description}</small>
                </div>
              </div>
              <button type="button" className="btn-close" onClick={handleClose} disabled={loading} />
            </div>

            <div className="modal-body pt-3">

              {/* Formats acceptés */}
              <div className="d-flex gap-1 mb-3 flex-wrap">
                {ACCEPTED_EXTENSIONS.map(ext => {
                  const fi = getFileIcon(undefined, `file.${ext}`);
                  return (
                    <span key={ext} className={`badge bg-${fi.color} bg-opacity-10 text-${fi.color}`}
                      style={{ fontSize: '11px' }}>
                      <i className={`bi ${fi.icon} me-1`} />{ext.toUpperCase()}
                    </span>
                  );
                })}
                <span className="badge bg-secondary bg-opacity-10 text-secondary" style={{ fontSize: '11px' }}>
                  Max {MAX_SIZE_MB} Mo
                </span>
              </div>

              {/* Zone de dépôt */}
              <div className="border border-2 rounded-3 p-4 text-center mb-3"
                style={{
                  borderColor: file ? '#22c55e' : '#dee2e6',
                  borderStyle: 'dashed',
                  background:  file ? '#f0fdf4' : '#f8fafc',
                  cursor:      'pointer',
                  transition:  'all .2s',
                }}
                onClick={() => fileRef.current?.click()}>
                <input ref={fileRef} type="file" accept={ACCEPT_MIME}
                  className="d-none" onChange={handleFileChange} />
                {file && fileIcon ? (
                  <>
                    <i className={`bi ${fileIcon.icon} text-${fileIcon.color} fs-2 d-block mb-2`} />
                    <p className="fw-semibold small mb-0 text-success">{file.name}</p>
                    <small className="text-muted">{formatSize(file.size)}</small>
                  </>
                ) : (
                  <>
                    <i className="bi bi-cloud-upload fs-2 text-muted d-block mb-2" />
                    <p className="small text-muted mb-0">
                      Cliquez pour sélectionner un fichier
                    </p>
                    <small className="text-muted">
                      PDF, DOC, DOCX, ZIP, RAR, 7Z — Max {MAX_SIZE_MB} Mo
                    </small>
                  </>
                )}
              </div>

              {/* Note */}
              <div className="mb-3">
                <label className="form-label small fw-semibold">
                  Note / description{' '}
                  <span className="text-muted fw-normal">(optionnel)</span>
                </label>
                <textarea className="form-control form-control-sm" rows={2}
                  placeholder="Ex : Rapport mission Abidjan — Avril 2026"
                  value={note} onChange={e => setNote(e.target.value)} disabled={loading} />
              </div>

              {/* Barre de progression */}
              {loading && (
                <div className="mb-3">
                  <div className="d-flex justify-content-between small text-muted mb-1">
                    <span>Upload en cours…</span><span>{progress}%</span>
                  </div>
                  <div className="progress" style={{ height: '6px' }}>
                    <div className="progress-bar progress-bar-striped progress-bar-animated"
                      style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              {error && (
                <div className="alert alert-danger py-2 small d-flex align-items-center gap-2 mb-0">
                  <i className="bi bi-exclamation-triangle-fill flex-shrink-0" />{error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer border-0 pt-0 gap-2">
              <button className="btn btn-sm btn-outline-secondary" onClick={handleClose} disabled={loading}>
                Annuler
              </button>
              <button className={`btn btn-sm btn-${docType.color} d-flex align-items-center gap-2`}
                onClick={handleSubmit} disabled={!file || loading}>
                {loading
                  ? <><span className="spinner-border spinner-border-sm" />Import en cours…</>
                  : <><i className="bi bi-cloud-upload" />Importer</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ActivityUploadModal;