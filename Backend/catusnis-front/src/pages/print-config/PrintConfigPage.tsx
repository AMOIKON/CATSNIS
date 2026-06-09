import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '../../components/common/MainLayout';
import { usePrintConfig, PrintConfig } from '../../context/PrintConfigContext';
import api from '../../services/api';
import { getImageSrc } from '../../utils/imageUtils';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ApiImage {
    id:       number;
    fileName: string;
    label:    string;
}

type ImageSlot = 'left' | 'right' | 'bg';

const SLOT_LABELS: Record<ImageSlot, string> = {
    left:  'Image gauche',
    right: 'Image droite',
    bg:    'Image background (filigrane)',
};

const SLOT_ICONS: Record<ImageSlot, string> = {
    left:  'bi-layout-sidebar-reverse',
    right: 'bi-layout-sidebar',
    bg:    'bi-layers',
};

// ── Composant ─────────────────────────────────────────────────────────────────
const PrintConfigPage: React.FC = () => {
    const { config, setConfig, resetConfig } = usePrintConfig();

    const [apiImages,   setApiImages]   = useState<ApiImage[]>([]);
    const [loadingImgs, setLoadingImgs] = useState(false);
    const [saved,       setSaved]       = useState(false);
    const [activeSlot,  setActiveSlot]  = useState<ImageSlot | null>(null);

    const [leftUrl,  setLeftUrl]  = useState<string | null>(config.leftImageUrl);
    const [rightUrl, setRightUrl] = useState<string | null>(config.rightImageUrl);
    const [bgUrl,    setBgUrl]    = useState<string | null>(config.bgImageUrl);
    const [leftLbl,  setLeftLbl]  = useState(config.leftImageLabel);
    const [rightLbl, setRightLbl] = useState(config.rightImageLabel);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setLeftUrl(config.leftImageUrl);
        setRightUrl(config.rightImageUrl);
        setBgUrl(config.bgImageUrl);
        setLeftLbl(config.leftImageLabel);
        setRightLbl(config.rightImageLabel);
    }, [config]);

    useEffect(() => {
        setLoadingImgs(true);
        api.get('/api/images/all')
            .then(r => {
                const imgs = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
                setApiImages(imgs);
            })
            .catch(console.error)
            .finally(() => setLoadingImgs(false));
    }, []);

    const getUrlForSlot = (slot: ImageSlot) => {
        if (slot === 'left')  return leftUrl;
        if (slot === 'right') return rightUrl;
        return bgUrl;
    };

    const setUrlForSlot = (slot: ImageSlot, url: string | null) => {
        if (slot === 'left')  setLeftUrl(url);
        if (slot === 'right') setRightUrl(url);
        if (slot === 'bg')    setBgUrl(url);
    };

    const handleSelectApiImage = (img: ApiImage) => {
        if (!activeSlot) return;
        const url = getImageSrc(img.fileName);
        setUrlForSlot(activeSlot, url);
        if (activeSlot === 'left')  setLeftLbl(img.label || '');
        if (activeSlot === 'right') setRightLbl(img.label || '');
        setActiveSlot(null);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeSlot) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const base64 = ev.target?.result as string;
            setUrlForSlot(activeSlot, base64);
            if (activeSlot === 'left')  setLeftLbl(file.name.replace(/\.[^.]+$/, ''));
            if (activeSlot === 'right') setRightLbl(file.name.replace(/\.[^.]+$/, ''));
            setActiveSlot(null);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleSave = () => {
        const newConfig: PrintConfig = {
            leftImageUrl:    leftUrl,
            rightImageUrl:   rightUrl,
            bgImageUrl:      bgUrl,
            leftImageLabel:  leftLbl,
            rightImageLabel: rightLbl,
        };
        setConfig(newConfig);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleReset = () => {
        setLeftUrl(null); setRightUrl(null); setBgUrl(null);
        setLeftLbl('');   setRightLbl('');
        resetConfig();
    };

    const today = new Date().toLocaleDateString('fr-FR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
        <MainLayout title="Configuration impression">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 className="fw-bold mb-0">Configuration des impressions</h5>
                    <small className="text-muted">
                        Choisissez les images qui apparaîtront sur toutes vos impressions
                    </small>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-outline-danger btn-sm" onClick={handleReset}>
                        <i className="bi bi-arrow-counterclockwise me-1" />
                        Réinitialiser
                    </button>
                    <button
                        className={`btn btn-primary btn-sm d-flex align-items-center gap-2 ${saved ? 'btn-success' : ''}`}
                        onClick={handleSave}
                    >
                        {saved
                            ? <><i className="bi bi-check-circle-fill" />Sauvegardé !</>
                            : <><i className="bi bi-save-fill" />Sauvegarder</>
                        }
                    </button>
                </div>
            </div>

            <div className="row g-4">
                <div className="col-lg-5">
                    {(['left', 'right', 'bg'] as ImageSlot[]).map(slot => (
                        <div key={slot} className="card border-0 shadow-sm rounded-4 mb-3">
                            <div className="card-body p-3">
                                <div className="d-flex align-items-center gap-2 mb-3">
                                    <i className={`bi ${SLOT_ICONS[slot]} text-primary fs-5`} />
                                    <h6 className="fw-bold mb-0">{SLOT_LABELS[slot]}</h6>
                                </div>
                                <div className="d-flex align-items-center gap-3 mb-3">
                                    <div
                                        className="rounded-3 border d-flex align-items-center justify-content-center bg-light"
                                        style={{ width:'70px', height:'70px', minWidth:'70px', overflow:'hidden' }}
                                    >
                                        {getUrlForSlot(slot) ? (
                                            <img src={getUrlForSlot(slot)!} alt={slot}
                                                 style={{ width:'100%', height:'100%', objectFit:'contain' }} />
                                        ) : (
                                            <i className="bi bi-image text-muted fs-3" />
                                        )}
                                    </div>
                                    <div className="flex-grow-1">
                                        {getUrlForSlot(slot) ? (
                                            <span className="badge bg-success bg-opacity-10 text-success mb-1 d-block">
                                                <i className="bi bi-check-circle me-1" />Image configurée
                                            </span>
                                        ) : (
                                            <span className="badge bg-secondary bg-opacity-10 text-secondary mb-1 d-block">
                                                <i className="bi bi-dash-circle me-1" />Aucune image
                                            </span>
                                        )}
                                        {getUrlForSlot(slot) && (
                                            <button className="btn btn-sm btn-outline-danger"
                                                    onClick={() => setUrlForSlot(slot, null)}>
                                                <i className="bi bi-x-lg me-1" />Supprimer
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="d-flex gap-2">
                                    <button
                                        className={`btn btn-sm flex-grow-1 ${activeSlot === slot ? 'btn-primary' : 'btn-outline-primary'}`}
                                        onClick={() => setActiveSlot(activeSlot === slot ? null : slot)}
                                    >
                                        <i className="bi bi-images me-1" />Depuis CATUSNIS
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline-secondary flex-grow-1"
                                        onClick={() => { setActiveSlot(slot); fileInputRef.current?.click(); }}
                                    >
                                        <i className="bi bi-upload me-1" />Importer fichier
                                    </button>
                                </div>
                                {activeSlot === slot && (
                                    <div className="mt-3">
                                        <p className="text-muted small mb-2">
                                            <i className="bi bi-info-circle me-1" />
                                            Cliquez sur une image pour la sélectionner
                                        </p>
                                        {loadingImgs ? (
                                            <div className="text-center py-3">
                                                <div className="spinner-border spinner-border-sm text-primary" />
                                            </div>
                                        ) : apiImages.length === 0 ? (
                                            <p className="text-muted small text-center py-2">Aucune image dans CATUSNIS</p>
                                        ) : (
                                            <div className="d-flex flex-wrap gap-2" style={{ maxHeight:'200px', overflowY:'auto' }}>
                                                {apiImages.map(img => (
                                                    <div key={img.id}
                                                         className="rounded-2 border p-1 cursor-pointer"
                                                         style={{ width:'60px', cursor:'pointer', transition:'all 0.15s' }}
                                                         onClick={() => handleSelectApiImage(img)}
                                                         title={img.label}>
                                                        <img src={getImageSrc(img.fileName)} alt={img.label}
                                                             style={{ width:'100%', height:'50px', objectFit:'contain' }} />
                                                        <p className="mb-0 text-center"
                                                           style={{ fontSize:'8px', color:'#666', whiteSpace:'nowrap',
                                                                    overflow:'hidden', textOverflow:'ellipsis' }}>
                                                            {img.label}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    <input ref={fileInputRef} type="file" accept="image/*"
                           style={{ display:'none' }} onChange={handleFileUpload} />
                </div>

                <div className="col-lg-7">
                    <div className="card border-0 shadow-sm rounded-4 sticky-top" style={{ top:'20px' }}>
                        <div className="card-body p-4">
                            <h6 className="fw-bold mb-3">
                                <i className="bi bi-eye-fill text-primary me-2" />
                                Aperçu en temps réel
                            </h6>
                            <div className="rounded-3 border p-3"
                                 style={{ background:'#f8f9fa', position:'relative', overflow:'hidden', minHeight:'160px' }}>
                                {bgUrl && (
                                    <img src={bgUrl} alt="bg"
                                         style={{ position:'absolute', top:'50%', left:'50%',
                                                  transform:'translate(-50%, -50%)',
                                                  width:'180px', height:'180px',
                                                  objectFit:'contain', opacity:0.08, pointerEvents:'none' }} />
                                )}
                                <div style={{ position:'relative', zIndex:1 }}>
                                    <div className="d-flex justify-content-between align-items-center"
                                         style={{ borderBottom:'2px solid #0d6efd', paddingBottom:'12px', marginBottom:'12px' }}>
                                        <div className="d-flex flex-column align-items-center" style={{ width:'80px' }}>
                                            {leftUrl ? (
                                                <img src={leftUrl} alt="gauche"
                                                     style={{ width:'60px', height:'60px', objectFit:'contain' }} />
                                            ) : (
                                                <div className="rounded-2 border d-flex align-items-center justify-content-center text-muted"
                                                     style={{ width:'60px', height:'60px', borderStyle:'dashed',
                                                              fontSize:'10px', textAlign:'center' }}>
                                                    <span>Image<br/>gauche</span>
                                                </div>
                                            )}
                                            {leftLbl && (
                                                <small style={{ fontSize:'8px', color:'#666', marginTop:'4px', textAlign:'center' }}>
                                                    {leftLbl}
                                                </small>
                                            )}
                                        </div>
                                        <div className="text-center flex-grow-1 px-2">
                                            <div className="fw-bold" style={{ color:'#0d6efd', fontSize:'13px' }}>
                                                CATUSNIS — Titre du document
                                            </div>
                                            <small className="text-muted" style={{ fontSize:'10px' }}>{today}</small>
                                        </div>
                                        <div className="d-flex flex-column align-items-center" style={{ width:'80px' }}>
                                            {rightUrl ? (
                                                <img src={rightUrl} alt="droite"
                                                     style={{ width:'60px', height:'60px', objectFit:'contain' }} />
                                            ) : (
                                                <div className="rounded-2 border d-flex align-items-center justify-content-center text-muted"
                                                     style={{ width:'60px', height:'60px', borderStyle:'dashed',
                                                              fontSize:'10px', textAlign:'center' }}>
                                                    <span>Image<br/>droite</span>
                                                </div>
                                            )}
                                            {rightLbl && (
                                                <small style={{ fontSize:'8px', color:'#666', marginTop:'4px', textAlign:'center' }}>
                                                    {rightLbl}
                                                </small>
                                            )}
                                        </div>
                                    </div>
                                    <div className="d-flex flex-column gap-2">
                                        <div className="rounded" style={{ height:'8px', background:'#dee2e6', width:'100%' }} />
                                        <div className="rounded" style={{ height:'8px', background:'#dee2e6', width:'90%' }} />
                                        <div className="rounded" style={{ height:'8px', background:'#dee2e6', width:'80%' }} />
                                        <div className="rounded" style={{ height:'8px', background:'#dee2e6', width:'95%' }} />
                                        <div className="rounded" style={{ height:'8px', background:'#dee2e6', width:'75%' }} />
                                    </div>
                                    <div className="d-flex justify-content-between mt-3 pt-2"
                                         style={{ borderTop:'1px solid #dee2e6' }}>
                                        <small style={{ fontSize:'9px', color:'#aaa' }}>CATUSNIS — Confidentiel</small>
                                        <small style={{ fontSize:'9px', color:'#aaa' }}>Page 1</small>
                                    </div>
                                </div>
                            </div>
                            <div className="row g-2 mt-2">
                                {[
                                    { label:'Image gauche',  ok: !!leftUrl  },
                                    { label:'Image droite',  ok: !!rightUrl },
                                    { label:'Background',    ok: !!bgUrl    },
                                ].map(({ label, ok }) => (
                                    <div key={label} className="col-4">
                                        <div className={`text-center p-2 rounded-3 small ${ok ? 'bg-success bg-opacity-10 text-success' : 'bg-light text-muted'}`}>
                                            <i className={`bi ${ok ? 'bi-check-circle-fill' : 'bi-circle'} me-1`} />
                                            {label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className={`btn w-100 mt-3 ${saved ? 'btn-success' : 'btn-primary'}`} onClick={handleSave}>
                                {saved
                                    ? <><i className="bi bi-check-circle-fill me-2" />Configuration sauvegardée !</>
                                    : <><i className="bi bi-save-fill me-2" />Sauvegarder la configuration</>
                                }
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default PrintConfigPage;