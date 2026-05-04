package com.catsnis.dno.dto;


import lombok.*;
import java.util.Date;

@Data @Builder

public class FournitureDeploiementResponse {

    private Integer id;
    private Integer fournitureId;
    private String  fournitureCode;
    private String  fournitureDesignation;
    private String  fournitureCategorie;
    private Integer personId;
    private Long    bookletId;
    private String  beneficiaireNom;
    private String  beneficiairePoste;
    private String  beneficiaireContact;
    private Integer quantiteDeployee;
    private Date    dateDeploiement;
    private String  motif;
    private Integer regionId;
    private String  regionName;
    private Integer districtId;
    private String  districtName;
    private String  notes;
    private Boolean active;
    private Date    createdAt;
}
