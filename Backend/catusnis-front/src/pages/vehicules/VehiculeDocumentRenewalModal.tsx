import React, { useState } from 'react';
import api from '../../services/api';
import { ApiResponse } from '../../types';
import  notify from '../../services/notify';

interface Props {
  show:       boolean;
  onHide:     () => void;
  onSuccess:  () => void;
  vehiculeId: number;
  immatriculation: string;
  // Valeurs actuelles pour pré-remplissage
  dateFinAssurance?:        string | null;
  dateFinVisiteTechnique?:  string | null;
  dateFinVignette?:         string | null;
}

const TYPES_DOCUMENT = [
  { key: 'ASSURANCE',        label: 'Assurance',         icon: 'bi-shield-fill-check',  color: 'primary'  },
  { key: 'VISITE_TECHNIQUE', label: 'Visite technique',  icon: 'bi-clipboard2-check-fill', color: 'success' },
  { key: 'VIGNETTE',         label: 'Vignette',          icon: 'bi-patch-check-fill',    color: 'warning'  },
];

const VehiculeDocumentRenewalModal: React.FC<Props> = ({
  show, onHide, onSuccess, vehiculeId, immatriculation,
  dateFinAssurance, dateFinVisiteTechnique, dateFinVignette,
}) => {
  const [typeDocument,    setTypeDocument]    = useState('ASSURANCE');
  const [nouvelleDateDebut, setNouvelleDebut] = useState(new Date().toISOString().split('T')[0]);
  const [nouvelleDateFin,   setNouvelleFin]   = useState('');
  const [notes,           setNotes]           = useState('');
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');

  const dateFinActuelle = () => {
    if (typeDocument === 'ASSURANCE')        return dateFinAssurance;
    if (typeDocument === 'VISITE_TECHNIQUE') return dateFinVisiteTechnique;
    if (typeDocument === 'VIGNETTE')         return dateFinVignette;
    return null;
  };

  const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  const handleSubmit = async () => {
    if (!nouvelleDateDebut || !nouvelleDateFin) {
      setError('Les deux dates sont obligatoires.'); return;
    }
    if (nouvelleDateDebut >= nouvelleDateFin) {
      setError('La date de fin doit être postérieure à la date de début.'); return;
    }
    setLoading(true); setError('');
    try {
      await api.post<ApiResponse<any>>(`/api/vehicules/${vehiculeId}/renouveler-document`, {
        typeDocument,
        nouvelleDateDebut,
        nouvelleDateFin,
        notes: notes || null,
      });
      notify.success('Document renouvelé avec succès');
      onSuccess(); onHide();
      // Réinitialiser
      setNouvelleDebut(new Date().toISOString().split('T')[0]);
      setNouvelleFin(''); setNotes(''); setTypeDocument('ASSURANCE');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erreur lors du renouvellement.';
      setError(msg);
      notify.apiError(err, 'Erreur lors du renouvellement du document');
    } finally { setLoading(false); }
  };

  if (!show) return null;

  const typeConf = TYPES_DOCUMENT.find(t => t.key === typeDocument)!;

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow">
          <div className={`modal-header border-0 bg-${typeConf.color} text-white`}>
            <h5 className="modal-title">
              <i className={`bi ${typeConf.icon} me-2`} />
              Renouveler un document
            </h5>
            <button className="btn-close btn-close-white" onClick={onHide} />
          </div>

          <div className="modal-body p-4">
            {error && <div className="alert alert-danger">{error}</div>}

            {/* Engin */}
            <div className="alert alert-light border d-flex align-items-center gap-3 mb-4">
              <div className="rounded-3 bg-success bg-opacity-10 d-flex align-items-center justify-content-center"
                style={{ width:'44px', height:'44px', minWidth:'44px' }}>
                <i className="bi bi-car-front-fill text-success" />
              </div>
              <div>
                <p className="fw-semibold mb-0">{immatriculation}</p>
                <small className="text-muted">Renouvellement de document</small>
              </div>
            </div>

            {/* Type de document */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Type de document *</label>
              <div className="d-flex gap-2">
                {TYPES_DOCUMENT.map(t => (
                  <button key={t.key} type="button"
                    className={`btn btn-sm flex-grow-1 ${typeDocument === t.key
                      ? `btn-${t.color}`
                      : `btn-outline-${t.color}`}`}
                    onClick={() => setTypeDocument(t.key)}>
                    <i className={`bi ${t.icon} me-1`} />{t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date actuelle expirée */}
            {dateFinActuelle() && (
              <div className={`alert alert-sm mb-3 d-flex align-items-center gap-2 ${
                new Date(dateFinActuelle()!) < new Date() ? 'alert-danger' : 'alert-warning'
              }`} style={{fontSize:'12px'}}>
                <i className="bi bi-calendar-x-fill" />
                Date de fin actuelle : <strong>{fmtDate(dateFinActuelle())}</strong>
                {new Date(dateFinActuelle()!) < new Date() && (
                  <span className="badge bg-danger ms-1">Expirée</span>
                )}
              </div>
            )}

            <div className="row g-3">
              <div className="col-6">
                <label className="form-label fw-semibold">Nouvelle date de début *</label>
                <input type="date" className="form-control"
                  value={nouvelleDateDebut}
                  onChange={e => setNouvelleDebut(e.target.value)} />
              </div>
              <div className="col-6">
                <label className="form-label fw-semibold">Nouvelle date de fin *</label>
                <input type="date" className="form-control"
                  value={nouvelleDateFin}
                  onChange={e => setNouvelleFin(e.target.value)} />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold">Notes / Observations</label>
                <textarea className="form-control" rows={2}
                  placeholder="Ex: Renouvellement annuel, N° police 12345..."
                  value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="modal-footer border-0">
            <button className="btn btn-outline-secondary" onClick={onHide}>Annuler</button>
            <button className={`btn btn-${typeConf.color}`}
              onClick={handleSubmit} disabled={loading}>
              {loading && <span className="spinner-border spinner-border-sm me-2" />}
              <i className="bi bi-arrow-clockwise me-1" />Renouveler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehiculeDocumentRenewalModal;