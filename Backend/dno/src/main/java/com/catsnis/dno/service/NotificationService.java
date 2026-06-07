// src/main/java/com/catsnis/dno/service/NotificationService.java
package com.catsnis.dno.service;

import com.catsnis.dno.entity.UserNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

public interface NotificationService {
    Page<UserNotification> getForUser(Long userId, Pageable pageable);
    List<UserNotification>  getSince(Long userId, LocalDateTime since);
    long                    countUnread(Long userId);
    void                    markRead(Long notifId);
    int                     markAllRead(Long userId);
    UserNotification        create(UserNotification notif);
    UserNotification        broadcast(String title, String body, String type);
    void                    notifyUser(Long userId, String title, String body,
                                       String type, Long relatedId, String relatedCode);
}