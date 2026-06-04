-- ============================================================
-- SCRIPT CORRECTION ENCODAGE UTF-8 — CATUSNIS (v2)
-- ============================================================
-- Correction : suppression des colonnes hardcodées dans le
-- diagnostic. La procédure stockée détecte dynamiquement toutes
-- les colonnes texte via information_schema.
-- ============================================================

SET NAMES utf8mb4;
SET character_set_connection = utf8mb4;
SET character_set_results    = utf8mb4;

-- ============================================================
-- ÉTAPE 1 : DIAGNOSTIC DYNAMIQUE (sans colonnes hardcodées)
-- ============================================================

SELECT '========== TABLES ET COLONNES TEXTE DÉTECTÉES ==========' AS info;

-- Lister toutes les colonnes texte de la base
SELECT
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_SET_NAME
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND DATA_TYPE IN ('varchar','text','mediumtext','longtext','char')
ORDER BY TABLE_NAME, COLUMN_NAME;

-- ============================================================
-- ÉTAPE 2 : CORRECTION AUTOMATIQUE — procédure dynamique
-- ============================================================

SELECT '========== CORRECTION EN COURS ==========' AS info;

DROP PROCEDURE IF EXISTS fix_catusnis_encoding;

DELIMITER //
CREATE PROCEDURE fix_catusnis_encoding()
BEGIN
    DECLARE done       INT DEFAULT FALSE;
    DECLARE v_table    VARCHAR(255);
    DECLARE v_column   VARCHAR(255);
    DECLARE v_total    INT DEFAULT 0;

    -- Curseur sur toutes les colonnes texte de la base
    DECLARE cur CURSOR FOR
        SELECT TABLE_NAME, COLUMN_NAME
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND DATA_TYPE IN ('varchar','text','mediumtext','longtext','char')
        ORDER BY TABLE_NAME, COLUMN_NAME;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    -- ✅ Ignorer toutes les erreurs SQL (colonnes inconnues, vues, etc.)
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;

    OPEN cur;

    fix_loop: LOOP
        FETCH cur INTO v_table, v_column;
        IF done THEN LEAVE fix_loop; END IF;

        -- ── 1. Compter les lignes corrompues ────────────────────────────
        SET @n_affected = 0;
        SET @check_sql = CONCAT(
            'SELECT COUNT(*) INTO @n_affected ',
            'FROM `', v_table, '` ',
            "WHERE `", v_column, "` REGEXP 'Ã|Â|├'"
        );
        PREPARE check_stmt FROM @check_sql;
        EXECUTE check_stmt;
        DEALLOCATE PREPARE check_stmt;

        -- ── 2. Corriger si nécessaire ────────────────────────────────────
        IF @n_affected > 0 THEN
            SET @fix_sql = CONCAT(
                'UPDATE `', v_table, '` ',
                'SET `', v_column, '` = ',
                'CONVERT(BINARY CONVERT(`', v_column, '` USING latin1) USING utf8mb4) ',
                "WHERE `", v_column, "` REGEXP 'Ã|Â|├'"
            );
            PREPARE fix_stmt FROM @fix_sql;
            EXECUTE fix_stmt;
            DEALLOCATE PREPARE fix_stmt;

            SET v_total = v_total + @n_affected;

            SELECT CONCAT(
                '✅ ', v_table, '.', v_column,
                ' — ', @n_affected, ' ligne(s) corrigée(s)'
            ) AS correction_log;
        END IF;

    END LOOP;

    CLOSE cur;

    -- Résumé
    IF v_total = 0 THEN
        SELECT '✔️  Aucune donnée corrompue détectée.' AS resume_final;
    ELSE
        SELECT CONCAT(
            '🎉 TERMINÉ — ', v_total, ' ligne(s) corrigée(s) au total.'
        ) AS resume_final;
    END IF;

END //
DELIMITER ;

-- Lancer la correction
CALL fix_catusnis_encoding();

-- Nettoyer
DROP PROCEDURE IF EXISTS fix_catusnis_encoding;

-- ============================================================
-- ÉTAPE 3 : VÉRIFICATION — uniquement les colonnes confirmées
-- ============================================================

SELECT '========== VÉRIFICATION APRÈS CORRECTION ==========' AS info;

-- Régions
SELECT 'regions.region_name' AS colonne,
       COUNT(*) AS lignes_encore_corrompues
FROM regions
WHERE region_name REGEXP 'Ã|Â|├';

-- Districts
SELECT 'districts.district_name' AS colonne,
       COUNT(*) AS lignes_encore_corrompues
FROM districts
WHERE district_name REGEXP 'Ã|Â|├';

-- Sites de santé
SELECT 'health.health_name' AS colonne,
       COUNT(*) AS lignes_encore_corrompues
FROM health
WHERE health_name REGEXP 'Ã|Â|├';

-- Aperçu régions après correction
SELECT '── Régions corrigées ──' AS apercu;
SELECT id, region_name FROM regions ORDER BY id;

-- Aperçu 20 premiers sites de santé
SELECT '── Sites de santé (20 premiers) ──' AS apercu;
SELECT id, health_name FROM health ORDER BY id LIMIT 20;

-- ============================================================
-- ÉTAPE 4 : ALIGNER LE CHARSET DE LA BASE
-- ============================================================

SELECT '========== ALIGNEMENT CHARSET utf8mb4 ==========' AS info;

ALTER DATABASE catusnis_db
    CHARACTER SET = utf8mb4
    COLLATE       = utf8mb4_unicode_ci;

-- Lister les tables qui ne sont pas encore en utf8mb4
SELECT CONCAT(
    'ALTER TABLE `', TABLE_NAME, '` ',
    'CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;'
) AS tables_a_convertir
FROM information_schema.TABLES
WHERE TABLE_SCHEMA    = 'catusnis_db'
  AND TABLE_TYPE      = 'BASE TABLE'
  AND TABLE_COLLATION NOT LIKE 'utf8mb4%'
ORDER BY TABLE_NAME;

SELECT '========== SCRIPT TERMINÉ ==========' AS fin;
