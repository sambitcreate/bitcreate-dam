import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { Client } from 'minio';
import fs from 'fs';
import path from 'path';

const app = express();
const port = 3091;

// Middleware
app.use(cors());
app.use(express.json());

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost', // Changed from 'db' to 'localhost'
  user: process.env.DB_USER || 'damuser',
  password: process.env.DB_PASSWORD || 'dampassword',
  database: process.env.DB_NAME || 'jewelrydam',
  port: parseInt(process.env.DB_PORT || '3306'),
};

const pool = mysql.createPool(dbConfig);

// Function to test the database connection with retries
async function testConnection(retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempting database connection (attempt ${i + 1}/${retries})...`);
      console.log('Using database config:', {
        host: dbConfig.host,
        user: dbConfig.user,
        database: dbConfig.database,
        port: dbConfig.port
      });

      const connection = await pool.getConnection();
      console.log('Database connected successfully');

      // Create upload_logs table if it doesn't exist
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS upload_logs (
          id VARCHAR(36) PRIMARY KEY,
          message TEXT NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          asset_id VARCHAR(36),
          status VARCHAR(50)
        )
      `);
      console.log('Upload logs table created or verified');

      // Update the assets table schema
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS assets (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          project_name VARCHAR(255),
          project_date DATE,
          client_name VARCHAR(255),
          tags TEXT,
          jpg_url VARCHAR(255),
          tiff_url VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Assets table created or verified');

      // Create clients table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS clients (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Clients table created or verified');

      // Create projects table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS projects (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Projects table created or verified');

      connection.release(); // Release the connection back to the pool
      return; // Exit the function if the connection is successful
    } catch (error) {
      console.error('Error connecting to the database:', error);
      console.error('Connection details:', {
        host: dbConfig.host,
        user: dbConfig.user,
        database: dbConfig.database,
        port: dbConfig.port
      });
      
      if (i < retries - 1) {
        console.log(`Retrying connection in 2 seconds... (${retries - i - 1} attempts remaining)`);
        await new Promise(res => setTimeout(res, 2000)); // Wait 2 seconds before retrying
      } else {
        console.error('All connection attempts failed');
        throw error; // Rethrow the error if all retries fail
      }
    }
  }
}

// Multer setup for file uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadsDir = join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({ storage: storage });

// MinIO client
const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'miniouser',
  secretKey: process.env.MINIO_SECRET_KEY || 'miniopassword',
});

// Initialize MinIO bucket
async function initializeMinio() {
  try {
    const bucketName = 'jewelrydam';
    const bucketExists = await minioClient.bucketExists(bucketName);
    if (!bucketExists) {
      await minioClient.makeBucket(bucketName);
      console.log('Created MinIO bucket:', bucketName);
    } else {
      console.log('MinIO bucket already exists:', bucketName);
    }
  } catch (error) {
    console.error('Error initializing MinIO:', error);
    throw error;
  }
}

