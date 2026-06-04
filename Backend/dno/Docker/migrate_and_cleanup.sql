-- ============================================================
-- MIGRATION + NETTOYAGE TABLES ORPHELINES — CATUSNIS
-- ============================================================
-- Ordre d'exécution sécurisé :
--   1. Vérifier structures des tables
--   2. Corriger encodage dans les orphelines
--   3. Migrer les données vers tables Hibernate
--   4. Vérifier les migrations
--   5. DROP les tables orphelines
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0; -- désactiver FK temporairement pour les DROP

-- ============================================================
-- ÉTAPE 0 : STRUCTURE DES TABLES (pour valider les colonnes)
-- ============================================================
SELECT '=== ÉTAPE 0 : STRUCTURES ===' AS info;

DESCRIBE person;
DESCRIBE persons;
DESCRIBE post;
DESCRIBE posts;
DESCRIBE booklet;
DESCRIBE booklets;
DESCRIBE evaluation;
DESCRIBE evaluations;
DESCRIBE technician_site;
DESCRIBE technician_sites;

-- ============================================================
-- ÉTAPE 1 : CORRECTION ENCODAGE CP850 dans les tables orphelines
-- ============================================================
SELECT '=== ÉTAPE 1 : FIX ENCODAGE ORPHELINES ===' AS info;

-- ── post.post_name (Médecin-chef, Directeur régional, etc.) ──────────────────
SELECT COUNT(*) AS post_corrompus FROM post WHERE HEX(post_name) LIKE '%E2949C%';

UPDATE post
SET post_name = COALESCE(
    CONVERT(BINARY CONVERT(post_name USING cp850) USING utf8mb4),
    post_name
)
WHERE HEX(post_name) LIKE '%E2949C%';

SELECT ROW_COUNT() AS post_lignes_corrigees;

-- ── evaluation.evaluation_name (Très satisfaisant, etc.) ────────────────────
SELECT COUNT(*) AS eval_corrompues FROM evaluation WHERE HEX(evaluation_name) LIKE '%E2949C%';

UPDATE evaluation
SET evaluation_name = COALESCE(
    CONVERT(BINARY CONVERT(evaluation_name USING cp850) USING utf8mb4),
    evaluation_name
)
WHERE HEX(evaluation_name) LIKE '%E2949C%';

SELECT ROW_COUNT() AS eval_lignes_corrigees;

-- Vérification
SELECT id, post_name       FROM post       ORDER BY id;
SELECT id, evaluation_name FROM evaluation ORDER BY id;

-- ============================================================
-- ÉTAPE 2 : MIGRATIONS
-- ============================================================
SELECT '=== ÉTAPE 2 : MIGRATIONS ===' AS info;

-- ── 2.1 post → posts ─────────────────────────────────────────────────────────
SELECT '-- Migration post → posts --' AS section;
SELECT COUNT(*) AS avant_posts FROM posts;

INSERT IGNORE INTO posts (post_name)
SELECT post_name FROM post p
WHERE NOT EXISTS (
    SELECT 1 FROM posts ps
    WHERE LOWER(ps.post_name) = LOWER(p.post_name)
);

SELECT ROW_COUNT() AS posts_inseres;
SELECT COUNT(*) AS apres_posts FROM posts;
SELECT id, post_name FROM posts ORDER BY post_name;

-- ── 2.2 evaluation → evaluations ─────────────────────────────────────────────
-- evaluation.evaluation_name → evaluations.evl_name (colonnes différentes !)
SELECT '-- Migration evaluation → evaluations --' AS section;
SELECT COUNT(*) AS avant_evaluations FROM evaluations;

INSERT IGNORE INTO evaluations (evl_name)
SELECT evaluation_name FROM evaluation e
WHERE NOT EXISTS (
    SELECT 1 FROM evaluations ev
    WHERE LOWER(ev.evl_name) = LOWER(e.evaluation_name)
);

SELECT ROW_COUNT() AS evaluations_inserees;
SELECT COUNT(*) AS apres_evaluations FROM evaluations;
SELECT id, evl_name FROM evaluations ORDER BY evl_name;

-- ── 2.3 technician_site → technician_sites ───────────────────────────────────
SELECT '-- Migration technician_site → technician_sites --' AS section;
SELECT COUNT(*) AS avant_technician_sites FROM technician_sites;

INSERT IGNORE INTO technician_sites (health_id, person_id)
SELECT health_id, person_id FROM technician_site;

SELECT ROW_COUNT() AS technician_sites_inseres;
SELECT COUNT(*) AS apres_technician_sites FROM technician_sites;

-- ── 2.4 health_sites → health (13 lignes manquantes) ────────────────────────
SELECT '-- Migration health_sites → health (13 lignes uniques) --' AS section;
SELECT COUNT(*) AS avant_health FROM health;

INSERT IGNORE INTO health (health_name, district_id)
SELECT hs.health_name, hs.district_id
FROM health_sites hs
WHERE NOT EXISTS (
    SELECT 1 FROM health h
    WHERE h.health_name = hs.health_name
      AND h.district_id = hs.district_id
);

SELECT ROW_COUNT() AS health_inseres;
SELECT COUNT(*) AS apres_health FROM health;

