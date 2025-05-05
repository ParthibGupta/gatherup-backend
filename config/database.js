const { DataSource } = require("typeorm");
const fs = require("fs");
const path = require("path");
require("dotenv").config(); 

const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST, 
  port: parseInt(process.env.DB_PORT, 10), 
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD, 
  database: process.env.DB_NAME, 
  synchronize: true, 
  ssl: { 
    require: true,
    rejectUnauthorized: true,
    ca: fs.readFileSync(path.join(__dirname, `../${process.env.SSL_CA_PATH}`)).toString(), // Use environment variable for SSL path
  },
  logging: true,
  entities: [path.join(__dirname, "../models/*.js")], // Path to your models
});

module.exports = AppDataSource;