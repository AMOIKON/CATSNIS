package com.catsnis.dno.repository;

import com.catsnis.dno.entity.Person;
import com.catsnis.dno.entity.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PersonRepository extends JpaRepository<Person, Integer> {

    // ── Auth ──────────────────────────────────────────────────────────────────
    @Query("SELECT p FROM Person p " +
            "LEFT JOIN FETCH p.post " +
            "LEFT JOIN FETCH p.units " +
            "LEFT JOIN FETCH p.partner " +
            "WHERE p.email = :email")
    Optional<Person> findByEmail(@Param("email") String email);

    boolean existsByEmail(String email);

    // ── Liste paginée avec filtres ────────────────────────────────────────────
    @Query(value = "SELECT p FROM Person p " +
            "LEFT JOIN FETCH p.post " +
            "LEFT JOIN FETCH p.units " +
            "LEFT JOIN FETCH p.partner " +
            "WHERE " +
            "(:postId IS NULL OR p.post.id = :postId) AND " +
            "(:unitsId IS NULL OR p.units.id = :unitsId) AND " +
            "(:keyword IS NULL OR LOWER(p.firstName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(p.lastName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(p.email) LIKE LOWER(CONCAT('%', :keyword, '%')))",
            countQuery = "SELECT COUNT(p) FROM Person p " +
                    "WHERE " +
                    "(:postId IS NULL OR p.post.id = :postId) AND " +
                    "(:unitsId IS NULL OR p.units.id = :unitsId) AND " +
                    "(:keyword IS NULL OR LOWER(p.firstName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
                    "OR LOWER(p.lastName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
                    "OR LOWER(p.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Person> findAllWithFilters(Pageable pageable,
                                    @Param("postId")  Integer postId,
                                    @Param("unitsId") Integer unitsId,
                                    @Param("keyword") String  keyword);

    // ── Dashboard ✅ ajouté ───────────────────────────────────────────────────
    long countByRole(Role role);

    @Query("SELECT p.role, COUNT(p) FROM Person p GROUP BY p.role")
    List<Object[]> countGroupByRole();
}