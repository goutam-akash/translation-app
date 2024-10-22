// index.js
const express = require("express");
const { Pool } = require("pg");
const { Parser } = require("json2csv");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // For parsing application/json

// PostgreSQL connection pool
const pool = new Pool({
    user: "my_postgres_mda8_user",
    host: "dpg-cs30bn9u0jms7391lq5g-a.oregon-postgres.render.com",
    database: "my_postgres_mda8",
    password: "viFQtpBhnVhEwyB2XZh8qXtNPNrrauTj",
    port: 5432,
    idleTimeoutMillis: 30000,  // close idle clients after 30 seconds
    connectionTimeoutMillis: 5000,  // wait for a maximum of 5 seconds for a connection
    ssl: {
      rejectUnauthorized: false // Allows self-signed certificates
    },
  });

// Route to export data to CSV
app.get("/api/export", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM translations"); // Modify query as needed
    const jsonData = result.rows;

    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(jsonData);

    res.header("Content-Type", "text/csv");
    res.attachment("output_file.csv");
    res.send(csv);
  } catch (error) {
    console.error("Error exporting to CSV:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
