package com.catsnis.dno.service;

import com.catsnis.dno.dto.*;
import com.catsnis.dno.entity.VehiculeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface VehiculeService {

    VehiculeResponse              getById(Integer id);
    Page<VehiculeResponse>        getAll(Pageable pageable, VehiculeType type, String statut,
                                         Integer regionId, String keyword);
    List<VehiculeResponse>        getAllList();
    VehiculeResponse              save(VehiculeRequest request);
    VehiculeResponse              update(Integer id, VehiculeRequest request);
    void                          delete(Integer id);

    // Historique complet
    VehiculeHistoriqueResponse    getHistorique(Integer vehiculeId);

    // Incidents
    VehiculeIncidentResponse         saveIncident(VehiculeIncidentRequest request);
    VehiculeIncidentResponse         updateIncident(Integer id, VehiculeIncidentRequest request);
    void                             deleteIncident(Integer id);
    Page<VehiculeIncidentResponse>   getIncidents(Pageable pageable, Integer vehiculeId,
                                                  String statut, String keyword);

    // Maintenances
    VehiculeMaintenanceResponse         saveMaintenance(VehiculeMaintenanceRequest request);
    VehiculeMaintenanceResponse         updateMaintenance(Integer id, VehiculeMaintenanceRequest request);
    void                                deleteMaintenance(Integer id);
    Page<VehiculeMaintenanceResponse>   getMaintenances(Pageable pageable, Integer vehiculeId,
                                                        String statut, String keyword);

    // Affectations
    VehiculeAffectationResponse         affecter(VehiculeAffectationRequest request);
    VehiculeAffectationResponse         updateAffectation(Long id, VehiculeAffectationRequest request);
    void                                cloturerAffectation(Integer vehiculeId);
    Page<VehiculeAffectationResponse>   getAffectations(Pageable pageable, Integer vehiculeId,
                                                        Integer personId, Boolean active);
    VehiculeAffectationResponse         getAffectationActive(Integer vehiculeId);

    // Alertes
    List<VehiculeAlertResponse>   getAlertes(Integer joursAvance);

    VehiculeDocumentHistoriqueResponse renouvelerDocument(Integer vehiculeId,
                                                          VehiculeDocumentRenewalRequest request);

    List<VehiculeDocumentHistoriqueResponse> getDocumentsHistorique(Integer vehiculeId);

}