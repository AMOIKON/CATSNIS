CREATE DATABASE  IF NOT EXISTS `catusnis_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `catusnis_db`;
-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: catusnis_db
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `acquisitions`
--

DROP TABLE IF EXISTS `acquisitions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `acquisitions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `date_acq` date DEFAULT NULL,
  `deployed` bit(1) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `serial` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `tag` varchar(255) DEFAULT NULL,
  `partner_id` int DEFAULT NULL,
  `types_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK19yt4clh9r3um75p6ws2tjgxb` (`partner_id`),
  KEY `FKsgtbx9ysugpss85itmdx015f0` (`types_id`),
  CONSTRAINT `FK19yt4clh9r3um75p6ws2tjgxb` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`),
  CONSTRAINT `FKsgtbx9ysugpss85itmdx015f0` FOREIGN KEY (`types_id`) REFERENCES `types` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=132 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `acquisitions`
--

LOCK TABLES `acquisitions` WRITE;
/*!40000 ALTER TABLE `acquisitions` DISABLE KEYS */;
INSERT INTO `acquisitions` VALUES (1,'2025-10-12',_binary '\0','',1,'350543284341430','DISPONIBLE','TAB-LUX-001',3,178),(2,'2025-10-12',_binary '\0','',1,'350543284341432','DISPONIBLE','TAB-LUX-002',3,178),(3,'2025-10-12',_binary '\0','',1,'350543284341331','DISPONIBLE','TAB-LUX-003',3,178),(4,'2025-10-12',_binary '\0','',1,'350543284341418','DISPONIBLE','TAB-LUX-004',3,178),(5,'2025-10-12',_binary '\0','',1,'350543284341429','DISPONIBLE','TAB-LUX-005',3,178),(6,'2025-10-12',_binary '\0','',1,'350543284341438','DISPONIBLE','TAB-LUX-006',3,178),(7,'2025-10-12',_binary '\0','',1,'350543284341704','DISPONIBLE','TAB-LUX-007',3,178),(8,'2025-10-12',_binary '\0','',1,'350543284341332','DISPONIBLE','TAB-LUX-008',3,178),(9,'2025-10-12',_binary '\0','',1,'350543284341392','DISPONIBLE','TAB-LUX-009',3,178),(10,'2025-10-12',_binary '\0','',1,'350543284341440','DISPONIBLE','TAB-LUX-010',3,178),(46,'2025-10-12',_binary '\0','',1,'HGR4EVEM','DISPONIBLE','TAB-LEN-046',3,179),(47,'2025-10-12',_binary '\0','',1,'HGR4EVM7','DISPONIBLE','TAB-LEN-047',3,179),(118,'2025-10-12',_binary '\0','',1,'CN41503TXY','DISPONIBLE','ECRAN-HP-001',3,184),(119,'2025-10-12',_binary '\0','',1,'CN424111FT','DISPONIBLE','ECRAN-HP-002',3,184),(120,'2025-10-12',_binary '\0','',1,'CN424111CP','DISPONIBLE','ECRAN-HP-003',3,184),(121,'2025-10-12',_binary '\0','',1,'4CE307CCQ4','DISPONIBLE','POSTE-HP-001',3,185),(122,'2025-10-12',_binary '\0','',1,'4CE308BFTR','DISPONIBLE','POSTE-HP-002',3,185),(123,'2025-10-12',_binary '\0','',1,'4CE243C09C','DISPONIBLE','POSTE-HP-SRV',3,185),(124,'2025-10-12',_binary '\0','',1,'9B2126A23907','DISPONIBLE','UPS-APC-001',3,186),(125,'2025-10-12',_binary '\0','',1,'9B2126A23904','DISPONIBLE','UPS-APC-002',3,186),(126,'2025-10-12',_binary '\0','',1,'2232497012078','DISPONIBLE','WIFI-TPL-001',3,187),(127,'2025-10-12',_binary '\0','',1,'2232497013285','DISPONIBLE','WIFI-TPL-002',3,187),(128,'2025-10-12',_binary '\0','',1,'22291B3001917','DISPONIBLE','ROUT-TPL-001',3,188),(129,'2025-10-12',_binary '\0','',1,'VNF3B04531','DISPONIBLE','IMPR-HP-001',3,7),(130,'2025-10-12',_binary '\0','',1,'MULT-APC-001-NS','DISPONIBLE','MULT-APC-001',3,190),(131,'2025-10-12',_binary '','',1,'MULT-APC-002-NS','DEPLOYE','MULT-APC-002',3,190);
/*!40000 ALTER TABLE `acquisitions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `appreciation`
--

DROP TABLE IF EXISTS `appreciation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appreciation` (
  `id` int NOT NULL AUTO_INCREMENT,
  `appreciation_name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appreciation`
--

LOCK TABLES `appreciation` WRITE;
/*!40000 ALTER TABLE `appreciation` DISABLE KEYS */;
/*!40000 ALTER TABLE `appreciation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `appreciations`
--

DROP TABLE IF EXISTS `appreciations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appreciations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `appreciate_name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKhpxrhswkmk5ltodrj4sg86rlg` (`appreciate_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appreciations`
--

LOCK TABLES `appreciations` WRITE;
/*!40000 ALTER TABLE `appreciations` DISABLE KEYS */;
/*!40000 ALTER TABLE `appreciations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `apps`
--

DROP TABLE IF EXISTS `apps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `apps` (
  `id` int NOT NULL AUTO_INCREMENT,
  `app_name` varchar(255) NOT NULL,
  `color` varchar(255) DEFAULT NULL,
  `icon` varchar(255) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKdwc53tawo92c5qr5f63pbagnc` (`app_name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `apps`
--

LOCK TABLES `apps` WRITE;
/*!40000 ALTER TABLE `apps` DISABLE KEYS */;
INSERT INTO `apps` VALUES (1,'OpenELIS','bi-app-indicator','#616161','cdd87717-9f34-4592-bfc7-31a81a4c0e46.png'),(2,'LSTRACKER','bi-app-indicator','#103bbc','4ee06eea-11d8-40ca-b61f-5a9fbe34e6b1.png');
/*!40000 ALTER TABLE `apps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `archives`
--

DROP TABLE IF EXISTS `archives`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `archives` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `archived_at` datetime(6) DEFAULT NULL,
  `archived_by` varchar(255) DEFAULT NULL,
  `categorie` enum('ACQUISITION','ACTIVE','AUTRE','BOOKLET','DEPLOIEMENT','INTERVENTION') NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `file_size` bigint DEFAULT NULL,
  `mime_type` varchar(255) DEFAULT NULL,
  `related_code` varchar(255) DEFAULT NULL,
  `related_id` bigint DEFAULT NULL,
  `titre` varchar(255) NOT NULL,
  `type` enum('IMPRIME','SCANNE') NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `archives`
--

LOCK TABLES `archives` WRITE;
/*!40000 ALTER TABLE `archives` DISABLE KEYS */;
/*!40000 ALTER TABLE `archives` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `booklet_statuses`
--

DROP TABLE IF EXISTS `booklet_statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `booklet_statuses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `status_name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK2xs3wbeabkpvgajioutpt3sal` (`status_name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `booklet_statuses`
--

LOCK TABLES `booklet_statuses` WRITE;
/*!40000 ALTER TABLE `booklet_statuses` DISABLE KEYS */;
INSERT INTO `booklet_statuses` VALUES (4,'Actif'),(1,'Affecté'),(6,'En attente'),(5,'Inactif'),(3,'Pas en service'),(2,'Réaffecté'),(7,'Suspendu');
/*!40000 ALTER TABLE `booklet_statuses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `booklets`
--

DROP TABLE IF EXISTS `booklets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `booklets` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `contact` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `district_id` int DEFAULT NULL,
  `post_id` int DEFAULT NULL,
  `region_id` int DEFAULT NULL,
  `status_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKcouuu1n775q6entumwq1mf7t8` (`district_id`),
  KEY `FKjhrm63jblxvxwpybkpi6oh0uu` (`post_id`),
  KEY `FK8p3271dwn1p6304pwp7srwd9y` (`region_id`),
  KEY `FKijegs79jpe6n8xq6vk9mw54pf` (`status_id`),
  CONSTRAINT `FK8p3271dwn1p6304pwp7srwd9y` FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`),
  CONSTRAINT `FKcouuu1n775q6entumwq1mf7t8` FOREIGN KEY (`district_id`) REFERENCES `districts` (`id`),
  CONSTRAINT `FKijegs79jpe6n8xq6vk9mw54pf` FOREIGN KEY (`status_id`) REFERENCES `booklet_statuses` (`id`),
  CONSTRAINT `FKjhrm63jblxvxwpybkpi6oh0uu` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `booklets`
--

LOCK TABLES `booklets` WRITE;
/*!40000 ALTER TABLE `booklets` DISABLE KEYS */;
/*!40000 ALTER TABLE `booklets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deployment`
--

DROP TABLE IF EXISTS `deployment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deployment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code_dep` varchar(255) NOT NULL,
  `comment` varchar(255) DEFAULT NULL,
  `date_recept` datetime(6) DEFAULT NULL,
  `apps_id` int DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `district_id` int DEFAULT NULL,
  `health_id` int DEFAULT NULL,
  `partner_id` int DEFAULT NULL,
  `region_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKhxtyvds7ckedi3jqf7c0mtvu2` (`code_dep`),
  KEY `FKrq51w3clp8sty7uabsfy375v7` (`apps_id`),
  KEY `FKndqoyk7ons7pvb8ojr3y69rq5` (`created_by`),
  KEY `FKsg2vhd6wu0057fyvr2ittte8k` (`district_id`),
  KEY `FKn142fy08p3bpqcbbdhjwj3fqn` (`health_id`),
  KEY `FK5c5m00iqpoe9oxtt2e9jj8ef0` (`partner_id`),
  KEY `FK7ea8d5lmjklqswhvlyiuq6qgl` (`region_id`),
  CONSTRAINT `FK5c5m00iqpoe9oxtt2e9jj8ef0` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`),
  CONSTRAINT `FK7ea8d5lmjklqswhvlyiuq6qgl` FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`),
  CONSTRAINT `FKn142fy08p3bpqcbbdhjwj3fqn` FOREIGN KEY (`health_id`) REFERENCES `health` (`id`),
  CONSTRAINT `FKndqoyk7ons7pvb8ojr3y69rq5` FOREIGN KEY (`created_by`) REFERENCES `persons` (`id`),
  CONSTRAINT `FKrq51w3clp8sty7uabsfy375v7` FOREIGN KEY (`apps_id`) REFERENCES `apps` (`id`),
  CONSTRAINT `FKsg2vhd6wu0057fyvr2ittte8k` FOREIGN KEY (`district_id`) REFERENCES `districts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deployment`
--

LOCK TABLES `deployment` WRITE;
/*!40000 ALTER TABLE `deployment` DISABLE KEYS */;
/*!40000 ALTER TABLE `deployment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deployment_items`
--

DROP TABLE IF EXISTS `deployment_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deployment_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `etat_apres` varchar(255) DEFAULT NULL,
  `etat_avant` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `acquisition_id` bigint DEFAULT NULL,
  `deployment_id` int DEFAULT NULL,
  `replacement_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKup9uncu0d4vg0rb2kef8vis3` (`acquisition_id`),
  KEY `FKs5xh4xcsn7q1wyouwd5g1x0gg` (`deployment_id`),
  KEY `FKlahyqblxob4eoqwxclldydry2` (`replacement_id`),
  CONSTRAINT `FKlahyqblxob4eoqwxclldydry2` FOREIGN KEY (`replacement_id`) REFERENCES `acquisitions` (`id`),
  CONSTRAINT `FKs5xh4xcsn7q1wyouwd5g1x0gg` FOREIGN KEY (`deployment_id`) REFERENCES `deployment` (`id`),
  CONSTRAINT `FKup9uncu0d4vg0rb2kef8vis3` FOREIGN KEY (`acquisition_id`) REFERENCES `acquisitions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deployment_items`
--

LOCK TABLES `deployment_items` WRITE;
/*!40000 ALTER TABLE `deployment_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `deployment_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `districts`
--

DROP TABLE IF EXISTS `districts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `districts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `district_name` varchar(255) NOT NULL,
  `region_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK9mgy39acawqmviib49ah3f2cs` (`district_name`),
  KEY `FKtg2xciun6nr44x122k273u59a` (`region_id`),
  CONSTRAINT `FKtg2xciun6nr44x122k273u59a` FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `districts`
--

LOCK TABLES `districts` WRITE;
/*!40000 ALTER TABLE `districts` DISABLE KEYS */;
/*!40000 ALTER TABLE `districts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluation`
--

DROP TABLE IF EXISTS `evaluation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluation` (
  `id` int NOT NULL AUTO_INCREMENT,
  `evaluation_name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluation`
--

LOCK TABLES `evaluation` WRITE;
/*!40000 ALTER TABLE `evaluation` DISABLE KEYS */;
INSERT INTO `evaluation` VALUES (1,'Très satisfaisant'),(2,'Satisfaisant'),(3,'Peu satisfaisant'),(4,'Non satisfaisant');
/*!40000 ALTER TABLE `evaluation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluations`
--

DROP TABLE IF EXISTS `evaluations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `evl_name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKf26jcivtd2efhkmhr8420jy7f` (`evl_name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluations`
--

LOCK TABLES `evaluations` WRITE;
/*!40000 ALTER TABLE `evaluations` DISABLE KEYS */;
INSERT INTO `evaluations` VALUES (2,'Bon'),(1,'Excellent'),(5,'Insuffisant'),(4,'Passable'),(3,'Satisfaisant');
/*!40000 ALTER TABLE `evaluations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fourniture_deploiements`
--

DROP TABLE IF EXISTS `fourniture_deploiements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fourniture_deploiements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `active` bit(1) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `date_deploiement` date NOT NULL,
  `motif` varchar(500) DEFAULT NULL,
  `notes` text,
  `quantite_deployee` int NOT NULL,
  `booklet_id` bigint DEFAULT NULL,
  `district_id` int DEFAULT NULL,
  `fourniture_id` int NOT NULL,
  `person_id` int DEFAULT NULL,
  `region_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK66ruja7fslaovn6cab34wrb0o` (`booklet_id`),
  KEY `FKchoicbownbf6ilyiwb0fmbrsr` (`district_id`),
  KEY `FKbgrecqiubsxxeryo0mgw3iwsq` (`fourniture_id`),
  KEY `FKiklth731d0cjlyqyx7239qxva` (`person_id`),
  KEY `FK1eo7lte1dg5mbbk9b0htawh1q` (`region_id`),
  CONSTRAINT `FK1eo7lte1dg5mbbk9b0htawh1q` FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`),
  CONSTRAINT `FK66ruja7fslaovn6cab34wrb0o` FOREIGN KEY (`booklet_id`) REFERENCES `booklets` (`id`),
  CONSTRAINT `FKbgrecqiubsxxeryo0mgw3iwsq` FOREIGN KEY (`fourniture_id`) REFERENCES `fournitures` (`id`),
  CONSTRAINT `FKchoicbownbf6ilyiwb0fmbrsr` FOREIGN KEY (`district_id`) REFERENCES `districts` (`id`),
  CONSTRAINT `FKiklth731d0cjlyqyx7239qxva` FOREIGN KEY (`person_id`) REFERENCES `persons` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fourniture_deploiements`
--

LOCK TABLES `fourniture_deploiements` WRITE;
/*!40000 ALTER TABLE `fourniture_deploiements` DISABLE KEYS */;
/*!40000 ALTER TABLE `fourniture_deploiements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fournitures`
--

DROP TABLE IF EXISTS `fournitures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fournitures` (
  `id` int NOT NULL AUTO_INCREMENT,
  `categorie` enum('AUTRE','BUREAUTIQUE','ELECTROMENAGER','INFORMATIQUE','MOBILIER','PAPETERIE') NOT NULL,
  `code` varchar(50) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `date_acquisition` date DEFAULT NULL,
  `description` text,
  `designation` varchar(200) NOT NULL,
  `fournisseur` varchar(200) DEFAULT NULL,
  `prix_unitaire` double DEFAULT NULL,
  `quantite` int NOT NULL,
  `quantite_disponible` int NOT NULL,
  `statut` enum('DEPLOYE','DISPONIBLE','EN_RUPTURE') DEFAULT NULL,
  `unite` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKlk6d1fsrtd26o4066vh3u4v2b` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fournitures`
--

LOCK TABLES `fournitures` WRITE;
/*!40000 ALTER TABLE `fournitures` DISABLE KEYS */;
/*!40000 ALTER TABLE `fournitures` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `health`
--

DROP TABLE IF EXISTS `health`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `health` (
  `id` int NOT NULL AUTO_INCREMENT,
  `health_name` varchar(255) NOT NULL,
  `district_id` int DEFAULT NULL,
  `region_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKjk3wmm0m3xyhksgvvf5w54cmy` (`district_id`),
  KEY `FKqx1hsjy5ym0jloo0bfrmdqppo` (`region_id`),
  CONSTRAINT `FKjk3wmm0m3xyhksgvvf5w54cmy` FOREIGN KEY (`district_id`) REFERENCES `districts` (`id`),
  CONSTRAINT `FKqx1hsjy5ym0jloo0bfrmdqppo` FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `health`
--

LOCK TABLES `health` WRITE;
/*!40000 ALTER TABLE `health` DISABLE KEYS */;
/*!40000 ALTER TABLE `health` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `images`
--

DROP TABLE IF EXISTS `images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `file_name` varchar(255) NOT NULL,
  `file_size` bigint DEFAULT NULL,
  `label` varchar(255) DEFAULT NULL,
  `mime_type` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `images`
--

LOCK TABLES `images` WRITE;
/*!40000 ALTER TABLE `images` DISABLE KEYS */;
INSERT INTO `images` VALUES (1,'d2f6f19a-08cf-4962-810e-98766da8edc4.png',0,NULL,NULL),(2,'cdd87717-9f34-4592-bfc7-31a81a4c0e46.png',0,NULL,NULL),(3,'4ee06eea-11d8-40ca-b61f-5a9fbe34e6b1.png',0,NULL,NULL),(4,'7b8ac6fd-3a0e-4b9c-9655-cac215b07bde.png',0,NULL,NULL),(5,'3adcd353-be90-4dfe-9e17-a451377dc8aa.png',0,NULL,NULL),(6,'151b4176-90e8-42b2-9368-5c74e097a0f8.jpeg',0,NULL,NULL),(7,'5334300e-7a4d-4474-bec3-4484322bab47.jpeg',0,NULL,NULL),(8,'60fc900f-7587-4ca6-a663-9a6be70bf400.png',0,NULL,NULL);
/*!40000 ALTER TABLE `images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `intervention`
--

DROP TABLE IF EXISTS `intervention`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `intervention` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action_inter` varchar(255) NOT NULL,
  `code_inter` varchar(255) NOT NULL,
  `comment_intervention` varchar(255) NOT NULL,
  `date_intervention` datetime(6) NOT NULL,
  `duration_minutes` int NOT NULL,
  `en_attente_maintenance` bit(1) DEFAULT NULL,
  `type_inter` varchar(255) NOT NULL,
  `apps_id` int NOT NULL,
  `booklet_id` bigint DEFAULT NULL,
  `deployment_id` int NOT NULL,
  `district_id` int NOT NULL,
  `evaluation_id` int NOT NULL,
  `health_id` int NOT NULL,
  `partner_id` int DEFAULT NULL,
  `person_id` int DEFAULT NULL,
  `region_id` int NOT NULL,
  `technician_id` int NOT NULL,
  `types_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKaepnu9wi7fky5pvk7n78wpayd` (`code_inter`),
  KEY `FKfhb1hbifsls5oxo9e2pmbvrg6` (`apps_id`),
  KEY `FK958hwsf4q80yltnilst4e6aoi` (`booklet_id`),
  KEY `FKsgbx4lhdhll9kcnaqmgjdhat0` (`deployment_id`),
  KEY `FK5fmt9cyqn3qtu6qj832dtpt1r` (`district_id`),
  KEY `FK9ybxb29y7eq9ls6rakfs3bnx7` (`evaluation_id`),
  KEY `FKjdx3prtp412jc9rrf90givpxq` (`health_id`),
  KEY `FKh6r5b1b3nun8m2u17d40icw57` (`partner_id`),
  KEY `FKw3trem2slw080ta71hv0fhsx` (`person_id`),
  KEY `FK9223w4v244x9dl7lf9hy3kfx7` (`region_id`),
  KEY `FKbrbfvn64rwci8sinu6927xiv5` (`technician_id`),
  KEY `FKbkd6wcx55n56p7bc62y0mq51d` (`types_id`),
  CONSTRAINT `FK5fmt9cyqn3qtu6qj832dtpt1r` FOREIGN KEY (`district_id`) REFERENCES `districts` (`id`),
  CONSTRAINT `FK9223w4v244x9dl7lf9hy3kfx7` FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`),
  CONSTRAINT `FK958hwsf4q80yltnilst4e6aoi` FOREIGN KEY (`booklet_id`) REFERENCES `booklets` (`id`),
  CONSTRAINT `FK9ybxb29y7eq9ls6rakfs3bnx7` FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations` (`id`),
  CONSTRAINT `FKbkd6wcx55n56p7bc62y0mq51d` FOREIGN KEY (`types_id`) REFERENCES `types` (`id`),
  CONSTRAINT `FKbrbfvn64rwci8sinu6927xiv5` FOREIGN KEY (`technician_id`) REFERENCES `persons` (`id`),
  CONSTRAINT `FKfhb1hbifsls5oxo9e2pmbvrg6` FOREIGN KEY (`apps_id`) REFERENCES `apps` (`id`),
  CONSTRAINT `FKh6r5b1b3nun8m2u17d40icw57` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`),
  CONSTRAINT `FKjdx3prtp412jc9rrf90givpxq` FOREIGN KEY (`health_id`) REFERENCES `health` (`id`),
  CONSTRAINT `FKsgbx4lhdhll9kcnaqmgjdhat0` FOREIGN KEY (`deployment_id`) REFERENCES `deployment` (`id`),
  CONSTRAINT `FKw3trem2slw080ta71hv0fhsx` FOREIGN KEY (`person_id`) REFERENCES `persons` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `intervention`
--

LOCK TABLES `intervention` WRITE;
/*!40000 ALTER TABLE `intervention` DISABLE KEYS */;
/*!40000 ALTER TABLE `intervention` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partners`
--

DROP TABLE IF EXISTS `partners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `partners` (
  `id` int NOT NULL AUTO_INCREMENT,
  `color` varchar(255) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `partner_name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKcv5cenrt5goits0y9f55f3ulk` (`partner_name`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partners`
--

LOCK TABLES `partners` WRITE;
/*!40000 ALTER TABLE `partners` DISABLE KEYS */;
INSERT INTO `partners` VALUES (1,'FM','bi-asterisk','#e53935','3adcd353-be90-4dfe-9e17-a451377dc8aa.png'),(2,'CDC','bi-globe2','#1565c0','60fc900f-7587-4ca6-a663-9a6be70bf400.png'),(3,'UNICEF','bi-shield-check','#07a1e4','d2f6f19a-08cf-4962-810e-98766da8edc4.png'),(17,'ITECH-CIV','bi-globe','#07a1e4','cdd87717-9f34-4592-bfc7-31a81a4c0e46.png'),(19,'SEV-CI','bi-globe','#0ba6f4','151b4176-90e8-42b2-9368-5c74e097a0f8.jpeg'),(20,'ACONDA-VS','bi-globe','#07a1e4','5334300e-7a4d-4474-bec3-4484322bab47.jpeg');
/*!40000 ALTER TABLE `partners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `person`
--

DROP TABLE IF EXISTS `person`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `person` (
  `id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `contact` varchar(255) NOT NULL,
  `post_id` int NOT NULL,
  `units_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `post_id` (`post_id`),
  KEY `units_id` (`units_id`),
  CONSTRAINT `person_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `post` (`id`),
  CONSTRAINT `person_ibfk_2` FOREIGN KEY (`units_id`) REFERENCES `units` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `person`
--

LOCK TABLES `person` WRITE;
/*!40000 ALTER TABLE `person` DISABLE KEYS */;
INSERT INTO `person` VALUES (2,'Super','Admin','admin@catusnis.ci','+225 00 00 00 00',1,1),(10,'Jean','Kouassi','jean.kouassi@catusnis.ci','+225 07 00 00 00',1,4),(13,'Super','Admin','superadmin@catusnis.ci','+225 00 00 00 00',1,1);
/*!40000 ALTER TABLE `person` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `persons`
--

DROP TABLE IF EXISTS `persons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `persons` (
  `id` int NOT NULL AUTO_INCREMENT,
  `contact` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `plain_password` varchar(255) DEFAULT NULL,
  `role` enum('ADMIN','LOGISTICIEN','SUPER_ADMIN','TECHNICIEN','USER') NOT NULL,
  `partner_id` int DEFAULT NULL,
  `post_id` int DEFAULT NULL,
  `units_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK1x5aosta48fbss4d5b3kuu0rd` (`email`),
  KEY `FKqg5hd2g6bunl9cm0by22wla4w` (`partner_id`),
  KEY `FKr80fnt72ghfqkyp5r3uannkcb` (`post_id`),
  KEY `FKe67j018dt4r9bdarg2fvnic0p` (`units_id`),
  CONSTRAINT `FKe67j018dt4r9bdarg2fvnic0p` FOREIGN KEY (`units_id`) REFERENCES `units` (`id`),
  CONSTRAINT `FKqg5hd2g6bunl9cm0by22wla4w` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`),
  CONSTRAINT `FKr80fnt72ghfqkyp5r3uannkcb` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `persons`
--

LOCK TABLES `persons` WRITE;
/*!40000 ALTER TABLE `persons` DISABLE KEYS */;
INSERT INTO `persons` VALUES (1,NULL,'superadmin@catusnis.ci','Super','Admin','$2a$10$eYiikROt4wGhyb18A5SBdunRjP8Pve/3FhHpBFSKOTBTosm0DHprC',NULL,'SUPER_ADMIN',NULL,NULL,NULL);
/*!40000 ALTER TABLE `persons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post`
--

DROP TABLE IF EXISTS `post`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post` (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post`
--

LOCK TABLES `post` WRITE;
/*!40000 ALTER TABLE `post` DISABLE KEYS */;
INSERT INTO `post` VALUES (1,'Administrateur'),(2,'Technicien Laboratoire'),(3,'Utilisateur'),(4,'Convoyeur'),(5,'Médecin-chef'),(6,'Médecin'),(7,'Infirmier'),(8,'Sage-Femme'),(9,'Directeur régional'),(10,'Directeur départemental'),(11,'Directeur '),(12,'Informaticien');
/*!40000 ALTER TABLE `post` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `posts`
--

DROP TABLE IF EXISTS `posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `posts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKp2vwr0ok9me7n9ao3wj9gu3st` (`post_name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `posts`
--

LOCK TABLES `posts` WRITE;
/*!40000 ALTER TABLE `posts` DISABLE KEYS */;
INSERT INTO `posts` VALUES (2,'BIOLOGISTE'),(1,'CONVOYEUR'),(3,'INFORMATICIEN');
/*!40000 ALTER TABLE `posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `regions`
--

DROP TABLE IF EXISTS `regions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `regions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `region_name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKfd6utdsrardnp3e2v08dshqjs` (`region_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `regions`
--

LOCK TABLES `regions` WRITE;
/*!40000 ALTER TABLE `regions` DISABLE KEYS */;
/*!40000 ALTER TABLE `regions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `states`
--

DROP TABLE IF EXISTS `states`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `states` (
  `id` int NOT NULL AUTO_INCREMENT,
  `states_name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK9df9binxnbl837k5r7rsh10f9` (`states_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `states`
--

LOCK TABLES `states` WRITE;
/*!40000 ALTER TABLE `states` DISABLE KEYS */;
/*!40000 ALTER TABLE `states` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `technician_sites`
--

DROP TABLE IF EXISTS `technician_sites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `technician_sites` (
  `id` int NOT NULL AUTO_INCREMENT,
  `district_id` int DEFAULT NULL,
  `health_id` int DEFAULT NULL,
  `person_id` int DEFAULT NULL,
  `region_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKmgkg0cgpegp8igj30qpcpi5qi` (`district_id`),
  KEY `FK6shu41umiaeee6752t76ivgtb` (`health_id`),
  KEY `FKrx4iljfas6a0byw4ywofcdqxo` (`person_id`),
  KEY `FK9kk9rrcxnex56v9ad5imigb94` (`region_id`),
  CONSTRAINT `FK6shu41umiaeee6752t76ivgtb` FOREIGN KEY (`health_id`) REFERENCES `health` (`id`),
  CONSTRAINT `FK9kk9rrcxnex56v9ad5imigb94` FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`),
  CONSTRAINT `FKmgkg0cgpegp8igj30qpcpi5qi` FOREIGN KEY (`district_id`) REFERENCES `districts` (`id`),
  CONSTRAINT `FKrx4iljfas6a0byw4ywofcdqxo` FOREIGN KEY (`person_id`) REFERENCES `persons` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `technician_sites`
--

LOCK TABLES `technician_sites` WRITE;
/*!40000 ALTER TABLE `technician_sites` DISABLE KEYS */;
/*!40000 ALTER TABLE `technician_sites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `types`
--

DROP TABLE IF EXISTS `types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `image` varchar(255) DEFAULT NULL,
  `marque` varchar(255) DEFAULT NULL,
  `modele` varchar(255) DEFAULT NULL,
  `type_name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKsnvh6lujhdg043vr7dtiw4wft` (`type_name`)
) ENGINE=InnoDB AUTO_INCREMENT=191 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `types`
--

LOCK TABLES `types` WRITE;
/*!40000 ALTER TABLE `types` DISABLE KEYS */;
INSERT INTO `types` VALUES (1,'ordinateur-bureau.png','Dell','OptiPlex 7090','Ordinateur Bureau'),(4,'ordinateur-portable.png','Dell','Latitude 5520','Ordinateur Portable'),(7,'imprimante.png','HP','LaserJet Pro M404','Imprimante'),(9,'serveur.png','Dell','PowerEdge R740','Serveur'),(177,'3d899602-7226-48ad-a522-02e2f2a20896.png','HP','250G2','Ordinateur Bureaux'),(178,'tab.png','Luxury Touch','Tablette','Luxury Touch'),(179,'tab.png','Lenovo','Tablette','Lenovo'),(184,'ecran.png','HP','Moniteur','Écran'),(185,'pc.png','HP','Poste de travail','Ordinateur'),(186,'ups.png','APC','Onduleur 650','Onduleur'),(187,'wifi.png','TP-Link','300Mbps','Clé WiFi'),(188,'router.png','TP-Link','TL-MR3420','Routeur'),(190,'multi.png','APC','Multiprise','Multiprise');
/*!40000 ALTER TABLE `types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `units`
--

DROP TABLE IF EXISTS `units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `units` (
  `id` int NOT NULL AUTO_INCREMENT,
  `unit_name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK525csmemmgtoicjcfhcpf3pk0` (`unit_name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `units`
--

LOCK TABLES `units` WRITE;
/*!40000 ALTER TABLE `units` DISABLE KEYS */;
INSERT INTO `units` VALUES (1,'Direction'),(2,'Informatique'),(4,'LIS'),(3,'Santé');
/*!40000 ALTER TABLE `units` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicule_affectations`
--

DROP TABLE IF EXISTS `vehicule_affectations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicule_affectations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `active` bit(1) DEFAULT NULL,
  `date_affectation` date NOT NULL,
  `date_retour` date DEFAULT NULL,
  `motif` varchar(255) DEFAULT NULL,
  `observations` varchar(255) DEFAULT NULL,
  `booklet_id` bigint DEFAULT NULL,
  `district_id` int DEFAULT NULL,
  `person_id` int DEFAULT NULL,
  `region_id` int DEFAULT NULL,
  `vehicule_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKriss4xjwedwahrbjnjquosqpy` (`booklet_id`),
  KEY `FKqvvvomqmenmvdh4px518pkt9e` (`district_id`),
  KEY `FK6ostdi1q61eq5d0oe1kidfsif` (`person_id`),
  KEY `FK738ukgipq9gfyk1aeg9gw1etp` (`region_id`),
  KEY `FKlvwrq04sgkalxn20bvsgdiooj` (`vehicule_id`),
  CONSTRAINT `FK6ostdi1q61eq5d0oe1kidfsif` FOREIGN KEY (`person_id`) REFERENCES `persons` (`id`),
  CONSTRAINT `FK738ukgipq9gfyk1aeg9gw1etp` FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`),
  CONSTRAINT `FKlvwrq04sgkalxn20bvsgdiooj` FOREIGN KEY (`vehicule_id`) REFERENCES `vehicules` (`id`),
  CONSTRAINT `FKqvvvomqmenmvdh4px518pkt9e` FOREIGN KEY (`district_id`) REFERENCES `districts` (`id`),
  CONSTRAINT `FKriss4xjwedwahrbjnjquosqpy` FOREIGN KEY (`booklet_id`) REFERENCES `booklets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicule_affectations`
--

LOCK TABLES `vehicule_affectations` WRITE;
/*!40000 ALTER TABLE `vehicule_affectations` DISABLE KEYS */;
/*!40000 ALTER TABLE `vehicule_affectations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicule_document_historiques`
--

DROP TABLE IF EXISTS `vehicule_document_historiques`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicule_document_historiques` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `ancienne_date_debut` date DEFAULT NULL,
  `ancienne_date_fin` date DEFAULT NULL,
  `date_renouvellement` date NOT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `nouvelle_date_debut` date NOT NULL,
  `nouvelle_date_fin` date NOT NULL,
  `type_document` varchar(255) NOT NULL,
  `vehicule_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKm33t869xexuuj2kk649clux9q` (`vehicule_id`),
  CONSTRAINT `FKm33t869xexuuj2kk649clux9q` FOREIGN KEY (`vehicule_id`) REFERENCES `vehicules` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicule_document_historiques`
--

LOCK TABLES `vehicule_document_historiques` WRITE;
/*!40000 ALTER TABLE `vehicule_document_historiques` DISABLE KEYS */;
/*!40000 ALTER TABLE `vehicule_document_historiques` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicule_incidents`
--

DROP TABLE IF EXISTS `vehicule_incidents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicule_incidents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cout_estime` double DEFAULT NULL,
  `date_incident` datetime(6) NOT NULL,
  `description` varchar(255) NOT NULL,
  `lieu_incident` varchar(255) DEFAULT NULL,
  `observations` varchar(255) DEFAULT NULL,
  `signale_par` varchar(255) DEFAULT NULL,
  `statut` varchar(255) DEFAULT NULL,
  `type_incident` varchar(255) DEFAULT NULL,
  `vehicule_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKcrlkpkjh3vtpgi2bhlkbve5a8` (`vehicule_id`),
  CONSTRAINT `FKcrlkpkjh3vtpgi2bhlkbve5a8` FOREIGN KEY (`vehicule_id`) REFERENCES `vehicules` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicule_incidents`
--

LOCK TABLES `vehicule_incidents` WRITE;
/*!40000 ALTER TABLE `vehicule_incidents` DISABLE KEYS */;
/*!40000 ALTER TABLE `vehicule_incidents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicule_maintenances`
--

DROP TABLE IF EXISTS `vehicule_maintenances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicule_maintenances` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cout_reel` double DEFAULT NULL,
  `date_maintenance` datetime(6) NOT NULL,
  `description` varchar(255) NOT NULL,
  `kilometrage_intervention` int DEFAULT NULL,
  `observations` varchar(255) DEFAULT NULL,
  `prestataire` varchar(255) DEFAULT NULL,
  `statut` varchar(255) DEFAULT NULL,
  `type_maintenance` varchar(255) DEFAULT NULL,
  `vehicule_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKli9ejy0uo1a0hyy644yrf1c0` (`vehicule_id`),
  CONSTRAINT `FKli9ejy0uo1a0hyy644yrf1c0` FOREIGN KEY (`vehicule_id`) REFERENCES `vehicules` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicule_maintenances`
--

LOCK TABLES `vehicule_maintenances` WRITE;
/*!40000 ALTER TABLE `vehicule_maintenances` DISABLE KEYS */;
/*!40000 ALTER TABLE `vehicule_maintenances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicules`
--

DROP TABLE IF EXISTS `vehicules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `couleur` varchar(255) DEFAULT NULL,
  `date_acquisition` date DEFAULT NULL,
  `date_assurance` date DEFAULT NULL,
  `date_fin_assurance` date DEFAULT NULL,
  `date_fin_vignette` date DEFAULT NULL,
  `date_fin_visite_technique` date DEFAULT NULL,
  `date_vignette` date DEFAULT NULL,
  `date_visite_technique` date DEFAULT NULL,
  `fournisseur` varchar(255) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `immatriculation` varchar(255) NOT NULL,
  `kilometrage` int DEFAULT NULL,
  `marque` varchar(255) DEFAULT NULL,
  `mode_financement` varchar(255) DEFAULT NULL,
  `modele` varchar(255) DEFAULT NULL,
  `numero_bon_commande` varchar(255) DEFAULT NULL,
  `numero_carte_grise` varchar(255) DEFAULT NULL,
  `observations` varchar(255) DEFAULT NULL,
  `prix_achat` double DEFAULT NULL,
  `source_financement` varchar(255) DEFAULT NULL,
  `statut` enum('DISPONIBLE','EN_MAINTENANCE','EN_MISSION','EN_PANNE','REMIS','RETIRE') DEFAULT NULL,
  `type` enum('AUTRE','CAMION','MINIBUS','MOTO','VOITURE') NOT NULL,
  `conducteur_id` int DEFAULT NULL,
  `conducteur_booklet_id` bigint DEFAULT NULL,
  `district_id` int DEFAULT NULL,
  `region_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK77hmgqa9jiislwjo63bn093rf` (`immatriculation`),
  KEY `FK4gisacpb5yoblsivmprjo6l8j` (`conducteur_id`),
  KEY `FKh09rbnj2vmlwh117k9cyxdcjj` (`conducteur_booklet_id`),
  KEY `FK6cmjbq7ip1e3jnvtqhakj1yt4` (`district_id`),
  KEY `FKaw4n4cl5jtjau378v215lborw` (`region_id`),
  CONSTRAINT `FK4gisacpb5yoblsivmprjo6l8j` FOREIGN KEY (`conducteur_id`) REFERENCES `persons` (`id`),
  CONSTRAINT `FK6cmjbq7ip1e3jnvtqhakj1yt4` FOREIGN KEY (`district_id`) REFERENCES `districts` (`id`),
  CONSTRAINT `FKaw4n4cl5jtjau378v215lborw` FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`),
  CONSTRAINT `FKh09rbnj2vmlwh117k9cyxdcjj` FOREIGN KEY (`conducteur_booklet_id`) REFERENCES `booklets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicules`
--

LOCK TABLES `vehicules` WRITE;
/*!40000 ALTER TABLE `vehicules` DISABLE KEYS */;
/*!40000 ALTER TABLE `vehicules` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-19 13:28:28
