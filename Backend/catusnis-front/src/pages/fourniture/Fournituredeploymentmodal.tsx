import React, { useState, useEffect } from 'react';
import FournitureService, {
  FournitureDeploiementRequest, FournitureDeploiementResponse, FournitureResponse,
} from '../../services/Fournitureservice';
import RegionService   from '../../services/regionService';
import DistrictService from '../../services/districtService';
import BookletService  from '../../services/bookletService';
import { RegionResponse, DistrictResponse, Booklet } from '../../types';

interface Props {
  show:          boolean;
  fourniture:    FournitureResponse | null;
  deploiement?:  FournitureDeploiementResponse | null;
  onHide:        () => void;
  onSuccess:     () => void;
}

const FournitureDeploymentModal: React.FC<Props> = ({
  show, fourniture, deploiement, onHide, onSuccess,
}) => {
  const [form,      setForm]      = useState<FournitureDeploiementRequest>({
    fournitureId: 0, quantiteDeployee: 1,
  });
  const [regions,   setRegions]   = useState<RegionResponse[]>([]);
  const [districts, setDistricts] = useState<DistrictResponse[]>([]);
  const [booklets,  setBooklets]  = useState<Booklet[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  useEffect(() => {
    if (!show) return;
    RegionService.getAllList().then(setRegions).catch(console.error);
    BookletService.getAll()
      .then((d: Booklet[]) => setBooklets(Array.isArray(d) ? d : []))
      .catch(console.error);
  }, [show]);

  useEffect(() => {
    if (!show || !fourniture) return;
    if (deploiement) {
      setForm({
        fournitureId:     fourniture.id,
        bookletId:        deploiement.bookletId ?? undefined,
        personId:         deploiement.personId  ?? undefined,
        quantiteDeployee: deploiement.quantiteDeployee,
        dateDeploiement:  deploiement.dateDeploiement?.substring(0, 10),
        motif:            deploiement.motif    || '',
        regionId:         deploiement.regionId  ?? undefined,
        districtId:       deploiement.districtId ?? undefined,
        notes:            deploiement.notes    || '',
      });
      if (deploiement.regionId)
        DistrictService.getAllList(deploiement.regionId).then(setDistricts).catch(console.error);
    } else {
      setForm({
        fournitureId:     fourniture.id,
        quantiteDeployee: 1,
        dateDeploiement:  new Date().toISOString().substring(0, 10),
      });
      setDistricts([]);
    }
    setError('');
  }, [show, fourniture, deploiement]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleRegionChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const regionId = Number(e.target.value) || undefined;
    setForm(prev => ({ ...prev, regionId, districtId: undefined }));
    setDistricts([]);
    if (regionId) setDistricts(await DistrictService.getAllList(regionId));
  };

  const handleBookletChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value) || undefined;
    setForm(prev => ({ ...prev, bookletId: id, personId: undefined }));
  };

  const handleSubmit = async () => {
    if (!form.bookletId && !form.personId) { setError('Veuillez sélectionner un bénéficiaire.'); return; }
    if (!form.quantiteDeployee || form.quantiteDeployee < 1) { setError('Quantité invalide.'); return; }
    if (fourniture && !deploiement && form.quantiteDeployee > fourniture.quantiteDisponible) {
      setError(`Stock insuffisant. Disponible : ${fourniture.quantiteDisponible} ${fourniture.unite}`);
      return;
    }
    setLoading(true); setError('');
    try {
      const payload: FournitureDeploiementRequest = {
        ...form,
        quantiteDeployee: Number(form.quantiteDeployee),
        regionId:         form.regionId   ? Number(form.regionId)   : undefined,
        districtId:       form.districtId ? Number(form.districtId) : undefined,
      };
      if (deploiement) await FournitureService.updateDeploiement(deploiement.id, payload);
      else             await FournitureService.deployer(payload);
      onSuccess(); onHide();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors du déploiement.');
    } finally { setLoading(false); }
  };

  if (!show || !fourniture) return null;
  const isEdit    = !!deploiement;
  const selBooklet = booklets.find(b => b.id === Number(form.bookletId));

  return (
    <div className="modal show d-block" style={{ background:'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow">
          <div className={`modal-header border-0 ${isEdit ? 'bg-warning' : 'bg-primary'} text-white`}>
            <h5 className="modal-title">
              <i className="bi bi-box-arrow-right me-2" />
              {isEdit ? 'Modifier le déploiement' : `Déployer — ${fourniture.designation}`}
            </h5>
            <button className="btn-close btn-close-white" onClick={onHide} />
          </div>

          <div className="modal-body p-4">
            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3">
                <i className="bi bi-exclamation-triangle-fill flex-shrink-0" />{error}
              </div>
            )}

            {/* Info stock */}
            {!isEdit && (
              <div className="alert alert-info d-flex align-items-center gap-3 mb-4 rounded-4">
                <div className="rounded-3 bg-primary bg-opacity-10 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width:'48px', height:'48px' }}>
                  <i className="bi bi-box-seam-fill text-primary fs-4" />
                </div>
                <div>
                  <div className="fw-semibold">{fourniture.code} — {fourniture.designation}</div>
                  <div className="small text-muted">
                    Stock disponible : <strong className="text-success">{fourniture.quantiteDisponible} {fourniture.unite}</strong>
                    {' | '}Total : <strong>{fourniture.quantite} {fourniture.unite}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* ── Bénéficiaire ── */}
            <p className="fw-bold text-primary small mb-2 d-flex align-items-center gap-2">
              <span className="badge bg-primary rounded-circle">1</span>
              <i className="bi bi-person-fill-check" />Bénéficiaire (Registre Booklet)
            </p>
            <div className="mb-3">
              <select className="form-select" value={form.bookletId || ''} onChange={handleBookletChange}>
                <option value="">— Sélectionner une personne —</option>
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
                <div className="mt-2 p-2 bg-primary bg-opacity-10 rounded-3 small d-flex gap-3 align-items-center">
                  <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold"
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
            </div>

            <hr />

            {/* ── Quantité & Date ── */}
            <p className="fw-bold text-primary small mb-2 d-flex align-items-center gap-2">
              <span className="badge bg-primary rounded-circle">2</span>
              <i className="bi bi-123" />Déploiement
            </p>
            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold">Quantité *</label>
                <input name="quantiteDeployee" type="number" min={1}
                  max={isEdit ? undefined : fourniture.quantiteDisponible}
                  className="form-control"
                  value={form.quantiteDeployee} onChange={handleChange} />
                {!isEdit && (
                  <small className="text-muted">Max : {fourniture.quantiteDisponible} {fourniture.unite}</small>
                )}
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Date de déploiement</label>
                <input name="dateDeploiement" type="date" className="form-control"
                  value={form.dateDeploiement || ''} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Motif</label>
                <input name="motif" className="form-control"
                  value={form.motif || ''} onChange={handleChange}
                  placeholder="Ex : Mission terrain" />
              </div>
            </div>

            <hr />

            {/* ── Localisation ── */}
            <p className="fw-bold text-secondary small mb-2 d-flex align-items-center gap-2">
              <span className="badge bg-secondary rounded-circle">3</span>
              <i className="bi bi-geo-alt-fill" />Localisation <span className="fw-normal">(optionnel)</span>
            </p>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Région</label>
                <select className="form-select" value={form.regionId || ''} onChange={handleRegionChange}>
                  <option value="">— Toutes les régions —</option>
                  {regions.map(r => <option key={r.id} value={r.id}>{r.regionName}</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">District</label>
                <select name="districtId" className="form-select"
                  value={form.districtId || ''} onChange={handleChange} disabled={!form.regionId}>
                  <option value="">— Sélectionner —</option>
                  {districts.map(d => <option key={d.id} value={d.id}>{d.DistrictName}</option>)}
                </select>
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold">Notes</label>
                <textarea name="notes" className="form-control" rows={2}
                  value={form.notes || ''} onChange={handleChange}
                  placeholder="Notes complémentaires…" />
              </div>
            </div>
          </div>

          <div className="modal-footer border-0">
            <button className="btn btn-outline-secondary" onClick={onHide}>Annuler</button>
            <button className={`btn ${isEdit ? 'btn-warning' : 'btn-primary'} d-flex align-items-center gap-2`}
              onClick={handleSubmit} disabled={loading}>
              {loading
                ? <><span className="spinner-border spinner-border-sm" />Traitement…</>
                : <><i className="bi bi-box-arrow-right" />{isEdit ? 'Modifier' : 'Déployer'}</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FournitureDeploymentModal;