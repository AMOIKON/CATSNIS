import React, { useState, useEffect } from 'react';
import FournitureService, { FournitureRequest, FournitureResponse, FournitureCategorie } from '../../services/Fournitureservice';

interface Props {
  show:        boolean;
  fourniture?: FournitureResponse | null;
  onHide:      () => void;
  onSuccess:   () => void;
}

const CATEGORIES: { value: FournitureCategorie; label: string; icon: string; color: string; exemples: string }[] = [
  { value:'INFORMATIQUE',  label:'Informatique',  icon:'bi-cpu-fill',        color:'primary',   exemples:'RAM, disque dur, souris…'     },
  { value:'MOBILIER',      label:'Mobilier',      icon:'bi-house-fill',      color:'success',   exemples:'Table, chaise, armoire…'      },
  { value:'PAPETERIE',     label:'Papeterie',     icon:'bi-journal-text',    color:'warning',   exemples:'Ramette, bic, gomme, crayon…' },
  { value:'BUREAUTIQUE',   label:'Bureautique',   icon:'bi-printer-fill',    color:'info',      exemples:'Agrafeuse, perforatrice…'     },
  { value:'ELECTROMENAGER',label:'Électroménager',icon:'bi-lightning-fill',  color:'danger',    exemples:'Climatiseur, ventilateur…'    },
  { value:'AUTRE',         label:'Autre',         icon:'bi-box-seam-fill',   color:'secondary', exemples:'Divers'                       },
];

const UNITES = ['Pièce','Lot','Carton','Ramette','Boîte','Kg','Litre','Mètre'];

const FournitureFormModal: React.FC<Props> = ({ show, fourniture, onHide, onSuccess }) => {
  const [form,    setForm]    = useState<FournitureRequest>({ designation:'', categorie:'AUTRE', quantite:1 });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!show) return;
    if (fourniture) {
      setForm({
        designation:     fourniture.designation,
        categorie:       fourniture.categorie,
        quantite:        fourniture.quantite,
        unite:           fourniture.unite,
        description:     fourniture.description || '',
        dateAcquisition: fourniture.dateAcquisition ? fourniture.dateAcquisition.substring(0, 10) : '',
        fournisseur:     fourniture.fournisseur || '',
        prixUnitaire:    fourniture.prixUnitaire ?? undefined,
      });
    } else {
      setForm({ designation:'', categorie:'AUTRE', quantite:1, unite:'Pièce' });
    }
    setError('');
  }, [show, fourniture]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.designation.trim()) { setError('La désignation est obligatoire.'); return; }
    if (!form.categorie)          { setError('La catégorie est obligatoire.');   return; }
    if (!form.quantite || form.quantite < 1) { setError('La quantité doit être ≥ 1.'); return; }
    setLoading(true); setError('');
    try {
      const payload: FournitureRequest = {
        ...form,
        quantite:    Number(form.quantite),
        prixUnitaire: form.prixUnitaire ? Number(form.prixUnitaire) : undefined,
      };
      if (fourniture) await FournitureService.update(fourniture.id, payload);
      else            await FournitureService.save(payload);
      onSuccess(); onHide();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Erreur lors de l'enregistrement.");
    } finally { setLoading(false); }
  };

  if (!show) return null;
  const isEdit = !!fourniture;
  const selCat = CATEGORIES.find(c => c.value === form.categorie);

  return (
    <div className="modal show d-block" style={{ background:'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow">
          <div className={`modal-header border-0 ${isEdit ? 'bg-warning' : 'bg-success'} text-white`}>
            <h5 className="modal-title">
              <i className={`bi ${isEdit ? 'bi-pencil-fill' : 'bi-plus-circle-fill'} me-2`} />
              {isEdit ? 'Modifier la fourniture' : 'Enregistrer une fourniture'}
            </h5>
            <button className="btn-close btn-close-white" onClick={onHide} />
          </div>

          <div className="modal-body p-4">
            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3">
                <i className="bi bi-exclamation-triangle-fill flex-shrink-0" />{error}
              </div>
            )}

            {/* ── 1. Désignation & Catégorie ── */}
            <p className="fw-bold text-success small mb-2 d-flex align-items-center gap-2">
              <span className="badge bg-success rounded-circle">1</span>
              <i className="bi bi-box-seam-fill" />Identification
            </p>
            <div className="row g-3 mb-3">
              <div className="col-12">
                <label className="form-label fw-semibold">Désignation *</label>
                <input name="designation" className="form-control"
                  value={form.designation} onChange={handleChange}
                  placeholder="Ex : Ramette de papier A4, Chaise de bureau…" />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold">Catégorie *</label>
                <div className="d-flex gap-2 flex-wrap">
                  {CATEGORIES.map(cat => (
                    <button key={cat.value} type="button"
                      className={`btn btn-sm ${form.categorie === cat.value ? `btn-${cat.color}` : `btn-outline-${cat.color}`}`}
                      onClick={() => setForm(prev => ({ ...prev, categorie: cat.value }))}>
                      <i className={`bi ${cat.icon} me-1`} />{cat.label}
                    </button>
                  ))}
                </div>
                {selCat && (
                  <small className="text-muted mt-1 d-block">
                    <i className="bi bi-info-circle me-1" />{selCat.exemples}
                  </small>
                )}
              </div>
            </div>

            <hr />

            {/* ── 2. Quantité & Unité ── */}
            <p className="fw-bold text-success small mb-2 d-flex align-items-center gap-2">
              <span className="badge bg-success rounded-circle">2</span>
              <i className="bi bi-123" />Stock
            </p>
            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold">Quantité *</label>
                <input name="quantite" type="number" min={1} className="form-control"
                  value={form.quantite} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Unité</label>
                <select name="unite" className="form-select" value={form.unite || 'Pièce'} onChange={handleChange}>
                  {UNITES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Prix unitaire (FCFA)</label>
                <input name="prixUnitaire" type="number" min={0} className="form-control"
                  value={form.prixUnitaire || ''} onChange={handleChange}
                  placeholder="Optionnel" />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold">Description</label>
                <textarea name="description" className="form-control" rows={2}
                  value={form.description || ''} onChange={handleChange}
                  placeholder="Description optionnelle…" />
              </div>
            </div>

            <hr />

            {/* ── 3. Acquisition ── */}
            <p className="fw-bold text-secondary small mb-2 d-flex align-items-center gap-2">
              <span className="badge bg-secondary rounded-circle">3</span>
              <i className="bi bi-calendar3" />Acquisition <span className="fw-normal">(optionnel)</span>
            </p>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Date d'acquisition</label>
                <input name="dateAcquisition" type="date" className="form-control"
                  value={form.dateAcquisition || ''} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Fournisseur</label>
                <input name="fournisseur" className="form-control"
                  value={form.fournisseur || ''} onChange={handleChange}
                  placeholder="Nom du fournisseur" />
              </div>
            </div>
          </div>

          <div className="modal-footer border-0">
            <button className="btn btn-outline-secondary" onClick={onHide}>Annuler</button>
            <button className={`btn ${isEdit ? 'btn-warning' : 'btn-success'} d-flex align-items-center gap-2`}
              onClick={handleSubmit} disabled={loading}>
              {loading
                ? <><span className="spinner-border spinner-border-sm" />Enregistrement…</>
                : <><i className={`bi ${isEdit ? 'bi-pencil' : 'bi-check-circle-fill'}`} />{isEdit ? 'Modifier' : 'Enregistrer'}</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FournitureFormModal;