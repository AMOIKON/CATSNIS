package com.catsnis.dno.dto;

import lombok.Data;

@Data

public class BookletQuickCreateRequest {
    private String  lastName;
    private String  firstName;
    private String  contact;
    private Integer regionId;
    private Integer districtId;
}
