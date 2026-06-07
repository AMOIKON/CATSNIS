// src/main/java/com/catsnis/dno/controller/NotificationController.java
package com.catsnis.dno.controller;

import com.catsnis.dno.entity.UserNotification;
import com.catsnis.dno.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationService notificationService;

    // ── Liste paginée ─────────────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<Page<UserNotification>> getAll(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(
                notificationService.getForUser(userId, PageRequest.of(page, size)));
    }

    // ── Compteur non lus ─────────────────────────────────────────────────────
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(
            @RequestParam Long userId) {
        return ResponseEntity.ok(
                Map.of("count", notificationService.countUnread(userId)));
    }

    // ── Polling — nouvelles depuis un timestamp ───────────────────────────────
    @GetMapping("/since")
    public ResponseEntity<List<UserNotification>> since(
            @RequestParam Long userId,
            @RequestParam String timestamp) {           // ISO-8601
        LocalDateTime since = LocalDateTime.parse(timestamp);
        return ResponseEntity.ok(
                notificationService.getSince(userId, since));
    }

    // ── Marquer une notification comme lue ────────────────────────────────────
    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable Long id) {
        notificationService.markRead(id);
        return ResponseEntity.noContent().build();
    }

    // ── Marquer tout comme lu ─────────────────────────────────────────────────
    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Integer>> markAllRead(
            @RequestParam Long userId) {
        int updated = notificationService.markAllRead(userId);
        return ResponseEntity.ok(Map.of("updated", updated));
    }

    // ── Créer une notification (usage interne / admin) ────────────────────────
    @PostMapping
    public ResponseEntity<UserNotification> create(
            @RequestBody UserNotification notif) {
        return ResponseEntity.ok(notificationService.create(notif));
    }

    // ── Diffuser à tous (broadcast) ───────────────────────────────────────────
    @PostMapping("/broadcast")
    public ResponseEntity<UserNotification> broadcast(
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(notificationService.broadcast(
                body.get("title"),
                body.get("body"),
                body.getOrDefault("type", "SYSTEME")));
    }
}