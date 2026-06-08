import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import DashboardService, { MapStatsResponse } from '../../services/DashboardService';
import RegionService   from '../../services/regionService';
import DistrictService from '../../services/districtService';
import HealthService   from '../../services/healthService';
import { RegionResponse, DistrictResponse, HealthResponse } from '../../types';

// ── Filtre actif ──────────────────────────────────────────────────────────────
type FilterType = 'interventions' | 'deployments' | 'functional' | 'nonFunctional' | 'stock';

const FILTERS: {
    key:        FilterType;
    label:      string;
    icon:       string;
    color:      string;
    btnClass:   string;
}[] = [
    { key: 'interventions', label: 'Interventions',    icon: 'bi-tools',         color: '#ffc107', btnClass: 'btn-warning'  },
    { key: 'deployments',   label: 'Déployés',         icon: 'bi-truck',          color: '#198754', btnClass: 'btn-success'  },
    { key: 'functional',    label: 'Fonctionnels',     icon: 'bi-check-circle',   color: '#0d6efd', btnClass: 'btn-primary'  },
    { key: 'nonFunctional', label: 'Non fonctionnels', icon: 'bi-x-circle',       color: '#dc3545', btnClass: 'btn-danger'   },
    { key: 'stock',         label: 'En stock',         icon: 'bi-box-seam-fill',  color: '#6f42c1', btnClass: 'btn-secondary'},
];

// ── Coordonnées des régions ───────────────────────────────────────────────────
const REGION_COORDS: Record<string, [number, number]> = {
    'PORO':           [9.45,  -5.63],
    'MARAHOUE':       [6.99,  -5.74],
    'HAUT-SASSANDRA': [6.88,  -6.45],
    'TCHOLOGO':       [9.59,  -5.20],
};

