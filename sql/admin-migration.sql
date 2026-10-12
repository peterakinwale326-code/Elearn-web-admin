-- Run in phpMyAdmin (SQL tab). Skip any ALTER line if that column already exists.
ALTER TABLE users ADD COLUMN role   ENUM('student','admin')    NOT NULL DEFAULT 'student';
ALTER TABLE users ADD COLUMN status ENUM('active','suspended') NOT NULL DEFAULT 'active';

CREATE TABLE IF NOT EXISTS feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  category VARCHAR(50) NOT NULL,
  rating TINYINT NOT NULL,
  message TEXT NOT NULL,
  status ENUM('pending','reviewed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS content_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  type ENUM('PDF','Video','Quiz') NOT NULL,
  file_path VARCHAR(300) NOT NULL,
  status ENUM('published','draft') NOT NULL DEFAULT 'published',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
