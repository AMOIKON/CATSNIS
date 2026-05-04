package com.catsnis.dno.dto;
import lombok.*;
import java.util.Date;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AcquisitionResponse {
    private Long    id;
    private String  tag;
    private String  serial;
    private Integer quantity;
    private String  status;
    private String  image;
    private boolean deployed;
    private Date    dateAcq;
    private String  Type;
}