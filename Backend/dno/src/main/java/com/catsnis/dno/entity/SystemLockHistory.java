package com.catsnis.dno.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * NOUVEAU (27/08/2026) — historique des verrouillages/deverrouillages de
 * l'application, pour garder une trace de qui a fait quoi et quand,
 * plutot que d'ecraser la raison a chaque nouveau verrouillage (comme le
 * faisait SystemStateAdmin seul jusqu'ici).
 */
@Entity
@Table(name = "system_lock_history")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemLockHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** LOCK ou UNLOCK */
    @Column(nullable = false, length = 10)
    private String action;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(nullable = false)
    private LocalDateTime occurredAt;

    @Column(name = "actor_person_id", nullable = false)
    private Integer actorPersonId;

    @Column(name = "actor_email", nullable = false)
    private String actorEmail;
}