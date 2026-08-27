package com.catsnis.dno.repository;

import com.catsnis.dno.entity.SystemLockHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SystemLockHistoryRepository extends JpaRepository<SystemLockHistory, Long> {

    List<SystemLockHistory> findAllByOrderByOccurredAtDesc();
}