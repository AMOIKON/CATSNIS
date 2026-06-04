-- ============================================================
-- NETTOYAGE TABLES ORPHELINES — CATUSNIS
-- ============================================================
-- Résultat de l'analyse Hibernate vs MySQL :
--
-- Tables Hibernate actives (28) :
--   acquisitions, appreciations, apps, archives, booklets,
--   booklet_statuses, deployment, deployment_items, districts,
--   evaluations, fournitures, fourniture_deploiements, health,
--   images, intervention, partners, persons, posts, regions,
--   states, technician_sites, types, units, vehicules,
--   vehicule_affectations, vehicule_document_historiques,
--   vehicule_incidents, vehicule_maintenances
--
-- Tables orphelines identifiées (9) :
--   ┌─────────────────────┬────────┬─────────────────────────────┐
--   │ Table orpheline     │ Lignes │ Raison                      │
--   ├─────────────────────┼────────┼─────────────────────────────┤
--   │ appreciation        │   0    │ doublé par appreciations    │
--   │ booklet             │  21    │ doublé par booklets ⚠️      │
--   │ booklet_status      │   0    │ doublé par booklet_statuses │
--   │ deployments         │   0    │ doublé par deployment       │
--   │ evaluation          │   4    │ doublé par evaluations ⚠️   │
--   │ health_sites        │ 4608   │ doublé par health ⚠️⚠️      │
--   │ interventions       │   0    │ doublé par intervention     │
--   │ person              │   5    │ doublé par persons ⚠️       │
--   │ post                │  12    │ doublé par posts ⚠️         │
--   │ technician_site     │   6    │ doublé par technician_sites │
--   └─────────────────────┴────────┴─────────────────────────────┘
--
-- ⚠️ IMPORTANT : Exécuter ÉTAPE 1 (diagnostic) avant tout DROP
-- ============================================================

SET NAMES utf8mb4;

-- ============================================================
-- ÉTAPE 1 : DIAGNOSTIC — comparer structures et données
-- ============================================================

SELECT '=== ÉTAPE 1 : DIAGNOSTIC ===' AS info;

-- ── 1.1 health vs health_sites ───────────────────────────────────────────────
SELECT '-- health vs health_sites --' AS section;

SELECT 'health'      AS source, COUNT(*) AS total FROM health
UNION ALL
SELECT 'health_sites',           COUNT(*)          FROM health_sites;

-- Vérifie si health_sites est une copie exacte de health
SELECT COUNT(*) AS doublons_exacts
FROM health h
JOIN health_sites hs ON h.health_name = hs.health_name
                    AND h.district_id = hs.district_id;

-- Lignes dans health_sites absentes de health
SELECT COUNT(*) AS dans_sites_pas_dans_health
FROM health_sites hs
WHERE NOT EXISTS (
    SELECT 1 FROM health h
    WHERE h.health_name = hs.health_name
      AND h.district_id = hs.district_id
);

-- ── 1.2 booklet vs booklets ───────────────────────────────────────────────────
SELECT '-- booklet vs booklets --' AS section;
SELECT 'booklet'  AS source, COUNT(*) AS total FROM booklet
UNION ALL
SELECT 'booklets',             COUNT(*)          FROM booklets;

-- Lignes dans booklet absentes de booklets (à migrer)
SELECT COUNT(*) AS dans_booklet_pas_dans_booklets
FROM booklet b
WHERE NOT EXISTS (
    SELECT 1 FROM booklets bk
    WHERE bk.first_name = b.first_name
      AND bk.last_name  = b.last_name
      AND bk.email      = b.email
);

-- ── 1.3 person vs persons ─────────────────────────────────────────────────────
SELECT '-- person vs persons --' AS section;
SELECT 'person'  AS source, COUNT(*) AS total FROM person
UNION ALL
SELECT 'persons',             COUNT(*)          FROM persons;

-- Lignes dans person absentes de persons
SELECT COUNT(*) AS dans_person_pas_dans_persons
FROM person p
WHERE NOT EXISTS (
    SELECT 1 FROM persons ps
    WHERE ps.email = p.email
);

-- Aperçu des comptes dans person
SELECT id, first_name, last_name, email FROM person;

-- ── 1.4 post vs posts ────────────────────────────────────────────────────────
SELECT '-- post vs posts --' AS section;
SELECT 'post'  AS source, COUNT(*) AS total FROM post
UNION ALL
SELECT 'posts',             COUNT(*)          FROM posts;

SELECT COUNT(*) AS dans_post_pas_dans_posts
FROM post p
WHERE NOT EXISTS (
    SELECT 1 FROM posts ps WHERE ps.post_name = p.post_name
);

-- Aperçu
SELECT id, post_name FROM post;
SELECT id, post_name FROM posts;

