-- ============================================================
-- CORRECTION CP850 — health.health_name + health_sites
-- ============================================================
-- Cause identifiée via HEX :
--   "é" (UTF-8: C3 A9) lu en CP850 → "├®" → stocké: E2949C + C2AE
--   "É" (UTF-8: C3 89) lu en CP850 → "├ë" → stocké: E2949C + C3AB
--   "è" (UTF-8: C3 A8) lu en CP850 → "├¿" → stocké: E2949C + C2BF
--   "Û" (UTF-8: C3 9B) lu en CP850 → "├ø" → stocké: E2949C + C3B8
--
-- Latin1 retournait NULL car U+251C (├) est hors Latin-1.
-- CP850 connaît ├ = byte 0xC3 → reconstruire l'original UTF-8.
-- ============================================================

SET NAMES utf8mb4;
SET character_set_connection = utf8mb4;

-- ── Vérifier que MySQL supporte cp850 ────────────────────────────────────
SELECT '== Support CP850 ==' AS info;
SHOW CHARACTER SET LIKE 'cp850';

-- ============================================================
-- DIAGNOSTICS AVANT CORRECTION
-- ============================================================
SELECT '== AVANT correction ==' AS info;

-- Détection par HEX (fiable, pas d'ambiguité d'encodage)
-- E2949C = bytes UTF-8 de "├" (U+251C) = signature du bug CP850
SELECT COUNT(*) AS health_corrompus      FROM health       WHERE HEX(health_name) LIKE '%E2949C%';
SELECT COUNT(*) AS health_sites_corrompus FROM health_sites WHERE HEX(health_name) LIKE '%E2949C%';

-- Aperçu avant (3 lignes)
SELECT id,
       health_name                                                           AS avant,
       CONVERT(BINARY CONVERT(health_name USING cp850) USING utf8mb4)       AS apres_prevu,
       HEX(health_name)                                                      AS hex_avant
FROM health
WHERE HEX(health_name) LIKE '%E2949C%'
LIMIT 5;

-- ============================================================
-- CORRECTION health
-- ============================================================
SELECT '== CORRECTION health ==' AS info;

UPDATE health
SET health_name = COALESCE(
    CONVERT(BINARY CONVERT(health_name USING cp850) USING utf8mb4),
    health_name   -- fallback si CONVERT retourne NULL
)
WHERE HEX(health_name) LIKE '%E2949C%';

SELECT ROW_COUNT() AS lignes_reellement_modifiees;

-- ============================================================
-- CORRECTION health_sites
-- ============================================================
SELECT '== CORRECTION health_sites ==' AS info;

UPDATE health_sites
SET health_name = COALESCE(
    CONVERT(BINARY CONVERT(health_name USING cp850) USING utf8mb4),
    health_name
)
WHERE HEX(health_name) LIKE '%E2949C%';

SELECT ROW_COUNT() AS lignes_reellement_modifiees;

-- ============================================================
-- VÉRIFICATION APRÈS
-- ============================================================
SELECT '== VÉRIFICATION APRÈS ==' AS info;

SELECT COUNT(*) AS health_encore_corrompus      FROM health       WHERE HEX(health_name) LIKE '%E2949C%';
SELECT COUNT(*) AS health_sites_encore_corrompus FROM health_sites WHERE HEX(health_name) LIKE '%E2949C%';

-- Aperçu des lignes qui étaient corrompues
SELECT id, health_name FROM health  WHERE id IN (3, 18, 21, 27, 51, 53, 54, 64, 74, 87) ORDER BY id;

-- ============================================================
-- CHERCHER D'AUTRES TABLES AVEC CE PATTERN (sécurité)
-- ============================================================
SELECT '== AUTRES TABLES AVEC PATTERN E2949C ==' AS info;

SELECT TABLE_NAME, COLUMN_NAME
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND DATA_TYPE IN ('varchar','text','mediumtext','longtext')
ORDER BY TABLE_NAME, COLUMN_NAME
LIMIT 0;

-- Vérif manuelle sur tables clés
SELECT 'districts'   AS tbl, COUNT(*) AS n FROM districts     WHERE HEX(district_name) LIKE '%E2949C%'
UNION ALL
SELECT 'regions',              COUNT(*)     FROM regions       WHERE HEX(region_name)   LIKE '%E2949C%'
UNION ALL
SELECT 'partners',             COUNT(*)     FROM partners      WHERE HEX(partner_name)  LIKE '%E2949C%'
UNION ALL
SELECT 'acquisitions',         COUNT(*)     FROM acquisitions  WHERE HEX(tag)           LIKE '%E2949C%'
UNION ALL
SELECT 'persons.first_name',   COUNT(*)     FROM persons       WHERE HEX(first_name)    LIKE '%E2949C%'
UNION ALL
SELECT 'persons.last_name',    COUNT(*)     FROM persons       WHERE HEX(last_name)     LIKE '%E2949C%';

SELECT '== FIN ==' AS fin;
