// ── Déclarations pour les imports CSS ────────────────────────────────────────
declare module '*.css' {
    const content: { [className: string]: string };
    export default content;
}

declare module '*.scss' {
    const content: { [className: string]: string };
    export default content;
}

// ── Déclaration spécifique pour leaflet ──────────────────────────────────────
declare module 'leaflet/dist/leaflet.css' {
    const styles: string;
    export default styles;
}