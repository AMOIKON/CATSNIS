package com.catsnis.dno.dto;
import lombok.Data;
import java.util.List;
import java.util.Map;
@Data
public class InterventionRequest {
    private String              typeInter;
    private String              actionInter;
    private String              commentInter;
    private String              dateInter;
    private Integer             durationMinutes;
    private Integer             regionId;
    private Integer             districtId;
    private Integer             healthId;
    private Integer             deploymentId;
    private Integer             evaluationId;
    private Integer             typesId;
    private Integer             appsId;
    private Integer             bookletId;
    private Boolean             enAttenteMaintenance;
    private Map<Integer,Boolean> maintenanceReussie;
    private List<Long>          selectedItemIds;
    private Map<Long, String>   etatsAvant;
    private Map<Long, String>   etatsApres;
    private Map<Long, Integer>  replacements;
}