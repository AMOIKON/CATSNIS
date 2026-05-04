package com.catsnis.dno.dto;

import com.catsnis.dno.entity.Archive.TypeArchive;
import com.catsnis.dno.entity.Archive.CategorieArchive;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ArchiveRequest {
    @NotBlank(message = "Le titre est obligatoire")
    private String           titre;
    @NotNull(message = "Le type est obligatoire")
    private TypeArchive      type;
    @NotNull(message = "La catégorie est obligatoire")
    private CategorieArchive categorie;
    private String           description;
    private String           archivedBy;
    private Long             relatedId;
    private String           relatedCode;
}