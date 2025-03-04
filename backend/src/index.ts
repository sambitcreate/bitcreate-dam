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

// Create or update the projects table
await db.execute(`
  CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log('Projects table created or verified');

// Ensure description column exists in projects table
try {
  // Check if description column exists
  const [projectColumns] = await db.execute(`
    SHOW COLUMNS FROM projects LIKE 'description'
  `);
  
  if ((projectColumns as any[]).length === 0) {
    // Add description column if it doesn't exist
    await db.execute(`
      ALTER TABLE projects 
      ADD COLUMN description TEXT
    `);
    console.log('Added description column to projects table');
  } else {
    console.log('description column already exists in projects table');
  }
} catch (error) {
  console.error('Error ensuring description column exists in projects table:', error);
  // Continue anyway
}

// Create or update the assets table
await db.execute(`
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
  )
`);
console.log('Assets table created or verified');

// Ensure project_id column exists in assets table
try {
  // Check if project_id column exists
  const [columns] = await db.execute(`
    SHOW COLUMNS FROM assets LIKE 'project_id'
  `);
  
  if ((columns as any[]).length === 0) {
    // Add project_id column if it doesn't exist
    await db.execute(`
      ALTER TABLE assets 
      ADD COLUMN project_id VARCHAR(36),
      ADD FOREIGN KEY (project_id) REFERENCES projects(id)
    `);
    console.log('Added project_id column to assets table');
  } else {
    console.log('project_id column already exists in assets table');
  }
} catch (error) {
  console.error('Error ensuring project_id column exists:', error);
  // Continue anyway, as the column might already exist
}

// API Endpoints

/**
 * Fetch all assets
 */
app.get('/api/assets', async (req, res) => {
  try {
    // Simplified query that doesn't rely on project_id
    const query = `
      SELECT * FROM assets
      ORDER BY created_at DESC
    `;
    const [rows] = await db.execute(query);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

/**
 * Create a new asset
 */
app.post('/api/assets', upload.array('images'), async (req, res) => {
  try {
    const { projectId, projectName, projectDate, clientName } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'At least one image file is required' });
    }

    let finalProjectId = projectId;

    // If projectName is provided but not projectId, try to find or create the project
    if (projectName && !projectId) {
      try {
        // Check if project exists
        const [existingProjects] = await db.execute(
          'SELECT id FROM projects WHERE name = ?',
          [projectName]
        );
        
        if ((existingProjects as any[]).length > 0) {
          finalProjectId = (existingProjects as any[])[0].id;
        } else {
          // Create new project
          const newProjectId = uuidv4();
          await db.execute(
            'INSERT INTO projects (id, name) VALUES (?, ?)',
            [newProjectId, projectName]
          );
          finalProjectId = newProjectId;
        }
      } catch (error) {
        console.error('Error handling project:', error);
        // Continue without project association if there's an error
      }
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
        INSERT INTO assets (
          id, 
          name, 
          project_id,
          project_name,
          project_date,
          client_name,
          jpg_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      await db.execute(query, [
        assetId,
        file.originalname,
        finalProjectId || null,
        projectName || null,
        projectDate ? new Date(projectDate) : null,
        clientName || null,
        jpgUrl
      ]);

      // Clean up uploaded file
      fs.unlinkSync(file.path);

      results.push({
        id: assetId,
        name: file.originalname,
        jpg_url: jpgUrl,
        project_id: finalProjectId,
        project_date: projectDate,
        client_name: clientName
      });
    }

    res.status(201).json({ message: 'Assets created successfully', assets: results });
  } catch (error) {
    console.error('Error creating assets:', error);
    res.status(500).json({ error: 'Failed to create assets' });
  }
});

/**
 * Fetch recent assets
 */
app.get('/api/assets/recent', async (req, res) => {
  try {
    // Simplified query that doesn't rely on project_id
    const query = `
      SELECT * FROM assets
      ORDER BY created_at DESC
      LIMIT 10
    `;
    const [rows] = await db.execute(query);
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
    // Simplified query that doesn't rely on project_id
    const query = `
      SELECT 
        p.id,
        p.name,
        p.created_at
      FROM projects p
      ORDER BY p.created_at DESC
    `;
    
    const [rows] = await db.execute(query);
    const projects = (rows as any[]).map(row => ({
      id: row.id,
      name: row.name,
      latestImage: null, // We'll handle this on the frontend for now
      dates: []
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

/**
 * Fetch assets by project ID
 */
app.get('/api/projects/:projectId/assets', async (req, res) => {
  try {
    const { projectId } = req.params;
    const query = `
      SELECT * FROM assets 
      WHERE project_id = ? 
      ORDER BY created_at DESC
    `;
    
    const [rows] = await db.execute(query, [projectId]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching project assets:', error);
    res.status(500).json({ error: 'Failed to fetch project assets' });
  }
});

/**
 * Create a new project
 */
app.post('/api/projects', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }
    
    // Check if project with this name already exists
    const [existingProjects] = await db.execute(
      'SELECT id FROM projects WHERE name = ?',
      [name]
    );
    
    if ((existingProjects as any[]).length > 0) {
      return res.status(400).json({ error: 'A project with this name already exists' });
    }
    
    const projectId = uuidv4();
    await db.execute(
      'INSERT INTO projects (id, name, description) VALUES (?, ?, ?)',
      [projectId, name, description || null]
    );
    
    res.status(201).json({ 
      id: projectId,
      name,
      description,
      created_at: new Date()
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Add endpoint to get project details including all dates and images
app.get('/api/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Get project details
    const [projectRows] = await db.execute(
      'SELECT * FROM projects WHERE id = ?',
      [projectId]
    );
    
    if ((projectRows as any[]).length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Get all dates and their images for this project
    const [assetRows] = await db.execute(
      `SELECT project_date, GROUP_CONCAT(
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
      ORDER BY project_date DESC`,
      [projectId]
    );
    
    const dates = (assetRows as any[]).map(row => ({
      date: row.project_date,
      images: JSON.parse(`[${row.images}]`)
    }));
    
    res.json({
      ...(projectRows as any[])[0],
      dates
    });
  } catch (error) {
    console.error('Error fetching project details:', error);
    res.status(500).json({ error: 'Failed to fetch project details' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});