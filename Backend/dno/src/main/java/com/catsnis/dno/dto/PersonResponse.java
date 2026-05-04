package com.catsnis.dno.dto;
import com.catsnis.dno.entity.Role;
import lombok.*;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PersonResponse {
    private Integer id;
    private String  firstName;
    private String  lastName;
    private String  email;
    private String  contact;
    private Role    role;
    private String  postName;
    private String  unitsName;
    private String  partnerName;
}