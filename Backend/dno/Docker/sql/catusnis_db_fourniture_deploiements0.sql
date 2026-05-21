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
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-19 13:22:31
