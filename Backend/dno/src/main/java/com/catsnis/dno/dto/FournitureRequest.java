package com.catsnis.dno.dto;
import com.catsnis.dno.entity.Fourniture.FournitureCategorie;
import lombok.Data;
import java.util.Date;

@Data

public class FournitureRequest {
    private String             designation;
    private FournitureCategorie categorie;
    private Integer            quantite;
    private String             unite;
    private String             description;
    private Date               dateAcquisition;
    private String             fournisseur;
    private Double             prixUnitaire;
}
