-- Create the projects table first
CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the clients table
CREATE TABLE IF NOT EXISTS clients (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create or update the assets table
CREATE TABLE IF NOT EXISTS assets (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  tags TEXT,
  project_id VARCHAR(36),
  project_name VARCHAR(255),
  project_date DATE,
  client_name VARCHAR(255),
  jpg_url VARCHAR(255),
  tiff_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Create the upload_logs table
CREATE TABLE IF NOT EXISTS upload_logs (
  id VARCHAR(36) PRIMARY KEY,
  message TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  asset_id VARCHAR(36),
  status VARCHAR(50)
);

-- Insert some default data
INSERT IGNORE INTO projects (id, name, description) VALUES 
  (UUID(), 'Default Project', 'Default project for unassigned assets');

INSERT IGNORE INTO clients (id, name) VALUES 
  (UUID(), 'Default Client'); 