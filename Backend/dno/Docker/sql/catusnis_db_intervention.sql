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
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-19 13:17:27
