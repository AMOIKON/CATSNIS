package com.catsnis.dno.service;

import com.catsnis.dno.dto.PersonRequest;
import com.catsnis.dno.dto.PersonResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PersonService {

    PersonResponse               getPersonById(Integer id);

    List<PersonResponse>         getAllList();

    Page<PersonResponse>         getAllPersons(Pageable pageable,
                                               Integer postId,
                                               Integer unitsId,
                                               String  keyword);

    PersonResponse               savePerson(PersonRequest request);

    PersonResponse               updatePerson(Integer id, PersonRequest request);

    void                         deletePerson(Integer id);

    // ── Signature numérique personnelle ─────────────────────────────────────
    com.catsnis.dno.dto.SignatureResponse getSignature(Integer personId);

    void                         updateSignature(Integer personId, com.catsnis.dno.dto.SignatureRequest request);
}