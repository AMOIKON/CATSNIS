package com.catsnis.dno.dto;

import com.catsnis.dno.entity.Archive.TypeArchive;
import com.catsnis.dno.entity.Archive.CategorieArchive;
import lombok.Data;

/**
 * DTO dédié aux mises à jour d'archives.
 * Pas de @NotNull / @NotBlank → champs optionnels pour permettre
 * la modification partielle sans déclencher d'erreur 400/500.
 */
@Data
public class ArchiveUpdateRequest {
    private String           titre;
    private CategorieArchive categorie;
    private String           description;
    private String           relatedCode;
    private Long             relatedId;
    // type non modifiable via update (IMPRIME/SCANNE fixé à la création)
    // archivedBy non modifiable via update
}