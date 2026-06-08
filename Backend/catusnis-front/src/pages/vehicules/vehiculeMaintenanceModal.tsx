import React, { useState, useEffect } from 'react';
import VehiculeService, {
  VehiculeMaintenanceRequest, VehiculeMaintenanceResponse, VehiculeResponse
} from '../../services/vehiculeService';

interface Props {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
  maintenance?: VehiculeMaintenanceResponse | null;
  vehicules: VehiculeResponse[];
}

const VehiculeMaintenanceModal: React.FC<Props> = ({ show, onHide, onSuccess, maintenance, vehicules }) => {
  const [form, setForm] = useState<VehiculeMaintenanceRequest>({
    vehiculeId: 0, dateMaintenance: '', typeMaintenance: 'PREVENTIVE',
    description: '', statut: 'PLANIFIEE',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (maintenance) {
      setForm({
        vehiculeId:              maintenance.vehiculeId,
        dateMaintenance:         maintenance.dateMaintenance?.substring(0, 10) || '',
        typeMaintenance:         maintenance.typeMaintenance || 'PREVENTIVE',
        description:             maintenance.description,
        prestataire:             maintenance.prestataire,
        coutReel:                maintenance.coutReel,
        statut:                  maintenance.statut || 'PLANIFIEE',
        kilometrageIntervention: maintenance.kilometrageIntervention,
        observations:            maintenance.observations,
      });
    } else {
      setForm({ vehiculeId: 0, dateMaintenance: '', typeMaintenance: 'PREVENTIVE', description: '', statut: 'PLANIFIEE' });
    }
  }, [maintenance, show]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.vehiculeId || !form.dateMaintenance || !form.description.trim()) {
      setError('Véhicule, date et description sont obligatoires'); return;
    }
    setLoading(true); setError('');
    try {
      if (maintenance) await VehiculeService.updateMaintenance(maintenance.id, form);
      else             await VehiculeService.saveMaintenance(form);
      onSuccess(); onHide();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur');
    } finally { setLoading(false); }
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow">
          <div className="modal-header border-0 bg-success text-white">
            <h5 className="modal-title">
              <i className="bi bi-tools me-2" />
              {maintenance ? 'Modifier la maintenance' : 'Planifier une maintenance'}
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
                <label className="form-label fw-semibold">Date *</label>
                <input name="dateMaintenance" type="date" className="form-control"
                  value={form.dateMaintenance} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Type</label>
                <select name="typeMaintenance" className="form-select"
                  value={form.typeMaintenance} onChange={handleChange}>
                  <option value="PREVENTIVE">PRÉVENTIVE</option>
                  <option value="CURATIVE">CURATIVE</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Statut</label>
                <select name="statut" className="form-select"
                  value={form.statut || ''} onChange={handleChange}>
                  {['PLANIFIEE','EN_COURS','TERMINEE'].map(s =>
                    <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Kilométrage</label>
                <input name="kilometrageIntervention" type="number" className="form-control"
                  value={form.kilometrageIntervention || ''} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Prestataire</label>
                <input name="prestataire" className="form-control"
                  value={form.prestataire || ''} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Coût réel (FCFA)</label>
                <input name="coutReel" type="number" className="form-control"
                  value={form.coutReel || ''} onChange={handleChange} />
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
            <button className="btn btn-success" onClick={handleSubmit} disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
              {maintenance ? 'Modifier' : 'Planifier'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehiculeMaintenanceModal;