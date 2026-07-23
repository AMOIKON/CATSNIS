import React, { useState, useEffect, useCallback } from 'react';
import MainLayout              from '../../components/common/MainLayout';
import ConfirmModal            from '../../components/common/ConfirmModal';
import Pagination              from '../../components/common/Pagination';
import PrintPreviewModal       from '../../components/common/Printpreviewmodal';
import InterventionFormModal   from './InterventionFormModal';
import InterventionUpdateModal from './interventionUpdateModal';
import InterventionService     from '../../services/interventionService';
import RegionService           from '../../services/regionService';
import DistrictService         from '../../services/districtService';
import { InterventionResponse, RegionResponse, DistrictResponse } from '../../types';
import { buildHeader, getPrintConfig } from '../../services/globalprintservice';
import useAuth                 from '../../hooks/useAuth';
import { getImageSrc }         from '../../utils/imageUtils';
import GpsTag                  from '../../components/common/GpsTag';

type Tab = 'liste' | 'dashboard';

// ── Badges ────────────────────────────────────────────────────────────────────
const TypeBadge: React.FC<{ type: string }> = ({ type }) => (
    <span className={`badge d-inline-flex align-items-center gap-1 ${
        type === 'EN_LIGNE'
            ? 'bg-primary bg-opacity-10 text-primary'
            : 'bg-success bg-opacity-10 text-success'}`}>
        <i className={`bi ${type === 'EN_LIGNE' ? 'bi-telephone-fill' : 'bi-geo-alt-fill'}`} />
        {type === 'EN_LIGNE' ? 'En ligne' : 'Sur site'}
    </span>
);

const ACTION_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
    MAINTENANCE:            { color: '#f59e0b', icon: 'bi-wrench',       label: 'Maintenance'            },
    MAINTENANCE_CURATIVE:   { color: '#ef4444', icon: 'bi-tools',        label: 'Maintenance curative'   },
    MAINTENANCE_PREVENTIVE: { color: '#8b5cf6', icon: 'bi-shield-check', label: 'Maintenance préventive' },
    REPARATION:             { color: '#ef4444', icon: 'bi-tools',        label: 'Réparation'             },
    REMPLACEMENT:           { color: '#3b82f6', icon: 'bi-arrow-repeat', label: 'Remplacement'           },
};

const ActionBadge: React.FC<{ action: string }> = ({ action }) => {
    const c = ACTION_CONFIG[action] || { color: '#6c757d', icon: 'bi-question', label: action };
    return (
        <span className="d-inline-flex align-items-center gap-1 fw-semibold small" style={{ color: c.color }}>
            <i className={`bi ${c.icon}`} />{c.label}
        </span>
    );
};

const LogoBadge: React.FC<{ image?: string; icon?: string; color?: string; name?: string; size?: number }> = ({ image, icon, color, name, size = 28 }) => (
    <div className="d-flex align-items-center gap-2">
        {image
            ? <img src={getImageSrc(image)} alt={name} style={{ width: `${size}px`, height: `${size}px`, objectFit: 'contain', flexShrink: 0 }} onError={e => (e.currentTarget.style.display = 'none')} />
            : <i className={`bi ${icon || 'bi-building'}`} style={{ color: color || '#616161', fontSize: `${size * 0.6}px`, flexShrink: 0 }} />}
        <span className="fw-semibold small" style={{ color: color || '#616161' }}>{name || '—'}</span>
    </div>
);

const itemBadgeClass = (s?: string) =>
    s === 'EN_ATTENTE_INTERVENTION_SITE' || s === 'NON_FONCTIONNEL' ? 'bg-danger bg-opacity-10 text-danger'
    : s === 'REMPLACE'  ? 'bg-secondary bg-opacity-10 text-secondary'
    : s === 'DEGRADE'   ? 'bg-warning bg-opacity-10 text-warning'
    : 'bg-success bg-opacity-10 text-success';

const formatStatut = (s?: string) =>
    ({ FONCTIONNEL: '✅ Fonctionnel', DEGRADE: '⚠️ Dégradé', EN_ATTENTE_INTERVENTION_SITE: '🔴 En attente site', NON_FONCTIONNEL: '❌ Non fonctionnel', REMPLACE: '🔄 Remplacé' }[s || ''] || s || '—');

const formatEtat = (etat?: string | null) =>
    etat === 'NON_FONCTIONNEL' ? '❌ Non fonctionnel' : etat === 'DEGRADE' ? '⚠️ Dégradé' : '✅ Fonctionnel';

const isHorsBase = (inter: InterventionResponse) =>
    !inter.deploymentId && !!inter.manualEquipmentName?.trim();

