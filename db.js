const mysql = require('mysql2/promise');
const mongoose = require('mongoose');
require('dotenv').config();

const connectMySQL = async () => {
  return await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  });
};

const connectMongoDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Conectado a:", mongoose.connection.name);
  console.log("📍 Host:", mongoose.connection.host);
};

module.exports = { connectMySQL, connectMongoDB };