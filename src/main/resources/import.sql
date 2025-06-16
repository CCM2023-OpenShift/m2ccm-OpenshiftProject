-- Équipements
INSERT INTO equipment (id, name, description, quantity, mobile, image_url)
SELECT *
FROM (VALUES (4, 'MacBook Pro', 'Ordinateur portable Apple', 10, true, ''),
             (5, 'Crayons de papier', 'Boîte de 12 crayons HB', 100, true, ''),
             (6, 'Imprimante', 'Imprimante laser noir et blanc', 2, false, ''),
             (7, 'Microphone', 'Microphone sans fil', 5, true, ''),
             (8, 'Caméra', 'Caméra HD pour enregistrement', 3, true, ''),
             (9, 'Clavier', 'Clavier mécanique USB', 15, true, ''),
             (10, 'Souris', 'Souris sans fil ergonomique', 15, true, ''),
             (11, 'Routeur Wi-Fi', 'Routeur Wi-Fi 6', 4, false, ''),
             (12, 'Tablette graphique', 'Pour dessin numérique', 6, true, ''),
             (13, 'Enceinte Bluetooth', 'Haut-parleur portable', 8, true, ''),
             (14, 'Ecran externe', 'Écran 24 pouces HDMI', 10, true, ''),
             (15, 'Scanner', 'Scanner A4 haute résolution', 2, false, ''),
             (16, 'Câble HDMI', 'Câble HDMI 2m', 20, true, ''),
             (17, 'Adaptateur USB-C', 'Multiport USB-C vers HDMI/USB', 12, true, ''),
             (18, 'Chaises ergonomiques', 'Chaise de bureau ajustable', 30, false, ''),
             (19, 'Chargeurs universels', 'Chargeurs pour ordinateurs portables', 10, true, ''),
             (20, 'Tapis de souris', 'Tapis ergonomique', 25, true, ''),
             (21, 'Lampe de bureau', 'Lampe LED avec variateur', 10, true, ''),
             (22, 'Casques audio', 'Casque stéréo avec micro', 10, true, ''),
             (23, 'Station de recharge', 'Station multi-usb', 3, false,
              '')) AS vals(id, name, description, quantity, mobile, image_url)
WHERE NOT EXISTS (SELECT 1 FROM equipment);

-- Salles
INSERT INTO room (id, name, capacity, building, floor, type, image_url)
SELECT *
FROM (VALUES (1, 'A001', 30, 'A', 'RDC', 'STANDARD', ''),
             (2, 'D101', 25, 'D', '1er', 'MULTIMEDIA', ''),
             (3, 'B201', 15, 'B', '2e', 'REUNION', ''),
             (4, 'C101', 40, 'C', '1er', 'MULTIMEDIA', ''),
             (5, 'F303', 20, 'F', '3e', 'LABORATOIRE', ''),
             (6, 'G202', 35, 'G', '2e', 'STANDARD', ''),
             (7, 'H101', 10, 'H', '1er', 'COWORKING', ''),
             (8, 'J204', 50, 'J', '2e', 'AMPHI', ''),
             (9, 'K301', 15, 'K', '3e', 'REUNION', ''),
             (10, 'L102', 40, 'L', '1er', 'INFORMATIQUE',
              '')) AS vals(id, name, capacity, building, floor, type, image_url)
WHERE NOT EXISTS (SELECT 1 FROM room);

-- Liens Room - Equipment
INSERT INTO room_equipment (room_id, equipment_id, quantity)
SELECT *
FROM (VALUES (3, 6, 1),
             (9, 15, 1),
             (5, 11, 1),
             (8, 18, 20),
             (2, 23, 1),
             (5, 23, 1),
             (10, 23, 1),
             (2, 4, 8),
             (10, 4, 15),
             (10, 9, 15),
             (10, 10, 15),
             (7, 13, 2),
             (4, 8, 2),
             (4, 7, 2)) AS vals(room_id, equipment_id, quantity)
WHERE NOT EXISTS (SELECT 1 FROM room_equipment);

