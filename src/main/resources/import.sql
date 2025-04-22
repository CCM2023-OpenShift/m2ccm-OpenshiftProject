-- Création de la table rooms si elle n'existe pas
CREATE TABLE IF NOT EXISTS rooms (
                                     id SERIAL PRIMARY KEY,  -- ID unique de la salle
                                     name VARCHAR(255) NOT NULL,  -- Nom de la salle
                                     capacity INT NOT NULL,  -- Capacité de la salle (nombre de personnes)
                                     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Date de création
                                     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- Date de mise à jour
);

-- Insertion de deux salles dans la table rooms
INSERT INTO room (name, capacity)
VALUES
    ('Salle A', 20),
    ('Salle B', 50);
