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

app.post('/api/assets', upload.fields([{ name: 'jpg', maxCount: 1 }, { name: 'tiff', maxCount: 1 }]), async (req, res) => {
  try {
    const { name, description, tags } = req.body;
    const jpgFile = req.files && (req.files as any)['jpg'] ? (req.files as any)['jpg'][0] : null;
    const tiffFile = req.files && (req.files as any)['tiff'] ? (req.files as any)['tiff'][0] : null;

    if (!name || !jpgFile) {
      return res.status(400).json({ error: 'Name and JPG file are required' });
    }

    const assetId = uuidv4();
    let jpgUrl: string | null = null;
    let tiffUrl: string | null = null;

    // Log the start of the upload
    const startLogId = uuidv4();
    await pool.execute(
      'INSERT INTO upload_logs (id, message, asset_id, status) VALUES (?, ?, ?, ?)',
      [startLogId, `Starting upload for asset: ${name}`, assetId, 'started']
    );

    // Upload JPG to MinIO
    try {
      await minioClient.fPutObject('jewelrydam', `assets/${assetId}.jpg`, jpgFile.path, {
        'Content-Type': 'image/jpeg',
      });
      jpgUrl = `http://localhost:9000/jewelrydam/assets/${assetId}.jpg`;
      
      // Log successful JPG upload
      await pool.execute(
        'INSERT INTO upload_logs (id, message, asset_id, status) VALUES (?, ?, ?, ?)',
        [uuidv4(), `Successfully uploaded JPG for asset: ${name}`, assetId, 'jpg_uploaded']
      );
    } catch (minioError: any) {
      console.error('Error uploading JPG to MinIO:', minioError);
      
      // Log JPG upload failure
      await pool.execute(
        'INSERT INTO upload_logs (id, message, asset_id, status) VALUES (?, ?, ?, ?)',
        [uuidv4(), `Failed to upload JPG for asset: ${name} - ${minioError.message}`, assetId, 'jpg_failed']
      );
      
      return res.status(500).json({ error: 'Failed to upload JPG to MinIO' });
    }

    // Upload TIFF to MinIO (if provided)
    if (tiffFile) {
      try {
        await minioClient.fPutObject('jewelrydam', `assets/${assetId}.tiff`, tiffFile.path, {
          'Content-Type': 'image/tiff',
        });
        tiffUrl = `http://localhost:9000/jewelrydam/assets/${assetId}.tiff`;
        
        // Log successful TIFF upload
        await pool.execute(
          'INSERT INTO upload_logs (id, message, asset_id, status) VALUES (?, ?, ?, ?)',
          [uuidv4(), `Successfully uploaded TIFF for asset: ${name}`, assetId, 'tiff_uploaded']
        );
      } catch (minioError: any) {
        console.error('Error uploading TIFF to MinIO:', minioError);
        
        // Log TIFF upload failure
        await pool.execute(
          'INSERT INTO upload_logs (id, message, asset_id, status) VALUES (?, ?, ?, ?)',
          [uuidv4(), `Failed to upload TIFF for asset: ${name} - ${minioError.message}`, assetId, 'tiff_failed']
        );
        
        return res.status(500).json({ error: 'Failed to upload TIFF to MinIO' });
      }
    }

    // Insert asset metadata into the database
    const query = `
      INSERT INTO assets (id, name, description, tags, jpg_url, tiff_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await pool.execute(query, [assetId, name, description, tags ? tags : null, jpgUrl, tiffUrl]);

    // Log successful asset creation
    await pool.execute(
      'INSERT INTO upload_logs (id, message, asset_id, status) VALUES (?, ?, ?, ?)',
      [uuidv4(), `Asset created successfully: ${name}`, assetId, 'completed']
    );

    // Clean up uploaded files
    fs.unlinkSync(jpgFile.path);
    if (tiffFile) {
      fs.unlinkSync(tiffFile.path);
    }

    res.status(201).json({ message: 'Asset created successfully', assetId });
  } catch (error: any) {
    console.error('Error creating asset:', error);
    
    // Log the error
    await pool.execute(
      'INSERT INTO upload_logs (id, message, status) VALUES (?, ?, ?)',
      [uuidv4(), `Error creating asset: ${error.message}`, 'error']
    );
    
    res.status(500).json({ error: 'Failed to create asset' });
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