-- Réservations
INSERT INTO booking (title, start_time, end_time, attendees, organizer, room_id)
SELECT *
FROM (VALUES ('Cours de remédiation informatique', CURRENT_DATE - INTERVAL '10 days' + TIME '09:00',
              CURRENT_DATE - INTERVAL '10 days' + TIME '11:00', 12, 'Alice Dupuis', 6),
             ('Réunion de coordination pédagogique', CURRENT_DATE - INTERVAL '3 days' + TIME '14:00',
              CURRENT_DATE - INTERVAL '3 days' + TIME '16:00', 10, 'Jean Roy', 3),
             ('Présentation de projet étudiant', CURRENT_DATE - INTERVAL '3 days' + TIME '09:00',
              CURRENT_DATE - INTERVAL '3 days' + TIME '10:30', 6, 'Carla Meunier', 1),
             ('Réunion budgétaire départementale', CURRENT_DATE - INTERVAL '3 days' + TIME '11:00',
              CURRENT_DATE - INTERVAL '3 days' + TIME '12:00', 14, 'Marc Petit', 4),
             ('Brief du personnel enseignant', CURRENT_DATE - INTERVAL '7 days' + TIME '08:00',
              CURRENT_DATE - INTERVAL '7 days' + TIME '09:30', 9, 'Valérie Giraud', 7),
             ('Séance photo pour l annuaire', CURRENT_DATE - INTERVAL '10 days' + TIME '11:30',
              CURRENT_DATE - INTERVAL '10 days' + TIME '13:00', 5, 'Julien Besson', 9),
             ('Enregistrement de capsule pédagogique', CURRENT_DATE - INTERVAL '10 days' + TIME '14:00',
              CURRENT_DATE - INTERVAL '10 days' + TIME '16:00', 4, 'Nina Dufour', 5),
             ('Cours intensif Python – Licence 2', CURRENT_DATE + TIME '08:30', CURRENT_DATE + TIME '11:30', 18,
              'Lucie Morel', 2),
             ('Réunion de l équipe enseignante', CURRENT_DATE + TIME '15:00', CURRENT_DATE + TIME '16:30', 8,
              'David Colin', 7),
             ('Essai de matériel audiovisuel', CURRENT_DATE + TIME '09:00', CURRENT_DATE + TIME '10:00', 6,
              'Sandra Muller', 3),
             ('Soutenance de projet de groupe', CURRENT_DATE + TIME '11:00', CURRENT_DATE + TIME '12:00', 20,
              'Olivier Henry', 8),
             ('Révision du planning de cours', CURRENT_DATE + TIME '13:00', CURRENT_DATE + TIME '13:45', 2,
              'Bruno Klein', 6),
             ('Atelier de design graphique', CURRENT_DATE + TIME '14:00', CURRENT_DATE + TIME '15:30', 12,
              'Anna Blanchard', 4),
             ('Réunion administrative rapide', CURRENT_DATE + TIME '17:00', CURRENT_DATE + TIME '17:30', 5,
              'Camille Faure', 10),
             ('Séminaire cybersécurité – Master 1', CURRENT_DATE + INTERVAL '5 days' + TIME '10:00',
              CURRENT_DATE + INTERVAL '5 days' + TIME '12:30', 15, 'Nathalie Vasseur', 9),
             ('Hackathon Intelligence Artificielle', CURRENT_DATE + INTERVAL '15 days' + TIME '09:00',
              CURRENT_DATE + INTERVAL '15 days' + TIME '18:00', 45, 'Eric Besson', 8),
             ('Journée portes ouvertes - anciens élèves', CURRENT_DATE + INTERVAL '1 month' + TIME '10:00',
              CURRENT_DATE + INTERVAL '1 month' + TIME '16:00', 40, 'Claire Thibault', 10),
             ('Conférence sur l expérience utilisateur', CURRENT_DATE + INTERVAL '1 month' + TIME '09:00',
              CURRENT_DATE + INTERVAL '1 month' + TIME '11:00', 20, 'Mélanie Robert', 5),
             ('Coaching étudiant – développement personnel', CURRENT_DATE + INTERVAL '5 days' + TIME '14:00',
              CURRENT_DATE + INTERVAL '5 days' + TIME '16:00', 10, 'Paul Lambert', 2),
             ('Démo technique – club innovation', CURRENT_DATE + INTERVAL '5 days' + TIME '09:00',
              CURRENT_DATE + INTERVAL '5 days' + TIME '09:45', 4, 'Sophie Aubry', 6),
             ('Rencontre inter-filières', CURRENT_DATE + INTERVAL '15 days' + TIME '14:00',
              CURRENT_DATE + INTERVAL '15 days' + TIME '16:00', 35, 'Jean-Marc Noël', 4),
             ('Atelier développement Web', CURRENT_DATE + INTERVAL '2 days' + TIME '13:00',
              CURRENT_DATE + INTERVAL '2 days' + TIME '17:00', 15, 'm0rd0rian', 10),
             ('Démonstration outils cybersécurité', CURRENT_DATE + INTERVAL '7 days' + TIME '09:00',
              CURRENT_DATE + INTERVAL '7 days' + TIME '12:00', 12, 'm0rd0rian', 5),
             ('Réunion projet frontend', CURRENT_DATE + INTERVAL '3 days' + TIME '10:00',
              CURRENT_DATE + INTERVAL '3 days' + TIME '11:30', 8, 'm0rd0rian', 7),
             ('Formation React avancé', CURRENT_DATE + INTERVAL '10 days' + TIME '09:00',
              CURRENT_DATE + INTERVAL '10 days' + TIME '17:00', 20, 'm0rd0rian', 2),
             ('Test rappel 1h', CURRENT_TIMESTAMP + INTERVAL '1 hour', CURRENT_TIMESTAMP + INTERVAL '2 hours', 5,
              'm0rd0rian', 3),
             ('Test rappel 24h', CURRENT_TIMESTAMP + INTERVAL '24 hours', CURRENT_TIMESTAMP + INTERVAL '25 hours', 10,
              'admin.univ', 5),
             ('Réunion importante', CURRENT_TIMESTAMP + INTERVAL '24 hours', CURRENT_TIMESTAMP + INTERVAL '26 hours', 8,
              'm0rd0rian', 8)) AS vals(title, start_time, end_time, attendees, organizer, room_id)
