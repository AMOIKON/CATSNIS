/**
 * NOUVEAU (27/08/2026) — convertit un fichier importe (image JPG/PNG ou PDF
 * scanne) en une chaine Base64 au format "data:image/png;base64,...", prete
 * a etre envoyee telle quelle aux endpoints existants qui attendent deja ce
 * format (SignatureService.update(), BookletController /{id}/signature).
 *
 * Tout se fait cote navigateur, sans dependance backend supplementaire :
 *   - Image (JPG/PNG) : lue directement via FileReader, puis redessinee sur
 *     un canvas pour normaliser en PNG (au cas ou l'original serait un JPEG).
 *   - PDF : la premiere page est rendue sur un canvas via pdfjs-dist, puis
 *     exportee en PNG — meme resultat final qu'une image importee.
 *
 * Necessite la dependance npm "pdfjs-dist" :
 *   npm install pdfjs-dist
 */

import * as pdfjsLib from 'pdfjs-dist';

// Le worker pdf.js est chargé depuis un CDN correspondant exactement à la
// version installée — évite tout souci de configuration bundler (Vite/CRA/
// webpack gèrent tous différemment l'import d'un worker en fichier local).
pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo

function bufferedCanvasToPngDataUrl(canvas: HTMLCanvasElement): string {
    return canvas.toDataURL('image/png');
}

async function imageFileToPngDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) { reject(new Error('Impossible de traiter cette image.')); return; }
                ctx.drawImage(img, 0, 0);
                resolve(bufferedCanvasToPngDataUrl(canvas));
            };
            img.onerror = () => reject(new Error('Image illisible ou corrompue.'));
            img.src = reader.result as string;
        };
        reader.onerror = () => reject(new Error('Impossible de lire le fichier.'));
        reader.readAsDataURL(file);
    });
}

async function pdfFileToPngDataUrl(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    if (pdf.numPages === 0) {
        throw new Error('Le PDF ne contient aucune page.');
    }
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2 }); // ~144 DPI, suffisant pour une signature

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Impossible de préparer le rendu du PDF.');

    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    return bufferedCanvasToPngDataUrl(canvas);
}

/**
 * Point d'entrée principal : accepte un File (venant d'un <input type="file">)
 * et retourne une data URI PNG en Base64, quel que soit le format d'origine
 * (JPG, PNG ou PDF).
 */
export async function signatureFileToBase64(file: File): Promise<string> {
    if (!file) {
        throw new Error('Aucun fichier sélectionné.');
    }
    if (file.size > MAX_SIZE_BYTES) {
        throw new Error('Le fichier dépasse la taille maximale autorisée (5 Mo).');
    }

    const type = file.type.toLowerCase();

    if (type === 'application/pdf') {
        return pdfFileToPngDataUrl(file);
    }
    if (type === 'image/png' || type === 'image/jpeg' || type === 'image/jpg') {
        return imageFileToPngDataUrl(file);
    }

    throw new Error('Format non supporté. Formats acceptés : PNG, JPG, PDF.');
}