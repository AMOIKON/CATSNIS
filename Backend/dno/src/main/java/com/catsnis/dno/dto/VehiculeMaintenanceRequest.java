package com.catsnis.dno.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.Date;

@Data
public class VehiculeMaintenanceRequest {
    @NotNull  private Integer vehiculeId;
    @NotNull  private Date    dateMaintenance;
    @NotBlank private String  typeMaintenance;
    @NotBlank private String  description;
    private String  prestataire;
    private Double  coutReel;
    private String  statut;
    private Integer kilometrageIntervention;
    private String  observations;
}