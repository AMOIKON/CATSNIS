// src/components/common/SafeChart.tsx
//
// Wrapper Recharts — rend les graphiques uniquement quand
// le conteneur a des dimensions valides (> 0).
// Élimine le warning "width(-1) and height(-1)".

import React, { useEffect, useRef, useState } from 'react';

interface SafeChartProps {
  height?:   number;
  isEmpty?:  boolean;
  emptyMsg?: string;
  children:  React.ReactNode;
}

const SafeChart: React.FC<SafeChartProps> = ({
  height   = 280,
  isEmpty  = false,
  emptyMsg = 'Aucune donnée',
  children,
}) => {
  const ref                    = useRef<HTMLDivElement | null>(null);
  const [ready, setReady]      = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // ✅ Vérifier width ET height > 0 avant de rendre
    if (el.offsetWidth > 0 && el.offsetHeight > 0) {
      setReady(true);
      return;
    }

    const ro = new ResizeObserver(() => {
      if (el.offsetWidth > 0 && el.offsetHeight > 0) {
        setReady(true);
        ro.disconnect();
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        display:   'block',
        height,
        minHeight: height,
        width:     '100%',
        overflow:  'hidden',
      }}
    >
      {isEmpty ? (
        <p className="text-muted small text-center pt-5">{emptyMsg}</p>
      ) : ready ? (
        children
      ) : (
        <div className="d-flex justify-content-center align-items-center h-100">
          <div className="spinner-border spinner-border-sm text-secondary" />
        </div>
      )}
    </div>
  );
};

export default SafeChart;