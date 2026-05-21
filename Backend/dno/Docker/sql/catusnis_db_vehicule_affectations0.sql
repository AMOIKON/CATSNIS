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
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-19 13:22:31
