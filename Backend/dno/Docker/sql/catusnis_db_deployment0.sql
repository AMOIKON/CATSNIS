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
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-19 13:22:34
