package com.catsnis.dno.service;

import com.catsnis.dno.dto.AcquisitionRequest;
import com.catsnis.dno.dto.AcquisitionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface AcquisitionService {

    List<AcquisitionResponse> getAvailable(Integer typesId);

    AcquisitionResponse getAcquisitionById(Integer id);

    // ✅ status ajouté — filtre optionnel (ex : "HORS_BASE" pour la vue de suivi)
    Page<AcquisitionResponse> getAllAcquisitions(Pageable pageable, Integer typesId, String status, String keyword);

    AcquisitionResponse saveAcquisition(AcquisitionRequest request);

    AcquisitionResponse updateAcquisition(Integer id, AcquisitionRequest request);

    void deleteAcquisition(Integer id);

    // ✅ Compteur d'équipements hors base — pour badge/stat dans la page Acquisitions
    long countHorsBaseEquipment();
}