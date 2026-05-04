package com.catsnis.dno.service;
import com.catsnis.dno.dto.UnitsRequest;
import com.catsnis.dno.dto.UnitsResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
public interface UnitsService {
    UnitsResponse         getUnitsById(Integer id);
    Page<UnitsResponse>   getAllUnits(Pageable pageable, String keyword);
    UnitsResponse         saveUnits(UnitsRequest request);
    UnitsResponse         updateUnits(Integer id, UnitsRequest request);
    void                  deleteUnits(Integer id);
}