import React, { useState, useEffect } from 'react';
import VehiculeService, {
  VehiculeAffectationRequest,
  VehiculeAffectationResponse,
  VehiculeResponse,
} from '../../services/vehiculeService';
import RegionService   from '../../services/regionService';
import DistrictService from '../../services/districtService';
import BookletService  from '../../services/bookletService';
import { RegionResponse, DistrictResponse, Booklet } from '../../types';

interface Props {
  show:         boolean;
  onHide:       () => void;
  onSuccess:    () => void;
  vehicule:     VehiculeResponse | null;
  affectation?: VehiculeAffectationResponse | null;
}

const VehiculeAffectationModal: React.FC<Props> = ({
  show, onHide, onSuccess, vehicule, affectation
}) => {
  const [form,      setForm]      = useState<VehiculeAffectationRequest & { bookletId?: number }>({
    vehiculeId: 0, personId: 0, dateAffectation: new Date().toISOString().split('T')[0],
  });
  const [regions,   setRegions]   = useState<RegionResponse[]>([]);
  const [districts, setDistricts] = useState<DistrictResponse[]>([]);
  const [booklets,  setBooklets]  = useState<Booklet[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const isEdit = !!affectation;

  useEffect(() => {
    if (!show) return;
    RegionService.getAllList().then(setRegions);
    // ✅ Charger TOUS les booklets sans filtre
    BookletService.getAll()
      .then((data: Booklet[]) => setBooklets(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [show]);

  useEffect(() => {
    if (!show) return;
    if (affectation) {
      setForm({
        vehiculeId:      affectation.vehiculeId,
        personId:        affectation.personId || 0,
        bookletId:       affectation.bookletId || undefined,
        regionId:        affectation.regionId,
        districtId:      affectation.districtId,
        dateAffectation: affectation.dateAffectation?.substring(0, 10) || '',
        dateRetour:      affectation.dateRetour?.substring(0, 10) || '',
        motif:           affectation.motif || '',
        observations:    affectation.observations || '',
      });
      if (affectation.regionId) DistrictService.getAllList(affectation.regionId).then(setDistricts);
    } else if (vehicule) {
      setForm({
        vehiculeId:      vehicule.id,
        personId:        0,
        bookletId:       undefined,
        regionId:        vehicule.regionId || undefined,
        districtId:      vehicule.districtId || undefined,
        dateAffectation: new Date().toISOString().split('T')[0],
      });
      if (vehicule.regionId) DistrictService.getAllList(vehicule.regionId).then(setDistricts);
    }
  }, [show, affectation, vehicule]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleRegionChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const regionId = Number(e.target.value) || undefined;
    setForm(prev => ({ ...prev, regionId, districtId: undefined }));
    setDistricts([]);
    if (regionId) setDistricts(await DistrictService.getAllList(regionId));
  };

  // ✅ Sélection depuis le registre booklet
  const handleBookletChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value) || undefined;
    setForm(prev => ({ ...prev, bookletId: id, personId: 0 }));
  };

  const handleSubmit = async () => {
    if (!form.bookletId && !form.personId) {
      setError('Veuillez sélectionner un conducteur / convoyeur.'); return;
    }
    if (!form.dateAffectation) { setError("La date d'affectation est obligatoire."); return; }
    setLoading(true); setError('');
    try {
      const payload = { ...form };
      if (isEdit && affectation) await VehiculeService.updateAffectation(affectation.id, payload);
      else                       await VehiculeService.affecter(payload);
      onSuccess(); onHide();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Erreur lors de l'affectation.");
    } finally { setLoading(false); }
  };

  if (!show || !vehicule) return null;
  const isMoto = vehicule.type === 'MOTO';

  return (
    <div className="modal show d-block" style={{ background:'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow">
          <div className="modal-header border-0 bg-primary text-white">
            <h5 className="modal-title">
              <i className="bi bi-person-fill-check me-2" />
              {isEdit ? "Modifier l'affectation" : `Affecter un ${isMoto ? 'convoyeur' : 'conducteur'}`}
            </h5>
            <button className="btn-close btn-close-white" onClick={onHide} />
          </div>

          <div className="modal-body p-4">
            {error && <div className="alert alert-danger">{error}</div>}

            {/* Info véhicule */}
            <div className="alert alert-light border d-flex align-items-center gap-3 mb-4">
              <div className="rounded-3 bg-primary bg-opacity-10 d-flex align-items-center justify-content-center"
                style={{ width:'44px', height:'44px', minWidth:'44px' }}>
                <i className="bi bi-car-front-fill text-primary" />
              </div>
              <div>
                <p className="fw-semibold mb-0">{vehicule.immatriculation}</p>
                <small className="text-muted">
                  {vehicule.type}{vehicule.marque && ` — ${vehicule.marque}`}
                  {vehicule.conducteurNom && (
                    <span className="ms-2 badge bg-warning bg-opacity-10 text-warning">
                      Conducteur actuel : {vehicule.conducteurNom}
                    </span>
                  )}
                </small>
              </div>
            </div>

            {!isEdit && vehicule.conducteurNom && (
              <div className="alert alert-warning d-flex align-items-center gap-2 mb-4">
                <i className="bi bi-arrow-repeat" />
                <span className="small">Ce véhicule est déjà affecté à <strong>{vehicule.conducteurNom}</strong>.
                  L'ancienne affectation sera clôturée automatiquement.</span>
              </div>
            )}

            <div className="row g-3">
              {/* ✅ Sélection depuis le registre Booklet */}
              <div className="col-12">
                <label className="form-label fw-semibold">
                  {isMoto ? 'Convoyeur *' : 'Conducteur *'}
                  <span className="badge bg-info bg-opacity-10 text-info ms-2 fw-normal">Registre Booklet</span>
                </label>
                <select className="form-select" value={form.bookletId || ''} onChange={handleBookletChange}>
                  <option value="">— Sélectionner dans le registre —</option>
                  {booklets.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.lastName} {b.firstName}
                      {b.post?.postName  ? ` — ${b.post.postName}`         : ''}
                      {b.contact         ? ` | 📞 ${b.contact}`            : ''}
                      {b.region?.regionName ? ` · ${b.region.regionName}`  : ''}
                    </option>
                  ))}
                </select>
                {booklets.length === 0 && (
                  <small className="text-warning">
                    <i className="bi bi-exclamation-triangle me-1" />
                    Aucun booklet enregistré. Ajoutez des personnes dans le module Booklets.
                  </small>
                )}
                {form.bookletId && (() => {
                  const sel = booklets.find(b => b.id === Number(form.bookletId));
                  return sel ? (
                    <div className="mt-2 p-2 bg-primary bg-opacity-10 rounded-3 small d-flex gap-3 align-items-center">
                      <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold"
                        style={{ width:36, height:36, minWidth:36 }}>
                        {sel.lastName?.charAt(0)}{sel.firstName?.charAt(0)}
                      </div>
                      <div>
                        <div className="fw-semibold">{sel.lastName} {sel.firstName}</div>
                        <div className="text-muted">
                          {sel.contact && `📞 ${sel.contact}`}
                          {sel.post?.postName && ` | 💼 ${sel.post.postName}`}
                          {sel.district?.districtName && ` | 📍 ${sel.district.districtName}`}
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Date affectation */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">Date d'affectation *</label>
                <input name="dateAffectation" type="date" className="form-control"
                  value={form.dateAffectation} onChange={handleChange} />
              </div>

              {/* Date retour */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">Date de retour prévue</label>
                <input name="dateRetour" type="date" className="form-control"
                  value={form.dateRetour || ''} onChange={handleChange} />
              </div>

              {/* Région */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">Région d'affectation</label>
                <select className="form-select" value={form.regionId || ''} onChange={handleRegionChange}>
                  <option value="">— Aucune —</option>
                  {regions.map(r => <option key={r.id} value={r.id}>{r.regionName}</option>)}
                </select>
              </div>

              {/* District */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">District</label>
                <select name="districtId" className="form-select"
                  value={form.districtId || ''} onChange={handleChange} disabled={!form.regionId}>
                  <option value="">— Aucun —</option>
                  {districts.map(d => <option key={d.id} value={d.id}>{d.DistrictName}</option>)}
                </select>
              </div>

              {/* Motif */}
              <div className="col-12">
                <label className="form-label fw-semibold">Motif</label>
                <input name="motif" className="form-control" value={form.motif || ''}
                  onChange={handleChange} placeholder="Ex: Mission terrain, Remplacement conducteur..." />
              </div>

              {/* Observations */}
              <div className="col-12">
                <label className="form-label fw-semibold">Observations</label>
                <textarea name="observations" className="form-control" rows={2}
                  value={form.observations || ''} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="modal-footer border-0">
            <button className="btn btn-outline-secondary" onClick={onHide}>Annuler</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading && <span className="spinner-border spinner-border-sm me-2" />}
              {isEdit ? 'Modifier' : 'Affecter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default VehiculeAffectationModal;