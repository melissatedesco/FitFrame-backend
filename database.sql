-- ============================================================
-- FitFrame — schema completo del database
-- ============================================================

-- Tabella utenti
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella refresh token (per invalidare i JWT al logout)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(512) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Catalogo attrezzi
CREATE TABLE IF NOT EXISTS equipment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category ENUM('corpo_libero', 'oggetti_casa', 'pesi', 'elastici') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attrezzi posseduti dall'utente (RF-T2)
CREATE TABLE IF NOT EXISTS user_equipment (
    user_id INT NOT NULL,
    equipment_id INT NOT NULL,
    PRIMARY KEY (user_id, equipment_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
);

-- Catalogo esercizi (RF-E1…E5)
-- angle_rules: JSON con le regole d'angolo per il coach virtuale
-- es. [{"joint":"knee","min":90,"max":180,"phase":"down"}]
CREATE TABLE IF NOT EXISTS exercises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    muscle_group VARCHAR(100) NOT NULL,
    difficulty ENUM('principiante', 'intermedio', 'avanzato') NOT NULL,
    media_url VARCHAR(500),
    angle_rules JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Relazione esercizio ↔ attrezzo (RF-E2, RF-T3)
CREATE TABLE IF NOT EXISTS exercise_equipment (
    exercise_id INT NOT NULL,
    equipment_id INT NOT NULL,
    PRIMARY KEY (exercise_id, equipment_id),
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
);

-- Schede / programmi (RF-S1…S5)
CREATE TABLE IF NOT EXISTS programs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    user_id INT,                          -- NULL = scheda predefinita di sistema
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Esercizi all'interno di una scheda (RF-S3, S4)
CREATE TABLE IF NOT EXISTS program_exercises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    program_id INT NOT NULL,
    exercise_id INT NOT NULL,
    position INT NOT NULL,                -- ordine nella scheda
    sets INT NOT NULL DEFAULT 3,
    reps INT NOT NULL DEFAULT 10,
    rest_seconds INT NOT NULL DEFAULT 60,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

-- Sessioni di allenamento (RF-P1, P2)
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    program_id INT,                       -- NULL se allenamento libero
    notes TEXT,
    started_at DATETIME NOT NULL,
    ended_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL
);

-- Dettaglio esercizi eseguiti in una sessione (RF-P1, P3)
CREATE TABLE IF NOT EXISTS session_exercises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    exercise_id INT NOT NULL,
    sets_done INT NOT NULL DEFAULT 0,
    reps_done INT NOT NULL DEFAULT 0,
    form_score TINYINT UNSIGNED,          -- 0-100, qualità forma rilevata dal coach
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);
