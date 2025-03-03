import express from 'express';
import cors from 'cors';
import { createConnection } from 'mysql2/promise';
import { Client } from 'minio';
import { auth } from 'express-oauth2-jwt-bearer';

const app = express();
const port = 3091;

// Middleware
app.use(cors());
app.use(express.json());

// Auth0 middleware
const checkJwt = auth({
  audience: 'your-api-identifier',
  issuerBaseURL: 'your-auth0-domain',
});

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

// Routes
app.get('/api/assets', checkJwt, async (req, res) => {
  const [rows] = await db.execute('SELECT * FROM assets');
  res.json(rows);
});

app.post('/api/assets', checkJwt, async (req, res) => {
  // Handle asset upload
});

app.post('/api/transfers', checkJwt, async (req, res) => {
  // Handle WeTransfer integration
});

app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
