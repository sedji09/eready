require("dotenv").config();
const mysql = require("mysql2/promise");

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || process.env.DB_PASS || "",
  database: process.env.DB_NAME || "eready_db",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Enable SSL if connecting to remote databases (like TiDB Cloud) or if DB_SSL is set
if (process.env.DB_SSL === 'true' || (process.env.DB_HOST && !['localhost', '127.0.0.1'].includes(process.env.DB_HOST))) {
  dbConfig.ssl = {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  };
}

const pool = mysql.createPool(dbConfig);

pool.getConnection()
  .then(conn => {
    console.log("Database connected successfully");
    conn.release();
  })
  .catch(err => {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  });

const query = async (sql, params) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

module.exports = { pool, query };
