package com.catsnis.dno.dto;
import lombok.Data;
import java.util.Date;

@Data
public class FournitureDeploiementRequest {

    private Integer fournitureId;
    private Integer personId;
    private Integer bookletId;
    private Integer quantiteDeployee;
    private Date    dateDeploiement;
    private String  motif;
    private Integer regionId;
    private Integer districtId;
    private String  notes;
}
