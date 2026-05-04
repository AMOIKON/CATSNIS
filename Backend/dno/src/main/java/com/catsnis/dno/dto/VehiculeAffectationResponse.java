package com.catsnis.dno.dto;

import lombok.*;
import java.util.Date;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class VehiculeAffectationResponse {
    private Long    id;
    private Integer vehiculeId;
    private String  immatriculation;
    private String  vehiculeType;
    private String  vehiculeMarque;

    // Source conducteur
    private Integer personId;
    private Long    bookletId;
    private String  personNom;
    private String  personPoste;
    private String  personContact;

    private Integer regionId;
    private String  regionName;
    private Integer districtId;
    private String  districtName;

    private Date    dateAffectation;
    private Date    dateRetour;
    private String  motif;
    private String  observations;
    private Boolean active;
}