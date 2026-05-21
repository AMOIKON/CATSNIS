package com.catsnis.dno.service;

import com.catsnis.dno.dto.AuthResponse;
import com.catsnis.dno.dto.LoginRequest;
import com.catsnis.dno.dto.RegisterRequest;
import com.catsnis.dno.entity.*;
import com.catsnis.dno.repository.*;
import com.catsnis.dno.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final PersonRepository      personRepository;
    private final PasswordEncoder       passwordEncoder;
    private final JwtService            jwtService;
    private final AuthenticationManager authenticationManager;
    // ✅ Repositories pour résoudre post, units, partner
    private final PostRepository        postRepository;
    private final UnitsRepository       unitsRepository;
    private final PartnerRepository     partnerRepository;

    // ── Login ─────────────────────────────────────────────────────────────────

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(), request.getPassword()));
        Person person = personRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Utilisateur introuvable : " + request.getEmail()));
        return buildResponse(
                person,
                jwtService.generateToken(person),
                jwtService.generateRefreshToken(person));
    }

    // ── Register ──────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (personRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException(
                    "Cet email est déjà utilisé : " + request.getEmail());
        }

        // ✅ Résoudre post, units, partner depuis les IDs de la requête
        Post    post    = null;
        Units   units   = null;
        Partner partner = null;

        if (request.getPostId() != null && request.getPostId() > 0) {
            post = postRepository.findById(request.getPostId()).orElse(null);
        }
        if (request.getUnitsId() != null && request.getUnitsId() > 0) {
            units = unitsRepository.findById(request.getUnitsId()).orElse(null);
        }
        if (request.getPartnerId() != null && request.getPartnerId() > 0) {
            partner = partnerRepository.findById(request.getPartnerId()).orElse(null);
        }

        Person person = Person.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole() != null
                        ? Role.valueOf(request.getRole()) : Role.USER)
                .contact(request.getContact())
                .post(post)
                .units(units)
                .partner(partner)
                .build();

        personRepository.save(person);

        return buildResponse(
                person,
                jwtService.generateToken(person),
                jwtService.generateRefreshToken(person));
    }

    // ── Refresh token ─────────────────────────────────────────────────────────

    public AuthResponse refreshToken(String refreshToken) {
        String email = jwtService.extractUsername(refreshToken);
        Person person = personRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Utilisateur introuvable : " + email));
        if (!jwtService.isTokenValid(refreshToken, person))
            throw new RuntimeException("Refresh token invalide ou expiré");
        return buildResponse(person, jwtService.generateToken(person), refreshToken);
    }

    // ── Builder réponse ───────────────────────────────────────────────────────

    private AuthResponse buildResponse(
            Person person, String accessToken, String refreshToken) {

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getExpiration())
                .id(person.getId() != null ? person.getId().longValue() : null)
                .firstName(person.getFirstName())
                .lastName(person.getLastName())
                .email(person.getEmail())
                .role(person.getRole() != null ? person.getRole().name() : null)
                .postName(person.getPost()    != null
                        ? person.getPost().getPostName()   : null)
                .unitsName(person.getUnits()  != null
                        ? person.getUnits().getUnitName()  : null)
                // ✅ partnerName et partnerId retournés au frontend
                .partnerName(person.getPartner() != null
                        ? person.getPartner().getPartnerName() : null)
                .partnerId(person.getPartner() != null
                        ? person.getPartner().getId() : null)
                .build();
    }
}