// ── Page ──────────────────────────────────────────────────────────────────────
const InterventionsPage: React.FC = () => {
    const { person } = useAuth();
    const role      = person?.role;
    const canCreate = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'TECHNICIEN';
    const canEdit   = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'TECHNICIEN';
    const canDelete = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'TECHNICIEN';
    // ✅ NOUVEAU — SUPER_ADMIN/ADMIN voient les filtres région/district globaux ;
    //    TECHNICIEN/LOGISTICIEN sont déjà restreints à leur périmètre côté backend
    //    (interventions EN_LIGNE) donc ces filtres n'ont plus d'utilité pour eux.
    const canSeeGlobalFilters = role === 'SUPER_ADMIN' || role === 'ADMIN';
    const isPerimeterRestricted = role === 'TECHNICIEN' || role === 'LOGISTICIEN';

    const [activeTab,      setActiveTab]      = useState<Tab>('liste');
    const [activeFilter,   setActiveFilter]   = useState<'ALL' | 'EN_LIGNE' | 'SUR_SITE' | 'HORS_BASE'>('ALL');
    const [interventions,  setInterventions]  = useState<InterventionResponse[]>([]);
    const [regions,        setRegions]        = useState<RegionResponse[]>([]);
    const [districts,      setDistricts]      = useState<DistrictResponse[]>([]);
    const [totalPages,     setTotalPages]     = useState(0);
    const [totalElements,  setTotalElements]  = useState(0);
    const [page,           setPage]           = useState(0);
    const [keyword,        setKeyword]        = useState('');
    const [filterRegion,   setFilterRegion]   = useState<number>(0);
    const [filterDistrict, setFilterDistrict] = useState<number>(0);
    const [isLoading,      setIsLoading]      = useState(false);
    const [isPrinting,     setIsPrinting]     = useState(false);
    const [showForm,       setShowForm]       = useState(false);
    const [showUpdate,     setShowUpdate]     = useState(false);
    const [showConfirm,    setShowConfirm]    = useState(false);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [selected,       setSelected]       = useState<InterventionResponse | null>(null);
    const [selectedId,     setSelectedId]     = useState<number | null>(null);
    const [deleteLoading,  setDeleteLoading]  = useState(false);
    const [printTarget,    setPrintTarget]    = useState<InterventionResponse | null>(null);
    const [printModal,     setPrintModal]     = useState<InterventionResponse | null>(null);
    const [sendingEmailId, setSendingEmailId]  = useState<number | null>(null);
    const [emailFeedback,  setEmailFeedback]   = useState<{ type: 'success' | 'danger' | 'warning'; text: string } | null>(null);
    const [stats, setStats]                   = useState({ totalEnLigne: 0, totalSurSite: 0, totalGlobal: 0, totalHorsBase: 0 });

    useEffect(() => {
        if (canSeeGlobalFilters) RegionService.getAllList().then(setRegions);
        InterventionService.getStats().then(setStats).catch(console.error);
    }, [canSeeGlobalFilters]);

    const handleRegionFilter = async (regionId: number) => {
        setFilterRegion(regionId); setFilterDistrict(0); setPage(0);
        if (regionId) { const data = await DistrictService.getAllList(regionId); setDistricts(data); }
        else setDistricts([]);
    };

    const loadInterventions = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await InterventionService.getAll(
                page, 10,
                filterRegion   || undefined,
                filterDistrict || undefined,
                undefined,
                keyword        || undefined
            );
            setInterventions(data.content);
            setTotalPages(data.page.totalPages);
            setTotalElements(data.page.totalElements);
        } catch (err) { console.error(err); }
        finally { setIsLoading(false); }
    }, [page, keyword, filterRegion, filterDistrict]);

    useEffect(() => { loadInterventions(); }, [loadInterventions]);

    const refreshAll = () => {
        loadInterventions();
        InterventionService.getStats().then(setStats);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedId) return;
        setDeleteLoading(true);
        try { await InterventionService.delete(selectedId); refreshAll(); }
        catch (err) { console.error(err); }
        finally { setDeleteLoading(false); setShowConfirm(false); setSelectedId(null); }
    };

    const handlePrintFiche = (inter: InterventionResponse) => {
        setPrintTarget(inter);
        setPrintModal(inter);
        setShowPrintModal(true);
    };

    // ✅ Téléchargement de la fiche PDF + ouverture du client email pré-rempli
    //    (remplace l'ancien envoi SMTP côté serveur)
    const handleDownloadAndMail = async (inter: InterventionResponse) => {
        setEmailFeedback(null);

        const recipientEmail = inter.personEmail?.trim();
        if (!recipientEmail) {
            setEmailFeedback({
                type: 'warning',
                text: `Aucun email renseigné pour le bénéficiaire de ${inter.codeInter}. `
                    + `Ajoutez-en un dans sa fiche (carnet) ou en modification d'intervention.`,
            });
            setTimeout(() => setEmailFeedback(null), 8000);
            return;
        }

        setSendingEmailId(inter.id);
        try {
            // ── 1. Télécharger le PDF ────────────────────────────────────────
            const blob = await InterventionService.downloadPdf(inter.id);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `fiche-intervention-${inter.codeInter}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            // ── 2. Ouvrir le client email pré-rempli ─────────────────────────
            const subject = encodeURIComponent(`Fiche d'intervention — ${inter.codeInter}`);
            const body = encodeURIComponent(
                `Bonjour${inter.personName ? ' ' + inter.personName.trim() : ''},\n\n`
                + `Veuillez trouver ci-joint la fiche récapitulative de l'intervention ${inter.codeInter} `
                + `réalisée le ${new Date(inter.dateInter).toLocaleDateString('fr-FR')}.\n\n`
                + `⚠️ Le PDF vient d'être téléchargé — pensez à le joindre manuellement à cet email.\n\n`
                + `Cordialement,\n${inter.technicianName || ''}`
            );
            window.location.href = `mailto:${recipientEmail}?subject=${subject}&body=${body}`;

            setEmailFeedback({
                type: 'success',
                text: `Fiche téléchargée pour ${inter.codeInter}. N'oubliez pas de joindre le PDF dans votre client email.`,
            });
        } catch (err: any) {
            setEmailFeedback({
                type: 'danger',
                text: err.response?.data?.message || 'Échec de la génération du PDF.',
            });
        } finally {
            setSendingEmailId(null);
            setTimeout(() => setEmailFeedback(null), 8000);
        }
    };

    const handlePrintAll = async () => {
        setIsPrinting(true);
        try {
            const raw = await InterventionService.getAllForPrint(
                filterRegion   || undefined,
                filterDistrict || undefined,
                undefined,
                keyword        || undefined
            );
            const all = activeFilter === 'ALL' ? raw
                : activeFilter === 'HORS_BASE' ? raw.filter(isHorsBase)
                : raw.filter(i => i.typeInter === activeFilter);
            const cfg = getPrintConfig();
            const typeLabel = activeFilter === 'EN_LIGNE' ? ' — En ligne'
                : activeFilter === 'SUR_SITE' ? ' — Sur site'
                : activeFilter === 'HORS_BASE' ? ' — Assistance technique (hors base)' : '';
            const header = buildHeader(`Liste des interventions${typeLabel}`, cfg);

            const actionLabels: Record<string, string> = {
                MAINTENANCE:            'Maintenance',
                MAINTENANCE_CURATIVE:   'Maintenance curative',
                MAINTENANCE_PREVENTIVE: 'Maintenance préventive',
                REPARATION:             'Réparation',
                REMPLACEMENT:           'Remplacement',
            };

            const rows = all.map((inter, i) => `
                <tr>
                    <td style="color:#6c757d;font-size:10px;">${i + 1}</td>
                    <td style="font-weight:600;font-size:10px;">${inter.codeInter}</td>
                    <td style="font-size:10px;">${new Date(inter.dateInter).toLocaleDateString('fr-FR')}</td>
                    <td style="font-size:10px;color:${inter.typeInter === 'EN_LIGNE' ? '#0d6efd' : '#198754'};font-weight:600;">${inter.typeInter === 'EN_LIGNE' ? 'En ligne' : 'Sur site'}</td>
                    <td style="font-size:10px;">${actionLabels[inter.actionInter] || inter.actionInter}</td>
                    <td><span style="background:#fce4e4;color:#921919;padding:1px 6px;border-radius:20px;font-size:10px;">${inter.healthName || '—'}</span></td>
                    <td><span style="background:#d1e7dd;color:#0a3622;padding:1px 6px;border-radius:20px;font-size:10px;">${inter.regionName || '—'}</span></td>
                    <td style="font-size:10px;">${inter.technicianName || '—'}</td>
                    <td style="text-align:center;"><span style="background:#e3f2fd;color:#1565c0;padding:1px 6px;border-radius:20px;font-size:10px;">${inter.durationMinutes} min</span></td>
                    <td style="font-size:10px;color:${inter.enAttenteMaintenance ? '#fd7e14' : '#198754'};font-weight:600;">${inter.enAttenteMaintenance ? 'En attente' : 'Normal'}</td>
                    <td style="font-size:10px;color:#198754;">${inter.latitude != null ? `${inter.latitude.toFixed(4)}, ${inter.longitude?.toFixed(4)}` : '—'}</td>
                </tr>`).join('');

            const html = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8"/>
    <title>Interventions — CATUSNIS</title>
    <style>
        @page { margin:1.5cm; size:A4 landscape; }
        body  { font-family:Arial,sans-serif; color:#333; margin:0; }
        .total { font-size:12px; color:#6c757d; margin:8px 0 16px; }
        table { width:100%; border-collapse:collapse; }
        th  { background:#f8f9fa; border:1px solid #dee2e6; padding:6px 8px; font-size:10px; text-align:left; }
        td  { border:1px solid #dee2e6; padding:6px 8px; font-size:11px; }
        tr:nth-child(even) { background:#f9f9f9; }
    </style>
</head>
<body>
    ${header}
    <p class="total">${all.length} intervention(s) — ${all.reduce((s, i) => s + i.durationMinutes, 0)} min total</p>
    <table>
        <thead>
            <tr>
                <th>#</th><th>Code</th><th>Date</th><th>Type</th><th>Action</th>
                <th>Site</th><th>Région</th><th>Technicien</th>
                <th style="text-align:center">Durée</th><th>Statut</th><th>GPS</th>
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

    // ── Stats ─────────────────────────────────────────────────────────────────
    const enAttenteCount = interventions.filter(i => i.enAttenteMaintenance).length;
    const statsCards = [
        { label: 'Total interventions',   value: totalElements,       icon: 'bi-tools',          color: 'primary',                                   sub: 'enregistrées'          },
        { label: 'Minutes EN LIGNE',      value: stats.totalEnLigne,  icon: 'bi-telephone-fill', color: 'info',                                      sub: 'min téléphone'         },
        { label: 'Minutes SUR SITE',      value: stats.totalSurSite,  icon: 'bi-geo-alt-fill',   color: 'success',                                   sub: 'min sur place'         },
        { label: 'En attente',            value: enAttenteCount,      icon: 'bi-clock-history',  color: enAttenteCount > 0 ? 'warning' : 'secondary', sub: 'maintenance requise'   },
        { label: 'Assistances techniques', value: stats.totalHorsBase, icon: 'bi-pencil-square', color: 'dark',                                      sub: 'équipement hors base'  },
    ];

    const typeCards = [
        { key: 'EN_LIGNE' as const,   label: 'En ligne',   icon: 'bi-telephone-fill', color: 'primary',   count: interventions.filter(i => i.typeInter === 'EN_LIGNE').length },
        { key: 'SUR_SITE' as const,   label: 'Sur site',   icon: 'bi-geo-alt-fill',   color: 'success',   count: interventions.filter(i => i.typeInter === 'SUR_SITE').length },
        { key: 'HORS_BASE' as const,  label: 'Hors base',  icon: 'bi-pencil-square',  color: 'indigo',    count: interventions.filter(isHorsBase).length },
    ];

    const filtered = activeFilter === 'ALL' ? interventions
        : activeFilter === 'HORS_BASE' ? interventions.filter(isHorsBase)
        : interventions.filter(i => i.typeInter === activeFilter);

    const actionStats = Object.entries(ACTION_CONFIG).map(([key, conf]) => ({
        key, label: conf.label, color: conf.color, icon: conf.icon,
        count: interventions.filter(i => i.actionInter === key).length,
    })).filter(s => s.count > 0);

    const recentInterventions = [...interventions].slice(0, 5);

    return (
        <MainLayout title="Interventions">
            <style>{`@media print { body * { visibility: hidden; } #print-zone, #print-zone * { visibility: visible; } #print-zone { position: absolute; left: 0; top: 0; width: 100%; } .d-none { display: block !important; } }`}</style>

            {/* ── Zone impression fiche individuelle ─── */}
            {printTarget && (() => {
                const cfg      = getPrintConfig();
                const leftSrc  = cfg.leftImageUrl  || (printTarget.partnerImage ? getImageSrc(printTarget.partnerImage) : null);
                const rightSrc = cfg.rightImageUrl || (printTarget.appsImage    ? getImageSrc(printTarget.appsImage)    : null);
                const bgLogo   = cfg.bgImageUrl    || null;
                return (
                <div id="print-zone" className="d-none">
                    <style>{`@media print {
                        @page { margin: 1cm; size: A4 portrait; }
                        ${bgLogo ? `#print-bg-wm { position:fixed!important; top:50%!important; left:50%!important; transform:translate(-50%,-50%)!important; width:400px!important; height:400px!important; opacity:0.07!important; z-index:0!important; pointer-events:none!important; }` : ''}
                        #print-header-logos { display:flex!important; }
                        #print-content { position:relative!important; z-index:1!important; }
                    }`}</style>
                    <div style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', color: '#222' }}>
                        {bgLogo && <img id="print-bg-wm" src={bgLogo} alt="" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '400px', height: '400px', objectFit: 'contain', opacity: 0.07, zIndex: 0, pointerEvents: 'none' }} />}
                        <div id="print-content" style={{ position: 'relative', zIndex: 1 }}>
                            <div id="print-header-logos" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: '2.5px solid #0d6efd' }}>
                                <div style={{ width: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {leftSrc ? <img src={leftSrc} alt="logo-g" style={{ maxWidth: '90px', maxHeight: '80px', objectFit: 'contain', display: 'block' }} /> : <div style={{ width: '80px', height: '70px' }} />}
                                </div>
                                <div style={{ textAlign: 'center', flex: 1, padding: '0 12px' }}>
                                    <h2 style={{ margin: '0 0 3px 0', fontSize: '18px', color: '#0d6efd', fontWeight: 'bold', textTransform: 'uppercase' }}>FICHE D'INTERVENTION</h2>
                                    <p style={{ margin: '0', color: '#555', fontSize: '12px' }}>
                                        {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        {' — Imprimé à '}
                                        {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '3px' }}>
                                        {printTarget.technicianName && <span style={{ padding: '3px 12px', background: '#f0f0f0', borderRadius: '20px', fontSize: '11px' }}>👤 {printTarget.technicianName}</span>}
                                        {printTarget.enAttenteMaintenance && <span style={{ padding: '3px 12px', background: '#fff3cd', borderRadius: '20px', fontSize: '11px', color: '#856404' }}>⚠️ En attente maintenance</span>}
                                        {!printTarget.deploymentId && printTarget.manualEquipmentName && <span style={{ padding: '3px 12px', background: '#e0e7ff', borderRadius: '20px', fontSize: '11px', color: '#3730a3' }}>🔧 Assistance technique</span>}
                                    </div>
                                </div>
                                <div style={{ width: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {rightSrc ? <img src={rightSrc} alt="logo-d" style={{ maxWidth: '90px', maxHeight: '80px', objectFit: 'contain', display: 'block' }} /> : <div style={{ width: '80px', height: '70px' }} />}
                                </div>
                            </div>

                            <table style={{ width: '100%', marginBottom: '8px', borderCollapse: 'collapse', fontSize: '11px' }}>
                                <tbody>
                                    <tr><td style={{ padding: '5px 8px', width: '50%', background: '#f8f9fa', border: '1px solid #e9ecef' }}><strong>Code :</strong> {printTarget.codeInter}</td><td style={{ padding: '5px 8px', background: '#f8f9fa', border: '1px solid #e9ecef' }}><strong>Date :</strong> {new Date(printTarget.dateInter).toLocaleDateString('fr-FR')}</td></tr>
                                    <tr><td style={{ padding: '5px 8px', border: '1px solid #e9ecef' }}><strong>Type :</strong> {printTarget.typeInter === 'EN_LIGNE' ? '📞 En ligne' : '🏥 Sur site'}</td><td style={{ padding: '5px 8px', border: '1px solid #e9ecef' }}><strong>Action :</strong> {printTarget.actionInter}</td></tr>
                                    <tr><td style={{ padding: '5px 8px', background: '#f8f9fa', border: '1px solid #e9ecef' }}><strong>Site :</strong> {printTarget.healthName}</td><td style={{ padding: '5px 8px', background: '#f8f9fa', border: '1px solid #e9ecef' }}><strong>District :</strong> {printTarget.districtName}</td></tr>
                                    <tr><td style={{ padding: '5px 8px', border: '1px solid #e9ecef' }}><strong>Région :</strong> {printTarget.regionName}</td><td style={{ padding: '5px 8px', border: '1px solid #e9ecef' }}><strong>Durée :</strong> {printTarget.durationMinutes} min</td></tr>
                                    <tr><td style={{ padding: '5px 8px', background: '#f8f9fa', border: '1px solid #e9ecef' }}><strong>Personne assistée :</strong> {printTarget.personName?.trim() || '—'}</td><td style={{ padding: '5px 8px', background: '#f8f9fa', border: '1px solid #e9ecef' }}><strong>Évaluation :</strong> {printTarget.evlName}</td></tr>
                                    {!printTarget.deploymentId && printTarget.manualEquipmentName && (
                                        <tr>
                                            <td style={{ padding: '5px 8px', border: '1px solid #e9ecef' }}><strong>Équipement (hors base) :</strong> {printTarget.manualEquipmentName}</td>
                                            <td style={{ padding: '5px 8px', border: '1px solid #e9ecef' }}><strong>Type :</strong> {printTarget.manualEquipmentType || '—'}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {/* ── GPS dans la fiche imprimée ── */}
                            {printTarget.latitude != null && printTarget.longitude != null && (
                                <div style={{ marginBottom: '8px', padding: '5px 10px', background: '#d1e7dd', borderRadius: '6px', border: '1px solid #a3cfbb', fontSize: '11px', color: '#0a3622', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>📍</span>
                                    <div>
                                        <strong>Coordonnées GPS :</strong>{' '}
                                        {printTarget.latitude.toFixed(6)}, {printTarget.longitude.toFixed(6)}
                                        {' — '}
                                        <a href={`https://www.google.com/maps?q=${printTarget.latitude},${printTarget.longitude}`}
                                           style={{ color: '#0a3622', fontWeight: 'bold' }}>
                                            Voir sur Google Maps ↗
                                        </a>
                                    </div>
                                </div>
                            )}

                            {printTarget.deploymentItems?.length > 0 && (<>
                                <h4 style={{ marginBottom: '6px', fontSize: '13px', borderLeft: '4px solid #0d6efd', paddingLeft: '8px' }}>Équipements concernés</h4>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginBottom: '8px' }}>
                                    <thead><tr style={{ background: '#0d6efd', color: 'white', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                        {['#', 'Type', 'Tag', 'N° Série', 'Statut', 'État avant', 'État après', 'Remplacement'].map(h => <th key={h} style={{ border: '1px solid #0d6efd', padding: '6px 8px' }}>{h}</th>)}
                                    </tr></thead>
                                    <tbody>{printTarget.deploymentItems.map((item, i) => (
                                        <tr key={item.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                                            <td style={{ border: '1px solid #dee2e6', padding: '5px 8px', textAlign: 'center', fontWeight: 'bold', color: '#0d6efd' }}>{i + 1}</td>
                                            <td style={{ border: '1px solid #dee2e6', padding: '5px 8px' }}>{item.typeName}</td>
                                            <td style={{ border: '1px solid #dee2e6', padding: '5px 8px', fontFamily: 'monospace' }}>{item.tag}</td>
                                            <td style={{ border: '1px solid #dee2e6', padding: '5px 8px', fontFamily: 'monospace' }}>{item.serial}</td>
                                            <td style={{ border: '1px solid #dee2e6', padding: '5px 8px' }}>{formatStatut(item.status)}</td>
                                            <td style={{ border: '1px solid #dee2e6', padding: '5px 8px' }}>{formatEtat(item.etatAvant)}</td>
                                            <td style={{ border: '1px solid #dee2e6', padding: '5px 8px' }}>{formatEtat(item.etatApres)}</td>
                                            <td style={{ border: '1px solid #dee2e6', padding: '5px 8px' }}>
                                                {item.replacementTag ? <span style={{ color: '#16a34a', fontWeight: 'bold' }}>🔧 {item.replacementTag} — {item.replacementSerial}</span> : '—'}
                                            </td>
                                        </tr>
                                    ))}</tbody>
                                </table>
                            </>)}

                            {printTarget.commentInter && <div style={{ marginBottom: '8px', padding: '6px 10px', background: '#f9f9f9', borderRadius: '6px', border: '1px solid #eee' }}><strong>Commentaire :</strong><p style={{ marginTop: '6px', marginBottom: 0 }}>{printTarget.commentInter}</p></div>}
                            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', gap: '40px' }}>
                                <div style={{ textAlign: 'center', flex: 1 }}><p style={{ fontWeight: 'bold' }}>Signature Technicien</p><p style={{ color: '#666', fontSize: '11px' }}>{printTarget.technicianName}</p><div style={{ marginTop: '15px', borderTop: '1px solid #333', paddingTop: '4px', fontSize: '10px', color: '#888' }}>Nom & Signature</div></div>
                                <div style={{ textAlign: 'center', flex: 1 }}><p style={{ fontWeight: 'bold' }}>{printTarget.typeInter === 'EN_LIGNE' ? 'Signature Responsable' : 'Signature Personne sur site'}</p><p style={{ color: '#666', fontSize: '11px' }}>{printTarget.personName?.trim() || printTarget.healthName}</p><div style={{ marginTop: '15px', borderTop: '1px solid #333', paddingTop: '4px', fontSize: '10px', color: '#888' }}>Nom & Signature</div></div>
                            </div>
                            <div style={{ marginTop: '12px', paddingTop: '6px', borderTop: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#aaa' }}>
                                <span>CATUSNIS — Document confidentiel</span>
                                <span>Généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    </div>
                </div>
                );
            })()}

            {/* ── Feedback envoi email ── */}
            {emailFeedback && (
                <div className={`alert alert-${emailFeedback.type} rounded-3 d-flex align-items-center gap-2`}>
                    <i className={`bi ${
                        emailFeedback.type === 'success' ? 'bi-check-circle'
                        : emailFeedback.type === 'warning' ? 'bi-exclamation-circle'
                        : 'bi-exclamation-triangle'
                    }`} />
                    {emailFeedback.text}
                </div>
            )}

            {/* ✅ NOUVEAU — Bandeau périmètre pour TECHNICIEN/LOGISTICIEN */}
            {isPerimeterRestricted && (
                <div className="alert alert-info rounded-3 d-flex align-items-center gap-2 mb-3">
                    <i className="bi bi-geo-alt-fill" />
                    <span className="small">
                        Vous consultez votre périmètre assigné : les interventions <strong>en ligne</strong> sont
                        limitées à vos sites assignés. Les interventions <strong>sur site</strong> ne sont pas restreintes.
                    </span>
                </div>
            )}

            {/* ── Header ── */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 className="fw-bold mb-0"><i className="bi bi-tools text-primary me-2" />Gestion des interventions</h5>
                    <small className="text-muted">{totalElements} intervention(s) — {stats.totalGlobal} min total</small>
                </div>
                <div className="d-flex gap-2 align-items-center">
                    {activeTab === 'liste' && (
                        <button className="btn btn-outline-secondary d-flex align-items-center gap-2" onClick={handlePrintAll} disabled={isPrinting}>
                            {isPrinting ? <><span className="spinner-border spinner-border-sm" role="status" />Chargement...</> : <><i className="bi bi-printer" />Imprimer</>}
                        </button>
                    )}
                    {canCreate && (
                        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => setShowForm(true)}>
                            <i className="bi bi-plus-circle-fill" />Nouvelle intervention
                        </button>
                    )}
                </div>
            </div>

            {/* ── Stats cards ── */}
            <div className="row g-3 mb-3">
                {statsCards.map((s, i) => (
                    <div key={i} className="col-6 col-md-3">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-body p-3">
                                <div className="d-flex align-items-center gap-3 mb-2">
                                    <div className={`rounded-3 bg-${s.color} bg-opacity-10 d-flex align-items-center justify-content-center`} style={{ width: '44px', height: '44px', minWidth: '44px' }}>
                                        <i className={`bi ${s.icon} text-${s.color}`} />
                                    </div>
                                    <div>
                                        <p className="mb-0 text-muted small">{s.label}</p>
                                        <h5 className="fw-bold mb-0">{s.value}</h5>
                                    </div>
                                </div>
                                <small className={`text-${s.color} fw-semibold`} style={{ fontSize: '11px' }}>
                                    <i className="bi bi-info-circle me-1" />{s.sub}
                                </small>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Type cards cliquables ── */}
            <div className="row g-2 mb-4">
                {[{ key: 'ALL' as const, label: 'Toutes', icon: 'bi-list-ul', color: 'secondary', count: totalElements },
                  ...typeCards].map((s, i) => {
                    const isActive = activeFilter === s.key;
                    const isIndigo = s.color === 'indigo';
                    const indigoBg = '#4f46e5';
                    return (
                        <div key={i} className="col-6 col-md-3">
                            <div className={`card rounded-4 h-100 ${!isIndigo ? (isActive ? `bg-${s.color} shadow` : 'border-0 shadow-sm') : 'border-0 shadow-sm'}`}
                                style={{
                                    cursor: 'pointer', transition: 'all 0.15s',
                                    ...(isIndigo && isActive ? { background: indigoBg, boxShadow: '0 .5rem 1rem rgba(0,0,0,.15)' } : {}),
                                }}
                                onClick={() => { setActiveFilter(s.key); setActiveTab('liste'); setPage(0); }}>
                                <div className="card-body p-3 d-flex align-items-center gap-3">
                                    <div className={!isIndigo ? `rounded-3 d-flex align-items-center justify-content-center ${isActive ? 'bg-white bg-opacity-25' : `bg-${s.color} bg-opacity-10`}` : 'rounded-3 d-flex align-items-center justify-content-center'}
                                        style={{
                                            width: '40px', height: '40px', minWidth: '40px',
                                            ...(isIndigo ? { background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(79,70,229,0.1)' } : {}),
                                        }}>
                                        <i className={`bi ${s.icon} ${!isIndigo ? (isActive ? 'text-white' : `text-${s.color}`) : ''}`}
                                            style={isIndigo ? { color: isActive ? '#fff' : indigoBg } : undefined} />
                                    </div>
                                    <div className="flex-grow-1">
                                        <p className="mb-0 small" style={{ color: isActive ? 'rgba(255,255,255,0.8)' : '#6c757d' }}>{s.label}</p>
                                        <h5 className={!isIndigo ? `fw-bold mb-0 ${isActive ? 'text-white' : `text-${s.color}`}` : 'fw-bold mb-0'}
                                            style={isIndigo ? { color: isActive ? '#fff' : indigoBg } : undefined}>{s.count}</h5>
                                    </div>
                                    {isActive && <i className="bi bi-check-circle-fill text-white" />}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Onglets ── */}
            <ul className="nav nav-tabs mb-4">
                {([
                    { key: 'liste',     label: `Liste (${filtered.length})`, icon: 'bi-list-ul' },
                    { key: 'dashboard', label: 'Tableau de bord',            icon: 'bi-bar-chart-line-fill' },
                ] as { key: Tab; label: string; icon: string }[]).map(tab => (
                    <li key={tab.key} className="nav-item">
                        <button className={`nav-link d-flex align-items-center gap-2 ${activeTab === tab.key ? 'active fw-bold' : ''}`}
                            onClick={() => setActiveTab(tab.key)}>
                            <i className={`bi ${tab.icon}`} />{tab.label}
                            {tab.key === 'liste' && enAttenteCount > 0 && (
                                <span className="badge bg-warning text-dark rounded-pill" style={{ fontSize: '10px' }}>{enAttenteCount}</span>
                            )}
                        </button>
                    </li>
                ))}
            </ul>

            {/* ══ TAB Liste ══ */}
            {activeTab === 'liste' && (
                <>
                    <div className="card border-0 shadow-sm rounded-4 mb-4">
                        <div className="card-body p-3">
                            <div className="row g-3 align-items-center">
                                <div className={canSeeGlobalFilters ? 'col-md-5' : 'col-md-11'}>
                                    <div className="input-group">
                                        <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted" /></span>
                                        <input type="text" className="form-control border-start-0"
                                            placeholder="Rechercher par code, commentaire..."
                                            value={keyword} onChange={e => { setKeyword(e.target.value); setPage(0); }} />
                                        {keyword && <button className="btn btn-outline-secondary" onClick={() => setKeyword('')}><i className="bi bi-x" /></button>}
                                    </div>
                                </div>
                                {/* ✅ Filtres région/district réservés à SUPER_ADMIN/ADMIN — un
                                    TECHNICIEN/LOGISTICIEN est déjà restreint à son périmètre
                                    assigné côté backend (interventions EN_LIGNE). */}
                                {canSeeGlobalFilters && (
                                    <>
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
                                    </>
                                )}
                                {activeFilter !== 'ALL' && (
                                    <div className="col-md-1">
                                        <button className="btn btn-sm btn-outline-secondary rounded-3 w-100" onClick={() => setActiveFilter('ALL')}>
                                            <i className="bi bi-x-circle" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div id="interventions-table" className="card border-0 shadow-sm rounded-4">
                        <div className="card-body p-0">
                            {isLoading
                                ? <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
                                : filtered.length === 0
                                    ? <div className="text-center py-5 text-muted"><i className="bi bi-tools fs-1 d-block mb-2" />Aucune intervention trouvée</div>
                                : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>#</th><th>Code & Date</th><th>Type</th><th>Action</th>
                                                <th>Localisation</th><th>Équipements</th>
                                                <th>Application</th><th>Bailleur</th>
                                                <th>Technicien</th><th>Personne</th>
                                                <th>Durée</th><th>GPS</th><th>Statut</th>
                                                <th className="text-end no-print">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered.map((inter, i) => (
                                                <tr key={inter.id} style={{ background: inter.enAttenteMaintenance ? '#fffbf0' : undefined }}>
                                                    <td className="text-muted small">{page * 10 + i + 1}</td>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div className={`rounded-3 d-flex align-items-center justify-content-center ${inter.typeInter === 'EN_LIGNE' ? 'bg-primary bg-opacity-10' : 'bg-success bg-opacity-10'}`} style={{ width: '36px', height: '36px', minWidth: '36px' }}>
                                                                <i className={`bi ${inter.typeInter === 'EN_LIGNE' ? 'bi-telephone-fill text-primary' : 'bi-geo-alt-fill text-success'} small`} />
                                                            </div>
                                                            <div>
                                                                <span className="fw-bold d-block small">{inter.codeInter}</span>
                                                                <small className="text-muted">{new Date(inter.dateInter).toLocaleDateString('fr-FR')}</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td><TypeBadge type={inter.typeInter} /></td>
                                                    <td><ActionBadge action={inter.actionInter} /></td>
                                                    <td>
                                                        <span className="badge bg-danger bg-opacity-10 text-danger d-block mb-1">{inter.healthName}</span>
                                                        <span className="badge bg-info bg-opacity-10 text-info d-block mb-1">{inter.districtName}</span>
                                                        <span className="badge bg-success bg-opacity-10 text-success d-block">{inter.regionName}</span>
                                                    </td>
                                                    <td style={{ minWidth: '160px' }}>
                                                        {inter.deploymentItems?.length > 0 ? (
                                                            inter.deploymentItems.map(item => (
                                                                <div key={item.id} className="mb-1">
                                                                    <span className={`badge d-block ${itemBadgeClass(item.status)}`} style={{ fontSize: '10px' }}>
                                                                        <i className="bi bi-pc-display me-1" />{item.typeName} — {item.tag}
                                                                    </span>
                                                                    {item.replacementTag && (
                                                                        <span className="badge bg-success bg-opacity-10 text-success d-block mt-1" style={{ fontSize: '10px' }}>
                                                                            → 🔧 {item.replacementTag}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ))
                                                        ) : inter.manualEquipmentName?.trim() ? (
                                                            /* ✅ Équipement hors base (assistance technique) */
                                                            <div className="mb-1">
                                                                <span className="badge d-block"
                                                                    style={{ fontSize: '10px', background: 'rgba(99,102,241,0.1)', color: '#4f46e5' }}>
                                                                    <i className="bi bi-pencil-square me-1" />
                                                                    {inter.manualEquipmentName}
                                                                    {inter.manualEquipmentType ? ` (${inter.manualEquipmentType})` : ''}
                                                                </span>
                                                                <span className="badge bg-secondary bg-opacity-10 text-secondary d-block mt-1" style={{ fontSize: '9px' }}>
                                                                    hors base
                                                                </span>
                                                            </div>
                                                        ) : <span className="text-muted small">—</span>}
                                                    </td>
                                                    <td><LogoBadge image={inter.appsImage} icon={inter.appsIcon} color={inter.appsColor} name={inter.appName} /></td>
                                                    <td><LogoBadge image={inter.partnerImage} icon={inter.partnerLogo} color={inter.partnerColor} name={inter.partnerName || '—'} /></td>
                                                    <td className="text-muted small">{inter.technicianName || '—'}</td>
                                                    <td>
                                                        {inter.personName?.trim() && <div className="small fw-semibold">{inter.personName.trim()}</div>}
                                                        {inter.personContact && <div className="text-muted" style={{ fontSize: '11px' }}>📞 {inter.personContact}</div>}
                                                        {inter.personPost    && <div className="text-muted" style={{ fontSize: '11px' }}>💼 {inter.personPost}</div>}
                                                        {!inter.personName?.trim() && <span className="text-muted small">—</span>}
                                                    </td>
                                                    <td>
                                                        <span className="badge bg-primary bg-opacity-10 text-primary">
                                                            <i className="bi bi-clock me-1" />{inter.durationMinutes} min
                                                        </span>
                                                    </td>
                                                    {/* ── Colonne GPS ── */}
                                                    <td>
                                                        <GpsTag latitude={inter.latitude} longitude={inter.longitude} />
                                                    </td>
                                                    <td>
                                                        {inter.enAttenteMaintenance
                                                            ? <span className="badge bg-warning bg-opacity-10 text-warning d-inline-flex align-items-center gap-1"><i className="bi bi-clock-history" />En attente</span>
                                                            : <span className="badge bg-success bg-opacity-10 text-success d-inline-flex align-items-center gap-1"><i className="bi bi-check-circle" />Normal</span>}
                                                    </td>
                                                    <td className="text-end no-print">
                                                        <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handlePrintFiche(inter)} title="Imprimer fiche">
                                                            <i className="bi bi-printer" />
                                                        </button>
                                                        <button className="btn btn-sm btn-outline-success me-1"
                                                            onClick={() => handleDownloadAndMail(inter)}
                                                            disabled={sendingEmailId === inter.id}
                                                            title="Télécharger la fiche PDF et ouvrir un email pré-rempli">
                                                            {sendingEmailId === inter.id
                                                                ? <span className="spinner-border spinner-border-sm" />
                                                                : <i className="bi bi-file-earmark-pdf" />}
                                                        </button>
                                                        {canEdit && <button className="btn btn-sm btn-outline-warning me-1" onClick={() => { setSelected(inter); setShowUpdate(true); }}><i className="bi bi-pencil" /></button>}
                                                        {canDelete && <button className="btn btn-sm btn-outline-danger" onClick={() => { setSelectedId(inter.id); setShowConfirm(true); }}><i className="bi bi-trash" /></button>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                    </div>
                </>
            )}

            {/* ══ TAB Dashboard ══ */}
            {activeTab === 'dashboard' && (
                <div className="row g-4">
                    <div className="col-lg-6">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-header bg-white border-0 pt-3 pb-0 px-4">
                                <h6 className="fw-bold mb-0"><i className="bi bi-clock-history text-primary me-2" />Dernières interventions</h6>
                            </div>
                            <div className="card-body px-4 py-3">
                                {recentInterventions.length === 0
                                    ? <p className="text-muted small text-center py-3">Aucune intervention</p>
                                    : recentInterventions.map((inter, i) => (
                                    <div key={inter.id} className={`d-flex align-items-center gap-3 py-2 ${i < recentInterventions.length - 1 ? 'border-bottom' : ''}`}>
                                        <div className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${inter.typeInter === 'EN_LIGNE' ? 'bg-primary bg-opacity-10' : 'bg-success bg-opacity-10'}`} style={{ width: '36px', height: '36px' }}>
                                            <i className={`bi ${inter.typeInter === 'EN_LIGNE' ? 'bi-telephone-fill text-primary' : 'bi-geo-alt-fill text-success'} small`} />
                                        </div>
                                        <div className="flex-grow-1">
                                            <span className="fw-semibold small d-block">{inter.codeInter}</span>
                                            <small className="text-muted">{inter.healthName} — {inter.regionName}</small>
                                        </div>
                                        <div className="text-end">
                                            <span className="badge bg-primary bg-opacity-10 text-primary d-block">{inter.durationMinutes} min</span>
                                            <small className="text-muted" style={{ fontSize: '10px' }}>{new Date(inter.dateInter).toLocaleDateString('fr-FR')}</small>
                                            {inter.latitude != null && <div className="mt-1"><GpsTag latitude={inter.latitude} longitude={inter.longitude} compact /></div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-6">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-header bg-white border-0 pt-3 pb-0 px-4">
                                <h6 className="fw-bold mb-0"><i className="bi bi-pie-chart-fill text-warning me-2" />Interventions par action</h6>
                            </div>
                            <div className="card-body px-4 py-3">
                                {actionStats.length === 0
                                    ? <p className="text-muted small text-center py-3">Aucune donnée</p>
                                    : actionStats.map((s, i) => {
                                    const pct = totalElements > 0 ? Math.round((s.count / totalElements) * 100) : 0;
                                    return (
                                        <div key={i} className={`py-2 ${i < actionStats.length - 1 ? 'border-bottom' : ''}`}>
                                            <div className="d-flex align-items-center gap-2 mb-1">
                                                <i className={`bi ${s.icon}`} style={{ color: s.color }} />
                                                <span className="fw-semibold small flex-grow-1" style={{ color: s.color }}>{s.label}</span>
                                                <span className="fw-bold small">{s.count}</span>
                                                <span className="text-muted small" style={{ minWidth: '35px', textAlign: 'right' }}>{pct}%</span>
                                            </div>
                                            <div className="progress rounded-3" style={{ height: '6px' }}>
                                                <div className="progress-bar" style={{ width: `${pct}%`, backgroundColor: s.color }} />
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
                                <h6 className="fw-bold mb-0"><i className="bi bi-clock-fill text-info me-2" />Temps d'intervention</h6>
                            </div>
                            <div className="card-body p-4">
                                <div className="row g-4">
                                    {[
                                        { label: 'EN LIGNE', value: stats.totalEnLigne, color: 'primary', icon: 'bi-telephone-fill', pct: stats.totalGlobal > 0 ? Math.round((stats.totalEnLigne / stats.totalGlobal) * 100) : 0 },
                                        { label: 'SUR SITE',  value: stats.totalSurSite, color: 'success', icon: 'bi-geo-alt-fill',   pct: stats.totalGlobal > 0 ? Math.round((stats.totalSurSite  / stats.totalGlobal) * 100) : 0 },
                                    ].map((s, i) => (
                                        <div key={i} className="col-md-6">
                                            <div className="d-flex align-items-center gap-3 mb-2">
                                                <div className={`rounded-3 bg-${s.color} bg-opacity-10 d-flex align-items-center justify-content-center`} style={{ width: '44px', height: '44px', minWidth: '44px' }}>
                                                    <i className={`bi ${s.icon} text-${s.color}`} />
                                                </div>
                                                <div>
                                                    <p className="mb-0 text-muted small">{s.label}</p>
                                                    <h4 className={`fw-bold mb-0 text-${s.color}`}>{s.value} min</h4>
                                                </div>
                                                <span className={`badge bg-${s.color} bg-opacity-10 text-${s.color} ms-auto`}>{s.pct}%</span>
                                            </div>
                                            <div className="progress rounded-3" style={{ height: '8px' }}>
                                                <div className={`progress-bar bg-${s.color}`} style={{ width: `${s.pct}%`, transition: 'width 0.6s ease' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 pt-3 border-top d-flex justify-content-between align-items-center">
                                    <span className="text-muted small fw-semibold">Total global</span>
                                    <span className="fw-bold text-warning fs-5">{stats.totalGlobal} minutes</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modals ── */}
            {printModal && (
                <PrintPreviewModal show={showPrintModal} title={`Fiche — ${printModal.codeInter}`}
                    tableId="print-zone" onHide={() => { setShowPrintModal(false); setPrintModal(null); }} />
            )}
            <InterventionFormModal show={showForm} onHide={() => setShowForm(false)} onSuccess={refreshAll} />
            <InterventionUpdateModal show={showUpdate} onHide={() => { setShowUpdate(false); setSelected(null); }} onSuccess={refreshAll} intervention={selected} />
            <ConfirmModal show={showConfirm} title="Supprimer l'intervention" message="Êtes-vous sûr de vouloir supprimer cette intervention ?"
                onConfirm={handleDeleteConfirm} onCancel={() => setShowConfirm(false)} isLoading={deleteLoading} />
        </MainLayout>
    );
};

export default InterventionsPage;