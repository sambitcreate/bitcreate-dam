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
// API Endpoints
/**
 * Fetch all assets
 */
app.get('/api/assets', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM assets');
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
app.post('/api/assets', upload.fields([
    { name: 'jpg', maxCount: 1 },
    { name: 'tiff', maxCount: 1 },
]), async (req, res) => {
    try {
        const { name, description, tags } = req.body;
        const jpgFile = req.files && req.files['jpg'] ? req.files['jpg'][0] : null;
        const tiffFile = req.files && req.files['tiff'] ? req.files['tiff'][0] : null;
        // Validate required fields
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
        }
        catch (minioError) {
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
            }
            catch (minioError) {
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
    }
    catch (error) {
        console.error('Error creating asset:', error);
        res.status(500).json({ error: 'Failed to create asset' });
    }
});
// Start the server
app.listen(port, () => {
    console.log(`Backend running on port ${port}`);
});