WHERE NOT EXISTS (SELECT 1 FROM booking);

-- Réservations d'équipements
INSERT INTO booking_equipment (equipment_id, start_time, end_time, quantity, booking_id)
SELECT *
FROM (VALUES (4, CURRENT_DATE - INTERVAL '10 days' + TIME '08:45', CURRENT_DATE - INTERVAL '10 days' + TIME '11:15', 6,
              1),
             (8, CURRENT_DATE - INTERVAL '3 days' + TIME '08:30', CURRENT_DATE - INTERVAL '3 days' + TIME '10:45', 1,
              3),
             (7, CURRENT_DATE - INTERVAL '3 days' + TIME '08:30', CURRENT_DATE - INTERVAL '3 days' + TIME '10:45', 2,
              3),
             (8, CURRENT_DATE - INTERVAL '10 days' + TIME '11:00', CURRENT_DATE - INTERVAL '10 days' + TIME '13:30', 2,
              6),
             (7, CURRENT_DATE - INTERVAL '10 days' + TIME '13:45', CURRENT_DATE - INTERVAL '10 days' + TIME '16:15', 2,
              7),
             (22, CURRENT_DATE - INTERVAL '10 days' + TIME '13:45', CURRENT_DATE - INTERVAL '10 days' + TIME '16:15', 3,
              7),
             (4, CURRENT_DATE + TIME '08:15', CURRENT_DATE + TIME '11:45', 8, 8),
             (8, CURRENT_DATE + TIME '08:45', CURRENT_DATE + TIME '10:15', 1, 10),
             (7, CURRENT_DATE + TIME '08:45', CURRENT_DATE + TIME '10:15', 1, 10),
             (14, CURRENT_DATE + TIME '10:30', CURRENT_DATE + TIME '12:15', 2, 11),
             (17, CURRENT_DATE + TIME '10:30', CURRENT_DATE + TIME '12:15', 2, 11),
             (12, CURRENT_DATE + TIME '13:30', CURRENT_DATE + TIME '15:45', 5, 13),
             (5, CURRENT_DATE + TIME '13:30', CURRENT_DATE + TIME '15:45', 20, 13),
             (22, CURRENT_DATE + INTERVAL '5 days' + TIME '09:30', CURRENT_DATE + INTERVAL '5 days' + TIME '12:45', 5,
              15),
             (10, CURRENT_DATE + INTERVAL '5 days' + TIME '09:30', CURRENT_DATE + INTERVAL '5 days' + TIME '12:45', 5,
              15),
             (4, CURRENT_DATE + INTERVAL '15 days' + TIME '08:00', CURRENT_DATE + INTERVAL '15 days' + TIME '18:30', 10,
              16),
             (22, CURRENT_DATE + INTERVAL '15 days' + TIME '08:00', CURRENT_DATE + INTERVAL '15 days' + TIME '18:30', 6,
              16),
             (7, CURRENT_DATE + INTERVAL '1 month' + TIME '08:30', CURRENT_DATE + INTERVAL '1 month' + TIME '11:15', 1,
              18),
             (14, CURRENT_DATE + INTERVAL '1 month' + TIME '08:30', CURRENT_DATE + INTERVAL '1 month' + TIME '11:15', 1,
              18),
             (4, CURRENT_DATE + INTERVAL '5 days' + TIME '08:30', CURRENT_DATE + INTERVAL '5 days' + TIME '10:00', 3,
              20),
             (16, CURRENT_DATE + INTERVAL '5 days' + TIME '08:30', CURRENT_DATE + INTERVAL '5 days' + TIME '10:00', 3,
              20),
             (4, CURRENT_DATE + INTERVAL '2 days' + TIME '12:45', CURRENT_DATE + INTERVAL '2 days' + TIME '17:15', 10,
              22),
             (9, CURRENT_DATE + INTERVAL '2 days' + TIME '12:45', CURRENT_DATE + INTERVAL '2 days' + TIME '17:15', 10,
              22),
             (10, CURRENT_DATE + INTERVAL '2 days' + TIME '12:45', CURRENT_DATE + INTERVAL '2 days' + TIME '17:15', 10,
              22),
             (8, CURRENT_DATE + INTERVAL '7 days' + TIME '08:45', CURRENT_DATE + INTERVAL '7 days' + TIME '12:15', 2,
              23),
             (7, CURRENT_DATE + INTERVAL '7 days' + TIME '08:45', CURRENT_DATE + INTERVAL '7 days' + TIME '12:15', 3,
              23),
             (13, CURRENT_DATE + INTERVAL '3 days' + TIME '09:45', CURRENT_DATE + INTERVAL '3 days' + TIME '11:45', 2,
              24),
             (4, CURRENT_DATE + INTERVAL '10 days' + TIME '08:45', CURRENT_DATE + INTERVAL '10 days' + TIME '17:15', 15,
              25),
             (9, CURRENT_DATE + INTERVAL '10 days' + TIME '08:45', CURRENT_DATE + INTERVAL '10 days' + TIME '17:15', 15,
              25),
             (10, CURRENT_DATE + INTERVAL '10 days' + TIME '08:45', CURRENT_DATE + INTERVAL '10 days' + TIME '17:15',
              15, 25)) AS vals(equipment_id, start_time, end_time, quantity, booking_id)
