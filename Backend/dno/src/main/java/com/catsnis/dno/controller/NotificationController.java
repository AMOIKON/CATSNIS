// src/main/java/com/catsnis/dno/controller/NotificationController.java
package com.catsnis.dno.controller;

import com.catsnis.dno.entity.UserNotification;
import com.catsnis.dno.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService service;

    // GET /api/notifications?userId=2&page=0&size=20
    @GetMapping
    public ResponseEntity<Page<UserNotification>> getAll(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(service.getForUser(
                userId,
                PageRequest.of(page, size,
                        Sort.by(Sort.Direction.DESC, "createdAt"))
        ));
    }

    // GET /api/notifications/since?userId=2&timestamp=2026-06-07T19:10:24.334
    @GetMapping("/since")
    public ResponseEntity<List<UserNotification>> since(
            @RequestParam Long userId,
            @RequestParam String timestamp) {
        try {
            // ✅ Gérer les microsecondes de Dart (ex: 2026-06-07T19:10:24.334123)
            String clean = timestamp.length() > 26
                    ? timestamp.substring(0, 26)
                    : timestamp;
            LocalDateTime since = LocalDateTime.parse(clean);
            return ResponseEntity.ok(service.getSince(userId, since));
        } catch (Exception e) {
            // Timestamp invalide → retourner liste vide
            return ResponseEntity.ok(List.of());
        }
    }

    // GET /api/notifications/unread-count?userId=2
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(
            @RequestParam Long userId) {
        return ResponseEntity.ok(
                Map.of("count", service.countUnread(userId))
        );
    }

    // PUT /api/notifications/{id}/read
    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable Long id) {
        service.markRead(id);
        return ResponseEntity.ok().build();
    }

    // PUT /api/notifications/read-all?userId=2
    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Integer>> markAllRead(
            @RequestParam Long userId) {
        int count = service.markAllRead(userId);
        return ResponseEntity.ok(Map.of("updated", count));
    }
}