// ── Composant ─────────────────────────────────────────────────────────────────
const CIVMap: React.FC = () => {
    const [activeFilter,  setActiveFilter]  = useState<FilterType>('deployments');
    const [mapData,       setMapData]       = useState<MapStatsResponse | null>(null);
    const [isLoading,     setIsLoading]     = useState(true);

    // ── Listes déroulantes ────────────────────────────────────────────────────
    const [regions,   setRegions]   = useState<RegionResponse[]>([]);
    const [districts, setDistricts] = useState<DistrictResponse[]>([]);
    const [healths,   setHealths]   = useState<HealthResponse[]>([]);

    // ── Valeurs sélectionnées ─────────────────────────────────────────────────
    const [regionId,   setRegionId]   = useState<number | undefined>(undefined);
    const [districtId, setDistrictId] = useState<number | undefined>(undefined);
    const [healthId,   setHealthId]   = useState<number | undefined>(undefined);

    // ── Charger les listes au montage ─────────────────────────────────────────
    useEffect(() => {
        RegionService.getAllList().then(setRegions).catch(console.error);
    }, []);

    // ── Recharger les données carte à chaque changement de filtre géo ─────────
    useEffect(() => {
        setIsLoading(true);
        DashboardService.getMapStats(regionId, districtId, healthId)
            .then(setMapData)
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [regionId, districtId, healthId]);

    // ── Cascade région → district ─────────────────────────────────────────────
    const handleRegionChange = async (id: number | undefined) => {
        setRegionId(id);
        setDistrictId(undefined);
        setHealthId(undefined);
        setDistricts([]);
        setHealths([]);
        if (id) {
            const data = await DistrictService.getAllList(id);
            setDistricts(data);
        }
    };

    // ── Cascade district → site ───────────────────────────────────────────────
    const handleDistrictChange = async (id: number | undefined) => {
        setDistrictId(id);
        setHealthId(undefined);
        setHealths([]);
        if (id) {
            const data = await HealthService.getAllList(id);
            setHealths(data);
        }
    };

    // ── Réinitialiser les filtres ─────────────────────────────────────────────
    const resetFilters = () => {
        setRegionId(undefined);
        setDistrictId(undefined);
        setHealthId(undefined);
        setDistricts([]);
        setHealths([]);
    };

    const activeConfig  = FILTERS.find(f => f.key === activeFilter)!;
    const regionStats   = mapData?.regionStats ?? [];
    const totalStock    = mapData?.totalStock ?? 0;
    const maxValue      = Math.max(...regionStats.map(r =>
        activeFilter !== 'stock' ? (r[activeFilter as keyof typeof r] as number) : 0
    ), 1);
    const getRadius = (val: number) => 10 + (val / maxValue) * 35;

    return (
        <div>
            {/* ── Filtres géographiques ─────────────────────────────────── */}
            <div className="row g-2 mb-3">
                <div className="col-12 col-md-4">
                    <select
                        className="form-select form-select-sm"
                        value={regionId ?? ''}
                        onChange={e => handleRegionChange(
                            e.target.value ? Number(e.target.value) : undefined
                        )}
                    >
                        <option value="">— Toutes les régions —</option>
                        {regions.map(r => (
                            <option key={r.id} value={r.id}>{r.regionName}</option>
                        ))}
                    </select>
                </div>
                <div className="col-12 col-md-4">
                    <select
                        className="form-select form-select-sm"
                        value={districtId ?? ''}
                        disabled={!regionId}
                        onChange={e => handleDistrictChange(
                            e.target.value ? Number(e.target.value) : undefined
                        )}
                    >
                        <option value="">— Tous les districts —</option>
                        {districts.map(d => (
                            <option key={d.id} value={d.id}>{d.DistrictName}</option>
                        ))}
                    </select>
                </div>
                <div className="col-12 col-md-3">
                    <select
                        className="form-select form-select-sm"
                        value={healthId ?? ''}
                        disabled={!districtId}
                        onChange={e => setHealthId(
                            e.target.value ? Number(e.target.value) : undefined
                        )}
                    >
                        <option value="">— Tous les sites —</option>
                        {healths.map(h => (
                            <option key={h.id} value={h.id}>{h.healthName}</option>
                        ))}
                    </select>
                </div>
                <div className="col-12 col-md-1">
                    {(regionId || districtId || healthId) && (
                        <button
                            className="btn btn-sm btn-outline-secondary w-100"
                            onClick={resetFilters}
                            title="Réinitialiser"
                        >
                            <i className="bi bi-x-lg" />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Filtres type de données ───────────────────────────────── */}
            <div className="d-flex flex-wrap gap-2 mb-3">
                {FILTERS.map(f => (
                    <button
                        key={f.key}
                        className={`btn btn-sm ${
                            activeFilter === f.key
                                ? f.btnClass
                                : 'btn-outline-secondary'
                        }`}
                        onClick={() => setActiveFilter(f.key)}
                    >
                        <i className={`bi ${f.icon} me-1`} />
                        {f.label}
                        {f.key === 'stock' && (
                            <span className="ms-1 badge bg-light text-dark">
                                {totalStock}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Carte ou vue stock ────────────────────────────────────── */}
            {isLoading ? (
                <div className="d-flex justify-content-center align-items-center"
                     style={{ height: '380px' }}>
                    <div className="spinner-border text-primary" />
                </div>
            ) : activeFilter === 'stock' ? (
                <div className="d-flex flex-column align-items-center
                               justify-content-center rounded-3 border"
                     style={{ height: '380px', background: '#f8f9fa' }}>
                    <i className="bi bi-box-seam-fill fs-1 mb-3"
                       style={{ color: '#6f42c1' }} />
                    <h3 className="fw-bold mb-1" style={{ color: '#6f42c1' }}>
                        {totalStock}
                    </h3>
                    <p className="text-muted mb-0">
                        équipement(s) en stock (non déployés)
                    </p>
                </div>
            ) : (
                <MapContainer
                    center={[7.5, -5.5]}
                    zoom={6}
                    style={{ height: '380px', width: '100%', borderRadius: '12px' }}
                    scrollWheelZoom={false}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap contributors'
                    />
                    {regionStats.map(region => {
                        const coords = REGION_COORDS[region.label.toUpperCase()];
                        if (!coords) return null;
                        const value = region[activeFilter as keyof typeof region] as number;
                        return (
                            <CircleMarker
                                key={region.label}
                                center={coords}
                                radius={getRadius(value)}
                                pathOptions={{
                                    color:       activeConfig.color,
                                    fillColor:   activeConfig.color,
                                    fillOpacity: 0.65,
                                    weight:      2,
                                }}
                            >
                                <Tooltip permanent direction="top" offset={[0, -8]}>
                                    <div className="text-center">
                                        <strong>{region.label}</strong><br />
                                        <i className={`bi ${activeConfig.icon} me-1`} />
                                        {value} {activeConfig.label.toLowerCase()}
                                    </div>
                                </Tooltip>
                            </CircleMarker>
                        );
                    })}
                </MapContainer>
            )}

            {/* ── Légende ──────────────────────────────────────────────── */}
            {activeFilter !== 'stock' && !isLoading && (
                <div className="d-flex flex-wrap gap-3 mt-2">
                    {regionStats.map(region => {
                        const value = region[activeFilter as keyof typeof region] as number;
                        return (
                            <span key={region.label}
                                  className="d-flex align-items-center gap-1 small">
                                <span style={{
                                    width: 10, height: 10,
                                    borderRadius: '50%',
                                    backgroundColor: activeConfig.color,
                                    display: 'inline-block',
                                }} />
                                <span className="text-muted">
                                    {region.label} ({value})
                                </span>
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CIVMap;