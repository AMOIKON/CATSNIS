import React, { useState, useRef } from 'react';
import ArchiveService, {
  TypeArchive, CategorieArchive, ArchiveRequest,
  ACCEPT_MIME, MAX_SIZE_MB, ACCEPTED_EXTENSIONS,
  validateFile, getFileIcon,
} from '../../services/archiveService';
import useAuth from '../../hooks/useAuth';

interface Props {
  show:      boolean;
  onHide:    () => void;
  onSuccess: () => void;
}

const CATEGORIES: { value: CategorieArchive; label: string; icon: string; color: string }[] = [
  { value: 'INTERVENTION', label: 'Intervention', icon: 'bi-tools',         color: 'primary'   },
  { value: 'DEPLOIEMENT',  label: 'Déploiement',  icon: 'bi-truck',         color: 'info'      },
  { value: 'ACQUISITION',  label: 'Acquisition',  icon: 'bi-box-seam-fill', color: 'warning'   },
  { value: 'BOOKLET',      label: 'Booklet',      icon: 'bi-journal-text',  color: 'success'   },
  { value: 'AUTRE',        label: 'Autre',        icon: 'bi-folder-fill',   color: 'secondary' },
];

const formatSize = (b: number) =>
  b < 1024        ? `${b} o`
  : b < 1024*1024 ? `${(b / 1024).toFixed(1)} Ko`
  :                 `${(b / 1024 / 1024).toFixed(2)} Mo`;

