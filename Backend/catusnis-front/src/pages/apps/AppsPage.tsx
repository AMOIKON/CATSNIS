import React, { useState, useEffect, useCallback } from 'react';
import MainLayout     from '../../components/common/MainLayout';
import ConfirmModal   from '../../components/common/ConfirmModal';
import Pagination     from '../../components/common/Pagination';
import AppFormModal   from './AppFormModal';
import AppUpdateModal from './AppUpdateModal';
import AppsService    from '../../services/appsService';
import { AppsResponse } from '../../types';
import useAuth        from '../../hooks/useAuth';
import { buildHeader, getPrintConfig } from '../../services/globalprintservice';
import { getImageSrc } from '../../utils/imageUtils';

const getImageSrc = (fileName: string): string => {
    if (!fileName) return '';
    return /^[0-9a-f]{8}-/i.test(fileName) ? `/api/images/file/${fileName}` : `/images/equipements/${fileName}`;
};

const AppsPage: React.FC = () => {
    const { person } = useAuth();
    const role = person?.role;
    const canCreate = role==='SUPER_ADMIN'||role==='ADMIN'||role==='TECHNICIEN';
    const canEdit   = role==='SUPER_ADMIN'||role==='ADMIN'||role==='TECHNICIEN';
    const canDelete = role==='SUPER_ADMIN'||role==='ADMIN';

    const [apps, setApps]                   = useState<AppsResponse[]>([]);
    const [totalPages, setTotalPages]       = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [page, setPage]                   = useState(0);
    const [keyword, setKeyword]             = useState('');
    const [isLoading, setIsLoading]         = useState(false);
    const [isPrinting, setIsPrinting]       = useState(false);
    const [showForm, setShowForm]           = useState(false);
    const [showUpdate, setShowUpdate]       = useState(false);
    const [showConfirm, setShowConfirm]     = useState(false);
    const [selectedId, setSelectedId]       = useState<number|null>(null);
    const [selected, setSelected]           = useState<AppsResponse|null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const loadApps = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await AppsService.getAll(page, 10, keyword||undefined);
            setApps(data.content); setTotalPages(data.page.totalPages); setTotalElements(data.page.totalElements);
        } catch(err){console.error(err);} finally{setIsLoading(false);}
    }, [page, keyword]);

    useEffect(()=>{loadApps();},[loadApps]);

    const handleDeleteConfirm = async () => {
        if(!selectedId) return;
        setDeleteLoading(true);
        try{await AppsService.delete(selectedId);loadApps();}
        catch(err){console.error(err);}
        finally{setDeleteLoading(false);setShowConfirm(false);setSelectedId(null);}
    };

    const handlePrintAll = async () => {
        setIsPrinting(true);
        try {
            const all = await AppsService.getAllForPrint(keyword||undefined);
            const header = buildHeader('Liste des applications', getPrintConfig());
            const rows = all.map((a,i)=>`
                <tr>
                    <td style="color:#6c757d;font-size:11px;">${i+1}</td>
                    <td style="font-weight:500;color:${a.color||'#616161'}">${a.appsName}</td>
                    <td><span style="font-family:monospace;font-size:11px;background:#f8f9fa;padding:2px 8px;border-radius:4px;">${a.icon||'bi-app-indicator'}</span></td>
                    <td>
                        <div style="display:inline-flex;align-items:center;gap:6px;">
                            <div style="width:14px;height:14px;border-radius:3px;background:${a.color||'#616161'};display:inline-block;"></div>
                            <span style="font-family:monospace;font-size:11px;">${a.color||'#616161'}</span>
                        </div>
                    </td>
                </tr>`).join('');
            const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
                <title>Applications â€” CATUSNIS</title>
                <style>@page{margin:1.5cm;size:A4 portrait}body{font-family:Arial,sans-serif;color:#333;margin:0}
                .total{font-size:12px;color:#6c757d;margin:8px 0 16px}table{width:100%;border-collapse:collapse}
                th{background:#f8f9fa;border:1px solid #dee2e6;padding:8px 12px;font-size:12px;text-align:left}
                td{border:1px solid #dee2e6;padding:8px 12px;font-size:12px}tr:nth-child(even){background:#f9f9f9}
                </style></head>
                <body>${header}<p class="total">${all.length} application(s) au total</p>
                <table><thead><tr><th>#</th><th>Application</th><th>IcÃ´ne</th><th>Couleur</th></tr></thead>
                <tbody>${rows}</tbody></table></body></html>`;
            const win=window.open('','_blank','width=800,height=600');
            if(!win){alert('Veuillez autoriser les popups.');return;}
            win.document.write(html);win.document.close();
            win.onload=()=>{win.focus();win.print();win.close();};
        } catch(err){console.error(err);} finally{setIsPrinting(false);}
    };

    const renderLogo = (a: AppsResponse) => {
        const color = a.color || '#616161';
        return (
            <div style={{width:'42px',height:'42px',minWidth:'42px',maxWidth:'42px',borderRadius:'10px',
                background:`${color}20`,border:`2px solid ${color}`,display:'flex',
                alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                {a.image
                    ? <img src={getImageSrc(a.image)} alt={a.appsName} style={{width:'38px',height:'38px',objectFit:'contain'}}/>
                    : <i className={`bi ${a.icon||'bi-app-indicator'}`} style={{color,fontSize:'20px'}}/>}
            </div>
        );
    };

    return (
        <MainLayout title="Applications">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 className="fw-bold mb-0">Liste des applications</h5>
                    <small className="text-muted">{totalElements} application(s) au total</small>
                </div>
                <div className="d-flex gap-2 align-items-center">
                    <button className="btn btn-outline-secondary d-flex align-items-center gap-2"
                        onClick={handlePrintAll} disabled={isPrinting}>
                        {isPrinting?<><span className="spinner-border spinner-border-sm"/>Chargement...</>:<><i className="bi bi-printer"/>Imprimer</>}
                    </button>
                    {canCreate&&(
                        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={()=>setShowForm(true)}>
                            <i className="bi bi-plus-circle-fill"/>Nouvelle application
                        </button>
                    )}
                </div>
            </div>
            <div className="card border-0 shadow-sm rounded-4 mb-4"><div className="card-body p-3">
                <div className="input-group">
                    <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted"/></span>
                    <input type="text" className="form-control border-start-0" placeholder="Rechercher une application..."
                        value={keyword} onChange={e=>{setKeyword(e.target.value);setPage(0);}}/>
                </div>
            </div></div>
            <div id="apps-table" className="card border-0 shadow-sm rounded-4">
                <div className="card-body p-0">
                    {isLoading?<div className="text-center py-5"><div className="spinner-border text-primary"/></div>
                    :apps.length===0?<div className="text-center py-5 text-muted"><i className="bi bi-grid fs-1 d-block mb-2"/>Aucune application trouvÃ©e</div>
                    :<div className="table-responsive"><table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr><th>#</th><th style={{width:'60px'}}>Logo</th><th>Application</th><th>IcÃ´ne</th><th>Couleur</th>
                                {(canEdit||canDelete)&&<th className="text-end no-print">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>{apps.map((a,i)=>(
                            <tr key={a.id}>
                                <td className="text-muted small">{page*10+i+1}</td>
                                <td>{renderLogo(a)}</td>
                                <td><span className="fw-semibold" style={{color:a.color||'#616161'}}>{a.appsName}</span></td>
                                <td><span className="badge bg-light text-dark border small font-monospace"><i className={`bi ${a.icon||'bi-app-indicator'} me-1`}/>{a.icon||'bi-app-indicator'}</span></td>
                                <td><div className="d-flex align-items-center gap-2">
                                    <div style={{width:'20px',height:'20px',borderRadius:'4px',background:a.color||'#616161',border:'1px solid rgba(0,0,0,0.1)',flexShrink:0}}/>
                                    <small className="text-muted font-monospace">{a.color||'#616161'}</small>
                                </div></td>
                                {(canEdit||canDelete)&&<td className="text-end no-print">
                                    {canEdit&&<button className="btn btn-sm btn-outline-warning me-2" onClick={()=>{setSelected(a);setShowUpdate(true);}}><i className="bi bi-pencil"/></button>}
                                    {canDelete&&<button className="btn btn-sm btn-outline-danger" onClick={()=>{setSelectedId(a.id);setShowConfirm(true);}}><i className="bi bi-trash"/></button>}
                                </td>}
                            </tr>
                        ))}</tbody>
                    </table></div>}
                </div>
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage}/>
            </div>
            <AppFormModal show={showForm} onHide={()=>setShowForm(false)} onSuccess={loadApps}/>
            <AppUpdateModal show={showUpdate} onHide={()=>{setShowUpdate(false);setSelected(null);}} onSuccess={loadApps} app={selected}/>
            <ConfirmModal show={showConfirm} title="Supprimer l'application" message="ÃŠtes-vous sÃ»r ?" onConfirm={handleDeleteConfirm} onCancel={()=>setShowConfirm(false)} isLoading={deleteLoading}/>
        </MainLayout>
    );
};
export default AppsPage;