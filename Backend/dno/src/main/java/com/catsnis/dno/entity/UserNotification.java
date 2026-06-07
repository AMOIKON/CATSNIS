// src/main/java/com/catsnis/dno/entity/UserNotification.java
package com.catsnis.dno.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // null = broadcast à tous les utilisateurs
    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @Column(nullable = false)
    private String type;

    @Column(name = "related_id")
    private Long relatedId;

    @Column(name = "related_code")
    private String relatedCode;

    // ✅ Renommé isRead → read
    // Lombok génère isRead() pour boolean 'isRead' → conflit JPQL
    // Avec 'read', Lombok génère isRead() correctement sans conflit
    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}