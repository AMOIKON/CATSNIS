package com.catsnis.dno.dto;
import com.catsnis.dno.entity.Role;
import lombok.Data;
@Data
public class PersonRequest {
    private String  firstName;
    private String  lastName;
    private String  email;
    private String  contact;
    private Role    role;
    private Integer postId;
    private Integer unitsId;
    private Integer partnerId;
    private String  plainPassword;
}