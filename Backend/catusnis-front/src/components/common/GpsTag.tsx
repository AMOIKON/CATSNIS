// src/components/common/GpsTag.tsx
// Composant réutilisable pour afficher les coordonnées GPS avec lien Google Maps

import React from 'react';

interface Props {
  latitude?:  number | null;
  longitude?: number | null;
  compact?:   boolean; // true = juste l'icône + badge court
}

const GpsTag: React.FC<Props> = ({ latitude, longitude, compact = false }) => {
  if (!latitude || !longitude) {
    return compact ? null : (
      <span className="badge bg-secondary bg-opacity-10 text-secondary" style={{ fontSize: '10px' }}>
        <i className="bi bi-geo-alt me-1" />Non géolocalisé
      </span>
    );
  }

  const url   = `https://www.google.com/maps?q=${latitude},${longitude}`;
  const label = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

  if (compact) {
    return (
      <a href={url} target="_blank" rel="noreferrer"
        className="badge bg-success bg-opacity-10 text-success text-decoration-none"
        style={{ fontSize: '10px' }}
        title={`Voir sur Google Maps : ${label}`}>
        <i className="bi bi-geo-alt-fill me-1" />GPS
      </a>
    );
  }

  return (
    <a href={url} target="_blank" rel="noreferrer"
      className="d-inline-flex align-items-center gap-1 text-decoration-none"
      style={{ fontSize: '11px' }}>
      <span className="badge bg-success bg-opacity-10 text-success d-inline-flex align-items-center gap-1">
        <i className="bi bi-geo-alt-fill" />
        {label}
        <i className="bi bi-box-arrow-up-right ms-1" style={{ fontSize: '9px' }} />
      </span>
    </a>
  );
};

export default GpsTag;