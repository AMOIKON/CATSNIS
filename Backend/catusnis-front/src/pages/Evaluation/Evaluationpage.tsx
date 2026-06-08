import React, { useState, useEffect, useCallback } from 'react';
import MainLayout   from '../../components/common/MainLayout';
import ConfirmModal from '../../components/common/ConfirmModal';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import api from '../../services/api';
import { ApiResponse } from '../../types';
import useAuth from '../../hooks/useAuth';
import { buildHeader, getPrintConfig } from '../../services/globalprintservice';

interface Evaluation { id: number; evlName: string; }

const EVL_STYLE: Record<string, { color: string; icon: string }> = {
    'Excellent':    { color: '#198754', icon: 'bi-star-fill'            },
    'Bon':          { color: '#0d6efd', icon: 'bi-hand-thumbs-up-fill'  },
    'Satisfaisant': { color: '#6f42c1', icon: 'bi-check-circle-fill'    },
    'Passable':     { color: '#fd7e14', icon: 'bi-dash-circle-fill'     },
    'Insuffisant':  { color: '#dc3545', icon: 'bi-x-circle-fill'        },
};

const EvlBadge: React.FC<{ name: string }> = ({ name }) => {
    const s = EVL_STYLE[name] || { color: '#6c757d', icon: 'bi-circle' };
    return (
        <span className="d-inline-flex align-items-center gap-1 px-3 py-1 rounded-pill fw-semibold small"
              style={{ color: s.color, backgroundColor: s.color + '18' }}>
            <i className={`bi ${s.icon}`} style={{ fontSize: '12px' }} />
            {name}
        </span>
    );
};

