package com.catsnis.dno.controller;

import com.catsnis.dno.common.response.ApiResponse;
import com.catsnis.dno.config.RolePermissions;
import com.catsnis.dno.dto.AuthResponse;
import com.catsnis.dno.dto.LoginRequest;
import com.catsnis.dno.dto.RegisterRequest;
import com.catsnis.dno.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // ── Connexion — public ────────────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Connexion réussie", authService.login(request)));
    }

    // ── Création de compte — SUPER_ADMIN uniquement ───────────────────────────
    @PostMapping("/register")
    @PreAuthorize(RolePermissions.CREATE_ACCOUNT)
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Compte créé avec succès",
                        authService.register(request)));
    }
}