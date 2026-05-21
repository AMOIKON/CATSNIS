package com.catsnis.dno.service;

import com.catsnis.dno.common.exception.ResourceNotFoundException;
import com.catsnis.dno.common.utils.SecurityUtils;
import com.catsnis.dno.dto.PersonRequest;
import com.catsnis.dno.dto.PersonResponse;
import com.catsnis.dno.entity.*;
import com.catsnis.dno.repository.PartnerRepository;
import com.catsnis.dno.repository.PersonRepository;
import com.catsnis.dno.repository.PostRepository;
import com.catsnis.dno.repository.UnitsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PersonServiceImpl implements PersonService {

    private final PersonRepository  personRepository;
    private final PostRepository    postRepository;
    private final UnitsRepository   unitsRepository;
    private final PartnerRepository partnerRepository;
    private final PasswordEncoder   passwordEncoder;
    private final SecurityUtils     securityUtils;

    // ── Mot de passe par défaut à la création ──────────────────────────────────
    private static final String DEFAULT_PASSWORD = "Changeme123!";

    @Override
    @Transactional(readOnly = true)
    public PersonResponse getPersonById(Integer id) {
        return mapToResponse(personRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Personne non trouvée avec l'id : " + id)));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PersonResponse> getAllList() {
        return personRepository.findAll()
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PersonResponse> getAllPersons(
            Pageable pageable, Integer postId,
            Integer unitsId, String keyword) {
        return personRepository
                .findAllWithFilters(pageable, postId, unitsId, keyword)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public PersonResponse savePerson(PersonRequest request) {
        Post  post  = postRepository.findById(request.getPostId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Post non trouvé : " + request.getPostId()));
        Units units = unitsRepository.findById(request.getUnitsId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Unité non trouvée : " + request.getUnitsId()));

        // ✅ Utiliser le mot de passe fourni ou le mot de passe par défaut
        String rawPassword = (request.getPlainPassword() != null
                && !request.getPlainPassword().isBlank())
                ? request.getPlainPassword()
                : DEFAULT_PASSWORD;

        Person person = Person.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .contact(request.getContact())
                .password(passwordEncoder.encode(rawPassword))
                .plainPassword(rawPassword)      // ✅ Stocker en clair
                .role(request.getRole() != null ? request.getRole() : Role.USER)
                .post(post)
                .units(units)
                .partner(resolvePartner(request.getPartnerId()))
                .build();

        return mapToResponse(personRepository.save(person));
    }

    @Override
    @Transactional
    public PersonResponse updatePerson(Integer id, PersonRequest request) {
        Person person = personRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Personne non trouvée : " + id));

        Post  post  = postRepository.findById(request.getPostId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Post non trouvé : " + request.getPostId()));
        Units units = unitsRepository.findById(request.getUnitsId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Unité non trouvée : " + request.getUnitsId()));

        person.setFirstName(request.getFirstName());
        person.setLastName(request.getLastName());
        person.setEmail(request.getEmail());
        person.setContact(request.getContact());
        person.setPost(post);
        person.setUnits(units);
        person.setPartner(resolvePartner(request.getPartnerId()));
        if (request.getRole() != null) person.setRole(request.getRole());

        // ✅ Mettre à jour le mot de passe seulement si un nouveau est fourni
        if (request.getPlainPassword() != null && !request.getPlainPassword().isBlank()) {
            person.setPassword(passwordEncoder.encode(request.getPlainPassword()));
            person.setPlainPassword(request.getPlainPassword());
        }

        return mapToResponse(personRepository.save(person));
    }

    @Override
    @Transactional
    public void deletePerson(Integer id) {
        Person person = personRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Personne non trouvée : " + id));
        personRepository.delete(person);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private Partner resolvePartner(Integer id) {
        if (id == null) return null;
        return partnerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Partenaire introuvable : " + id));
    }

    private boolean currentUserIsSuperAdmin() {
        try {
            return securityUtils.getCurrentUser()
                    .map(u -> u.getRole() == Role.SUPER_ADMIN)
                    .orElse(false);
        } catch (Exception e) {
            return false;
        }
    }

    // ── Mapper ────────────────────────────────────────────────────────────────
    private PersonResponse mapToResponse(Person person) {
        boolean isSuperAdmin = currentUserIsSuperAdmin();
        return PersonResponse.builder()
                .id(person.getId())
                .firstName(person.getFirstName())
                .lastName(person.getLastName())
                .email(person.getEmail())
                .contact(person.getContact())
                .role(person.getRole())
                .postName(person.getPost()       != null
                        ? person.getPost().getPostName()       : null)
                .unitsName(person.getUnits()     != null
                        ? person.getUnits().getUnitName()      : null)
                .partnerName(person.getPartner() != null
                        ? person.getPartner().getPartnerName() : null)
                // ✅ Mot de passe en clair — SUPER_ADMIN uniquement
                .password(isSuperAdmin ? person.getPlainPassword() : null)
                .build();
    }
}