package com.catsnis.dno.dto;

import lombok.*;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DashboardStatsResponse {

    // ── Cartes de statistiques ────────────────────────────────────────────────
    private long totalPersons;
    private long totalTechniciens;
    private long totalInterventions;
    private long totalDeployments;
    private long totalAcquisitions;
    private long totalHealthSites;
    private long totalPartners;
    private long totalRegions;
    private long totalStock;

    // ✅ Utilise MapStatsResponse.RegionMapStat — plus de doublon
    private List<MapStatsResponse.RegionMapStat> regionStats;

    // ── Interventions par mois ────────────────────────────────────────────────
    private List<MonthStat> interventionsByMonth;

    // ── Déploiements par région (bar chart) ───────────────────────────────────
    private List<LabelStat> deploymentsByRegion;

    // ── Interventions par type ────────────────────────────────────────────────
    private List<LabelStat> interventionsByType;

    // ── Répartition des rôles ─────────────────────────────────────────────────
    private List<LabelStat> personsByRole;

    // ── Dernières interventions ───────────────────────────────────────────────
    private List<RecentIntervention> recentInterventions;

    // ── Derniers déploiements ─────────────────────────────────────────────────
    private List<RecentDeployment> recentDeployments;

    // ── Sous-types ────────────────────────────────────────────────────────────
    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class MonthStat {
        private String month;
        private long   count;
    }

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class LabelStat {
        private String label;
        private long   count;
    }

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class RecentIntervention {
        private Integer id;
        private String  codeInter;
        private String  typeInter;
        private String  healthName;
        private String  technicianName;
        private String  dateInter;
    }

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class RecentDeployment {
        private Integer id;
        private String  codeDep;
        private String  healthName;
        private String  regionName;
        private String  dateRecep;
    }
}