// src/main/java/com/catsnis/dno/repository/NotificationRepository.java
package com.catsnis.dno.repository;

import com.catsnis.dno.entity.UserNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<UserNotification, Long> {

    @Query("""
        SELECT n FROM UserNotification n
        WHERE (n.userId = :userId OR n.userId IS NULL)
        ORDER BY n.createdAt DESC
        """)
    Page<UserNotification> findForUser(@Param("userId") Long userId, Pageable pageable);

    // ✅ n.read (pas n.isRead)
    @Query("""
        SELECT n FROM UserNotification n
        WHERE (n.userId = :userId OR n.userId IS NULL)
          AND n.read = false
        ORDER BY n.createdAt DESC
        """)
    List<UserNotification> findUnreadForUser(@Param("userId") Long userId);

    // ✅ n.read (pas n.isRead)
    @Query("""
        SELECT COUNT(n) FROM UserNotification n
        WHERE (n.userId = :userId OR n.userId IS NULL)
          AND n.read = false
        """)
    long countUnreadForUser(@Param("userId") Long userId);

    @Query("""
        SELECT n FROM UserNotification n
        WHERE (n.userId = :userId OR n.userId IS NULL)
          AND n.createdAt > :since
        ORDER BY n.createdAt DESC
        """)
    List<UserNotification> findSince(
            @Param("userId") Long userId,
            @Param("since")  LocalDateTime since);

    // ✅ n.read (pas n.isRead)
    @Modifying
    @Query("""
        UPDATE UserNotification n
        SET n.read = true
        WHERE (n.userId = :userId OR n.userId IS NULL)
          AND n.read = false
        """)
    int markAllRead(@Param("userId") Long userId);
}