package com.catsnis.dno.service;
import com.catsnis.dno.dto.AcquisitionRequest;
import com.catsnis.dno.dto.AcquisitionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
public interface AcquisitionService {
    AcquisitionResponse         getAcquisitionById(Integer id);
    Page<AcquisitionResponse>   getAllAcquisitions(Pageable pageable, Integer typesId, String keyword);
    AcquisitionResponse         saveAcquisition(AcquisitionRequest request);
    AcquisitionResponse         updateAcquisition(Integer id, AcquisitionRequest request);
    List<AcquisitionResponse>   getAvailable(Integer typesId);
    void                        deleteAcquisition(Integer id);
}