import React, { useState } from 'react';
import html2canvas from 'html2canvas';

interface Props {
  /** ref vers le conteneur DOM à capturer */
  targetRef: React.RefObject<HTMLDivElement | null>;
  filename?: string;
}

const ChartExportButton: React.FC<Props> = ({ targetRef, filename = 'dashboard' }) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const exportAs = async (format: 'png' | 'jpg') => {
    if (!targetRef.current) return;
    setBusy(true);
    try {
      const canvas = await html2canvas(targetRef.current, {
        scale: 2,
        backgroundColor: '#f1f0e8',
        logging: false,
      });
      const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
      const dataUrl = canvas.toDataURL(mime, 0.95);
      const link = document.createElement('a');
      link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export error:', err);
      alert('Erreur lors de l\'export. Réessayez.');
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  return (
    <div className="position-relative" style={{ display: 'inline-block' }}>
      <button
        className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2"
        onClick={() => setOpen(o => !o)}
        disabled={busy}
        style={{ fontSize: '12px' }}
      >
        {busy
          ? <><span className="spinner-border spinner-border-sm" />Export...</>
          : <><i className="bi bi-download" />Exporter</>
        }
      </button>
      {open && !busy && (
        <div className="position-absolute end-0 mt-1 bg-white shadow rounded-3 border"
          style={{ minWidth: '160px', zIndex: 1050, padding: '4px' }}>
          <button
            className="btn btn-sm w-100 text-start d-flex align-items-center gap-2 border-0"
            onClick={() => exportAs('png')}>
            <i className="bi bi-file-image text-primary" />Exporter en PNG
          </button>
          <button
            className="btn btn-sm w-100 text-start d-flex align-items-center gap-2 border-0"
            onClick={() => exportAs('jpg')}>
            <i className="bi bi-file-image text-warning" />Exporter en JPG
          </button>
        </div>
      )}
    </div>
  );
};

export default ChartExportButton;