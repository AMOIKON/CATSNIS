import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Row, Col, Spinner, Alert } from 'react-bootstrap';
import ArchiveService, {
  ArchiveResponse, CategorieArchive,
  ACCEPT_MIME, MAX_SIZE_MB,
  ACCEPTED_EXTENSIONS, validateFile, getFileIcon,
} from '../../services/archiveService';

const CAT_OPTIONS: { value: CategorieArchive; label: string }[] = [
  { value: 'INTERVENTION', label: 'Intervention' },
  { value: 'DEPLOIEMENT',  label: 'Déploiement'  },
  { value: 'ACQUISITION',  label: 'Acquisition'  },
  { value: 'BOOKLET',      label: 'Booklet'       },
  { value: 'AUTRE',        label: 'Autre'         },
];

const formatSize = (b: number) =>
  b < 1024        ? `${b} o`
  : b < 1024*1024 ? `${(b / 1024).toFixed(1)} Ko`
  :                 `${(b / 1024 / 1024).toFixed(2)} Mo`;

interface Props {
  show:      boolean;
  archive:   ArchiveResponse | null;
  onHide:    () => void;
  onSuccess: () => void;
}

const ArchiveUpdateModal: React.FC<Props> = ({ show, archive, onHide, onSuccess }) => {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [titre,       setTitre]       = useState('');
  const [description, setDescription] = useState('');
  const [categorie,   setCategorie]   = useState<CategorieArchive>('AUTRE');
  const [relatedCode, setRelatedCode] = useState('');        // ✅ Code texte (ex: INT-XXXXXX)
  const [relatedId,   setRelatedId]   = useState<string>(''); // ✅ ID numérique lié
  const [newFile,     setNewFile]     = useState<File | null>(null);
  const [replaceFile, setReplaceFile] = useState(false);
  const [isLoading,   setIsLoading]   = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // ── Pré-remplir au chargement ─────────────────────────────────────────────
  useEffect(() => {
    if (!show || !archive) return;
    setTitre(archive.titre       || '');
    setDescription(archive.description || '');
    setCategorie(archive.categorie   || 'AUTRE');
    setRelatedCode(archive.relatedCode || '');
    setRelatedId(archive.relatedId != null ? String(archive.relatedId) : '');
    setNewFile(null);
    setReplaceFile(false);
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  }, [show, archive]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setError(null);
    if (f) {
      const err = validateFile(f);
      if (err) { setError(err); e.target.value = ''; return; }
    }
    setNewFile(f);
  };

  const handleSubmit = async () => {
    if (!archive) return;
    if (!titre.trim()) { setError('Le titre est obligatoire.'); return; }
    if (replaceFile && !newFile) { setError('Veuillez sélectionner un nouveau fichier.'); return; }

    // Valider relatedId si saisi
    const relatedIdNum = relatedId.trim() ? Number(relatedId.trim()) : undefined;
    if (relatedId.trim() && isNaN(relatedIdNum!)) {
      setError("L'ID de référence doit être un nombre entier."); return;
    }

    setIsLoading(true); setError(null);
    try {
      const dto = {
        titre:       titre.trim(),
        description: description.trim() || undefined,
        categorie,
        relatedCode: relatedCode.trim() || undefined,
        relatedId:   relatedIdNum,
        type:        archive.type,
      };
      if (replaceFile && newFile) {
        await ArchiveService.updateWithFile(archive.id, newFile, dto);
      } else {
        await ArchiveService.update(archive.id, dto);
      }
      onSuccess(); onHide();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de la modification.');
    } finally { setIsLoading(false); }
  };

  if (!archive) return null;
  const isScanne    = archive.type === 'SCANNE';
  const currentIcon = getFileIcon(archive.mimeType, archive.fileName);
  const newIcon     = newFile ? getFileIcon(newFile.type, newFile.name) : null;

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold">
          <i className="bi bi-pencil-square text-warning me-2" />
          Modifier l'archive
          <span className="badge bg-warning bg-opacity-10 text-warning ms-2 small fw-normal">
            #{archive.id}
          </span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="px-4">
        {error && <Alert variant="danger" className="rounded-3">{error}</Alert>}

        {/* ── Résumé du document ── */}
        <div className="alert alert-light border rounded-3 mb-4 d-flex align-items-center gap-3">
          <i className={`bi ${currentIcon.icon} text-${currentIcon.color} fs-4 flex-shrink-0`} />
          <div>
            <p className="mb-0 fw-semibold small">{archive.titre}</p>
            <small className="text-muted">
              {isScanne ? 'Document scanné' : 'Document imprimé'}
              {archive.fileName && ` — ${archive.fileName}`}
              {archive.fileSize && ` (${formatSize(archive.fileSize)})`}
            </small>
          </div>
        </div>

        {/* ── Section Informations ── */}
        <div className="card border-0 bg-light rounded-4 p-3 mb-3">
          <h6 className="fw-bold text-warning mb-3">
            <i className="bi bi-info-circle me-2" />Informations générales
          </h6>
          <Row className="g-3">
            {/* Titre */}
            <Col md={12}>
              <Form.Label className="fw-semibold small">
                Titre <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text" value={titre}
                onChange={e => setTitre(e.target.value)}
                placeholder="Titre du document"
                className="rounded-3" size="sm" />
            </Col>

            {/* Catégorie */}
            <Col md={12}>
              <Form.Label className="fw-semibold small">Catégorie</Form.Label>
              <Form.Select
                value={categorie}
                onChange={e => setCategorie(e.target.value as CategorieArchive)}
                className="rounded-3" size="sm">
                {CAT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Form.Select>
            </Col>

            {/* Description */}
            <Col md={12}>
              <Form.Label className="fw-semibold small">Description</Form.Label>
              <Form.Control
                as="textarea" rows={2} value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Description du document..."
                className="rounded-3" size="sm" />
            </Col>
          </Row>
        </div>

        {/* ── Section Référence ── */}
        <div className="card border-0 bg-light rounded-4 p-3 mb-3">
          <h6 className="fw-bold text-warning mb-3">
            <i className="bi bi-link-45deg me-2" />Référence liée
          </h6>
          <Row className="g-3">
            {/* Code texte */}
            <Col md={7}>
              <Form.Label className="fw-semibold small">
                Code de référence
                <small className="text-muted fw-normal ms-1">(ex : INT-ACF6DB6D)</small>
              </Form.Label>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white">
                  <i className="bi bi-hash text-muted" />
                </span>
                <Form.Control
                  type="text" value={relatedCode}
                  onChange={e => setRelatedCode(e.target.value)}
                  placeholder="INT-XXXXXXXX"
                  className="rounded-end-3" />
              </div>
              <small className="text-muted" style={{ fontSize: '11px' }}>
                Code unique de l'entité liée (intervention, déploiement, etc.)
              </small>
            </Col>

            {/* ID numérique */}
            <Col md={5}>
              <Form.Label className="fw-semibold small">
                ID numérique
                <small className="text-muted fw-normal ms-1">(optionnel)</small>
              </Form.Label>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white">
                  <i className="bi bi-123 text-muted" />
                </span>
                <Form.Control
                  type="number" min={1} value={relatedId}
                  onChange={e => setRelatedId(e.target.value)}
                  placeholder="ex: 25"
                  className="rounded-end-3" />
              </div>
              <small className="text-muted" style={{ fontSize: '11px' }}>
                ID en base de l'entité liée
              </small>
            </Col>

            {/* Aperçu des valeurs actuelles si renseignées */}
            {(archive.relatedCode || archive.relatedId) && (
              <Col md={12}>
                <div className="p-2 bg-white rounded-3 border d-flex align-items-center gap-3 flex-wrap">
                  <small className="text-muted">Valeurs actuelles :</small>
                  {archive.relatedCode && (
                    <span className="badge bg-secondary bg-opacity-10 text-secondary font-monospace">
                      <i className="bi bi-hash me-1" />{archive.relatedCode}
                    </span>
                  )}
                  {archive.relatedId && (
                    <span className="badge bg-primary bg-opacity-10 text-primary font-monospace">
                      <i className="bi bi-123 me-1" />ID : {archive.relatedId}
                    </span>
                  )}
                </div>
              </Col>
            )}
          </Row>
        </div>

        {/* ── Section Fichier (SCANNE uniquement) ── */}
        {isScanne && (
          <div className="card border-0 bg-light rounded-4 p-3">
            <h6 className="fw-bold text-warning mb-3">
              <i className="bi bi-file-earmark-arrow-up me-2" />Fichier
            </h6>

            <Form.Check
              type="switch" id="replace-file-switch"
              label="Remplacer le fichier existant"
              checked={replaceFile}
              onChange={e => {
                setReplaceFile(e.target.checked);
                if (!e.target.checked) {
                  setNewFile(null);
                  if (fileRef.current) fileRef.current.value = '';
                }
              }}
              className="mb-3" />

            {replaceFile && (
              <>
                {/* Formats acceptés */}
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

                {/* Zone de dépôt */}
                <div
                  className="border border-2 rounded-3 p-3 text-center"
                  style={{
                    borderColor: newFile ? '#22c55e' : '#dee2e6',
                    borderStyle: 'dashed',
                    background:  newFile ? '#f0fdf4' : '#f8fafc',
                    cursor:      'pointer',
                  }}
                  onClick={() => fileRef.current?.click()}>
                  <input
                    ref={fileRef} type="file" accept={ACCEPT_MIME}
                    className="d-none" onChange={handleFileChange} />
                  {newFile && newIcon ? (
                    <>
                      <i className={`bi ${newIcon.icon} text-${newIcon.color} fs-3 d-block mb-1`} />
                      <p className="fw-semibold small mb-0 text-success">{newFile.name}</p>
                      <small className="text-muted">{formatSize(newFile.size)}</small>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-cloud-upload fs-3 text-muted d-block mb-1" />
                      <p className="small text-muted mb-0">Cliquez pour sélectionner un fichier</p>
                      <small className="text-muted">
                        PDF, DOC, DOCX, ZIP, RAR, 7Z — Max {MAX_SIZE_MB} Mo
                      </small>
                    </>
                  )}
                </div>
              </>
            )}

            {/* Fichier actuel conservé */}
            {!replaceFile && archive.fileName && (
              <div className="d-flex align-items-center gap-2 p-2 bg-white rounded-3 border">
                <i className={`bi ${currentIcon.icon} text-${currentIcon.color} fs-5`} />
                <div className="flex-grow-1 overflow-hidden">
                  <p className="small fw-semibold mb-0 text-truncate">{archive.fileName}</p>
                  <small className="text-muted">
                    {formatSize(archive.fileSize || 0)} — fichier actuel conservé
                  </small>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="border-0">
        <Button variant="light" onClick={onHide} className="rounded-3" disabled={isLoading}>
          Annuler
        </Button>
        <Button variant="warning" onClick={handleSubmit} disabled={isLoading}
          className="rounded-3 text-white">
          {isLoading
            ? <><Spinner size="sm" className="me-2" />Modification...</>
            : <><i className="bi bi-check-lg me-2" />Enregistrer les modifications</>
          }
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ArchiveUpdateModal;