import React, { useState, useEffect, useCallback } from 'react';
import MainLayout       from '../../components/common/MainLayout';
import ConfirmModal     from '../../components/common/ConfirmModal';
import Pagination       from '../../components/common/Pagination';
import StateFormModal   from './StateFormModal';
import StateUpdateModal from './StateUpdateModal';
import StatesService    from '../../services/statesService';
import { StatesResponse } from '../../types';
import useAuth          from '../../hooks/useAuth';
import { buildHeader, getPrintConfig } from '../../services/globalprintservice';

const StatesPage: React.FC = () => {
    const { person } = useAuth();
    const role = person?.role;
    const canCreate = role==='SUPER_ADMIN'||role==='ADMIN'||role==='TECHNICIEN';
    const canEdit   = role==='SUPER_ADMIN'||role==='ADMIN'||role==='TECHNICIEN';
    const canDelete = role==='SUPER_ADMIN'||role==='ADMIN';

    const [states, setStates]               = useState<StatesResponse[]>([]);
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
    const [selected, setSelected]           = useState<StatesResponse|null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const load = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await StatesService.getAll(page, 10, keyword||undefined);
            setStates(data.content); setTotalPages(data.page.totalPages); setTotalElements(data.page.totalElements);
        } catch(err){console.error(err);} finally{setIsLoading(false);}
    }, [page, keyword]);

    useEffect(()=>{load();},[load]);

    const handleDeleteConfirm = async () => {
        if(!selectedId) return;
        setDeleteLoading(true);
        try{await StatesService.delete(selectedId);load();}
        catch(err){console.error(err);}
        finally{setDeleteLoading(false);setShowConfirm(false);setSelectedId(null);}
    };

    const handlePrintAll = async () => {
        setIsPrinting(true);
        try {
            const all = await StatesService.getAllForPrint(keyword||undefined);
            const header = buildHeader('Liste des états', getPrintConfig());
            const rows = all.map((s,i)=>`
                <tr>
                    <td style="color:#6c757d;font-size:11px;">${i+1}</td>
                    <td style="font-weight:500;">${s.statesName||'—'}</td>
                </tr>`).join('');
            const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
                <title>États — CATUSNIS</title>
                <style>@page{margin:1.5cm;size:A4 portrait}body{font-family:Arial,sans-serif;color:#333;margin:0}
                .total{font-size:12px;color:#6c757d;margin:8px 0 16px}table{width:100%;border-collapse:collapse}
                th{background:#f8f9fa;border:1px solid #dee2e6;padding:8px 12px;font-size:12px;text-align:left}
                td{border:1px solid #dee2e6;padding:8px 12px;font-size:12px}tr:nth-child(even){background:#f9f9f9}
                </style></head>
                <body>${header}<p class="total">${all.length} état(s) au total</p>
                <table><thead><tr><th>#</th><th>Libellé de l'état</th></tr></thead>
                <tbody>${rows}</tbody></table></body></html>`;
            const win = window.open('','_blank','width=700,height=600');
            if(!win){alert('Veuillez autoriser les popups.');return;}
            win.document.write(html);win.document.close();
            win.onload=()=>{win.focus();win.print();win.close();};
        } catch(err){console.error(err);} finally{setIsPrinting(false);}
    };

    return (
        <MainLayout title="États">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 className="fw-bold mb-0">Liste des états</h5>
                    <small className="text-muted">{totalElements} état(s) au total</small>
                </div>
                <div className="d-flex gap-2 align-items-center">
                    <button className="btn btn-outline-secondary d-flex align-items-center gap-2"
                        onClick={handlePrintAll} disabled={isPrinting}>
                        {isPrinting?<><span className="spinner-border spinner-border-sm"/>Chargement...</>:<><i className="bi bi-printer"/>Imprimer</>}
                    </button>
                    {canCreate&&(
                        <button className="btn btn-success d-flex align-items-center gap-2" onClick={()=>setShowForm(true)}>
                            <i className="bi bi-plus-circle-fill"/>Nouvel état
                        </button>
                    )}
                </div>
            </div>
            <div className="card border-0 shadow-sm rounded-4 mb-4"><div className="card-body p-3">
                <div className="input-group">
                    <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted"/></span>
                    <input type="text" className="form-control border-start-0" placeholder="Rechercher un état..."
                        value={keyword} onChange={e=>{setKeyword(e.target.value);setPage(0);}}/>
                </div>
            </div></div>
            <div id="states-table" className="card border-0 shadow-sm rounded-4">
                <div className="card-body p-0">
                    {isLoading?<div className="text-center py-5"><div className="spinner-border text-success"/></div>
                    :states.length===0?<div className="text-center py-5 text-muted"><i className="bi bi-toggle-off fs-1 d-block mb-2"/>Aucun état trouvé</div>
                    :<div className="table-responsive"><table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr><th>#</th><th>Libellé</th>{(canEdit||canDelete)&&<th className="text-end no-print">Actions</th>}</tr>
                        </thead>
                        <tbody>{states.map((item,i)=>(
                            <tr key={item.id}>
                                <td className="text-muted small">{page*10+i+1}</td>
                                <td><div className="d-flex align-items-center gap-2">
                                    <div className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center" style={{width:'35px',height:'35px',minWidth:'35px'}}>
                                        <i className="bi bi-toggle-on text-success"/>
                                    </div>
                                    <span className="fw-semibold">{item.statesName}</span>
                                </div></td>
                                {(canEdit||canDelete)&&<td className="text-end no-print">
                                    {canEdit&&<button className="btn btn-sm btn-outline-warning me-2" onClick={()=>{setSelected(item);setShowUpdate(true);}}><i className="bi bi-pencil"/></button>}
                                    {canDelete&&<button className="btn btn-sm btn-outline-danger" onClick={()=>{setSelectedId(item.id);setShowConfirm(true);}}><i className="bi bi-trash"/></button>}
                                </td>}
                            </tr>
                        ))}</tbody>
                    </table></div>}
                </div>
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage}/>
            </div>
            <StateFormModal show={showForm} onHide={()=>setShowForm(false)} onSuccess={load}/>
            <StateUpdateModal show={showUpdate} onHide={()=>{setShowUpdate(false);setSelected(null);}} onSuccess={load} state={selected}/>
            <ConfirmModal show={showConfirm} title="Supprimer l'état" message="Êtes-vous sûr ?" onConfirm={handleDeleteConfirm} onCancel={()=>setShowConfirm(false)} isLoading={deleteLoading}/>
        </MainLayout>
    );
};
export default StatesPage;