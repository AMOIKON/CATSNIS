import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { usePrintConfig, PrintConfig } from '../../context/PrintConfigContext';
import { printListWithConfig } from '../../services/globalprintservice';
import api from '../../services/api';
import { getImageSrc } from '../../utils/imageUtils';

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface ApiImage { id: number; fileName: string; label: string; }
type ImageSlot = 'left' | 'right' | 'bg';

interface PrintPreviewModalProps {
    show:      boolean;
    title:     string;
    tableId:   string;
    onHide:    () => void;
}

const SLOT_LABELS: Record<ImageSlot, string> = {
    left:  'Image gauche',
    right: 'Image droite',
    bg:    'ArriÃ¨re-plan',
};

const SLOT_ICONS: Record<ImageSlot, string> = {
    left:  'bi-layout-sidebar-reverse',
    right: 'bi-layout-sidebar',
    bg:    'bi-layers',
};

// â”€â”€ Helper image src â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const getImageSrc = (fileName: string) =>
    /^[0-9a-f]{8}-/i.test(fileName)
        ? `/api/images/file/${fileName}`
        : `/images/equipements/${fileName}`;

// â”€â”€ Composant â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
    show, title, tableId, onHide,
}) => {
    const { config, setConfig } = usePrintConfig();
    const {
        leftImageUrl:  cfgLeft,
        rightImageUrl: cfgRight,
        bgImageUrl:    cfgBg,
        leftImageLabel:  cfgLeftLbl,
        rightImageLabel: cfgRightLbl,
    } = config;
    const fileInputRef = useRef<HTMLInputElement>(null);

    // â”€â”€ Ã‰tats locaux des images â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const [leftUrl,  setLeftUrl]  = useState<string | null>(null);
    const [rightUrl, setRightUrl] = useState<string | null>(null);
    const [bgUrl,    setBgUrl]    = useState<string | null>(null);
    const [leftLbl,  setLeftLbl]  = useState('');
    const [rightLbl, setRightLbl] = useState('');

    const [activeSlot,   setActiveSlot]   = useState<ImageSlot | null>(null);
    const [apiImages,    setApiImages]    = useState<ApiImage[]>([]);
    const [loadingImgs,  setLoadingImgs]  = useState(false);
    const [printing,     setPrinting]     = useState(false);
    const [savedDefault, setSavedDefault] = useState(false);

    // Sync depuis la config globale Ã  l'ouverture
    useEffect(() => {
        if (!show) return;
        setLeftUrl(cfgLeft);
        setRightUrl(cfgRight);
        setBgUrl(cfgBg);
        setLeftLbl(cfgLeftLbl);
        setRightLbl(cfgRightLbl);
        setActiveSlot(null);
        setSavedDefault(false);
        // Charger images API
        setLoadingImgs(true);
        api.get('/api/images/all')
            .then(r => {
                const imgs = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
                setApiImages(imgs);
            })
            .catch(() => {})
            .finally(() => setLoadingImgs(false));
    }, [show, cfgLeft, cfgRight, cfgBg, cfgLeftLbl, cfgRightLbl]);

    // â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const getUrl  = (s: ImageSlot) => s === 'left' ? leftUrl  : s === 'right' ? rightUrl  : bgUrl;
    const setUrl  = (s: ImageSlot, v: string | null) => {
        if (s === 'left')  setLeftUrl(v);
        if (s === 'right') setRightUrl(v);
        if (s === 'bg')    setBgUrl(v);
    };

    const handleSelectApi = (img: ApiImage) => {
        if (!activeSlot) return;
        setUrl(activeSlot, getImageSrc(img.fileName));
        if (activeSlot === 'left')  setLeftLbl(img.label || '');
        if (activeSlot === 'right') setRightLbl(img.label || '');
        setActiveSlot(null);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeSlot) return;
        const reader = new FileReader();
        reader.onload = ev => {
            setUrl(activeSlot, ev.target?.result as string);
            if (activeSlot === 'left')  setLeftLbl(file.name.replace(/\.[^.]+$/, ''));
            if (activeSlot === 'right') setRightLbl(file.name.replace(/\.[^.]+$/, ''));
            setActiveSlot(null);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    // â”€â”€ Sauvegarder comme config par dÃ©faut â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleSaveDefault = () => {
        const newCfg: PrintConfig = {
            leftImageUrl:    leftUrl,
            rightImageUrl:   rightUrl,
            bgImageUrl:      bgUrl,
            leftImageLabel:  leftLbl,
            rightImageLabel: rightLbl,
        };
        setConfig(newCfg);
        setSavedDefault(true);
        setTimeout(() => setSavedDefault(false), 2500);
    };

    // â”€â”€ Imprimer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handlePrint = async () => {
        setPrinting(true);
        // Config temporaire pour cette impression (sans sauvegarder)
        const tempCfg: PrintConfig = {
            leftImageUrl:    leftUrl,
            rightImageUrl:   rightUrl,
            bgImageUrl:      bgUrl,
            leftImageLabel:  leftLbl,
            rightImageLabel: rightLbl,
        };
        // Sauvegarder temporairement dans localStorage pour printListWithConfig
        const prev = localStorage.getItem('catusnis_print_config');
        localStorage.setItem('catusnis_print_config', JSON.stringify(tempCfg));

        onHide();
        setTimeout(async () => {
            await printListWithConfig(tableId, title);
            // Restaurer la config prÃ©cÃ©dente si on n'a pas sauvegardÃ© comme dÃ©faut
            if (!savedDefault && prev !== null) {
                localStorage.setItem('catusnis_print_config', prev);
            } else if (!savedDefault && prev === null) {
                localStorage.removeItem('catusnis_print_config');
            }
            setPrinting(false);
        }, 300);
    };

    const today = new Date().toLocaleDateString('fr-FR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    return (
        <Modal show={show} onHide={onHide} size="xl" centered>
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold">
                    <i className="bi bi-printer-fill text-primary me-2" />
                    Configuration et aperÃ§u â€” {title}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body className="px-4">
                <div className="row g-4">

                    {/* â”€â”€ Colonne gauche : sÃ©lecteurs images â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                    <div className="col-lg-5">
                        <p className="text-muted small mb-3">
                            Choisissez les images pour cette impression.
                        </p>

                        {(['left', 'right', 'bg'] as ImageSlot[]).map(slot => (
                            <div key={slot} className="card border-0 shadow-sm rounded-3 mb-3">
                                <div className="card-body p-3">
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        <i className={`bi ${SLOT_ICONS[slot]} text-primary`} />
                                        <span className="fw-semibold small">{SLOT_LABELS[slot]}</span>
                                        {getUrl(slot) && (
                                            <button
                                                className="btn btn-sm btn-outline-danger ms-auto py-0 px-2"
                                                onClick={() => setUrl(slot, null)}
                                                style={{ fontSize: '11px' }}
                                            >
                                                <i className="bi bi-x-lg" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="d-flex align-items-center gap-3">
                                        {/* AperÃ§u miniature */}
                                        <div
                                            className="rounded-2 border d-flex align-items-center justify-content-center bg-light flex-shrink-0"
                                            style={{ width: '56px', height: '56px', overflow: 'hidden' }}
                                        >
                                            {getUrl(slot) ? (
                                                <img src={getUrl(slot)!} alt={slot}
                                                     style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                            ) : (
                                                <i className="bi bi-image text-muted fs-4" />
                                            )}
                                        </div>

                                        {/* Boutons sÃ©lection */}
                                        <div className="d-flex flex-column gap-1 flex-grow-1">
                                            <button
                                                className={`btn btn-sm ${activeSlot === slot ? 'btn-primary' : 'btn-outline-primary'}`}
                                                onClick={() => setActiveSlot(activeSlot === slot ? null : slot)}
                                                style={{ fontSize: '11px' }}
                                            >
                                                <i className="bi bi-images me-1" />Depuis CATUSNIS
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={() => { setActiveSlot(slot); fileInputRef.current?.click(); }}
                                                style={{ fontSize: '11px' }}
                                            >
                                                <i className="bi bi-upload me-1" />Importer fichier
                                            </button>
                                        </div>
                                    </div>

                                    {/* Galerie CATUSNIS inline */}
                                    {activeSlot === slot && (
                                        <div className="mt-2 pt-2 border-top">
                                            {loadingImgs ? (
                                                <div className="text-center py-2">
                                                    <div className="spinner-border spinner-border-sm text-primary" />
                                                </div>
                                            ) : apiImages.length === 0 ? (
                                                <p className="text-muted small text-center mb-0">
                                                    Aucune image dans CATUSNIS
                                                </p>
                                            ) : (
                                                <div className="d-flex flex-wrap gap-1"
                                                     style={{ maxHeight: '120px', overflowY: 'auto' }}>
                                                    {apiImages.map(img => (
                                                        <div
                                                            key={img.id}
                                                            className="rounded-2 border p-1 d-flex flex-column align-items-center"
                                                            style={{ width: '52px', cursor: 'pointer' }}
                                                            onClick={() => handleSelectApi(img)}
                                                            title={img.label}
                                                        >
                                                            <img src={getImageSrc(img.fileName)} alt={img.label}
                                                                 style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                                                            <span style={{ fontSize: '8px', color: '#666',
                                                                           overflow: 'hidden', textOverflow: 'ellipsis',
                                                                           whiteSpace: 'nowrap', width: '100%',
                                                                           textAlign: 'center' }}>
                                                                {img.label}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleFileUpload}
                        />

                        {/* Sauvegarder comme dÃ©faut */}
                        <button
                            className={`btn btn-sm w-100 ${savedDefault ? 'btn-success' : 'btn-outline-secondary'}`}
                            onClick={handleSaveDefault}
                        >
                            {savedDefault
                                ? <><i className="bi bi-check-circle-fill me-1" />SauvegardÃ© comme dÃ©faut</>
                                : <><i className="bi bi-bookmark-fill me-1" />Sauvegarder comme configuration par dÃ©faut</>
                            }
                        </button>
                    </div>

                    {/* â”€â”€ Colonne droite : aperÃ§u en temps rÃ©el â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                    <div className="col-lg-7">
                        <p className="text-muted small mb-2">AperÃ§u en temps rÃ©el :</p>
                        <div
                            className="rounded-3 border p-3"
                            style={{ background: '#f8f9fa', position: 'relative',
                                     overflow: 'hidden', minHeight: '180px' }}
                        >
                            {/* Background watermark */}
                            {bgUrl && (
                                <img src={bgUrl} alt="bg"
                                     style={{ position: 'absolute', top: '50%', left: '50%',
                                              transform: 'translate(-50%,-50%)',
                                              width: '160px', height: '160px',
                                              objectFit: 'contain', opacity: 0.08,
                                              pointerEvents: 'none' }} />
                            )}

                            <div style={{ position: 'relative', zIndex: 1 }}>
                                {/* En-tÃªte */}
                                <div className="d-flex justify-content-between align-items-center"
                                     style={{ borderBottom: '2px solid #0d6efd',
                                              paddingBottom: '10px', marginBottom: '10px' }}>
                                    {/* Gauche */}
                                    <div className="d-flex flex-column align-items-center"
                                         style={{ width: '72px' }}>
                                        {leftUrl ? (
                                            <img src={leftUrl} alt="g"
                                                 style={{ width: '55px', height: '55px', objectFit: 'contain' }} />
                                        ) : (
                                            <div className="d-flex flex-column align-items-center
                                                            justify-content-center rounded-2 border text-muted"
                                                 style={{ width: '55px', height: '55px', borderStyle: 'dashed',
                                                          fontSize: '9px', textAlign: 'center' }}>
                                                <i className="bi bi-image fs-5" /><span>Gauche</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Centre */}
                                    <div className="text-center flex-grow-1 px-2">
                                        <div className="fw-bold" style={{ color: '#0d6efd', fontSize: '13px' }}>
                                            CATUSNIS â€” {title}
                                        </div>
                                        <small className="text-muted" style={{ fontSize: '10px' }}>
                                            {today}
                                        </small>
                                    </div>

                                    {/* Droite */}
                                    <div className="d-flex flex-column align-items-center"
                                         style={{ width: '72px' }}>
                                        {rightUrl ? (
                                            <img src={rightUrl} alt="d"
                                                 style={{ width: '55px', height: '55px', objectFit: 'contain' }} />
                                        ) : (
                                            <div className="d-flex flex-column align-items-center
                                                            justify-content-center rounded-2 border text-muted"
                                                 style={{ width: '55px', height: '55px', borderStyle: 'dashed',
                                                          fontSize: '9px', textAlign: 'center' }}>
                                                <i className="bi bi-image fs-5" /><span>Droite</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Lignes simulÃ©es */}
                                <div className="d-flex flex-column gap-1">
                                    {[100, 90, 80, 95, 70].map((w, i) => (
                                        <div key={i} className="rounded"
                                             style={{ height: '7px', background: '#dee2e6', width: `${w}%` }} />
                                    ))}
                                </div>

                                {/* Pied simulÃ© */}
                                <div className="d-flex justify-content-between mt-2 pt-1"
                                     style={{ borderTop: '1px solid #dee2e6' }}>
                                    <small style={{ fontSize: '8px', color: '#aaa' }}>CATUSNIS â€” Confidentiel</small>
                                    <small style={{ fontSize: '8px', color: '#aaa' }}>Page 1</small>
                                </div>
                            </div>
                        </div>

                        {/* Statut des 3 images */}
                        <div className="row g-2 mt-2">
                            {(['left', 'right', 'bg'] as ImageSlot[]).map(slot => (
                                <div key={slot} className="col-4">
                                    <div className={`text-center p-2 rounded-3 small ${
                                        getUrl(slot)
                                            ? 'bg-success bg-opacity-10 text-success'
                                            : 'bg-light text-muted'
                                    }`} style={{ fontSize: '11px' }}>
                                        <i className={`bi ${getUrl(slot) ? 'bi-check-circle-fill' : 'bi-circle'} me-1`} />
                                        {SLOT_LABELS[slot]}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Modal.Body>

            <Modal.Footer className="border-0">
                <Button variant="light" onClick={onHide}>
                    Annuler
                </Button>
                <Button
                    variant="primary"
                    onClick={handlePrint}
                    disabled={printing}
                    className="d-flex align-items-center gap-2"
                >
                    {printing
                        ? <><span className="spinner-border spinner-border-sm" />PrÃ©paration...</>
                        : <><i className="bi bi-printer-fill" />Imprimer</>
                    }
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default PrintPreviewModal;