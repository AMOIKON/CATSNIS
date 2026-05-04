package com.catsnis.dno.dto;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.Date;

@Data

public class VehiculeIncidentRequest {

    @NotNull  private Integer vehiculeId;
    @NotNull  private Date    dateIncident;
    @NotBlank private String  description;
    private String  typeIncident;
    private String  statut;
    private Double  coutEstime;
    private String  signalePar;
    private String  lieuIncident;
    private String  observations;
}
