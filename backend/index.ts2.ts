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

const app = express();
const port = 3091;

try {
  console.log('Starting backend application...');

  // Middleware
  console.log('Setting up middleware...');
  app.use(cors());
  app.use(express.json());
  console.log('Middleware setup complete.');

  // MySQL connection
  console.log('Connecting to MySQL database...');
  const db = await createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  console.log('MySQL database connection established.');

  // MinIO client
  console.log('Connecting to MinIO server...');
  const minioClient = new Client({
    endPoint: process.env.MINIO_ENDPOINT!,
    port: 9000,
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY!,
    secretKey: process.env.MINIO_SECRET_KEY!,
  });
  console.log('MinIO server connection established.');

  // Multer setup for file uploads
  console.log('Setting up Multer...');
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
  console.log('Multer setup complete.');

  // Create 'uploads' directory if it doesn't exist
  console.log('Creating uploads directory if it does not exist...');
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const uploadsDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }
  console.log('Uploads directory check complete.');

  // API Endpoints
  console.log('Setting up API endpoints...');
  app.get('/api/assets', async (req, res) => {
    try {
      const [rows] = await db.execute('SELECT * FROM assets');
      res.json(rows);
    } catch (error) {
      console.error('Error fetching assets:', error);
      res.status(500).json({ error: 'Failed to fetch assets' });
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
      let jpgUrl = null;
      let tiffUrl = null;

      // Upload JPG to MinIO
      try {
        await minioClient.fPutObject('jewelrydam', `assets/${assetId}.jpg`, jpgFile.path, {
          'Content-Type': 'image/jpeg',
        });
        jpgUrl = `http://localhost:9000/jewelrydam/assets/${assetId}.jpg`;
      } catch (minioError) {
        console.error('Error uploading JPG to MinIO:', minioError);
        return res.status(500).json({ error: 'Failed to upload JPG to MinIO' });
      }

      // Upload TIFF to MinIO (if provided)
      if (tiffFile) {
        try {
          await minioClient.fPutObject('jewelrydam', `assets/${assetId}.tiff`, tiffFile.path, {
            'Content-Type': 'image/tiff',
          });
          tiffUrl = `http://localhost:9000/jewelrydam/assets/${assetId}.tiff`;
        } catch (minioError) {
          console.error('Error uploading TIFF to MinIO:', minioError);
          return res.status(500).json({ error: 'Failed to upload TIFF to MinIO' });
        }
      }

      // Insert asset metadata into the database
      const query = `
        INSERT INTO assets (id, name, description, tags, jpg_url, tiff_url)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      await db.execute(query, [assetId, name, description, tags ? tags : null, jpgUrl, tiffUrl]);

      // Clean up uploaded files
      fs.unlinkSync(jpgFile.path);
      if (tiffFile) {
        fs.unlinkSync(tiffFile.path);
      }

      res.status(201).json({ message: 'Asset created successfully', assetId });
    } catch (error) {
      console.error('Error creating asset:', error);
      res.status(500).json({ error: 'Failed to create asset' });
    }
  });
  console.log('API endpoints setup complete.');

  console.log('Starting the server...');
  app.listen(port, () => {
    console.log(`Backend running on port ${port}`);
  });
  console.log('Server started successfully.');
} catch (error) {
  console.error('Unhandled exception:', error);
}
