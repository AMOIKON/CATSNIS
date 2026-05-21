-- ============================================================
-- Script d'initialisation des utilisateurs CATUSNIS
-- Exécuté automatiquement au premier démarrage Docker
-- Mot de passe : SuperAdmin@2024
-- ============================================================

USE catusnis_db;

-- ✅ Insérer ou mettre à jour superadmin
INSERT INTO persons (id, contact, email, first_name, last_name, password, role, partner_id, post_id, units_id)
VALUES (
  1,
  '+225 00 00 00 00',
  'superadmin@catusnis.ci',
  'Super',
  'Admin',
  '$2a$10$eYiikROt4wGhyb18A5SBdunRjP8Pve/3FhHpBFSKOTBTosm0DHprC',
  'SUPER_ADMIN',
  NULL,
  NULL,
  NULL
)
ON DUPLICATE KEY UPDATE
  password   = '$2a$10$eYiikROt4wGhyb18A5SBdunRjP8Pve/3FhHpBFSKOTBTosm0DHprC',
  role       = 'SUPER_ADMIN',
  first_name = 'Super',
  last_name  = 'Admin';

-- ✅ Insérer admin secondaire
INSERT INTO persons (id, contact, email, first_name, last_name, password, role, partner_id, post_id, units_id)
VALUES (
  2,
  '+225 00 00 00 01',
  'admin@catusnis.ci',
  'Admin',
  'CATUSNIS',
  '$2a$10$eYiikROt4wGhyb18A5SBdunRjP8Pve/3FhHpBFSKOTBTosm0DHprC',
  'ADMIN',
  NULL,
  NULL,
  NULL
)
ON DUPLICATE KEY UPDATE
  password   = '$2a$10$eYiikROt4wGhyb18A5SBdunRjP8Pve/3FhHpBFSKOTBTosm0DHprC',
  role       = 'ADMIN';

SELECT 'Utilisateurs initialisés avec succès' as status;
