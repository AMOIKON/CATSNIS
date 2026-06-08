// ── Config impression depuis localStorage ────────────────────────────────────
export const getPrintConfig = () => {
    try {
        const stored = localStorage.getItem('catusnis_print_config');
        return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
};

// ── Construire l'en-tête HTML ─────────────────────────────────────────────────
export const buildHeader = (title: string, cfg?: ReturnType<typeof getPrintConfig>): string => {
    if (!cfg) cfg = getPrintConfig();
    const imgStyle = 'width:70px;height:70px;object-fit:contain;';

    const leftBlock = cfg.leftImageUrl
        ? `<div style="width:90px;display:flex;align-items:center;justify-content:center;">
               <img src="${cfg.leftImageUrl}" style="${imgStyle}" />
           </div>`
        : `<div style="width:90px;"></div>`;

    const rightBlock = cfg.rightImageUrl
        ? `<div style="width:90px;display:flex;align-items:center;justify-content:center;">
               <img src="${cfg.rightImageUrl}" style="${imgStyle}" />
           </div>`
        : `<div style="width:90px;"></div>`;

    const now     = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    const timeStr = now.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });

    return `
        <div style="margin-bottom:20px;">
            <div style="display:flex;justify-content:space-between;align-items:center;
                        padding-bottom:12px;border-bottom:2px solid #0d6efd;">
                ${leftBlock}
                <div style="text-align:center;flex:1;padding:0 16px;">
                    <h2 style="margin:0 0 4px 0;font-size:18px;color:#0d6efd;font-weight:bold;">
                        CATUSNIS — ${title}
                    </h2>
                    <p style="margin:0;color:#666;font-size:12px;">${dateStr}</p>
                    <small style="color:#999;font-size:10px;">Imprimé à ${timeStr}</small>
                </div>
                ${rightBlock}
            </div>
        </div>`;
};

// ── Convertir URL en base64 ───────────────────────────────────────────────────
const imageToBase64 = async (url: string): Promise<string> => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    try {
        const res = await fetch(url);
        const blob = await res.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload  = () => resolve(reader.result as string);
            reader.onerror = () => resolve('');
            reader.readAsDataURL(blob);
        });
    } catch { return ''; }
};

// ── Résoudre les images de la config en base64 ───────────────────────────────
const resolveConfigImages = async () => {
    const cfg = getPrintConfig();
    const [left, right, bg] = await Promise.all([
        imageToBase64(cfg.leftImageUrl  || ''),
        imageToBase64(cfg.rightImageUrl || ''),
        imageToBase64(cfg.bgImageUrl    || ''),
    ]);
    return {
        ...cfg,
        leftImageUrl:  left  || cfg.leftImageUrl,
        rightImageUrl: right || cfg.rightImageUrl,
        bgImageUrl:    bg    || cfg.bgImageUrl,
    };
};

// ── Impression table par table avec logos configurés ─────────────────────────
export const printTable = async (tableId: string, title: string): Promise<void> => {
    const cfg = await resolveConfigImages();

    // ── Injecter le CSS d'impression ─────────────────────────────────────────
    const style = document.createElement('style');
    style.id = 'catusnis-print-style';
    style.innerHTML = `
        @media print {
            @page { margin: 1cm; size: A4 landscape; }
            body * { visibility: hidden !important; }
            #${tableId}, #${tableId} * { visibility: visible !important; }
            #catusnis-print-header { visibility: visible !important; }
            #catusnis-print-bg    { visibility: visible !important; }
            #${tableId} {
                position: fixed !important; top: 0; left: 0;
                width: 100% !important; padding: 20px !important;
                background: white !important;
            }
            .no-print { display: none !important; }
            table { width: 100% !important; border-collapse: collapse !important; }
            th, td {
                border: 1px solid #dee2e6 !important;
                padding: 6px 8px !important;
                font-size: 10px !important;
            }
            thead { background: #f8f9fa !important;
                    -webkit-print-color-adjust: exact !important; }
            tr:nth-child(even) { background: #f9f9f9 !important; }
        }
    `;
    document.head.appendChild(style);

    // ── Injecter l'en-tête ────────────────────────────────────────────────────
    const target = document.getElementById(tableId);
    if (!target) { style.remove(); return; }

    const header = document.createElement('div');
    header.id = 'catusnis-print-header';
    header.innerHTML = buildHeader(title, cfg);
    target.insertBefore(header, target.firstChild);

    // ── Injecter le background watermark ─────────────────────────────────────
    let bgEl: HTMLImageElement | null = null;
    if (cfg.bgImageUrl) {
        bgEl = document.createElement('img');
        bgEl.src = cfg.bgImageUrl;
        bgEl.id  = 'catusnis-print-bg';
        Object.assign(bgEl.style, {
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '350px', height: '350px',
            objectFit: 'contain', opacity: '0.06',
            zIndex: '0', pointerEvents: 'none',
        });
        document.body.appendChild(bgEl);
    }

    // ── Imprimer ──────────────────────────────────────────────────────────────
    setTimeout(() => {
        window.print();
        setTimeout(() => {
            style.remove();
            document.getElementById('catusnis-print-header')?.remove();
            bgEl?.remove();
        }, 1000);
    }, 400);
};

// ── Aliases de compatibilité ─────────────────────────────────────────────────
export const exportGlobalPDF     = async () => {};  // supprimé
export const printListWithConfig = printTable;       // alias