const ArchiveFormModal: React.FC<Props> = ({ show, onHide, onSuccess }) => {
  const { person } = useAuth();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [mode,        setMode]        = useState<TypeArchive>('SCANNE');
  const [file,        setFile]        = useState<File | null>(null);
  const [preview,     setPreview]     = useState<string | null>(null);
  const [dragOver,    setDragOver]    = useState(false);
  const [titre,       setTitre]       = useState('');
  const [categorie,   setCategorie]   = useState<CategorieArchive>('AUTRE');
  const [description, setDescription] = useState('');
  const [relatedCode, setRelatedCode] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  const reset = () => {
    setFile(null); setPreview(null); setTitre('');
    setCategorie('AUTRE'); setDescription(''); setRelatedCode('');
    setError(''); setMode('SCANNE');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleFile = (selected: File) => {
    setError('');
    // ✅ Validation centralisée (taille + extension depuis archiveService)
    const err = validateFile(selected);
    if (err) { setError(err); return; }

    setFile(selected);
    // Aperçu uniquement pour les images
    setPreview(selected.type.startsWith('image/') ? URL.createObjectURL(selected) : null);
  };

  const handleSubmit = async () => {
    if (!titre.trim()) { setError('Le titre est obligatoire.'); return; }
    if (mode === 'SCANNE' && !file) { setError('Veuillez sélectionner un fichier.'); return; }

    setLoading(true); setError('');
    try {
      const dto: ArchiveRequest = {
        titre,
        type:        mode,
        categorie,
        description: description || undefined,
        archivedBy:  person ? `${person.firstName} ${person.lastName}` : undefined,
        relatedCode: relatedCode || undefined,
      };
      if (mode === 'SCANNE' && file) {
        await ArchiveService.uploadScanne(file, dto);
      } else {
        await ArchiveService.archiverImprime(dto);
      }
      onSuccess(); onHide(); reset();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Erreur lors de l'archivage.");
    } finally { setLoading(false); }
  };

  if (!show) return null;

  // Icône du fichier sélectionné
  const fileIconInfo = file ? getFileIcon(file.type, file.name) : null;

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <div className="modal-content border-0 shadow">

          {/* ── Header ── */}
          <div className="modal-header border-0 bg-primary text-white">
            <h5 className="modal-title">
              <i className="bi bi-folder-plus me-2" />Archiver un document
            </h5>
            <button className="btn-close btn-close-white"
              onClick={() => { onHide(); reset(); }} />
          </div>

          <div className="modal-body p-4">
            {error && (
              <div className="alert alert-danger rounded-3 d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-triangle-fill flex-shrink-0" />{error}
              </div>
            )}

            {/* ── Choix du mode ── */}
            <div className="d-flex gap-2 mb-4">
              <button type="button"
                className={`btn flex-grow-1 ${mode === 'SCANNE' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setMode('SCANNE')}>
                <i className="bi bi-cloud-upload me-2" />Document scanné / fichier
              </button>
              <button type="button"
                className={`btn flex-grow-1 ${mode === 'IMPRIME' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                onClick={() => setMode('IMPRIME')}>
                <i className="bi bi-printer-fill me-2" />Document imprimé
              </button>
            </div>

            {/* ── Zone de drop (SCANNE) ── */}
            {mode === 'SCANNE' && (
              <>
                {/* ✅ Badges formats acceptés */}
                <div className="d-flex gap-1 flex-wrap mb-3">
                  {ACCEPTED_EXTENSIONS.map(ext => {
                    const fi = getFileIcon(undefined, `file.${ext}`);
                    return (
                      <span key={ext}
                        className={`badge bg-${fi.color} bg-opacity-10 text-${fi.color}`}
                        style={{ fontSize: '11px' }}>
                        <i className={`bi ${fi.icon} me-1`} />{ext.toUpperCase()}
                      </span>
                    );
                  })}
                  <span className="badge bg-secondary bg-opacity-10 text-secondary"
                    style={{ fontSize: '11px' }}>
                    Max {MAX_SIZE_MB} Mo
                  </span>
                </div>

                <div
                  className="rounded-4 text-center p-4 mb-4"
                  style={{
                    border:     `2px dashed ${dragOver ? '#0d6efd' : '#dee2e6'}`,
                    background:  dragOver ? 'rgba(13,110,253,0.05)' : '#f8f9fa',
                    cursor:     'pointer',
                    transition: 'all .2s',
                  }}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e  => { e.preventDefault(); setDragOver(true);  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => {
                    e.preventDefault(); setDragOver(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) handleFile(f);
                  }}>
                  {file && fileIconInfo ? (
                    <div className="d-flex align-items-center justify-content-center gap-3">
                      {/* Aperçu image ou icône générique */}
                      {preview ? (
                        <img src={preview} alt="aperçu" className="rounded-3"
                          style={{ width: '72px', height: '72px', objectFit: 'cover' }} />
                      ) : (
                        <div className={`rounded-3 bg-${fileIconInfo.color} bg-opacity-10 d-flex align-items-center justify-content-center`}
                          style={{ width: '72px', height: '72px', minWidth: '72px' }}>
                          <i className={`bi ${fileIconInfo.icon} text-${fileIconInfo.color} fs-2`} />
                        </div>
                      )}
                      <div className="text-start">
                        <p className="fw-semibold mb-0 small">{file.name}</p>
                        <small className="text-muted">{formatSize(file.size)}</small>
                        <div className="mt-1">
                          <button className="btn btn-sm btn-outline-secondary"
                            onClick={e => { e.stopPropagation(); setFile(null); setPreview(null); }}>
                            <i className="bi bi-x-circle me-1" />Changer
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <i className="bi bi-cloud-upload fs-1 text-muted mb-2 d-block" />
                      <p className="fw-semibold mb-1">Glisser-déposer ou cliquer</p>
                      <small className="text-muted">
                        PDF, DOC, DOCX, ZIP, RAR, 7Z, Images — max {MAX_SIZE_MB} Mo
                      </small>
                    </>
                  )}
                  <input
                    ref={fileRef} type="file" className="d-none"
                    accept={ACCEPT_MIME}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                  />
                </div>
              </>
            )}

            {mode === 'IMPRIME' && (
              <div className="alert alert-secondary d-flex align-items-center gap-2 mb-4">
                <i className="bi bi-info-circle-fill" />
                <span className="small">
                  Le document sera enregistré comme imprimé sans fichier numérique joint.
                </span>
              </div>
            )}

            {/* ── Métadonnées ── */}
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label fw-semibold">Titre <span className="text-danger">*</span></label>
                <input className="form-control" value={titre}
                  onChange={e => setTitre(e.target.value)}
                  placeholder="Ex : Fiche intervention CI-001" />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold">Catégorie <span className="text-danger">*</span></label>
                <div className="d-flex gap-2 flex-wrap">
                  {CATEGORIES.map(cat => (
                    <button key={cat.value} type="button"
                      className={`btn btn-sm ${categorie === cat.value
                        ? `btn-${cat.color}` : `btn-outline-${cat.color}`}`}
                      onClick={() => setCategorie(cat.value)}>
                      <i className={`bi ${cat.icon} me-1`} />{cat.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Code de référence</label>
                <input className="form-control" value={relatedCode}
                  onChange={e => setRelatedCode(e.target.value)}
                  placeholder="Ex : INT-2025-001" />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold">Description</label>
                <textarea className="form-control" rows={2} value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Description optionnelle..." />
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="modal-footer border-0">
            <button className="btn btn-outline-secondary"
              onClick={() => { onHide(); reset(); }}>Annuler</button>
            <button className="btn btn-primary d-flex align-items-center gap-2"
              onClick={handleSubmit} disabled={loading}>
              {loading
                ? <><span className="spinner-border spinner-border-sm" />Archivage…</>
                : <><i className="bi bi-archive-fill" />Archiver</>
              }
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ArchiveFormModal;