const EvaluationsPage: React.FC = () => {
    const { person } = useAuth();
    const canManage = person?.role === 'SUPER_ADMIN' || person?.role === 'ADMIN';

    const [evaluations,   setEvaluations]   = useState<Evaluation[]>([]);
    const [isLoading,     setIsLoading]     = useState(false);
    const [isPrinting,    setIsPrinting]    = useState(false);
    const [showForm,      setShowForm]      = useState(false);
    const [showConfirm,   setShowConfirm]   = useState(false);
    const [selected,      setSelected]      = useState<Evaluation | null>(null);
    const [selectedId,    setSelectedId]    = useState<number | null>(null);
    const [formName,      setFormName]      = useState('');
    const [formLoading,   setFormLoading]   = useState(false);
    const [formError,     setFormError]     = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const load = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await api.get<ApiResponse<Evaluation[]>>('/api/evaluations/all');
            setEvaluations(res.data.data ?? []);
        } catch { setEvaluations([]); }
        finally { setIsLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const openCreate = () => { setSelected(null); setFormName(''); setFormError(null); setShowForm(true); };
    const openEdit   = (e: Evaluation) => { setSelected(e); setFormName(e.evlName); setFormError(null); setShowForm(true); };

    const handleSave = async () => {
        if (!formName.trim()) { setFormError('Le nom est obligatoire.'); return; }
        setFormLoading(true);
        try {
            if (selected) {
                await api.put(`/api/evaluations/${selected.id}`, { evlName: formName.trim() });
            } else {
                await api.post('/api/evaluations', { evlName: formName.trim() });
            }
            setShowForm(false);
            load();
        } catch (err: any) {
            setFormError(err.response?.data?.message || "Erreur lors de l'enregistrement.");
        } finally { setFormLoading(false); }
    };

    const handleDelete = async () => {
        if (!selectedId) return;
        setDeleteLoading(true);
        try { await api.delete(`/api/evaluations/${selectedId}`); load(); }
        catch { }
        finally { setDeleteLoading(false); setShowConfirm(false); setSelectedId(null); }
    };

    // ✅ Impression globale
    const handlePrintAll = async () => {
        setIsPrinting(true);
        try {
            const header = buildHeader('Liste des évaluations', getPrintConfig());
            const cards = evaluations.map((e, i) => {
                const style = EVL_STYLE[e.evlName] || { color: '#6c757d', icon: 'bi-circle' };
                return `<div style="display:inline-flex;align-items:center;gap:8px;padding:8px 16px;
                    border-radius:30px;margin:6px;font-weight:600;font-size:13px;
                    color:${style.color};background:${style.color}18;border:1px solid ${style.color}40;">
                    ${i + 1}. ${e.evlName}
                </div>`;
            }).join('');
            const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
                <title>Évaluations — CATUSNIS</title>
                <style>@page{margin:1.5cm;size:A4 portrait}body{font-family:Arial,sans-serif;color:#333;margin:0}
                .total{font-size:12px;color:#6c757d;margin:8px 0 16px}
                .grid{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;}
                </style></head>
                <body>${header}<p class="total">${evaluations.length} évaluation(s)</p>
                <p style="font-size:12px;color:#6c757d;margin-bottom:8px;">Utilisées pour noter la qualité des interventions :</p>
                <div class="grid">${cards}</div></body></html>`;
            const win = window.open('', '_blank', 'width=700,height=500');
            if (!win) { alert('Veuillez autoriser les popups.'); return; }
            win.document.write(html); win.document.close();
            win.onload = () => { win.focus(); win.print(); win.close(); };
        } catch (err) { console.error(err); }
        finally { setIsPrinting(false); }
    };

    return (
        <MainLayout title="Évaluations">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 className="fw-bold mb-0">Gestion des évaluations</h5>
                    <small className="text-muted">{evaluations.length} évaluation(s)</small>
                </div>
                <div className="d-flex gap-2 align-items-center">
                    <button className="btn btn-outline-secondary d-flex align-items-center gap-2"
                        onClick={handlePrintAll} disabled={isPrinting}>
                        {isPrinting?<><span className="spinner-border spinner-border-sm"/>Chargement...</>:<><i className="bi bi-printer"/>Imprimer</>}
                    </button>
                    {canManage && (
                        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={openCreate}>
                            <i className="bi bi-plus-circle-fill" />Nouvelle évaluation
                        </button>
                    )}
                </div>
            </div>

            <div className="alert alert-info border-0 rounded-4 mb-4 small">
                <i className="bi bi-info-circle me-2" />
                Les évaluations permettent de noter la qualité de chaque intervention.
            </div>

            <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body p-3">
                    {isLoading ? (
                        <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
                    ) : evaluations.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <i className="bi bi-star fs-1 d-block mb-2" />Aucune évaluation
                        </div>
                    ) : (
                        <div className="row g-3">
                            {evaluations.map(e => (
                                <div key={e.id} className="col-md-4 col-lg-3">
                                    <div className="card border rounded-4 p-3 h-100 d-flex flex-row align-items-center justify-content-between gap-2">
                                        <EvlBadge name={e.evlName} />
                                        {canManage && (
                                            <div className="d-flex gap-1">
                                                <button className="btn btn-sm btn-outline-warning" onClick={() => openEdit(e)} title="Modifier">
                                                    <i className="bi bi-pencil" />
                                                </button>
                                                <button className="btn btn-sm btn-outline-danger"
                                                    onClick={() => { setSelectedId(e.id); setShowConfirm(true); }} title="Supprimer">
                                                    <i className="bi bi-trash" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Modal show={showForm} onHide={() => setShowForm(false)} centered>
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="fw-bold">
                        <i className={`bi ${selected ? 'bi-pencil-square text-warning' : 'bi-plus-circle text-primary'} me-2`} />
                        {selected ? 'Modifier' : 'Nouvelle'} évaluation
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {formError && <Alert variant="danger" className="rounded-3">{formError}</Alert>}
                    <Form.Label className="fw-semibold">Nom <span className="text-danger">*</span></Form.Label>
                    <Form.Control value={formName} onChange={e => setFormName(e.target.value)}
                        placeholder="Ex: Excellent, Bon, Satisfaisant..." className="rounded-3" />
                    <small className="text-muted mt-1 d-block">
                        Valeurs recommandées : Excellent, Bon, Satisfaisant, Passable, Insuffisant
                    </small>
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="light" onClick={() => setShowForm(false)}>Annuler</Button>
                    <Button variant={selected ? 'warning' : 'primary'} onClick={handleSave}
                        disabled={formLoading} className="text-white">
                        {formLoading
                            ? <><Spinner size="sm" className="me-2" />Enregistrement...</>
                            : <><i className={`bi ${selected ? 'bi-pencil' : 'bi-plus-circle'} me-2`} />{selected ? 'Modifier' : 'Enregistrer'}</>}
                    </Button>
                </Modal.Footer>
            </Modal>

            <ConfirmModal show={showConfirm}
                title="Supprimer l'évaluation"
                message="Êtes-vous sûr ? Cette évaluation sera retirée de toutes les interventions liées."
                onConfirm={handleDelete}
                onCancel={() => setShowConfirm(false)}
                isLoading={deleteLoading} />
        </MainLayout>
    );
};

export default EvaluationsPage;