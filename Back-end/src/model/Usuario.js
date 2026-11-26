import { DataTypes } from "sequelize";
import conn from "../config/conn.js";

const Usuario = conn.define("Usuario", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  nome: { type: DataTypes.STRING(120), allowNull: false },
  email: { type: DataTypes.STRING(254), allowNull: false, unique: true },
  senha_hash: { type: DataTypes.STRING(255), allowNull: false },
}, {
  tableName: "usuarios",
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default Usuario;
