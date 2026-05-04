package com.catsnis.dno.service;

import com.catsnis.dno.dto.DashboardStatsResponse;
import com.catsnis.dno.dto.MapStatsResponse;

public interface DashboardService {
    DashboardStatsResponse getStats();
    MapStatsResponse getMapStats(Integer regionId, Integer districtId, Integer healthId);
}
