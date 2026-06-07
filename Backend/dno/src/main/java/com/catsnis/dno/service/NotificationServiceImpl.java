// src/main/java/com/catsnis/dno/service/impl/NotificationServiceImpl.java
package com.catsnis.dno.service.impl;

import com.catsnis.dno.entity.UserNotification;
import com.catsnis.dno.repository.NotificationRepository;
import com.catsnis.dno.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository repo;

    @Override
    public Page<UserNotification> getForUser(Long userId, Pageable pageable) {
        return repo.findForUser(userId, pageable);
    }

    @Override
    public List<UserNotification> getSince(Long userId, LocalDateTime since) {
        return repo.findSince(userId, since);
    }

    @Override
    public long countUnread(Long userId) {
        return repo.countUnreadForUser(userId);
    }

    @Override
    @Transactional
    public void markRead(Long notifId) {
        repo.findById(notifId).ifPresent(n -> {
            n.setRead(true); // ✅ setRead() généré par Lombok pour champ 'read'
            repo.save(n);
        });
    }

    @Override
    @Transactional
    public int markAllRead(Long userId) {
        return repo.markAllRead(userId);
    }

    @Override
    public UserNotification create(UserNotification notif) {
        // ✅ read = false par défaut dans l'entité
        UserNotification saved = repo.save(notif);
        log.info("🔔 Notification : [{}] {} → userId={}",
                saved.getType(), saved.getTitle(), saved.getUserId());
        return saved;
    }

    @Override
    public UserNotification broadcast(String title, String body, String type) {
        return create(UserNotification.builder()
                .userId(null)
                .title(title)
                .body(body)
                .type(type)
                .build());
    }

    @Override
    public void notifyUser(Long userId, String title, String body,
                           String type, Long relatedId, String relatedCode) {
        create(UserNotification.builder()
                .userId(userId)
                .title(title)
                .body(body)
                .type(type)
                .relatedId(relatedId)
                .relatedCode(relatedCode)
                .build());
    }
}