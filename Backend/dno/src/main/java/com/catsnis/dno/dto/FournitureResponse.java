package com.catsnis.dno.dto;

import com.catsnis.dno.entity.Fourniture.FournitureCategorie;
import com.catsnis.dno.entity.Fourniture.FournitureStatut;
import lombok.*;
import java.util.Date;

@Data @Builder

public class FournitureResponse {

    private Integer            id;
    private String             code;
    private String             designation;
    private FournitureCategorie categorie;
    private Integer            quantite;
    private Integer            quantiteDisponible;
    private Integer            quantiteDeployee;
    private String             unite;
    private String             description;
    private Date               dateAcquisition;
    private String             fournisseur;
    private Double             prixUnitaire;
    private FournitureStatut   statut;
    private Date               createdAt;
}
