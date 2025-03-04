import express from 'express';
import cors from 'cors';
import { createConnection } from 'mysql2/promise';
import { Client } from 'minio';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

// Initialize Express app
const app = express();
const port = 3091;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL connection
const db = await createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// MinIO client
const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT!,
  port: 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!,
});

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Create an 'uploads' directory in your backend
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({ storage: storage });

// Create 'uploads' directory if it doesn't exist
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// API Endpoints

/**
 * Fetch all assets
 */
app.get('/api/assets', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM assets');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

/**
 * Create a new asset
 */
app.post(
  '/api/assets',
  upload.array('images'),
  async (req, res) => {
    try {
      const { projectName, projectDate, clientId } = req.body;
      const files = req.files as Express.Multer.File[];

      // Validate required fields
      if (!projectName || !files || files.length === 0) {
        return res.status(400).json({ error: 'Project name and at least one image are required' });
      }

      const results = [];

      // Process each uploaded file
      for (const file of files) {
        const assetId = uuidv4();
        let jpgUrl = null;

        // Upload JPG to MinIO
        try {
          await minioClient.fPutObject('jewelrydam', `assets/${assetId}.jpg`, file.path, {
            'Content-Type': 'image/jpeg',
          });
          jpgUrl = `http://localhost:9000/jewelrydam/assets/${assetId}.jpg`;
        } catch (minioError) {
          console.error('Error uploading JPG to MinIO:', minioError);
          return res.status(500).json({ error: 'Failed to upload image to MinIO' });
        }

        // Insert asset metadata into the database
        const query = `
          INSERT INTO assets (id, name, description, tags, jpg_url, project_name, project_date, client_name)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await db.execute(query, [
          assetId,
          file.originalname,
          '',
          '',
          jpgUrl,
          projectName,
          new Date(projectDate),
          clientId
        ]);

        // Clean up uploaded file
        fs.unlinkSync(file.path);

        results.push({
          assetId,
          name: file.originalname,
          jpgUrl,
          projectName,
          projectDate,
          clientName: clientId
        });
      }

      res.status(201).json({ message: 'Assets created successfully', assets: results });
    } catch (error) {
      console.error('Error creating assets:', error);
      res.status(500).json({ error: 'Failed to create assets' });
    }
  }
);

/**
 * Fetch recent assets
 */
app.get('/api/assets/recent', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM assets ORDER BY created_at DESC LIMIT 10');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching recent assets:', error);
    res.status(500).json({ error: 'Failed to fetch recent assets' });
  }
});

/**
 * Fetch all projects with their latest images
 */
app.get('/api/projects', async (req, res) => {
  try {
    const query = `
      SELECT 
        a1.project_name,
        a1.jpg_url as latestImage,
        GROUP_CONCAT(DISTINCT DATE(a2.created_at)) as uploadDates
      FROM assets a1
      INNER JOIN (
        SELECT project_name, MAX(created_at) as max_created_at
        FROM assets
        GROUP BY project_name
      ) latest ON a1.project_name = latest.project_name 
        AND a1.created_at = latest.max_created_at
      LEFT JOIN assets a2 ON a1.project_name = a2.project_name
      GROUP BY a1.project_name, a1.jpg_url
      ORDER BY a1.created_at DESC
    `;
    
    const [rows] = await db.execute(query);
    const projects = (rows as any[]).map(row => ({
      projectName: row.project_name,
      latestImage: row.latestImage,
      uploadDates: row.uploadDates ? row.uploadDates.split(',') : []
    }));
    
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

/**
 * Fetch assets by project name
 */
app.get('/api/projects/:projectName/assets', async (req, res) => {
  try {
    const { projectName } = req.params;
    const query = `
      SELECT * FROM assets 
      WHERE project_name = ? 
      ORDER BY created_at DESC
    `;
    
    const [rows] = await db.execute(query, [projectName]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching project assets:', error);
    res.status(500).json({ error: 'Failed to fetch project assets' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});