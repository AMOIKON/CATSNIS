import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import MainLayout    from '../../components/common/MainLayout';
import ConfirmModal  from '../../components/common/ConfirmModal';
import StructureEtatiqueService, {
  StructureEtatiqueResponse, StructureEtatiqueRequest,
} from '../../services/Structureetatiqueservice';
import RegionService   from '../../services/regionService';
import DistrictService from '../../services/districtService';
import { RegionResponse, DistrictResponse } from '../../types';
import useAuth from '../../hooks/useAuth';

const StructureEtatiquePage: React.FC = () => {
  const { hasRole } = useAuth();
  const canEdit   = hasRole('ADMIN') || hasRole('SUPER_ADMIN');
  const canDelete = hasRole('ADMIN') || hasRole('SUPER_ADMIN');

  const [items,       setItems]       = useState<StructureEtatiqueResponse[]>([]);
  const [isLoading,   setIsLoading]   = useState(false);
  const [keyword,     setKeyword]     = useState('');
  const [showForm,    setShowForm]    = useState(false);
  const [selected,    setSelected]    = useState<StructureEtatiqueResponse | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId,    setDeleteId]    = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try { setItems(await StructureEtatiqueService.getAllList()); }
    catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try { await StructureEtatiqueService.delete(deleteId); load(); }
    catch (e) { console.error(e); }
    finally { setDeleteLoading(false); setShowConfirm(false); setDeleteId(null); }
  };

  const filtered = items.filter(s => s.nom.toLowerCase().includes(keyword.toLowerCase()));

  return (
    <MainLayout title="Structures étatiques">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="fw-bold mb-0"><i className="bi bi-bank2 text-primary me-2" />Structures étatiques</h5>
          <small className="text-muted">{items.length} structure(s) enregistrée(s)</small>
        </div>
        {canEdit && (
          <button className="btn btn-primary d-flex align-items-center gap-2"
            onClick={() => { setSelected(null); setShowForm(true); }}>
            <i className="bi bi-plus-circle-fill" />Nouvelle structure
          </button>
        )}
      </div>

      <div className="card border-0 shadow-sm rounded-4 mb-3">
        <div className="card-body p-3">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted" /></span>
            <input type="text" className="form-control border-start-0"
              placeholder="Rechercher une structure..."
              value={keyword} onChange={e => setKeyword(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-bank2 fs-1 d-block mb-2" />Aucune structure étatique trouvée
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr><th style={{width:'48px'}}></th><th>Nom</th><th>Région</th><th>District</th><th>Contact</th><th className="text-end">Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s.id}>
                      <td>
                        {s.logo
                          ? <img src={s.logo} alt={s.nom} style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 6 }} />
                          : <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                              <i className="bi bi-bank2 text-primary small" />
                            </div>}
                      </td>
                      <td className="fw-semibold">{s.nom}</td>
                      <td>{s.regionName ? <span className="badge bg-info bg-opacity-10 text-info">{s.regionName}</span> : <span className="text-muted small">—</span>}</td>
                      <td>{s.districtName ? <span className="badge bg-secondary bg-opacity-10 text-secondary">{s.districtName}</span> : <span className="text-muted small">—</span>}</td>
                      <td className="small">{s.contact || '—'}</td>
                      <td className="text-end">
                        {canEdit && (
                          <button className="btn btn-sm btn-outline-warning me-1"
                            onClick={() => { setSelected(s); setShowForm(true); }}>
                            <i className="bi bi-pencil" />
                          </button>
                        )}
                        {canDelete && (
                          <button className="btn btn-sm btn-outline-danger"
                            onClick={() => { setDeleteId(s.id); setShowConfirm(true); }}>
                            <i className="bi bi-trash" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <StructureEtatiqueFormModal
        show={showForm}
        structure={selected}
        onHide={() => { setShowForm(false); setSelected(null); }}
        onSuccess={load}
      />
      <ConfirmModal
        show={showConfirm} title="Supprimer la structure"
        message="Êtes-vous sûr de vouloir supprimer cette structure étatique ?"
        onConfirm={handleDelete} onCancel={() => setShowConfirm(false)}
        isLoading={deleteLoading} />
    </MainLayout>
  );
};

interface FormModalProps {
  show:      boolean;
  structure: StructureEtatiqueResponse | null;
  onHide:    () => void;
  onSuccess: () => void;
}