WHERE NOT EXISTS (SELECT 1 FROM booking_equipment);

-- Notifications
INSERT INTO sent_notifications (booking_id, notification_type, sent_at, organizer_email, title, message, read, deleted)
VALUES
    (22, '24h', '2025-06-15 13:00:00', 'admin@example.com', 'Rappel: Votre réservation demain', 'Votre réservation "Atelier développement Web" dans la salle L102 est prévue demain.', false, false),
    (23, '24h', '2025-06-16 09:00:00', 'admin@example.com', 'Rappel: Votre réservation demain', 'Votre réservation "Démonstration outils cybersécurité" dans la salle B201 est prévue demain.', false, false),
    (24, '24h', '2025-06-14 10:00:00', 'admin@example.com', 'Rappel: Votre réservation demain', 'Votre réservation "Réunion projet frontend" dans la salle D101 est prévue demain.', false, false),
    (26, '1h', CURRENT_TIMESTAMP - INTERVAL '5 minutes', 'admin@example.com', 'Votre réservation commence bientôt', 'Votre réservation "Test rappel 1h" dans la salle B201 commence dans moins dune heure.', false, false);

-- Mise à jour de la séquence pour les IDs
SELECT setval('sent_notifications_id_seq', (SELECT COALESCE(MAX(id), 0) FROM sent_notifications));

-- Met à jour la séquence de la table room
SELECT setval('room_id_seq', (SELECT COALESCE(MAX(id), 0) FROM room));

-- Met à jour la séquence de la table equipment
SELECT setval('equipment_id_seq', (SELECT COALESCE(MAX(id), 0) FROM equipment));

-- Met à jour la séquence de la table room_equipment
SELECT setval('room_equipment_id_seq', (SELECT COALESCE(MAX(id), 0) FROM room_equipment));

-- Met à jour la séquence de la table booking
SELECT setval('booking_id_seq', (SELECT COALESCE(MAX(id), 0) FROM booking));

-- Met à jour la séquence de la table booking_equipment
SELECT setval('booking_equipment_id_seq', (SELECT COALESCE(MAX(id), 0) FROM booking_equipment));