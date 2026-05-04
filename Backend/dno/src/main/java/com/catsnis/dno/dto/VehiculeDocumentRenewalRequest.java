package com.catsnis.dno.dto;


import lombok.Data;
import java.util.Date;

@Data


public class VehiculeDocumentRenewalRequest {

    /** ASSURANCE | VISITE_TECHNIQUE | VIGNETTE */
    private String typeDocument;
    private Date   nouvelleDateDebut;
    private Date   nouvelleDateFin;
    private String notes;

}
