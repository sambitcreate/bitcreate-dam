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
    endPoint: process.env.MINIO_ENDPOINT,
    port: 9000,
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
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
// Create projects table if it doesn't exist
await db.execute(`
  CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log('Projects table created or verified');
// Update the assets table schema
await db.execute(`
  CREATE TABLE IF NOT EXISTS assets (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    project_id VARCHAR(36),
    project_date DATE,
    client_name VARCHAR(255),
    tags TEXT,
    jpg_url VARCHAR(255),
    tiff_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id)
  )
`);
console.log('Assets table created or verified');
// API Endpoints
/**
 * Fetch all assets
 */
app.get('/api/assets', async (req, res) => {
    try {
        const query = `
      SELECT a.*, p.name as project_name 
      FROM assets a 
      LEFT JOIN projects p ON a.project_id = p.id
      ORDER BY a.created_at DESC
    `;
        const [rows] = await db.execute(query);
        res.json(rows);
    }
    catch (error) {
        console.error('Error fetching assets:', error);
        res.status(500).json({ error: 'Failed to fetch assets' });
    }
});
/**
 * Create a new asset
 */
app.post('/api/assets', upload.array('images'), async (req, res) => {
    try {
        const { projectId, projectDate, clientId } = req.body;
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'At least one image file is required' });
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
            }
            catch (minioError) {
                console.error('Error uploading JPG to MinIO:', minioError);
                return res.status(500).json({ error: 'Failed to upload image to MinIO' });
            }
            // Insert asset metadata into the database
            const query = `
        INSERT INTO assets (
          id, 
          name, 
          project_id,
          project_date,
          client_name,
          jpg_url
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;
            await db.execute(query, [
                assetId,
                file.originalname,
                projectId || null,
                projectDate ? new Date(projectDate) : null,
                clientId || null,
                jpgUrl
            ]);
            // Clean up uploaded file
            fs.unlinkSync(file.path);
            results.push({
                id: assetId,
                name: file.originalname,
                jpg_url: jpgUrl,
                project_id: projectId,
                project_date: projectDate,
                client_name: clientId
            });
        }
        res.status(201).json({ message: 'Assets created successfully', assets: results });
    }
    catch (error) {
        console.error('Error creating assets:', error);
        res.status(500).json({ error: 'Failed to create assets' });
    }
});
/**
 * Fetch recent assets
 */
app.get('/api/assets/recent', async (req, res) => {
    try {
        const query = `
      SELECT a.*, p.name as project_name 
      FROM assets a 
      LEFT JOIN projects p ON a.project_id = p.id
      ORDER BY a.created_at DESC 
      LIMIT 10
    `;
        const [rows] = await db.execute(query);
        res.json(rows);
    }
    catch (error) {
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
        p.id,
        p.name,
        p.created_at,
        GROUP_CONCAT(DISTINCT a.project_date) as dates,
        (
          SELECT jpg_url 
          FROM assets 
          WHERE project_id = p.id 
          ORDER BY created_at DESC 
          LIMIT 1
        ) as latest_image
      FROM projects p
      LEFT JOIN assets a ON p.id = a.project_id
      GROUP BY p.id, p.name, p.created_at
      ORDER BY p.created_at DESC
    `;
        const [rows] = await db.execute(query);
        const projects = rows.map(row => ({
            id: row.id,
            name: row.name,
            latestImage: row.latest_image,
            dates: row.dates ? [...new Set(row.dates.split(','))] : []
        }));
        res.json(projects);
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('Error fetching project assets:', error);
        res.status(500).json({ error: 'Failed to fetch project assets' });
    }
});
// Add endpoint to create a new project
app.post('/api/projects', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Project name is required' });
        }
        // Check if project already exists
        const [existing] = await db.execute('SELECT id FROM projects WHERE name = ?', [name]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Project with this name already exists' });
        }
        const projectId = uuidv4();
        await db.execute('INSERT INTO projects (id, name) VALUES (?, ?)', [projectId, name]);
        res.status(201).json({ id: projectId, name });
    }
    catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});
// Add endpoint to get project details including all dates and images
app.get('/api/projects/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        // Get project details
        const [projectRows] = await db.execute('SELECT * FROM projects WHERE id = ?', [projectId]);
        if (projectRows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        // Get all dates and their images for this project
        const [assetRows] = await db.execute(`SELECT project_date, GROUP_CONCAT(
        JSON_OBJECT(
          'id', id,
          'name', name,
          'jpg_url', jpg_url,
          'created_at', created_at
        )
      ) as images
      FROM assets
      WHERE project_id = ?
      GROUP BY project_date
      ORDER BY project_date DESC`, [projectId]);
        const dates = assetRows.map(row => ({
            date: row.project_date,
            images: JSON.parse(`[${row.images}]`)
        }));
        res.json({
            ...projectRows[0],
            dates
        });
    }
    catch (error) {
        console.error('Error fetching project details:', error);
        res.status(500).json({ error: 'Failed to fetch project details' });
    }
});
// Start the server
app.listen(port, () => {
    console.log(`Backend running on port ${port}`);
});
