import React, { createContext, useContext, useState, ReactNode } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface PrintConfig {
    leftImageUrl:    string | null;
    rightImageUrl:   string | null;
    bgImageUrl:      string | null;
    leftImageLabel:  string;
    rightImageLabel: string;
}

interface PrintConfigContextType {
    config:      PrintConfig;
    setConfig:   (c: PrintConfig) => void;
    resetConfig: () => void;
}

// ── Valeurs par défaut ────────────────────────────────────────────────────────
const DEFAULT_CONFIG: PrintConfig = {
    leftImageUrl:    null,
    rightImageUrl:   null,
    bgImageUrl:      null,
    leftImageLabel:  '',
    rightImageLabel: '',
};

const STORAGE_KEY = 'catusnis_print_config';

// ── Contexte ──────────────────────────────────────────────────────────────────
const PrintConfigContext = createContext<PrintConfigContextType>({
    config:      DEFAULT_CONFIG,
    setConfig:   () => {},
    resetConfig: () => {},
});

// ── Provider ──────────────────────────────────────────────────────────────────
export const PrintConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [config, setConfigState] = useState<PrintConfig>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? { ...DEFAULT_CONFIG, ...JSON.parse(stored) } : DEFAULT_CONFIG;
        } catch { return DEFAULT_CONFIG; }
    });

    const setConfig = (c: PrintConfig) => {
        setConfigState(c);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); }
        catch { console.error('Erreur sauvegarde config impression'); }
    };

    const resetConfig = () => {
        setConfigState(DEFAULT_CONFIG);
        localStorage.removeItem(STORAGE_KEY);
    };

    return (
        <PrintConfigContext.Provider value={{ config, setConfig, resetConfig }}>
            {children}
        </PrintConfigContext.Provider>
    );
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export const usePrintConfig = () => useContext(PrintConfigContext);

export default PrintConfigContext;