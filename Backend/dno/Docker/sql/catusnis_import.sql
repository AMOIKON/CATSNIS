USE catusnis_db;
SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

-- ── units ──
INSERT IGNORE INTO `units` VALUES (1,'Direction'),(2,'Informatique'),(4,'LIS'),(3,'Santé');

-- ── post ──
INSERT IGNORE INTO `post` VALUES (1,'Administrateur'),(2,'Technicien Laboratoire'),(3,'Utilisateur'),(4,'Convoyeur'),(5,'Médecin-chef'),(6,'Médecin'),(7,'Infirmier'),(8,'Sage-Femme'),(9,'Directeur régional'),(10,'Directeur départemental'),(11,'Directeur '),(12,'Informaticien');

-- ── posts ──
INSERT IGNORE INTO `posts` VALUES (2,'BIOLOGISTE'),(1,'CONVOYEUR'),(3,'INFORMATICIEN');

-- ── images ──
INSERT IGNORE INTO `images` VALUES (1,'d2f6f19a-08cf-4962-810e-98766da8edc4.png',0,NULL,NULL),(2,'cdd87717-9f34-4592-bfc7-31a81a4c0e46.png',0,NULL,NULL),(3,'4ee06eea-11d8-40ca-b61f-5a9fbe34e6b1.png',0,NULL,NULL),(4,'7b8ac6fd-3a0e-4b9c-9655-cac215b07bde.png',0,NULL,NULL),(5,'3adcd353-be90-4dfe-9e17-a451377dc8aa.png',0,NULL,NULL),(6,'151b4176-90e8-42b2-9368-5c74e097a0f8.jpeg',0,NULL,NULL),(7,'5334300e-7a4d-4474-bec3-4484322bab47.jpeg',0,NULL,NULL),(8,'60fc900f-7587-4ca6-a663-9a6be70bf400.png',0,NULL,NULL);

-- ── partners ──
INSERT IGNORE INTO `partners` VALUES (1,'FM','bi-asterisk','#e53935','3adcd353-be90-4dfe-9e17-a451377dc8aa.png'),(2,'CDC','bi-globe2','#1565c0','60fc900f-7587-4ca6-a663-9a6be70bf400.png'),(3,'UNICEF','bi-shield-check','#07a1e4','d2f6f19a-08cf-4962-810e-98766da8edc4.png'),(17,'ITECH-CIV','bi-globe','#07a1e4','cdd87717-9f34-4592-bfc7-31a81a4c0e46.png'),(19,'SEV-CI','bi-globe','#0ba6f4','151b4176-90e8-42b2-9368-5c74e097a0f8.jpeg'),(20,'ACONDA-VS','bi-globe','#07a1e4','5334300e-7a4d-4474-bec3-4484322bab47.jpeg');

-- ── apps ──
INSERT IGNORE INTO `apps` VALUES (1,'OpenELIS','bi-app-indicator','#616161','cdd87717-9f34-4592-bfc7-31a81a4c0e46.png'),(2,'LSTRACKER','bi-app-indicator','#103bbc','4ee06eea-11d8-40ca-b61f-5a9fbe34e6b1.png');

-- ── evaluation ──
INSERT IGNORE INTO `evaluation` VALUES (1,'Très satisfaisant'),(2,'Satisfaisant'),(3,'Peu satisfaisant'),(4,'Non satisfaisant');

-- ── evaluations ──
INSERT IGNORE INTO `evaluations` VALUES (2,'Bon'),(1,'Excellent'),(5,'Insuffisant'),(4,'Passable'),(3,'Satisfaisant');

-- ── booklet_statuses ──
INSERT IGNORE INTO `booklet_statuses` VALUES (4,'Actif'),(1,'Affecté'),(6,'En attente'),(5,'Inactif'),(3,'Pas en service'),(2,'Réaffecté'),(7,'Suspendu');

-- ── types ──
INSERT IGNORE INTO `types` VALUES (1,'ordinateur-bureau.png','Dell','OptiPlex 7090','Ordinateur Bureau'),(4,'ordinateur-portable.png','Dell','Latitude 5520','Ordinateur Portable'),(7,'imprimante.png','HP','LaserJet Pro M404','Imprimante'),(9,'serveur.png','Dell','PowerEdge R740','Serveur'),(177,'3d899602-7226-48ad-a522-02e2f2a20896.png','HP','250G2','Ordinateur Bureaux'),(178,'tab.png','Luxury Touch','Tablette','Luxury Touch'),(179,'tab.png','Lenovo','Tablette','Lenovo'),(184,'ecran.png','HP','Moniteur','Écran'),(185,'pc.png','HP','Poste de travail','Ordinateur'),(186,'ups.png','APC','Onduleur 650','Onduleur'),(187,'wifi.png','TP-Link','300Mbps','Clé WiFi'),(188,'router.png','TP-Link','TL-MR3420','Routeur'),(190,'multi.png','APC','Multiprise','Multiprise');

