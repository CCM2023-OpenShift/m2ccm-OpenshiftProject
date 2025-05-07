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
INSERT INTO booking (title, start_time, end_time, attendees, organizer, room_id)
VALUES
    ('Workshop rétro', CURRENT_DATE - INTERVAL '10 days' + TIME '09:00', CURRENT_DATE - INTERVAL '10 days' + TIME '11:00', 12, 'Alice Dupuis', 6),
    ('Réunion bilan', CURRENT_DATE - INTERVAL '3 days' + TIME '14:00', CURRENT_DATE - INTERVAL '3 days' + TIME '16:00', 10, 'Jean Roy', 3),
    ('Démo produit', CURRENT_DATE - INTERVAL '3 days' + TIME '09:00', CURRENT_DATE - INTERVAL '3 days' + TIME '10:30', 6, 'Carla Meunier', 1),
    ('Présentation budget', CURRENT_DATE - INTERVAL '3 days' + TIME '11:00', CURRENT_DATE - INTERVAL '3 days' + TIME '12:00', 14, 'Marc Petit', 4),
    ('Brief RH', CURRENT_DATE - INTERVAL '7 days' + TIME '08:00', CURRENT_DATE - INTERVAL '7 days' + TIME '09:30', 9, 'Valérie Giraud', 7),
    ('Séance photo', CURRENT_DATE - INTERVAL '10 days' + TIME '11:30', CURRENT_DATE - INTERVAL '10 days' + TIME '13:00', 5, 'Julien Besson', 9),
    ('Enregistrement podcast', CURRENT_DATE - INTERVAL '10 days' + TIME '14:00', CURRENT_DATE - INTERVAL '10 days' + TIME '16:00', 4, 'Nina Dufour', 5);

INSERT INTO booking (title, start_time, end_time, attendees, organizer, room_id)
VALUES
    ('Formation Python', CURRENT_DATE + TIME '08:30', CURRENT_DATE + TIME '11:30', 18, 'Lucie Morel', 2),
    ('Réunion pédagogique', CURRENT_DATE + TIME '15:00', CURRENT_DATE + TIME '16:30', 8, 'David Colin', 7),
    ('Test matériel', CURRENT_DATE + TIME '09:00', CURRENT_DATE + TIME '10:00', 6, 'Sandra Muller', 3),
    ('Présentation projet X', CURRENT_DATE + TIME '11:00', CURRENT_DATE + TIME '12:00', 20, 'Olivier Henry', 8),
    ('Consultation planning', CURRENT_DATE + TIME '13:00', CURRENT_DATE + TIME '13:45', 2, 'Bruno Klein', 6),
    ('Atelier graphisme', CURRENT_DATE + TIME '14:00', CURRENT_DATE + TIME '15:30', 12, 'Anna Blanchard', 4),
    ('Réunion express', CURRENT_DATE + TIME '17:00', CURRENT_DATE + TIME '17:30', 5, 'Camille Faure', 10);

INSERT INTO booking (title, start_time, end_time, attendees, organizer, room_id)
VALUES
    ('Séminaire cybersécurité', CURRENT_DATE + INTERVAL '5 days' + TIME '10:00', CURRENT_DATE + INTERVAL '5 days' + TIME '12:30', 15, 'Nathalie Vasseur', 9),
    ('Hackathon IA', CURRENT_DATE + INTERVAL '15 days' + TIME '09:00', CURRENT_DATE + INTERVAL '15 days' + TIME '18:00', 45, 'Eric Besson', 8),
    ('Journée des anciens', CURRENT_DATE + INTERVAL '1 month' + TIME '10:00', CURRENT_DATE + INTERVAL '1 month' + TIME '16:00', 40, 'Claire Thibault', 10),
    ('Conférence UX', CURRENT_DATE + INTERVAL '1 month' + TIME '09:00', CURRENT_DATE + INTERVAL '1 month' + TIME '11:00', 20, 'Mélanie Robert', 5),
    ('Coaching dev perso', CURRENT_DATE + INTERVAL '5 days' + TIME '14:00', CURRENT_DATE + INTERVAL '5 days' + TIME '16:00', 10, 'Paul Lambert', 2),
    ('Démonstration produit', CURRENT_DATE + INTERVAL '5 days' + TIME '09:00', CURRENT_DATE + INTERVAL '5 days' + TIME '09:45', 4, 'Sophie Aubry', 6),
    ('Rencontre inter-départements', CURRENT_DATE + INTERVAL '15 days' + TIME '14:00', CURRENT_DATE + INTERVAL '15 days' + TIME '16:00', 35, 'Jean-Marc Noël', 4);

-- Met à jour la séquence de la table room
SELECT setval('room_id_seq', (SELECT MAX(id) FROM room));

-- Met à jour la séquence de la table equipment
SELECT setval('equipment_id_seq', (SELECT MAX(id) FROM equipment));

-- Met à jour la séquence de la table equipment
SELECT setval('room_equipment_id_seq', (SELECT MAX(id) FROM room_equipment));

-- Met à jour la séquence de la table equipment
SELECT setval('booking_id_seq', (SELECT MAX(id) FROM booking));