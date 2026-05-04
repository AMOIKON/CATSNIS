package com.catsnis.dno.dto;

import com.catsnis.dno.entity.Archive.TypeArchive;
import com.catsnis.dno.entity.Archive.CategorieArchive;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ArchiveResponse {
    private Long             id;
    private String           titre;
    private TypeArchive      type;
    private CategorieArchive categorie;
    private String           fileName;
    private Long             fileSize;
    private String           mimeType;
    private String           description;
    private String           archivedBy;
    private LocalDateTime    archivedAt;
    private Long             relatedId;
    private String           relatedCode;
    private String           downloadUrl;
}