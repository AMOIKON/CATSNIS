package com.catsnis.dno.dto;

import lombok.Data;
import java.util.Date;

@Data
public class VehiculeAffectationRequest {
    private Integer vehiculeId;
    private Integer personId;    // optionnel — Person système
    private Integer bookletId;   // optionnel — Registre booklet (prioritaire)
    private Integer regionId;
    private Integer districtId;
    private Date    dateAffectation;
    private Date    dateRetour;
    private String  motif;
    private String  observations;
}