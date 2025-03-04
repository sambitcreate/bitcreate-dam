-- Create or update the assets table
CREATE TABLE IF NOT EXISTS assets (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  tags TEXT,
  project_name VARCHAR(255),
  project_date DATE,
  client_name VARCHAR(255),
  jpg_url VARCHAR(255),
  tiff_url VARCHAR(255),
  file_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the upload_log table
CREATE TABLE IF NOT EXISTS upload_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asset_id VARCHAR(36),
  message TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_id) REFERENCES assets(id)
); 