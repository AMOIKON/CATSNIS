package com.catsnis.dno.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
@Data
public class DeploymentRequest {
    @NotBlank
    private String                    codeDep;
    @NotNull
    private LocalDateTime             dateRecep;
    private String                    comment;
    @NotNull
    private Integer                   regionId;
    @NotNull
    private Integer                   districtId;
    @NotNull
    private Integer                   healthId;
    private Integer                   appsId;
    private List<DeploymentItemRequest> items;
}