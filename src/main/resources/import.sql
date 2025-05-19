-- Équipements
INSERT INTO equipment (id, name, description, quantity, mobile) VALUES (4, 'MacBook Pro', 'Ordinateur portable Apple', 10, true);
INSERT INTO equipment (id, name, description, quantity, mobile) VALUES (5, 'Crayons de papier', 'Boîte de 12 crayons HB', 100, true);
INSERT INTO equipment (id, name, description, quantity, mobile) VALUES (6, 'Imprimante', 'Imprimante laser noir et blanc', 2, false);
INSERT INTO equipment (id, name, description, quantity, mobile) VALUES (7, 'Microphone', 'Microphone sans fil', 5, true);
INSERT INTO equipment (id, name, description, quantity, mobile) VALUES (8, 'Caméra', 'Caméra HD pour enregistrement', 3, true);
INSERT INTO equipment (id, name, description, quantity, mobile) VALUES (9, 'Clavier', 'Clavier mécanique USB', 15, true);
INSERT INTO equipment (id, name, description, quantity, mobile) VALUES (10, 'Souris', 'Souris sans fil ergonomique', 15, true);
INSERT INTO equipment (id, name, description, quantity, mobile) VALUES (11, 'Routeur Wi-Fi', 'Routeur Wi-Fi 6', 4, false);
INSERT INTO equipment (id, name, description, quantity, mobile) VALUES (12, 'Tablette graphique', 'Pour dessin numérique', 6, true);
INSERT INTO equipment (id, name, description, quantity, mobile) VALUES (13, 'Enceinte Bluetooth', 'Haut-parleur portable', 8, true);
INSERT INTO equipment (id, name, description, quantity, mobile) VALUES (14, 'Ecran externe', 'Écran 24 pouces HDMI', 10, true);
INSERT INTO equipment (id, name, description, quantity, mobile) VALUES (15, 'Scanner', 'Scanner A4 haute résolution', 2, false);
INSERT INTO equipment (id, name, description, quantity, mobile) VALUES (16, 'Câble HDMI', 'Câble HDMI 2m', 20, true);
INSERT INTO equipment (id, name, description, quantity, mobile) VALUES (17, 'Adaptateur USB-C', 'Multiport USB-C vers HDMI/USB', 12, true);
INSERT INTO equipment (id, name, description, quantity, mobile) VALUES (18, 'Chaises ergonomiques', 'Chaise de bureau ajustable', 30, false);
INSERT INTO equipment (id, name, description, quantity, mobile) VALUES (19, 'Chargeurs universels', 'Chargeurs pour ordinateurs portables', 10, true);
INSERT INTO equipment (id, name, description, quantity, mobile) VALUES (20, 'Tapis de souris', 'Tapis ergonomique', 25, true);
INSERT INTO equipment (id, name, description, quantity, mobile) VALUES (21, 'Lampe de bureau', 'Lampe LED avec variateur', 10, true);
INSERT INTO equipment (id, name, description, quantity, mobile) VALUES (22, 'Casques audio', 'Casque stéréo avec micro', 10, true);
INSERT INTO equipment (id, name, description, quantity, mobile) VALUES (23, 'Station de recharge', 'Station multi-usb', 3, false);

-- Salles
INSERT INTO room (id, name, capacity) VALUES (1, 'A001', 30);
INSERT INTO room (id, name, capacity) VALUES (2, 'D101', 25);
INSERT INTO room (id, name, capacity) VALUES (3, 'B201', 15);
INSERT INTO room (id, name, capacity) VALUES (4, 'C101', 40);
INSERT INTO room (id, name, capacity) VALUES (5, 'F303', 20);
INSERT INTO room (id, name, capacity) VALUES (6, 'G202', 35);
INSERT INTO room (id, name, capacity) VALUES (7, 'H101', 10);
INSERT INTO room (id, name, capacity) VALUES (8, 'J204', 50);
INSERT INTO room (id, name, capacity) VALUES (9, 'K301', 15);
INSERT INTO room (id, name, capacity) VALUES (10, 'L102', 40);

-- Liens Room - Equipment
INSERT INTO room_equipment (id, room_id, equipment_id, quantity) VALUES (6, 3, 6, 1);  -- Imprimante
INSERT INTO room_equipment (id, room_id, equipment_id, quantity) VALUES (13, 9, 15, 1); -- Scanner
INSERT INTO room_equipment (id, room_id, equipment_id, quantity) VALUES (16, 5, 11, 1); -- Routeur Wi-Fi
INSERT INTO room_equipment (id, room_id, equipment_id, quantity) VALUES (17, 8, 18, 20); -- Chaises ergonomiques
INSERT INTO room_equipment (id, room_id, equipment_id, quantity) VALUES (18, 2, 23, 1); -- Station de recharge
INSERT INTO room_equipment (id, room_id, equipment_id, quantity) VALUES (18, 5, 23, 1); -- Station de recharge
INSERT INTO room_equipment (id, room_id, equipment_id, quantity) VALUES (18, 10, 23, 1); -- Station de recharge

-- Réservations
INSERT INTO booking (id, title, start_time, end_time, attendees, organizer, room_id)
VALUES (1, 'Conférence sur IA', '2025-06-10 09:00:00', '2025-06-10 12:00:00', 50, 'Prof. Dupont', 8);  -- Réservation de la salle J204

INSERT INTO booking (id, title, start_time, end_time, attendees, organizer, room_id)
VALUES (2, 'Séminaire sur le développement durable', '2025-06-11 14:00:00', '2025-06-11 17:00:00', 30, 'Mme. Lefèvre', 1);  -- Réservation de la salle A001

INSERT INTO booking (id, title, start_time, end_time, attendees, organizer, room_id)
VALUES (3, 'Cours de programmation', '2025-06-12 08:00:00', '2025-06-12 10:00:00', 20, 'M. Durand', 2);  -- Réservation de la salle D101

INSERT INTO booking (id, title, start_time, end_time, attendees, organizer, room_id)
VALUES (4, 'Réunion administrative', '2025-06-15 10:00:00', '2025-06-15 12:00:00', 15, 'Dr. Martin', 3);  -- Réservation de la salle B201

INSERT INTO booking (id, title, start_time, end_time, attendees, organizer, room_id)
VALUES (5, 'Atelier création de projets', '2025-06-17 13:00:00', '2025-06-17 16:00:00', 25, 'Mme. Lemoine', 4);  -- Réservation de la salle C101

-- Met à jour la séquence de la table room
SELECT setval('room_id_seq', (SELECT MAX(id) FROM room));

-- Met à jour la séquence de la table equipment
SELECT setval('equipment_id_seq', (SELECT MAX(id) FROM equipment));

-- Met à jour la séquence de la table equipment
SELECT setval('room_equipment_id_seq', (SELECT MAX(id) FROM room_equipment));

-- Met à jour la séquence de la table equipment
SELECT setval('booking_id_seq', (SELECT MAX(id) FROM booking));