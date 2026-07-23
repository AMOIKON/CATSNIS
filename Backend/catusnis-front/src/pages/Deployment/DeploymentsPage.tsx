import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button } from 'react-bootstrap';
import MainLayout            from '../../components/common/MainLayout';
import ConfirmModal          from '../../components/common/ConfirmModal';
import Pagination            from '../../components/common/Pagination';
import DeploymentFormModal   from './DeploymentFormModal';
import DeploymentUpdateModal from './DeploymentUpdateModal';
import DeploymentService     from '../../services/deploymentService';
import RegionService         from '../../services/regionService';
import DistrictService       from '../../services/districtService';
import { DeploymentResponse, RegionResponse, DistrictResponse } from '../../types';
import { buildHeader, getPrintConfig } from '../../services/globalprintservice';
import PrintPreviewModal     from '../../components/common/Printpreviewmodal';
import useAuth               from '../../hooks/useAuth';
import { getImageSrc }       from '../../utils/imageUtils';
import GpsTag                from '../../components/common/GpsTag';
import notify from '../../services/notify';

type Tab = 'deployments' | 'items' | 'stats';

// ── Modal retour en stock ─────────────────────────────────────────────────────
const ReturnItemModal: React.FC<{
    show: boolean; deployment: DeploymentResponse | null;
    onHide: () => void;
    onConfirmOne:  (itemId: number, label: string) => void;
    onConfirmAll:  () => void;
}> = ({ show, deployment, onHide, onConfirmOne, onConfirmAll }) => {
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
    const [mode, setMode] = useState<'one' | 'all'>('one');
    useEffect(() => { if (!show) { setSelectedItemId(null); setMode('one'); } }, [show]);
    const selectedItem = deployment?.items?.find(i => i.id === selectedItemId);
    const nbItems = deployment?.items?.length || 0;
    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold fs-6">
                    <i className="bi bi-arrow-return-left text-warning me-2" />
                    Retourner en stock — <span className="text-primary">{deployment?.codeDep}</span>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4">
                <div className="d-flex gap-2 mb-3">
                    <button className={`btn btn-sm rounded-3 ${mode === 'one' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setMode('one')}>
                        <i className="bi bi-cursor me-1" />Un équipement
                    </button>
                    <button className={`btn btn-sm rounded-3 ${mode === 'all' ? 'btn-danger' : 'btn-outline-danger'}`} onClick={() => setMode('all')}>
                        <i className="bi bi-arrow-return-left me-1" />Tout retourner ({nbItems})
                    </button>
                </div>{mode === 'one' ? (
                    <>
                        <p className="text-muted small mb-2">Sélectionnez l'équipement à retirer :</p>
                        <div className="d-flex flex-column gap-2">
                            {deployment?.items?.map(item => (
                                <button key={item.id}
                                    className={`btn btn-sm text-start rounded-3 d-flex align-items-center gap-2 ${selectedItemId === item.id ? 'btn-warning text-white' : 'btn-outline-secondary'}`}
                                    onClick={() => setSelectedItemId(item.id)}>
                                    <i className={`bi ${selectedItemId === item.id ? 'bi-check-circle-fill' : 'bi-circle'}`} />
                                    <span><strong>{item.typeName}</strong><span className="ms-2 opacity-75">Tag: {item.tag}</span><span className="ms-2 opacity-75">S/N: {item.serial}</span></span>
                                </button>
                            ))}
                        </div>
                        {selectedItem && (
                            <div className="alert alert-warning rounded-3 mt-3 py-2 small mb-0">
                                <i className="bi bi-exclamation-triangle-fill me-2" />
                                <strong>{selectedItem.typeName} — {selectedItem.tag}</strong> sera remis en stock.
                            </div>
                        )}
                    </>
                ) : (<div className="alert alert-danger rounded-3 py-3 mb-0">
                        <i className="bi bi-exclamation-triangle-fill me-2" />
                        <strong>{nbItems} équipement(s)</strong> seront retirés du déploiement et remis en stock. Le déploiement sera supprimé automatiquement.
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer className="border-0">
                <Button variant="light" onClick={onHide} className="rounded-3">Annuler</Button>
                {mode === 'one' ? (
                    <Button variant="warning" className="rounded-3 text-white" disabled={!selectedItemId}
                        onClick={() => { if (selectedItemId && selectedItem) onConfirmOne(selectedItemId, `${selectedItem.typeName} — ${selectedItem.tag}`); }}>
                        <i className="bi bi-arrow-return-left me-2" />Retourner cet équipement
                    </Button>
                ) : (
                    <Button variant="danger" className="rounded-3" onClick={onConfirmAll}>
                        <i className="bi bi-arrow-return-left me-2" />Retourner tout ({nbItems})
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
};

const DeploymentsPage: React.FC = () => {
    const { person, isUnrestricted } = useAuth();
    const role      = person?.role;
    const canCreate = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'TECHNICIEN';
    const canEdit   = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'TECHNICIEN';
    const canDelete = role === 'SUPER_ADMIN' || role === 'ADMIN';

    const [activeTab,            setActiveTab]            = useState<Tab>('deployments');
    const [activeRegionFilter,   setActiveRegionFilter]   = useState<number | undefined>(undefined);
    const [deployments,          setDeployments]          = useState<DeploymentResponse[]>([]);
    const [regions,              setRegions]              = useState<RegionResponse[]>([]);
    const [districts,            setDistricts]            = useState<DistrictResponse[]>([]);
    const [allDeployments,       setAllDeployments]       = useState<DeploymentResponse[]>([]);
    const [totalPages,           setTotalPages]           = useState(0);
    const [totalElements,        setTotalElements]        = useState(0);
    const [page,                 setPage]                 = useState(0);
    const [keyword,              setKeyword]              = useState('');
    const [filterRegion,         setFilterRegion]         = useState<number>(0);
    const [filterDistrict,       setFilterDistrict]       = useState<number>(0);
    const [isLoading,            setIsLoading]            = useState(false);
    const [isPrinting,           setIsPrinting]           = useState(false);
    const [apiError,             setApiError]             = useState<string | null>(null);
    const [actionError,          setActionError]          = useState<string | null>(null);
    const [showForm,             setShowForm]             = useState(false);
    const [showUpdate,           setShowUpdate]           = useState(false);
    const [showConfirm,          setShowConfirm]          = useState(false);
    const [showReturnModal,      setShowReturnModal]      = useState(false);
    const [showReturnConfirm,    setShowReturnConfirm]    = useState(false);
    const [showReturnAllConfirm, setShowReturnAllConfirm] = useState(false);
    const [returnAllLoading,     setReturnAllLoading]     = useState(false);
    const [showPrintModal,       setShowPrintModal]       = useState(false);
    const [printModalTarget,     setPrintModalTarget]     = useState<DeploymentResponse | null>(null);
    const [selectedId,           setSelectedId]           = useState<number | null>(null);
    const [selected,             setSelected]             = useState<DeploymentResponse | null>(null);
    const [deleteLoading,        setDeleteLoading]        = useState(false);
    const [printTarget,          setPrintTarget]          = useState<DeploymentResponse | null>(null);
    const [returnTarget,         setReturnTarget]         = useState<DeploymentResponse | null>(null);
    const [returnItem,           setReturnItem]           = useState<{ itemId: number; label: string } | null>(null);
    const [returnLoading,        setReturnLoading]        = useState(false);
    const [downloadingId,        setDownloadingId]        = useState<number | null>(null);

    useEffect(() => { RegionService.getAllList().then(setRegions); }, []);

    const handleRegionFilter = async (regionId: number) => {
        setFilterRegion(regionId); setFilterDistrict(0); setPage(0);
        if (regionId) { const data = await DistrictService.getAllList(regionId); setDistricts(data); }
        else setDistricts([]);
    };

    const loadDeployments = useCallback(async () => {
        setIsLoading(true);
        try {
            setApiError(null);
            const data = await DeploymentService.getAll(page, 10,
                filterRegion || undefined, filterDistrict || undefined,
                undefined, keyword || undefined);
            setDeployments(data.content ?? []);
            setTotalPages(data.page?.totalPages ?? 0); setTotalElements(data.page?.totalElements ?? 0);
        } catch (err: any) {
            setApiError(err?.response?.data?.message || err?.message || 'Erreur de chargement');
        } finally { setIsLoading(false); }
    }, [page, keyword, filterRegion, filterDistrict]);

    const loadAllForStats = useCallback(async () => {
        try {
            const data = await DeploymentService.getAll(0, 1000);
            setAllDeployments(data.content ?? []);
        } catch { /* silencieux */ }
    }, []);

    useEffect(() => { loadDeployments(); }, [loadDeployments]);
    useEffect(() => { loadAllForStats();  }, [loadAllForStats]);

    const extractError = (err: any): string =>
        err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Erreur inconnue';

    const handleDeleteConfirm = async () => {
        if (!selectedId) return;
        setDeleteLoading(true); setActionError(null);
        try {
            await DeploymentService.delete(selectedId);
            loadDeployments(); loadAllForStats();
            setShowConfirm(false); setSelectedId(null);
            notify.success('Déploiement supprimé avec succès');
        } catch (err: any) { setActionError(extractError(err)); notify.error(extractError(err)); }
        finally { setDeleteLoading(false); }
    };

    const handleOpenReturnModal = (d: DeploymentResponse) => {
        setActionError(null); setReturnTarget(d); setShowReturnModal(true);
    };

    const handleItemSelected = (itemId: number, label: string) => {
        setReturnItem({ itemId, label }); setShowReturnModal(false); setShowReturnConfirm(true);
    };

    const handleReturnAll = () => { setShowReturnModal(false); setShowReturnAllConfirm(true); };

    const handleReturnAllConfirm = async () => {
        if (!returnTarget) return;
        setReturnAllLoading(true); setActionError(null);
        try {
            await DeploymentService.delete(returnTarget.id);
            loadDeployments(); loadAllForStats();
            setShowReturnAllConfirm(false); setReturnTarget(null);
            notify.success('Tous les équipements ont été retournés en stock');
        } catch (err: any) { setActionError(extractError(err)); setShowReturnAllConfirm(false); notify.error(extractError(err)); }
        finally { setReturnAllLoading(false); }
    };

    const handleReturnConfirm = async () => {
        if (!returnTarget || !returnItem) return;
        setReturnLoading(true); setActionError(null);
        try {
            await DeploymentService.removeItem(returnTarget.id, returnItem.itemId);
            loadDeployments(); loadAllForStats();
            setShowReturnConfirm(false); setReturnTarget(null); setReturnItem(null);
            notify.success(`"${returnItem.label}" retourné en stock avec succès`);
        } catch (err: any) { setActionError(extractError(err)); setShowReturnConfirm(false); notify.error(extractError(err)); }
        finally { setReturnLoading(false); }
    };

    const handlePrintFiche = (d: DeploymentResponse) => {
        setPrintTarget(d); setPrintModalTarget(d); setShowPrintModal(true);
    };

    const handleDownloadPdf = async (d: DeploymentResponse) => {
        setDownloadingId(d.id);
        try {
            const blob = await DeploymentService.downloadPdf(d.id);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `fiche-deploiement-${d.codeDep}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            notify.success('Fiche PDF téléchargée avec succès');
        } catch (err: any) {
            console.error('Erreur téléchargement PDF déploiement:', err);
            notify.apiError(err, 'Erreur lors du téléchargement du PDF');
        } finally {
            setDownloadingId(null);
        }
    };

    const handlePrintAll = async () => {
        setIsPrinting(true);
        try {
            const all = await DeploymentService.getAllForPrint(
                filterRegion   || undefined,
                filterDistrict || undefined,
                undefined,
                keyword        || undefined
            );
            const cfg = getPrintConfig();
            let titre = 'Liste des déploiements';
            if (filterRegion) {
                const rName = regions.find(r => r.id === filterRegion)?.regionName;
                if (rName) titre += ` — ${rName}`;
            }
            const header = buildHeader(titre, cfg);

            const rows = all.map((d, i) => `
                <tr>
                    <td style="color:#6c757d;font-size:10px;">${i + 1}</td>
                    <td style="font-weight:600;">${d.codeDep}</td>
                    <td style="font-size:10px;">${new Date(d.dateRecep).toLocaleDateString('fr-FR')}</td>
                    <td><span style="background:#fce4e4;color:#921919;padding:1px 8px;border-radius:20px;font-size:10px;">${d.healthDeploy || '—'}</span></td>
                    <td><span style="background:#cff4fc;color:#055160;padding:1px 8px;border-radius:20px;font-size:10px;">${d.districtDeploy || '—'}</span></td>
                    <td><span style="background:#d1e7dd;color:#0a3622;padding:1px 8px;border-radius:20px;font-size:10px;">${d.regionDeploy || '—'}</span></td>
                    <td style="text-align:center;font-weight:bold;">${d.items?.length || 0}</td>
                    <td style="font-size:10px;color:${d.appsColor || '#616161'};font-weight:500;">${d.appsDeploy || '—'}</td>
                    <td style="font-size:10px;">${d.partnerName || '—'}</td>
                    <td style="font-size:10px;color:#198754;">${d.latitude != null ? `${d.latitude.toFixed(4)}, ${d.longitude?.toFixed(4)}` : '—'}</td>
                </tr>`).join('');

            const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/>
    <title>Déploiements — CATUSNIS</title>
    <style>
        @page { margin:1.5cm; size:A4 landscape; }
        body  { font-family:Arial,sans-serif; color:#333; margin:0; }
        .total { font-size:12px; color:#6c757d; margin:8px 0 16px; }
        table { width:100%; border-collapse:collapse; }
        th  { background:#f8f9fa; border:1px solid #dee2e6; padding:6px 8px; font-size:10px; text-align:left; }
        td  { border:1px solid #dee2e6; padding:6px 8px; font-size:11px; }
        tr:nth-child(even) { background:#f9f9f9; }
    </style>
</head><body>
    ${header}
    <p class="total">${all.length} déploiement(s) — ${all.reduce((s, d) => s + (d.items?.length || 0), 0)} équipements</p>
    <table>
        <thead>
            <tr>
                <th>#</th><th>Code</th><th>Date</th><th>Site</th><th>District</th>
                <th>Région</th><th style="text-align:center">Équip.</th><th>Application</th><th>Partenaire</th><th>GPS</th>
            </tr>
        </thead>
        <tbody>${rows}</tbody>
    </table>
</body>
</html>`;

            const win = window.open('', '_blank', 'width=900,height=700');
            if (!win) { alert('Veuillez autoriser les popups pour imprimer.'); return; }
            win.document.write(html);
            win.document.close();
            win.onload = () => { win.focus(); win.print(); win.close(); };
        } catch (err) { console.error(err); }
        finally { setIsPrinting(false); }
    };

    const hexToRgba = (hex: string, opacity: number) => {
        const h = hex?.replace('#', '') || '616161';
        return `rgba(${parseInt(h.substring(0,2),16)},${parseInt(h.substring(2,4),16)},${parseInt(h.substring(4,6),16)},${opacity})`;
    };

    const allItems       = allDeployments.flatMap(d => d.items || []);
    const sitesCouverts  = new Set(allDeployments.map(d => d.healthDeploy)).size;
    const regionsActives = new Set(allDeployments.map(d => d.regionDeploy)).size;
    const fonctionnels   = allItems.filter(i => i.status === 'FONCTIONNEL').length;
    const tauxFonct      = allItems.length > 0 ? Math.round((fonctionnels / allItems.length) * 100) : 0;
    const geolocCount    = allDeployments.filter(d => d.latitude != null).length;

    const topRegions = regions.map(r => ({
        id: r.id, label: r.regionName,
        count: allDeployments.filter(d => d.regionDeploy === r.regionName).length,
    })).filter(r => r.count > 0).sort((a, b) => b.count - a.count).slice(0, 5);

    const statsByApp = Array.from(new Set(allDeployments.map(d => d.appsDeploy))).map(app => ({
        name:  app,
        count: allDeployments.filter(d => d.appsDeploy === app).length,
        color: allDeployments.find(d => d.appsDeploy === app)?.appsColor || '#616161',
        icon:  allDeployments.find(d => d.appsDeploy === app)?.appsIcon  || 'bi-app-indicator',
        image: allDeployments.find(d => d.appsDeploy === app)?.appsImage || '',
    }));

    const recentDeployments = [...allDeployments]
        .sort((a, b) => new Date(b.dateRecep).getTime() - new Date(a.dateRecep).getTime())
        .slice(0, 5);

    const pageItems = deployments.flatMap(d =>
        (d.items || []).map(item => ({ ...item, codeDep: d.codeDep, healthDeploy: d.healthDeploy, regionDeploy: d.regionDeploy, partnerName: d.partnerName }))
    );

    const statsCards = [
        { label: 'Total déploiements',    value: totalElements,   icon: 'bi-truck',                     color: 'primary', sub: `${regionsActives} région(s)` },
        { label: 'Équipements déployés',  value: allItems.length, icon: 'bi-pc-display',                color: 'success', sub: `${tauxFonct}% fonctionnels`  },
        { label: 'Sites couverts',        value: sitesCouverts,   icon: 'bi-hospital-fill',             color: 'info',    sub: 'établissements'               },
        { label: 'Géolocalisés',          value: geolocCount,     icon: 'bi-geo-alt-fill',              color: 'success', sub: 'avec coordonnées GPS'         },
    ];

    return (
        <MainLayout title="Déploiements">
            <style>{`@media print { body * { visibility: hidden; } #print-zone, #print-zone * { visibility: visible; } #print-zone { position: absolute; left: 0; top: 0; width: 100%; } .d-none { display: block !important; } }`}</style>

            {/* ── Zone impression fiche individuelle ── */}
            {printTarget && (() => {
                const cfg      = getPrintConfig();
                const leftSrc  = cfg.leftImageUrl  || (printTarget.partnerImage ? getImageSrc(printTarget.partnerImage) : null);
                const rightSrc = cfg.rightImageUrl || (printTarget.appsImage    ? getImageSrc(printTarget.appsImage)    : null);
                const bgLogo   = cfg.bgImageUrl    || null;
                return (
                <div id="print-zone" className="d-none">
                    <style>{`@media print {
                        @page { margin: 1.5cm; size: A4 portrait; }
                        ${bgLogo ? `#print-bg-watermark { position: fixed !important; top: 50% !important; left: 50% !important; transform: translate(-50%, -50%) !important; width: 400px !important; height: 400px !important; opacity: 0.07 !important; z-index: 0 !important; pointer-events: none !important; }` : ''}
                        #print-header-logos { display: flex !important; }
                        #print-content { position: relative !important; z-index: 1 !important; }
                    }`}</style>
                    <div style={{ fontFamily:'Arial,sans-serif', fontSize:'12px', color:'#222' }}>
                        {bgLogo && <img id="print-bg-watermark" src={bgLogo} alt="" style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'400px', height:'400px', objectFit:'contain', opacity:0.07, zIndex:0, pointerEvents:'none' }} />}
                        <div id="print-content" style={{ position:'relative', zIndex:1 }}>
                            <div id="print-header-logos" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', paddingBottom:'14px', borderBottom:'2.5px solid #0d6efd' }}>
                                <div style={{ width:'100px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                    {leftSrc ? <img src={leftSrc} alt="logo-gauche" style={{ maxWidth:'90px', maxHeight:'80px', objectFit:'contain', display:'block' }} /> : <div style={{ width:'80px', height:'70px' }} />}
                                </div>
                                <div style={{ textAlign:'center', flex:1, padding:'0 16px' }}>
                                    <h2 style={{ margin:'0 0 6px 0', fontSize:'18px', color:'#0d6efd', fontWeight:'bold', textTransform:'uppercase', letterSpacing:'0.5px' }}>FICHE DE DÉPLOIEMENT</h2>
                                    <p style={{ margin:'0', color:'#555', fontSize:'12px' }}>{new Date().toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
                                    <div style={{ display:'flex', gap:'8px', justifyContent:'center', flexWrap:'wrap', marginTop:'6px' }}>
                                        {printTarget.technicianName && <span style={{ padding:'3px 12px', background:'#f0f0f0', borderRadius:'20px', fontSize:'11px' }}>👤 {printTarget.technicianName}</span>}
                                        {printTarget.partnerName    && <span style={{ padding:'3px 12px', background:'#e8f4fd', borderRadius:'20px', fontSize:'11px' }}>🤝 {printTarget.partnerName}</span>}
                                    </div>
                                </div>
                                <div style={{ width:'100px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                    {rightSrc ? <img src={rightSrc} alt="logo-droite" style={{ maxWidth:'90px', maxHeight:'80px', objectFit:'contain', display:'block' }} /> : <div style={{ width:'80px', height:'70px' }} />}
                                </div>
                            </div>
                            <table style={{ width:'100%', marginBottom:'16px', borderCollapse:'collapse', fontSize:'12px' }}>
                                <tbody>
                                    <tr><td style={{ padding:'5px 8px', width:'50%', background:'#f8f9fa', border:'1px solid #e9ecef' }}><strong>Code :</strong> {printTarget.codeDep}</td><td style={{ padding:'5px 8px', background:'#f8f9fa', border:'1px solid #e9ecef' }}><strong>Date :</strong> {new Date(printTarget.dateRecep).toLocaleDateString('fr-FR')}</td></tr>
                                    <tr><td style={{ padding:'5px 8px', border:'1px solid #e9ecef' }}><strong>Site :</strong> {printTarget.healthDeploy}</td><td style={{ padding:'5px 8px', border:'1px solid #e9ecef' }}><strong>District :</strong> {printTarget.districtDeploy}</td></tr>
                                    <tr><td style={{ padding:'5px 8px', background:'#f8f9fa', border:'1px solid #e9ecef' }}><strong>Région :</strong> {printTarget.regionDeploy}</td><td style={{ padding:'5px 8px', background:'#f8f9fa', border:'1px solid #e9ecef' }}><strong>Application :</strong> {printTarget.appsDeploy}</td></tr>
                                </tbody>
                            </table>
                            {printTarget.latitude != null && printTarget.longitude != null && (
                                <div style={{ marginBottom:'14px', padding:'8px 12px', background:'#d1e7dd', borderRadius:'6px', border:'1px solid #a3cfbb', fontSize:'11px', color:'#0a3622', display:'flex', alignItems:'center', gap:'8px' }}>
                                    <span>📍</span>
                                    <div>
                                        <strong>Coordonnées GPS :</strong>{' '}
                                        {printTarget.latitude.toFixed(6)}, {printTarget.longitude.toFixed(6)}
                                        {' — '}
                                        <a href={`https://www.google.com/maps?q=${printTarget.latitude},${printTarget.longitude}`}
                                           style={{ color:'#0a3622', fontWeight:'bold' }}>
                                            Voir sur Google Maps ↗
                                        </a>
                                    </div>
                                </div>
                            )}
                            <h4 style={{ marginBottom:'10px', fontSize:'14px', borderLeft:'4px solid #0d6efd', paddingLeft:'8px' }}>Équipements déployés ({printTarget.items?.length || 0})</h4>
                            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'11px' }}>
                                <thead><tr style={{ background:'#0d6efd', color:'white', WebkitPrintColorAdjust:'exact', printColorAdjust:'exact' }}>
                                    <th style={{ border:'1px solid #0d6efd', padding:'7px 8px', textAlign:'center', width:'40px' }}>#</th>
                                    <th style={{ border:'1px solid #0d6efd', padding:'7px 8px' }}>Type équipement</th>
                                    <th style={{ border:'1px solid #0d6efd', padding:'7px 8px' }}>N° Tag</th>
                                    <th style={{ border:'1px solid #0d6efd', padding:'7px 8px' }}>N° Série</th>
                                    <th style={{ border:'1px solid #0d6efd', padding:'7px 8px', textAlign:'center' }}>État</th>
                                </tr></thead><tbody>{printTarget.items?.map((item, i) => (
                                    <tr key={item.id} style={{ background: i % 2 === 0 ? '#ffffff' : '#f8f9fa' }}>
                                        <td style={{ border:'1px solid #dee2e6', padding:'6px 8px', textAlign:'center', fontWeight:'bold', color:'#0d6efd' }}>{i+1}</td>
                                        <td style={{ border:'1px solid #dee2e6', padding:'6px 8px' }}>{item.typeName}</td>
                                        <td style={{ border:'1px solid #dee2e6', padding:'6px 8px', fontFamily:'monospace' }}>{item.tag}</td>
                                        <td style={{ border:'1px solid #dee2e6', padding:'6px 8px', fontFamily:'monospace' }}>{item.serial}</td>
                                        <td style={{ border:'1px solid #dee2e6', padding:'6px 8px', textAlign:'center' }}>
                                            {item.status === 'FONCTIONNEL'
                                                ? <span style={{ color:'#198754', fontWeight:'bold' }}>✅ Fonctionnel</span>
                                                : <span style={{ color:'#dc3545', fontWeight:'bold' }}>❌ Non fonctionnel</span>}
                                        </td>
                                    </tr>
                                ))}</tbody>
                            </table>
                            {printTarget.comment && <div style={{ marginTop:'16px', padding:'10px 12px', background:'#fff3cd', borderRadius:'6px', border:'1px solid #ffc107', fontSize:'11px' }}><strong>Commentaire :</strong><p style={{ marginTop:'4px', marginBottom:0 }}>{printTarget.comment}</p></div>}
                            <div style={{ marginTop:'50px', display:'flex', justifyContent:'space-between', gap:'40px' }}>
                                <div style={{ textAlign:'center', flex:1 }}><p style={{ fontWeight:'bold', marginBottom:'4px' }}>Signature Technicien</p><p style={{ color:'#666', fontSize:'11px' }}>{printTarget.technicianName || '——'}</p><div style={{ marginTop:'35px', borderTop:'1px solid #333', paddingTop:'4px', fontSize:'10px', color:'#888' }}>Nom & Signature</div></div>
                                <div style={{ textAlign:'center', flex:1 }}><p style={{ fontWeight:'bold', marginBottom:'4px' }}>Signature Responsable Site</p><p style={{ color:'#666', fontSize:'11px' }}>{printTarget.healthDeploy}</p><div style={{ marginTop:'35px', borderTop:'1px solid #333', paddingTop:'4px', fontSize:'10px', color:'#888' }}>Nom & Signature</div></div>
                            </div>
                            <div style={{ marginTop:'30px', paddingTop:'8px', borderTop:'1px solid #dee2e6', display:'flex', justifyContent:'space-between', fontSize:'9px', color:'#aaa' }}>
                                <span>CATUSNIS — Document confidentiel</span>
                                <span>Généré le {new Date().toLocaleDateString('fr-FR')}</span>
                            </div>
                        </div>
                    </div>
                </div>
                );
            })()}

            {/* ── Header ── */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 className="fw-bold mb-0"><i className="bi bi-truck text-primary me-2" />Gestion des déploiements</h5>
                    <small className="text-muted">{totalElements} déploiement(s) — {allItems.length} équipements</small>
                </div>
                <div className="d-flex gap-2 align-items-center">
                    {(activeTab === 'deployments' || activeTab === 'items') && (
                        <button className="btn btn-outline-secondary d-flex align-items-center gap-2" onClick={handlePrintAll} disabled={isPrinting}>
                            {isPrinting ? <><span className="spinner-border spinner-border-sm" role="status" />Chargement...</> : <><i className="bi bi-printer" />Imprimer</>}
                        </button>
                    )}
                    {canCreate && (
                        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => setShowForm(true)}>
                            <i className="bi bi-plus-circle-fill" /> Nouveau déploiement
                        </button>
                    )}
                </div>
            </div>

            {actionError && (
                <div className="alert alert-danger alert-dismissible rounded-4 mb-3 py-2 d-flex align-items-center gap-2">
                    <i className="bi bi-exclamation-triangle-fill" />
                    <span className="small fw-semibold">{actionError}</span>
                    <button type="button" className="btn-close ms-auto" onClick={() => setActionError(null)} />
                </div>
            )}

            {/* ── Stats cards ── */}
            <div className="row g-3 mb-3">
                {statsCards.map((s, i) => (
                    <div key={i} className="col-6 col-md-3">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-body p-3">
                                <div className="d-flex align-items-center gap-3 mb-2">
                                    <div className={`rounded-3 bg-${s.color} bg-opacity-10 d-flex align-items-center justify-content-center`} style={{ width:'44px', height:'44px', minWidth:'44px' }}>
                                        <i className={`bi ${s.icon} text-${s.color}`} />
                                    </div>
                                    <div>
                                        <p className="mb-0 text-muted small">{s.label}</p>
                                        <h5 className="fw-bold mb-0">{s.value}</h5>
                                    </div>
                                </div>
                                <small className={`text-${s.color} fw-semibold`} style={{ fontSize:'11px' }}>
                                    <i className="bi bi-info-circle me-1" />{s.sub}
                                </small>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Onglets ── */}
            <ul className="nav nav-tabs mb-4">
                {([
                    { key:'deployments', label:'Déploiements',                       icon:'bi-truck'               },
                    { key:'items',       label:`Équipements (${pageItems.length})`,   icon:'bi-pc-display'          },
                    { key:'stats',       label:'Tableau de bord',                     icon:'bi-bar-chart-line-fill'  },
                ] as { key:Tab; label:string; icon:string }[]).map(tab => (
                    <li key={tab.key} className="nav-item">
                        <button className={`nav-link d-flex align-items-center gap-2 ${activeTab === tab.key ? 'active fw-bold' : ''}`}
                            onClick={() => setActiveTab(tab.key)}>
                            <i className={`bi ${tab.icon}`} />{tab.label}
                        </button>
                    </li>
                ))}
            </ul>

            {/* ══ TAB Déploiements ══ */}
            {activeTab === 'deployments' && (
                <>
                    <div className="card border-0 shadow-sm rounded-4 mb-4">
                        <div className="card-body p-3">
                            <div className="row g-3 align-items-center">
                                <div className="col-md-5">
                                    <div className="input-group">
                                        <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted" /></span>
                                        <input type="text" className="form-control border-start-0"
                                            placeholder="Rechercher par code, site..."
                                            value={keyword} onChange={e => { setKeyword(e.target.value); setPage(0); }} />
                                        {keyword && <button className="btn btn-outline-secondary" onClick={() => setKeyword('')}><i className="bi bi-x" /></button>}
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <select className="form-select rounded-3" value={filterRegion} onChange={e => handleRegionFilter(Number(e.target.value))}>
                                        <option value={0}>Toutes les régions</option>
                                        {regions.map(r => <option key={r.id} value={r.id}>{r.regionName}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <select className="form-select rounded-3" value={filterDistrict}
                                        onChange={e => { setFilterDistrict(Number(e.target.value)); setPage(0); }} disabled={!filterRegion}>
                                        <option value={0}>Tous les districts</option>
                                        {districts.map(d => <option key={d.id} value={d.id}>{d.DistrictName}</option>)}
                                    </select>
                                </div>
                                {activeRegionFilter && (
                                    <div className="col-md-1">
                                        <button className="btn btn-sm btn-primary rounded-3 w-100"
                                            onClick={() => { setActiveRegionFilter(undefined); handleRegionFilter(0); }}>
                                            <i className="bi bi-x-circle" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div id="deployments-table" className="card border-0 shadow-sm rounded-4">
                        <div className="card-body p-0">
                            {isLoading
                                ? <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
                                : apiError
                                    ? <div className="text-center py-5">
                                        <i className="bi bi-exclamation-triangle-fill text-danger fs-1 d-block mb-2" />
                                        <p className="text-danger fw-semibold">{apiError}</p>
                                        <button className="btn btn-sm btn-outline-primary" onClick={loadDeployments}><i className="bi bi-arrow-clockwise me-1" />Réessayer</button>
                                      </div>
                                : deployments.length === 0
                                    ? <div className="text-center py-5 text-muted"><i className="bi bi-truck fs-1 d-block mb-2" />Aucun déploiement trouvé</div>
                                : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>#</th><th>Code & Date</th><th>Localisation</th>
                                                <th>Équipements</th><th>Application</th>
                                                {isUnrestricted && <th>Partenaire</th>}
                                                <th>GPS</th>
                                                <th className="text-end no-print">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {deployments.map((d, i) => {
                                                const nbFonct  = d.items?.filter(it => it.status === 'FONCTIONNEL').length || 0;
                                                const nbTotal  = d.items?.length || 0;
                                                const pctFonct = nbTotal > 0 ? Math.round((nbFonct / nbTotal) * 100) : 0;
                                                return (
                                                <tr key={d.id}>
                                                    <td className="text-muted small">{page * 10 + i + 1}</td>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div className="rounded-3 bg-primary bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width:'38px', height:'38px', minWidth:'38px' }}>
                                                                <i className="bi bi-truck text-primary" />
                                                            </div>
                                                            <div>
                                                                <span className="fw-bold d-block">{d.codeDep}</span>
                                                                <small className="text-muted">{new Date(d.dateRecep).toLocaleDateString('fr-FR')}</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="badge bg-danger bg-opacity-10 text-danger d-block mb-1">{d.healthDeploy}</span>
                                                        <span className="badge bg-info bg-opacity-10 text-info d-block mb-1">{d.districtDeploy}</span>
                                                        <span className="badge bg-success bg-opacity-10 text-success d-block">{d.regionDeploy}</span>
                                                    </td>
                                                    <td style={{ minWidth:'180px' }}>
                                                        <div className="d-flex align-items-center gap-2 mb-1">
                                                            <span className="badge bg-primary bg-opacity-10 text-primary">{nbTotal} équip.</span>
                                                            <span className={`badge ${pctFonct === 100 ? 'bg-success bg-opacity-10 text-success' : pctFonct >= 50 ? 'bg-warning bg-opacity-10 text-warning' : 'bg-danger bg-opacity-10 text-danger'}`}>{pctFonct}% ok</span>
                                                        </div>
                                                        <div className="progress rounded-3" style={{ height:'5px' }}>
                                                            <div className={`progress-bar ${pctFonct === 100 ? 'bg-success' : pctFonct >= 50 ? 'bg-warning' : 'bg-danger'}`} style={{ width:`${pctFonct}%` }} />
                                                        </div>
                                                        <div className="d-flex flex-wrap gap-1 mt-1">
                                                            {d.items?.slice(0, 3).map(item => (
                                                                <span key={item.id} className="badge bg-light text-dark border" style={{ fontSize:'9px' }}>{item.typeName}</span>
                                                            ))}
                                                            {nbTotal > 3 && <span className="badge bg-secondary bg-opacity-10 text-secondary" style={{ fontSize:'9px' }}>+{nbTotal - 3}</span>}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div style={{ width:'32px', height:'32px', borderRadius:'8px', background: hexToRgba(d.appsColor || '#616161', 0.15), border: `1.5px solid ${d.appsColor || '#616161'}`, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
                                                                {d.appsImage
                                                                    ? <img src={getImageSrc(d.appsImage)} alt={d.appsDeploy} style={{ width:'100%', height:'100%', objectFit:'contain', padding:'2px' }} />
                                                                    : <i className={`bi ${d.appsIcon || 'bi-app-indicator'}`} style={{ color: d.appsColor || '#616161', fontSize:'14px' }} />}
                                                            </div>
                                                            <span className="fw-semibold small" style={{ color: d.appsColor || '#616161' }}>{d.appsDeploy}</span>
                                                        </div>
                                                    </td>
                                                    {isUnrestricted && (
                                                        <td>{d.partnerName ? <span className="badge bg-warning bg-opacity-10 text-warning">{d.partnerName}</span> : <span className="text-muted small">—</span>}</td>
                                                    )}
                                                    <td>
                                                        <GpsTag latitude={d.latitude} longitude={d.longitude} />
                                                    </td>
                                                    <td className="text-end no-print">
                                                        <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handlePrintFiche(d)} title="Imprimer fiche">
                                                            <i className="bi bi-printer" />
                                                        </button>
                                                        <button className="btn btn-sm btn-outline-success me-1"
                                                            onClick={() => handleDownloadPdf(d)}
                                                            disabled={downloadingId === d.id}
                                                            title="Télécharger la fiche PDF">
                                                            {downloadingId === d.id
                                                                ? <span className="spinner-border spinner-border-sm" />
                                                                : <i className="bi bi-file-earmark-pdf" />}
                                                        </button>
                                                        {canEdit && nbTotal > 0 && (
                                                            <button className="btn btn-sm btn-outline-warning me-1" onClick={() => handleOpenReturnModal(d)}>
                                                                <i className="bi bi-arrow-return-left" />
                                                            </button>
                                                        )}
                                                        {canEdit && (
                                                            <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => { setSelected(d); setShowUpdate(true); }}>
                                                                <i className="bi bi-pencil" />
                                                            </button>
                                                        )}
                                                        {canDelete && (
                                                            <button className="btn btn-sm btn-outline-danger" onClick={() => { setSelectedId(d.id); setShowConfirm(true); }}>
                                                                <i className="bi bi-trash" />
                                                            </button>  )}
                                                    </td>
                                                </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                    </div>
                </>
            )}

            {/* ══ TAB Équipements ══ */}
            {activeTab === 'items' && (
                <div id="items-table" className="card border-0 shadow-sm rounded-4">
                    <div className="card-body p-0">
                        {pageItems.length === 0
                            ? <div className="text-center py-5 text-muted"><i className="bi bi-pc-display fs-1 d-block mb-2" />Aucun équipement</div>
                            : <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr><th>#</th><th>Type</th><th>Tag</th><th>Série</th><th>État</th><th>Déploiement</th><th>Site</th><th>Région</th>{isUnrestricted && <th>Partenaire</th>}</tr>
                                    </thead>
                                    <tbody>
                                        {pageItems.map((item, i) => (
                                            <tr key={`${item.id}-${i}`}>
                                                <td className="text-muted small">{i+1}</td>
                                                <td><span className="badge bg-primary bg-opacity-10 text-primary">{item.typeName}</span></td>
                                                <td><span className="badge bg-warning bg-opacity-10 text-warning" style={{ fontFamily:'monospace' }}>{item.tag}</span></td>
                                                <td><span className="badge bg-success bg-opacity-10 text-success" style={{ fontFamily:'monospace' }}>{item.serial}</span></td>
                                                <td><span className={`badge ${item.status === 'FONCTIONNEL' ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}>{item.status === 'FONCTIONNEL' ? '✅ Fonctionnel' : '❌ Non fonctionnel'}</span></td>
                                                <td><span className="fw-semibold small">{(item as any).codeDep}</span></td>
                                                <td><span className="badge bg-danger bg-opacity-10 text-danger">{(item as any).healthDeploy}</span></td>
                                                <td><span className="badge bg-info bg-opacity-10 text-info">{(item as any).regionDeploy}</span></td>
                                                {isUnrestricted && <td>{(item as any).partnerName ? <span className="badge bg-warning bg-opacity-10 text-warning">{(item as any).partnerName}</span> : <span className="text-muted small">—</span>}</td>}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                              </div>}
                    </div>
                </div>
            )}

            {/* ══ TAB Tableau de bord ══ */}
            {activeTab === 'stats' && (
                <div className="row g-4">
                    <div className="col-lg-6">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-header bg-white border-0 pt-3 pb-0 px-4">
                                <h6 className="fw-bold mb-0"><i className="bi bi-clock-history text-primary me-2" />Derniers déploiements</h6>
                            </div>
                            <div className="card-body px-4 py-3">
                                {recentDeployments.length === 0
                                    ? <p className="text-muted small text-center py-3">Aucun déploiement</p>
                                    : recentDeployments.map((d, i) => (
                                    <div key={d.id} className={`d-flex align-items-center gap-3 py-2 ${i < recentDeployments.length - 1 ? 'border-bottom' : ''}`}>
                                        <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width:'36px', height:'36px' }}>
                                            <i className="bi bi-truck text-primary small" />
                                        </div>
                                        <div className="flex-grow-1">
                                            <span className="fw-semibold small d-block">{d.codeDep}</span>
                                            <small className="text-muted">{d.healthDeploy} — {d.regionDeploy}</small>
                                        </div>
                                        <div className="text-end">
                                            <span className="badge bg-primary bg-opacity-10 text-primary d-block">{d.items?.length || 0} équip.</span>
                                            <small className="text-muted" style={{ fontSize:'10px' }}>{new Date(d.dateRecep).toLocaleDateString('fr-FR')}</small>
                                            {d.latitude != null && <div className="mt-1"><GpsTag latitude={d.latitude} longitude={d.longitude} compact /></div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-6">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-header bg-white border-0 pt-3 pb-0 px-4">
                                <h6 className="fw-bold mb-0"><i className="bi bi-app-indicator text-success me-2" />Déploiements par application</h6>
                            </div>
                            <div className="card-body px-4 py-3">
                                {statsByApp.length === 0
                                    ? <p className="text-muted small text-center py-3">Aucune donnée</p>
                                    : statsByApp.map((app, i) => {
                                    const pct = allDeployments.length > 0 ? Math.round((app.count / allDeployments.length) * 100) : 0;
                                    return (
                                    <div key={i} className={`py-2 ${i < statsByApp.length - 1 ? 'border-bottom' : ''}`}>
                                        <div className="d-flex align-items-center gap-2 mb-1">
                                            <div style={{ width:'28px', height:'28px', borderRadius:'6px', background: hexToRgba(app.color, 0.15), border: `1px solid ${app.color}`, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
                                                {app.image ? <img src={getImageSrc(app.image)} alt={app.name} style={{ width:'100%', height:'100%', objectFit:'contain', padding:'2px' }} />
                                                           : <i className={`bi ${app.icon}`} style={{ color: app.color, fontSize:'12px' }} />}
                                            </div>
                                            <span className="fw-semibold small flex-grow-1" style={{ color: app.color }}>{app.name}</span>
                                            <span className="fw-bold small">{app.count}</span>
                                            <span className="text-muted small" style={{ minWidth:'35px', textAlign:'right' }}>{pct}%</span>
                                        </div>
                                        <div className="progress rounded-3" style={{ height:'6px' }}>
                                            <div className="progress-bar" style={{ width:`${pct}%`, backgroundColor: app.color }} />
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="col-12">
                        <div className="card border-0 shadow-sm rounded-4">
                            <div className="card-header bg-white border-0 pt-3 pb-0 px-4">
                                <h6 className="fw-bold mb-0"><i className="bi bi-map text-info me-2" />Couverture par région</h6>
                            </div>
                            <div className="card-body p-0">
                                {topRegions.length === 0
                                    ? <p className="text-muted small text-center py-3">Aucune donnée</p>
                                    : <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="table-light">
                                                <tr><th>Région</th><th className="text-center">Déploiements</th><th className="text-center">Équipements</th><th>Couverture</th></tr>
                                            </thead>
                                            <tbody>
                                                {topRegions.map((r, i) => {
                                                    const depRegion   = allDeployments.filter(d => d.regionDeploy === r.label);
                                                    const itemsRegion = depRegion.flatMap(d => d.items || []);
                                                    const pct = allDeployments.length > 0 ? Math.round((r.count / allDeployments.length) * 100) : 0;
                                                    return (
                                                    <tr key={i}>
                                                        <td>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <div className="rounded-3 bg-success bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width:'32px', height:'32px', minWidth:'32px' }}>
                                                                    <i className="bi bi-geo-alt-fill text-success small" />
                                                                </div>
                                                                <span className="fw-semibold small">{r.label}</span>
                                                            </div>
                                                        </td>
                                                        <td className="text-center"><span className="badge bg-primary bg-opacity-10 text-primary fw-bold">{r.count}</span></td>
                                                        <td className="text-center"><span className="badge bg-success bg-opacity-10 text-success fw-bold">{itemsRegion.length}</span></td>
                                                        <td style={{ minWidth:'160px' }}>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <div className="progress flex-grow-1 rounded-3" style={{ height:'8px' }}>
                                                                    <div className="progress-bar bg-success" style={{ width:`${pct}%` }} />
                                                                </div>
                                                                <small className="text-muted fw-semibold" style={{ minWidth:'35px' }}>{pct}%</small>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modals ── */}
            {printModalTarget && (
                <PrintPreviewModal show={showPrintModal} title={`Fiche — ${printModalTarget.codeDep}`}
                    tableId="print-zone" onHide={() => { setShowPrintModal(false); setPrintModalTarget(null); }} />
            )}
            <DeploymentFormModal   show={showForm}   onHide={() => setShowForm(false)}   onSuccess={() => { loadDeployments(); loadAllForStats(); }} />
            <DeploymentUpdateModal show={showUpdate} onHide={() => { setShowUpdate(false); setSelected(null); }} onSuccess={() => { loadDeployments(); loadAllForStats(); }} deployment={selected} />
            <ReturnItemModal show={showReturnModal} deployment={returnTarget}
                onHide={() => { setShowReturnModal(false); setReturnTarget(null); }}
                onConfirmOne={handleItemSelected} onConfirmAll={handleReturnAll} />
            <ConfirmModal show={showReturnConfirm} title="Confirmer le retour en stock"
                message={`Confirmer le retour de "${returnItem?.label}" en stock ? Il sera remis en DISPONIBLE.`}
                onConfirm={handleReturnConfirm} onCancel={() => { setShowReturnConfirm(false); setReturnItem(null); }} isLoading={returnLoading} />
            <ConfirmModal show={showReturnAllConfirm} title="Retourner tous les équipements"
                message={`Retourner les ${returnTarget?.items?.length || 0} équipement(s) de "${returnTarget?.codeDep}" en stock ? Le déploiement sera supprimé.`}
                onConfirm={handleReturnAllConfirm} onCancel={() => { setShowReturnAllConfirm(false); setReturnTarget(null); }} isLoading={returnAllLoading} />
            <ConfirmModal show={showConfirm} title="Supprimer le déploiement"
                message="Êtes-vous sûr ? Les équipements retourneront en stock."
                onConfirm={handleDeleteConfirm} onCancel={() => setShowConfirm(false)} isLoading={deleteLoading} />
        </MainLayout>
    );
};

export default DeploymentsPage;