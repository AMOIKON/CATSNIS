package com.catsnis.dno.dto;

import lombok.*;
import java.util.Date;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class VehiculeMaintenanceResponse {
    private Integer id;
    private Integer vehiculeId;
    private String  immatriculation;
    private Date    dateMaintenance;
    private String  typeMaintenance;
    private String  description;
    private String  prestataire;
    private Double  coutReel;
    private String  statut;
    private Integer kilometrageIntervention;
    private String  observations;
}