-- ── 2.5 booklet → booklets (21 lignes toutes absentes) ───────────────────────
-- ⚠️ Vérification de structure d'abord : si les colonnes diffèrent,
--    adapter la requête ci-dessous
SELECT '-- Migration booklet → booklets --' AS section;
SELECT COUNT(*) AS avant_booklets FROM booklets;

INSERT IGNORE INTO booklets (first_name, last_name, email, contact)
SELECT first_name, last_name, email, contact
FROM booklet b
WHERE NOT EXISTS (
    SELECT 1 FROM booklets bk
    WHERE bk.email = b.email
);

SELECT ROW_COUNT() AS booklets_inseres;
SELECT COUNT(*) AS apres_booklets FROM booklets;

-- ── 2.6 person → persons (4 comptes manquants) ───────────────────────────────
-- ⚠️ Adapter les colonnes selon DESCRIBE person / persons de l'étape 0
SELECT '-- Migration person → persons --' AS section;
SELECT COUNT(*) AS avant_persons FROM persons;

-- Insérer les 4 comptes manquants (même structure que persons)
INSERT IGNORE INTO persons (first_name, last_name, email, password, contact, role)
SELECT first_name, last_name, email, password, contact, role
FROM person p
WHERE NOT EXISTS (
    SELECT 1 FROM persons ps WHERE ps.email = p.email
)
AND p.email != 'admin@catusnis.ci'; -- exclure doublons éventuels

SELECT ROW_COUNT() AS persons_inseres;
SELECT COUNT(*) AS apres_persons FROM persons;
SELECT id, first_name, last_name, email, role FROM persons ORDER BY id;

-- ============================================================
-- ÉTAPE 3 : VÉRIFICATION AVANT DROP
-- ============================================================
SELECT '=== ÉTAPE 3 : VÉRIFICATION AVANT DROP ===' AS info;

-- Confirmer que toutes les données sont migrées
SELECT 'post'            AS orpheline, COUNT(*) AS lignes_non_migrees
FROM post p WHERE NOT EXISTS (SELECT 1 FROM posts ps WHERE LOWER(ps.post_name) = LOWER(p.post_name))
UNION ALL
SELECT 'evaluation',               COUNT(*)
FROM evaluation e WHERE NOT EXISTS (SELECT 1 FROM evaluations ev WHERE LOWER(ev.evl_name) = LOWER(e.evaluation_name))
UNION ALL
SELECT 'technician_site',          COUNT(*)
FROM technician_site ts WHERE NOT EXISTS (SELECT 1 FROM technician_sites tss WHERE tss.health_id = ts.health_id AND tss.person_id = ts.person_id)
UNION ALL
SELECT 'health_sites',             COUNT(*)
FROM health_sites hs WHERE NOT EXISTS (SELECT 1 FROM health h WHERE h.health_name = hs.health_name AND h.district_id = hs.district_id)
UNION ALL
SELECT 'person',                   COUNT(*)
FROM person p WHERE NOT EXISTS (SELECT 1 FROM persons ps WHERE ps.email = p.email);

-- ============================================================
-- ÉTAPE 4 : DROP DES TABLES ORPHELINES
-- ============================================================
SELECT '=== ÉTAPE 4 : DROP TABLES ORPHELINES ===' AS info;

-- ── Groupe A : Tables vides — DROP immédiat ───────────────────────────────────
DROP TABLE IF EXISTS appreciation;
SELECT 'appreciation supprimée' AS log;

DROP TABLE IF EXISTS booklet_status;
SELECT 'booklet_status supprimée' AS log;

DROP TABLE IF EXISTS deployments;
SELECT 'deployments supprimée' AS log;

DROP TABLE IF EXISTS interventions;
SELECT 'interventions supprimée' AS log;

-- ── Groupe B : Tables migrées — DROP après vérification ──────────────────────
DROP TABLE IF EXISTS post;
SELECT 'post supprimée' AS log;

DROP TABLE IF EXISTS evaluation;
SELECT 'evaluation supprimée' AS log;

DROP TABLE IF EXISTS technician_site;
SELECT 'technician_site supprimée' AS log;

DROP TABLE IF EXISTS health_sites;
SELECT 'health_sites supprimée (336 KB libérés)' AS log;

DROP TABLE IF EXISTS booklet;
SELECT 'booklet supprimée' AS log;

DROP TABLE IF EXISTS person;
SELECT 'person supprimée' AS log;

-- ============================================================
-- ÉTAPE 5 : RÉSULTAT FINAL
-- ============================================================

SET FOREIGN_KEY_CHECKS = 1;

SELECT '=== RÉSULTAT FINAL ===' AS info;

SELECT
    TABLE_NAME,
    TABLE_ROWS                  AS lignes,
    ROUND(DATA_LENGTH/1024, 1)  AS taille_kb
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'catusnis_db'
  AND TABLE_TYPE   = 'BASE TABLE'
ORDER BY TABLE_NAME;

SELECT COUNT(*) AS total_tables_restantes
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'catusnis_db'
  AND TABLE_TYPE   = 'BASE TABLE';

SELECT '=== NETTOYAGE TERMINÉ ===' AS fin;
