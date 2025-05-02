-- Équipements
INSERT INTO equipment (id, name, description) VALUES (1, 'Projecteur', 'Projecteur HD avec HDMI');
INSERT INTO equipment (id, name, description) VALUES (2, 'Tableau Blanc', 'Tableau blanc effaçable');
INSERT INTO equipment (id, name, description) VALUES (3, 'Visioconférence', 'Système de visioconférence Zoom');

-- Salles
INSERT INTO room (id, name, capacity) VALUES (1, 'Salle Alpha', 10);
INSERT INTO room (id, name, capacity) VALUES (2, 'Salle Bêta', 20);
INSERT INTO room (id, name, capacity) VALUES (3, 'Salle Gamma', 5);

-- Liens Room ↔ Equipment
INSERT INTO room_equipment (room_id, equipment_id) VALUES (1, 1);
INSERT INTO room_equipment (room_id, equipment_id) VALUES (1, 2);
INSERT INTO room_equipment (room_id, equipment_id) VALUES (2, 1);
INSERT INTO room_equipment (room_id, equipment_id) VALUES (2, 3);
INSERT INTO room_equipment (room_id, equipment_id) VALUES (3, 2);

-- Met à jour la séquence de la table room
SELECT setval('room_id_seq', (SELECT MAX(id) FROM room));

-- Met à jour la séquence de la table equipment
SELECT setval('equipment_id_seq', (SELECT MAX(id) FROM equipment));
