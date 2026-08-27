package com.catsnis.dno.service;

import com.catsnis.dno.entity.Person;
import com.catsnis.dno.entity.SystemLockHistory;
import com.catsnis.dno.entity.SystemStateAdmin;
import com.catsnis.dno.repository.SystemLockHistoryRepository;
import com.catsnis.dno.repository.SystemStateAdminRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

/**
 * NOUVEAU (27/08/2026) — gere le verrouillage/deverrouillage global de
 * l'application. L'etat est mis en cache en memoire (AtomicReference) pour
 * que SystemLockFilter, appele a CHAQUE requete, n'ait pas besoin de taper
 * la base a chaque fois — seul un lock()/unlock() rafraichit le cache.
 *
 * ✅ MODIFIÉ (27/08/2026) — chaque lock()/unlock() enregistre desormais un
 * evenement dans system_lock_history (voir SystemLockHistory), au lieu de
 * seulement ecraser la raison courante dans system_state_admin. Permet de
 * consulter qui a verrouille/deverrouille, quand, et pourquoi, meme apres
 * plusieurs cycles.
 */
@Service
@RequiredArgsConstructor
public class SystemStateAdminService {

    private static final Integer SINGLETON_ID = 1;

    private final SystemStateAdminRepository repository;
    private final SystemLockHistoryRepository historyRepository;

    private final AtomicReference<Boolean> lockedCache = new AtomicReference<>(false);

    @PostConstruct
    public void init() {
        SystemStateAdmin state = repository.findById(SINGLETON_ID).orElseGet(this::createDefault);
        lockedCache.set(state.isLocked());
    }

    private SystemStateAdmin createDefault() {
        SystemStateAdmin state = SystemStateAdmin.builder()
                .id(SINGLETON_ID)
                .locked(false)
                .build();
        return repository.save(state);
    }

    /** Lu par SystemLockFilter a chaque requete — doit rester tres rapide. */
    public boolean isLocked() {
        return Boolean.TRUE.equals(lockedCache.get());
    }

    public SystemStateAdmin getState() {
        return repository.findById(SINGLETON_ID).orElseGet(this::createDefault);
    }

    public SystemStateAdmin lock(String reason, Person admin) {
        SystemStateAdmin state = getState();
        state.setLocked(true);
        state.setReason(reason);
        state.setLockedAt(LocalDateTime.now());
        state.setLockedByPersonId(admin != null ? admin.getId() : null);
        SystemStateAdmin saved = repository.save(state);
        lockedCache.set(true);

        recordHistory("LOCK", reason, admin);

        return saved;
    }

    public SystemStateAdmin unlock(String observation, Person admin) {
        SystemStateAdmin state = getState();
        state.setLocked(false);
        state.setUnlockedAt(LocalDateTime.now());
        state.setUnlockedByPersonId(admin != null ? admin.getId() : null);
        SystemStateAdmin saved = repository.save(state);
        lockedCache.set(false);

        recordHistory("UNLOCK", observation, admin);

        return saved;
    }

    /** NOUVEAU — historique complet, du plus recent au plus ancien. */
    public List<SystemLockHistory> getHistory() {
        return historyRepository.findAllByOrderByOccurredAtDesc();
    }

    private void recordHistory(String action, String reason, Person admin) {
        SystemLockHistory event = SystemLockHistory.builder()
                .action(action)
                .reason(reason)
                .occurredAt(LocalDateTime.now())
                .actorPersonId(admin != null ? admin.getId() : null)
                .actorEmail(admin != null ? admin.getEmail() : "inconnu")
                .build();
        historyRepository.save(event);
    }
}