-- ── person ──
INSERT IGNORE INTO `person` VALUES (2,'Super','Admin','admin@catusnis.ci','+225 00 00 00 00',1,1),(10,'Jean','Kouassi','jean.kouassi@catusnis.ci','+225 07 00 00 00',1,4),(13,'Super','Admin','superadmin@catusnis.ci','+225 00 00 00 00',1,1);

-- ── persons ──
INSERT IGNORE INTO `persons` VALUES (1,NULL,'superadmin@catusnis.ci','Super','Admin','$2a$10$eYiikROt4wGhyb18A5SBdunRjP8Pve/3FhHpBFSKOTBTosm0DHprC',NULL,'SUPER_ADMIN',NULL,NULL,NULL);

-- ── acquisitions ──
INSERT IGNORE INTO `acquisitions` VALUES (1,'2025-10-12',_binary '\0','',1,'350543284341430','DISPONIBLE','TAB-LUX-001',3,178),(2,'2025-10-12',_binary '\0','',1,'350543284341432','DISPONIBLE','TAB-LUX-002',3,178),(3,'2025-10-12',_binary '\0','',1,'350543284341331','DISPONIBLE','TAB-LUX-003',3,178),(4,'2025-10-12',_binary '\0','',1,'350543284341418','DISPONIBLE','TAB-LUX-004',3,178),(5,'2025-10-12',_binary '\0','',1,'350543284341429','DISPONIBLE','TAB-LUX-005',3,178),(6,'2025-10-12',_binary '\0','',1,'350543284341438','DISPONIBLE','TAB-LUX-006',3,178),(7,'2025-10-12',_binary '\0','',1,'350543284341704','DISPONIBLE','TAB-LUX-007',3,178),(8,'2025-10-12',_binary '\0','',1,'350543284341332','DISPONIBLE','TAB-LUX-008',3,178),(9,'2025-10-12',_binary '\0','',1,'350543284341392','DISPONIBLE','TAB-LUX-009',3,178),(10,'2025-10-12',_binary '\0','',1,'350543284341440','DISPONIBLE','TAB-LUX-010',3,178),(46,'2025-10-12',_binary '\0','',1,'HGR4EVEM','DISPONIBLE','TAB-LEN-046',3,179),(47,'2025-10-12',_binary '\0','',1,'HGR4EVM7','DISPONIBLE','TAB-LEN-047',3,179),(118,'2025-10-12',_binary '\0','',1,'CN41503TXY','DISPONIBLE','ECRAN-HP-001',3,184),(119,'2025-10-12',_binary '\0','',1,'CN424111FT','DISPONIBLE','ECRAN-HP-002',3,184),(120,'2025-10-12',_binary '\0','',1,'CN424111CP','DISPONIBLE','ECRAN-HP-003',3,184),(121,'2025-10-12',_binary '\0','',1,'4CE307CCQ4','DISPONIBLE','POSTE-HP-001',3,185),(122,'2025-10-12',_binary '\0','',1,'4CE308BFTR','DISPONIBLE','POSTE-HP-002',3,185),(123,'2025-10-12',_binary '\0','',1,'4CE243C09C','DISPONIBLE','POSTE-HP-SRV',3,185),(124,'2025-10-12',_binary '\0','',1,'9B2126A23907','DISPONIBLE','UPS-APC-001',3,186),(125,'2025-10-12',_binary '\0','',1,'9B2126A23904','DISPONIBLE','UPS-APC-002',3,186),(126,'2025-10-12',_binary '\0','',1,'2232497012078','DISPONIBLE','WIFI-TPL-001',3,187),(127,'2025-10-12',_binary '\0','',1,'2232497013285','DISPONIBLE','WIFI-TPL-002',3,187),(128,'2025-10-12',_binary '\0','',1,'22291B3001917','DISPONIBLE','ROUT-TPL-001',3,188),(129,'2025-10-12',_binary '\0','',1,'VNF3B04531','DISPONIBLE','IMPR-HP-001',3,7),(130,'2025-10-12',_binary '\0','',1,'MULT-APC-001-NS','DISPONIBLE','MULT-APC-001',3,190),(131,'2025-10-12',_binary '','',1,'MULT-APC-002-NS','DEPLOYE','MULT-APC-002',3,190);

SET FOREIGN_KEY_CHECKS = 1;
-- OK