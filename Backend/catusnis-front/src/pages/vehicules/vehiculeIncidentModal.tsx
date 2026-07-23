import React, { useState, useEffect } from 'react';
import VehiculeService, {
  VehiculeIncidentRequest, VehiculeIncidentResponse, VehiculeResponse
} from '../../services/vehiculeService';
import  notify  from '../../services/notify';

interface Props {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
  incident?: VehiculeIncidentResponse | null;
  vehicules: VehiculeResponse[];
}

const VehiculeIncidentModal: React.FC<Props> = ({ show, onHide, onSuccess, incident, vehicules }) => {
  const [form, setForm] = useState<VehiculeIncidentRequest>({
    vehiculeId: 0, dateIncident: '', description: '',
    typeIncident: 'PANNE', statut: 'OUVERT',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (incident) {
      setForm({
        vehiculeId:   incident.vehiculeId,
        dateIncident: incident.dateIncident?.substring(0, 10) || '',
        description:  incident.description,
        typeIncident: incident.typeIncident || 'PANNE',
        statut:       incident.statut || 'OUVERT',
        coutEstime:   incident.coutEstime,
        signalePar:   incident.signalePar,
        lieuIncident: incident.lieuIncident,
        observations: incident.observations,
      });
    } else {
      setForm({ vehiculeId: 0, dateIncident: '', description: '', typeIncident: 'PANNE', statut: 'OUVERT' });
    }
  }, [incident, show]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.vehiculeId || !form.dateIncident || !form.description.trim()) {
      setError('Véhicule, date et description sont obligatoires'); return;
    }
    setLoading(true); setError('');
    try {
      if (incident) {
        await VehiculeService.updateIncident(incident.id, form);
        notify.success('Incident modifié avec succès');
      } else {
        await VehiculeService.saveIncident(form);
        notify.success('Incident signalé avec succès');
      }
      onSuccess(); onHide();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erreur';
      setError(msg);
      notify.apiError(err, "Erreur lors de l'enregistrement de l'incident");
    } finally { setLoading(false); }
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow">
          <div className="modal-header border-0 bg-danger text-white">
            <h5 className="modal-title">
              <i className="bi bi-exclamation-triangle-fill me-2" />
              {incident ? 'Modifier l\'incident' : 'Signaler un incident'}
            </h5>
            <button className="btn-close btn-close-white" onClick={onHide} />
          </div>
          <div className="modal-body p-4">
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label fw-semibold">Véhicule *</label>
                <select name="vehiculeId" className="form-select"
                  value={form.vehiculeId} onChange={handleChange}>
                  <option value={0}>Sélectionner un véhicule</option>
                  {vehicules.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.immatriculation} — {v.type} {v.marque}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Date incident *</label>
                <input name="dateIncident" type="date" className="form-control"
                  value={form.dateIncident} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Type</label>
                <select name="typeIncident" className="form-select"
                  value={form.typeIncident || ''} onChange={handleChange}>
                  {['ACCIDENT','PANNE','VOL','AUTRE'].map(t =>
                    <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Statut</label>
                <select name="statut" className="form-select"
                  value={form.statut || ''} onChange={handleChange}>
                  {['OUVERT','EN_COURS','RESOLU'].map(s =>
                    <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Coût estimé (FCFA)</label>
                <input name="coutEstime" type="number" className="form-control"
                  value={form.coutEstime || ''} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Lieu</label>
                <input name="lieuIncident" className="form-control"
                  value={form.lieuIncident || ''} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Signalé par</label>
                <input name="signalePar" className="form-control"
                  value={form.signalePar || ''} onChange={handleChange} />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold">Description *</label>
                <textarea name="description" className="form-control" rows={3}
                  value={form.description} onChange={handleChange} />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold">Observations</label>
                <textarea name="observations" className="form-control" rows={2}
                  value={form.observations || ''} onChange={handleChange} />
              </div>
            </div>
          </div>
          <div className="modal-footer border-0">
            <button className="btn btn-outline-secondary" onClick={onHide}>Annuler</button>
            <button className="btn btn-danger" onClick={handleSubmit} disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
              {incident ? 'Modifier' : 'Signaler'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehiculeIncidentModal;