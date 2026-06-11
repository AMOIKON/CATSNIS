// src/components/common/SafeChart.tsx
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
  const ref               = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // ✅ Vérifier que le conteneur a bien des dimensions > 0
    const check = () => el.getBoundingClientRect().width > 0;

    if (check()) {
      setReady(true);
      return;
    }

    // ✅ Attendre que le layout soit calculé
    let raf1: number;
    let raf2: number;
    let timer: ReturnType<typeof setTimeout>;

    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (check()) { setReady(true); return; }
        // Dernier recours : 100ms
        timer = setTimeout(() => setReady(true), 100);
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{
        display:   'block',
        height,
        minHeight: height,
        width:     '100%',
        minWidth:  0,
        overflow:  'hidden',
        // ✅ position relative donne un contexte de layout au ResponsiveContainer
        position:  'relative',
      }}
    >
      {isEmpty ? (
        <p className="text-muted small text-center pt-5">{emptyMsg}</p>
      ) : ready ? (
        children
      ) : (
        <div style={{ height, minHeight: height }} />
      )}
    </div>
  );
};

export default SafeChart;