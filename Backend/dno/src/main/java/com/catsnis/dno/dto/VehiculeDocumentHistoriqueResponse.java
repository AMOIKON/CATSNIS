package com.catsnis.dno.dto;

import lombok.*;
import java.util.Date;

@Data @Builder @NoArgsConstructor @AllArgsConstructor

public class VehiculeDocumentHistoriqueResponse {
    private Long   id;
    private Integer vehiculeId;
    private String immatriculation;
    private String typeDocument;
    private Date   ancienneDateDebut;
    private Date   ancienneDateFin;
    private Date   nouvelleDateDebut;
    private Date   nouvelleDateFin;
    private Date   dateRenouvellement;
    private String notes;

}
