-- MySQL dump 10.13  Distrib 8.0.42, for Linux (x86_64)
--
-- Host: localhost    Database: web_db
-- ------------------------------------------------------
-- Server version	8.0.42-0ubuntu0.22.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `thesis_id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `date` date DEFAULT NULL,
  `time` time DEFAULT NULL,
  `type` enum('onsite','online') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `location_or_link` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`),
  KEY `thesis_id` (`thesis_id`),
  CONSTRAINT `announcements_ibfk_1` FOREIGN KEY (`thesis_id`) REFERENCES `theses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcements`
--

LOCK TABLES `announcements` WRITE;
/*!40000 ALTER TABLE `announcements` DISABLE KEYS */;
INSERT INTO `announcements` VALUES (1,1,'Παρουσίαση Διπλωματικής Γιάννη Δοε','2025-07-10','12:00:00','onsite','Αίθουσα 2');
/*!40000 ALTER TABLE `announcements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attachments`
--

DROP TABLE IF EXISTS `attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attachments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `thesis_id` int NOT NULL,
  `file_type` enum('draft','final','supporting') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `url_or_path` text COLLATE utf8mb4_general_ci,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `thesis_id` (`thesis_id`),
  CONSTRAINT `attachments_ibfk_1` FOREIGN KEY (`thesis_id`) REFERENCES `theses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attachments`
--

LOCK TABLES `attachments` WRITE;
/*!40000 ALTER TABLE `attachments` DISABLE KEYS */;
INSERT INTO `attachments` VALUES (1,1,'draft','files/drafts/project_v1.pdf','2025-07-05 12:41:12'),(2,1,'final','files/final/final_version.pdf','2025-07-05 12:41:12'),(3,1,'supporting','files/data/dataset.csv','2025-07-05 12:41:12');
/*!40000 ALTER TABLE `attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `committee_members`
--

DROP TABLE IF EXISTS `committee_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `committee_members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `thesis_id` int NOT NULL,
  `teacher_id` int NOT NULL,
  `role` enum('main','member') COLLATE utf8mb4_general_ci DEFAULT 'member',
  `accepted` tinyint(1) DEFAULT '0',
  `invited_at` datetime DEFAULT NULL,
  `responded_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `thesis_id` (`thesis_id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `committee_members_ibfk_1` FOREIGN KEY (`thesis_id`) REFERENCES `theses` (`id`),
  CONSTRAINT `committee_members_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `committee_members`
--

LOCK TABLES `committee_members` WRITE;
/*!40000 ALTER TABLE `committee_members` DISABLE KEYS */;
INSERT INTO `committee_members` VALUES (1,1,3,'main',1,'2025-07-05 15:41:12','2025-07-05 15:41:12'),(2,1,4,'member',1,'2025-07-05 15:41:12','2025-07-05 15:41:12'),(3,1,5,'member',1,'2025-07-05 15:41:12','2025-07-05 15:41:12');
/*!40000 ALTER TABLE `committee_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `grades`
--

DROP TABLE IF EXISTS `grades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grades` (
  `id` int NOT NULL AUTO_INCREMENT,
  `thesis_id` int NOT NULL,
  `teacher_id` int NOT NULL,
  `score` decimal(4,2) DEFAULT NULL,
  `criterion1` text COLLATE utf8mb4_general_ci,
  `criterion2` text COLLATE utf8mb4_general_ci,
  `criterion3` text COLLATE utf8mb4_general_ci,
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `thesis_id` (`thesis_id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `grades_ibfk_1` FOREIGN KEY (`thesis_id`) REFERENCES `theses` (`id`),
  CONSTRAINT `grades_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grades`
--

LOCK TABLES `grades` WRITE;
/*!40000 ALTER TABLE `grades` DISABLE KEYS */;
INSERT INTO `grades` VALUES (1,1,3,9.50,'Καλή δομή','Πλήρης λειτουργικότητα','Καλή τεκμηρίωση','2025-07-05 12:41:12'),(2,1,4,8.70,'Καλή παρουσίαση','Συμμετοχή σε υλοποίηση','Ποιότητα κώδικα','2025-07-05 12:41:12'),(3,1,5,9.00,'Καλή ιδέα','Καινοτομία','Εφαρμοσιμότητα','2025-07-05 12:41:12');
/*!40000 ALTER TABLE `grades` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `presentations`
--

DROP TABLE IF EXISTS `presentations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `presentations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `thesis_id` int NOT NULL,
  `date` date DEFAULT NULL,
  `time` time DEFAULT NULL,
  `place_or_link` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`),
  KEY `thesis_id` (`thesis_id`),
  CONSTRAINT `presentations_ibfk_1` FOREIGN KEY (`thesis_id`) REFERENCES `theses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `presentations`
--

LOCK TABLES `presentations` WRITE;
/*!40000 ALTER TABLE `presentations` DISABLE KEYS */;
INSERT INTO `presentations` VALUES (1,1,'2025-07-10','12:00:00','Αίθουσα 2, Τμήμα Υλικών');
/*!40000 ALTER TABLE `presentations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `user_id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `surname` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_general_ci,
  `phone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `mobile` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `students_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES (1,'Γιάννης','Δοε','Πάτρα, Αγίου Ανδρέου 1','2610000000','6944000000'),(2,'Μαρία','Νίκα','Αθήνα, Σόλωνος 50','2101111111','6944111111');
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teachers`
--

DROP TABLE IF EXISTS `teachers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teachers` (
  `user_id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `surname` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `department` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `teachers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teachers`
--

LOCK TABLES `teachers` WRITE;
/*!40000 ALTER TABLE `teachers` DISABLE KEYS */;
INSERT INTO `teachers` VALUES (3,'Νίκος','Σμιθ','Τμήμα Υλικών'),(4,'Άννα','Παπαδοπούλου','Τμήμα Πληροφορικής'),(5,'Κατερίνα','Γεωργίου','Τμήμα Μηχανικών Η/Υ');
/*!40000 ALTER TABLE `teachers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `theses`
--

DROP TABLE IF EXISTS `theses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `theses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `topic_id` int NOT NULL,
  `status` enum('under_assignment','active','under_review','completed','cancelled') COLLATE utf8mb4_general_ci DEFAULT 'under_assignment',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `final_repo_link` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `topic_id` (`topic_id`),
  CONSTRAINT `theses_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`user_id`),
  CONSTRAINT `theses_ibfk_2` FOREIGN KEY (`topic_id`) REFERENCES `thesis_topics` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `theses`
--

LOCK TABLES `theses` WRITE;
/*!40000 ALTER TABLE `theses` DISABLE KEYS */;
INSERT INTO `theses` VALUES (1,1,1,'active','2025-07-05 12:41:12','https://github.com/example/project');
/*!40000 ALTER TABLE `theses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `thesis_notes`
--

DROP TABLE IF EXISTS `thesis_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `thesis_notes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `thesis_id` int NOT NULL,
  `teacher_id` int NOT NULL,
  `note_text` varchar(300) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `thesis_id` (`thesis_id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `thesis_notes_ibfk_1` FOREIGN KEY (`thesis_id`) REFERENCES `theses` (`id`),
  CONSTRAINT `thesis_notes_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `thesis_notes`
--

LOCK TABLES `thesis_notes` WRITE;
/*!40000 ALTER TABLE `thesis_notes` DISABLE KEYS */;
INSERT INTO `thesis_notes` VALUES (1,1,3,'Πρόσεχε τις ημερομηνίες παραδοτέων.','2025-07-05 12:41:12'),(2,1,4,'Καλή πρόοδος, να συνεχιστεί έτσι.','2025-07-05 12:41:12');
/*!40000 ALTER TABLE `thesis_notes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `thesis_topics`
--

DROP TABLE IF EXISTS `thesis_topics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `thesis_topics` (
  `id` int NOT NULL AUTO_INCREMENT,
  `teacher_id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `summary` text COLLATE utf8mb4_general_ci,
  `description_file` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `thesis_topics_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `thesis_topics`
--

LOCK TABLES `thesis_topics` WRITE;
/*!40000 ALTER TABLE `thesis_topics` DISABLE KEYS */;
INSERT INTO `thesis_topics` VALUES (1,3,'Ανάπτυξη Web Εφαρμογής','Σύστημα υποστήριξης διπλωματικών εργασιών',NULL,'2025-07-05 12:41:12');
/*!40000 ALTER TABLE `thesis_topics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `role` enum('student','teacher','admin') COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'johndoe','hash1','student','john@example.com'),(2,'maria92','hash2','student','maria@example.com'),(3,'profsmith','hash3','teacher','smith@example.com'),(4,'profanna','hash4','teacher','anna@example.com'),(5,'profkaterina','hash5','teacher','katerina@example.com'),(6,'admin','adminhash','admin','admin@uni.gr');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-05 15:45:12
