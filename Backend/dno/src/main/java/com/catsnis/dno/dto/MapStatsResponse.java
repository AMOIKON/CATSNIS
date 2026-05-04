package com.catsnis.dno.dto;

import lombok.*;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MapStatsResponse {

    private long totalStock;
    private List<RegionMapStat> regionStats;

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class RegionMapStat {
        private String label;
        private long   interventions;
        private long   deployments;
        private long   functional;
        private long   nonFunctional;
    }
}