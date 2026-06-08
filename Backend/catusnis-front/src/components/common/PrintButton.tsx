import React, { useState } from 'react';
import PrintPreviewModal from './Printpreviewmodal';

interface PrintButtonProps {
    tableId:    string;
    title:      string;
    className?: string;
}

const PrintButton: React.FC<PrintButtonProps> = ({ tableId, title, className }) => {
    const [showPreview, setShowPreview] = useState(false);

    return (
        <>
            <button
                className={`btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 no-print ${className ?? ''}`}
                onClick={() => setShowPreview(true)}
                title={`Configurer et imprimer — ${title}`}
            >
                <i className="bi bi-printer-fill" />
                <span>Imprimer</span>
            </button>

            <PrintPreviewModal
                show={showPreview}
                title={title}
                tableId={tableId}
                onHide={() => setShowPreview(false)}
            />
        </>
    );
};

export default PrintButton;