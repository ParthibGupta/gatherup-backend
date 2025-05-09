const { DataSource } = require("typeorm");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined in the environment variables.");
}

// Parse the DATABASE_URL
const { URL } = require("url");
console.log("DATABASE_URL:", databaseUrl);

const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  synchronize: true,
  logging: true,
  entities: [path.join(__dirname, "../models/*.js")],
});

module.exports = AppDataSource;