// API Endpoints
app.get('/api/assets', async (req, res) => {
  try {
    // First check if the table exists
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'assets'
    `, [dbConfig.database]);

    if (!Array.isArray(tables) || tables.length === 0) {
      console.error('Assets table does not exist');
      return res.status(500).json({ 
        error: 'Database not properly initialized',
        details: 'Assets table is missing'
      });
    }

    // Use a simpler query without joins for now
    const [rows] = await pool.execute('SELECT * FROM assets ORDER BY created_at DESC');
    
    if (!Array.isArray(rows)) {
      console.error('Unexpected response format:', rows);
      return res.status(500).json({ 
        error: 'Unexpected database response',
        details: 'Query did not return an array'
      });
    }

    res.json(rows);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ 
      error: 'Failed to fetch assets',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/uploads/log', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM upload_logs ORDER BY timestamp DESC LIMIT 50');
    res.json({ logs: rows });
  } catch (error) {
    console.error('Error fetching upload logs:', error);
    res.status(500).json({ error: 'Failed to fetch upload logs' });
  }
});

interface UploadResult {
  id: string;
  name: string;
  url: string;
}

app.post('/api/assets', upload.array('images'), async (req, res) => {
  try {
    const { projectName, projectDate, clientName } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'At least one image file is required' });
    }

    // Get project ID if project name is provided
    let projectId: string | null = null;
    if (projectName) {
      const [projects] = await pool.execute<any[]>(
        'SELECT id FROM projects WHERE name = ?',
        [projectName]
      );

      if (Array.isArray(projects) && projects.length > 0) {
        projectId = projects[0].id;
      } else {
        // Create a new project if it doesn't exist
        projectId = uuidv4();
        await pool.execute(
          'INSERT INTO projects (id, name) VALUES (?, ?)',
          [projectId, projectName]
        );
      }
    }

    const results: UploadResult[] = [];
    for (const file of files) {
      const assetId = uuidv4();
      let jpgUrl: string | null = null;

      // Log the start of the upload
      const startLogId = uuidv4();
      await pool.execute(
        'INSERT INTO upload_logs (id, message, asset_id, status) VALUES (?, ?, ?, ?)',
        [startLogId, `Starting upload for file: ${file.originalname}`, assetId, 'started']
      );

      try {
        // Upload JPG to MinIO
        await minioClient.fPutObject('jewelrydam', `assets/${assetId}.jpg`, file.path, {
          'Content-Type': file.mimetype,
        });
        jpgUrl = `http://localhost:9000/jewelrydam/assets/${assetId}.jpg`;
        
        // Log successful upload
        await pool.execute(
          'INSERT INTO upload_logs (id, message, asset_id, status) VALUES (?, ?, ?, ?)',
          [uuidv4(), `Successfully uploaded file: ${file.originalname}`, assetId, 'completed']
        );

        // Insert asset metadata into the database
        const query = `
          INSERT INTO assets (
            id, 
            name, 
            project_id,
            project_name,
            project_date,
            client_name,
            jpg_url
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        await pool.execute(query, [
          assetId,
          file.originalname,
          projectId,
          projectName,
          projectDate,
          clientName,
          jpgUrl
        ]);

        results.push({
          id: assetId,
          name: file.originalname,
          url: jpgUrl
        });

        // Clean up uploaded file
        fs.unlinkSync(file.path);
      } catch (error: any) {
        console.error('Error processing file:', error);
        
        // Log the error
        await pool.execute(
          'INSERT INTO upload_logs (id, message, asset_id, status) VALUES (?, ?, ?, ?)',
          [uuidv4(), `Error processing file ${file.originalname}: ${error.message}`, assetId, 'error']
        );
        
        throw error;
      }
    }

    res.status(201).json({ message: 'Assets created successfully', assets: results });
  } catch (error: any) {
    console.error('Error creating assets:', error);
    res.status(500).json({ error: 'Failed to create assets' });
  }
});

// Add endpoint to get clients
app.get('/api/clients', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM clients ORDER BY name');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Add endpoint to create a new client
app.post('/api/clients', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Client name is required' });
    }

    const clientId = uuidv4();
    await pool.execute(
      'INSERT INTO clients (id, name) VALUES (?, ?)',
      [clientId, name]
    );

    res.status(201).json({ id: clientId, name });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// Add search endpoint
app.get('/api/assets/search', async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchTerm = `%${query}%`;
    const [rows] = await pool.execute(
      `SELECT * FROM assets 
       WHERE name LIKE ? 
       OR description LIKE ? 
       OR project_name LIKE ? 
       OR client_name LIKE ?
       ORDER BY created_at DESC`,
      [searchTerm, searchTerm, searchTerm, searchTerm]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error searching assets:', error);
    res.status(500).json({ error: 'Failed to search assets' });
  }
});

app.get('/api/assets/recent', async (req, res) => {
  try {
    // First check if the table exists
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'assets'
    `, [dbConfig.database]);

    if (!Array.isArray(tables) || tables.length === 0) {
      console.error('Assets table does not exist');
      return res.status(500).json({ 
        error: 'Database not properly initialized',
        details: 'Assets table is missing'
      });
    }

    // Use a simpler query without joins for now
    const [rows] = await pool.execute('SELECT * FROM assets ORDER BY created_at DESC LIMIT 10');
    
    if (!Array.isArray(rows)) {
      console.error('Unexpected response format:', rows);
      return res.status(500).json({ 
        error: 'Unexpected database response',
        details: 'Query did not return an array'
      });
    }

    res.json(rows);
  } catch (error) {
    console.error('Error fetching recent assets:', error);
    res.status(500).json({ 
      error: 'Failed to fetch recent assets',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add projects endpoints
app.get('/api/projects', async (req, res) => {
  try {
    // First check if the table exists
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'projects'
    `, [dbConfig.database]);

    if (!Array.isArray(tables) || tables.length === 0) {
      console.error('Projects table does not exist');
      return res.status(500).json({ 
        error: 'Database not properly initialized',
        details: 'Projects table is missing'
      });
    }

    // Use a simpler query for now
    const [rows] = await pool.execute('SELECT * FROM projects ORDER BY created_at DESC');
    
    if (!Array.isArray(rows)) {
      console.error('Unexpected response format:', rows);
      return res.status(500).json({ 
        error: 'Unexpected database response',
        details: 'Query did not return an array'
      });
    }

    res.json(rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ 
      error: 'Failed to fetch projects',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    // Check for duplicate project name
    const [existing] = await pool.execute(
      'SELECT id FROM projects WHERE name = ?',
      [name]
    );

    if (Array.isArray(existing) && existing.length > 0) {
      return res.status(400).json({ error: 'A project with this name already exists' });
    }

    const projectId = uuidv4();
    await pool.execute(
      'INSERT INTO projects (id, name, description) VALUES (?, ?, ?)',
      [projectId, name, description || null]
    );

    res.status(201).json({
      id: projectId,
      name,
      description,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ 
      error: 'Failed to create project',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start the application
async function startApp() {
  try {
    console.log('Starting backend application...');
    console.log('Environment variables:', process.env);

    await testConnection(); // Test the database connection
    await initializeMinio(); // Initialize MinIO bucket

    app.listen(port, () => {
      console.log(`Backend running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

// Call the startApp function to initialize the application
startApp();
