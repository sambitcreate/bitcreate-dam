import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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
