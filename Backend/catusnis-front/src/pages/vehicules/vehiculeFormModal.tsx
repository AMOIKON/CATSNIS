import React, { useState, useEffect } from 'react';
import VehiculeService, { VehiculeRequest, VehiculeResponse } from '../../services/vehiculeService';
import RegionService   from '../../services/regionService';
import DistrictService from '../../services/districtService';
import BookletService  from '../../services/bookletService';
import { RegionResponse, DistrictResponse, Booklet } from '../../types';

interface Props {
  show: boolean; onHide: () => void; onSuccess: () => void;
  vehicule?: VehiculeResponse | null;
}

const VEHICULE_TYPES = ['VOITURE','MOTO','CAMION','MINIBUS','AUTRE'];
const STATUTS        = ['DISPONIBLE','EN_MISSION','EN_PANNE','EN_MAINTENANCE','RETIRE','REMIS'];
const MODES_FINANCEMENT = ['ACHAT_DIRECT','DON','LEASING','AUTRE'];

type FormState = VehiculeRequest & { conducteurBookletId?: number };

const VehiculeFormModal: React.FC<Props> = ({ show, onHide, onSuccess, vehicule }) => {
  const [form,      setForm]      = useState<FormState>({ immatriculation:'', type:'VOITURE' });
  const [regions,   setRegions]   = useState<RegionResponse[]>([]);
  const [districts, setDistricts] = useState<DistrictResponse[]>([]);
  const [booklets,  setBooklets]  = useState<Booklet[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [showAcq,   setShowAcq]   = useState(false);   // section acquisition repliable

  useEffect(() => {
    if (!show) return;
    RegionService.getAllList().then(setRegions);
    BookletService.getAll()
      .then((data: Booklet[]) => setBooklets(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [show]);

  useEffect(() => {
    if (vehicule) {
      setForm({
        immatriculation:        vehicule.immatriculation,
        type:                   vehicule.type,
        marque:                 vehicule.marque,
        modele:                 vehicule.modele,
        couleur:                vehicule.couleur,
        dateAcquisition:        vehicule.dateAcquisition,
        kilometrage:            vehicule.kilometrage,
        statut:                 vehicule.statut,
        numeroCarteGrise:       vehicule.numeroCarteGrise,
        dateAssurance:          vehicule.dateAssurance,
        dateFinAssurance:       vehicule.dateFinAssurance,
        dateVisiteTechnique:    vehicule.dateVisiteTechnique,
        dateFinVisiteTechnique: vehicule.dateFinVisiteTechnique,
        dateVignette:           vehicule.dateVignette,
        dateFinVignette:        vehicule.dateFinVignette,
        conducteurId:           vehicule.conducteurId,
        conducteurBookletId:    undefined,   // sera résolu par le useEffect booklets
        regionId:               vehicule.regionId,
        districtId:             vehicule.districtId,
        image:                  vehicule.image,
        observations:           vehicule.observations,
        prixAchat:              vehicule.prixAchat,
        fournisseur:            vehicule.fournisseur,
        modeFinancement:        vehicule.modeFinancement,
        numeroBonCommande:      vehicule.numeroBonCommande,
        sourceFinancement:      vehicule.sourceFinancement,
      });
      if (vehicule.prixAchat || vehicule.fournisseur || vehicule.modeFinancement) setShowAcq(true);
      else setShowAcq(false);
      if (vehicule.regionId) DistrictService.getAllList(vehicule.regionId).then(setDistricts);
    } else {
      setForm({ immatriculation:'', type:'VOITURE' });
      setShowAcq(false);
      setDistricts([]);
    }
  }, [vehicule, show]);

  // ✅ Pré-sélection booklet — 3 niveaux de fallback
  useEffect(() => {
    if (!vehicule || booklets.length === 0) return;

    let found: Booklet | undefined;

    // 1. Match direct par ID (depuis affectation active backend)
    if (vehicule.conducteurBookletId) {
      found = booklets.find(b => Number(b.id) === Number(vehicule.conducteurBookletId));
    }

    // 2. Fallback : match par conducteurActifNom (nom depuis affectation booklet)
    if (!found && vehicule.conducteurActifNom) {
      const nom = vehicule.conducteurActifNom.trim().toLowerCase();
      found = booklets.find(b =>
        `${b.lastName} ${b.firstName}`.toLowerCase() === nom ||
        `${b.firstName} ${b.lastName}`.toLowerCase() === nom
      );
    }

    // 3. Fallback : match par conducteurNom (Person système)
    if (!found && vehicule.conducteurNom) {
      const nom = vehicule.conducteurNom.trim().toLowerCase();
      found = booklets.find(b =>
        `${b.lastName} ${b.firstName}`.toLowerCase() === nom ||
        `${b.firstName} ${b.lastName}`.toLowerCase() === nom
      );
    }

    if (found) {
      setForm(prev => ({ ...prev, conducteurBookletId: Number(found!.id) }));
    }
  }, [booklets, vehicule]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setForm(prev => ({ ...prev, [e.target.name]: val === '' ? null : Number(val) }));
  };

  const handleRegionChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const regionId = Number(e.target.value) || undefined;
    setForm(prev => ({ ...prev, regionId, districtId: undefined }));
    setDistricts([]);
    if (regionId) setDistricts(await DistrictService.getAllList(regionId));
  };

  const handleBookletChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value) || undefined;
    setForm(prev => ({ ...prev, conducteurBookletId: id, conducteurId: undefined }));
  };

  const handleSubmit = async () => {
    if (!form.immatriculation.trim()) { setError("L'immatriculation est obligatoire"); return; }
    setLoading(true); setError('');
    try {
      if (vehicule) await VehiculeService.update(vehicule.id, form);
      else          await VehiculeService.save(form);
      onSuccess(); onHide();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally { setLoading(false); }
  };

  if (!show) return null;
  const isEdit = !!vehicule;
  const isMoto = form.type === 'MOTO';
  const selBooklet = booklets.find(b => b.id === Number(form.conducteurBookletId));

  return (
    <div className="modal show d-block" style={{ background:'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow">
          <div className={`modal-header border-0 ${isEdit?'bg-warning':'bg-success'} text-white`}>
            <h5 className="modal-title">
              <i className={`bi ${isEdit?'bi-pencil-fill':'bi-plus-circle-fill'} me-2`} />
              {isEdit ? 'Modifier le véhicule' : 'Enregistrer un engin roulant'}
            </h5>
            <button className="btn-close btn-close-white" onClick={onHide} />
          </div>

          <div className="modal-body p-4">
            {error && <div className="alert alert-danger">{error}</div>}

            {/* ── 1. Identification ─────────────────────────────────────── */}
            <p className="fw-bold text-success small mb-2 d-flex align-items-center gap-2">
              <span className="badge bg-success rounded-circle">1</span>
              <i className="bi bi-car-front-fill" /> Identification
            </p>
            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold">Immatriculation *</label>
                <input name="immatriculation" className="form-control"
                  value={form.immatriculation} onChange={handleChange} placeholder="CI-001-AB" />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Type *</label>
                <select name="type" className="form-select" value={form.type} onChange={handleChange}>
                  {VEHICULE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {isEdit && (
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Statut</label>
                  <select name="statut" className="form-select" value={form.statut||''} onChange={handleChange}>
                    {STATUTS.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
                  </select>
                </div>
              )}
              <div className="col-md-3">
                <label className="form-label fw-semibold">Marque</label>
                <input name="marque" className="form-control" value={form.marque||''} onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Modèle</label>
                <input name="modele" className="form-control" value={form.modele||''} onChange={handleChange} />
              </div>
              <div className="col-md-2">
                <label className="form-label fw-semibold">Couleur</label>
                <input name="couleur" className="form-control" value={form.couleur||''} onChange={handleChange} />
              </div>
              <div className="col-md-2">
                <label className="form-label fw-semibold">Kilométrage</label>
                <input name="kilometrage" type="number" className="form-control"
                  value={form.kilometrage||''} onChange={handleChange} />
              </div>
              <div className="col-md-2">
                <label className="form-label fw-semibold">N° Carte grise</label>
                <input name="numeroCarteGrise" className="form-control"
                  value={form.numeroCarteGrise||''} onChange={handleChange} />
              </div>
            </div>

            <hr />

            {/* ── 2. Documents administratifs ───────────────────────────── */}
            <p className="fw-bold text-success small mb-2 d-flex align-items-center gap-2">
              <span className="badge bg-success rounded-circle">2</span>
              <i className="bi bi-file-earmark-text-fill" /> Documents administratifs
            </p>
            <div className="row g-3 mb-3">
              <div className="col-md-3">
                <label className="form-label fw-semibold">Début assurance</label>
                <input name="dateAssurance" type="date" className="form-control"
                  value={form.dateAssurance ? String(form.dateAssurance).substring(0,10) : ''} onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Fin assurance</label>
                <input name="dateFinAssurance" type="date" className="form-control"
                  value={form.dateFinAssurance ? String(form.dateFinAssurance).substring(0,10) : ''} onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Début visite technique</label>
                <input name="dateVisiteTechnique" type="date" className="form-control"
                  value={form.dateVisiteTechnique ? String(form.dateVisiteTechnique).substring(0,10) : ''} onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Fin visite technique</label>
                <input name="dateFinVisiteTechnique" type="date" className="form-control"
                  value={form.dateFinVisiteTechnique ? String(form.dateFinVisiteTechnique).substring(0,10) : ''} onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Début vignette</label>
                <input name="dateVignette" type="date" className="form-control"
                  value={form.dateVignette ? String(form.dateVignette).substring(0,10) : ''} onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Fin vignette</label>
                <input name="dateFinVignette" type="date" className="form-control"
                  value={form.dateFinVignette ? String(form.dateFinVignette).substring(0,10) : ''} onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Date d'acquisition</label>
                <input name="dateAcquisition" type="date" className="form-control"
                  value={form.dateAcquisition ? String(form.dateAcquisition).substring(0,10) : ''} onChange={handleChange} />
              </div>
            </div>

            <hr />

            {/* ── 3. Conducteur / Convoyeur ─────────────────────────────── */}
            <p className="fw-bold text-success small mb-2 d-flex align-items-center gap-2">
              <span className="badge bg-success rounded-circle">3</span>
              <i className="bi bi-person-fill-check" /> {isMoto ? 'Convoyeur' : 'Conducteur'}
              <span className="badge bg-info bg-opacity-10 text-info fw-normal">Registre Booklet</span>
            </p>
            <div className="row g-3 mb-3">
              <div className="col-md-12">
                <label className="form-label fw-semibold">{isMoto ? 'Convoyeur' : 'Conducteur'}</label>
                {/* ✅ Badge conducteur actuel en mode édition */}
                {isEdit && (vehicule?.conducteurActifNom || vehicule?.conducteurNom) && !form.conducteurBookletId && (
                  <div className="mb-2 p-2 bg-warning bg-opacity-10 rounded-3 small d-flex align-items-center gap-2">
                    <i className="bi bi-person-fill text-warning" />
                    <span>Conducteur actuel : <strong>{vehicule.conducteurActifNom || vehicule.conducteurNom}</strong></span>
                    <span className="text-muted ms-1">— Sélectionnez dans le registre pour modifier</span>
                  </div>
                )}
                <select className="form-select" value={form.conducteurBookletId||''} onChange={handleBookletChange}>
                  <option value="">— Aucun —</option>
                  {booklets.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.lastName} {b.firstName}
                      {b.post?.postName  ? ` — ${b.post.postName}`        : ''}
                      {b.contact         ? ` | 📞 ${b.contact}`           : ''}
                      {b.region?.regionName ? ` · ${b.region.regionName}` : ''}
                    </option>
                  ))}
                </select>
                {selBooklet && (
                  <div className="mt-2 p-2 bg-success bg-opacity-10 rounded-3 small d-flex gap-3 align-items-center">
                    <div className="rounded-circle bg-success d-flex align-items-center justify-content-center text-white fw-bold"
                      style={{ width:36, height:36, minWidth:36 }}>
                      {selBooklet.lastName?.charAt(0)}{selBooklet.firstName?.charAt(0)}
                    </div>
                    <div>
                      <div className="fw-semibold">{selBooklet.lastName} {selBooklet.firstName}</div>
                      <div className="text-muted">
                        {selBooklet.contact && `📞 ${selBooklet.contact}`}
                        {selBooklet.post?.postName && ` | 💼 ${selBooklet.post.postName}`}
                      </div>
                    </div>
                  </div>
                )}
                {booklets.length === 0 && (
                  <small className="text-warning"><i className="bi bi-exclamation-triangle me-1" />Aucun booklet enregistré.</small>
                )}
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Région</label>
                <select className="form-select" value={form.regionId||''} onChange={handleRegionChange}>
                  <option value="">— Toutes les régions —</option>
                  {regions.map(r => <option key={r.id} value={r.id}>{r.regionName}</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">District</label>
                <select name="districtId" className="form-select"
                  value={form.districtId||''} onChange={handleChange} disabled={!form.regionId}>
                  <option value="">— Sélectionner —</option>
                  {districts.map(d => <option key={d.id} value={d.id}>{d.DistrictName}</option>)}
                </select>
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold">Observations</label>
                <textarea name="observations" className="form-control" rows={2}
                  value={form.observations||''} onChange={handleChange} />
              </div>
            </div>

            <hr />

            {/* ── 4. Acquisition (optionnel, repliable) ─────────────────── */}
            <div
              className="d-flex align-items-center gap-2 mb-2"
              style={{ cursor:'pointer' }}
              onClick={() => setShowAcq(v => !v)}>
              <p className="fw-bold text-secondary small mb-0 d-flex align-items-center gap-2 flex-grow-1">
                <span className="badge bg-secondary rounded-circle">4</span>
                <i className="bi bi-currency-dollar" /> Informations d'acquisition
                <span className="badge bg-secondary bg-opacity-10 text-secondary fw-normal">Optionnel</span>
              </p>
              <i className={`bi ${showAcq?'bi-chevron-up':'bi-chevron-down'} text-secondary`} />
            </div>

            {showAcq && (
              <div className="row g-3 mb-2 p-3 rounded-3" style={{ background:'#f8f9fa' }}>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Prix d'achat (FCFA)</label>
                  <input name="prixAchat" type="number" className="form-control"
                    value={form.prixAchat||''} onChange={handleNumberChange}
                    placeholder="Ex: 12500000" />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Fournisseur</label>
                  <input name="fournisseur" className="form-control"
                    value={form.fournisseur||''} onChange={handleChange}
                    placeholder="Nom du fournisseur / concessionnaire" />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Mode de financement</label>
                  <select name="modeFinancement" className="form-select"
                    value={form.modeFinancement||''} onChange={handleChange}>
                    <option value="">— Sélectionner —</option>
                    {MODES_FINANCEMENT.map(m => (
                      <option key={m} value={m}>{m.replace(/_/g,' ')}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Source de financement</label>
                  <input name="sourceFinancement" className="form-control"
                    value={form.sourceFinancement||''} onChange={handleChange}
                    placeholder="Ex: Budget état, UNICEF, Banque mondiale..." />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">N° Bon de commande</label>
                  <input name="numeroBonCommande" className="form-control"
                    value={form.numeroBonCommande||''} onChange={handleChange}
                    placeholder="Ex: BC-2024-001" />
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer border-0">
            <button className="btn btn-outline-secondary" onClick={onHide}>Annuler</button>
            <button className={`btn ${isEdit?'btn-warning':'btn-success'}`}
              onClick={handleSubmit} disabled={loading}>
              {loading && <span className="spinner-border spinner-border-sm me-2" />}
              {isEdit ? 'Modifier' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default VehiculeFormModal;