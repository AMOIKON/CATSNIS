package com.catsnis.dno.dto;

import lombok.*;
import java.util.Date;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class VehiculeIncidentResponse {
    private Integer id;
    private Integer vehiculeId;
    private String  immatriculation;
    private String  vehiculeType;
    private Date    dateIncident;
    private String  description;
    private String  typeIncident;
    private String  statut;
    private Double  coutEstime;
    private String  signalePar;
    private String  lieuIncident;
    private String  observations;
}