const StructureEtatiqueFormModal: React.FC<FormModalProps> = ({ show, structure, onHide, onSuccess }) => {
  const [nom,        setNom]        = useState('');
  const [regionId,   setRegionId]   = useState<number>(0);
  const [districtId, setDistrictId] = useState<number>(0);
  const [contact,    setContact]    = useState('');
  const [logo,       setLogo]       = useState<string | undefined>(undefined);
  const [regions,    setRegions]    = useState<RegionResponse[]>([]);
  const [districts,  setDistricts]  = useState<DistrictResponse[]>([]);
  const [isLoading,  setIsLoading]  = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    if (!show) return;
    setError(null);
    RegionService.getAllList().then(setRegions).catch(() => setRegions([]));
    if (structure) {
      setNom(structure.nom);
      setRegionId(structure.regionId || 0);
      setDistrictId(structure.districtId || 0);
      setContact(structure.contact || '');
      setLogo(structure.logo || undefined);
      if (structure.regionId) {
        DistrictService.getAllList(structure.regionId).then(setDistricts).catch(() => setDistricts([]));
      }
    } else {
      setNom(''); setRegionId(0); setDistrictId(0); setContact(''); setDistricts([]); setLogo(undefined);
    }
  }, [show, structure]);

  const handleRegionChange = async (id: number) => {
    setRegionId(id); setDistrictId(0); setDistricts([]);
    if (id) setDistricts(await DistrictService.getAllList(id));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!nom.trim()) { setError('Le nom de la structure est obligatoire.'); return; }
    setIsLoading(true);
    try {
      const request: StructureEtatiqueRequest = {
        nom: nom.trim(),
        regionId: regionId || undefined,
        districtId: districtId || undefined,
        contact: contact.trim() || undefined,
        logo: logo || undefined,
      };
      if (structure) await StructureEtatiqueService.update(structure.id, request);
      else           await StructureEtatiqueService.create(request);
      onSuccess(); onHide();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement.');
    } finally { setIsLoading(false); }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold">
          <i className="bi bi-bank2 text-primary me-2" />
          {structure ? 'Modifier la structure' : 'Nouvelle structure étatique'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="px-4">
        {error && <div className="alert alert-danger rounded-3 small">{error}</div>}
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold small">Nom <span className="text-danger">*</span></Form.Label>
          <Form.Control type="text" value={nom} onChange={e => setNom(e.target.value)}
            placeholder="Ex: Préfecture de Yamoussoukro" className="rounded-3" />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold small">Logo <span className="text-muted fw-normal">(optionnel)</span></Form.Label>
          <div className="d-flex align-items-center gap-3">
            {logo
              ? <img src={logo} alt="logo" style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 8, border: '1px solid #dee2e6' }} />
              : <div className="rounded-3 bg-light border d-flex align-items-center justify-content-center" style={{ width: 48, height: 48 }}>
                  <i className="bi bi-bank2 text-muted" />
                </div>}
            <Form.Control type="file" accept="image/*" onChange={handleLogoChange} className="rounded-3" />
            {logo && (
              <Button variant="outline-danger" size="sm" onClick={() => setLogo(undefined)}>
                <i className="bi bi-x" />
              </Button>
            )}
          </div>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold small">Région</Form.Label>
          <Form.Select value={regionId} onChange={e => handleRegionChange(Number(e.target.value))} className="rounded-3">
            <option value={0}>-- Aucune --</option>
            {regions.map(r => <option key={r.id} value={r.id}>{r.regionName}</option>)}
          </Form.Select>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold small">District</Form.Label>
          <Form.Select value={districtId} onChange={e => setDistrictId(Number(e.target.value))} disabled={!regionId} className="rounded-3">
            <option value={0}>-- Aucun --</option>
            {districts.map(d => <option key={d.id} value={d.id}>{d.DistrictName}</option>)}
          </Form.Select>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold small">Contact</Form.Label>
          <Form.Control type="text" value={contact} onChange={e => setContact(e.target.value)}
            placeholder="Ex: 07 00 00 00 00" className="rounded-3" />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer className="border-0">
        <Button variant="light" onClick={onHide} className="rounded-3">Annuler</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={isLoading} className="rounded-3">
          {isLoading ? 'Enregistrement...' : structure ? 'Modifier' : 'Créer'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default StructureEtatiquePage;