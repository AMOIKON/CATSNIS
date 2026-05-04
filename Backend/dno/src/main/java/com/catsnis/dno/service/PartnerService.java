package com.catsnis.dno.service;
import com.catsnis.dno.dto.PartnerRequest;
import com.catsnis.dno.dto.PartnerResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
public interface PartnerService {
    PartnerResponse         getPartnerById(Integer id);
    Page<PartnerResponse>   getAllPartners(Pageable pageable, String keyword);
    PartnerResponse         savePartner(PartnerRequest request);
    PartnerResponse         updatePartner(Integer id, PartnerRequest request);
    void                    deletePartner(Integer id);
}