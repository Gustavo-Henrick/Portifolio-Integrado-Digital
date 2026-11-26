import { DataTypes } from "sequelize";
import conn from "../config/conn.js";

const Materia = conn.define("Materia", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  nome: { type: DataTypes.STRING(120), allowNull: false },
  conteudo_anual: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
  instituto: { type: DataTypes.ENUM("SESI", "SENAI"), allowNull: false },
}, {
  tableName: "materias",
  underscored: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default Materia;
