package com.catsnis.dno.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor


public class AcquisitionRequest {
    private String image;
    private String tag;
    private Date dateAcq;
    private Integer quantity;
    private String serial;
    private Integer typesId;
    private Integer partnerId;
}
