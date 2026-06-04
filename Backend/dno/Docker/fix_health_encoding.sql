-- ============================================================
-- DIAGNOSTIC ET CORRECTION CIBLÉE — health.health_name
-- ============================================================
-- Ce script cible uniquement la table health (et health_sites)
-- qui n'ont pas été corrigées par le premier passage.
-- ============================================================

SET NAMES utf8mb4;
SET character_set_connection = utf8mb4;
SET character_set_results    = utf8mb4;

-- ============================================================
-- ÉTAPE 1 : DIAGNOSTIC HEX — voir les bytes réels stockés
-- ============================================================

SELECT '========== DIAGNOSTIC HEX (10 lignes corrompues) ==========' AS info;

-- Affiche les bytes réels pour comprendre le type de corruption
SELECT
    id,
    health_name,
    HEX(health_name)          AS hex_brut,
    LENGTH(health_name)       AS nb_bytes,
    CHAR_LENGTH(health_name)  AS nb_chars
FROM health
WHERE health_name REGEXP 'Ã|Â|├'
LIMIT 10;

-- Même diagnostic sur health_sites
SELECT
    id,
    health_name,
    HEX(health_name)          AS hex_brut,
    LENGTH(health_name)       AS nb_bytes,
    CHAR_LENGTH(health_name)  AS nb_chars
FROM health_sites
WHERE health_name REGEXP 'Ã|Â|├'
LIMIT 10;

-- ============================================================
-- ÉTAPE 2 : TEST SUR UNE SEULE LIGNE AVANT MASSE
-- ============================================================

SELECT '========== TEST SUR UNE LIGNE ==========' AS info;

-- Voir le résultat du CONVERT sur la première ligne corrompue
SELECT
    id,
    health_name                                                      AS avant,
    CONVERT(BINARY CONVERT(health_name USING latin1) USING utf8mb4) AS apres,
    HEX(health_name)                                                 AS hex_avant,
    HEX(CONVERT(BINARY CONVERT(health_name USING latin1) USING utf8mb4)) AS hex_apres
FROM health
WHERE health_name REGEXP 'Ã|Â|├'
LIMIT 1;

-- ============================================================
-- ÉTAPE 3 : CORRECTION DIRECTE (sans procédure stockée)
-- On utilise ROW_COUNT() pour voir les vraies lignes modifiées
-- ============================================================

SELECT '========== CORRECTION health.health_name ==========' AS info;

-- Compte avant
SELECT COUNT(*) AS avant_correction FROM health WHERE health_name REGEXP 'Ã|Â|├';

-- UPDATE direct — pas de stored procedure pour voir les vraies erreurs
UPDATE health
SET health_name = CONVERT(BINARY CONVERT(health_name USING latin1) USING utf8mb4)
WHERE health_name REGEXP 'Ã|Â|├';

-- Lignes réellement modifiées
SELECT ROW_COUNT() AS lignes_reellement_modifiees;

-- Compte après
SELECT COUNT(*) AS apres_correction FROM health WHERE health_name REGEXP 'Ã|Â|├';

-- ── health_sites ────────────────────────────────────────────────────────

SELECT '========== CORRECTION health_sites.health_name ==========' AS info;

SELECT COUNT(*) AS avant_correction FROM health_sites WHERE health_name REGEXP 'Ã|Â|├';

UPDATE health_sites
SET health_name = CONVERT(BINARY CONVERT(health_name USING latin1) USING utf8mb4)
WHERE health_name REGEXP 'Ã|Â|├';

SELECT ROW_COUNT() AS lignes_reellement_modifiees;
SELECT COUNT(*) AS apres_correction FROM health_sites WHERE health_name REGEXP 'Ã|Â|├';

-- ============================================================
-- ÉTAPE 4 : SI TOUJOURS CORROMPU — tentative double CONVERT
-- (pour les cas de double encodage)
-- ============================================================

SELECT '========== DOUBLE CONVERT (si encore corrompu) ==========' AS info;

-- Vérifier s'il reste des lignes corrompues
SELECT COUNT(*) AS encore_corrompu FROM health WHERE health_name REGEXP 'Ã|Â|├';

-- Si le premier CONVERT n'a pas suffi, appliquer une 2e fois
UPDATE health
SET health_name = CONVERT(BINARY CONVERT(health_name USING latin1) USING utf8mb4)
WHERE health_name REGEXP 'Ã|Â|├';

SELECT ROW_COUNT() AS lignes_2eme_passage;
SELECT COUNT(*) AS apres_double_convert FROM health WHERE health_name REGEXP 'Ã|Â|├';

-- ============================================================
-- ÉTAPE 5 : VÉRIFICATION FINALE
-- ============================================================

SELECT '========== VÉRIFICATION FINALE ==========' AS info;

SELECT 'health'      AS table_name, COUNT(*) AS corrompus_restants FROM health      WHERE health_name REGEXP 'Ã|Â|├'
UNION ALL
SELECT 'health_sites',              COUNT(*)                        FROM health_sites WHERE health_name REGEXP 'Ã|Â|├';

-- Aperçu des 20 premiers sites après correction
SELECT id, health_name FROM health ORDER BY id LIMIT 20;

SELECT '========== FIN ==========' AS fin;
