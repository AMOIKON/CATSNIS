package com.catsnis.dno.dto;

import lombok.*;
import java.util.Date;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class VehiculeAlertResponse {
    private Integer id;
    private String  immatriculation;
    private String  vehiculeType;
    private String  typeAlerte;
    private String  niveau;
    private Date    dateExpiration;
    private Integer joursRestants;
}