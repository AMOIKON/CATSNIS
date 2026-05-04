--CREATE DATABASE IF NOT EXISTS `catusnis`;

--USE `catusnis`;
-- 1. Désactiver les contraintes FK
SET FOREIGN_KEY_CHECKS = 0;

---------------------------------------

-- 3.Réactiver les contraintes FK
SET FOREIGN_KEY_CHECKS = 1;

----Create the regions tables
CREATE  TABLE IF NOT EXISTS regions (id INT  AUTO_INCREMENT PRIMARY KEY, region_name VARCHAR(255) NOT NULL);
----Create the districts tables
CREATE  TABLE IF NOT EXISTS districts (id INT  AUTO_INCREMENT PRIMARY KEY, district_name VARCHAR(255) NOT NULL, region_id INT NOT NULL, FOREIGN KEY (region_id) REFERENCES regions(id));
----Create the sites | health tables
CREATE  TABLE IF NOT EXISTS health (id INT AUTO_INCREMENT  PRIMARY KEY, health_name VARCHAR (255) NOT NULL, district_id INT NOT NULL, region_id INT NOT NULL,
FOREIGN KEY (district_id) REFERENCES districts(id), FOREIGN KEY (region_id) REFERENCES regions(id));
----Create the equipments types tables
CREATE  TABLE IF NOT EXISTS types (id INT AUTO_INCREMENT PRIMARY KEY, type_name VARCHAR(255) NOT NULL);
----Create the regions tables
CREATE TABLE IF NOT EXISTS acquisitions(id INT AUTO_INCREMENT PRIMARY KEY, image VARCHAR(255) NOT NULL, tag VARCHAR(255) NOT NULL, date_acquisition DATE NOT NULL, quantity INT NOT NULL, serial VARCHAR(255) NOT NULL,
types_id INT NOT NULL, FOREIGN KEY (types_id) REFERENCES types(id));
----Create the states après installations tables
CREATE TABLE IF NOT EXISTS states (id INT AUTO_INCREMENT PRIMARY KEY, states_names VARCHAR(255)NOT NULL);
----Create the distributions des equipements tables
CREATE TABLE IF NOT EXISTS deployment (id INT AUTO_INCREMENT PRIMARY KEY, code_dep VARCHAR(255) NOT NULL, date_recept DATE NOT NULL,
region_id INT NOT NULL, district_id INT NOT NULL, health_id INT NOT NULL, states_id INT NOT NULL, comment TEXT NOT NULL,
FOREIGN KEY (district_id) REFERENCES districts(id), FOREIGN KEY (region_id) REFERENCES regions(id),
FOREIGN KEY (health_id) REFERENCES health(id), FOREIGN KEY (states_id) REFERENCES states(id));

---
----Create the post of people tables
CREATE TABLE IF NOT EXISTS post (id INT AUTO_INCREMENT PRIMARY KEY, post_name VARCHAR(255) NOT NULL);
----Create the states of people tables
CREATE TABLE IF NOT EXISTS units (id INT AUTO_INCREMENT PRIMARY KEY, unit_name VARCHAR(255) NOT NULL);
----Create the person
CREATE TABLE IF NOT EXISTS person (id INT AUTO_INCREMENT PRIMARY KEY, first_name VARCHAR(255) NOT NULL, last_name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL, contact VARCHAR(255) NOT NULL,
post_id INT NOT NULL, units_id INT NOT NULL, FOREIGN KEY (post_id) REFERENCES post(id), FOREIGN KEY (units_id) REFERENCES units (id));
----Create the appreciation
CREATE TABLE IF NOT EXISTS appreciation  (id INT AUTO_INCREMENT PRIMARY KEY, appreciation_name VARCHAR(255) NOT NULL);
----Create the evaluation
CREATE TABLE IF NOT EXISTS evaluation  (id INT AUTO_INCREMENT PRIMARY KEY, evaluation_name VARCHAR(255) NOT NULL);
----Create the  apps
CREATE TABLE IF NOT EXISTS apps  (id INT AUTO_INCREMENT PRIMARY KEY, app_name VARCHAR(255) NOT NULL);
----Create the intervention
 CREATE TABLE IF NOT EXISTS partners (
     id           INT AUTO_INCREMENT PRIMARY KEY,
     partner_name VARCHAR(255) NOT NULL UNIQUE
 );












