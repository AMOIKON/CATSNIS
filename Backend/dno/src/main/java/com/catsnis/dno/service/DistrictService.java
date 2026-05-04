package com.catsnis.dno.service;
import com.catsnis.dno.dto.DistrictRequest;
import com.catsnis.dno.dto.DistrictResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
public interface DistrictService {
  DistrictResponse         getDistrictById(Integer id);
  Page<DistrictResponse>   getAllDistricts(Pageable pageable, Integer regionId, String keyword);
  List<DistrictResponse>   getDistrictsByRegionId(Integer regionId);
  DistrictResponse         saveDistrict(DistrictRequest request);
  DistrictResponse         updateDistrict(Integer id, DistrictRequest request);
  void                     deleteDistrict(Integer id);
}