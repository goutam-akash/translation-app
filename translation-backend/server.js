const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors');


const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "translations_db",
  password: "newsecurepassword",
  port:5432 ,
});


// Route for handling POST requests
app.post('/api/translations', async (req, res) => {
  const { original_message, translated_message, language, model } = req.body;
  if (!original_message || !translated_message || !language || !model) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    const result = await pool.query(
      'INSERT INTO translations (original_message, translated_message, language, model) VALUES ($1, $2, $3, $4) RETURNING *',
      [original_message, translated_message, language, model]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Database insertion error:', error);
    res.status(500).json({ error: 'Database insertion error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
