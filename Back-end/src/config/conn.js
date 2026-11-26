import dotenv from "dotenv";
import { readFileSync } from "node:fs";
import { Sequelize } from "sequelize";

dotenv.config({ quiet: true });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("Defina DATABASE_URL no arquivo .env ou no ambiente.");
}

let url;
try {
  url = new URL(databaseUrl);
} catch {
  throw new Error("DATABASE_URL deve ser uma URL PostgreSQL válida.");
}
if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname || !url.username || url.pathname.length < 2) {
  throw new Error("DATABASE_URL deve incluir o host, o usuário e o nome do banco PostgreSQL.");
}

const ssl = process.env.DB_SSL === "false" ? false : {
  rejectUnauthorized: true,
  ...(process.env.DB_SSL_CA_PATH && { ca: readFileSync(process.env.DB_SSL_CA_PATH, "utf8") }),
};

export const schema = "portfolio_escolar";

const conn = new Sequelize(
  decodeURIComponent(url.pathname.slice(1)),
  decodeURIComponent(url.username),
  decodeURIComponent(url.password),
  {
    host: url.hostname.replace(/^\[(.*)\]$/, "$1"),
    port: Number(url.port || 5432),
    dialect: "postgres",
    dialectOptions: { ssl },
    define: { schema },
    logging: false,
  },
);

export default conn;