-- ── 1.5 evaluation vs evaluations ────────────────────────────────────────────
SELECT '-- evaluation vs evaluations --' AS section;
SELECT 'evaluation'  AS source, COUNT(*) AS total FROM evaluation
UNION ALL
SELECT 'evaluations',             COUNT(*)          FROM evaluations;

SELECT COUNT(*) AS dans_evaluation_pas_dans_evaluations
FROM evaluation e
WHERE NOT EXISTS (
    SELECT 1 FROM evaluations ev WHERE ev.evl_name = e.evaluation_name
);

-- Aperçu
SELECT id, evaluation_name FROM evaluation;
SELECT id, evl_name FROM evaluations;

-- ── 1.6 technician_site vs technician_sites ──────────────────────────────────
SELECT '-- technician_site vs technician_sites --' AS section;
SELECT 'technician_site'  AS source, COUNT(*) AS total FROM technician_site
UNION ALL
SELECT 'technician_sites',           COUNT(*)          FROM technician_sites;

-- Aperçu des données à migrer
SELECT id, health_id, person_id FROM technician_site;

-- ============================================================
-- ÉTAPE 2 : MIGRATION des données orphelines vers tables actives
-- ============================================================
-- ⚠️ Décommenter après avoir vérifié l'étape 1

SELECT '=== ÉTAPE 2 : MIGRATION (à décommenter après vérif) ===' AS info;

-- ── technician_site → technician_sites ───────────────────────────────────────
-- Les 6 lignes dans technician_site doivent aller dans technician_sites
-- (vérifier les colonnes avec DESCRIBE technician_site; DESCRIBE technician_sites;)
/*
INSERT IGNORE INTO technician_sites (health_id, person_id)
SELECT health_id, person_id FROM technician_site;
*/

-- ── health_sites → health ────────────────────────────────────────────────────
-- Seulement si des lignes dans health_sites sont absentes de health
-- (à décider après le diagnostic de l'étape 1)
/*
INSERT IGNORE INTO health (health_name, district_id)
SELECT health_name, district_id FROM health_sites hs
WHERE NOT EXISTS (
    SELECT 1 FROM health h
    WHERE h.health_name = hs.health_name
      AND h.district_id = hs.district_id
);
*/

-- ── booklet → booklets ───────────────────────────────────────────────────────
/*
INSERT IGNORE INTO booklets (first_name, last_name, email, contact, created_at)
SELECT first_name, last_name, email, contact, created_at FROM booklet b
WHERE NOT EXISTS (
    SELECT 1 FROM booklets bk
    WHERE bk.email = b.email
);
*/

-- ============================================================
-- ÉTAPE 3 : SUPPRESSION des tables orphelines
-- ============================================================
-- ⚠️ Exécuter APRÈS validation des étapes 1 et 2
-- ⚠️ Vérifier que le backend fonctionne correctement après

SELECT '=== ÉTAPE 3 : DROP TABLES ORPHELINES ===' AS info;

-- ── Groupe A : Tables VIDES — sûres à supprimer immédiatement ────────────────
-- (décommenter pour exécuter)
/*
DROP TABLE IF EXISTS appreciation;
DROP TABLE IF EXISTS booklet_status;
DROP TABLE IF EXISTS deployments;
DROP TABLE IF EXISTS interventions;
*/

-- ── Groupe B : Tables avec données — supprimer APRÈS migration ───────────────
/*
DROP TABLE IF EXISTS booklet;
DROP TABLE IF EXISTS evaluation;
DROP TABLE IF EXISTS health_sites;
DROP TABLE IF EXISTS person;
DROP TABLE IF EXISTS post;
DROP TABLE IF EXISTS technician_site;
*/

-- ============================================================
-- VÉRIFICATION FINALE
-- ============================================================
SELECT '=== TABLES RESTANTES APRÈS NETTOYAGE ===' AS info;

SELECT
    t.TABLE_NAME,
    t.TABLE_ROWS                AS lignes_approx,
    ROUND(t.DATA_LENGTH/1024,1) AS taille_kb,
    CASE
        WHEN t.TABLE_NAME IN (
            'acquisitions','appreciations','apps','archives','booklets',
            'booklet_statuses','deployment','deployment_items','districts',
            'evaluations','fournitures','fourniture_deploiements','health',
            'images','intervention','partners','persons','posts','regions',
            'states','technician_sites','types','units','vehicules',
            'vehicule_affectations','vehicule_document_historiques',
            'vehicule_incidents','vehicule_maintenances'
        ) THEN '✅ Hibernate actif'
        ELSE '❌ Orpheline'
    END AS statut_hibernate
FROM information_schema.TABLES t
WHERE t.TABLE_SCHEMA = 'catusnis_db'
  AND t.TABLE_TYPE   = 'BASE TABLE'
ORDER BY statut_hibernate, t.TABLE_NAME;
