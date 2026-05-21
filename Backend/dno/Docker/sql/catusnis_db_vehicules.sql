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

-- Dump completed on 2026-05-19 13:17:28
