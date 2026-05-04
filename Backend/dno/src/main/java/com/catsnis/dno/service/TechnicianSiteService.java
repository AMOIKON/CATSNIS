package com.catsnis.dno.service;

import com.catsnis.dno.dto.TechnicianSiteRequest;
import com.catsnis.dno.dto.TechnicianSiteResponse;

import java.util.List;

public interface TechnicianSiteService {
    TechnicianSiteResponse assign(TechnicianSiteRequest request);
    TechnicianSiteResponse update(Integer id, TechnicianSiteRequest request); // ✅ ajouté
    List<TechnicianSiteResponse> getByTechnician(Integer personId);
    void unassign(Integer id);
    List<Integer> getHealthIdsByTechnician(Integer personId);
    List<Integer> getDistrictIdsByTechnician(Integer personId);
    List<Integer> getRegionIdsByTechnician(Integer personId);
}