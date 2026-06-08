import React, { useEffect } from 'react';
import Sidebar from './SideBar';

interface MainLayoutProps {
  title:    string;
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ title, children }) => {
  useEffect(() => {
    document.title = `${title} — CATUSNIS`;
  }, [title]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f0e8' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* ── Header de page ── */}
        <header style={{
          background: '#fff',
          borderBottom: '0.5px solid rgba(0,0,0,0.08)',
          padding: '0 24px',
          height: '52px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <h6 className="fw-semibold mb-0" style={{ fontSize: '14px' }}>{title}</h6>
        </header>

        {/* ── Contenu ── */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;