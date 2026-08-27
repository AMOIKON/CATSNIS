import React, { useRef, useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { signatureFileToBase64 } from '../../utils/signatureFileToBase64';

interface Props {
    /** Appelé avec la data URI PNG Base64 une fois la conversion terminée. */
    onImported: (base64: string) => void;
    /** Appelé si la conversion échoue (format non supporté, fichier trop lourd, etc.). */
    onError?: (message: string) => void;
    disabled?: boolean;
}

/**
 * NOUVEAU (27/08/2026) — bouton "Importer une signature" réutilisable :
 * accepte une photo (JPG/PNG) ou un PDF scanné, convertit le tout côté
 * navigateur (voir signatureFileToBase64.ts) et renvoie le résultat via
 * onImported — le composant parent décide ensuite quoi en faire (l'afficher
 * en aperçu, l'envoyer à l'API, etc.), exactement comme il le fait déjà pour
 * une signature dessinée sur le canvas.
 */
const SignatureImportButton: React.FC<Props> = ({ onImported, onError, disabled }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        try {
            const base64 = await signatureFileToBase64(file);
            onImported(base64);
        } catch (err: any) {
            onError?.(err.message || "Erreur lors de l'import de la signature.");
        } finally {
            setLoading(false);
            if (inputRef.current) inputRef.current.value = ''; // permet de réimporter le même fichier
        }
    };

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,application/pdf"
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />
            <Button
                variant="outline-primary"
                size="sm"
                className="rounded-3"
                disabled={disabled || loading}
                onClick={() => inputRef.current?.click()}
            >
                {loading
                    ? <><Spinner size="sm" className="me-2" />Import en cours...</>
                    : <><i className="bi bi-upload me-1" />Importer (photo ou PDF)</>}
            </Button>
        </>
    );
};

export default SignatureImportButton;