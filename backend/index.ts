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
  host: process.env.DB_HOST || 'db', // Use the service name as hostname
  user: process.env.DB_USER || 'damuser',
  password: process.env.DB_PASSWORD || 'dampassword',
  database: process.env.DB_NAME || 'jewelrydam',
};

const pool = mysql.createPool(dbConfig);

// Function to test the database connection with retries
async function testConnection(retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      const connection = await pool.getConnection();
      console.log('Database connected successfully');

      // Create upload_logs table if it doesn't exist
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS upload_logs (
          id VARCHAR(36) PRIMARY KEY,
          message TEXT NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          asset_id VARCHAR(36),
          status VARCHAR(50),
          FOREIGN KEY (asset_id) REFERENCES assets(id)
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

      connection.release(); // Release the connection back to the pool
      return; // Exit the function if the connection is successful
    } catch (error) {
      console.error('Error connecting to the database:', error);
      if (i < retries - 1) {
        console.log('Retrying connection...');
        await new Promise(res => setTimeout(res, 2000)); // Wait 2 seconds before retrying
      } else {
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
  endPoint: process.env.MINIO_ENDPOINT || 'minio',
  port: 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

// API Endpoints
app.get('/api/assets', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM assets');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: 'Failed to fetch assets' });
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
    const { projectName, projectDate, clientId } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'At least one image file is required' });
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
          INSERT INTO assets (id, name, project_name, project_date, client_name, jpg_url)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        await pool.execute(query, [
          assetId,
          file.originalname,
          projectName,
          projectDate,
          clientId,
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

// Start the application
async function startApp() {
  try {
    console.log('Starting backend application...');
    console.log('Environment variables:', process.env);

    await testConnection(); // Test the database connection

    app.listen(port, () => {
      console.log(`Backend running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to connect to the database. Exiting...', error);
    process.exit(1); // Exit the process if the connection fails
  }
}

// Call the startApp function to initialize the application
startApp();
