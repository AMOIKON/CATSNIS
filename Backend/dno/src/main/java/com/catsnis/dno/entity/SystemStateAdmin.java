package com.catsnis.dno.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * NOUVEAU (27/08/2026) — etat global de l'application (verrouillage
 * administratif, ex: en cas de litige de paiement). Une seule ligne
 * en base (id fixe = 1), lue/mise a jour par SystemStateService.
 *
 * Quand locked = true, SystemLockFilter bloque toute requete pour tout
 * le monde SAUF le role SUPER_ADMIN (voir SecurityConfig pour les routes
 * explicitement exemptees : login, consultation du statut).
 */
@Entity
@Table(name = "system_state_admin")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemStateAdmin {

    @Id
    private Integer id; // toujours 1 — ligne unique

    @Builder.Default
    @Column(nullable = false)
    private boolean locked = false;

    @Column(columnDefinition = "TEXT")
    private String reason;

    private LocalDateTime lockedAt;

    @Column(name = "locked_by_person_id")
    private Integer lockedByPersonId;

    private LocalDateTime unlockedAt;

    @Column(name = "unlocked_by_person_id")
    private Integer unlockedByPersonId;
}